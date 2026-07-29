// app/api/cloth/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateRouteAuth } from '@/lib/auth-util';
import { supabaseAdmin } from '@/lib/supabase'; // service‑role client

// ---------------------------------------------------------------------------
// Helper: upload a file to Supabase Storage and return its public URL
// ---------------------------------------------------------------------------
async function uploadImageToSupabase(file: File, bucket: string): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `cloth-images/${fileName}`; // organised inside a folder

  const { error } = await supabaseAdmin.storage.from(bucket).upload(filePath, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) {
    console.error('Supabase upload error:', error);
    throw new Error('Image upload failed');
  }

  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}

// ---------------------------------------------------------------------------
// Helper: delete an image from Supabase Storage (not needed for creation, but kept for completeness)
// ---------------------------------------------------------------------------
async function deleteImageFromSupabase(imageUrl: string, bucket: string) {
  try {
    const url = new URL(imageUrl);
    const pathPrefix = `/storage/v1/object/public/${bucket}/`;
    if (!url.pathname.startsWith(pathPrefix)) return;

    const filePath = url.pathname.slice(pathPrefix.length);
    await supabaseAdmin.storage.from(bucket).remove([filePath]);
  } catch (err) {
    console.error('Failed to delete image:', err);
  }
}

// ---------------------------------------------------------------------------
// POST /api/cloth
// ---------------------------------------------------------------------------
export async function POST(req: Request) {
  const authCheck = await validateRouteAuth(false);
  if (authCheck.error) return authCheck.error;

  try {
    const contentType = req.headers.get('content-type') || '';

    // ---------- Multipart form-data (with file upload) ----------
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();

      // Extract text fields
      const name = (formData.get('name') as string)?.trim();
      const description = (formData.get('description') as string)?.trim() || undefined;
      const basePriceStr = formData.get('basePrice') as string;
      const basePrice = basePriceStr ? parseFloat(basePriceStr) : undefined;
      const isPriceNull = formData.get('isPriceNull') === 'true';

      // Parse nested JSON strings for variants and partial services
      let variants: any[] = [];
      let partialServices: any[] = [];
      try {
        variants = JSON.parse((formData.get('variants') as string) || '[]');
        partialServices = JSON.parse((formData.get('partialServices') as string) || '[]');
      } catch {
        return NextResponse.json(
          { message: 'Invalid JSON for variants or partialServices.' },
          { status: 400 }
        );
      }

      // Image file
      const imageFile = formData.get('image') as File | null;

      // Upload image if provided
      let imageUrl: string | undefined = undefined;
      if (imageFile && imageFile.size > 0) {
        imageUrl = await uploadImageToSupabase(imageFile, 'avatars');
      } else {
        // Optionally allow a fallback imageUrl string if no file
        imageUrl = (formData.get('imageUrl') as string) || undefined;
      }

      // Validation (reuse the same logic)
      if (!name) {
        return NextResponse.json({ message: 'Name is required' }, { status: 400 });
      }

      const hasVariants = Array.isArray(variants) && variants.length > 0;
      const hasPartialServices = Array.isArray(partialServices) && partialServices.length > 0;
      const hasBasePrice = basePrice !== undefined && basePrice !== null && basePrice !== 0;

      let finalIsPriceNull = isPriceNull ?? false;

      // Rule 1: Cloth with variants → no basePrice, no cloth partial services, isPriceNull = true
      if (hasVariants) {
        if (hasBasePrice) {
          return NextResponse.json(
            { message: 'A cloth with variants cannot have a base price.' },
            { status: 400 }
          );
        }
        if (hasPartialServices) {
          return NextResponse.json(
            { message: 'A cloth with variants cannot have top-level partial services.' },
            { status: 400 }
          );
        }
        finalIsPriceNull = true;
      }

      // Rule 2: Cloth with basePrice → cannot have variants, isPriceNull must be false
      if (hasBasePrice) {
        if (hasVariants) {
          return NextResponse.json(
            { message: 'A cloth with a base price cannot have variants.' },
            { status: 400 }
          );
        }
        if (finalIsPriceNull) {
          return NextResponse.json(
            { message: 'isPriceNull cannot be true if a base price is explicitly provided.' },
            { status: 400 }
          );
        }
      }

      // Rule 3: Cloth with partialServices → cannot have variants (reinforcement)
      if (hasPartialServices && hasVariants) {
        return NextResponse.json(
          { message: 'A cloth with partial services cannot contain variants.' },
          { status: 400 }
        );
      }

      // Validate nested structures
      for (const variant of variants) {
        if (!variant.name?.trim()) {
          return NextResponse.json(
            { message: 'Each variant must have a name.' },
            { status: 400 }
          );
        }
        const variantIsPriceNull = variant.isPriceNull ?? false;
        if (!variantIsPriceNull && (variant.price === undefined || variant.price === null)) {
          return NextResponse.json(
            { message: `Variant "${variant.name}" requires a price when isPriceNull is false.` },
            { status: 400 }
          );
        }
        if (variant.partialServices) {
          for (const vps of variant.partialServices) {
            if (!vps.name?.trim() || vps.price === undefined || vps.price === null) {
              return NextResponse.json(
                { message: `Variant partial service "${vps.name || 'unnamed'}" must have a name and price.` },
                { status: 400 }
              );
            }
          }
        }
      }

      for (const service of partialServices) {
        if (!service.name?.trim() || service.price === undefined || service.price === null) {
          return NextResponse.json(
            { message: 'Each cloth partial service must have a name and price.' },
            { status: 400 }
          );
        }
      }

      // Format basePrice: if finalIsPriceNull or basePrice === 0, store as null
      const dbBasePrice = finalIsPriceNull ? null : basePrice ?? null;

      // Create the cloth with all nested data and the uploaded image URL
      await prisma.cloth.create({
        data: {
          name,
          description,
          imageUrl,
          basePrice: dbBasePrice,
          isPriceNull: finalIsPriceNull,

          variants: {
            create: variants.map((v: any) => ({
              name: v.name.trim(),
              price: v.isPriceNull ? null : v.price,
              isPriceNull: v.isPriceNull ?? false,
              partialServices: v.partialServices?.length
                ? {
                    createMany: {
                      data: v.partialServices.map((vps: any) => ({
                        name: vps.name.trim(),
                        price: vps.price,
                      })),
                    },
                  }
                : undefined,
            })),
          },

          partialServices: partialServices.length
            ? {
                createMany: {
                  data: partialServices.map((s: any) => ({
                    name: s.name.trim(),
                    price: s.price,
                  })),
                },
              }
            : undefined,
        },
      });

      return NextResponse.json({ message: 'Cloth data created' });
    }

    // ---------- JSON (original behaviour) ----------
    const body = await req.json();
    let {
      name,
      description,
      imageUrl,
      basePrice,
      isPriceNull,
      variants = [],
      partialServices = [],
    } = body;

    if (!name?.trim()) {
      return NextResponse.json({ message: 'Name is required' }, { status: 400 });
    }

    const hasVariants = Array.isArray(variants) && variants.length > 0;
    const hasPartialServices = Array.isArray(partialServices) && partialServices.length > 0;
    const hasBasePrice = basePrice !== undefined && basePrice !== null && basePrice !== 0;

    let finalIsPriceNull = isPriceNull ?? false;

    if (hasVariants) {
      if (hasBasePrice) {
        return NextResponse.json(
          { message: 'A cloth with variants cannot have a base price.' },
          { status: 400 }
        );
      }
      if (hasPartialServices) {
        return NextResponse.json(
          { message: 'A cloth with variants cannot have top-level partial services.' },
          { status: 400 }
        );
      }
      finalIsPriceNull = true;
      basePrice = null;
    }

    if (hasBasePrice) {
      if (hasVariants) {
        return NextResponse.json(
          { message: 'A cloth with a base price cannot have variants.' },
          { status: 400 }
        );
      }
      if (finalIsPriceNull) {
        return NextResponse.json(
          { message: 'isPriceNull cannot be true if a base price is explicitly provided.' },
          { status: 400 }
        );
      }
    }

    if (hasPartialServices && hasVariants) {
      return NextResponse.json(
        { message: 'A cloth with partial services cannot contain variants.' },
        { status: 400 }
      );
    }

    for (const variant of variants) {
      if (!variant.name?.trim()) {
        return NextResponse.json(
          { message: 'Each variant must have a name.' },
          { status: 400 }
        );
      }
      const variantIsPriceNull = variant.isPriceNull ?? false;
      if (!variantIsPriceNull && (variant.price === undefined || variant.price === null)) {
        return NextResponse.json(
          { message: `Variant "${variant.name}" requires a price when isPriceNull is false.` },
          { status: 400 }
        );
      }
      if (variant.partialServices) {
        for (const vps of variant.partialServices) {
          if (!vps.name?.trim() || vps.price === undefined || vps.price === null) {
            return NextResponse.json(
              { message: `Variant partial service "${vps.name || 'unnamed'}" must have a name and price.` },
              { status: 400 }
            );
          }
        }
      }
    }

    for (const service of partialServices) {
      if (!service.name?.trim() || service.price === undefined || service.price === null) {
        return NextResponse.json(
          { message: 'Each cloth partial service must have a name and price.' },
          { status: 400 }
        );
      }
    }

    const dbBasePrice = (finalIsPriceNull || basePrice === 0) ? null : basePrice;

    await prisma.cloth.create({
      data: {
        name: name.trim(),
        description: description?.trim(),
        imageUrl,
        basePrice: dbBasePrice,
        isPriceNull: finalIsPriceNull,

        variants: {
          create: variants.map((v: any) => ({
            name: v.name.trim(),
            price: v.isPriceNull ? null : v.price,
            isPriceNull: v.isPriceNull ?? false,
            partialServices: v.partialServices?.length
              ? {
                  createMany: {
                    data: v.partialServices.map((vps: any) => ({
                      name: vps.name.trim(),
                      price: vps.price,
                    })),
                  },
                }
              : undefined,
          })),
        },

        partialServices: partialServices.length
          ? {
              createMany: {
                data: partialServices.map((s: any) => ({
                  name: s.name.trim(),
                  price: s.price,
                })),
              },
            }
          : undefined,
      },
    });

    return NextResponse.json({ message: 'Cloth data created' });
  } catch (error) {
    console.error('Cloth creation error:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
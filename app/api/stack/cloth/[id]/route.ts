// app/api/stack/cloth/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateRouteAuth } from '@/lib/auth-util';
import { supabaseAdmin } from '@/lib/supabase'; // service‑role client for storage ops

// ---------------------------------------------------------------------------
// Helper: upload a file to Supabase Storage and return its public URL
// ---------------------------------------------------------------------------
async function uploadImageToSupabase(file: File, bucket: string): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `cloth-images/${fileName}`; // organise inside a folder

  const { error } = await supabaseAdmin.storage.from(bucket).upload(filePath, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) {
    console.error('Supabase upload error:', error);
    throw new Error('Image upload failed');
  }

  // Get the public URL (bucket must be public or have appropriate policies)
  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}

// ---------------------------------------------------------------------------
// Helper: delete an image from Supabase Storage given its public URL
// ---------------------------------------------------------------------------
async function deleteImageFromSupabase(imageUrl: string, bucket: string) {
  try {
    // Extract the path after the bucket name, e.g. /storage/v1/object/public/avatars/cloth-images/...
    const url = new URL(imageUrl);
    const pathPrefix = `/storage/v1/object/public/${bucket}/`;
    if (!url.pathname.startsWith(pathPrefix)) return; // not a Supabase storage URL

    const filePath = url.pathname.slice(pathPrefix.length);
    await supabaseAdmin.storage.from(bucket).remove([filePath]);
  } catch (err) {
    console.error('Failed to delete old image:', err);
  }
}

// ---------------------------------------------------------------------------
// POST: Add cloth partial services, variants, or variant partial services
// ---------------------------------------------------------------------------
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await validateRouteAuth(false);
  if (authCheck.error) return authCheck.error;

  const { id } = await params;

  try {
    const body = await req.json();
    const { type } = body;
    if (type !== 'c' && type !== 'v') {
      return NextResponse.json(
        { message: 'Invalid type for POST. Allowed: c, v' },
        { status: 400 }
      );
    }

    const parentId = id;

    if (type === 'c') {
      const cloth = await prisma.cloth.findUnique({
        where: { id: parentId },
        include: { variants: true, partialServices: true },
      });
      if (!cloth)
        return NextResponse.json({ message: 'Cloth not found' }, { status: 404 });

      const { clothPartialServices, variants } = body;

      // ----- Case 1: Add cloth‑level partial services -----
      if (clothPartialServices && Array.isArray(clothPartialServices)) {
        if (cloth.variants.length > 0) {
          return NextResponse.json(
            {
              message:
                'Cannot add cloth partial service because cloth already has variants.',
            },
            { status: 400 }
          );
        }

        for (const item of clothPartialServices) {
          const { name, price } = item;
          if (!name || price === undefined) {
            return NextResponse.json(
              {
                message:
                  'Each cloth partial service must have name and price.',
              },
              { status: 400 }
            );
          }
          await prisma.clothPartialService.create({
            data: { name, price, clothId: parentId },
          });
        }

        return NextResponse.json(
          { message: 'Cloth partial services created successfully' },
          { status: 201 }
        );
      }

      // ----- Case 2: Add variants (with optional variant partial services) -----
      else if (variants && Array.isArray(variants)) {
        if (cloth.basePrice !== null || cloth.partialServices.length > 0) {
          return NextResponse.json(
            {
              message:
                'Cannot add variants because the cloth has a base price or cloth partial services.',
            },
            { status: 400 }
          );
        }

        for (const vItem of variants) {
          const { name, price, variantPartialServices } = vItem;
          if (!name) {
            return NextResponse.json(
              { message: 'Each variant must have a name.' },
              { status: 400 }
            );
          }
          const createData: any = { name, clothId: parentId };
          if (price !== undefined) createData.price = price;
          if (variantPartialServices?.length) {
            createData.partialServices = {
              create: variantPartialServices.map((vps: any) => {
                if (!vps.name || vps.price === undefined) {
                  throw new Error(
                    'Each variant partial service must have name and price.'
                  );
                }
                return { name: vps.name, price: vps.price };
              }),
            };
          }
          await prisma.variant.create({ data: createData });
        }

        await prisma.cloth.update({
          where: { id: parentId },
          data: { isPriceNull: true, basePrice: null },
        });

        return NextResponse.json(
          { message: 'Variants created successfully' },
          { status: 201 }
        );
      }

      return NextResponse.json(
        {
          message:
            'Payload must include either clothPartialServices array or variants array.',
        },
        { status: 400 }
      );
    }

    // ----- Type 'v': Add variant partial service to an existing variant -----
    else {
      const variant = await prisma.variant.findUnique({
        where: { id: parentId },
      });
      if (!variant)
        return NextResponse.json(
          { message: 'Variant not found' },
          { status: 404 }
        );

      const { name, price } = body;
      if (!name || price === undefined) {
        return NextResponse.json(
          {
            message:
              'Variant partial service requires name and price.',
          },
          { status: 400 }
        );
      }
      await prisma.variantPartialService.create({
        data: { name, price, variantId: parentId },
      });
      return NextResponse.json(
        { message: 'Variant partial service created successfully' },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: 'Error creating entity.' },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// PUT: Edit cloth, variant, cloth partial service, or variant partial service
//      Cloth updates now accept multipart/form-data for image uploads.
// ---------------------------------------------------------------------------
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await validateRouteAuth(false);
  if (authCheck.error) return authCheck.error;

  const { id } = await params;

  try {
    const contentType = req.headers.get('content-type') || '';

    // ---------- Multipart form-data (only for cloth image uploads) ----------
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const type = formData.get('type') as string | null;

      if (type !== 'c') {
        return NextResponse.json(
          { message: 'Multipart uploads are only supported for cloth (type "c")' },
          { status: 400 }
        );
      }

      const cloth = await prisma.cloth.findUnique({
        where: { id },
        include: { variants: true, partialServices: true },
      });
      if (!cloth) {
        return NextResponse.json({ message: 'Cloth not found' }, { status: 404 });
      }

      // Extract text fields
      const name = formData.get('name') as string | null;
      const description = formData.get('description') as string | null;
      const toggletospecial = formData.get('toggletospecial') === 'true';
      const toggletopricenull = formData.get('toggletopricenull') === 'true';
      const priceStr = formData.get('price') as string | null;
      const price = priceStr ? parseFloat(priceStr) : undefined;

      // Image file
      const imageFile = formData.get('image') as File | null;

      const data: any = {};
      if (name !== undefined) data.name = name;
      if (description !== undefined) data.description = description;

      // Handle image upload
      if (imageFile && imageFile.size > 0) {
        // Delete old image if exists
        if (cloth.imageUrl) {
          await deleteImageFromSupabase(cloth.imageUrl, 'avatars');
        }
        const publicUrl = await uploadImageToSupabase(imageFile, 'avatars');
        data.imageUrl = publicUrl;
      }

      // Price logic (same as before)
      if (toggletopricenull) {
        data.basePrice = null;
        data.isPriceNull = true;
      } else if (toggletospecial) {
        if (cloth.variants.length > 0) {
          return NextResponse.json(
            { message: 'Cannot unset price null flag because cloth has variants.' },
            { status: 400 }
          );
        }
        data.basePrice = null;
        data.isPriceNull = false;
      } else if (price !== undefined) {
        if (cloth.isPriceNull) {
          return NextResponse.json(
            { message: 'Cannot set base price because isPriceNull is true. Use toggle to change.' },
            { status: 400 }
          );
        }
        if (cloth.variants.length > 0) {
          return NextResponse.json(
            { message: 'Cannot set a base price on a cloth that already has variants.' },
            { status: 400 }
          );
        }
        data.basePrice = price;
      }

      await prisma.cloth.update({ where: { id }, data });
      return NextResponse.json({ message: 'Cloth updated successfully' });
    }

    // ---------- JSON (original behaviour for all types) ----------
    const body = await req.json();
    const { type } = body;
    if (!type || !['c', 'v', 'cps', 'vps'].includes(type)) {
      return NextResponse.json(
        { message: 'Invalid type. Allowed: c, v, cps, vps' },
        { status: 400 }
      );
    }

    const entityId = id;
    let existing: any;

    if (type === 'c') {
      existing = await prisma.cloth.findUnique({
        where: { id: entityId },
        include: { variants: true, partialServices: true },
      });
    } else if (type === 'v') {
      existing = await prisma.variant.findUnique({
        where: { id: entityId },
        include: { cloth: { include: { partialServices: true } } },
      });
    } else if (type === 'cps') {
      existing = await prisma.clothPartialService.findUnique({
        where: { id: entityId },
      });
    } else if (type === 'vps') {
      existing = await prisma.variantPartialService.findUnique({
        where: { id: entityId },
      });
    }

    if (!existing) {
      return NextResponse.json({ message: 'Entity not found' }, { status: 404 });
    }

    const data: any = {};
    const { name, price, image, description, toggletospecial, toggletopricenull } = body;

    if (name !== undefined) data.name = name;

    // --- Cloth updates (JSON) ---
    if (type === 'c') {
      if (image !== undefined) {
        // If a new URL is provided and different from existing, delete old image
        if (existing.imageUrl && existing.imageUrl !== image) {
          await deleteImageFromSupabase(existing.imageUrl, 'avatars');
        }
        data.imageUrl = image;
      }
      if (description !== undefined) data.description = description;

      if (toggletopricenull === true) {
        data.basePrice = null;
        data.isPriceNull = true;
      } else if (toggletospecial === true) {
        if (existing.variants.length > 0) {
          return NextResponse.json(
            { message: 'Cannot unset price null flag because cloth has variants.' },
            { status: 400 }
          );
        }
        data.basePrice = null;
        data.isPriceNull = false;
      } else {
        if (price !== undefined) {
          if (existing.isPriceNull) {
            return NextResponse.json(
              { message: 'Cannot set base price because isPriceNull is true. Use toggle to change.' },
              { status: 400 }
            );
          }
          if (existing.variants.length > 0) {
            return NextResponse.json(
              { message: 'Cannot set a base price on a cloth that already has variants.' },
              { status: 400 }
            );
          }
          data.basePrice = price;
        }
      }
      delete data.price;
    }

    // --- Variant updates ---
    else if (type === 'v') {
      if (toggletospecial === true) {
        const cloth = existing.cloth;
        if (
          cloth.partialServices.length > 0 ||
          (cloth.basePrice && cloth.basePrice > 0)
        ) {
          return NextResponse.json(
            { message: 'Cannot unset price null flag because cloth has partial services or base price > 0.' },
            { status: 400 }
          );
        }
        data.price = null;
        data.isPriceNull = false;
      } else {
        if (price !== undefined) {
          if (existing.isPriceNull) {
            return NextResponse.json(
              { message: 'Cannot set price because variant isPriceNull is true.' },
              { status: 400 }
            );
          }
          data.price = price;
        }
      }
    }

    // --- Partial service updates ---
    else if (type === 'cps' || type === 'vps') {
      if (toggletospecial === true) {
        data.price = null;
      } else if (price !== undefined) {
        data.price = price;
      }
    }

    // Execute update
    if (type === 'c') {
      await prisma.cloth.update({ where: { id: entityId }, data });
    } else if (type === 'v') {
      await prisma.variant.update({ where: { id: entityId }, data });
    } else if (type === 'cps') {
      await prisma.clothPartialService.update({ where: { id: entityId }, data });
    } else if (type === 'vps') {
      await prisma.variantPartialService.update({ where: { id: entityId }, data });
    }

    return NextResponse.json({ message: 'Entity updated successfully' });
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2025') {
      return NextResponse.json({ message: 'Entity not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Edit failed' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE: Remove entity and clean up associated images (cloth only)
// ---------------------------------------------------------------------------
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await validateRouteAuth(false);
  if (authCheck.error) return authCheck.error;

  const { id } = await params;

  try {
    const body = await req.json();
    const { type } = body;
    if (!type || !['c', 'v', 'cps', 'vps'].includes(type)) {
      return NextResponse.json(
        { message: 'Invalid type for delete' },
        { status: 400 }
      );
    }

    const entityId = id;

    // Before deleting a cloth, remove its stored image (if any)
    if (type === 'c') {
      const cloth = await prisma.cloth.findUnique({ where: { id: entityId } });
      if (cloth?.imageUrl) {
        await deleteImageFromSupabase(cloth.imageUrl, 'avatars');
      }
      await prisma.cloth.delete({ where: { id: entityId } });
    } else if (type === 'v') {
      await prisma.variant.delete({ where: { id: entityId } });
    } else if (type === 'cps') {
      await prisma.clothPartialService.delete({ where: { id: entityId } });
    } else if (type === 'vps') {
      await prisma.variantPartialService.delete({ where: { id: entityId } });
    }

    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ message: 'Entity not found' }, { status: 404 });
    }
    console.error(error);
    return NextResponse.json({ message: 'Deletion failed' }, { status: 500 });
  }
}
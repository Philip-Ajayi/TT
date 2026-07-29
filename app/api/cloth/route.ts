// app/api/cloth/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateRouteAuth } from '@/lib/auth-util';

export async function POST(req: Request) {
  const authCheck = await validateRouteAuth(false);
  if (authCheck.error) return authCheck.error;

  try {
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
      basePrice = null;
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

    // Validate nested structures before creation
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
    const dbBasePrice = (finalIsPriceNull || basePrice === 0) ? null : basePrice;

    // Atomic creation using nested writes (no interactive transaction needed)
    await prisma.cloth.create({
      data: {
        name: name.trim(),
        description: description?.trim(),
        imageUrl,
        basePrice: dbBasePrice,
        isPriceNull: finalIsPriceNull,

        // Nested variants
        variants: {
          create: variants.map((v: any) => ({
            name: v.name.trim(),
            price: v.isPriceNull ? null : v.price,
            isPriceNull: v.isPriceNull ?? false,
            // Nested variant partial services (optional)
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

        // Nested cloth-level partial services (optional)
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
// app/api/stack/catalog/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateRouteAuth } from '@/lib/auth-util';

export async function GET() {
  const authCheck = await validateRouteAuth(true);
  if (authCheck.error) return authCheck.error;

  try {
    const cloths = await prisma.cloth.findMany({
      include: {
        partialServices: true,          // ClothPartialService[]
        variants: {
          include: {
            partialServices: true,      // VariantPartialService[]
          },
        },
      },
    });

    const formatted = cloths.map((cloth) => {
      // Build cloth price field
      let priceField: { price?: number; isspecial?: boolean } = {};
      if (cloth.isPriceNull) {
        // When isPriceNull is true, we only add disabled (handled below), no price/isspecial
      } else if (cloth.basePrice !== null) {
        priceField = { price: Number(cloth.basePrice) };
      } else {
        // basePrice is null and isPriceNull is false → special
        priceField = { isspecial: true };
      }

      const clothObj: any = {
        id: cloth.id,
        name: cloth.name,
        description: cloth.description,
        img: cloth.imageUrl,
        ...priceField,
        // Mandatory disabled when isPriceNull true
        ...(cloth.isPriceNull && { disabled: true }),
        clothPartialServices: cloth.partialServices.map((cps) => ({
          id: cps.id,
          name: cps.name,
          price: Number(cps.price), // price is always present in DB
        })),
        variants: cloth.variants.map((variant) => {
          let varPriceField: { price?: number; isspecial?: boolean } = {};
          if (variant.isPriceNull) {
            // no price field, disabled will be added
          } else if (variant.price !== null) {
            varPriceField = { price: Number(variant.price) };
          } else {
            varPriceField = { isspecial: true };
          }

          return {
            id: variant.id,
            name: variant.name,
            ...varPriceField,
            ...(variant.isPriceNull && { disabled: true }),
            variantPartialServices: variant.partialServices.map((vps) => ({
              id: vps.id,
              name: vps.name,
              price: Number(vps.price),
            })),
          };
        }),
      };

      return clothObj;
    });

    return NextResponse.json(formatted);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Failed to fetch cloth data' }, { status: 500 });
  }
}
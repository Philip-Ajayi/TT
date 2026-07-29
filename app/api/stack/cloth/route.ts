// app/api/stack/cloth/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateRouteAuth } from '@/lib/auth-util';

export async function GET() {
  const authCheck = await validateRouteAuth(false);
  if (authCheck.error) return authCheck.error;

  try {
    const cloths = await prisma.cloth.findMany({
      include: {
        partialServices: true,            // ClothPartialService
        variants: {
          include: {
            partialServices: true,        // VariantPartialService
          },
        },
      },
    });

    const formatted = cloths.map((cloth) => ({
      id: cloth.id,
      name: cloth.name,
      price: cloth.isPriceNull ? null : cloth.basePrice,
      isPriceNull: cloth.isPriceNull,
      // optional arrays: if empty, return empty arrays
      clothPartialServices: cloth.partialServices.map((cps) => ({
        id: cps.id,
        name: cps.name,
        price: cps.price,
      })),
      variants: cloth.variants.map((variant) => ({
        id: variant.id,
        name: variant.name,
        price: variant.isPriceNull ? null : variant.price,
        isPriceNull: variant.isPriceNull,
        variantPartialServices: variant.partialServices.map((vps) => ({
          id: vps.id,
          name: vps.name,
          price: vps.price,
        })),
      })),
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Failed to fetch cloth data' }, { status: 500 });
  }
}
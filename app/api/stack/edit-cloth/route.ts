// app/api/stack/edit-cloth/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateRouteAuth } from '@/lib/auth-util';

export async function GET(request: NextRequest) {
  // Authentication skipped as requested
  const authCheck = await validateRouteAuth(false);
  if (authCheck.error) return authCheck.error;

  try {
    // Fetch all clothes with full nested relations
    const clothes = await prisma.cloth.findMany({
      include: {
        variants: {
          include: {
            partialServices: true, // VariantPartialService
          },
        },
        partialServices: true, // ClothPartialService
      },
      orderBy: { name: 'asc' },
    });

    // Transform the entire list
    const transformed = clothes.map(transformCloth);
    return NextResponse.json(transformed);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/* ---------- Transform Helpers ---------- */

function transformCloth(cloth: any) {
  const result: any = {
    id: cloth.id,
    name: cloth.name,
  };

  // Handle cloth price / special flag
  if (cloth.basePrice !== null) {
    result.price = cloth.basePrice.toNumber();
  } else {
    // Price is null — determine if disabled or special
    if (cloth.isPriceNull) {
      result.disabled = true;
    } else {
      result.isspecial = true;
    }
  }

  // Variants
  if (cloth.variants?.length) {
    result.variants = cloth.variants.map(transformVariant);
  }

  // Cloth partial services (mutually exclusive with variants in practice)
  if (cloth.partialServices?.length) {
    result.clothPartialServices = cloth.partialServices.map(
      (ps: any) => transformPartialService(ps, 'cloth')
    );
  }

  return result;
}

function transformVariant(variant: any) {
  const result: any = {
    id: variant.id,
    name: variant.name,
  };

  // Handle variant price / special
  if (variant.price !== null) {
    result.price = variant.price.toNumber();
  } else {
    // Price is null — determine if disabled or special
    if (variant.isPriceNull) {
      result.disabled = true;
    } else {
      result.isspecial = true;
    }
  }

  // Variant partial services
  if (variant.partialServices?.length) {
    result.variantPartialServices = variant.partialServices.map(
      (ps: any) => transformPartialService(ps, 'variant')
    );
  }

  return result;
}

/**
 * Transform a partial service (either ClothPartialService or VariantPartialService).
 * If price is not null, return { id, name, price }.
 * If price is null (future-proof), return { id, name, isspecial: true }.
 */
function transformPartialService(ps: any, _type: 'cloth' | 'variant') {
  const base = { id: ps.id, name: ps.name };
  if (ps.price !== null && ps.price !== undefined) {
    return { ...base, price: ps.price.toNumber() };
  } else {
    return { ...base, isspecial: true };
  }
}
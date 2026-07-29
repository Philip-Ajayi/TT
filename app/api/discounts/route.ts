//app/app/api/discounts/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateRouteAuth } from '@/lib/auth-util';

// GET: Fetch promotional strategy campaigns – only id, code, type, percentage, capNaira, active
export async function GET() {
  const authCheck = await validateRouteAuth(true);
  if (authCheck.error) return authCheck.error;

  try {
    const discountRules = await prisma.discountRule.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        code: true,
        type: true,
        percentage: true,
        capNaira: true,
        active: true,
      },
    });
    return NextResponse.json(discountRules);
  } catch (error) {
    console.error('GET discounts error:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST: Instantiate marketing campaign promo parameters
export async function POST(req: Request) {
  const authCheck = await validateRouteAuth(false);
  if (authCheck.error) return authCheck.error;

  try {
    const { code, type, percentage, capNaira, active } = await req.json();

    if (!code || !type || percentage === undefined) {
      return NextResponse.json(
        { message: 'Missing required fields: code, type, percentage' },
        { status: 400 }
      );
    }

    await prisma.discountRule.create({
      data: {
        code: code.toUpperCase().trim(),
        type,
        percentage,
        capNaira,
        active: active ?? true,
      },
    });

    return NextResponse.json(
      { message: 'Discount rule created successfully' },
      { status: 201 }
    );
  } catch (error: any) {
    // Handle duplicate code
    if (error.code === 'P2002' && error.meta?.target?.includes('code')) {
      return NextResponse.json(
        { message: 'Discount code already exists' },
        { status: 409 }
      );
    }
    console.error('POST discount error:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
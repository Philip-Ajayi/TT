//app\api\currency\route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateRouteAuth } from '@/lib/auth-util';

// GET: Retrieve all supported operational multipliers relative to NGN
export async function GET() {
  const authCheck = await validateRouteAuth(true);
  if (authCheck.error) return authCheck.error;

  try {
    const currencies = await prisma.currency.findMany({
      orderBy: { code: 'asc' },
      select: { id: true, code: true, multiplier: true },
    });
    return NextResponse.json(currencies);
  } catch (error) {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authCheck = await validateRouteAuth(false);
  if (authCheck.error) return authCheck.error;

  try {
    const { code, multiplier } = await req.json();

    if (!code || multiplier === undefined) {
      return NextResponse.json(
        { message: 'Missing core pricing index specifications' },
        { status: 400 }
      );
    }

    // Create the currency in the database
    await prisma.currency.create({
      data: {
        code: code.toUpperCase().trim(),
        multiplier,
      },
    });

    return NextResponse.json({ message: 'Currency created' });
  } catch (error: any) {
    // Handle duplicate code error
    if (error.code === 'P2002' && error.meta?.target?.includes('code')) {
      return NextResponse.json(
        { message: 'Currency code already exists' },
        { status: 409 }
      );
    }
    console.error('Currency creation error:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
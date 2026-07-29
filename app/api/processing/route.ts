// app/api/processing/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateRouteAuth } from '@/lib/auth-util';

// GET: Return turnaround urgency tiers (only id, name, multiplier)
export async function GET() {
  const authCheck = await validateRouteAuth(true);
  if (authCheck.error) return authCheck.error;

  try {
    const rules = await prisma.processingRule.findMany({
      orderBy: { multiplier: 'asc' },
      select: {
        id: true,
        name: true,
        multiplier: true,
      },
    });
    return NextResponse.json(rules);
  } catch (error) {
    console.error('GET processing rules error:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST: Add new surge or urgency multiplier metrics
export async function POST(req: Request) {
  const authCheck = await validateRouteAuth(false);
  if (authCheck.error) return authCheck.error;

  try {
    const { name, multiplier } = await req.json();

    if (!name || multiplier === undefined) {
      return NextResponse.json(
        { message: 'Missing urgency multiplier specifications' },
        { status: 400 }
      );
    }

    await prisma.processingRule.create({
      data: {
        name: name.trim(),
        multiplier,
      },
    });

    return NextResponse.json(
      { message: 'Processing rule created successfully' },
      { status: 201 }
    );
  } catch (error: any) {
    // Handle duplicate name (unique constraint)
    if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
      return NextResponse.json(
        { message: 'A processing rule with this name already exists' },
        { status: 409 }
      );
    }
    console.error('POST processing rule error:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
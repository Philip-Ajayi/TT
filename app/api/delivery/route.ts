//app\api\delivery\route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateRouteAuth } from '@/lib/auth-util';

// GET: List all delivery setups for either model
export async function GET(req: Request) {
  const authCheck = await validateRouteAuth(true);
  if (authCheck.error) return authCheck.error;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type'); // 'setup1' or 'setup2'

  try {
    if (type === 'setup1') {
      const setups1 = await prisma.deliverySetup1.findMany({
        orderBy: { miles: 'asc' },
        select: { id: true, miles: true, pricePerMile: true },
      });
      return NextResponse.json(setups1);
    } else if (type === 'setup2') {
      const setups2 = await prisma.deliverySetup2.findMany({
        orderBy: { quantity: 'asc' },
        select: { id: true, quantity: true, multiplier: true },
      });
      return NextResponse.json(setups2);
    } else {
      // Fallback: return both setups
      const setups1 = await prisma.deliverySetup1.findMany({
        orderBy: { miles: 'asc' },
        select: { id: true, miles: true, pricePerMile: true },
      });
      const setups2 = await prisma.deliverySetup2.findMany({
        orderBy: { quantity: 'asc' },
        select: { id: true, quantity: true, multiplier: true },
      });
      return NextResponse.json({ setup1: setups1, setup2: setups2 });
    }
  } catch (error) {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Create a new setup matrix entry
export async function POST(req: Request) {
  const authCheck = await validateRouteAuth(false);
  if (authCheck.error) return authCheck.error;

  try {
    const body = await req.json();
    const { type } = body;

    if (type === 'setup1') {
      const { miles, pricePerMile } = body;
      if (!miles || pricePerMile === undefined) {
        return NextResponse.json(
          { message: 'Missing required fields for Setup 1 (miles, pricePerMile)' },
          { status: 400 }
        );
      }
      await prisma.deliverySetup1.create({
        data: { miles, pricePerMile },
      });
      return NextResponse.json({ message: 'Created successfully' });
    } 
    
    if (type === 'setup2') {
      const { quantity, multiplier } = body;
      if (!quantity || multiplier === undefined) {
        return NextResponse.json(
          { message: 'Missing required fields for Setup 2 (quantity, multiplier)' },
          { status: 400 }
        );
      }
      await prisma.deliverySetup2.create({
        data: { quantity, multiplier },
      });
      return NextResponse.json({ message: 'Created successfully' });
    }

    return NextResponse.json(
      { message: "Invalid or missing 'type' identifier (must be 'setup1' or 'setup2')" },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
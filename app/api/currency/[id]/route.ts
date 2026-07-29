// app/api/currency/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateRouteAuth } from '@/lib/auth-util';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }  // ← Promise
) {
  const authCheck = await validateRouteAuth(false);
  if (authCheck.error) return authCheck.error;

  try {
    const { id } = await params;   // ← await it
    const body = await req.json();

    // Build update data with allowed fields
    const updateData: any = {};
    if (body.code !== undefined) {
      updateData.code = body.code.toUpperCase().trim();
    }
    if (body.multiplier !== undefined) {
      updateData.multiplier = body.multiplier;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Perform update
    await prisma.currency.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ message: 'Currency updated' });
  } catch (error: any) {
    // Handle record not found
    if (error.code === 'P2025') {
      return NextResponse.json(
        { message: 'Currency not found' },
        { status: 404 }
      );
    }
    // Handle duplicate code (unique constraint)
    if (error.code === 'P2002' && error.meta?.target?.includes('code')) {
      return NextResponse.json(
        { message: 'Currency code already exists' },
        { status: 409 }
      );
    }
    console.error('Currency update error:', error);
    return NextResponse.json(
      { message: 'Exchange index recalculation entry update failed' },
      { status: 500 }
    );
  }
}

// DELETE: Terminate regional multi-currency support profile
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }  // ← Promise
) {
  const authCheck = await validateRouteAuth(false);
  if (authCheck.error) return authCheck.error;

  try {
    const { id } = await params;   // ← await it
    await prisma.currency.delete({ where: { id } });
    return NextResponse.json({ message: 'Currency conversion parameter removed cleanly' });
  } catch (error) {
    return NextResponse.json({ message: 'Deletion failed' }, { status: 500 });
  }
}
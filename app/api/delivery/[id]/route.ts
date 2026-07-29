// app/api/delivery/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateRouteAuth } from '@/lib/auth-util';

// PUT: Update logistics setups
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await validateRouteAuth(false);
  if (authCheck.error) return authCheck.error;

  try {
    const { id } = await params;   // ← await the Promise
    const body = await req.json();
    const { type, ...updateData } = body;

    if (type === 'setup1') {
      const allowedFields = ['miles', 'pricePerMile'];
      const filteredData = Object.fromEntries(
        Object.entries(updateData).filter(([key]) => allowedFields.includes(key))
      );
      if (Object.keys(filteredData).length === 0) {
        return NextResponse.json(
          { message: 'No valid fields to update' },
          { status: 400 }
        );
      }
      await prisma.deliverySetup1.update({
        where: { id },
        data: filteredData,
      });
      return NextResponse.json({ message: 'Updated successfully' });
    }

    if (type === 'setup2') {
      const allowedFields = ['quantity', 'multiplier'];
      const filteredData = Object.fromEntries(
        Object.entries(updateData).filter(([key]) => allowedFields.includes(key))
      );
      if (Object.keys(filteredData).length === 0) {
        return NextResponse.json(
          { message: 'No valid fields to update' },
          { status: 400 }
        );
      }
      await prisma.deliverySetup2.update({
        where: { id },
        data: filteredData,
      });
      return NextResponse.json({ message: 'Updated successfully' });
    }

    return NextResponse.json(
      { message: "Invalid or missing 'type' identifier (must be 'setup1' or 'setup2')" },
      { status: 400 }
    );
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { message: 'Record not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: 'Update execution failed' },
      { status: 500 }
    );
  }
}

// DELETE: Remove logistics setup entry
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await validateRouteAuth(false);
  if (authCheck.error) return authCheck.error;

  try {
    const { id } = await params;   // ← await the Promise
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'setup1' or 'setup2'

    if (type === 'setup1') {
      await prisma.deliverySetup1.delete({ where: { id } });
      return NextResponse.json({ message: 'Delivery setup 1 entry dropped successfully' });
    } else if (type === 'setup2') {
      await prisma.deliverySetup2.delete({ where: { id } });
      return NextResponse.json({ message: 'Delivery setup 2 entry dropped successfully' });
    } else {
      return NextResponse.json(
        { message: "Invalid or missing 'type' query parameter (must be 'setup1' or 'setup2')" },
        { status: 400 }
      );
    }
  } catch (error) {
    return NextResponse.json({ message: 'Deletion failed' }, { status: 500 });
  }
}
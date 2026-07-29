// app/api/discounts/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateRouteAuth } from '@/lib/auth-util';

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const authCheck = await validateRouteAuth(false);
  if (authCheck.error) return authCheck.error;

  try {
    const { id } = await params;
    const body = await req.json();

    // Whitelist allowed fields for update
    const allowedFields = ['code', 'type', 'percentage', 'capNaira', 'active'];
    const updateData: any = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        // Normalize code to uppercase if provided
        if (field === 'code' && body.code) {
          updateData.code = body.code.toUpperCase().trim();
        } else {
          updateData[field] = body[field];
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: 'No valid fields to update' },
        { status: 400 }
      );
    }

    await prisma.discountRule.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ message: 'Discount rule updated successfully' });
  } catch (error: any) {
    // Record not found
    if (error.code === 'P2025') {
      return NextResponse.json(
        { message: 'Discount rule not found' },
        { status: 404 }
      );
    }
    // Duplicate code error (if code is unique)
    if (error.code === 'P2002' && error.meta?.target?.includes('code')) {
      return NextResponse.json(
        { message: 'Discount code already exists' },
        { status: 409 }
      );
    }
    console.error('Update discount rule error:', error);
    return NextResponse.json(
      { message: 'Update operations failed' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const authCheck = await validateRouteAuth(false);
  if (authCheck.error) return authCheck.error;

  try {
    const { id } = await params; // <-- fix: await the params
    await prisma.discountRule.delete({ where: { id } });
    return NextResponse.json({ message: 'Discount validation tier dropped' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { message: 'Discount rule not found' },
        { status: 404 }
      );
    }
    console.error('Delete discount rule error:', error);
    return NextResponse.json(
      { message: 'Deletion failed' },
      { status: 500 }
    );
  }
}
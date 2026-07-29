// app/api/processing/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateRouteAuth } from '@/lib/auth-util';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }  // ← change type to Promise
) {
  const authCheck = await validateRouteAuth(false);
  if (authCheck.error) return authCheck.error;

  try {
    const { id } = await params;   // ← await it

    const body = await req.json();

    // Whitelist allowed fields for update (based on schema)
    const allowedFields = ['name', 'multiplier'];
    const updateData: any = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: 'No valid fields to update' },
        { status: 400 }
      );
    }

    await prisma.processingRule.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(
      { message: 'Processing rule updated successfully' }
    );
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { message: 'Processing rule not found' },
        { status: 404 }
      );
    }
    if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
      return NextResponse.json(
        { message: 'A processing rule with this name already exists' },
        { status: 409 }
      );
    }
    console.error('Update processing rule error:', error);
    return NextResponse.json(
      { message: 'Urgency tier modifications failed' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }   // ← change type to Promise
) {
  const authCheck = await validateRouteAuth(false);
  if (authCheck.error) return authCheck.error;

  try {
    const { id } = await params;   // ← await it

    await prisma.processingRule.delete({
      where: { id },
    });
    return NextResponse.json(
      { message: 'Processing timeline configuration dropped cleanly' }
    );
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { message: 'Processing rule not found' },
        { status: 404 }
      );
    }
    console.error('Delete processing rule error:', error);
    return NextResponse.json(
      { message: 'Deletion failed' },
      { status: 500 }
    );
  }
}
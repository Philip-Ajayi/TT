// app/api/address/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateRouteAuth } from '@/lib/auth-util';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await validateRouteAuth(false);
  if (authCheck.error) return authCheck.error;

  const { role } = authCheck.session.user as any;
  if (role !== 'superadmin') {
    return NextResponse.json(
      { message: 'Forbidden: Superadmin privilege required' },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;   // ← await the promise
    const body = await req.json();
    const { isActive } = body;

    const existing = await prisma.companyAddress.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { message: 'Address not found' },
        { status: 404 }
      );
    }

    await prisma.companyAddress.update({
      where: { id },
      data: { isActive: Boolean(isActive) },
    });

    return NextResponse.json({ message: 'Address updated successfully' });
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to update address status' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await validateRouteAuth(false);
  if (authCheck.error) return authCheck.error;

  const { role } = authCheck.session.user as any;
  if (role !== 'superadmin') {
    return NextResponse.json(
      { message: 'Forbidden: Superadmin privilege required' },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;   // ← await the promise

    const existing = await prisma.companyAddress.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { message: 'Address not found' },
        { status: 404 }
      );
    }

    await prisma.companyAddress.delete({ where: { id } });

    return NextResponse.json({ message: 'Address deleted' });
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to delete address' },
      { status: 500 }
    );
  }
}

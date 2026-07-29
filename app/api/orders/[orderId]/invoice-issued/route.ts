// app/api/orders/[orderId]/invoice-issued/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateRouteAuth } from '@/lib/auth-util';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const authCheck = await validateRouteAuth(true);
  if (authCheck.error) return authCheck.error;

  // Extract admin info the same way you do in other routes
  const admin = authCheck.session.user as any;

  try {
    const { orderId } = await params;
    const body = await req.json();
    const { invoiceIssued } = body;

    if (typeof invoiceIssued !== 'boolean') {
      return NextResponse.json(
        { message: 'invoiceIssued must be a boolean' },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true },
    });

    if (!order) {
      return NextResponse.json(
        { message: 'Order not found' },
        { status: 404 }
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { invoiceIssued },
    });

    // Log the action
    await prisma.adminLog.create({
      data: {
        adminId: admin.id,
        adminName: admin.name ?? 'Admin',
        orderId,
        action: invoiceIssued ? 'Invoice issued' : 'Invoice unissued',
        details: `Toggled invoiceIssued to ${invoiceIssued}`,
      },
    });

    return NextResponse.json({
      success: true,
      invoiceIssued: updatedOrder.invoiceIssued,
    });
  } catch (error) {
    console.error('Error toggling invoiceIssued:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
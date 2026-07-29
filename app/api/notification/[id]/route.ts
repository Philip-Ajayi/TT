// app/api/notification/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateRouteAuth } from '@/lib/auth-util';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await validateRouteAuth(true); // any authenticated user
  if (authCheck.error) return authCheck.error;

  const session = authCheck.session!;
  // Ensure user is present
  if (!session.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;
  const { id: notificationId } = await params;  // ← Await the promise

  try {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    // Only allow the owner to mark it as read
    if (!notification || notification.userId !== userId) {
      return NextResponse.json({ message: 'Notification not found' }, { status: 404 });
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });

    return NextResponse.json({ message: 'Notification marked as read' });
  } catch (error) {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
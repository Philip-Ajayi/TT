//app/api/notification/admin/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateRouteAuth } from '@/lib/auth-util';

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const authCheck = await validateRouteAuth(false); // admin/superadmin only
  if (authCheck.error) return authCheck.error;
  const session = authCheck.session!;
  const user = session.user as any;

  const notificationId = params.id;

  try {
    const notification = await prisma.companyNotification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return NextResponse.json({ message: 'Notification not found' }, { status: 404 });
    }

    // Permission check
    if (user.role !== 'superadmin') {
      if (user.role === 'admin') {
        // Admin must have the notification's company in their workplaces
        const adminUser = await prisma.user.findUnique({
          where: { id: user.id },
          include: { workplaces: { select: { id: true } } },
        });

        if (!adminUser) {
          return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        const workplaceIds = adminUser.workplaces.map((w) => w.id);
        if (
          !notification.companyAddressId ||
          !workplaceIds.includes(notification.companyAddressId)
        ) {
          return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }
      } else {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
      }
    }

    // Allowed – mark as read
    await prisma.companyNotification.update({
      where: { id: notificationId },
      data: { read: true },
    });

    return NextResponse.json({ message: 'Notification marked as read' });
  } catch (error) {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
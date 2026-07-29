//app/api/admin/route.ts 
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateRouteAuth } from '@/lib/auth-util';

// GET: Retrieve all admin profiles with only id, adminApproved, and workspace info
export async function GET() {
  const authCheck = await validateRouteAuth(false);
  if (authCheck.error) return authCheck.error;

  const { role } = authCheck.session.user as any;
  if (role !== 'superadmin') {
    return NextResponse.json(
      { message: 'Forbidden: Superadmin access required' },
      { status: 403 }
    );
  }

  try {
    const admins = await prisma.user.findMany({
      where: { role: 'admin' },
      select: {
        id: true,
        adminApproved: true,
        workplaces: {
          select: {
            id: true,
            address: true,
          },
        },
      },
      orderBy: {
        adminApproved: 'asc', // false (0) first, then true (1)
      },
    });

    // Map to the desired shape: workspace as a single object or null
    const formattedAdmins = admins.map((admin) => ({
      id: admin.id,
      adminApproved: admin.adminApproved,
      workspace: admin.workplaces.length > 0
        ? {
            id: admin.workplaces[0].id,
            address: admin.workplaces[0].address,
          }
        : null,
    }));

    return NextResponse.json(formattedAdmins);
  } catch (error) {
    console.error('Error fetching admins:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
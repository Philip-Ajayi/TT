// app/api/admin/[id]/route.ts (PATCH part)
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateRouteAuth } from '@/lib/auth-util';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const authCheck = await validateRouteAuth(false);
  if (authCheck.error) return authCheck.error;

  const { role } = authCheck.session.user as any;
  if (role !== 'superadmin') {
    return NextResponse.json(
      { message: 'Forbidden: Superadmin access required' },
      { status: 403 }
    );
  }

  const adminId = params.id;

  try {
    const body = await req.json();
    const { action } = body;

    // Verify the target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: adminId },
    });
    if (!targetUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    let updatedUser;

    switch (action) {
      case 'revertToCustomer': {
        updatedUser = await prisma.user.update({
          where: { id: adminId },
          data: {
            role: 'customer',
            adminApproved: false,
            workplaces: { set: [] },
          },
        });
        break;
      }

      case 'approve': {
        const { workspaceId } = body;
        if (!workspaceId) {
          return NextResponse.json(
            { message: 'workspaceId is required for approval' },
            { status: 400 }
          );
        }

        const workspace = await prisma.companyAddress.findUnique({
          where: { id: workspaceId },
        });
        if (!workspace) {
          return NextResponse.json(
            { message: 'Workspace not found' },
            { status: 404 }
          );
        }

        updatedUser = await prisma.user.update({
          where: { id: adminId },
          data: {
            role: 'admin',
            adminApproved: true,
            workplaces: { set: [{ id: workspaceId }] },
          },
        });
        break;
      }

      case 'changeWorkspace': {
        const { workspaceId } = body;
        if (!workspaceId) {
          return NextResponse.json(
            { message: 'workspaceId is required to change workspace' },
            { status: 400 }
          );
        }

        const workspace = await prisma.companyAddress.findUnique({
          where: { id: workspaceId },
        });
        if (!workspace) {
          return NextResponse.json(
            { message: 'Workspace not found' },
            { status: 404 }
          );
        }

        updatedUser = await prisma.user.update({
          where: { id: adminId },
          data: {
            workplaces: { set: [{ id: workspaceId }] },
          },
        });
        break;
      }

      default:
        return NextResponse.json(
          { message: 'Invalid action. Use "revertToCustomer", "approve", or "changeWorkspace"' },
          { status: 400 }
        );
    }

    // If we reach here, the update succeeded
    return NextResponse.json({ message: 'Operation completed successfully' });
  } catch (error) {
    console.error('Admin operation error:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
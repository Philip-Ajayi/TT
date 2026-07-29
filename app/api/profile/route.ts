// app/api/profile/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateRouteAuth } from '@/lib/auth-util';
import bcrypt from 'bcrypt';

export async function GET() {
  const authCheck = await validateRouteAuth(true);
  if (authCheck.error) return authCheck.error;

  const { id } = authCheck.session.user as any;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        name: true,
        role: true,
        adminApproved: true,
        password: true,
        accounts: {
          where: { provider: 'google' },
          select: { id: true },
        },
        workplaces: {
          select: {
            address: true,
          },
        },
        addressBook: {
          select: {
            id: true,
            label: true,
            address: true,
            isDefault: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    let formattedRole = user.role || 'customer';
    if (formattedRole === 'admin' && !user.adminApproved) {
      formattedRole = 'customer';
    }

    const companyAddressName = user.workplaces?.[0]?.address || null;

    return NextResponse.json({
      name: user.name,
      role: formattedRole,
      companyAddressName,
      hasPassword: !!user.password,
      hasGoogleCredential: user.accounts.length > 0,
      addresses: user.addressBook.map((addr) => ({
        id: addr.id,
        label: addr.label,
        address: addr.address,
        isDefault: addr.isDefault,
      })),
    });
  } catch (error) {
    console.error('GET /api/profile error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authCheck = await validateRouteAuth(true);
  if (authCheck.error) return authCheck.error;

  const { id } = authCheck.session.user as any;

  try {
    const body = await req.json();
    const { action } = body;

    // 1. Change Display Name
    if (action === 'changeName') {
      const { name } = body;
      if (!name || name.trim() === '') {
        return NextResponse.json({ message: 'Name cannot be empty' }, { status: 400 });
      }

      const hasGoogle = await prisma.account.findFirst({
        where: { userId: id, provider: 'google' },
      });
      if (hasGoogle) {
        return NextResponse.json({ message: 'OAuth accounts cannot modify names directly' }, { status: 403 });
      }

      await prisma.user.update({
        where: { id },
        data: { name: name.trim() },
      });
      return NextResponse.json({ message: 'Name updated successfully' });
    }

    // 2. Add New Address
    if (action === 'addAddress') {
      const { label, address, latitude, longitude } = body;
      if (!label || !address) {
        return NextResponse.json({ message: 'Label and Address fields are mandatory' }, { status: 400 });
      }

      if (latitude == null || longitude == null) {
        return NextResponse.json(
          { message: 'Latitude and longitude are required' },
          { status: 400 }
        );
      }

      const existingAddresses = await prisma.customerAddress.findMany({
        where: { userId: id },
      });
      const isDefault = existingAddresses.length === 0;

      try {
        const newAddress = await prisma.customerAddress.create({
          data: {
            userId: id,
            label,
            address,
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            isDefault,
          },
        });
        return NextResponse.json(newAddress);
      } catch (error: any) {
        // Prisma unique constraint violation (userId + label)
        if (error.code === 'P2002') {
          return NextResponse.json(
            { message: 'A label with this name already exists for your account. Please choose a different label.' },
            { status: 400 }
          );
        }
        throw error;
      }
    }

    // 3. Update Address Label
    if (action === 'updateAddressLabel') {
      const { addressId, label } = body;
      if (!addressId) {
        return NextResponse.json({ message: 'Address ID is required' }, { status: 400 });
      }
      if (!label || label.trim() === '') {
        return NextResponse.json({ message: 'Label cannot be empty' }, { status: 400 });
      }

      // Verify ownership
      const existing = await prisma.customerAddress.findFirst({
        where: { id: addressId, userId: id },
      });
      if (!existing) {
        return NextResponse.json({ message: 'Address not found or unauthorized' }, { status: 404 });
      }

      // Check if another address with the same label exists for this user (excluding current)
      const duplicate = await prisma.customerAddress.findFirst({
        where: {
          userId: id,
          label: label.trim(),
          id: { not: addressId },
        },
      });
      if (duplicate) {
        return NextResponse.json(
          { message: 'A label with this name already exists for your account. Please choose a different label.' },
          { status: 400 }
        );
      }

      await prisma.customerAddress.update({
        where: { id: addressId },
        data: { label: label.trim() },
      });

      return NextResponse.json({ message: 'Address label updated successfully' });
    }

    // 4. Change Password
    if (action === 'changePassword') {
      const { oldPassword, newPassword, confirmPassword } = body;
      if (!newPassword || newPassword !== confirmPassword) {
        return NextResponse.json({ message: 'Passwords do not match' }, { status: 400 });
      }

      const user = await prisma.user.findUnique({ where: { id }, select: { password: true } });
      if (!user || !user.password) {
        return NextResponse.json({ message: 'Action not allowed for this account type' }, { status: 403 });
      }

      const match = await bcrypt.compare(oldPassword, user.password);
      if (!match) {
        return NextResponse.json({ message: 'Incorrect existing password' }, { status: 400 });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await prisma.user.update({
        where: { id },
        data: { password: hashedPassword },
      });

      return NextResponse.json({ message: 'Password updated successfully' });
    }

    // 5. Update Profile Picture
    if (action === 'changeImage') {
      const { image } = body;
      await prisma.user.update({
        where: { id },
        data: { image },
      });
      return NextResponse.json({ message: 'Profile image updated successfully' });
    }

    return NextResponse.json({ message: 'Invalid action provided' }, { status: 400 });
  } catch (error) {
    console.error('POST /api/profile error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const authCheck = await validateRouteAuth(true);
  if (authCheck.error) return authCheck.error;

  const { id } = authCheck.session.user as any;

  try {
    const { addressId } = await req.json();

    const target = await prisma.customerAddress.findFirst({
      where: { id: addressId, userId: id },
    });

    if (!target) {
      return NextResponse.json({ message: 'Address not found or unauthorized' }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.customerAddress.updateMany({
        where: { userId: id },
        data: { isDefault: false },
      }),
      prisma.customerAddress.update({
        where: { id: addressId },
        data: { isDefault: true },
      }),
    ]);

    return NextResponse.json({ message: 'Default address updated successfully' });
  } catch (error) {
    console.error('PUT /api/profile error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const authCheck = await validateRouteAuth(true);
  if (authCheck.error) return authCheck.error;

  const { id } = authCheck.session.user as any;
  const { searchParams } = new URL(req.url);
  const addressId = searchParams.get('addressId');

  if (!addressId) {
    return NextResponse.json({ message: 'Missing addressId param' }, { status: 400 });
  }

  try {
    const target = await prisma.customerAddress.findFirst({
      where: { id: addressId, userId: id },
    });

    if (!target) {
      return NextResponse.json({ message: 'Address not found or unauthorized' }, { status: 404 });
    }

    await prisma.customerAddress.delete({ where: { id: addressId } });

    const remainingAddresses = await prisma.customerAddress.findMany({
      where: { userId: id },
    });

    if (remainingAddresses.length > 0) {
      const hasDefault = remainingAddresses.some(addr => addr.isDefault);
      if (!hasDefault) {
        const randomIndex = Math.floor(Math.random() * remainingAddresses.length);
        const newDefault = remainingAddresses[randomIndex];
        await prisma.customerAddress.update({
          where: { id: newDefault.id },
          data: { isDefault: true },
        });
      }
    }

    return NextResponse.json({ message: 'Address removed successfully' });
  } catch (error) {
    console.error('DELETE /api/profile error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
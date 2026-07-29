import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateRouteAuth } from '@/lib/auth-util';
import bcrypt from 'bcryptjs';

// GET: Fetches the current user profile metadata along with association states
export async function GET(req: Request) {
  const authCheck = await validateRouteAuth(true);
  if (authCheck.error) return authCheck.error;

  const currentUserId = (authCheck.session.user as any).id;

  try {
    const user = await prisma.user.findUnique({
      where: { id: currentUserId },
      include: { accounts: true },
    });

    if (!user) {
      return NextResponse.json({ message: 'Profile record not found' }, { status: 404 });
    }

    // Determine configuration properties
    const hasGoogleAssociated = user.accounts.some((acc) => acc.provider === 'google');
    const hasEmailPasswordAssociated = !!user.password;

    return NextResponse.json({
      name: user.name,
      email: user.email,
      role: user.role,
      image: user.image,
      isGoogleAssociated: hasGoogleAssociated,
      isEmailPasswordAssociated: hasEmailPasswordAssociated,
    });
  } catch (error) {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT: Updates user name, password (verifying old password), and/or profile image
export async function PUT(req: Request) {
  const authCheck = await validateRouteAuth(true);
  if (authCheck.error) return authCheck.error;

  const currentUserId = (authCheck.session.user as any).id;

  try {
    const { name, oldPassword, newPassword, image } = await req.json();

    // Fetch user alongside provider records to check constraints
    const user = await prisma.user.findUnique({
      where: { id: currentUserId },
      include: { accounts: true },
    });

    if (!user) {
      return NextResponse.json({ message: 'Profile record not found' }, { status: 404 });
    }

    const hasGoogleAssociated = user.accounts.some((acc) => acc.provider === 'google');
    const hasEmailPasswordAssociated = !!user.password;

    const updateData: any = {};

    // 1. Validate and check Name modifications
    if (name !== undefined) {
      if (hasGoogleAssociated) {
        return NextResponse.json({
          message: 'Name modifications are blocked for accounts using external Google authentication.',
        }, { status: 400 });
      }
      if (!name.trim()) {
        return NextResponse.json({ message: 'Name string field cannot be blank.' }, { status: 400 });
      }
      updateData.name = name.trim();
    }

    // 2. Validate and check Password mutations
    if (newPassword !== undefined || oldPassword !== undefined) {
      if (!hasEmailPasswordAssociated) {
        return NextResponse.json({
          message: 'Password mutations are blocked for accounts lacking registered baseline credentials.',
        }, { status: 400 });
      }

      if (!oldPassword || !newPassword) {
        return NextResponse.json({
          message: 'Both fields "oldPassword" and "newPassword" must be supplied to execute credentials changes.',
        }, { status: 400 });
      }

      // Verify old password accuracy match
      const isValidPassword = await bcrypt.compare(oldPassword, user.password!);
      if (!isValidPassword) {
        return NextResponse.json({ message: 'The provided old password input is incorrect.' }, { status: 400 });
      }

      if (newPassword.trim().length < 6) {
        return NextResponse.json({ message: 'The new password must contain at least 6 characters.' }, { status: 400 });
      }

      updateData.password = await bcrypt.hash(newPassword.trim(), 10);
    }

    // 3. Validate and check Profile Image adjustments
    if (image !== undefined) {
      updateData.image = image; // Can pass string URL or null
    }

    // Guard if object payload received is empty
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: 'No valid modification arguments supplied.' }, { status: 400 });
    }

    // **FIX: Actually update the user in the database**
    await prisma.user.update({
      where: { id: currentUserId },
      data: updateData,
    });

    return NextResponse.json({ message: 'Profile Updated successfully' });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
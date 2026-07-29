//app/api/auth/verify-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SUPERADMIN_EMAILS } from '@/lib/constants';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(new URL('/login?error=MissingToken', req.url));
    }

    // Find and validate the verification token record
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken || verificationToken.expires < new Date()) {
      return NextResponse.redirect(new URL('/login?error=InvalidOrExpiredToken', req.url));
    }

    const email = verificationToken.identifier.toLowerCase();
    const isSuperAdminEmail = SUPERADMIN_EMAILS.includes(email);

    // Update user status and auto-approve if they are found within the superadmin array
    await prisma.$transaction([
      prisma.user.update({
        where: { email },
        data: {
          emailVerified: new Date(),
          role: isSuperAdminEmail ? 'superadmin' : undefined,
          adminApproved: isSuperAdminEmail ? true : undefined,
        },
      }),
      prisma.verificationToken.delete({
        where: { token },
      }),
    ]);

    return NextResponse.redirect(new URL('/login?verified=true', req.url));
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.redirect(new URL('/login?error=ServerError', req.url));
  }
}
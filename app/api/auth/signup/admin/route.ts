//app/app/api/auth/signup/admin/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import { sendVerificationEmail } from '@/lib/email';
import { signupSchema } from '@/lib/utils/validation';
import { rateLimiter } from '@/lib/utils/rate-limit';
import { SUPERADMIN_EMAILS } from '@/lib/constants';
import { randomUUID } from 'crypto';

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    if (!rateLimiter(ip, 5, 60000)) {
      return NextResponse.json({ error: 'Too many requests. Please slow down.' }, { status: 429 });
    }

    const body = await request.json();
    const result = signupSchema.safeParse(body);
        if (!result.success) {
        // Changed result.error.errors to result.error.issues
        return NextResponse.json({ error: 'Invalid input data', details: result.error.issues }, { status: 400 });
        }

    const email = result.data.email.trim().toLowerCase();
    const { password } = result.data;
    const isSuperAdminEmail = SUPERADMIN_EMAILS.includes(email);
    const hashedPassword = await hash(password, 10);

    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: { accounts: true },
    });

    if (existingUser) {
      // Rule Exception: Is superadmin email but role is not superadmin? Immediate update!
      if (isSuperAdminEmail && existingUser.role !== 'superadmin') {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { role: 'superadmin', adminApproved: true },
        });
        existingUser.role = 'superadmin';
      }

      const isOAuthOnly = existingUser.accounts.length > 0 && !existingUser.password;

      // Rule: If email exists and role is customer, update to admin
      if (existingUser.role === 'customer' && !isOAuthOnly) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { role: 'admin', adminApproved: isSuperAdminEmail },
        });

        if (!existingUser.emailVerified) {
            const token = randomUUID();
          await prisma.verificationToken.upsert({
            where: { identifier_token: { identifier: email, token } },
            update: { expires: new Date(Date.now() + 24 * 60 * 60 * 1000) },
            create: { identifier: email, token, expires: new Date(Date.now() + 24 * 60 * 60 * 1000) },
          });
          await sendVerificationEmail(email, token);
        }

        if (!isSuperAdminEmail && !existingUser.adminApproved) {
          return NextResponse.json({ message: 'Role updated to admin. Please contact or wait for admin approval.' }, { status: 200 });
        }
        return NextResponse.json({ message: 'Role updated to admin.' }, { status: 200 });
      }

      // Rule: Handle OAuth (Gmail) with no standard password configuration setup yet
      if (isOAuthOnly) {
        const token = crypto.randomUUID();
        await prisma.$transaction([
          prisma.user.update({
            where: { id: existingUser.id },
            data: { 
              password: hashedPassword,
              role: isSuperAdminEmail ? 'superadmin' : 'admin',
              adminApproved: isSuperAdminEmail
            },
          }),
          prisma.verificationToken.upsert({
            where: { identifier_token: { identifier: email, token } },
            update: { expires: new Date(Date.now() + 24 * 60 * 60 * 1000) },
            create: { identifier: email, token, expires: new Date(Date.now() + 24 * 60 * 60 * 1000) },
          }),
        ]);

        await sendVerificationEmail(email, token);

        if (!isSuperAdminEmail) {
          return NextResponse.json({ message: 'Account updated. Please check email to verify, then wait for admin approval.' }, { status: 200 });
        }
        return NextResponse.json({ message: 'Account updated successfully.' }, { status: 200 });
      }

      // Rule: If role is admin or superadmin already, process standard verification check or block
      if (['admin', 'superadmin'].includes(existingUser.role)) {
        if (!existingUser.emailVerified) {
          const token = crypto.randomUUID();
          await prisma.verificationToken.upsert({
            where: { identifier_token: { identifier: email, token } },
            update: { expires: new Date(Date.now() + 24 * 60 * 60 * 1000) },
            create: { identifier: email, token, expires: new Date(Date.now() + 24 * 60 * 60 * 1000) },
          });
          await sendVerificationEmail(email, token);
          return NextResponse.json({ message: 'Already registered. Verification email resent.' }, { status: 200 });
        }

        if (!existingUser.adminApproved) {
          return NextResponse.json({ error: 'Already registered. Please wait for admin approval.' }, { status: 400 });
        }

        return NextResponse.json({ error: 'Email is already registered.' }, { status: 400 });
      }
    }

    // New User Creation flow for Admin Route
    const finalRole = isSuperAdminEmail ? 'superadmin' : 'admin';
    const finalApproval = isSuperAdminEmail;

    const token = crypto.randomUUID();
    await prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role: finalRole,
          adminApproved: finalApproval,
        },
      });

      await tx.verificationToken.create({
        data: {
          identifier: email,
          token,
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
    });

    await sendVerificationEmail(email, token);

    if (!finalApproval) {
      return NextResponse.json({ message: 'Admin registration requested. Please verify your email and wait for admin approval.' }, { status: 201 });
    }

    return NextResponse.json({ message: 'Superadmin account created and verified.' }, { status: 201 });

  } catch (error) {
    console.error('Admin signup error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
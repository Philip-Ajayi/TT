//app/api/auth/signup/customer/route.ts
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
    // 1. Get Client IP for Rate Limiting
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    if (!rateLimiter(ip, 5, 60000)) {
      return NextResponse.json({ error: 'Too many requests. Please slow down.' }, { status: 429 });
    }

    // 2. Parse and Validate Body
    const body = await request.json();
    const result = signupSchema.safeParse(body);
    if (!result.success) {
    // Changed result.error.errors to result.error.issues
    return NextResponse.json({ error: 'Invalid input data', details: result.error.issues }, { status: 400 });
    }

    const email = result.data.email.trim().toLowerCase();
    const { password } = result.data;
    const isSuperAdminEmail = SUPERADMIN_EMAILS.includes(email);

    // 3. Check for existing user
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: { accounts: true },
    });

    const hashedPassword = await hash(password, 10);

    if (existingUser) {
      // Rule Exception: Is superadmin email but role is not superadmin? Immediate update!
      if (isSuperAdminEmail && existingUser.role !== 'superadmin') {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { role: 'superadmin', adminApproved: true },
        });
        existingUser.role = 'superadmin';
      }

      // Check if signed up via OAuth (Google) but has NO password credentials setup yet
      const isOAuthOnly = existingUser.accounts.length > 0 && !existingUser.password;

      if (isOAuthOnly) {
        // Create token for email verification
        const token = randomUUID();
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        await prisma.$transaction([
          prisma.user.update({
            where: { id: existingUser.id },
            data: { password: hashedPassword },
          }),
          prisma.verificationToken.upsert({
            where: { identifier_token: { identifier: email, token } },
            update: { expires },
            create: { identifier: email, token, expires },
          }),
        ]);

        await sendVerificationEmail(email, token);
        return NextResponse.json({ message: 'Account updated with password. Please verify your email.' }, { status: 200 });
      }

      // If password already exists and role is anything valid, say it's already registered
      if (['admin', 'customer', 'superadmin'].includes(existingUser.role)) {
        // Wait, if email verification is false, trigger verification instead
        if (!existingUser.emailVerified) {
          const token = crypto.randomUUID();
          await prisma.verificationToken.upsert({
            where: { identifier_token: { identifier: email, token } },
            update: { expires: new Date(Date.now() + 24 * 60 * 60 * 1000) },
            create: { identifier: email, token, expires: new Date(Date.now() + 24 * 60 * 60 * 1000) },
          });
          await sendVerificationEmail(email, token);
          return NextResponse.json({ message: 'User already registered. Verification email resent.' }, { status: 200 });
        }

        return NextResponse.json({ error: 'Email is already registered.' }, { status: 400 });
      }
    }

    // 4. Create standard new Customer User
    const finalRole = isSuperAdminEmail ? 'superadmin' : 'customer';
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
    return NextResponse.json({ message: 'User created. Please check your email for verification.' }, { status: 201 });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
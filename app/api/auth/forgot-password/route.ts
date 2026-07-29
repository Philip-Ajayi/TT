//app/api/auth/forgot-password/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/email';
import { rateLimiter } from '@/lib/utils/rate-limit';
import { randomUUID } from 'crypto';

export async function POST(request: Request) {
  try {
    // 1. Rate Limit check based on client IP
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    if (!rateLimiter(ip, 3, 60000)) { // Strict limit: 3 requests per minute
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    // 2. Parse payload safely
    const body = await request.json();
    if (!body.email || typeof body.email !== 'string') {
      return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 });
    }

    const email = body.email.trim().toLowerCase();

    // 3. Look up user record
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Security best practice: Always return a 200 generic message even if email doesn't exist 
    // to prevent malicious actors from performing user enumeration attacks.
    if (!user) {
      return NextResponse.json({ message: 'If email exists, reset link sent.' });
    }

    // 4. RULE: Only allow password reset if user has an active password (Ignore OAuth-only accounts)
    if (!user.password) {
      return NextResponse.json({ 
        error: 'This account uses Google Sign-In. Please log in using Google.' 
      }, { status: 400 });
    }

    // 5. Generate and store token expiring in 1 hour
    const token = randomUUID();
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordResetToken.upsert({
      where: { identifier_token: { identifier: email, token } },
      update: { expires },
      create: { identifier: email, token, expires },
    });

    // 6. Fire off Resend utility
    await sendPasswordResetEmail(email, token);

    return NextResponse.json({ message: 'If email exists, reset link sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
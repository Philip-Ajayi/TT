//app/api/auth/reset-password/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import { resetPasswordSchema } from '@/lib/utils/validation';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Validate payload structure using Zod
    const result = resetPasswordSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid data format.', details: result.error.issues }, { status: 400 });
    }

    const { password, token } = result.data;

    // 2. Look up token in DB
    const resetTokenRecord = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    // If token doesn't exist or has expired
    if (!resetTokenRecord || resetTokenRecord.expires < new Date()) {
      return NextResponse.json({ error: 'Token is invalid or has expired.' }, { status: 400 });
    }

    const email = resetTokenRecord.identifier.toLowerCase();
    const hashedPassword = await hash(password, 10);

    // 3. Atomically update password and destroy token
    await prisma.$transaction([
      prisma.user.update({
        where: { email },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.delete({
        where: { token },
      }),
    ]);

    return NextResponse.json({ message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
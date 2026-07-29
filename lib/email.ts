//lib/email.ts
import { Resend } from 'resend';

// Initialize Resend with your API key from environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

// Use a verified domain in production, or Resend's default testing address in staging/dev
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function sendVerificationEmail(email: string, token: string) {
  const verificationLink = `${APP_URL}/api/auth/verify-email?token=${token}`;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Verify your email address',
      html: `
        <h1>Welcome!</h1>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="${verificationLink}" style="padding: 10px 20px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
        <p>If the button doesn't work, copy and paste this URL into your browser:</p>
        <p>${verificationLink}</p>
      `,
    });
  } catch (error) {
    console.error('Failed to send verification email via Resend:', error);
    throw new Error('Email delivery failed');
  }
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetLink = `${APP_URL}/reset-password?token=${token}`;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Reset your password',
      html: `
        <h1>Password Reset Request</h1>
        <p>You requested to reset your password. Click the link below to proceed:</p>
        <a href="${resetLink}" style="padding: 10px 20px; background-color: #000000; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
        <p>This link will expire shortly. If you did not make this request, you can safely ignore this email.</p>
        <p>${resetLink}</p>
      `,
    });
  } catch (error) {
    console.error('Failed to send password reset email via Resend:', error);
    throw new Error('Email delivery failed');
  }
}

export async function sendAdminNotification(email: string, subject: string, html: string) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `[Admin Alert] ${subject}`,
      html: html,
    });
  } catch (error) {
    console.error('Failed to send admin notification email via Resend:', error);
  }
}
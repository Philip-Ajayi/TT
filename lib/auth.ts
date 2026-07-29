// lib/auth.ts
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { compare } from 'bcryptjs';
import { randomUUID } from 'crypto';

import { authConfig, type ExtendedUser } from './auth.config';
import { prisma } from './prisma';
import { SUPERADMIN_EMAILS } from './constants';
import { rateLimiter } from './utils/rate-limit';
import { sendVerificationEmail } from './email';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma as any) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: 'customer',
          adminApproved: false,
        };
      },
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = (credentials?.email as string | undefined)?.trim().toLowerCase();
        const password = credentials?.password as string | undefined;

        if (!email || !password) {
          throw new Error('Email and password are required.');
        }

        if (!rateLimiter(`login:${email}`, 5, 60000)) {
          throw new Error('Too many login attempts. Please wait a minute.');
        }

        const user = await prisma.user.findUnique({
          where: { email },
          include: { accounts: true },
        });

        if (!user) {
          throw new Error('Invalid email or password.');
        }

        if (!user.password && user.accounts.length > 0) {
          throw new Error('This account is registered via Google. Please sign in with Gmail instead.');
        }

        const isValidPassword = await compare(password, user.password || '');
        if (!isValidPassword) {
          throw new Error('Invalid email or password.');
        }

        const hasGmail = user.accounts.some(acc => acc.provider === 'google');
        if (!hasGmail && !user.emailVerified) {
          const token = randomUUID();
          await prisma.verificationToken.upsert({
            where: { identifier_token: { identifier: email, token } },
            update: { expires: new Date(Date.now() + 24 * 60 * 60 * 1000) },
            create: { identifier: email, token, expires: new Date(Date.now() + 24 * 60 * 60 * 1000) },
          });
          await sendVerificationEmail(email, token);
          throw new Error('Your email is not verified. A verification link has been resent.');
        }

        if (user.role === 'admin' && !user.adminApproved) {
          throw new Error('Your account is awaiting admin approval.');
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          adminApproved: user.adminApproved,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account, request }: any) {
      if (account?.provider === 'credentials') {
        return true;
      }

      if (account?.provider === 'google' && user.email) {
        const email = user.email.trim().toLowerCase();
        const isSuperAdminEmail = SUPERADMIN_EMAILS.includes(email);

        if (!rateLimiter(`oauth:${email}`, 5, 60000)) {
          return false; 
        }

        const url = request?.url ? new URL(request.url) : null;
        const targetRole = url?.searchParams.get('role') === 'admin' ? 'admin' : 'customer';

        const existingUser = await prisma.user.findUnique({
          where: { email },
          include: { accounts: true },
        });

        if (existingUser) {
          const holdsGoogleAccount = existingUser.accounts.some(acc => acc.provider === 'google');
          let updatedRole = existingUser.role;
          let updatedApproval = existingUser.adminApproved;

          if (!holdsGoogleAccount && existingUser.password) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { emailVerified: existingUser.emailVerified || new Date() },
            });
          }

          if (isSuperAdminEmail) {
            updatedRole = 'superadmin';
            updatedApproval = true;
          } else if (targetRole === 'admin') {
            if (existingUser.role === 'customer') {
              updatedRole = 'admin';
              updatedApproval = false; 
            }
          } 

          if (updatedRole !== existingUser.role || updatedApproval !== existingUser.adminApproved) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { role: updatedRole, adminApproved: updatedApproval },
            });
          }

          (user as ExtendedUser).role = updatedRole;
          (user as ExtendedUser).adminApproved = updatedApproval;

          if (updatedRole === 'admin' && !updatedApproval) {
            throw new Error('Your account is awaiting admin approval.');
          }

          return true;
        } else {
          let assignedRole = targetRole;
          let assignedApproval = targetRole === 'admin' ? false : true; 

          if (isSuperAdminEmail) {
            assignedRole = 'superadmin';
            assignedApproval = true;
          }

          (user as ExtendedUser).role = assignedRole;
          (user as ExtendedUser).adminApproved = assignedApproval;
          (user as ExtendedUser).emailVerified = new Date();

          if (assignedRole === 'admin' && !assignedApproval) {
            throw new Error('Your account is awaiting admin approval.');
          }
        }
      }

      return true;
    },
  },
});
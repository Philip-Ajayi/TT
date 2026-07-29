// app/lib/auth.config.ts
import type { NextAuthConfig, User as NextAuthUser } from 'next-auth';

export interface ExtendedUser extends NextAuthUser {
  id?: string;
  role?: string;
  adminApproved?: boolean;
  password?: string | null;
  emailVerified?: Date | null;
}

export const authConfig = {
  providers: [], // Keep empty here; populated inside the full runtime config
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as ExtendedUser).role || 'customer';
        token.adminApproved = (user as ExtendedUser).adminApproved ?? false;
      }

      if (trigger === 'update' && session) {
        return { ...token, ...session };
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).adminApproved = token.adminApproved;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login', 
  },
  session: { strategy: 'jwt' },
} satisfies NextAuthConfig;
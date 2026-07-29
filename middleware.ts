// middleware.ts
import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import { authConfig } from '@/lib/auth.config';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isAuthenticated = !!req.auth;
  const userRole = (req.auth?.user as any)?.role; // 'customer' | 'admin' | 'superadmin'

  const currentPath = nextUrl.pathname;

  // --- ROUTE CATEGORIES ---

  // Admin routes accessible to both admin & superadmin
  const isAdminBothRoute =
    currentPath === '/admin' ||
    currentPath.startsWith('/admin/profile') ||
    currentPath.startsWith('/admin/orders');

  // All other /admin/* routes → superadmin only
  const isSuperAdminOnlyRoute =
    currentPath.startsWith('/admin') && !isAdminBothRoute;

  // Customer-facing routes (any authenticated user)
  const isCustomerProtectedRoute =
    currentPath.startsWith('/orders') ||
    currentPath.startsWith('/service') ||
    currentPath.startsWith('/profile');

  // --- AUTHENTICATION CHECK ---
  if (!isAuthenticated) {
    // Any protected route (admin or customer) → redirect to login
    if (isAdminBothRoute || isSuperAdminOnlyRoute || isCustomerProtectedRoute) {
      // Use a single sign‑in page (NextAuth default)
      return NextResponse.redirect(new URL('/auth/signin', nextUrl));
      // If you still have a separate /login page, change to:
      // return NextResponse.redirect(new URL('/login', nextUrl));
    }
    return NextResponse.next(); // public routes
  }

  // --- AUTHORIZATION CHECKS ---

  // 1. Superadmin‑only routes
  if (isSuperAdminOnlyRoute) {
    if (userRole !== 'superadmin') {
      return NextResponse.redirect(new URL('/unauthorized', nextUrl));
    }
    return NextResponse.next();
  }

  // 2. Admin‑both routes (dashboard, profile, orders)
  if (isAdminBothRoute) {
    if (userRole !== 'admin' && userRole !== 'superadmin') {
      return NextResponse.redirect(new URL('/unauthorized', nextUrl));
    }
    // Optional: also check adminApproved for regular admins
    // if (userRole === 'admin' && !(req.auth?.user as any)?.adminApproved) { ... }
    return NextResponse.next();
  }

  // 3. Customer routes – already authenticated, allow all roles
  if (isCustomerProtectedRoute) {
    return NextResponse.next();
  }

  // Fallthrough (public pages like /, /auth/signin, etc.)
  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
};
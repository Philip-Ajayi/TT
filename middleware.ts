// middleware.ts
import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import { authConfig } from '@/lib/auth.config'; 

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isAuthenticated = !!req.auth;
  const userRole = (req.auth?.user as any)?.role;
  const isAdminApproved = (req.auth?.user as any)?.adminApproved;

  const currentPath = nextUrl.pathname;

  // 1. EXACT ROUTE PATTERN MATCHING BASED ON YOUR LIST
  const isSuperAdminRoute = 
    currentPath.startsWith('/address') || 
    currentPath.startsWith('/admin-list');

  const isAdminRoute = 
    currentPath.startsWith('/all-order') || 
    currentPath.startsWith('/cloths/') || 
    currentPath.startsWith('/currency') || 
    currentPath.startsWith('/delivery') || 
    currentPath.startsWith('/discount') || 
    currentPath.startsWith('/notification') || 
    currentPath.startsWith('/processing');

  const isCustomerProtectedRoute = 
    currentPath.startsWith('/order') || 
    currentPath.startsWith('/profile') || 
    currentPath.startsWith('/service');

  // Combine all protected routes for generic authentication checks
  const isProtectedRoute = isSuperAdminRoute || isAdminRoute || isCustomerProtectedRoute;

  // 2. REDIRECTION LOGIC

  // Unauthenticated users trying to access protected content
  if (!isAuthenticated) {
    if (isProtectedRoute) {
      // Direct admins/superadmins to a dedicated admin login, and customers to general login
      if (isAdminRoute || isSuperAdminRoute) {
        return NextResponse.redirect(new URL('/admin/login', nextUrl));
      }
      return NextResponse.redirect(new URL('/login', nextUrl));
    }
    return NextResponse.next();
  }

  // Superadmin Guard
  if (isSuperAdminRoute) {
    if (userRole !== 'superadmin') {
      return NextResponse.redirect(new URL('/unauthorized', nextUrl));
    }
    return NextResponse.next();
  }

  // Admin Guard (Superadmins are explicitly granted fallback access here)
  if (isAdminRoute) {
    const hasAdminAccess = userRole === 'superadmin' || (userRole === 'admin' && isAdminApproved);
    if (!hasAdminAccess) {
      return NextResponse.redirect(new URL('/unauthorized', nextUrl));
    }
    return NextResponse.next();
  }

  // Fallthrough for authenticated users on customer/public routes
  return NextResponse.next();
});

export const config = {
  // Keeps middleware from running on static assets and API routes
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
};
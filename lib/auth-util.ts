// lib/auth-util.ts
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function validateRouteAuth(allowCustomer = false) {
  const session = await auth();
  
  if (!session || !session.user) {
    return { error: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }), session: null };
  }

  const { role, adminApproved } = session.user as any;

  if (['superadmin', 'admin'].includes(role)) {
    if (role === 'admin' && !adminApproved) {
      return { error: NextResponse.json({ message: 'Awaiting admin approval' }, { status: 403 }), session: null };
    }
    return { error: null, session };
  }

  if (allowCustomer && role === 'customer') {
    return { error: null, session };
  }

  return { error: NextResponse.json({ message: 'Forbidden' }, { status: 403 }), session: null };
}
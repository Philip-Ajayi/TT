// app/api/cron/keep-alive/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: Request) {
  // Validate request authorization from Vercel Cron
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const results: Record<string, string> = {};

  // 1. Ping Prisma / PostgreSQL Database
  try {
    await prisma.$queryRaw`SELECT 1`;
    results.prisma = 'Database query executed successfully';
  } catch (error: any) {
    console.error('Prisma keep-alive error:', error);
    results.prisma = `Failed: ${error.message}`;
  }

  // 2. Ping Supabase Storage API
  try {
    await supabaseAdmin.storage.listBuckets();
    results.supabaseStorage = 'Storage API called successfully';
  } catch (error: any) {
    console.error('Supabase keep-alive error:', error);
    results.supabaseStorage = `Failed: ${error.message}`;
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    status: results,
  });
}

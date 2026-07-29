//app\api\upload\route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateRouteAuth } from '@/lib/auth-util';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/constants';

// Instantiate bucket client connection context
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// POST: Accepts a file asset buffer payload and streams directly to Supabase storage container
export async function POST(req: Request) {
  // Pass false to require an active approved administrative user tier
  const authCheck = await validateRouteAuth(false);
  if (authCheck.error) return authCheck.error;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ message: 'No valid file asset binary encountered in request stream' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Construct standard sanitized unique filename key paths
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExtension}`;
    
    // Stream directly into asset container bucket
    const { data, error } = await supabase.storage
      .from('cloth-images')
      .upload(`catalog/${uniqueFileName}`, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      return NextResponse.json({ message: 'Storage container pipe deployment failed', error: error.message }, { status: 500 });
    }

    // Extract fully formatted public access absolute paths
    const { data: publicUrlData } = supabase.storage
      .from('cloth-images')
      .getPublicUrl(`catalog/${uniqueFileName}`);

    return NextResponse.json({ 
      message: 'Asset catalog asset uploaded successfully', 
      imageUrl: publicUrlData.publicUrl 
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Internal Server Error parsing multi-part stream' }, { status: 500 });
  }
}
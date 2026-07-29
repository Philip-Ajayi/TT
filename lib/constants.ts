// App constants: superadmin emails from env, default currency, etc.
export const SUPERADMIN_EMAILS = process.env.SUPERADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) ?? [];
export const DEFAULT_CURRENCY = 'NGN';
export const MAX_COMPLAINTS_PER_ORDER = 2;
export const DELIVERY_CODE_LENGTH = 6;
export const SUPABASE_URL: string = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY: string = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn(
      'Warning: Supabase credentials are not fully defined in your environmental properties. Storage streaming may break.'
    );
  }
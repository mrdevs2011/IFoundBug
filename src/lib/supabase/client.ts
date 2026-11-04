import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabasePublishableKey &&
  !supabaseUrl.includes('YOUR_PROJECT_REF') &&
  !supabaseUrl.includes('your-project-id') &&
  !supabasePublishableKey.includes('REPLACE_WITH_PROJECT_KEY')
);

export const supabase = isSupabaseConfigured
  ? createBrowserClient(supabaseUrl, supabasePublishableKey, {
      realtime: { params: { eventsPerSecond: 10 } },
    })
  : null;

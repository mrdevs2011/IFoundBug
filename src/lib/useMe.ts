'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { getMe, type Me } from '@/lib/db';

/** undefined = still checking, null = logged out. */
export function useMe(): Me | null | undefined {
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    const load = () => getMe().then((m) => { if (alive) setMe(m); }).catch(() => { if (alive) setMe(null); });
    load();
    const sub = supabase?.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') load();
    });
    return () => { alive = false; sub?.data.subscription.unsubscribe(); };
  }, []);
  return me;
}

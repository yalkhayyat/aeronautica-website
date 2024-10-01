import { useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useSession } from '@clerk/nextjs';

export function useClerkSupabaseClient() {
  const { session } = useSession();

  const supabaseClient = useMemo(() => {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_KEY!,
      {
        global: {
          fetch: async (url, options = {}) => {
            const clerkToken = await session?.getToken({
              template: 'aeronautica-website-supabase', // Your JWT template name
            });

            const headers = new Headers(options?.headers);
            headers.set('Authorization', `Bearer ${clerkToken}`);

            return fetch(url, {
              ...options,
              headers,
            });
          },
        },
      }
    );
  }, [session]);

  return supabaseClient;
}
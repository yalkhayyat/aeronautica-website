"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { useSession } from "@clerk/nextjs";

if (
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.NEXT_PUBLIC_SUPABASE_KEY
) {
  throw new Error("Missing Supabase environment variables");
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY;

// Initialize Supabase client with default (anonymous) configuration
let supabase = createClient(supabaseUrl, supabaseKey);

interface SupabaseContextType {
  supabase: SupabaseClient;
}

const SupabaseContext = createContext<SupabaseContextType>({ supabase });

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const { session } = useSession();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (session && !isInitialized) {
      // Recreate Supabase client with authenticated configuration
      supabase = createClient(supabaseUrl, supabaseKey, {
        global: {
          fetch: async (url, options = {}) => {
            const clerkToken = await session.getToken({
              template: "aeronautica-website-supabase", // Your JWT template name
            });

            const headers = new Headers(options?.headers);
            headers.set("Authorization", `Bearer ${clerkToken}`);

            return fetch(url, {
              ...options,
              headers,
            });
          },
        },
      });
      setIsInitialized(true);
    }
  }, [session, isInitialized]);

  return (
    <SupabaseContext.Provider value={{ supabase }}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  return useContext(SupabaseContext).supabase;
}

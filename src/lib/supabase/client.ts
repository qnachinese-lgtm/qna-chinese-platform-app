"use client";

import { createBrowserClient } from "@supabase/ssr";

/** Supabase client dùng trong Client Component / 前端元件用 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

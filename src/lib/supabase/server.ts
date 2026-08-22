import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Supabase client dùng trong Server Component / Route Handler.
 * 伺服器端用。RLS 依然生效——這裡用的是 anon key，不是 service role。
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Được gọi từ Server Component — middleware sẽ làm mới session.
            // 從 Server Component 呼叫時會擲錯，交由 middleware 更新 session。
          }
        },
      },
    }
  );
}

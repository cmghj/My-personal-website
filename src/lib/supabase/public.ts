import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig, hasSupabaseConfig } from "./config";

export function createPublicClient(revalidateSeconds?: number) {
  if (!hasSupabaseConfig()) return null;

  const { url, publishableKey } = getSupabaseConfig();
  return createClient(url, publishableKey, {
    // 发布状态可以直接在 Supabase 改变。公开文章和相册要以本次查询为准。
    global: {
      fetch: (input, init) => fetch(input, revalidateSeconds === undefined
        ? { ...init, cache: "no-store" }
        : { ...init, next: { revalidate: revalidateSeconds } }),
    },
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

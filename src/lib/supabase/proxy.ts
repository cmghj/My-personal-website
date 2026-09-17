import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig, hasSupabaseConfig } from "./config";

export async function updateSession(request: NextRequest) {
  if (!hasSupabaseConfig()) return NextResponse.next({ request });

  const pathname = request.nextUrl.pathname;
  const isLoginPage = pathname === "/studio/login";
  const hasAuthCookie = request.cookies
    .getAll()
    .some(({ name }) => name.startsWith("sb-") && name.includes("-auth-token"));

  // 明确没有登录 cookie 时无需请求 Supabase：登录页直接显示，其余后台页直接跳转。
  if (!hasAuthCookie) {
    if (isLoginPage) return NextResponse.next({ request });

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/studio/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  let response = NextResponse.next({ request });
  const { url, publishableKey } = getSupabaseConfig();

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }

        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const { data: claimData } = await supabase.auth.getClaims();
  const claims = claimData?.claims ?? null;

  if (!claims && !isLoginPage) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/studio/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (claims && isLoginPage) {
    const studioUrl = request.nextUrl.clone();
    studioUrl.pathname = "/studio";
    studioUrl.search = "";
    return NextResponse.redirect(studioUrl);
  }

  return response;
}

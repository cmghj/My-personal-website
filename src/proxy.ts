import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // 登录页是公开静态入口；其余工作台页面才需要经过身份校验。
  matcher: ["/studio", "/studio/((?!login(?:/|$)).*)"],
};

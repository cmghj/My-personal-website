import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getStudioAccess() {
  const supabase = await createClient();
  const { data: claimData, error: claimsError } = await supabase.auth.getClaims();
  const claims = claimData?.claims ?? null;

  if (claimsError || !claims) {
    return {
      supabase,
      claims: null,
      isOwner: false,
      setupError: null,
    };
  }

  const { data: isOwner, error: setupError } = await supabase.rpc(
    "is_site_owner",
  );

  return {
    supabase,
    claims,
    isOwner: isOwner === true,
    setupError,
  };
}

export async function requireOwner() {
  const access = await getStudioAccess();

  if (!access.claims) redirect("/studio/login");
  if (access.setupError) {
    throw new Error("Supabase 数据库尚未完成初始化。请先运行项目中的迁移脚本。");
  }
  if (!access.isOwner) {
    throw new Error("当前登录用户尚未被设置为网站所有者。");
  }

  return access;
}

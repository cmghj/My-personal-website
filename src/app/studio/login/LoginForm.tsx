"use client";

import { useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useNavigationNotice } from "../FeedbackForm";

export default function LoginForm() {
  const searchParams = useSearchParams();
  const logoutNotice = useNavigationNotice(searchParams.get("logout") === "local"
    ? "此浏览器已退出。其他设备的登录状态暂未确认。"
    : undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    try {
      const { error: signInError } = await createClient().auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(signInError.code === "invalid_credentials" || signInError.message === "Invalid login credentials"
          ? "邮箱或密码不正确，请重试。"
          : "暂时无法登录，请稍后重试。");
        setLoading(false);
        return;
      }
    } catch {
      setError("暂时无法连接登录服务，请检查网络后重试。");
      setLoading(false);
      return;
    }

    const requestedPath = searchParams.get("next") ?? "/studio";
    const destination = requestedPath.startsWith("/studio") ? requestedPath : "/studio";
    // 登录后用刚写入的 cookie 请求工作台，丢弃访客状态的路由预取结果。
    window.location.replace(destination);
  }

  return (
    <form method="post" onSubmit={handleSubmit} className="mt-8 space-y-5">
      {logoutNotice && <p role="status" className="rounded-lg border border-line bg-paper px-4 py-3 text-sm">{logoutNotice}</p>}
      <div>
        <label htmlFor="email" className="studio-label">
          后台邮箱
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="studio-input"
          placeholder="输入你的邮箱"
        />
      </div>

      <div>
        <label htmlFor="password" className="studio-label">
          密码
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            className="studio-input pr-16"
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-ink"
          >
            {showPassword ? "隐藏" : "显示"}
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <button type="submit" disabled={loading} className="studio-primary-button w-full">
        {loading ? "正在进入…" : "进入我的工作台"}
      </button>
    </form>
  );
}

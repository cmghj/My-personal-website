"use client";

import { useState } from "react";

export default function CopyUrlButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button type="button" onClick={copy} className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs text-accent transition-colors hover:bg-amber-100">
      {copied ? "已复制" : "复制网址"}
    </button>
  );
}

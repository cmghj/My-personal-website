"use client";

import { useState } from "react";

export default function CopyUrlButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const [manual, setManual] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setManual(false);
    } catch {
      setManual(true);
    }
  }

  return (
    <>
      <button type="button" onClick={copy} onBlur={() => setCopied(false)} aria-live="polite"
        className="rounded-lg bg-paper px-2.5 py-2 text-xs text-accent hover:text-accent-strong">
        {copied ? "已复制" : "复制网址"}
      </button>
      {manual && (
        <label className="w-full text-xs text-muted">
          手动复制网址
          <input readOnly value={url} onFocus={(event) => event.currentTarget.select()}
            className="studio-input mt-1" />
        </label>
      )}
    </>
  );
}

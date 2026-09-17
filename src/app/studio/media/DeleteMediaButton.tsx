"use client";

import { deleteMedia } from "@/app/studio/actions";

export default function DeleteMediaButton({ id, name }: { id: string; name: string }) {
  return (
    <form action={deleteMedia}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="rounded-lg px-2.5 py-1.5 text-xs text-red-600 transition-colors hover:bg-red-50 hover:text-red-800"
        onClick={(event) => {
          if (!window.confirm(`确定永久删除“${name}”吗？如果它正在用作文章封面或正文图片，对应位置也会失效。`)) {
            event.preventDefault();
          }
        }}
      >
        删除
      </button>
    </form>
  );
}

"use client";

import { permanentlyDeleteEntry, restoreEntry } from "@/app/studio/actions";

export default function TrashActions({ id }: { id: string }) {
  return (
    <div className="flex items-center gap-2">
      <form action={restoreEntry}>
        <input type="hidden" name="id" value={id} />
        <button className="studio-secondary-button !px-3 !py-2">恢复</button>
      </form>
      <form action={permanentlyDeleteEntry}>
        <input type="hidden" name="id" value={id} />
        <button
          className="rounded-lg px-3 py-2 text-sm text-red-700 transition-colors hover:bg-red-50"
          onClick={(event) => {
            if (!window.confirm("永久删除后无法恢复，确定继续吗？")) event.preventDefault();
          }}
        >
          永久删除
        </button>
      </form>
    </div>
  );
}

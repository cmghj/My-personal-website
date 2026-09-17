"use client";

import { restoreEntryRevision } from "@/app/studio/actions";
import FormSubmitButton from "../../../FormSubmitButton";

export default function RestoreRevisionButton({
  entryId,
  revisionId,
}: {
  entryId: string;
  revisionId: number;
}) {
  return (
    <form
      action={restoreEntryRevision}
      onSubmit={(event) => {
        if (!window.confirm("要恢复到这个版本吗？当前内容会先自动保存为一个历史版本，不会丢失。")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="entryId" value={entryId} />
      <input type="hidden" name="revisionId" value={revisionId} />
      <FormSubmitButton
        idleLabel="恢复此版本"
        pendingLabel="正在恢复…"
        className="studio-secondary-button !px-3 !py-2 text-xs"
      />
    </form>
  );
}

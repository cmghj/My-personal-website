import { permanentlyDeleteEntry, restoreEntry } from "@/app/studio/actions";
import FeedbackForm from "../FeedbackForm";

export default function TrashActions({ id }: { id: string }) {
  return (
    <div className="flex items-center gap-2">
      <FeedbackForm action={restoreEntry} label="恢复" pendingLabel="正在恢复…" pageNotice
        buttonClassName="studio-secondary-button !px-3 !py-2">
        <input type="hidden" name="id" value={id} />
      </FeedbackForm>
      <FeedbackForm action={permanentlyDeleteEntry} label="永久删除" pendingLabel="正在删除…" pageNotice
        buttonClassName="rounded-lg px-3 py-2 text-sm text-red-700 hover:bg-red-50"
        confirmMessage="永久删除后无法恢复，确定继续吗？">
        <input type="hidden" name="id" value={id} />
      </FeedbackForm>
    </div>
  );
}

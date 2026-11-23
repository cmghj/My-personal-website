import { restoreEntryRevision } from "@/app/studio/actions";
import FeedbackForm from "../../../FeedbackForm";

export default function RestoreRevisionButton({
  entryId,
  revisionId,
}: {
  entryId: string;
  revisionId: number;
}) {
  return (
    <FeedbackForm action={restoreEntryRevision} label="恢复此版本" pendingLabel="正在恢复…" pageNotice
      buttonClassName="studio-secondary-button !px-3 !py-2 text-xs"
      confirmMessage="要恢复到这个版本吗？当前内容会先自动保存为一个历史版本，不会丢失。"
    >
      <input type="hidden" name="entryId" value={entryId} />
      <input type="hidden" name="revisionId" value={revisionId} />
    </FeedbackForm>
  );
}

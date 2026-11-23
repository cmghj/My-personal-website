"use client";

import { unstable_rethrow } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import FormSubmitButton from "./FormSubmitButton";
import type { ActionFeedback } from "./actions";

const PageFeedback = createContext<(feedback: ActionFeedback | null) => void>(() => {});

export function useNavigationNotice(message?: string) {
  const [notice] = useState(message);
  useEffect(() => {
    if (!message) return;
    const url = new URL(window.location.href);
    for (const key of ["created", "saved", "restored", "trashed"]) url.searchParams.delete(key);
    if (url.search !== window.location.search) window.history.replaceState(null, "", url);
  }, [message]);
  return notice;
}

export function FeedbackMessage({ feedback }: { feedback: ActionFeedback }) {
  return (
    <p className="studio-feedback" data-result={feedback.ok ? "success" : "error"} role={feedback.ok ? "status" : "alert"}>
      <span aria-hidden="true">{feedback.ok ? "✓" : "!"}</span>
      {feedback.message}
    </p>
  );
}

export function NavigationFeedback({ message }: { message: string }) {
  const notice = useNavigationNotice(message);
  return notice ? <FeedbackMessage feedback={{ ok: true, message: notice }} /> : null;
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [feedback, setFeedback] = useState<ActionFeedback | null>(null);
  return (
    <PageFeedback.Provider value={setFeedback}>
      {children}
      {feedback && (
        <div className="studio-feedback-toast">
          <FeedbackMessage feedback={feedback} />
          <button type="button" aria-label="关闭提示" onClick={() => setFeedback(null)}>×</button>
        </div>
      )}
    </PageFeedback.Provider>
  );
}

export default function FeedbackForm({ action, children, label, pendingLabel, className, buttonClassName, pageNotice, confirmMessage }: {
  action: (data: FormData) => Promise<ActionFeedback>;
  children?: ReactNode;
  label: string;
  pendingLabel: string;
  className?: string;
  buttonClassName?: string;
  pageNotice?: boolean;
  confirmMessage?: string;
}) {
  const notify = useContext(PageFeedback);
  const [feedback, setFeedback] = useState<ActionFeedback | null>(null);
  const [dirty, setDirty] = useState(false);
  const edits = useRef(0);
  const report = pageNotice ? notify : setFeedback;

  async function submit(data: FormData) {
    const submittedEdits = edits.current;
    let result: ActionFeedback;
    try {
      result = await action(data);
    } catch (error) {
      unstable_rethrow(error);
      result = { ok: false, message: "暂时无法确认操作结果，请检查网络后重试。" };
    }
    // 请求发出后又改过表单时，保留新的未保存状态。
    if (result.ok && edits.current !== submittedEdits) return;
    report(result);
    if (result.ok) setDirty(false);
  }

  return (
    <form action={submit} className={className}
      onSubmit={(event) => {
        if (confirmMessage && !window.confirm(confirmMessage)) {
          event.preventDefault();
          return;
        }
        report(null);
        setDirty(false);
      }}
      onChange={() => { edits.current++; setDirty(true); setFeedback(null); }}
      onReset={(event) => event.preventDefault()}
    >
      {children}
      {!pageNotice && (feedback ? <FeedbackMessage feedback={feedback} /> : dirty && <p className="studio-unsaved">有尚未保存的修改</p>)}
      <FormSubmitButton idleLabel={label} pendingLabel={pendingLabel} className={buttonClassName} />
    </form>
  );
}

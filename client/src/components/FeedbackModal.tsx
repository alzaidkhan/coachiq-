import { useEffect, useRef, useState } from "react";
import { Check, MessageCircle, Send, X } from "lucide-react";

type FeedbackTopic = "Suggestion" | "Issue" | "Other";

export function FeedbackModal({ onClose }: { onClose: () => void }) {
  const [topic, setTopic] = useState<FeedbackTopic>("Suggestion");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    lastActiveElement.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape" && status !== "submitting") onClose(); };
    window.addEventListener("keydown", onKeyDown);
    return () => { window.removeEventListener("keydown", onKeyDown); lastActiveElement.current?.focus(); };
  }, [onClose, status]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const note = message.trim();
    if (note.length < 8) {
      setError("Please add at least 8 characters so we can understand your note.");
      return;
    }
    setStatus("submitting");
    setError("");
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, message: note, source: "public-launch" }),
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(data?.error || "CoachIQ could not receive that note. Please try again.");
      }
      setStatus("success");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "CoachIQ could not receive that note.");
      setStatus("error");
    }
  };

  return <div className="feedback-backdrop" role="dialog" aria-modal="true" aria-labelledby="feedback-title"><section className="feedback-modal"><button ref={closeRef} onClick={onClose} disabled={status === "submitting"} className="feedback-close" aria-label="Close feedback form"><X size={18} /></button>{status === "success" ? <div className="feedback-success"><span><Check size={20} /></span><div className="scroll-kicker"><i />NOTE RECEIVED</div><h2 id="feedback-title">Thanks for making CoachIQ better.</h2><p>Your feedback has been received by the CoachIQ team. We review launch notes to improve the next release.</p><button onClick={onClose} className="scroll-action is-solid">Back to CoachIQ</button></div> : <><div className="feedback-icon"><MessageCircle size={20} /></div><div className="scroll-kicker"><i />FIELD NOTE / FEEDBACK</div><h2 id="feedback-title">What should<br /><em>we improve?</em></h2><p>Report an issue, share an idea, or tell us what made your training week easier.</p><form onSubmit={submit}><fieldset disabled={status === "submitting"}><legend>Type of note</legend><div className="feedback-topic-row">{(["Suggestion", "Issue", "Other"] as FeedbackTopic[]).map((value) => <button type="button" key={value} onClick={() => setTopic(value)} aria-pressed={topic === value} className={topic === value ? "is-selected" : ""}>{value}</button>)}</div><label htmlFor="feedback-message">Your note<textarea id="feedback-message" value={message} maxLength={1200} onChange={(event) => setMessage(event.target.value)} placeholder="A clear description helps us act on it." /></label></fieldset>{error && <p className="feedback-error" role="alert">{error}</p>}<button type="submit" className="scroll-action is-solid" disabled={status === "submitting"}>{status === "submitting" ? <><span className="feedback-loader" aria-hidden="true" />Sending your note…</> : <>Send feedback <Send size={15} /></>}</button><p className="feedback-privacy">Please do not include private health, payment, or password details.</p></form></>}</section></div>;
}

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, ClipboardList, KeyRound, Loader2, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { useLocation } from "wouter";

type FeedbackStatus = "new" | "reviewed" | "resolved";
type FeedbackRecord = { id: number; topic: string; message: string; source: string; status: FeedbackStatus; createdAt: string; updatedAt: string };

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown date" : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default function Admin() {
  const [, setLocation] = useLocation();
  const [accessKey, setAccessKey] = useState("");
  const [verified, setVerified] = useState(false);
  const [checking, setChecking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackRecord[]>([]);
  const [filter, setFilter] = useState<FeedbackStatus | "all">("all");
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const headers = useCallback(() => ({ "x-coachiq-admin-key": accessKey, "Content-Type": "application/json" }), [accessKey]);
  const loadFeedback = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/admin/feedback", { headers: headers() });
      const payload = await response.json() as { feedback?: FeedbackRecord[]; error?: string };
      if (!response.ok || !payload.feedback) throw new Error(payload.error || "Feedback could not be loaded.");
      setFeedback(payload.feedback);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Feedback could not be loaded.");
    } finally { setLoading(false); }
  }, [headers]);

  useEffect(() => { if (verified) void loadFeedback(); }, [verified, loadFeedback]);

  const verify = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!accessKey.trim()) { setError("Enter your owner access code."); return; }
    setChecking(true); setError("");
    try {
      const response = await fetch("/api/admin/health", { headers: headers() });
      if (!response.ok) throw new Error("That owner access code was not accepted.");
      setVerified(true);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Owner access could not be verified."); } finally { setChecking(false); }
  };
  const updateStatus = async (id: number, status: FeedbackStatus) => {
    setActionId(id); setError("");
    try {
      const response = await fetch(`/api/admin/feedback/${id}`, { method: "PATCH", headers: headers(), body: JSON.stringify({ status }) });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Feedback status could not be updated.");
      setFeedback((current) => current.map((item) => item.id === id ? { ...item, status } : item));
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Feedback status could not be updated."); } finally { setActionId(null); }
  };
  const remove = async (id: number) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }
    setConfirmDeleteId(null);
    setActionId(id); setError("");
    try {
      const response = await fetch(`/api/admin/feedback/${id}`, { method: "DELETE", headers: headers() });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Feedback could not be deleted.");
      setFeedback((current) => current.filter((item) => item.id !== id));
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Feedback could not be deleted."); } finally { setActionId(null); }
  };
  const signOut = () => { setAccessKey(""); setVerified(false); setFeedback([]); setFilter("all"); setError(""); };
  const visibleFeedback = useMemo(() => filter === "all" ? feedback : feedback.filter((item) => item.status === filter), [feedback, filter]);
  const counts = useMemo(() => ({ all: feedback.length, new: feedback.filter((item) => item.status === "new").length, reviewed: feedback.filter((item) => item.status === "reviewed").length, resolved: feedback.filter((item) => item.status === "resolved").length }), [feedback]);

  if (!verified) return <main className="admin-gate"><section className="admin-gate-card"><button onClick={() => setLocation("/")} className="legal-back"><ArrowLeft size={15} /> Back to CoachIQ</button><span className="admin-icon"><KeyRound size={21} /></span><div className="scroll-kicker"><i />OWNER AREA</div><h1>Feedback,<br /><em>kept private.</em></h1><p>Enter the owner access code to review and manage notes submitted through CoachIQ’s public feedback form.</p><form onSubmit={verify}><label>Owner access code<input type="password" autoComplete="current-password" value={accessKey} onChange={(event) => setAccessKey(event.target.value)} placeholder="Enter private access code" /></label>{error && <p role="alert" className="admin-error">{error}</p>}<button className="scroll-action is-solid" disabled={checking}>{checking ? <><Loader2 size={15} className="animate-spin" /> Checking access…</> : <>Open feedback desk <ShieldCheck size={15} /></>}</button></form><small>This code is checked securely on the server with constant-time verification and held only in current page memory. Refreshing locks the desk again.</small></section></main>;

  return <main className="admin-page"><header className="admin-header"><button onClick={() => setLocation("/")} className="legal-brand"><span>COACH<span>IQ</span></span><small>OWNER FEEDBACK DESK</small></button><div><button onClick={() => void loadFeedback()} className="legal-back" disabled={loading}><RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh</button><button onClick={signOut} className="legal-back">Lock desk</button></div></header><section className="admin-intro"><div><div className="scroll-kicker"><i />OWNER / FEEDBACK MANAGEMENT</div><h1>Listen. Sort.<br /><em>Make the next release better.</em></h1><p>Feedback is stored securely in CoachIQ’s database. Mark notes as reviewed or resolved, or remove spam and test records when they are no longer useful.</p></div><div className="admin-stats"><div><b>{counts.all}</b><span>Total notes</span></div><div><b>{counts.new}</b><span>New</span></div><div><b>{counts.resolved}</b><span>Resolved</span></div></div></section><section className="admin-content"><div className="admin-toolbar"><div className="admin-filters" role="tablist" aria-label="Filter feedback">{(["all", "new", "reviewed", "resolved"] as const).map((status) => <button key={status} role="tab" aria-selected={filter === status} onClick={() => setFilter(status)}>{status === "all" ? `All (${counts.all})` : `${status[0].toUpperCase()}${status.slice(1)} (${counts[status]})`}</button>)}</div><span>{loading ? "Loading feedback…" : `${visibleFeedback.length} note${visibleFeedback.length === 1 ? "" : "s"} shown`}</span></div>{error && <div role="alert" className="admin-error admin-alert">{error}</div>}{loading ? <div className="admin-skeletons" aria-label="Loading feedback"><div /><div /><div /></div> : visibleFeedback.length ? <div className="admin-list">{visibleFeedback.map((item) => <article key={item.id} className="admin-note"><div className="admin-note-meta"><span className={`admin-status status-${item.status}`}>{item.status}</span><span>{item.topic}</span><span>{formatDate(item.createdAt)}</span><span>Source: {item.source}</span></div><p>{item.message}</p><div className="admin-note-actions"><label>Status<select value={item.status} disabled={actionId === item.id} onChange={(event) => void updateStatus(item.id, event.target.value as FeedbackStatus)}>{(["new", "reviewed", "resolved"] as FeedbackStatus[]).map((status) => <option key={status}>{status}</option>)}</select></label><button onClick={() => void remove(item.id)} disabled={actionId === item.id} className={`admin-delete ${confirmDeleteId === item.id ? "bg-red-700 text-white font-bold" : ""}`}><Trash2 size={14} /> {confirmDeleteId === item.id ? "Confirm delete?" : "Delete"}</button></div></article>)}</div> : <div className="admin-empty"><ClipboardList size={22} /><div><b>No feedback in this view.</b><p>Try another status, or wait for a player to send a note from the public feedback form.</p></div></div>}</section></main>;
}

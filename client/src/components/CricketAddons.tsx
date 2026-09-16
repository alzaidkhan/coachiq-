// CoachIQ cricket extensions: browser-local scorecards, profile-aware AI guidance, and filtered analytics.
import { useEffect, useMemo, useRef, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, BarChart3, Bot, BrainCircuit, CalendarDays, Check, ChevronRight, Edit3, Flame, Gauge, History, MessageCircle, MessageSquarePlus, Plus, Send, ShieldCheck, Sparkles, Target, Trash2, Trophy, User, X, Zap } from "lucide-react";
import { ballsToOvers, economyFor, oversToBalls, validateScorecard } from "../lib/cricketStats";
import { chartThemes, getChartThemeStorage, readChartTheme, writeChartTheme, type ChartThemeId } from "../lib/chartThemes";
import { bowlingPhasePerformance, dismissalTrend } from "../lib/matchAnalytics";
import { normalizeBowlingSpells, spellTotals, type BowlingSpell } from "../lib/matchModel";
import { portableAssets } from "../lib/portableAssets";
import { handleAssetImageError } from "../lib/media";
import { addMessageToSession, clearSessionMessages, createNewSession, deleteChatSession, loadChatStore, saveChatStore, type ChatMessage, type ChatSession, type CoachChatStore } from "../lib/coachChatStore";

type CoachProfile = { name: string; age: string; gender: string; region: string; heightCm: string; weightKg: string; role: string; battingHand: string; bowlingStyle: string; level: string; goal: string; sessions: string; minutes: string; diet: string; equipment: string; improvementNote: string };
type Match = { id: string; date: string; opponent?: string; venue?: string; format?: string; dismissalType?: string; bowlingPhase?: string; bowlingSpells?: BowlingSpell[]; runs: number; ballsFaced: number; fours: number; sixes: number; wickets: number; overs: number; runsConceded: number; maidens: number; catches: number; runOuts: number };
type ActivityLog = { sessions: { id: string; date: string; drillId: string; minutes: number }[]; matches: Match[] };
type MatchDraft = Omit<Match, "id" | "date"> & { date?: string };
type Section = "basics" | "batting" | "bowling" | "fielding";
type SpellValues = { id: string; phase: string; overs: string; wickets: string; runsConceded: string; maidens: string };

const dismissalTypes = ["Not out", "Bowled", "Caught", "LBW", "Run out", "Stumped", "Hit wicket", "Retired hurt"];
const bowlingPhases = ["Powerplay", "Middle overs", "Death"];
type ChartTheme = (typeof chartThemes)[ChartThemeId];
const chartTooltip = (theme: ChartTheme) => ({ borderRadius: 12, border: `1px solid ${theme.grid}`, background: theme.tooltip, fontSize: 12 });
const number = (value: string) => Number.isFinite(Number(value)) ? Number(value) : 0;
const formatDate = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short" });

function IconBadge({ children, tone = "orange" }: { children: React.ReactNode; tone?: "orange" | "green" | "blue" }) { const tones = { orange: "bg-[#fff0e7] text-[#d65a20]", green: "bg-[#e8f0e8] text-[#365b44]", blue: "bg-[#e8f1f5] text-[#3b6e82]" }; return <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${tones[tone]}`}>{children}</span>; }

export function AICoachView({ profile, activity }: { profile: CoachProfile; activity: ActivityLog }) {
  const [store, setStore] = useState<CoachChatStore>(() => loadChatStore());
  const [showHistory, setShowHistory] = useState(false);
  const [question, setQuestion] = useState("");
  const [isResponding, setIsResponding] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeSession = useMemo(() => {
    return store.sessions.find((session) => session.id === store.activeSessionId) || store.sessions[0];
  }, [store]);

  const messages = activeSession ? activeSession.messages : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isResponding]);

  const handleNewChat = () => {
    const newSession = createNewSession();
    const updated: CoachChatStore = {
      sessions: [newSession, ...store.sessions],
      activeSessionId: newSession.id,
    };
    setStore(updated);
    saveChatStore(updated);
    setError("");
    setQuestion("");
    setShowHistory(false);
  };

  const handleSelectSession = (sessionId: string) => {
    const updated: CoachChatStore = { ...store, activeSessionId: sessionId };
    setStore(updated);
    saveChatStore(updated);
    setError("");
    setShowHistory(false);
  };

  const handleDeleteSession = (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const { sessions, nextActiveId } = deleteChatSession(store.sessions, sessionId);
    const updated: CoachChatStore = {
      sessions,
      activeSessionId: store.activeSessionId === sessionId ? nextActiveId : store.activeSessionId,
    };
    setStore(updated);
    saveChatStore(updated);
  };

  const handleClearCurrentSession = () => {
    if (!activeSession) return;
    const sessions = clearSessionMessages(store.sessions, activeSession.id);
    const updated: CoachChatStore = { ...store, sessions };
    setStore(updated);
    saveChatStore(updated);
  };

  const ask = async (prompt = question) => {
    const clean = prompt.trim();
    if (!clean || isResponding) return;
    setError("");

    const targetSessionId = activeSession ? activeSession.id : store.sessions[0]?.id;
    if (!targetSessionId) return;

    // Add user message to persistent store
    const { sessions: userSessions } = addMessageToSession(store.sessions, targetSessionId, { role: "user", text: clean });
    const storeWithUser: CoachChatStore = {
      ...store,
      sessions: userSessions,
      activeSessionId: targetSessionId,
    };
    setStore(storeWithUser);
    saveChatStore(storeWithUser);
    setQuestion("");
    setIsResponding(true);

    try {
      const response = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: clean, profile, activity })
      });
      const payload = await response.json() as { answer?: string; error?: string };
      if (!response.ok || !payload.answer) throw new Error(payload.error || "CoachIQ could not finish that answer.");

      const { sessions: coachSessions } = addMessageToSession(storeWithUser.sessions, targetSessionId, { role: "coach", text: payload.answer as string });
      const storeWithCoach: CoachChatStore = {
        ...storeWithUser,
        sessions: coachSessions,
      };
      setStore(storeWithCoach);
      saveChatStore(storeWithCoach);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "CoachIQ could not answer right now.");
    } finally {
      setIsResponding(false);
    }
  };

  const prompts = [
    "How should my height and role change this week’s training?",
    "What should I adjust for my match stamina goal?",
    "What should I log after a match?"
  ];

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_.72fr]">
      <section className="paper-card relative overflow-hidden flex flex-col">
        {/* Header with Navigation and Chat Session Management */}
        <div className="border-b border-[#eee6de] bg-[#1d3024] p-5 text-[#f4eee5] sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="eyebrow text-[#b6c8ba]">CoachIQ AI Coach · profile-aware</div>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-[-0.05em]">
                Ask better questions.<br />Get a clearer next rep.
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleNewChat}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#e66a2c] px-3 py-2 text-xs font-bold text-white shadow transition hover:bg-[#d65a20] active:scale-95"
                title="Start a new chat"
              >
                <Plus size={15} /> New Chat
              </button>
              <button
                type="button"
                onClick={() => setShowHistory((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition ${
                  showHistory
                    ? "border-white bg-white/20 text-white"
                    : "border-white/20 bg-white/10 text-[#d0dbd0] hover:bg-white/15"
                }`}
                title="View previous chats"
              >
                <History size={15} /> History ({store.sessions.length})
              </button>
            </div>
          </div>
          <p className="mt-4 max-w-xl text-sm leading-6 text-[#c8d5ca]">
            Conversations persist automatically in this browser. Switching views or closing the app keeps your chat history intact.
          </p>
        </div>

        {/* History Drawer / Panel */}
        {showHistory && (
          <div className="border-b border-[#eee6de] bg-[#f7f4ef] p-4 sm:p-5 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#e5dcce]">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#73685e]">
                <History size={14} /> Saved Chat History
              </div>
              <button
                type="button"
                onClick={() => setShowHistory(false)}
                className="rounded-lg p-1 text-[#8b837b] hover:bg-[#eae4d9]"
                aria-label="Close history"
              >
                <X size={16} />
              </button>
            </div>
            <div className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1">
              {store.sessions.map((session) => {
                const isActive = session.id === store.activeSessionId;
                return (
                  <div
                    key={session.id}
                    onClick={() => handleSelectSession(session.id)}
                    className={`group flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-2.5 text-xs transition ${
                      isActive
                        ? "border-[#e66a2c] bg-[#fff3ec] font-bold text-[#b45124] shadow-sm"
                        : "border-[#e8dfd5] bg-white text-[#4f5951] hover:border-[#cfc3b5] hover:bg-[#faf7f2]"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{session.title}</div>
                      <div className="mt-0.5 text-[11px] text-[#938a81]">
                        {session.messages.length} {session.messages.length === 1 ? "message" : "messages"} ·{" "}
                        {new Date(session.updatedAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </div>
                    </div>
                    {store.sessions.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSession(session.id, e)}
                        className="rounded-lg p-1.5 text-[#9b9289] opacity-0 transition hover:bg-[#fedbd0] hover:text-[#b45124] group-hover:opacity-100"
                        title="Delete chat session"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Message Thread */}
        <div className="min-h-[340px] max-h-[520px] flex-1 space-y-4 overflow-y-auto p-5 sm:p-7">
          {messages.length === 0 ? (
            <div className="grid min-h-[260px] place-items-center text-center">
              <div>
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#fff0e7] text-[#d65a20]">
                  <MessageCircle size={26} />
                </div>
                <h3 className="mt-5 font-display text-2xl font-semibold tracking-[-0.04em]">What are you working on?</h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#8b837b]">
                  Ask about batting, bowling, training load, recovery, match preparation, nutrition, or your next focus.
                </p>
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={`${message.role}-${index}-${message.timestamp}`}
                className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "coach" && (
                  <div className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#1d3024] text-[#f4eee5]">
                    <Bot size={16} />
                  </div>
                )}
                <div
                  className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                    message.role === "user"
                      ? "bg-[#e66a2c] text-white"
                      : "border border-[#e9dfd5] bg-[#fcfaf7] text-[#334237]"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))
          )}

          {isResponding && (
            <div className="flex items-center gap-3 text-sm font-bold text-[#9a674b]">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-[#fff0e7]">
                <BrainCircuit size={15} className="animate-pulse text-[#e66a2c]" />
              </span>
              CoachIQ is reviewing your player card and preparing your tailored guidance…
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-[#edcfbd] bg-[#fff4ed] p-3.5 text-sm text-[#a4512b] shadow-sm">
              <p className="font-semibold">{error}</p>
              <p className="mt-1 text-xs text-[#8a4220]">
                If the quota is exceeded, please wait a few moments before sending your next question.
              </p>
            </div>
          )}

          <div ref={messagesEndRef} />

          {messages.length > 0 && !isResponding && (
            <div className="flex items-center justify-between border-t border-[#eee6de] pt-3 text-xs text-[#958d84]">
              <span>Active Chat: <strong className="text-[#3b473e]">{activeSession?.title}</strong></span>
              <button
                type="button"
                onClick={handleClearCurrentSession}
                className="text-button text-xs hover:text-[#b45124]"
              >
                <X size={13} /> Clear this session's messages
              </button>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="border-t border-[#eee6de] bg-white p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap gap-2">
            {prompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => ask(prompt)}
                className="prompt-chip"
                disabled={isResponding}
              >
                {prompt}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-[#e2d8ce] bg-[#fcfaf7] p-2 focus-within:border-[#e66a2c] focus-within:ring-2 focus-within:ring-[#e66a2c]/20">
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  ask();
                }
              }}
              className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-[#a0968b]"
              placeholder="Ask a cricket question or request a drill recommendation…"
              disabled={isResponding}
            />
            <button
              onClick={() => ask()}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#e66a2c] text-white transition hover:bg-[#d65a20] disabled:opacity-40"
              disabled={!question.trim() || isResponding}
              aria-label="Ask CoachIQ"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      </section>

      {/* Side Coach Context & Quick Tips */}
      <aside className="space-y-5">
        <section className="note-card p-5 sm:p-6">
          <div className="eyebrow mb-2 text-[#b46a44]">Player context sent with every question</div>
          <h3 className="font-display text-2xl font-semibold tracking-[-0.04em]">
            {profile.name || "Player"}, {profile.role}
          </h3>
          <p className="mt-3 text-sm leading-6 text-[#765d4f]">
            The coach connects your frame, training frequency, cricket role, and goal before suggesting the next action.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold text-[#9a674b]">
            <span className="rounded-full bg-white/70 px-2.5 py-1">{profile.heightCm || "—"} cm</span>
            <span className="rounded-full bg-white/70 px-2.5 py-1">{profile.weightKg || "—"} kg</span>
            <span className="rounded-full bg-white/70 px-2.5 py-1">{profile.sessions} sessions/week</span>
            <span className="rounded-full bg-white/70 px-2.5 py-1">{profile.level}</span>
          </div>
        </section>

        <section className="paper-card p-5 sm:p-6">
          <div className="eyebrow mb-3">Useful match reflection cues</div>
          {[
            "What did I repeat well in today’s match?",
            "Where did the game change for me?",
            "What is one technical cue for next week?"
          ].map((prompt) => (
            <button
              key={prompt}
              onClick={() => ask(prompt)}
              className="flex w-full items-center gap-3 border-b border-[#eee6de] py-3 text-left text-sm font-bold text-[#4c554e] transition hover:text-[#b45124] last:border-b-0"
              disabled={isResponding}
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-[#e8f0e8] text-[#3d6046]">
                <ChevronRight size={14} />
              </span>
              {prompt}
            </button>
          ))}
        </section>

        <div className="flex items-start gap-2 px-1 text-[11px] leading-5 text-[#9b9188]">
          <ShieldCheck size={13} className="mt-0.5 shrink-0 text-[#5b8065]" />
          CoachIQ provides general cricket coaching and wellness education, not medical diagnosis or treatment.
        </div>
      </aside>
    </div>
  );
}


const dashboardInsightCache = new Map<string, string>();

export function DashboardView({ profile, activity: allActivity, onAddMatch, onEditMatch, onDeleteMatch }: { profile: CoachProfile; activity: ActivityLog; onAddMatch: () => void; onEditMatch: (match: Match) => void; onDeleteMatch: (match: Match) => void }) {
  const [formatFilter, setFormatFilter] = useState("All formats"); const [dateFrom, setDateFrom] = useState(""); const [dateTo, setDateTo] = useState(""); const [insight, setInsight] = useState(""); const [insightError, setInsightError] = useState(""); const [insightLoading, setInsightLoading] = useState(false); const [insightRefresh, setInsightRefresh] = useState(0); const [themeId, setThemeId] = useState<ChartThemeId>(() => readChartTheme(getChartThemeStorage())); const theme = chartThemes[themeId]; const changeTheme = (next: ChartThemeId) => { setThemeId(next); writeChartTheme(getChartThemeStorage(), next); };
  const formats = useMemo(() => Array.from(new Set(allActivity.matches.map((match) => match.format).filter((format): format is string => Boolean(format)))).sort(), [allActivity.matches]);
  const activity = useMemo(() => ({ ...allActivity, matches: allActivity.matches.filter((match) => (formatFilter === "All formats" || match.format === formatFilter) && (!dateFrom || match.date >= dateFrom) && (!dateTo || match.date <= dateTo)) }), [allActivity, formatFilter, dateFrom, dateTo]);
  const filterLabel = `${formatFilter}${dateFrom || dateTo ? ` · ${dateFrom || "start"} to ${dateTo || "today"}` : " · all dates"}`;
  const insightKey = `${profile.name}|${profile.role}|${profile.goal}|${filterLabel}|${activity.matches.map((match) => match.id).join(",")}`;
  useEffect(() => {
    if (!activity.matches.length) { setInsight(""); setInsightError(""); setInsightLoading(false); return; }
    if (insightRefresh === 0 && dashboardInsightCache.has(insightKey)) {
      setInsight(dashboardInsightCache.get(insightKey)!);
      setInsightError("");
      setInsightLoading(false);
      return;
    }
    const controller = new AbortController();
    setInsightLoading(true); setInsightError("");
    fetch("/api/dashboard-insights", { method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal, body: JSON.stringify({ profile, activity: { sessions: [], matches: activity.matches }, filterLabel }) })
      .then(async (response) => {
        const payload = await response.json() as { answer?: string; error?: string };
        if (!response.ok || !payload.answer) throw new Error(payload.error || "CoachIQ could not prepare an insight.");
        return payload.answer;
      })
      .then((answer) => {
        if (!controller.signal.aborted) {
          dashboardInsightCache.set(insightKey, answer);
          setInsight(answer);
        }
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setInsightError(error instanceof Error ? error.message : "CoachIQ could not prepare an insight.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setInsightLoading(false);
      });
    return () => controller.abort();
  }, [insightKey, insightRefresh]);
  const clearFilters = () => { setFormatFilter("All formats"); setDateFrom(""); setDateTo(""); };
  return (
    <div className="space-y-5">
      <section className="paper-card p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="eyebrow">Performance lens</div>
            <h2 className="mt-1 font-display text-xl font-semibold tracking-[-0.04em]">Filter your match view.</h2>
          </div>
          <p className="max-w-xs text-xs leading-5 text-[#8b837b]">Charts, scorebook, and coaching insights update only from the matches you choose.</p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_auto]">
          <label className="field-label">Match format
            <select className="field-input" aria-label="Filter match format" value={formatFilter} onChange={(event) => setFormatFilter(event.target.value)}>
              <option>All formats</option>
              {formats.map((format) => <option key={format}>{format}</option>)}
            </select>
          </label>
          <label className="field-label">From
            <input className="field-input" aria-label="Matches from" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
          </label>
          <label className="field-label">To
            <input className="field-input" aria-label="Matches to" type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
          </label>
          <button onClick={clearFilters} disabled={formatFilter === "All formats" && !dateFrom && !dateTo} className="ghost-button self-end disabled:cursor-not-allowed disabled:opacity-40">Clear filters</button>
        </div>
        <p className="mt-3 text-xs font-semibold text-[#5c6b61]" role="status">Showing {activity.matches.length} of {allActivity.matches.length} matches · {filterLabel}</p>
      </section>
      <DashboardContent activity={activity} filterLabel={filterLabel} theme={theme} onAddMatch={onAddMatch} onEditMatch={onEditMatch} onDeleteMatch={onDeleteMatch} />
      <DashboardInsight insight={insight} loading={insightLoading} error={insightError} matchCount={activity.matches.length} filterLabel={filterLabel} onRefresh={() => setInsightRefresh((value) => value + 1)} />
    </div>
  );
}

function DashboardContent({ activity, filterLabel, theme, onAddMatch, onEditMatch, onDeleteMatch }: { activity: ActivityLog; filterLabel: string; theme: ChartTheme; onAddMatch: () => void; onEditMatch: (match: Match) => void; onDeleteMatch: (match: Match) => void }) {
  const batting = useMemo(() => activity.matches.slice(-6).map((match, index) => ({ name: `M${index + 1}`, runs: match.runs, boundaries: match.fours + match.sixes })), [activity.matches]); const bowling = useMemo(() => activity.matches.slice(-6).map((match, index) => ({ name: `M${index + 1}`, wickets: match.wickets, economy: economyFor(match.runsConceded, match.overs) === "Not calculated" ? 0 : Number(economyFor(match.runsConceded, match.overs)) })), [activity.matches]); const dismissals = useMemo(() => dismissalTrend(activity.matches), [activity.matches]); const phases = useMemo(() => bowlingPhasePerformance(activity.matches), [activity.matches]);
  const totalRuns = activity.matches.reduce((sum, match) => sum + match.runs, 0); const balls = activity.matches.reduce((sum, match) => sum + match.ballsFaced, 0); const boundaries = activity.matches.reduce((sum, match) => sum + match.fours + match.sixes, 0); const wickets = activity.matches.reduce((sum, match) => sum + match.wickets, 0); const totalBallsBowled = activity.matches.reduce((sum, match) => sum + (oversToBalls(match.overs) ?? 0), 0); const runsConceded = activity.matches.reduce((sum, match) => sum + match.runsConceded, 0); const strikeRate = balls ? Math.round((totalRuns / balls) * 100) : "Not calculated"; const economy = totalBallsBowled ? (runsConceded / (totalBallsBowled / 6)).toFixed(1) : "Not calculated";
  if (!activity.matches.length) return <div className="space-y-5"><section className="dashboard-hero paper-card p-5 sm:p-7"><div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end"><div><div className="eyebrow mb-1">Your game, in loaded data</div><h2 className="font-display text-3xl font-semibold tracking-[-0.05em]">Start with one match.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-[#7d756d]">Add batting, bowling, or both. CoachIQ will calculate your first match snapshot and unlock your trends when there is something real to compare.</p></div><button onClick={onAddMatch} className="primary-button"><CalendarDays size={15} /> Add your first match</button></div><div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Runs" value="0" icon={<Zap size={15} />} /><Metric label="Strike rate" value="—" icon={<Gauge size={15} />} /><Metric label="Wickets" value="0" icon={<Trophy size={15} />} /><Metric label="Economy" value="—" icon={<Flame size={15} />} /></div></section><div className="grid gap-5 xl:grid-cols-2"><ChartCard title="Dismissal trends" eyebrow="How recorded innings have ended" icon={<Target size={19} />} hasData={false} empty="Log a match with dismissal types to see this trend." legendMain="Recorded dismissals" legendSupport="Count"><span /></ChartCard><ChartCard title="Bowling phase performance" eyebrow="Logged spells by their match phase" icon={<Flame size={19} />} hasData={false} empty="Add one or more spells to compare bowling phases." legendMain="Wickets" legendSupport="Economy"><span /></ChartCard></div></div>;
  const latest = activity.matches.at(-1); const bestScore = Math.max(...activity.matches.map((match) => match.runs)); const bestWickets = Math.max(...activity.matches.map((match) => match.wickets));
  return <div className="space-y-5"><section className="dashboard-hero paper-card p-5 sm:p-7"><div className="flex flex-wrap items-end justify-between gap-4"><div><div className="eyebrow mb-1">Loaded match data</div><h2 className="font-display text-3xl font-semibold tracking-[-0.05em]">Your game, in numbers.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-[#7d756d]">Every visual below reflects only the scorecards in your active dashboard filter.</p></div><button onClick={onAddMatch} className="primary-button"><CalendarDays size={15} /> Add match data</button></div><div className="mt-7 grid gap-3 sm:grid-cols-3 lg:grid-cols-6"><Metric label="Runs" value={totalRuns} icon={<Zap size={15} />} /><Metric label="Balls faced" value={balls} icon={<Activity size={15} />} /><Metric label="Boundaries" value={boundaries} icon={<Target size={15} />} /><Metric label="Strike rate" value={strikeRate} icon={<Gauge size={15} />} /><Metric label="Wickets" value={wickets} icon={<Trophy size={15} />} /><Metric label="Economy" value={economy} icon={<Flame size={15} />} /></div></section><section className="grid gap-3 sm:grid-cols-3"><div className="surface-card border-l-4 border-l-[#e66a2c] p-4"><div className="eyebrow">Highest score</div><div className="mt-2 font-display text-3xl font-semibold">{bestScore}</div><p className="mt-1 text-xs text-[#8b837b]">from your {activity.matches.length} selected matches</p></div><div className="surface-card border-l-4 border-l-[#365b44] p-4"><div className="eyebrow">Best wickets</div><div className="mt-2 font-display text-3xl font-semibold">{bestWickets}</div><p className="mt-1 text-xs text-[#8b837b]">in one selected match</p></div><div className="surface-card border-l-4 border-l-[#3b6e82] p-4"><div className="eyebrow">Latest snapshot</div><div className="mt-2 text-sm font-bold">{latest ? `${latest.runs} runs · ${latest.wickets} wickets` : "No scorecard yet"}</div><p className="mt-1 text-xs text-[#8b837b]">{latest ? formatDate(latest.date) : "Add a match to begin"}</p></div></section><div className="grid gap-5 xl:grid-cols-2"><ChartCard title="Batting rhythm" eyebrow="Runs and boundaries by match" icon={<BarChart3 size={19} />} hasData={Boolean(batting.length)} empty="Log a match to see your batting line."><ResponsiveContainer width="100%" height="100%"><LineChart data={batting} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}><CartesianGrid stroke={theme.grid} strokeDasharray="3 5" vertical={false} /><XAxis dataKey="name" tick={{ fill: "#9a9188", fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: "#9a9188", fontSize: 11 }} axisLine={false} tickLine={false} width={28} /><Tooltip contentStyle={chartTooltip(theme)} cursor={{ fill: theme.hover }} /><Line type="monotone" dataKey="runs" stroke={theme.main} strokeWidth={4} dot={{ fill: theme.main, r: 4 }} activeDot={{ r: 6 }} /><Line type="monotone" dataKey="boundaries" stroke={theme.accent} strokeWidth={2} dot={{ fill: theme.accent, r: 3 }} /></LineChart></ResponsiveContainer></ChartCard><ChartCard title="Bowling output" eyebrow="Wickets and economy by match" icon={<Activity size={19} />} hasData={Boolean(bowling.length)} empty="Log bowling figures to see this trend."><ResponsiveContainer width="100%" height="100%"><BarChart data={bowling} barGap={8} barCategoryGap="24%" margin={{ top: 8, right: 12, left: -8, bottom: 0 }}><CartesianGrid stroke={theme.grid} strokeDasharray="3 5" vertical={false} /><XAxis dataKey="name" tick={{ fill: "#9a9188", fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: "#9a9188", fontSize: 11 }} axisLine={false} tickLine={false} width={28} /><Tooltip contentStyle={chartTooltip(theme)} cursor={{ fill: theme.hover }} /><Bar dataKey="wickets" fill={theme.main} radius={[5, 5, 0, 0]} /><Bar dataKey="economy" fill={theme.accent} radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></ChartCard></div><div className="grid gap-5 xl:grid-cols-2"><ChartCard title="Dismissal trends" eyebrow="How recorded innings have ended" icon={<Target size={19} />} hasData={Boolean(dismissals.length)} empty="Choose a dismissal type when you log an innings to see this trend." legendMain="Recorded dismissals" legendSupport="Count"><ResponsiveContainer width="100%" height="100%"><BarChart data={dismissals} barCategoryGap="28%" margin={{ top: 8, right: 12, left: -8, bottom: 0 }}><CartesianGrid stroke={theme.grid} strokeDasharray="3 5" vertical={false} /><XAxis dataKey="name" tick={{ fill: "#9a9188", fontSize: 11 }} axisLine={false} tickLine={false} interval={0} /><YAxis allowDecimals={false} tick={{ fill: "#9a9188", fontSize: 11 }} axisLine={false} tickLine={false} width={28} /><Tooltip contentStyle={chartTooltip(theme)} cursor={{ fill: theme.hover }} /><Bar dataKey="dismissals" name="Dismissals" fill={theme.accent} radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></ChartCard><ChartCard title="Bowling phase performance" eyebrow="Each saved spell grouped by phase" icon={<Flame size={19} />} hasData={Boolean(phases.length)} empty="Add a phase to one or more bowling spells to compare this view." legendMain="Wickets" legendSupport="Economy"><ResponsiveContainer width="100%" height="100%"><BarChart data={phases} barGap={8} barCategoryGap="24%" margin={{ top: 8, right: 12, left: -8, bottom: 0 }}><CartesianGrid stroke={theme.grid} strokeDasharray="3 5" vertical={false} /><XAxis dataKey="name" tick={{ fill: "#9a9188", fontSize: 11 }} axisLine={false} tickLine={false} interval={0} /><YAxis tick={{ fill: "#9a9188", fontSize: 11 }} axisLine={false} tickLine={false} width={28} /><Tooltip contentStyle={chartTooltip(theme)} cursor={{ fill: theme.hover }} /><Bar dataKey="wickets" fill={theme.main} radius={[5, 5, 0, 0]} /><Bar dataKey="economy" fill={theme.accent} radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></ChartCard></div><section className="paper-card p-5 sm:p-6"><div className="flex items-start justify-between"><div><div className="eyebrow mb-1">Data loaded</div><h2 className="font-display text-2xl font-semibold tracking-[-0.04em]">Match-by-match scorebook</h2></div><span className="rounded-full bg-[#e8f0e8] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.13em] text-[#42624a]">{activity.matches.length} matches</span></div><div className="mt-5 overflow-x-auto"><table className="data-table"><thead><tr><th>Date</th><th>Runs</th><th>Dismissal</th><th>Spells</th><th>Wkts</th><th>Overs</th><th>Economy</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{activity.matches.slice().reverse().map((match) => <tr key={match.id}><td>{formatDate(match.date)}</td><td className="font-bold">{match.runs} <span className="font-normal text-[#8b837b]">({match.ballsFaced})</span></td><td>{match.dismissalType || "—"}</td><td>{match.bowlingSpells?.length || 0}</td><td>{match.wickets}</td><td>{ballsToOvers(oversToBalls(match.overs) ?? 0)}</td><td>{economyFor(match.runsConceded, match.overs)}</td><td><div className="flex gap-2"><button onClick={() => onEditMatch(match)} className="text-button text-xs" aria-label={`Edit match from ${formatDate(match.date)}`}><Edit3 size={13} /> Edit</button><button onClick={() => onDeleteMatch(match)} className="text-button text-xs text-[#b45124]" aria-label={`Delete match from ${formatDate(match.date)}`}><Trash2 size={13} /> Delete</button></div></td></tr>)}</tbody></table></div></section></div>;
}

function DashboardInsight({ insight, loading, error, matchCount, filterLabel, onRefresh }: { insight: string; loading: boolean; error: string; matchCount: number; filterLabel: string; onRefresh: () => void }) {
  if (!matchCount) {
    return (
      <section className="paper-card relative overflow-hidden border border-dashed border-[#ddd3c8] p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <IconBadge tone="blue">
            <BrainCircuit size={18} />
          </IconBadge>
          <div>
            <div className="eyebrow">AI match insight</div>
            <h2 className="mt-1 font-display text-2xl font-semibold tracking-[-0.04em]">Add a match to unlock your read.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#7d756d]">CoachIQ will surface one strength and one next opportunity from the matches in your current filter.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-[1.4rem] bg-[#1d3024] p-5 text-[#f4eee5] shadow-[0_18px_55px_rgba(29,48,36,.18)] sm:p-7">
      <img
        src={portableAssets.wagonWheelStadium}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20 mix-blend-screen"
        onError={(event) => handleAssetImageError(event, "matchInsight")}
      />
      <div className="absolute -right-14 -top-16 h-48 w-48 rounded-full bg-[#e66a2c]/25 blur-3xl pointer-events-none" />
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#e66a2c] text-white">
            <BrainCircuit size={19} />
          </div>
          <div>
            <div className="eyebrow text-[#b6c8ba]">AI match insight</div>
            <h2 className="mt-1 font-display text-2xl font-semibold tracking-[-0.04em]">What your selected data suggests.</h2>
            <p className="mt-2 text-xs leading-5 text-[#c7d4c8]">{matchCount} match{matchCount === 1 ? "" : "es"} · {filterLabel}</p>
          </div>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="rounded-xl border border-white/20 px-3 py-2 text-xs font-bold text-[#f4eee5] transition hover:border-white/50 hover:bg-white/10 disabled:opacity-50"
        >
          {loading ? "Reading your scorebook…" : "Refresh insight"}
        </button>
      </div>
      <div className="relative mt-6 max-w-3xl rounded-2xl border border-white/10 bg-black/20 backdrop-blur-xs p-4 text-sm leading-7 text-[#e3ede4] sm:p-5" aria-live="polite">
        {loading && !insight ? (
          <div className="flex items-center gap-3 text-[#d7e4d9]">
            <BrainCircuit size={17} className="animate-pulse" /> CoachIQ is comparing your selected match data…
          </div>
        ) : error ? (
          <div>
            <p className="font-semibold text-[#fff0e7]">Insight unavailable right now.</p>
            <p className="mt-1 text-[#c7d4c8]">{error}</p>
          </div>
        ) : (
          <p className="whitespace-pre-line">{insight}</p>
        )}
      </div>
    </section>
  );
}
function Metric({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) { return <div className="metric-tile"><div className="flex items-center justify-between text-[#e66a2c]">{icon}<span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#a0968b]">{label}</span></div><div className="mt-4 font-display text-2xl font-semibold">{value}</div></div>; }
function ChartCard({ title, eyebrow, icon, hasData, empty, children, legendMain = "Your match data", legendSupport = "Supporting metric" }: { title: string; eyebrow: string; icon: React.ReactNode; hasData: boolean; empty: string; children: React.ReactNode; legendMain?: string; legendSupport?: string }) { return <section className="paper-card group relative overflow-hidden p-5 shadow-[0_18px_45px_rgba(66,54,43,.06)] transition-shadow duration-200 hover:shadow-[0_22px_55px_rgba(66,54,43,.1)] sm:p-6"><div className="absolute -right-10 -top-12 h-32 w-32 rounded-full bg-[#fff0e7] opacity-70 blur-2xl transition-transform duration-300 group-hover:scale-110" /><div className="relative flex items-start justify-between gap-4"><div><div className="eyebrow mb-1">{eyebrow}</div><h2 className="font-display text-2xl font-semibold tracking-[-0.04em]">{title}</h2></div><IconBadge tone="green">{icon}</IconBadge></div><div className="relative mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#8b837b]"><span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#365b44]" />{legendMain}</span><span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#e66a2c]" />{legendSupport}</span></div><div className="relative mt-4 h-72 rounded-[1.15rem] border border-[#ece3d9] bg-[linear-gradient(180deg,#fffdf9_0%,#f8f5ef_100%)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,.8)] sm:h-80">{hasData ? children : <div className="empty-chart"><BarChart3 size={22} /><span>{empty}</span></div>}</div></section>; }

function useMatchDialogFocus(onClose: () => void) { useEffect(() => { const lastActiveElement = document.activeElement instanceof HTMLElement ? document.activeElement : null; const dialog = document.querySelector<HTMLElement>('[role="dialog"]'); const focusable = () => Array.from(dialog?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])') ?? []).filter((element) => !element.hasAttribute("disabled")); requestAnimationFrame(() => focusable()[0]?.focus()); const manageKeys = (event: KeyboardEvent) => { if (event.key === "Escape") { event.preventDefault(); onClose(); return; } if (event.key !== "Tab") return; const controls = focusable(); if (!controls.length) return; const first = controls[0]; const last = controls[controls.length - 1]; if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); } if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); } }; window.addEventListener("keydown", manageKeys); return () => { window.removeEventListener("keydown", manageKeys); lastActiveElement?.focus(); }; }, [onClose]); }
function emptySpell(index: number): SpellValues { return { id: `spell-${Date.now()}-${index}`, phase: "", overs: "", wickets: "", runsConceded: "", maidens: "" }; }
function matchFormValues(match?: Match | null) { const legacy = { phase: match?.bowlingPhase, overs: match?.overs ?? 0, wickets: match?.wickets ?? 0, runsConceded: match?.runsConceded ?? 0, maidens: match?.maidens ?? 0 }; const spells = normalizeBowlingSpells(match?.bowlingSpells, legacy).map((spell) => ({ id: spell.id, phase: spell.phase ?? "", overs: spell.overs ? ballsToOvers(oversToBalls(spell.overs) ?? 0) : "", wickets: spell.wickets ? String(spell.wickets) : "", runsConceded: spell.runsConceded ? String(spell.runsConceded) : "", maidens: spell.maidens ? String(spell.maidens) : "" })); return { date: match?.date ?? "", opponent: match?.opponent ?? "", venue: match?.venue ?? "", format: match?.format ?? "", dismissalType: match?.dismissalType ?? "", runs: match ? String(match.runs) : "", ballsFaced: match ? String(match.ballsFaced) : "", fours: match ? String(match.fours) : "", sixes: match ? String(match.sixes) : "", spells: spells.length ? spells : [emptySpell(1)], catches: match ? String(match.catches) : "", runOuts: match ? String(match.runOuts) : "" }; }

export function RichMatchModal({ match, onClose, onSave }: { match?: Match | null; onClose: () => void; onSave: (match: MatchDraft) => void }) {
  const [section, setSection] = useState<Section>("basics"); const [values, setValues] = useState(() => matchFormValues(match)); const [error, setError] = useState(""); useMatchDialogFocus(onClose); useEffect(() => { setValues(matchFormValues(match)); setSection("basics"); setError(""); }, [match]);
  const update = (key: Exclude<keyof typeof values, "spells">, value: string) => { setValues((previous) => ({ ...previous, [key]: value })); setError(""); }; const updateSpell = (id: string, key: keyof SpellValues, value: string) => { setValues((previous) => ({ ...previous, spells: previous.spells.map((spell) => spell.id === id ? { ...spell, [key]: value } : spell) })); setError(""); };
  const runs = number(values.runs); const balls = number(values.ballsFaced); const spells = values.spells.map((spell) => ({ id: spell.id, phase: spell.phase || undefined, overs: Number(spell.overs || 0), wickets: number(spell.wickets), runsConceded: number(spell.runsConceded), maidens: number(spell.maidens) })); const totals = spellTotals(spells); const strikeRate = balls ? ((runs / balls) * 100).toFixed(1) : "Not calculated"; const economy = totals.overs ? economyFor(totals.runsConceded, totals.overs) : "Not calculated";
  const save = () => { if ([runs, balls, number(values.fours), number(values.sixes), number(values.catches), number(values.runOuts), ...spells.flatMap((spell) => [spell.wickets, spell.runsConceded, spell.maidens])].some((value) => value < 0)) { setError("Use zero or a positive value for match statistics."); return; } for (const spell of spells) { const scorecardError = validateScorecard({ runs, fours: number(values.fours), sixes: number(values.sixes), overs: spell.overs ? String(spell.overs) : "", maidens: spell.maidens }); if (scorecardError === "Boundaries exceed runs.") { setError("Fours and sixes cannot add up to more than the runs entered."); return; } if (scorecardError === "Use valid cricket-over notation.") { setError("Use the overs arrows or enter a valid overs value."); return; } if (scorecardError === "A single spell cannot exceed 50 overs.") { setError("Enter up to 50 overs for a single spell."); return; } if (scorecardError === "Maidens exceed completed overs.") { setError("Maidens cannot exceed completed overs in a spell."); return; } } const cleanedSpells = spells.filter((spell) => spell.overs || spell.wickets || spell.runsConceded || spell.maidens || spell.phase); onSave({ date: values.date || undefined, opponent: values.opponent.trim() || undefined, venue: values.venue.trim() || undefined, format: values.format.trim() || undefined, dismissalType: values.dismissalType || undefined, bowlingSpells: cleanedSpells, bowlingPhase: cleanedSpells[0]?.phase, runs, ballsFaced: balls, fours: number(values.fours), sixes: number(values.sixes), ...spellTotals(cleanedSpells), catches: number(values.catches), runOuts: number(values.runOuts) }); };
  const tabs: { id: Section; label: string }[] = [{ id: "basics", label: "1. Basics" }, { id: "batting", label: "2. Batting" }, { id: "bowling", label: "3. Bowling" }, { id: "fielding", label: "4. Fielding" }]; const previous = () => setSection((current) => current === "basics" ? "basics" : current === "batting" ? "basics" : current === "bowling" ? "batting" : "bowling"); const next = () => setSection((current) => current === "basics" ? "batting" : current === "batting" ? "bowling" : current === "bowling" ? "fielding" : "fielding");
  return <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={match ? "Edit match" : "Log a match"}><div className="modal-card max-w-3xl"><div className="flex items-start justify-between"><div><div className="eyebrow mb-1">Match notebook</div><h2 className="font-display text-2xl font-semibold tracking-[-0.04em]">{match ? "Correct this match record." : "Add what matters from this match."}</h2></div><button onClick={onClose} className="rounded-full p-2 text-[#958d84] hover:bg-[#f0ece6]" aria-label="Close"><X size={18} /></button></div><p className="mt-3 text-sm leading-6 text-[#7d756e]">All totals recalculate from your individual spells.</p><div className="mt-6 flex overflow-x-auto border-b border-[#e7ded5]" role="tablist">{tabs.map((tab) => <button key={tab.id} onClick={() => setSection(tab.id)} role="tab" aria-selected={section === tab.id} className={`shrink-0 border-b-2 px-3 py-3 text-xs font-bold ${section === tab.id ? "border-[#e66a2c] text-[#bf5221]" : "border-transparent text-[#8f877f]"}`}>{tab.label}</button>)}</div><div className="mt-6 min-h-[240px]">{section === "basics" && <div className="grid gap-4 sm:grid-cols-2"><label className="field-label">Match date <span className="normal-case font-medium tracking-normal text-[#a0968b]">(optional)</span><input className="field-input" type="date" value={values.date} onChange={(event) => update("date", event.target.value)} /></label><label className="field-label">Format <select className="field-input" value={values.format} onChange={(event) => update("format", event.target.value)}><option value="">Choose later</option><option>T20</option><option>One-day</option><option>Multi-day</option><option>Practice</option></select></label><label className="field-label">Opponent <input className="field-input" value={values.opponent} onChange={(event) => update("opponent", event.target.value)} placeholder="e.g. Riverside CC" /></label><label className="field-label">Venue <input className="field-input" value={values.venue} onChange={(event) => update("venue", event.target.value)} placeholder="e.g. Home ground" /></label></div>}{section === "batting" && <div className="space-y-5"><div className="grid gap-4 sm:grid-cols-2"><StatField label="Runs" value={values.runs} onChange={(value) => update("runs", value)} /><StatField label="Balls faced" value={values.ballsFaced} onChange={(value) => update("ballsFaced", value)} /><StatField label="Fours" value={values.fours} onChange={(value) => update("fours", value)} /><StatField label="Sixes" value={values.sixes} onChange={(value) => update("sixes", value)} /><label className="field-label sm:col-span-2">Dismissal type <select className="field-input" value={values.dismissalType} onChange={(event) => update("dismissalType", event.target.value)}><option value="">Not recorded</option>{dismissalTypes.map((dismissal) => <option key={dismissal}>{dismissal}</option>)}</select></label></div><div className="metric-tile"><div className="font-display text-xl font-semibold">{strikeRate}</div><div className="nutrition-label">calculated strike rate</div></div></div>}{section === "bowling" && <div className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="eyebrow">Separate bowling spells</div><h3 className="mt-1 font-display text-xl font-semibold">One spell, one phase.</h3></div><button type="button" onClick={() => setValues((previous) => previous.spells.length >= 8 ? previous : { ...previous, spells: [...previous.spells, emptySpell(previous.spells.length + 1)] })} disabled={values.spells.length >= 8} className="ghost-button disabled:opacity-40"><Plus size={14} /> Add spell</button></div><p className="text-xs leading-5 text-[#7d756d]">Use a separate spell for each phase or return to the bowling attack. CoachIQ combines them correctly in your match totals.</p>{values.spells.map((spell, index) => <section key={spell.id} className="rounded-2xl border border-[#eee6de] bg-[#fcfaf7] p-4"><div className="mb-4 flex items-center justify-between"><span className="rounded-full bg-[#e8f0e8] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#42624a]">Spell {index + 1}</span>{values.spells.length > 1 && <button type="button" onClick={() => setValues((previous) => ({ ...previous, spells: previous.spells.filter((item) => item.id !== spell.id) }))} className="text-button text-xs text-[#b45124]">Remove</button>}</div><div className="grid gap-4 sm:grid-cols-2"><StatField label="Wickets" value={spell.wickets} onChange={(value) => updateSpell(spell.id, "wickets", value)} /><OversStepper label="Overs bowled" value={spell.overs} onChange={(value) => updateSpell(spell.id, "overs", value)} /><StatField label="Runs conceded" value={spell.runsConceded} onChange={(value) => updateSpell(spell.id, "runsConceded", value)} /><StatField label="Maidens" value={spell.maidens} onChange={(value) => updateSpell(spell.id, "maidens", value)} /><label className="field-label sm:col-span-2">Main bowling phase <select className="field-input" value={spell.phase} onChange={(event) => updateSpell(spell.id, "phase", event.target.value)}><option value="">Not recorded</option>{bowlingPhases.map((phase) => <option key={phase}>{phase}</option>)}</select></label></div></section>)}<div className="grid gap-3 sm:grid-cols-3"><Metric label="Combined overs" value={ballsToOvers(oversToBalls(totals.overs) ?? 0)} icon={<Activity size={15} />} /><Metric label="Combined wickets" value={totals.wickets} icon={<Trophy size={15} />} /><Metric label="Economy" value={economy} icon={<Flame size={15} />} /></div></div>}{section === "fielding" && <div className="grid gap-4 sm:grid-cols-2"><StatField label="Catches" value={values.catches} onChange={(value) => update("catches", value)} /><StatField label="Run-outs" value={values.runOuts} onChange={(value) => update("runOuts", value)} /><div className="sm:col-span-2 rounded-2xl border border-[#eee6de] bg-[#fcfaf7] p-4 text-sm leading-6 text-[#7d756d]">Fielding details are optional. Log only the moments you want your scorebook to remember.</div></div>}</div>{error && <div role="alert" className="mt-5 rounded-xl border border-[#edc0a5] bg-[#fff4ed] p-3 text-sm font-semibold text-[#a4512b]">{error}</div>}<div className="mt-6 flex flex-wrap items-center justify-between gap-3"><button onClick={previous} className="ghost-button">Back</button><div className="flex gap-2"><button onClick={next} className="ghost-button">Next section <ChevronRight size={14} /></button><button onClick={save} className="primary-button"><Check size={15} /> {match ? "Save changes" : "Save what I have"}</button></div></div></div></div>;
}

function StatField({ label, value, onChange, max }: { label: string; value: string; onChange: (value: string) => void; max?: string }) { return <label className="field-label">{label}<input className="field-input mt-1" type="number" min="0" max={max} step="1" value={value} onChange={(event) => onChange(event.target.value)} placeholder="0" /></label>; }
function OversStepper({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="field-label">{label}<input className="field-input mt-1" inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value.replace(/[^0-9.]/g, ""))} placeholder="0" /></label>; }

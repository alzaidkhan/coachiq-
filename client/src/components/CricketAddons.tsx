// CoachIQ cricket extensions: browser-local scorecards, profile-aware AI guidance, and filtered analytics.
import { useEffect, useMemo, useRef, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, BarChart3, Bot, BrainCircuit, CalendarDays, Check, ChevronRight, Edit3, Flame, Gauge, History, Maximize2, MessageCircle, MessageSquarePlus, Plus, Send, ShieldCheck, Sparkles, Target, Trash2, Trophy, User, X, Zap } from "lucide-react";
import { ballsToOvers, economyFor, oversToBalls, validateScorecard } from "../lib/cricketStats";
import { chartThemes, getChartThemeStorage, readChartTheme, writeChartTheme, type ChartThemeId } from "../lib/chartThemes";
import { bowlingPhasePerformance, dismissalTrend, scoringZonePerformance } from "../lib/matchAnalytics";
import { normalizeBowlingSpells, normalizeScoringZones, scoringZoneTotal, scoringZones, spellTotals, type BowlingSpell, type ScoringZones } from "../lib/matchModel";
import { portableAssets } from "../lib/portableAssets";
import { handleAssetImageError } from "../lib/media";
import { addMessageToSession, clearSessionMessages, createNewSession, deleteChatSession, loadChatStore, saveChatStore, type ChatMessage, type ChatSession, type CoachChatStore } from "../lib/coachChatStore";

type CoachProfile = { name: string; age: string; gender: string; region: string; heightCm: string; weightKg: string; role: string; battingHand: string; bowlingStyle: string; level: string; goal: string; sessions: string; minutes: string; diet: string; equipment: string; improvementNote: string };
type Match = { id: string; date: string; opponent?: string; venue?: string; format?: string; dismissalType?: string; bowlingPhase?: string; scoringZones?: ScoringZones; bowlingSpells?: BowlingSpell[]; runs: number; ballsFaced: number; fours: number; sixes: number; wickets: number; overs: number; runsConceded: number; maidens: number; catches: number; runOuts: number };
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
  return <div className="space-y-5"><section className="paper-card p-4 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="eyebrow">Performance lens</div><h2 className="mt-1 font-display text-xl font-semibold tracking-[-0.04em]">Filter your match view.</h2></div><p className="max-w-xs text-xs leading-5 text-[#8b837b]">Charts, scorebook, and the coaching insight update only from the matches you choose.</p></div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_auto]"><label className="field-label">Match format<select className="field-input" aria-label="Filter match format" value={formatFilter} onChange={(event) => setFormatFilter(event.target.value)}><option>All formats</option>{formats.map((format) => <option key={format}>{format}</option>)}</select></label><label className="field-label">From<input className="field-input" aria-label="Matches from" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} /></label><label className="field-label">To<input className="field-input" aria-label="Matches to" type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} /></label><button onClick={clearFilters} disabled={formatFilter === "All formats" && !dateFrom && !dateTo} className="ghost-button self-end disabled:cursor-not-allowed disabled:opacity-40">Clear filters</button></div><p className="mt-3 text-xs font-semibold text-[#5c6b61]" role="status">Showing {activity.matches.length} of {allActivity.matches.length} matches · {filterLabel}</p></section><DashboardThemeSelector themeId={themeId} onChange={changeTheme} /><DashboardContent activity={activity} filterLabel={filterLabel} theme={theme} onAddMatch={onAddMatch} onEditMatch={onEditMatch} onDeleteMatch={onDeleteMatch} /><DashboardInsight insight={insight} loading={insightLoading} error={insightError} matchCount={activity.matches.length} filterLabel={filterLabel} onRefresh={() => setInsightRefresh((value) => value + 1)} /></div>;
}

function DashboardThemeSelector({ themeId, onChange }: { themeId: ChartThemeId; onChange: (theme: ChartThemeId) => void }) { return <section className="paper-card p-4 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="eyebrow">Dashboard palette</div><h2 className="mt-1 font-display text-xl font-semibold tracking-[-0.04em]">Choose your chart mood.</h2><p className="mt-1 max-w-xl text-xs leading-5 text-[#8b837b]">Your choice is saved on this device and changes chart accents, map markers, and hover states.</p></div><span className="rounded-full bg-[#f7f3ed] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#71685f]">{chartThemes[themeId].label}</span></div><div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4" role="radiogroup" aria-label="Dashboard chart theme">{Object.entries(chartThemes).map(([id, item]) => { const option = id as ChartThemeId; const selected = option === themeId; return <button key={option} type="button" role="radio" aria-checked={selected} onClick={() => onChange(option)} className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${selected ? "border-[#1d3024] bg-[#f5f8f3] shadow-sm" : "border-[#eee5dc] bg-[#fcfaf7] hover:border-[#c8d8ca]"}`}><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ background: item.main }}><i className="h-2.5 w-2.5 rounded-full" style={{ background: item.accent }} /></span><span className="min-w-0"><span className="block text-xs font-bold text-[#344139]">{item.label}</span><span className="mt-0.5 block truncate text-[10px] text-[#8b837b]">{item.description}</span></span>{selected && <Check size={15} className="ml-auto shrink-0 text-[#365b44]" />}</button>; })}</div></section>; }

function DashboardContent({ activity, filterLabel, theme, onAddMatch, onEditMatch, onDeleteMatch }: { activity: ActivityLog; filterLabel: string; theme: ChartTheme; onAddMatch: () => void; onEditMatch: (match: Match) => void; onDeleteMatch: (match: Match) => void }) {
  const [wagonWheelOpen, setWagonWheelOpen] = useState(false);
  const batting = useMemo(() => activity.matches.slice(-6).map((match, index) => ({ name: `M${index + 1}`, runs: match.runs, boundaries: match.fours + match.sixes })), [activity.matches]); const bowling = useMemo(() => activity.matches.slice(-6).map((match, index) => ({ name: `M${index + 1}`, wickets: match.wickets, economy: economyFor(match.runsConceded, match.overs) === "Not calculated" ? 0 : Number(economyFor(match.runsConceded, match.overs)) })), [activity.matches]); const dismissals = useMemo(() => dismissalTrend(activity.matches), [activity.matches]); const phases = useMemo(() => bowlingPhasePerformance(activity.matches), [activity.matches]); const zoneData = useMemo(() => scoringZonePerformance(activity.matches), [activity.matches]);
  const totalRuns = activity.matches.reduce((sum, match) => sum + match.runs, 0); const balls = activity.matches.reduce((sum, match) => sum + match.ballsFaced, 0); const boundaries = activity.matches.reduce((sum, match) => sum + match.fours + match.sixes, 0); const wickets = activity.matches.reduce((sum, match) => sum + match.wickets, 0); const totalBallsBowled = activity.matches.reduce((sum, match) => sum + (oversToBalls(match.overs) ?? 0), 0); const runsConceded = activity.matches.reduce((sum, match) => sum + match.runsConceded, 0); const strikeRate = balls ? Math.round((totalRuns / balls) * 100) : "Not calculated"; const economy = totalBallsBowled ? (runsConceded / (totalBallsBowled / 6)).toFixed(1) : "Not calculated";
  if (!activity.matches.length) return <div className="space-y-5"><section className="dashboard-hero paper-card p-5 sm:p-7"><div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end"><div><div className="eyebrow mb-1">Your game, in loaded data</div><h2 className="font-display text-3xl font-semibold tracking-[-0.05em]">Start with one match.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-[#7d756d]">Add batting, bowling, or both. CoachIQ will calculate your first match snapshot and unlock your trends when there is something real to compare.</p></div><button onClick={onAddMatch} className="primary-button"><CalendarDays size={15} /> Add your first match</button></div><div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Runs" value="0" icon={<Zap size={15} />} /><Metric label="Strike rate" value="—" icon={<Gauge size={15} />} /><Metric label="Wickets" value="0" icon={<Trophy size={15} />} /><Metric label="Economy" value="—" icon={<Flame size={15} />} /></div></section><div className="grid gap-5 xl:grid-cols-2"><ChartCard title="Scoring zones" eyebrow="Map where your logged runs go" icon={<Target size={19} />} hasData={false} empty="Map a few scoring zones in your next batting scorecard." legendMain="Selected scoring areas" legendSupport="Logged runs"><span /></ChartCard><ChartCard title="Bowling phase performance" eyebrow="Logged spells by their match phase" icon={<Flame size={19} />} hasData={false} empty="Add one or more spells to compare bowling phases." legendMain="Wickets" legendSupport="Economy"><span /></ChartCard></div></div>;
  const latest = activity.matches.at(-1); const bestScore = Math.max(...activity.matches.map((match) => match.runs)); const bestWickets = Math.max(...activity.matches.map((match) => match.wickets));
  return <div className="space-y-5"><section className="dashboard-hero paper-card p-5 sm:p-7"><div className="flex flex-wrap items-end justify-between gap-4"><div><div className="eyebrow mb-1">Loaded match data</div><h2 className="font-display text-3xl font-semibold tracking-[-0.05em]">Your game, in numbers.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-[#7d756d]">Every visual below reflects only the scorecards in your active dashboard filter.</p></div><button onClick={onAddMatch} className="primary-button"><CalendarDays size={15} /> Add match data</button></div><div className="mt-7 grid gap-3 sm:grid-cols-3 lg:grid-cols-6"><Metric label="Runs" value={totalRuns} icon={<Zap size={15} />} /><Metric label="Balls faced" value={balls} icon={<Activity size={15} />} /><Metric label="Boundaries" value={boundaries} icon={<Target size={15} />} /><Metric label="Strike rate" value={strikeRate} icon={<Gauge size={15} />} /><Metric label="Wickets" value={wickets} icon={<Trophy size={15} />} /><Metric label="Economy" value={economy} icon={<Flame size={15} />} /></div></section><section className="grid gap-3 sm:grid-cols-3"><div className="surface-card border-l-4 border-l-[#e66a2c] p-4"><div className="eyebrow">Highest score</div><div className="mt-2 font-display text-3xl font-semibold">{bestScore}</div><p className="mt-1 text-xs text-[#8b837b]">from your {activity.matches.length} selected matches</p></div><div className="surface-card border-l-4 border-l-[#365b44] p-4"><div className="eyebrow">Best wickets</div><div className="mt-2 font-display text-3xl font-semibold">{bestWickets}</div><p className="mt-1 text-xs text-[#8b837b]">in one selected match</p></div><div className="surface-card border-l-4 border-l-[#3b6e82] p-4"><div className="eyebrow">Latest snapshot</div><div className="mt-2 text-sm font-bold">{latest ? `${latest.runs} runs · ${latest.wickets} wickets` : "No scorecard yet"}</div><p className="mt-1 text-xs text-[#8b837b]">{latest ? formatDate(latest.date) : "Add a match to begin"}</p></div></section><div className="grid gap-5 xl:grid-cols-2"><ChartCard title="Batting rhythm" eyebrow="Runs and boundaries by match" icon={<BarChart3 size={19} />} hasData={Boolean(batting.length)} empty="Log a match to see your batting line."><ResponsiveContainer width="100%" height="100%"><LineChart data={batting} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}><CartesianGrid stroke={theme.grid} strokeDasharray="3 5" vertical={false} /><XAxis dataKey="name" tick={{ fill: "#9a9188", fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: "#9a9188", fontSize: 11 }} axisLine={false} tickLine={false} width={28} /><Tooltip contentStyle={chartTooltip(theme)} cursor={{ fill: theme.hover }} /><Line type="monotone" dataKey="runs" stroke={theme.main} strokeWidth={4} dot={{ fill: theme.main, r: 4 }} activeDot={{ r: 6 }} /><Line type="monotone" dataKey="boundaries" stroke={theme.accent} strokeWidth={2} dot={{ fill: theme.accent, r: 3 }} /></LineChart></ResponsiveContainer></ChartCard><ChartCard title="Bowling output" eyebrow="Wickets and economy by match" icon={<Activity size={19} />} hasData={Boolean(bowling.length)} empty="Log bowling figures to see this trend."><ResponsiveContainer width="100%" height="100%"><BarChart data={bowling} barGap={8} barCategoryGap="24%" margin={{ top: 8, right: 12, left: -8, bottom: 0 }}><CartesianGrid stroke={theme.grid} strokeDasharray="3 5" vertical={false} /><XAxis dataKey="name" tick={{ fill: "#9a9188", fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: "#9a9188", fontSize: 11 }} axisLine={false} tickLine={false} width={28} /><Tooltip contentStyle={chartTooltip(theme)} cursor={{ fill: theme.hover }} /><Bar dataKey="wickets" fill={theme.main} radius={[5, 5, 0, 0]} /><Bar dataKey="economy" fill={theme.accent} radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></ChartCard></div><div className="grid gap-5 xl:grid-cols-2"><ChartCard title="Scoring zones" eyebrow="Wagon wheel from your selected scorecards" icon={<Target size={19} />} hasData={Boolean(zoneData.length)} empty="Map a few scoring zones in your batting scorecard to unlock this view." legendMain="Selected scoring areas" legendSupport="Logged runs"><div className="space-y-3"><ScoreZoneWheel zones={zoneData} theme={theme} onEnlarge={() => setWagonWheelOpen(true)} /><div className="flex justify-end"><WagonWheelDialog matches={activity.matches} filterLabel={filterLabel} theme={theme} isOpen={wagonWheelOpen} onOpenChange={setWagonWheelOpen} /></div></div></ChartCard><ChartCard title="Dismissal trends" eyebrow="How recorded innings have ended" icon={<Target size={19} />} hasData={Boolean(dismissals.length)} empty="Choose a dismissal type when you log an innings to see this trend." legendMain="Recorded dismissals" legendSupport="Count"><ResponsiveContainer width="100%" height="100%"><BarChart data={dismissals} barCategoryGap="28%" margin={{ top: 8, right: 12, left: -8, bottom: 0 }}><CartesianGrid stroke={theme.grid} strokeDasharray="3 5" vertical={false} /><XAxis dataKey="name" tick={{ fill: "#9a9188", fontSize: 11 }} axisLine={false} tickLine={false} interval={0} /><YAxis allowDecimals={false} tick={{ fill: "#9a9188", fontSize: 11 }} axisLine={false} tickLine={false} width={28} /><Tooltip contentStyle={chartTooltip(theme)} cursor={{ fill: theme.hover }} /><Bar dataKey="dismissals" name="Dismissals" fill={theme.accent} radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></ChartCard></div><ChartCard title="Bowling phase performance" eyebrow="Each saved spell grouped by phase" icon={<Flame size={19} />} hasData={Boolean(phases.length)} empty="Add a phase to one or more bowling spells to compare this view." legendMain="Wickets" legendSupport="Economy"><ResponsiveContainer width="100%" height="100%"><BarChart data={phases} barGap={8} barCategoryGap="24%" margin={{ top: 8, right: 12, left: -8, bottom: 0 }}><CartesianGrid stroke={theme.grid} strokeDasharray="3 5" vertical={false} /><XAxis dataKey="name" tick={{ fill: "#9a9188", fontSize: 11 }} axisLine={false} tickLine={false} interval={0} /><YAxis tick={{ fill: "#9a9188", fontSize: 11 }} axisLine={false} tickLine={false} width={28} /><Tooltip contentStyle={chartTooltip(theme)} cursor={{ fill: theme.hover }} /><Bar dataKey="wickets" fill={theme.main} radius={[5, 5, 0, 0]} /><Bar dataKey="economy" fill={theme.accent} radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></ChartCard><section className="paper-card p-5 sm:p-6"><div className="flex items-start justify-between"><div><div className="eyebrow mb-1">Data loaded</div><h2 className="font-display text-2xl font-semibold tracking-[-0.04em]">Match-by-match scorebook</h2></div><span className="rounded-full bg-[#e8f0e8] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.13em] text-[#42624a]">{activity.matches.length} matches</span></div><div className="mt-5 overflow-x-auto"><table className="data-table"><thead><tr><th>Date</th><th>Runs</th><th>Dismissal</th><th>Spells</th><th>Wkts</th><th>Overs</th><th>Economy</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{activity.matches.slice().reverse().map((match) => <tr key={match.id}><td>{formatDate(match.date)}</td><td className="font-bold">{match.runs} <span className="font-normal text-[#8b837b]">({match.ballsFaced})</span></td><td>{match.dismissalType || "—"}</td><td>{match.bowlingSpells?.length || 0}</td><td>{match.wickets}</td><td>{ballsToOvers(oversToBalls(match.overs) ?? 0)}</td><td>{economyFor(match.runsConceded, match.overs)}</td><td><div className="flex gap-2"><button onClick={() => onEditMatch(match)} className="text-button text-xs" aria-label={`Edit match from ${formatDate(match.date)}`}><Edit3 size={13} /> Edit</button><button onClick={() => onDeleteMatch(match)} className="text-button text-xs text-[#b45124]" aria-label={`Delete match from ${formatDate(match.date)}`}><Trash2 size={13} /> Delete</button></div></td></tr>)}</tbody></table></div></section></div>;
}

function ScoreZoneWheel({
  zones,
  theme,
  onEnlarge,
}: {
  zones: ReturnType<typeof scoringZonePerformance>;
  theme: ChartTheme;
  onEnlarge?: () => void;
}) {
  const total = zones.reduce((sum, zone) => sum + zone.runs, 0);
  const ranked = zones.slice().sort((left, right) => right.runs - left.runs);
  const maxRuns = ranked[0]?.runs || 1;

  return (
    <div className="grid h-full gap-4 lg:grid-cols-[minmax(0,1.08fr)_minmax(190px,.92fr)]">
      {/* Clickable scoring map with hover effect and badge */}
      <div
        role="button"
        tabIndex={0}
        onClick={onEnlarge}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onEnlarge?.();
          }
        }}
        title="Click to view large 360° wagon wheel"
        className="group relative flex min-h-[260px] cursor-pointer items-center justify-center overflow-hidden rounded-[1.35rem] border border-[#e8dfd5] bg-[radial-gradient(circle_at_50%_45%,#fffdf9_0%,#f5f8f3_54%,#e8f0e8_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.8)] transition-all duration-200 hover:border-[#365b44] hover:shadow-[0_12px_32px_rgba(29,48,36,.12)]"
      >
        <div className="absolute left-3.5 top-3.5 rounded-full border border-[#dbe8dc] bg-white/80 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-[#54705b] backdrop-blur-xs">
          Scoring map
        </div>
        <div className="absolute right-3.5 top-3.5 flex items-center gap-1.5 rounded-full bg-[#1d3024] px-2.5 py-1 text-[10px] font-bold text-white shadow-sm transition group-hover:scale-105 group-hover:bg-[#284432]">
          <Maximize2 size={11} className="text-[#e66a2c]" />
          <span>Large View</span>
        </div>

        <svg
          viewBox="0 0 100 100"
          role="img"
          aria-label={`Scoring zones with ${total} mapped runs. Click to enlarge.`}
          className="h-full w-full max-w-[300px] transition-transform duration-300 group-hover:scale-105"
        >
          <defs>
            <radialGradient id="score-zone-surface" cx="50%" cy="42%" r="62%">
              <stop offset="0%" stopColor="#fffdf9" />
              <stop offset="100%" stopColor="#e5efe6" />
            </radialGradient>
          </defs>
          <circle cx="50" cy="50" r="44" fill="url(#score-zone-surface)" stroke="#bfd4c2" strokeWidth="1.2" />
          <circle cx="50" cy="50" r="36" fill="none" stroke="#d2e0d4" strokeWidth=".7" strokeDasharray="1.5 2.2" />
          <path d="M50 7V93M7 50H93M19 19L81 81M81 19L19 81" stroke="#c8d9cb" strokeWidth=".55" />
          <path
            d="M50 50L50 8M50 50L81 19M50 50L92 50M50 50L81 81M50 50L50 92M50 50L19 81M50 50L8 50M50 50L19 19"
            stroke="#b2cab6"
            strokeWidth=".7"
            strokeDasharray="1.2 2.4"
          />
          <ellipse cx="50" cy="54" rx="7" ry="10" fill="#d8c59d" fillOpacity=".9" />
          <rect x="47" y="38" width="6" height="22" rx="1.5" fill="#c6af7d" />
          <circle cx="50" cy="50" r="3.2" fill="#1d3024" stroke="#fffdf9" strokeWidth="1.2" />
          {ranked.map((zone, index) => (
            <g key={zone.id}>
              <circle
                cx={zone.x}
                cy={zone.y}
                r={Math.min(8.5, 3.5 + Math.sqrt(zone.runs))}
                fill={theme.zones[index] || theme.zones[theme.zones.length - 1]}
                fillOpacity=".96"
                stroke="#fffdf9"
                strokeWidth="1.2"
              />
              <text x={zone.x} y={zone.y + 1.6} textAnchor="middle" fontSize="4" fontWeight="800" fill="#fffdf9">
                {zone.runs}
              </text>
            </g>
          ))}
        </svg>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full border border-[#dbe8dc] bg-white/85 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-[#54705b] shadow-xs group-hover:border-[#365b44]">
          <Maximize2 size={10} className="text-[#e66a2c]" /> Click field to enlarge
        </div>
      </div>

      {/* Top routes breakdown */}
      <div className="flex flex-col justify-center rounded-[1.35rem] border border-[#eee5dc] bg-[#fcfaf7] p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="eyebrow">Top routes</div>
            <h3 className="mt-1 font-display text-xl font-semibold">Where runs land.</h3>
          </div>
          <span className="rounded-full bg-[#e8f0e8] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#42624a]">
            {ranked.length}/8 zones
          </span>
        </div>
        {ranked.length ? (
          <div className="mt-5 space-y-3">
            {ranked.map((zone, index) => (
              <div key={zone.id}>
                <div className="flex items-center justify-between gap-3 text-xs font-bold text-[#536158]">
                  <span className="flex min-w-0 items-center gap-2">
                    <i
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: theme.zones[index] || theme.zones[theme.zones.length - 1] }}
                    />
                    {zone.label}
                  </span>
                  <strong className="text-[#1d3024]">{zone.runs}</strong>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#e8eee8]">
                  <span
                    className="block h-full rounded-full bg-[#365b44]"
                    style={{ width: `${Math.max(8, (zone.runs / maxRuns) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-dashed border-[#d8e3d9] bg-[#f5f8f3] p-4 text-xs leading-5 text-[#657468]">
            Map a few batting zones in your next scorecard to see the strongest scoring routes.
          </div>
        )}
        <div className="mt-5 flex items-center justify-between border-t border-[#eee5dc] pt-3 text-xs">
          <span className="font-semibold text-[#8b837b]">Mapped runs</span>
          <strong className="font-display text-xl text-[#1d3024]">{total}</strong>
        </div>
      </div>
    </div>
  );
}
function WagonWheelDialog({
  matches,
  filterLabel,
  theme,
  isOpen: controlledOpen,
  onOpenChange,
}: {
  matches: Match[];
  filterLabel: string;
  theme: ChartTheme;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = (value: boolean) => {
    if (onOpenChange) onOpenChange(value);
    else setInternalOpen(value);
  };

  const [activeZone, setActiveZone] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"sectors" | "trajectories">("sectors");
  const zones = useMemo(() => scoringZonePerformance(matches), [matches]);
  const ranked = useMemo(() => zones.slice().sort((left, right) => right.runs - left.runs), [zones]);
  const total = ranked.reduce((sum, zone) => sum + zone.runs, 0);
  const maxRuns = ranked[0]?.runs || 1;

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const selected = ranked.find((zone) => zone.id === activeZone) ?? ranked[0];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="ghost-button ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#365b44] hover:bg-[#eaf1eb] transition-colors"
        disabled={!ranked.length}
        title="View enlarged 360° wagon wheel"
      >
        <Maximize2 size={13} /> Detailed wagon wheel
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0d1a12]/80 p-2 sm:p-4 md:p-6 backdrop-blur-md animate-in fade-in duration-200"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Enlarged 360° Wagon Wheel Scoring Arena"
            className="flex max-h-[94vh] w-full max-w-5xl flex-col rounded-3xl border border-[#d6cfc4] bg-[#fcfaf7] shadow-[0_25px_70px_rgba(0,0,0,0.35)] overflow-hidden"
          >
            {/* Modal Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#eee5dc] bg-white px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#1d3024] text-white shadow-xs">
                  <Target size={20} className="text-[#e66a2c]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="eyebrow text-[#365b44]">360° Wagon Wheel & Scoring Arena</span>
                    <span className="rounded-full bg-[#e8f0e8] px-2 py-0.5 text-[10px] font-bold text-[#365b44]">
                      {filterLabel}
                    </span>
                    <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-[#f4ebd9] px-2 py-0.5 text-[10px] font-semibold text-[#8b5a2b]">
                      <Sparkles size={11} className="text-[#e66a2c]" /> Google AI Insights
                    </span>
                  </div>
                  <h2 className="font-display text-2xl font-bold tracking-[-0.03em] text-[#1d3024]">
                    Interactive Field & Shot Distribution
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex rounded-xl bg-[#f0eae1] p-1 text-xs font-semibold text-[#544b41]">
                  <button
                    type="button"
                    onClick={() => setViewMode("sectors")}
                    className={`rounded-lg px-3 py-1.5 transition ${
                      viewMode === "sectors" ? "bg-white text-[#1d3024] shadow-xs" : "hover:text-[#1d3024]"
                    }`}
                  >
                    Zones View
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("trajectories")}
                    className={`rounded-lg px-3 py-1.5 transition ${
                      viewMode === "trajectories" ? "bg-white text-[#1d3024] shadow-xs" : "hover:text-[#1d3024]"
                    }`}
                  >
                    Trajectories
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-[#e4ded5] bg-white p-2 text-[#7d756d] transition hover:bg-[#f3eee8] hover:text-[#1d3024]"
                  aria-label="Close wagon wheel dialog"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="grid flex-1 gap-6 overflow-y-auto p-5 sm:p-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.9fr)]">
              {/* Left Column: Large Stadium Field Graphic */}
              <div className="relative flex min-h-[380px] sm:min-h-[440px] md:min-h-[500px] flex-col items-center justify-center rounded-2xl border border-[#dce6dd] bg-[radial-gradient(ellipse_at_50%_48%,#ffffff_0%,#f0f6ef_45%,#dbe9dc_85%,#c6dcc8_100%)] p-4 shadow-inner">
                {/* Stadium Badges */}
                <div className="absolute left-4 top-4 flex flex-col gap-1.5">
                  <span className="rounded-full border border-[#bfd7c2] bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#365b44] shadow-xs backdrop-blur-xs">
                    Full Boundary (75m)
                  </span>
                  <span className="rounded-full border border-[#d8e4d9] bg-white/80 px-2.5 py-0.5 text-[9px] font-semibold text-[#667a69]">
                    30-yard Inner Circle
                  </span>
                </div>

                <div className="absolute right-4 top-4 text-right">
                  <span className="inline-block rounded-full bg-[#1d3024] px-3 py-1 text-xs font-bold text-white shadow-sm">
                    {total} Total Runs
                  </span>
                  <p className="mt-1 text-[10px] font-medium text-[#5a705e]">Across {ranked.length} zones</p>
                </div>

                {/* SVG Stadium Field */}
                <svg
                  viewBox="0 0 100 100"
                  role="img"
                  aria-label={`Detailed large wagon wheel scoring arena with ${total} mapped runs`}
                  className="h-full w-full max-h-[460px] max-w-[460px] drop-shadow-md"
                >
                  <defs>
                    {/* Field Grass Texture Gradient */}
                    <radialGradient id="arena-surface" cx="50%" cy="48%" r="56%">
                      <stop offset="0%" stopColor="#fdfefe" />
                      <stop offset="45%" stopColor="#ecf5eb" />
                      <stop offset="78%" stopColor="#dbeadc" />
                      <stop offset="100%" stopColor="#c3dcce" />
                    </radialGradient>
                    {/* Crease / Pitch Strip */}
                    <linearGradient id="pitch-turf" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#c9b589" />
                      <stop offset="50%" stopColor="#dbcaa2" />
                      <stop offset="100%" stopColor="#c9b589" />
                    </linearGradient>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="1.5" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* Outer Stadium Track & Boundary */}
                  <circle cx="50" cy="50" r="48" fill="none" stroke="#a7c4ab" strokeWidth="1.8" />
                  <circle cx="50" cy="50" r="46.5" fill="url(#arena-surface)" stroke="#2d5239" strokeWidth="1" strokeDasharray="3 2" />

                  {/* Inner 30-yard Fielding Circle */}
                  <circle cx="50" cy="50" r="28" fill="none" stroke="#92b897" strokeWidth="0.8" strokeDasharray="2 2" />

                  {/* Pitch Strip at center */}
                  <rect x="47" y="37" width="6" height="26" rx="1.5" fill="url(#pitch-turf)" stroke="#ad9768" strokeWidth="0.6" />
                  {/* Popping Crease lines */}
                  <line x1="45" y1="41" x2="55" y2="41" stroke="#ffffff" strokeWidth="0.6" />
                  <line x1="45" y1="59" x2="55" y2="59" stroke="#ffffff" strokeWidth="0.6" />
                  {/* Stumps */}
                  <circle cx="49" cy="40" r="0.6" fill="#4d3e23" />
                  <circle cx="50" cy="40" r="0.6" fill="#4d3e23" />
                  <circle cx="51" cy="40" r="0.6" fill="#4d3e23" />
                  <circle cx="49" cy="60" r="0.6" fill="#4d3e23" />
                  <circle cx="50" cy="60" r="0.6" fill="#4d3e23" />
                  <circle cx="51" cy="60" r="0.6" fill="#4d3e23" />

                  {/* Radiating 8 Sectors Lines from center (50, 50) */}
                  <path d="M50 50L50 3.5" stroke="#96b99b" strokeWidth="0.65" strokeDasharray="1.5 2" />
                  <path d="M50 50L83 17" stroke="#96b99b" strokeWidth="0.65" strokeDasharray="1.5 2" />
                  <path d="M50 50L96.5 50" stroke="#96b99b" strokeWidth="0.65" strokeDasharray="1.5 2" />
                  <path d="M50 50L83 83" stroke="#96b99b" strokeWidth="0.65" strokeDasharray="1.5 2" />
                  <path d="M50 50L50 96.5" stroke="#96b99b" strokeWidth="0.65" strokeDasharray="1.5 2" />
                  <path d="M50 50L17 83" stroke="#96b99b" strokeWidth="0.65" strokeDasharray="1.5 2" />
                  <path d="M50 50L3.5 50" stroke="#96b99b" strokeWidth="0.65" strokeDasharray="1.5 2" />
                  <path d="M50 50L17 17" stroke="#96b99b" strokeWidth="0.65" strokeDasharray="1.5 2" />

                  {/* Batsman Stance Point at (50, 56) */}
                  <circle cx="50" cy="56" r="2.2" fill="#1d3024" stroke="#ffffff" strokeWidth="0.8" />

                  {/* Trajectories if toggled */}
                  {viewMode === "trajectories" &&
                    ranked.map((zone, index) => {
                      const count = Math.max(1, Math.min(8, Math.round(zone.runs / 4)));
                      const isSelected = selected?.id === zone.id;
                      return (
                        <g key={`traj-${zone.id}`} opacity={isSelected ? 1 : 0.65}>
                          {Array.from({ length: count }).map((_, i) => {
                            const jitterAngle = (i - count / 2) * 2.8;
                            const rad = Math.atan2(zone.y - 56, zone.x - 50) + (jitterAngle * Math.PI) / 180;
                            const distance = 25 + (zone.runs / maxRuns) * 19;
                            const destX = 50 + Math.cos(rad) * distance;
                            const destY = 56 + Math.sin(rad) * distance;
                            return (
                              <line
                                key={i}
                                x1="50"
                                y1="56"
                                x2={destX}
                                y2={destY}
                                stroke={theme.zones[index] || theme.main}
                                strokeWidth={isSelected ? "1.2" : "0.7"}
                                strokeDasharray={i % 2 === 0 ? "none" : "2 1"}
                              />
                            );
                          })}
                        </g>
                      );
                    })}

                  {/* Interactive Zones Markers */}
                  {ranked.map((zone, index) => {
                    const isSelected = selected?.id === zone.id;
                    const radius = Math.min(9.5, 4.2 + Math.sqrt(zone.runs) * 0.95);
                    const zoneColor = theme.zones[index] || theme.zones[theme.zones.length - 1];

                    return (
                      <g
                        key={zone.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setActiveZone(zone.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setActiveZone(zone.id);
                          }
                        }}
                        className="cursor-pointer transition-all duration-200 hover:opacity-100"
                      >
                        <title>{`${zone.label}: ${zone.runs} runs (${Math.round((zone.runs / total) * 100)}%)`}</title>

                        {/* Outer Glow Ring on selected */}
                        {isSelected && (
                          <circle
                            cx={zone.x}
                            cy={zone.y}
                            r={radius + 3.5}
                            fill="none"
                            stroke={zoneColor}
                            strokeWidth="1.5"
                            strokeDasharray="2 2"
                            className="animate-spin origin-center"
                            style={{ transformOrigin: `${zone.x}px ${zone.y}px` }}
                          />
                        )}

                        {/* Main Zone Circle */}
                        <circle
                          cx={zone.x}
                          cy={zone.y}
                          r={radius}
                          fill={zoneColor}
                          stroke="#ffffff"
                          strokeWidth={isSelected ? "2.2" : "1.2"}
                          filter={isSelected ? "url(#glow)" : undefined}
                        />

                        {/* Zone Runs Number */}
                        <text
                          x={zone.x}
                          y={zone.y + 1.6}
                          textAnchor="middle"
                          fontSize={radius > 6 ? "4.2" : "3.6"}
                          fontWeight="800"
                          fill="#ffffff"
                        >
                          {zone.runs}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Bottom Center Indicator */}
                <div className="mt-2 flex items-center gap-2 rounded-full border border-[#bfd4c2] bg-white/90 px-3 py-1 text-[11px] font-semibold text-[#1d3024] shadow-xs">
                  <span className="h-2 w-2 rounded-full bg-[#e66a2c] animate-ping" />
                  <span>
                    Selected: <strong>{selected?.label || "None"}</strong> ({selected?.runs || 0} runs)
                  </span>
                </div>
              </div>

              {/* Right Column: Zone Deep-Dive & Google AI Tactical Breakdown */}
              <div className="flex flex-col justify-between space-y-4">
                {/* Active Zone Detail Card */}
                {selected ? (
                  <div className="rounded-2xl border border-[#e4ded5] bg-white p-5 shadow-xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="eyebrow text-[#42624a]">Zone Focus</span>
                        <h3 className="mt-0.5 font-display text-2xl font-bold text-[#1d3024]">
                          {selected.label}
                        </h3>
                      </div>
                      <span className="rounded-xl bg-[#fff0e7] px-3 py-1 font-display text-xl font-bold text-[#b45124]">
                        {selected.runs} <span className="text-xs font-normal text-[#8b837b]">runs</span>
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-xl bg-[#f8f5ef] p-3">
                        <span className="text-[#8b837b]">Share of innings</span>
                        <div className="mt-1 font-display text-xl font-bold text-[#1d3024]">
                          {total ? Math.round((selected.runs / total) * 100) : 0}%
                        </div>
                      </div>
                      <div className="rounded-xl bg-[#f8f5ef] p-3">
                        <span className="text-[#8b837b]">Route rank</span>
                        <div className="mt-1 font-display text-xl font-bold text-[#1d3024]">
                          #{ranked.findIndex((z) => z.id === selected.id) + 1}{" "}
                          <span className="text-xs font-normal text-[#8b837b]">of {ranked.length}</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress relative to max */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-[#7d756d]">
                        <span>Volume density</span>
                        <span className="font-semibold text-[#1d3024]">
                          {Math.round((selected.runs / maxRuns) * 100)}% of peak
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#ece6dc]">
                        <div
                          className="h-full rounded-full bg-[#365b44] transition-all duration-500"
                          style={{ width: `${(selected.runs / maxRuns) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-[#ddd3c8] bg-white p-5 text-center text-xs text-[#7d756d]">
                    Click any zone on the stadium wheel to see details.
                  </div>
                )}

                {/* Google AI Coach Tactical Assessment */}
                <div className="rounded-2xl border border-[#cde0d0] bg-[linear-gradient(135deg,#f4faf4_0%,#ebf5eb_100%)] p-4 shadow-xs">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#365b44] text-white">
                      <Sparkles size={14} className="text-[#ffd7b3]" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#2c4e38]">
                        Google AI Field Analysis
                      </h4>
                      <p className="text-[10px] text-[#617b68]">Automated batting pattern detection</p>
                    </div>
                  </div>

                  <p className="mt-3 text-xs leading-relaxed text-[#2c4634]">
                    {ranked.length >= 2
                      ? `Your primary scoring corridor is ${ranked[0].label} (${ranked[0].runs} runs, ${Math.round(
                          (ranked[0].runs / total) * 100
                        )}%), with reliable support through ${ranked[1].label}. Opposition captains are likely to pack fielders in these sectors.`
                      : "Add more match scorecards to reveal deep tactical field placement recommendations."}
                  </p>
                </div>

                {/* All Zones Quick Selector List */}
                <div className="rounded-2xl border border-[#eee5dc] bg-white p-4 shadow-xs">
                  <div className="flex items-center justify-between text-xs font-bold text-[#8b837b]">
                    <span>All 8 Scoring Sectors</span>
                    <span className="text-[#365b44]">{ranked.length} Active</span>
                  </div>

                  <div className="mt-2.5 max-h-[160px] space-y-1.5 overflow-y-auto pr-1">
                    {ranked.map((zone, index) => {
                      const isSelected = selected?.id === zone.id;
                      const percentage = Math.round((zone.runs / total) * 100);
                      return (
                        <button
                          key={zone.id}
                          type="button"
                          onClick={() => setActiveZone(zone.id)}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs transition ${
                            isSelected
                              ? "bg-[#1d3024] text-white shadow-xs"
                              : "bg-[#fcfaf7] text-[#4a584e] hover:bg-[#f3ede4]"
                          }`}
                        >
                          <span className="flex items-center gap-2 truncate">
                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{
                                backgroundColor: theme.zones[index] || theme.zones[theme.zones.length - 1],
                              }}
                            />
                            <span className="font-semibold truncate">{zone.label}</span>
                          </span>
                          <span className="font-bold">
                            {zone.runs} <span className="text-[10px] font-normal opacity-80">({percentage}%)</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eee5dc] bg-[#f8f5ef] px-6 py-3.5">
              <div className="text-xs text-[#7d756d]">
                Tip: Use <kbd className="rounded bg-white px-1.5 py-0.5 border border-[#ddd] font-mono text-[10px]">Esc</kbd> to exit full wagon wheel arena.
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="primary-button text-xs py-2 px-5"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
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
function matchFormValues(match?: Match | null) { const legacy = { phase: match?.bowlingPhase, overs: match?.overs ?? 0, wickets: match?.wickets ?? 0, runsConceded: match?.runsConceded ?? 0, maidens: match?.maidens ?? 0 }; const spells = normalizeBowlingSpells(match?.bowlingSpells, legacy).map((spell) => ({ id: spell.id, phase: spell.phase ?? "", overs: spell.overs ? ballsToOvers(oversToBalls(spell.overs) ?? 0) : "", wickets: spell.wickets ? String(spell.wickets) : "", runsConceded: spell.runsConceded ? String(spell.runsConceded) : "", maidens: spell.maidens ? String(spell.maidens) : "" })); return { date: match?.date ?? "", opponent: match?.opponent ?? "", venue: match?.venue ?? "", format: match?.format ?? "", dismissalType: match?.dismissalType ?? "", runs: match ? String(match.runs) : "", ballsFaced: match ? String(match.ballsFaced) : "", fours: match ? String(match.fours) : "", sixes: match ? String(match.sixes) : "", scoringZones: Object.fromEntries(scoringZones.map((zone) => [zone.id, match?.scoringZones?.[zone.id] ? String(match.scoringZones[zone.id]) : ""])) as Record<string, string>, spells: spells.length ? spells : [emptySpell(1)], catches: match ? String(match.catches) : "", runOuts: match ? String(match.runOuts) : "" }; }

export function RichMatchModal({ match, onClose, onSave }: { match?: Match | null; onClose: () => void; onSave: (match: MatchDraft) => void }) {
  const [section, setSection] = useState<Section>("basics"); const [values, setValues] = useState(() => matchFormValues(match)); const [error, setError] = useState(""); useMatchDialogFocus(onClose); useEffect(() => { setValues(matchFormValues(match)); setSection("basics"); setError(""); }, [match]);
  const update = (key: Exclude<keyof typeof values, "spells" | "scoringZones">, value: string) => { setValues((previous) => ({ ...previous, [key]: value })); setError(""); }; const updateZone = (id: string, value: string) => { setValues((previous) => ({ ...previous, scoringZones: { ...previous.scoringZones, [id]: value } })); setError(""); }; const updateSpell = (id: string, key: keyof SpellValues, value: string) => { setValues((previous) => ({ ...previous, spells: previous.spells.map((spell) => spell.id === id ? { ...spell, [key]: value } : spell) })); setError(""); };
  const runs = number(values.runs); const balls = number(values.ballsFaced); const selectedZones = normalizeScoringZones(values.scoringZones); const zonesRuns = scoringZoneTotal(selectedZones); const spells = values.spells.map((spell) => ({ id: spell.id, phase: spell.phase || undefined, overs: Number(spell.overs || 0), wickets: number(spell.wickets), runsConceded: number(spell.runsConceded), maidens: number(spell.maidens) })); const totals = spellTotals(spells); const strikeRate = balls ? ((runs / balls) * 100).toFixed(1) : "Not calculated"; const economy = totals.overs ? economyFor(totals.runsConceded, totals.overs) : "Not calculated";
  const save = () => { if ([runs, balls, number(values.fours), number(values.sixes), number(values.catches), number(values.runOuts), ...spells.flatMap((spell) => [spell.wickets, spell.runsConceded, spell.maidens])].some((value) => value < 0)) { setError("Use zero or a positive value for match statistics."); return; } if (zonesRuns > runs) { setError("Your selected scoring-zone runs cannot exceed the total runs in this innings."); return; } for (const spell of spells) { const scorecardError = validateScorecard({ runs, fours: number(values.fours), sixes: number(values.sixes), overs: spell.overs ? String(spell.overs) : "", maidens: spell.maidens }); if (scorecardError === "Boundaries exceed runs.") { setError("Fours and sixes cannot add up to more than the runs entered."); return; } if (scorecardError === "Use valid cricket-over notation.") { setError("Use the overs arrows or enter a valid overs value."); return; } if (scorecardError === "A single spell cannot exceed 50 overs.") { setError("Enter up to 50 overs for a single spell."); return; } if (scorecardError === "Maidens exceed completed overs.") { setError("Maidens cannot exceed completed overs in a spell."); return; } } const cleanedSpells = spells.filter((spell) => spell.overs || spell.wickets || spell.runsConceded || spell.maidens || spell.phase); onSave({ date: values.date || undefined, opponent: values.opponent.trim() || undefined, venue: values.venue.trim() || undefined, format: values.format.trim() || undefined, dismissalType: values.dismissalType || undefined, scoringZones: selectedZones, bowlingSpells: cleanedSpells, bowlingPhase: cleanedSpells[0]?.phase, runs, ballsFaced: balls, fours: number(values.fours), sixes: number(values.sixes), ...spellTotals(cleanedSpells), catches: number(values.catches), runOuts: number(values.runOuts) }); };
  const tabs: { id: Section; label: string }[] = [{ id: "basics", label: "1. Basics" }, { id: "batting", label: "2. Batting" }, { id: "bowling", label: "3. Bowling" }, { id: "fielding", label: "4. Fielding" }]; const previous = () => setSection((current) => current === "basics" ? "basics" : current === "batting" ? "basics" : current === "bowling" ? "batting" : "bowling"); const next = () => setSection((current) => current === "basics" ? "batting" : current === "batting" ? "bowling" : current === "bowling" ? "fielding" : "fielding");
  return <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={match ? "Edit match" : "Log a match"}><div className="modal-card max-w-3xl"><div className="flex items-start justify-between"><div><div className="eyebrow mb-1">Match notebook</div><h2 className="font-display text-2xl font-semibold tracking-[-0.04em]">{match ? "Correct this match record." : "Add what matters from this match."}</h2></div><button onClick={onClose} className="rounded-full p-2 text-[#958d84] hover:bg-[#f0ece6]" aria-label="Close"><X size={18} /></button></div><p className="mt-3 text-sm leading-6 text-[#7d756e]">All totals recalculate from your individual spells.</p><div className="mt-6 flex overflow-x-auto border-b border-[#e7ded5]" role="tablist">{tabs.map((tab) => <button key={tab.id} onClick={() => setSection(tab.id)} role="tab" aria-selected={section === tab.id} className={`shrink-0 border-b-2 px-3 py-3 text-xs font-bold ${section === tab.id ? "border-[#e66a2c] text-[#bf5221]" : "border-transparent text-[#8f877f]"}`}>{tab.label}</button>)}</div><div className="mt-6 min-h-[240px]">{section === "basics" && <div className="grid gap-4 sm:grid-cols-2"><label className="field-label">Match date <span className="normal-case font-medium tracking-normal text-[#a0968b]">(optional)</span><input className="field-input" type="date" value={values.date} onChange={(event) => update("date", event.target.value)} /></label><label className="field-label">Format <select className="field-input" value={values.format} onChange={(event) => update("format", event.target.value)}><option value="">Choose later</option><option>T20</option><option>One-day</option><option>Multi-day</option><option>Practice</option></select></label><label className="field-label">Opponent <input className="field-input" value={values.opponent} onChange={(event) => update("opponent", event.target.value)} placeholder="e.g. Riverside CC" /></label><label className="field-label">Venue <input className="field-input" value={values.venue} onChange={(event) => update("venue", event.target.value)} placeholder="e.g. Home ground" /></label></div>}{section === "batting" && <div className="space-y-5"><div className="grid gap-4 sm:grid-cols-2"><StatField label="Runs" value={values.runs} onChange={(value) => update("runs", value)} /><StatField label="Balls faced" value={values.ballsFaced} onChange={(value) => update("ballsFaced", value)} /><StatField label="Fours" value={values.fours} onChange={(value) => update("fours", value)} /><StatField label="Sixes" value={values.sixes} onChange={(value) => update("sixes", value)} /><label className="field-label sm:col-span-2">Dismissal type <select className="field-input" value={values.dismissalType} onChange={(event) => update("dismissalType", event.target.value)}><option value="">Not recorded</option>{dismissalTypes.map((dismissal) => <option key={dismissal}>{dismissal}</option>)}</select></label></div><section className="rounded-2xl border border-[#eee6de] bg-[#fcfaf7] p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><div className="eyebrow">Run locations · optional</div><h3 className="mt-1 font-display text-xl font-semibold">Build your scoring map.</h3></div><span className="rounded-full bg-[#fff0e7] px-2.5 py-1 text-[10px] font-bold text-[#b45124]">{zonesRuns} mapped runs</span></div><p className="mt-2 text-xs leading-5 text-[#7d756d]">Log the areas you want to track; mapped runs can be a partial view of the innings.</p><div className="mt-4 grid gap-3 sm:grid-cols-2">{scoringZones.map((zone) => <StatField key={zone.id} label={`Runs — ${zone.label}`} value={values.scoringZones[zone.id] || ""} onChange={(value) => updateZone(zone.id, value)} />)}</div></section><div className="metric-tile"><div className="font-display text-xl font-semibold">{strikeRate}</div><div className="nutrition-label">calculated strike rate</div></div></div>}{section === "bowling" && <div className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="eyebrow">Separate bowling spells</div><h3 className="mt-1 font-display text-xl font-semibold">One spell, one phase.</h3></div><button type="button" onClick={() => setValues((previous) => previous.spells.length >= 8 ? previous : { ...previous, spells: [...previous.spells, emptySpell(previous.spells.length + 1)] })} disabled={values.spells.length >= 8} className="ghost-button disabled:opacity-40"><Plus size={14} /> Add spell</button></div><p className="text-xs leading-5 text-[#7d756d]">Use a separate spell for each phase or return to the bowling attack. CoachIQ combines them correctly in your match totals.</p>{values.spells.map((spell, index) => <section key={spell.id} className="rounded-2xl border border-[#eee6de] bg-[#fcfaf7] p-4"><div className="mb-4 flex items-center justify-between"><span className="rounded-full bg-[#e8f0e8] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#42624a]">Spell {index + 1}</span>{values.spells.length > 1 && <button type="button" onClick={() => setValues((previous) => ({ ...previous, spells: previous.spells.filter((item) => item.id !== spell.id) }))} className="text-button text-xs text-[#b45124]">Remove</button>}</div><div className="grid gap-4 sm:grid-cols-2"><StatField label="Wickets" value={spell.wickets} onChange={(value) => updateSpell(spell.id, "wickets", value)} /><OversStepper label="Overs bowled" value={spell.overs} onChange={(value) => updateSpell(spell.id, "overs", value)} /><StatField label="Runs conceded" value={spell.runsConceded} onChange={(value) => updateSpell(spell.id, "runsConceded", value)} /><StatField label="Maidens" value={spell.maidens} onChange={(value) => updateSpell(spell.id, "maidens", value)} /><label className="field-label sm:col-span-2">Main bowling phase <select className="field-input" value={spell.phase} onChange={(event) => updateSpell(spell.id, "phase", event.target.value)}><option value="">Not recorded</option>{bowlingPhases.map((phase) => <option key={phase}>{phase}</option>)}</select></label></div></section>)}<div className="grid gap-3 sm:grid-cols-3"><Metric label="Combined overs" value={ballsToOvers(oversToBalls(totals.overs) ?? 0)} icon={<Activity size={15} />} /><Metric label="Combined wickets" value={totals.wickets} icon={<Trophy size={15} />} /><Metric label="Economy" value={economy} icon={<Flame size={15} />} /></div></div>}{section === "fielding" && <div className="grid gap-4 sm:grid-cols-2"><StatField label="Catches" value={values.catches} onChange={(value) => update("catches", value)} /><StatField label="Run-outs" value={values.runOuts} onChange={(value) => update("runOuts", value)} /><div className="sm:col-span-2 rounded-2xl border border-[#eee6de] bg-[#fcfaf7] p-4 text-sm leading-6 text-[#7d756d]">Fielding details are optional. Log only the moments you want your scorebook to remember.</div></div>}</div>{error && <div role="alert" className="mt-5 rounded-xl border border-[#edc0a5] bg-[#fff4ed] p-3 text-sm font-semibold text-[#a4512b]">{error}</div>}<div className="mt-6 flex flex-wrap items-center justify-between gap-3"><button onClick={previous} className="ghost-button">Back</button><div className="flex gap-2"><button onClick={next} className="ghost-button">Next section <ChevronRight size={14} /></button><button onClick={save} className="primary-button"><Check size={15} /> {match ? "Save changes" : "Save what I have"}</button></div></div></div></div>;
}

function StatField({ label, value, onChange, max }: { label: string; value: string; onChange: (value: string) => void; max?: string }) { return <label className="field-label">{label}<input className="field-input mt-1" type="number" min="0" max={max} step="1" value={value} onChange={(event) => onChange(event.target.value)} placeholder="0" /></label>; }
function OversStepper({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="field-label">{label}<input className="field-input mt-1" inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value.replace(/[^0-9.]/g, ""))} placeholder="0" /></label>; }

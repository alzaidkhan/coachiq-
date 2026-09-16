import { lazy, Suspense, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { toast } from "sonner";
import {
  Apple,
  ArrowUpRight,
  BarChart3,
  BrainCircuit,
  CalendarDays,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  Dumbbell,
  Flag,
  Home as HomeIcon,
  Menu,
  NotebookPen,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
  UserRound,
  Utensils,
  X,
} from "lucide-react";
import { handleAssetImageError, ASSET_IMAGES } from "../lib/media";
import { portableAssets } from "../lib/portableAssets";
import { normalizeOvers } from "../lib/cricketStats";
import { durationToSeconds, formatCountdown, sessionProgress } from "../lib/drillSession";
import { clearCoachIQData, getBrowserStorage, parseImportedCoachIQData, readCoachIQData, writeCoachIQData } from "../lib/localData";
import { normalizeBowlingSpells, spellTotals, type BowlingSpell } from "../lib/matchModel";
import { availabilityChanged, completeMovedEntry, isDayReset, moveCollides, shouldConfirmFinalSkip } from "../lib/weeklyPlan";
import { ProfilePhotoModal } from "../components/ProfilePhotoModal";
import { NutritionView } from "../components/NutritionView";
import { CardSkeleton } from "../components/SkeletonLoader";
import { checkHasBodyMetrics } from "../lib/nutritionEngine";

const AICoachView = lazy(() => import("../components/CricketAddons").then((module) => ({ default: module.AICoachView })));
const DashboardView = lazy(() => import("../components/CricketAddons").then((module) => ({ default: module.DashboardView })));
const RichMatchModal = lazy(() => import("../components/CricketAddons").then((module) => ({ default: module.RichMatchModal })));

type View = "overview" | "plan" | "drills" | "nutrition" | "coach" | "progress" | "profile";
type Role = "Batsman" | "Fast bowler" | "Spin bowler" | "Wicketkeeper" | "All-rounder";
type Profile = {
  name: string;
  age: string;
  gender: string;
  region: string;
  heightCm: string;
  weightKg: string;
  role: Role;
  battingHand: string;
  bowlingStyle: string;
  level: string;
  goal: string;
  sessions: string;
  minutes: string;
  availableDays: string;
  diet: string;
  equipment: string;
  improvementNote: string;
  avatarUrl?: string;
};
type Drill = { id: string; title: string; category: string; duration: string; cue: string; image: string; roles: Role[]; setup: string; steps: string[]; completion: string };
type SessionLog = { id: string; date: string; drillId: string; minutes: number };
type MatchLog = {
  id: string;
  date: string;
  opponent?: string;
  venue?: string;
  format?: string;
  dismissalType?: string;
  bowlingPhase?: string;
  bowlingSpells?: BowlingSpell[];
  runs: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  wickets: number;
  overs: number;
  runsConceded: number;
  maidens: number;
  catches: number;
  runOuts: number;
};
type ActivityLog = { sessions: SessionLog[]; matches: MatchLog[] };
type ScheduleStatus = "planned" | "completed" | "skipped" | "moved" | "rest";
type WeekSchedule = Record<number, { status: ScheduleStatus; movedTo?: number }>;

const ASSETS = {
  ...portableAssets,
  hero: ASSET_IMAGES.hero,
  todayFocus: ASSET_IMAGES.todayFocus,
  matchInsight: ASSET_IMAGES.matchInsight,
};
const roles: Role[] = ["Batsman", "Fast bowler", "Spin bowler", "Wicketkeeper", "All-rounder"];
const goals = ["Build match stamina", "Add bowling pace", "Sharpen cover drive", "Improve consistency", "Build strength"];
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const emptyProfile: Profile = {
  name: "",
  age: "",
  gender: "",
  region: "",
  heightCm: "",
  weightKg: "",
  role: "" as Role,
  battingHand: "Right-hand",
  bowlingStyle: "Pace",
  level: "",
  goal: "",
  sessions: "3",
  minutes: "30",
  availableDays: "",
  diet: "Vegetarian",
  equipment: "",
  improvementNote: "",
  avatarUrl: "",
};
const drills: Drill[] = [
  {
    id: "shadow",
    title: "Shadow batting: front foot",
    category: "Technique",
    duration: "12 min",
    cue: "Stay tall through contact",
    image: ASSET_IMAGES.batting,
    roles: ["Batsman", "All-rounder"],
    setup: "Bring a bat to a clear, level space. Choose an imaginary good-length ball just outside off stump and keep enough room to finish every swing safely.",
    steps: ["Warm up with 10 relaxed bat lifts and five slow forward strides.", "Complete three sets of eight shadow drives, planting the front foot toward the imagined line of the ball.", "After each set, check that your head is still, your front knee is soft, and the bat face would meet the ball under your eyes.", "Finish with six smooth, match-tempo repetitions. Quality matters more than speed."],
    completion: "You should finish able to name one cue that kept your balance through the shot.",
  },
  {
    id: "cones",
    title: "Cone bowling: line & length",
    category: "Bowling",
    duration: "20 min",
    cue: "Hit the same window",
    image: ASSET_IMAGES.bowling,
    roles: ["Fast bowler", "Spin bowler", "All-rounder"],
    setup: "Mark a safe run-up and place one cone on a good-length target. Use a soft ball or a clear net space; never bowl toward people or a hard surface without room to stop safely.",
    steps: ["Walk through four balanced run-ups or delivery strides before releasing a ball.", "Bowl two six-ball sets at the cone, keeping the same target rather than chasing pace.", "Between sets, note where the first bounce landed and make one small adjustment to your alignment or release point.", "Finish with one six-ball set at controlled match intensity, counting how many deliveries land in your target window."],
    completion: "Record the target hits you noticed, then choose the one delivery you would repeat next time.",
  },
  {
    id: "mobility",
    title: "Shoulder + hip reset",
    category: "Recovery",
    duration: "8 min",
    cue: "Slow is smooth today",
    image: ASSET_IMAGES.recovery,
    roles,
    setup: "Use a clear floor with enough space to lie down and reach your arms overhead. Move only through a comfortable range and stop if you feel pain.",
    steps: ["Take five slow breaths, then make gentle shoulder circles in both directions.", "Complete six controlled hip openers on each side while keeping your trunk tall.", "Move through eight slow bodyweight hinges, feeling your hips travel back without forcing range.", "Finish with a calm 60-second walk and notice whether your shoulders and hips feel easier to move."],
    completion: "Finish feeling looser, not exhausted. If anything hurts, leave it out and ask a qualified coach or clinician for advice.",
  },
];
const weeklyPlan: Record<Role, string[]> = {
  Batsman: ["Front-foot rhythm", "Pull shot timing", "Strength + trunk", "Recovery walk", "Throwdowns", "Mobility reset", "Rest / reflect"],
  "Fast bowler": ["Run-up rhythm", "Shoulder strength", "Recovery + mobility", "Cone bowling", "Lower-body power", "Easy skills", "Rest / reflect"],
  "Spin bowler": ["Wrist position", "Flight + dip", "Strength + trunk", "Recovery walk", "Target bowling", "Mobility reset", "Rest / reflect"],
  Wicketkeeper: ["Footwork ladder", "Low catch rhythm", "Hip mobility", "Reaction hands", "Core + balance", "Easy skills", "Rest / reflect"],
  "All-rounder": ["Front-foot rhythm", "Cone bowling", "Core + legs", "Recovery walk", "Skill circuit", "Mobility reset", "Rest / reflect"],
};

function drillForWeekSession(session: string, role: Role) {
  const normalized = session.toLowerCase();
  if (normalized.includes("rest")) return null;
  if (normalized.includes("bowl") || normalized.includes("wrist") || normalized.includes("flight") || role === "Fast bowler" || role === "Spin bowler") return drills.find((drill) => drill.id === "cones") ?? drills[0];
  if (normalized.includes("mobility") || normalized.includes("recovery")) return drills.find((drill) => drill.id === "mobility") ?? drills[0];
  return drills.find((drill) => drill.id === "shadow") ?? drills[0];
}

function weeklySessionSteps(session: string, profile: Profile) {
  const focus = profile.improvementNote.trim() || profile.goal.toLowerCase();
  return [
    `Prepare for 3 minutes: clear your space, collect ${profile.equipment || "your available equipment"}, and choose one safe practice target.`,
    `Build the main block around “${session.split(" · ")[0]}” for about ${Math.max(10, number(profile.minutes) - 8)} minutes, returning to the same simple cue each rep.`,
    `Use your focus — “${focus.slice(0, 110)}” — to decide whether a rep was useful. Change one thing at a time.`,
    "Close with two calm minutes, then write one short note about the best rep or the adjustment for next time.",
  ];
}

function number(value: string | number | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
function dateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}
function currentDayIndex() {
  const sundayBased = new Date().getDay();
  return sundayBased === 0 ? 6 : sundayBased - 1;
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
function normalizeActivity(value: unknown): ActivityLog {
  const saved = isRecord(value) ? value : {};
  const sessions = Array.isArray(saved.sessions) ? saved.sessions.filter(isRecord).map((session) => ({
    id: typeof session.id === "string" ? session.id : `session-${Date.now()}`,
    date: typeof session.date === "string" ? session.date : dateKey(),
    drillId: typeof session.drillId === "string" ? session.drillId : "unknown",
    minutes: number(typeof session.minutes === "number" || typeof session.minutes === "string" ? session.minutes : 0),
  })) : [];
  const matches = Array.isArray(saved.matches) ? saved.matches.filter(isRecord).map((match) => {
    const bowlingPhase = typeof match.bowlingPhase === "string" ? match.bowlingPhase : undefined;
    const legacy = {
      phase: bowlingPhase,
      overs: normalizeOvers(typeof match.overs === "number" || typeof match.overs === "string" ? match.overs : 0),
      wickets: number(typeof match.wickets === "number" || typeof match.wickets === "string" ? match.wickets : 0),
      runsConceded: number(typeof match.runsConceded === "number" || typeof match.runsConceded === "string" ? match.runsConceded : 0),
      maidens: number(typeof match.maidens === "number" || typeof match.maidens === "string" ? match.maidens : 0),
    };
    const bowlingSpells = normalizeBowlingSpells(match.bowlingSpells, legacy);
    const totals = spellTotals(bowlingSpells);
    return {
      id: typeof match.id === "string" ? match.id : `match-${Date.now()}`,
      date: typeof match.date === "string" ? match.date : dateKey(),
      opponent: typeof match.opponent === "string" ? match.opponent : undefined,
      venue: typeof match.venue === "string" ? match.venue : undefined,
      format: typeof match.format === "string" ? match.format : undefined,
      dismissalType: typeof match.dismissalType === "string" ? match.dismissalType : undefined,
      bowlingPhase,
      bowlingSpells,
      runs: number(typeof match.runs === "number" || typeof match.runs === "string" ? match.runs : 0),
      ballsFaced: number(typeof match.ballsFaced === "number" || typeof match.ballsFaced === "string" ? match.ballsFaced : 0),
      fours: number(typeof match.fours === "number" || typeof match.fours === "string" ? match.fours : 0),
      sixes: number(typeof match.sixes === "number" || typeof match.sixes === "string" ? match.sixes : 0),
      ...totals,
      catches: number(typeof match.catches === "number" || typeof match.catches === "string" ? match.catches : 0),
      runOuts: number(typeof match.runOuts === "number" || typeof match.runOuts === "string" ? match.runOuts : 0),
    };
  }) : [];
  return { sessions, matches };
}
function normalizeSchedule(value: unknown): WeekSchedule {
  if (!isRecord(value)) return {};
  const statuses: ScheduleStatus[] = ["planned", "completed", "skipped", "moved", "rest"];
  return Object.entries(value).reduce<WeekSchedule>((next, [day, entry]) => {
    const index = Number(day);
    if (!Number.isInteger(index) || index < 0 || index > 6 || !isRecord(entry) || !statuses.includes(entry.status as ScheduleStatus)) return next;
    const movedTo = Number(entry.movedTo);
    next[index] = { status: entry.status as ScheduleStatus, ...(Number.isInteger(movedTo) && movedTo >= 0 && movedTo < 7 ? { movedTo } : {}) };
    return next;
  }, {});
}
function nutrition(profile: Profile) {
  const weight = Math.max(number(profile.weightKg), 40);
  const load = Math.max(number(profile.sessions), 2);
  const levelBoost = profile.level === "Advanced" ? 260 : profile.level === "Intermediate" ? 170 : 90;
  const calories = Math.round(weight * 28 + load * 55 + levelBoost);
  const protein = Math.round(weight * (profile.role === "Fast bowler" || profile.role === "All-rounder" ? 1.65 : 1.45));
  const carbs = Math.round((calories * 0.52) / 4);
  const fats = Math.round((calories * 0.26) / 9);
  const meals = profile.diet === "Non-vegetarian"
    ? ["Eggs + toast + fruit", "Chicken or fish, rice + greens", "Curd + fruit", "Dal, chicken or eggs + roti"]
    : profile.diet === "Plant-forward"
      ? ["Oats + nut butter + fruit", "Lentil bowl + rice + greens", "Soy yogurt + seeds", "Tofu or fish with potatoes"]
      : ["Oats + banana + curd", "Dal, rice, paneer + seasonal veg", "Roasted chana + fruit", "Khichdi or tofu wrap"];
  return { calories, protein, carbs, fats, meals };
}
function imageFallback(event: React.SyntheticEvent<HTMLImageElement>) {
  handleAssetImageError(event);
}
function IconBadge({ children, tone = "orange" }: { children: React.ReactNode; tone?: "orange" | "green" | "blue" }) {
  const className = { orange: "bg-[#fff0e7] text-[#d65a20]", green: "bg-[#e8f0e8] text-[#365b44]", blue: "bg-[#e8f1f5] text-[#3b6e82]" }[tone];
  return <span className={`inline-grid h-9 w-9 place-items-center rounded-xl ${className}`}>{children}</span>;
}

export default function Home() {
  const requestedView = new URLSearchParams(window.location.search).get("view") as View | null;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [draft, setDraft] = useState<Profile>(emptyProfile);
  const [activity, setActivity] = useState<ActivityLog>({ sessions: [], matches: [] });
  const [schedule, setSchedule] = useState<WeekSchedule>({});
  const [view, setView] = useState<View>(requestedView && ["overview", "plan", "drills", "nutrition", "coach", "progress", "profile"].includes(requestedView) ? requestedView : "overview");
  const [mobileNav, setMobileNav] = useState(false);
  const [showMatchForm, setShowMatchForm] = useState(false);
  const [editingMatch, setEditingMatch] = useState<MatchLog | null>(null);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [reflected, setReflected] = useState(false);
  const [activeDrill, setActiveDrill] = useState<Drill | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);

  useEffect(() => {
    const storage = getBrowserStorage();
    const { data, migrated, available } = readCoachIQData(storage);
    setStorageAvailable(available);
    const nextProfile = { ...emptyProfile, ...data.profile } as Profile;
    const nextActivity = normalizeActivity(data.activity);
    const nextSchedule = normalizeSchedule(data.schedule);
    if (nextProfile.goal && nextProfile.role && nextProfile.level && nextProfile.equipment) {
      setProfile(nextProfile);
      setDraft(nextProfile);
    }
    setActivity(nextActivity);
    setSchedule(nextSchedule);
    if (migrated) setStorageAvailable(writeCoachIQData(storage, { profile: nextProfile.goal ? nextProfile : {}, activity: nextActivity, schedule: nextSchedule }).stored);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const result = writeCoachIQData(getBrowserStorage(), { profile: profile ?? {}, activity, schedule });
    if (!result.stored) setStorageAvailable(false);
  }, [profile, activity, schedule, hydrated]);

  const go = (next: View) => {
    setView(next);
    setMobileNav(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const completeOnboarding = (next: Profile) => {
    setProfile(next);
    setDraft(next);
    go("overview");
    toast.success("Your CoachIQ desk is ready", { description: "Start with today’s session. Your real progress begins at zero." });
  };
  const saveProfile = () => {
    const availabilityWasChanged = availabilityChanged(profile?.availableDays, draft.availableDays);
    setProfile(draft);
    setShowProfileEditor(false);
    toast.success("Player profile updated", { description: availabilityWasChanged ? "Your availability changed. Existing sessions stay where they are until you move, skip, or reset them." : "Your week and fuel targets have been refreshed." });
  };
  const handleUpdateMetrics = (heightCm: string, weightKg: string, diet?: string) => {
    setProfile((previous) => {
      if (!previous) return previous;
      const updated = { ...previous, heightCm, weightKg, ...(diet ? { diet } : {}) };
      setDraft(updated);
      return updated;
    });
    toast.success("Body metrics saved", {
      description: "Your personalized cricket meal plan and exact gram measurements are ready.",
    });
  };
  const toggleDrill = (drillId: string) => {
    const today = dateKey();
    const alreadyLogged = activity.sessions.some((entry) => entry.date === today && entry.drillId === drillId);
    setActivity((previous) => ({
      ...previous,
      sessions: alreadyLogged
        ? previous.sessions.filter((entry) => !(entry.date === today && entry.drillId === drillId))
        : [...previous.sessions, { id: `${drillId}-${Date.now()}`, date: today, drillId, minutes: number(drills.find((item) => item.id === drillId)?.duration) }],
    }));
    if (!alreadyLogged) toast.success("Drill marked complete", { description: "Your daily loop and training history are updated." });
  };
  const startDrill = (drill: Drill) => setActiveDrill(drill);
  const completeGuidedDrill = (drillId: string) => {
    const alreadyLogged = activity.sessions.some((entry) => entry.date === dateKey() && entry.drillId === drillId);
    if (alreadyLogged) {
      toast.info("This drill is already logged", { description: "Use the daily loop if you want to mark it incomplete." });
    } else {
      setActivity((previous) => ({ ...previous, sessions: [...previous.sessions, { id: `${drillId}-${Date.now()}`, date: dateKey(), drillId, minutes: number(drills.find((item) => item.id === drillId)?.duration) }] }));
      toast.success("Guided drill completed", { description: "Your training history now includes this session." });
    }
    setActiveDrill(null);
  };
  const openNewMatch = () => {
    setEditingMatch(null);
    setShowMatchForm(true);
  };
  const saveMatch = (match: Omit<MatchLog, "id" | "date"> & { date?: string }) => {
    if (editingMatch) {
      setActivity((previous) => ({ ...previous, matches: previous.matches.map((entry) => entry.id === editingMatch.id ? { ...entry, ...match, date: match.date || entry.date } : entry) }));
      toast.success("Match updated", { description: "Your dashboard now reflects the corrected scorecard." });
    } else {
      setActivity((previous) => ({ ...previous, matches: [...previous.matches, { ...match, id: `match-${Date.now()}`, date: match.date || dateKey() }] }));
      toast.success("Match saved", { description: "Your dashboard now uses this match data." });
    }
    setEditingMatch(null);
    setShowMatchForm(false);
  };
  const deleteMatch = (match: MatchLog) => {
    if (!window.confirm(`Delete the match against ${match.opponent || "this opponent"} from ${match.date}? This only removes it from this browser.`)) return;
    setActivity((previous) => ({ ...previous, matches: previous.matches.filter((entry) => entry.id !== match.id) }));
    toast.success("Match removed", { description: "Your local dashboard has been recalculated." });
  };
  const updateSchedule = (day: number, entry: WeekSchedule[number]) => {
    const previousEntry = schedule[day];
    if (entry.status === "moved" && entry.movedTo !== undefined) {
      const destination = schedule[entry.movedTo];
      if (moveCollides(schedule, entry.movedTo) && !window.confirm(`${days[entry.movedTo]} already has a ${destination?.status} session. Keep both sessions on that day?`)) return;
    }
    if (entry.status === "skipped") {
      if (shouldConfirmFinalSkip(schedule) && !window.confirm("This may leave no planned training session for the rest of this week. Skip it anyway?")) return;
    }
    const nextEntry = completeMovedEntry(previousEntry, entry);
    setSchedule((previous) => ({ ...previous, [day]: nextEntry }));
    if (entry.status === "moved" && entry.movedTo !== undefined) toast.info(`Moved to ${days[entry.movedTo]}`, { description: "The existing session stays in place, so you can decide which rep matters most." });
    if (entry.status === "completed" && previousEntry?.status === "moved") toast.success("Moved session completed", { description: "The scorebook keeps its move note and records the session as complete." });
    if (isDayReset(previousEntry, entry)) toast.info("Day reset", { description: "This day is back to its original planned state. Other edited days remain unchanged." });
  };
  const handleReflection = () => {
    if (reflected) {
      go("plan");
      return;
    }
    setReflected(true);
    toast.success("Reflection saved", { description: "Your weekly plan now holds the next useful rep." });
  };
  const exportData = () => {
    const { data, available } = readCoachIQData(getBrowserStorage());
    if (!available) {
      toast.error("Browser storage is unavailable", { description: "CoachIQ can still run in this tab, but export and persistent saving need browser storage enabled." });
      return;
    }
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `coachiq-data-${dateKey()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Your CoachIQ data is ready", { description: "Keep the exported file somewhere you trust." });
  };
  const importData = async (file: File) => {
    const imported = parseImportedCoachIQData(await file.text());
    if (!imported) {
      toast.error("That file is not a CoachIQ data export", { description: "Choose a version 1 CoachIQ JSON export." });
      return;
    }
    const nextProfile = { ...emptyProfile, ...imported.profile } as Profile;
    if (!nextProfile.goal || !nextProfile.role || !nextProfile.level || !nextProfile.equipment) {
      toast.error("That export does not contain a complete player card", { description: "Your current data was not changed." });
      return;
    }
    const nextActivity = normalizeActivity(imported.activity);
    const nextSchedule = normalizeSchedule(imported.schedule);
    const result = writeCoachIQData(getBrowserStorage(), { profile: nextProfile, activity: nextActivity, schedule: nextSchedule });
    setStorageAvailable(result.stored);
    setProfile(nextProfile);
    setDraft(nextProfile);
    setActivity(nextActivity);
    setSchedule(nextSchedule);
    if (result.stored) toast.success("CoachIQ data imported", { description: "Your player card, activity, and week are restored in this browser." });
    else toast.error("Imported for this tab only", { description: "Browser storage is blocked, so enable browser storage before relying on this data after closing the tab." });
  };
  const resetData = () => {
    if (!window.confirm("Reset your local CoachIQ player card, schedule, sessions, and match history on this device? This cannot be undone.")) return;
    const cleared = clearCoachIQData(getBrowserStorage());
    setStorageAvailable(cleared);
    setProfile(null);
    setDraft(emptyProfile);
    setActivity({ sessions: [], matches: [] });
    setSchedule({});
    setReflected(false);
    setView("overview");
    toast.success("Local CoachIQ data reset", { description: "You can build a new player card whenever you are ready." });
  };

  if (!profile) return <Onboarding draft={draft} setDraft={setDraft} onComplete={completeOnboarding} />;

  const today = currentDayIndex();
  const todayCompleted = activity.sessions.filter((entry) => entry.date === dateKey()).map((entry) => entry.drillId);
  const firstName = profile.name.trim().split(" ")[0] || "player";
  const planWithFocus = profile.improvementNote.trim()
    ? weeklyPlan[profile.role].map((session, index) => index === 0 ? `${session} · focus: ${profile.improvementNote.trim().slice(0, 86)}` : session)
    : weeklyPlan[profile.role];
  const navigation: { id: View; label: string; icon: typeof HomeIcon }[] = [
    { id: "overview", label: "Today", icon: HomeIcon },
    { id: "plan", label: "My week", icon: CalendarDays },
    { id: "drills", label: "Drill library", icon: Dumbbell },
    { id: "nutrition", label: "Nutrition", icon: Apple },
    { id: "coach", label: "AI Coach", icon: BrainCircuit },
    { id: "progress", label: "Dashboard", icon: BarChart3 },
  ];

  return <div className="min-h-screen bg-[#f6f2ec] text-[#19221c]">
    <div className="grain" aria-hidden="true" />
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[244px] flex-col border-r border-[#e6ddd4] bg-[#f9f6f1] px-5 py-6 lg:flex">
      <BrandButton onClick={() => go("overview")} />
      <nav className="mt-12 space-y-1" aria-label="CoachIQ navigation">
        <div className="eyebrow mb-3 px-3">Your desk</div>
        {navigation.map((item) => <NavigationButton key={item.id} item={item} active={view === item.id} onClick={() => go(item.id)} />)}
        <div className="eyebrow mb-3 mt-10 px-3">Keep building</div>
        <NavigationButton item={{ label: "Player profile", icon: UserRound }} active={view === "profile"} onClick={() => go("profile")} />
        <button onClick={() => toast.info("CoachIQ is free by design", { description: "No login, paywall, or server-held training profile." })} className="nav-item"><CircleHelp size={17} /> How it works</button>
      </nav>
      <div className="mt-auto rounded-2xl bg-[#1d3024] p-4 text-[#f4eee5] shadow-[0_12px_30px_rgba(29,48,36,0.16)]">
        <div className="eyebrow text-[#b6c8ba]">Your activity</div>
        <div className="mt-3 font-display text-xl font-semibold">Small reps.<br />Big difference.</div>
        <div className="mt-5 h-1.5 rounded-full bg-[#48614e]"><div className="h-full rounded-full bg-[#e66a2c]" style={{ width: `${Math.min(activity.sessions.length * 12, 100)}%` }} /></div>
        <div className="mt-2 flex justify-between text-[10px] font-bold uppercase tracking-[0.12em] text-[#a8b9aa]"><span>{activity.sessions.length} reps logged</span><span>{activity.matches.length} matches</span></div>
      </div>
    </aside>
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#e6ddd4] bg-[#f9f6f1]/95 px-4 py-3 backdrop-blur lg:hidden">
      <BrandButton onClick={() => go("overview")} compact />
      <button onClick={() => setMobileNav((current) => !current)} className="rounded-xl p-2 hover:bg-[#eee6dc]" aria-label="Open navigation">{mobileNav ? <X size={21} /> : <Menu size={21} />}</button>
    </header>
    {mobileNav && <div className="fixed inset-x-0 top-[57px] z-20 border-b border-[#e6ddd4] bg-[#f9f6f1] p-3 shadow-lg lg:hidden">{navigation.map((item) => <NavigationButton key={item.id} item={item} active={view === item.id} onClick={() => go(item.id)} />)}<NavigationButton item={{ label: "Player profile", icon: UserRound }} active={view === "profile"} onClick={() => go("profile")} /></div>}
    <main className="lg:ml-[244px]">
      <div className="mx-auto max-w-[1480px] px-4 py-6 sm:px-7 sm:py-8 lg:px-10 lg:py-10">
        <header className="mb-8 flex items-start justify-between gap-4 sm:mb-10">
          <div><div className="eyebrow mb-2 flex items-center gap-2"><span className="inline-block h-2 w-2 rounded-full bg-[#e66a2c]" />{profile.region || "Your coaching desk"} · {profile.role}</div><h1 className="font-display max-w-2xl text-[29px] font-semibold leading-[1.05] tracking-[-0.05em] sm:text-[43px]">{pageHeading(view, firstName, profile.goal)}</h1></div>
          <div className="hidden items-center gap-3 sm:flex">
            <button onClick={() => setShowProfileEditor(true)} className="ghost-button"><Settings2 size={16} /> Edit details</button>
            <button
              type="button"
              onClick={() => setShowPhotoModal(true)}
              className="profile-chip text-left transition hover:border-[#cfc4b7]"
              title="Click to update profile photo"
            >
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt=""
                  className="h-8 w-8 rounded-full border border-white/40 object-cover shadow-sm"
                  referrerPolicy="no-referrer"
                  onError={(event) => handleAssetImageError(event, "avatar")}
                />
              ) : (
                <span className="grid h-8 w-8 place-items-center rounded-full bg-[#e66a2c] font-display text-sm font-bold text-white shadow-sm">{firstName[0]?.toUpperCase()}</span>
              )}
              <span className="hidden text-left md:block">
                <span className="block text-xs font-bold leading-none">{profile.name || "Local player"}</span>
                <span className="mt-1 block text-[10px] uppercase tracking-[0.14em] text-[#8b837b]">Photo / Role</span>
              </span>
            </button>
          </div>
        </header>
        {view === "overview" && <Overview profile={profile} activity={activity} completedIds={todayCompleted} onToggle={toggleDrill} onStart={startDrill} onGo={go} onMatch={openNewMatch} reflected={reflected} onReflect={handleReflection} />}
        {view === "plan" && <><PlanView profile={profile} plan={planWithFocus} today={today} schedule={schedule} onUpdate={updateSchedule} onStart={startDrill} /><PlanFocusRationale note={profile.improvementNote} /></>}
        {view === "drills" && <EnhancedDrillDiscovery profile={profile} completedIds={todayCompleted} onToggle={toggleDrill} onStart={startDrill} />}
        {view === "nutrition" && <NutritionView profile={profile} onUpdateMetrics={handleUpdateMetrics} />}
        {view === "coach" && <Suspense fallback={<CardSkeleton title="Loading AI Coach…" />}><AICoachView profile={profile} activity={activity} /></Suspense>}
        {view === "progress" && <Suspense fallback={<CardSkeleton title="Loading Dashboard…" />}><DashboardView profile={profile} activity={activity} onAddMatch={openNewMatch} onEditMatch={(match) => { setEditingMatch(match); setShowMatchForm(true); }} onDeleteMatch={deleteMatch} /></Suspense>}
        {view === "profile" && <><ProfileView draft={draft} setDraft={setDraft} onSave={saveProfile} onOpenPhotoModal={() => setShowPhotoModal(true)} /><DataControls onExport={exportData} onImport={importData} onReset={resetData} storageAvailable={storageAvailable} /></>}
      </div>
    </main>
    {showProfileEditor && <ProfileDialog draft={draft} setDraft={setDraft} onClose={() => setShowProfileEditor(false)} onSave={saveProfile} />}
    {showPhotoModal && (
      <ProfilePhotoModal
        currentPhoto={draft.avatarUrl || profile.avatarUrl}
        playerName={draft.name || profile.name}
        role={draft.role || profile.role}
        onClose={() => setShowPhotoModal(false)}
        onSave={(url) => {
          setDraft((previous) => ({ ...previous, avatarUrl: url }));
          setProfile((previous) => (previous ? { ...previous, avatarUrl: url } : null));
          setShowPhotoModal(false);
          toast.success("Profile photo updated", { description: "Your custom avatar has been saved." });
        }}
      />
    )}
    {showMatchForm && <Suspense fallback={null}><RichMatchModal match={editingMatch} onClose={() => { setShowMatchForm(false); setEditingMatch(null); }} onSave={saveMatch} /></Suspense>}
    {activeDrill && <GuidedDrillSession drill={activeDrill} completed={todayCompleted.includes(activeDrill.id)} onClose={() => setActiveDrill(null)} onComplete={() => completeGuidedDrill(activeDrill.id)} />}
  </div>;
}

function pageHeading(view: View, firstName: string, goal: string) {
  const muted = (text: string) => <span className="text-[#748079]">{text}</span>;
  if (view === "overview") return <>Good morning, {firstName}.<br />{muted("Your next rep is ready.")}</>;
  if (view === "plan") return <>A week built for<br />{muted(goal.toLowerCase())}.</>;
  if (view === "drills") return <>The drill shelf.<br />{muted("Pick one. Make it count.")}</>;
  if (view === "nutrition") return <>Fuel for your<br />{muted("next innings.")}</>;
  if (view === "coach") return <>Ask your cricket<br />{muted("coach anything.")}</>;
  if (view === "progress") return <>Your game, in<br />{muted("loaded data.")}</>;
  return <>Your player profile.<br />{muted("Set the next target.")}</>;
}

function PlanFocusRationale({ note }: { note: string }) {
  if (!note.trim()) return null;
  return <section className="surface-card mt-5 border-l-4 border-l-[#e66a2c] p-5 sm:p-6"><div className="eyebrow mb-2 text-[#b46a44]">Your written focus</div><h2 className="font-display text-2xl font-semibold tracking-[-0.04em]">The week starts with what you want to fix.</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-[#7d756d]">CoachIQ has carried this into your first focused session and AI Coach context: <strong className="text-[#354239]">“{note.trim()}”</strong></p></section>;
}

function BrandButton({ onClick, compact = false }: { onClick: () => void; compact?: boolean }) {
  return <button className="flex items-center gap-3 text-left" onClick={onClick}><img src={ASSETS.mark} alt="" className={compact ? "h-8 w-8 rounded-lg" : "h-10 w-10 rounded-xl"} onError={(event) => handleAssetImageError(event, "brand")} /><span><span className="font-display block text-[17px] font-bold tracking-[-0.04em]">COACH<span className="text-[#e66a2c]">IQ</span></span>{!compact && <span className="block text-[10px] font-bold uppercase tracking-[0.17em] text-[#9a9188]">Your free cricket desk</span>}</span></button>;
}

function NavigationButton({ item, active, onClick }: { item: { label: string; icon: typeof HomeIcon }; active: boolean; onClick: () => void }) {
  const Icon = item.icon;
  return <button onClick={onClick} className={`nav-item ${active ? "nav-item-active" : ""}`} aria-current={active ? "page" : undefined}><Icon size={17} /><span>{item.label}</span>{active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#e66a2c]" />}</button>;
}

function Onboarding({ draft, setDraft, onComplete }: { draft: Profile; setDraft: Dispatch<SetStateAction<Profile>>; onComplete: (profile: Profile) => void }) {
  const [step, setStep] = useState(1);
  const [attempted, setAttempted] = useState(false);
  const update = (key: keyof Profile, value: string) => setDraft((previous) => ({ ...previous, [key]: value }));
  const valid = step === 1 ? Boolean(draft.goal && draft.role && draft.level) : step === 2 ? Boolean(draft.availableDays && draft.equipment.trim()) : true;
  const missingFields = step === 1
    ? [[!draft.goal, "Choose a goal to continue."], [!draft.role, "Select your playing role."], [!draft.level, "Select your experience level."]]
    : [[!draft.availableDays, "Choose the days that usually work."], [!draft.equipment.trim(), "Add at least one item of equipment."]];
  const firstMissingMessage = missingFields.find(([missing]) => missing)?.[1] ?? "Check the required details and try again.";
  useEffect(() => {
    const errorId = "onboarding-field-error";
    const syncButtons = (labels: readonly string[], selected: string, invalid: boolean) => labels.forEach((label) => {
      const button = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find((element) => element.textContent?.trim() === label);
      if (!button) return;
      button.setAttribute("aria-pressed", String(selected === label));
      if (invalid) button.setAttribute("aria-describedby", errorId); else button.removeAttribute("aria-describedby");
    });
    const goal = document.querySelector<HTMLSelectElement>("select");
    if (goal) { goal.setAttribute("aria-invalid", String(attempted && !draft.goal)); if (attempted && !draft.goal) goal.setAttribute("aria-describedby", errorId); else goal.removeAttribute("aria-describedby"); }
    syncButtons(roles, draft.role, attempted && !draft.role);
    syncButtons(["Beginner", "Intermediate", "Advanced"], draft.level, attempted && !draft.level);
    syncButtons(["Weekdays", "Weekends", "Flexible"], draft.availableDays, attempted && step === 2 && !draft.availableDays);
  }, [attempted, draft.availableDays, draft.goal, draft.level, draft.role, step]);
  const advance = () => {
    if (!valid) {
      setAttempted(true);
      requestAnimationFrame(() => {
        const selector = step === 1
          ? !draft.goal ? "select" : !draft.role ? "fieldset button" : "fieldset:last-of-type button"
          : !draft.availableDays ? "fieldset button" : "input[placeholder='e.g. Bat, ball, cones']";
        document.querySelector<HTMLElement>(selector)?.focus();
      });
      return;
    }
    setAttempted(false);
    if (step < 3) setStep((current) => current + 1);
    else onComplete(draft);
  };
  const invalid = (condition: boolean) => attempted && condition ? "border-[#e66a2c] bg-[#fff8f3]" : "";
  return <div className="onboarding-shell min-h-screen bg-[#f6f2ec] text-[#19221c]">
    <div className="grain" aria-hidden="true" />
    <header className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-10 sm:py-7"><BrandButton onClick={() => window.location.reload()} /><span className="scorebook-stamp">NO LOGIN REQUIRED</span></header>
    <main className="relative z-10 mx-auto grid max-w-6xl gap-8 px-5 pb-10 pt-7 lg:grid-cols-[.8fr_1.2fr] lg:items-center lg:px-10 lg:pt-12">
      <section className="onboarding-story"><div className="eyebrow mb-4 flex items-center gap-2"><span className="inline-block h-2 w-2 rounded-full bg-[#e66a2c]" />First innings · build your desk</div><h1 className="font-display max-w-xl text-[44px] font-semibold leading-[.98] tracking-[-0.065em] sm:text-[65px]">Build a week around<br /><span className="text-[#748079]">one clear goal.</span></h1><p className="mt-6 max-w-md text-[15px] leading-7 text-[#746d66]">CoachIQ turns your next edge into a practical week, one session for today, and a useful fuel starting point.</p><div className="onboarding-image mt-8 overflow-hidden rounded-[24px]"><img src={ASSETS.hero} alt="Cricketer training on a sunlit pitch" className="h-44 w-full object-cover sm:h-56" onError={(event) => handleAssetImageError(event, "hero")} /><div className="onboarding-image-note"><span className="scorebook-stamp scorebook-stamp-light">YOUR OUTCOME</span><span className="text-xs font-bold text-[#e7d9cc]">A {draft.sessions || "3"}-session week, one next rep, and fuel clarity.</span></div></div></section>
      <section className="onboarding-card paper-card p-5 sm:p-8"><div className="mb-7 flex items-center justify-between"><div><div className="eyebrow mb-2">Set up your player card</div><h2 className="font-display text-2xl font-semibold tracking-[-0.05em]">{step === 1 ? "Choose your next edge." : step === 2 ? "Fit it to your week." : "Personalize the plan."}</h2></div><div className="text-right"><div className="font-display text-2xl font-semibold text-[#e66a2c]">0{step}<span className="text-[#c4b9ae]">/03</span></div><div className="eyebrow mt-1">steps</div></div></div><div className="onboarding-progress mb-4"><span style={{ width: `${(step / 3) * 100}%` }} /></div><p className="mb-6 text-xs leading-5 text-[#847b72]">Fields marked <span className="font-bold text-[#d65a20]">*</span> build your first useful week. You can tune the rest later.</p>
        {step === 1 && <div className="space-y-5"><ImprovementFocusField goal={draft.goal} note={draft.improvementNote} onGoalChange={(value) => update("goal", value)} onNoteChange={(value) => update("improvementNote", value)} required invalid={attempted && !draft.goal} /><fieldset><legend className="field-label mb-3">What is your role? <span className="text-[#d65a20]">*</span></legend><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{roles.map((role) => <button type="button" key={role} onClick={() => update("role", role)} className={`rounded-xl border px-3 py-3 text-left text-xs font-bold transition ${draft.role === role ? "border-[#e66a2c] bg-[#fff0e7] text-[#b45124]" : "border-[#e4d9cf] bg-[#fcfaf7] text-[#677067]"}`}>{role.replace("Fast bowler", "Bowler").replace("Spin bowler", "Spinner")}</button>)}</div></fieldset><fieldset><legend className="field-label mb-3">How experienced are you? <span className="text-[#d65a20]">*</span></legend><div className="grid grid-cols-3 gap-2">{["Beginner", "Intermediate", "Advanced"].map((level) => <button type="button" key={level} onClick={() => update("level", level)} className={`rounded-xl border px-2 py-3 text-center text-xs font-bold transition ${draft.level === level ? "border-[#e66a2c] bg-[#fff0e7] text-[#b45124]" : "border-[#e4d9cf] bg-[#fcfaf7] text-[#677067]"}`}>{level}</button>)}</div></fieldset></div>}
        {step === 2 && <div className="grid gap-4 sm:grid-cols-2"><label className="field-label">Sessions / week<select className="field-input" value={draft.sessions} onChange={(event) => update("sessions", event.target.value)}>{["2", "3", "4", "5", "6"].map((value) => <option key={value}>{value}</option>)}</select></label><label className="field-label">Session length<select className="field-input" value={draft.minutes} onChange={(event) => update("minutes", event.target.value)}>{["20", "30", "45", "60"].map((value) => <option key={value}>{value} min</option>)}</select></label><fieldset className="sm:col-span-2"><legend className="field-label mb-3">Which days usually work? <span className="text-[#d65a20]">*</span></legend><div className="grid grid-cols-3 gap-2">{["Weekdays", "Weekends", "Flexible"].map((value) => <button type="button" key={value} onClick={() => update("availableDays", value)} className={`rounded-xl border px-3 py-3 text-xs font-bold ${draft.availableDays === value ? "border-[#e66a2c] bg-[#fff0e7] text-[#b45124]" : "border-[#e4d9cf] bg-[#fcfaf7] text-[#677067]"}`}>{value}</button>)}</div></fieldset><label className="field-label sm:col-span-2">Equipment on hand <span className="text-[#d65a20]">*</span><input className={`field-input ${invalid(!draft.equipment.trim())}`} value={draft.equipment} onChange={(event) => update("equipment", event.target.value)} placeholder="e.g. Bat, ball, cones" aria-invalid={attempted && !draft.equipment.trim()} /></label></div>}
        {step === 3 && <div className="grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2 rounded-xl border border-[#e7ded5] bg-[#fcfaf7] p-3 text-xs leading-5 text-[#7d756d]"><strong className="text-[#4b594e]">Why we ask:</strong> body and food details only tune general training-load and fuel estimates. They stay on this device.</div><NumberInput label="Height" value={draft.heightCm} onChange={(value) => update("heightCm", value)} placeholder="e.g. 172" suffix="cm" min={100} max={240} /><NumberInput label="Weight" value={draft.weightKg} onChange={(value) => update("weightKg", value)} placeholder="e.g. 68" suffix="kg" min={30} max={220} /><SelectField label="Food preference" value={draft.diet} values={["Vegetarian", "Non-vegetarian", "Plant-forward", "No preference"]} onChange={(value) => update("diet", value)} /><SelectField label="Batting hand" value={draft.battingHand} values={["Right-hand", "Left-hand"]} onChange={(value) => update("battingHand", value)} /><SelectField label="Bowling style" value={draft.bowlingStyle} values={["Pace", "Off-spin", "Leg-spin", "Not applicable"]} onChange={(value) => update("bowlingStyle", value)} /><label className="field-label">Name <span className="normal-case font-medium tracking-normal text-[#a0968b]">(optional)</span><input className="field-input" value={draft.name} onChange={(event) => update("name", event.target.value)} placeholder="e.g. Aanya Sharma" /></label><label className="field-label">Home ground <span className="normal-case font-medium tracking-normal text-[#a0968b]">(optional)</span><input className="field-input" value={draft.region} onChange={(event) => update("region", event.target.value)} placeholder="Used only for future local guidance" /></label><SelectField label="Gender (optional)" value={draft.gender} values={["Prefer not to say", "Female", "Male", "Non-binary"]} onChange={(value) => update("gender", value === "Prefer not to say" ? "" : value)} /></div>}
        {attempted && !valid && <div id="onboarding-field-error" role="alert" aria-live="assertive" className="mt-5 rounded-xl border border-[#edc0a5] bg-[#fff4ed] px-3 py-2.5 text-sm font-semibold text-[#a4512b]">{firstMissingMessage} Your entered details are still here.</div>}
        <div className="mt-8 flex items-center justify-between gap-3"><button onClick={() => { if (step > 1) { setStep((current) => current - 1); setAttempted(false); } }} className={`ghost-button ${step === 1 ? "invisible" : ""}`}><ChevronLeft size={15} /> Back</button><button onClick={advance} className="primary-button">{step < 3 ? <>Continue <ChevronRight size={15} /></> : <>Build my desk <Sparkles size={15} /></>}</button></div><p className="mt-6 flex items-center gap-2 text-[11px] leading-5 text-[#9b9188]"><ShieldCheck size={13} className="shrink-0 text-[#5b8065]" /> No email or password. Your profile stays in this browser.</p>
      </section>
    </main>
  </div>;
}

function Overview({ profile, activity, completedIds, onToggle, onStart, onGo, onMatch, reflected, onReflect }: { profile: Profile; activity: ActivityLog; completedIds: string[]; onToggle: (id: string) => void; onStart: (drill: Drill) => void; onGo: (view: View) => void; onMatch: () => void; reflected: boolean; onReflect: () => void }) {
  const complete = completedIds.length >= drills.length;
  const nextDrill = drills.find((drill) => !completedIds.includes(drill.id)) ?? drills[0];
  const hasBodyMetrics = checkHasBodyMetrics({ heightCm: profile.heightCm, weightKg: profile.weightKg });
  const fuel = nutrition(profile);
  return <div className="space-y-5">
    <section className="emphasis-card relative overflow-hidden p-6 sm:p-8 lg:p-10"><div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end"><div className="max-w-xl"><div className="eyebrow text-[#c7d2c6]">Today’s focus · {profile.goal}</div><div className="mt-5 flex items-end gap-3"><div className="font-display text-[39px] font-semibold leading-none tracking-[-0.06em]">{profile.minutes}<span className="ml-1 text-[22px] font-medium tracking-normal text-[#b5c6b7]">min</span></div><span className="mb-1 rounded-full bg-[#314d3a] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#c9d8cb]">{complete ? "Session logged" : `${completedIds.length} of ${drills.length} reps`}</span></div><h2 className="mt-5 font-display text-2xl font-semibold tracking-[-0.04em]">{complete ? (reflected ? "Tomorrow’s rep is ready." : "Logged. How did it feel?") : nextDrill.title}</h2><p className="mt-3 text-sm leading-6 text-[#c9d3c9]">{complete ? (reflected ? "Open your week to see the next planned action." : "A short reflection completes today’s loop.") : nextDrill.cue}</p><button onClick={() => complete ? onReflect() : onStart(nextDrill)} className="primary-button mt-7">{complete ? <><NotebookPen size={15} /> {reflected ? "View tomorrow’s session" : "Log how it felt"}</> : <><Play size={15} fill="currentColor" /> Start guided session</>}</button></div><div className="hidden rounded-full border-8 border-[#48614e] p-8 text-center lg:block"><div className="font-display text-3xl font-semibold">{Math.round((completedIds.length / drills.length) * 100)}%</div><div className="eyebrow mt-2 text-[#b5c6b7]">Today</div></div></div></section>
    <div className="grid gap-5 xl:grid-cols-[1.5fr_.92fr]"><section className="paper-card overflow-hidden"><div className="flex items-start justify-between p-5 pb-4 sm:p-6 sm:pb-4"><div><div className="eyebrow mb-1">Today’s work</div><h2 className="font-display text-2xl font-semibold tracking-[-0.04em]">One clear loop</h2></div><span className="rounded-full bg-[#f5ece3] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.13em] text-[#8b837b]">{completedIds.length}/{drills.length} complete</span></div><div className="divide-y divide-[#eee6de]">{drills.map((drill) => { const done = completedIds.includes(drill.id); return <div key={drill.id} className="flex items-center gap-4 px-5 py-4 sm:px-6"><img src={drill.image} alt="" className={`hidden h-12 w-12 rounded-xl object-cover sm:block ${done ? "opacity-55" : ""}`} onError={imageFallback} /><div className="min-w-0 flex-1"><div className={`text-sm font-bold ${done ? "text-[#958d85] line-through" : "text-[#253028]"}`}>{drill.title}</div><div className="mt-1 text-xs text-[#968d84]">{drill.category} · {drill.duration} · {drill.cue}</div></div><div className="flex flex-wrap justify-end gap-2"><button onClick={() => onStart(drill)} className="text-button text-xs">Start guided</button><button onClick={() => onToggle(drill.id)} className={done ? "ghost-button text-[#3d6046]" : "ghost-button"}>{done ? <><Check size={14} /> Mark incomplete</> : <><Check size={14} /> Mark as complete</>}</button></div></div>; })}</div></section><aside className="space-y-5"><section className="coach-note-card p-5 sm:p-6"><div className="eyebrow mb-2 text-[#b46a44]">Coach note</div><h3 className="font-display text-[25px] font-semibold leading-tight tracking-[-0.04em]">Keep the next rep clean.</h3><p className="mt-3 text-sm leading-6 text-[#765d4f]">{nextDrill.cue}. Let the session be short enough to repeat.</p><button onClick={() => onGo("coach")} className="text-button mt-5">Ask CoachIQ for one adjustment <ArrowUpRight size={15} /></button></section><section className="surface-card p-5 sm:p-6"><div className="eyebrow mb-1">Fuel snapshot</div>{hasBodyMetrics ? (<><h3 className="font-display text-2xl font-semibold tracking-[-0.04em]">{fuel.calories} kcal target</h3><p className="mt-3 text-sm leading-6 text-[#7d756e]">{fuel.protein}g protein · {fuel.carbs}g carbs · {fuel.fats}g fats</p><button onClick={() => onGo("nutrition")} className="text-button mt-4">View fuel plan & meal grams <ArrowUpRight size={15} /></button></>) : (<><h3 className="font-display text-2xl font-semibold tracking-[-0.04em] text-[#857d74]">Measurements needed</h3><p className="mt-3 text-sm leading-6 text-[#7d756e]">Enter your height and weight to calculate tailored calories and exact meal gram portions.</p><button onClick={() => onGo("nutrition")} className="text-button mt-4">Enter height & weight <ArrowUpRight size={15} /></button></>)}</section><section className="surface-card p-5 sm:p-6"><div className="eyebrow mb-1">Match snapshot</div><p className="mt-2 text-sm leading-6 text-[#7d756e]">{activity.matches.length ? `${activity.matches.length} match logs already shape your dashboard.` : "Add batting, bowling, or both whenever your first match is complete."}</p><button onClick={onMatch} className="ghost-button mt-4"><Plus size={15} /> Add match</button></section></aside></div>
  </div>;
}

function PlanView({ profile, plan, today, schedule, onUpdate, onStart }: { profile: Profile; plan: string[]; today: number; schedule: WeekSchedule; onUpdate: (day: number, entry: WeekSchedule[number]) => void; onStart: (drill: Drill) => void }) {
  const [openDay, setOpenDay] = useState<number | null>(today);
  const labels: Record<ScheduleStatus, string> = { planned: "Next", completed: "Completed", skipped: "Skipped", moved: "Moved", rest: "Rest" };
  const colors: Record<ScheduleStatus, string> = { planned: "bg-[#f0ece6] text-[#847a71]", completed: "bg-[#e8f0e8] text-[#3d6046]", skipped: "bg-[#f1ece8] text-[#938a81]", moved: "bg-[#e8f1f5] text-[#3b6e82]", rest: "bg-[#eef1ec] text-[#617066]" };
  return <div className="grid gap-5 xl:grid-cols-[1.45fr_.85fr]"><section className="paper-card p-5 sm:p-7"><div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><div className="eyebrow mb-1">Editable training plan</div><h2 className="font-display text-3xl font-semibold tracking-[-0.05em]">Week 01 · {profile.role}</h2><p className="mt-2 text-sm text-[#7d756d]">Open any day to see the exact practice sequence before you start it.</p></div><span className="rounded-full bg-[#e8f0e8] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.13em] text-[#42624a]">{profile.sessions} sessions / week</span></div><div className="space-y-2">{plan.map((session, day) => { const entry = schedule[day] ?? { status: day === 6 ? "rest" : "planned" as ScheduleStatus }; const isOpen = openDay === day; const drill = drillForWeekSession(session, profile.role); const steps = weeklySessionSteps(session, profile); return <article key={`${day}-${session}`} className={`rounded-2xl border p-4 ${day === today ? "border-[#e66a2c] bg-[#fff8f3]" : "border-[#eee6de] bg-[#fcfaf7]"}`}><button onClick={() => setOpenDay(isOpen ? null : day)} className="flex w-full items-center gap-4 text-left"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xs font-bold ${day === today ? "bg-[#e66a2c] text-white" : "bg-[#f0ece6] text-[#999087]"}`}>{day === today ? <Target size={16} /> : days[day]}</span><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><strong className="text-sm text-[#26332a]">{session}</strong><span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] ${colors[entry.status]}`}>{day === today && entry.status === "planned" ? "Today" : labels[entry.status]}</span></span><span className="mt-1 block text-xs text-[#958d84]">{entry.status === "moved" && entry.movedTo !== undefined ? `Moved to ${days[entry.movedTo]}` : day === 6 ? "Reset + write one line" : `${profile.minutes} minutes · focused`}</span></span><ChevronRight size={16} className={`text-[#b4aaa0] transition ${isOpen ? "rotate-90" : ""}`} /></button>{isOpen && <div className="mt-4 border-t border-[#eee6de] pt-4"><div className="rounded-xl bg-[#f6f2ec] p-3"><div className="eyebrow mb-2">How to run this session</div><ol className="space-y-2 text-xs leading-5 text-[#665f58]">{steps.map((step, index) => <li key={step} className="flex gap-2"><span className="font-bold text-[#e66a2c]">0{index + 1}</span><span>{step}</span></li>)}</ol></div><div className="mt-4 flex flex-wrap gap-2">{drill && <button onClick={() => onStart(drill)} className="primary-button"><Play size={14} fill="currentColor" /> Start guided practice</button>}<button onClick={() => onUpdate(day, { status: "completed" })} className="ghost-button"><Check size={14} /> Mark session complete</button><button onClick={() => onUpdate(day, { status: "skipped" })} className="ghost-button">Skip</button><button onClick={() => onUpdate(day, { status: "moved", movedTo: (day + 1) % 7 })} className="ghost-button">Move to {days[(day + 1) % 7]}</button><button onClick={() => onUpdate(day, { status: day === 6 ? "rest" : "planned" })} className="text-button px-2">Reset</button></div></div>}</article>; })}</div></section><aside className="space-y-5"><section className="coach-note-card p-5 sm:p-6"><div className="eyebrow mb-2 text-[#b46a44]">Why this week?</div><h3 className="font-display text-2xl font-semibold leading-tight tracking-[-0.04em]">One primary goal. Less noise.</h3><p className="mt-3 text-sm leading-6 text-[#765d4f]">Your sessions favour <strong>{profile.goal.toLowerCase()}</strong>, with drills for a {profile.level.toLowerCase()} {profile.role.toLowerCase()} using {profile.equipment.toLowerCase()}.</p></section><section className="surface-card p-5 sm:p-6"><div className="eyebrow mb-1">Plan details</div><p className="mt-3 text-sm leading-6 text-[#7d756d]">Preferred availability: <strong className="text-[#425047]">{profile.availableDays || "flexible"}</strong>. Update it on your player profile when life changes.</p></section></aside></div>;
}

function EnhancedDrillDiscovery({ profile, completedIds, onToggle, onStart }: { profile: Profile; completedIds: string[]; onToggle: (id: string) => void; onStart: (drill: Drill) => void }) {
  return <GuidedDrillLibrary profile={profile} completedIds={completedIds} onToggle={onToggle} onStart={onStart} />;
  /* Retired discovery implementation retained temporarily only as patch context; the guided library below is the active route. */
  /*
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<string>(profile.role || "All roles");
  const [goal, setGoal] = useState(profile.goal || "All goals");
  const [level, setLevel] = useState(profile.level || "All levels");
  const [equipment, setEquipment] = useState("All equipment");
  const [type, setType] = useState("All types");
  const [duration, setDuration] = useState("Any length");
  const [display, setDisplay] = useState<"grid" | "list">("grid");
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [selected, setLegacySelected] = useState<Drill>(drills[0]);
  const setSelected = setLegacySelected as Dispatch<SetStateAction<Drill | null>>;
  const drillEquipment = (drill: Drill) => drill.id === "shadow" ? "Bat" : drill.id === "cones" ? "Ball + cones" : "No equipment";
  const drillLevel = (drill: Drill) => drill.id === "cones" ? "Intermediate" : "Beginner";
  const goalTypes: Record<string, string[]> = { "Improve batting technique": ["Technique"], "Add pace": ["Bowling"], "Build match stamina": ["Recovery"], "Improve bowling accuracy": ["Bowling"], "Stay consistent": ["Technique", "Bowling", "Recovery"] };
  const roleOptions = ["All roles", ...roles];
  const clearFilters = () => { setQuery(""); setRole("All roles"); setGoal("All goals"); setLevel("All levels"); setEquipment("All equipment"); setType("All types"); setDuration("Any length"); };
  const filtersActive = Boolean(query || role !== "All roles" || goal !== "All goals" || level !== "All levels" || equipment !== "All equipment" || type !== "All types" || duration !== "Any length");
  const results = drills.filter((drill) => {
    const minutes = number(drill.duration);
    const textMatch = `${drill.title} ${drill.category} ${drill.cue}`.toLowerCase().includes(query.toLowerCase());
    const roleMatch = role === "All roles" || drill.roles.includes(role as Role);
    const goalMatch = goal === "All goals" || (goalTypes[goal] ?? []).includes(drill.category);
    const levelMatch = level === "All levels" || drillLevel(drill) === level || level === "Advanced";
    const equipmentMatch = equipment === "All equipment" || drillEquipment(drill) === equipment;
    const typeMatch = type === "All types" || drill.category === type;
    const durationMatch = duration === "Any length" || (duration === "12 min or less" ? minutes <= 12 : minutes >= 20);
    return textMatch && roleMatch && goalMatch && levelMatch && equipmentMatch && typeMatch && durationMatch;
  });
  const featuredItems = drills.filter((drill) => drill.roles.includes(profile.role));
  const picks = featuredItems.length ? featuredItems : drills;
  const featured = picks[featuredIndex % picks.length];
  useEffect(() => {
    const announcer = document.createElement("div");
    announcer.className = "sr-only";
    announcer.setAttribute("aria-live", "polite");
    announcer.setAttribute("aria-atomic", "true");
    announcer.textContent = `Featured drill ${featuredIndex + 1} of ${picks.length}: ${featured.title}.`;
    document.body.appendChild(announcer);
    return () => announcer.remove();
  }, [featured.id, featured.title, featuredIndex, picks.length]);
  return <div className="space-y-5"><section className="emphasis-card overflow-hidden p-5 sm:p-7"><div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]"><img src={featured.image} alt="" className="h-56 w-full rounded-2xl object-cover" onError={imageFallback} /><div><div className="eyebrow text-[#b6c8ba]">Featured coach pick · {featuredIndex + 1}/{picks.length}</div><h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.05em]">{featured.title}</h2><p className="mt-3 text-sm leading-6 text-[#d0dbd0]">{featured.cue} · {featured.duration} · {drillEquipment(featured)}</p><div className="mt-5 flex flex-wrap gap-3"><button onClick={() => onToggle(featured.id)} className="primary-button">{completedIds.includes(featured.id) ? "Mark incomplete" : "Start this drill"}</button><button onClick={() => setSelected(featured)} className="ghost-button border-white/20 text-white">View instructions</button><button onClick={() => setFeaturedIndex((current) => (current + 1) % picks.length)} className="ghost-button border-white/20 text-white" aria-label="Next coach pick">Next pick <ChevronRight size={14} /></button></div></div></div></section><section className="paper-card p-5 sm:p-6"><div className="flex flex-wrap items-end justify-between gap-3"><div><div className="eyebrow mb-1">Drill discovery</div><h2 className="font-display text-2xl font-semibold tracking-[-0.04em]">{results.length} {results.length === 1 ? "drill" : "drills"} found</h2></div><div className="flex items-center gap-2"><button onClick={() => setDisplay("grid")} className="ghost-button px-3 py-2 text-xs" aria-pressed={display === "grid"}>Grid</button><button onClick={() => setDisplay("list")} className="ghost-button px-3 py-2 text-xs" aria-pressed={display === "list"}>List</button>{filtersActive && <button onClick={clearFilters} className="text-button text-xs">Clear all filters</button>}</div></div><div className="mt-5 grid gap-3 lg:grid-cols-3"><input value={query} onChange={(event) => setQuery(event.target.value)} className="field-input lg:col-span-3" placeholder="Search drills by skill or cue…" aria-label="Search drills" /><SelectField label="Role" value={role} values={roleOptions} onChange={setRole} /><SelectField label="Goal" value={goal} values={["All goals", ...goals]} onChange={setGoal} /><SelectField label="Level" value={level} values={["All levels", "Beginner", "Intermediate", "Advanced"]} onChange={setLevel} /><SelectField label="Equipment" value={equipment} values={["All equipment", "Bat", "Ball + cones", "No equipment"]} onChange={setEquipment} /><SelectField label="Type" value={type} values={["All types", "Technique", "Bowling", "Recovery"]} onChange={setType} /><SelectField label="Duration" value={duration} values={["Any length", "12 min or less", "20 min or more"]} onChange={setDuration} /></div><div className={`mt-5 grid gap-3 ${display === "grid" ? "md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"}`}>{results.length ? results.map((drill) => <article key={drill.id} className={`surface-card p-4 ${display === "list" ? "flex items-center gap-4" : ""}`}><img src={drill.image} alt="" className={display === "list" ? "h-16 w-16 rounded-xl object-cover" : "h-40 w-full rounded-xl object-cover"} onError={imageFallback} /><div className={display === "list" ? "min-w-0 flex-1" : ""}><div className="mt-3 text-sm font-bold text-[#2b362d]">{drill.title}</div><div className="mt-1 text-xs text-[#968d84]">{drill.category} · {drill.duration} · {drillEquipment(drill)}</div><p className="mt-3 text-xs leading-5 text-[#766f67]">{drill.cue}</p><div className="mt-4 flex flex-wrap gap-2"><button onClick={() => setSelected(drill)} className="text-button text-xs">View instructions</button><button onClick={() => onToggle(drill.id)} className="ghost-button px-3 py-2 text-xs">{completedIds.includes(drill.id) ? "Done" : "Start drill"}</button></div></div></article>) : <div className="empty-table md:col-span-2 xl:col-span-3"><CircleHelp size={18} /><div><b>No drills match this combination.</b><p className="mt-1">Try clearing a filter or choose a different training constraint.</p><button onClick={clearFilters} className="text-button mt-3 text-xs">Clear all filters</button></div></div>}</div></section>{selected && <DrillDialog drill={selected} completed={completedIds.includes(selected.id)} onClose={() => setSelected(null)} onToggle={() => { onToggle(selected.id); setSelected(null); }} />}</div>;
  */
}

function GuidedDrillLibrary({ profile, completedIds, onToggle, onStart }: { profile: Profile; completedIds: string[]; onToggle: (id: string) => void; onStart: (drill: Drill) => void }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [selected, setSelected] = useState<Drill | null>(null);
  useEffect(() => {
    if (!selected) return;
    const frame = window.requestAnimationFrame(() => {
      const panel = document.getElementById("selected-drill-instructions");
      panel?.scrollIntoView({ behavior: "smooth", block: "start" });
      panel?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [selected]);
  const matching = drills.filter((drill) => (category === "All" || drill.category === category) && `${drill.title} ${drill.category} ${drill.cue}`.toLowerCase().includes(query.toLowerCase()));
  const featuredOptions = drills.filter((drill) => drill.roles.includes(profile.role));
  const picks = featuredOptions.length ? featuredOptions : drills;
  const featured = picks[featuredIndex % picks.length];
  const done = (drill: Drill) => completedIds.includes(drill.id);
  const selectedDrill = selected;
  const selectedPanel = selectedDrill ? <section id="selected-drill-instructions" tabIndex={-1} className="paper-card border-l-4 border-l-[#e66a2c] p-5 sm:p-6 outline-none" aria-label={`Instructions for ${selectedDrill.title}`}><div className="flex items-start justify-between gap-4"><div><div className="eyebrow mb-1">Selected practice</div><h2 className="font-display text-2xl font-semibold tracking-[-0.04em]">{selectedDrill.title}</h2></div><button onClick={() => setSelected(null)} className="rounded-full p-2 text-[#958d84] hover:bg-[#f0ece6]" aria-label="Close selected practice"><X size={18} /></button></div><div className="mt-4 grid gap-4 lg:grid-cols-[.72fr_1.28fr]"><img src={selectedDrill.image} alt="" className="aspect-[16/9] w-full rounded-2xl object-cover" onError={imageFallback} /><div className="rounded-2xl bg-[#1d3024] p-5 text-[#f6f2ec]"><div className="eyebrow text-[#b6c8ba]">Practice brief</div><div className="mt-3 font-display text-3xl font-semibold">{selectedDrill.duration}</div><p className="mt-3 text-sm leading-6 text-[#d0dbd0]">Read the sequence, keep the cue simple, and use the finish check to judge the quality of the rep.</p></div></div><div className="mt-5"><RichDrillInstructions drill={selectedDrill} /></div><div className="mt-5 flex flex-wrap gap-3"><button onClick={() => onStart(selectedDrill)} className="primary-button"><Play size={14} fill="currentColor" /> Start guided practice</button><button onClick={() => onToggle(selectedDrill.id)} className="ghost-button">{done(selectedDrill) ? <><Check size={14} /> Mark incomplete</> : <><Check size={14} /> Mark as complete</>}</button></div></section> : null;
  return <div className="space-y-5">
    <section className="emphasis-card overflow-hidden p-5 sm:p-7"><div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]"><img src={featured.image} alt="" className="h-56 w-full rounded-2xl object-cover" onError={imageFallback} /><div><div className="eyebrow text-[#b6c8ba]">Featured coach pick · {featuredIndex + 1}/{picks.length}</div><h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.05em]">{featured.title}</h2><p className="mt-3 text-sm leading-6 text-[#d0dbd0]">{featured.cue} · {featured.duration} · Read the sequence before you start.</p><div className="mt-5 flex flex-wrap gap-3"><button onClick={() => onStart(featured)} className="primary-button"><Play size={14} fill="currentColor" /> Start guided practice</button><button onClick={() => setSelected(featured)} className="ghost-button border-white/20 text-white">View full instructions</button><button onClick={() => setFeaturedIndex((current) => (current + 1) % picks.length)} className="ghost-button border-white/20 text-white" aria-label="Next coach pick">Next pick <ChevronRight size={14} /></button></div></div></div></section>
    {selectedPanel}
    <section className="paper-card p-5 sm:p-6"><div className="flex flex-wrap items-end justify-between gap-3"><div><div className="eyebrow mb-1">Drill discovery</div><h2 className="font-display text-2xl font-semibold tracking-[-0.04em]">{matching.length} {matching.length === 1 ? "drill" : "drills"} found</h2></div><span className="text-xs font-bold text-[#958d84]">Choose a drill, then read the steps.</span></div><div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto]"><input value={query} onChange={(event) => setQuery(event.target.value)} className="field-input" placeholder="Search drills by skill or cue…" aria-label="Search drills" /><div className="flex flex-wrap gap-2">{["All", "Technique", "Bowling", "Recovery"].map((value) => <button key={value} onClick={() => setCategory(value)} className={`rounded-full border px-3 py-2 text-xs font-bold ${category === value ? "border-[#e66a2c] bg-[#fff0e7] text-[#b45124]" : "border-[#e4d9cf] bg-[#fcfaf7] text-[#746d66]"}`}>{value}</button>)}</div></div><div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{matching.map((drill) => <article key={drill.id} className="surface-card p-4"><img src={drill.image} alt="" className="h-36 w-full rounded-xl object-cover" onError={imageFallback} /><div className="mt-3 text-sm font-bold text-[#2b362d]">{drill.title}</div><div className="mt-1 text-xs text-[#968d84]">{drill.category} · {drill.duration}</div><p className="mt-3 text-xs leading-5 text-[#766f67]">{drill.cue}</p><div className="mt-4 flex flex-wrap gap-2"><button onClick={() => setSelected(drill)} className="text-button text-xs">View instructions</button><button onClick={() => onStart(drill)} className="ghost-button px-3 py-2 text-xs">Start guided</button><button onClick={() => onToggle(drill.id)} className="ghost-button px-3 py-2 text-xs">{done(drill) ? "Mark incomplete" : "Mark complete"}</button></div></article>)}</div></section>
  </div>;
}

function DrillsView({ profile, completedIds, onToggle }: { profile: Profile; completedIds: string[]; onToggle: (id: string) => void }) {
  const [carousel, setCarousel] = useState(0);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [duration, setDuration] = useState("Any length");
  const [selected, setSelected] = useState<Drill | null>(null);
  const picks = drills.filter((drill) => drill.roles.includes(profile.role));
  const carouselItems = picks.length ? picks : drills;
  const featured = carouselItems[carousel % carouselItems.length];
  const results = drills.filter((drill) => {
    const queryMatch = `${drill.title} ${drill.category} ${drill.cue}`.toLowerCase().includes(query.toLowerCase());
    const categoryMatch = category === "All" || drill.category === category;
    const minutes = number(drill.duration);
    const durationMatch = duration === "Any length" || (duration === "12 min or less" ? minutes <= 12 : minutes >= 20);
    return queryMatch && categoryMatch && durationMatch;
  });
  return <div className="space-y-5"><section className="emphasis-card overflow-hidden"><div className="grid lg:grid-cols-[1.05fr_.95fr]"><div className="relative min-h-64 overflow-hidden"><img src={featured.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-85" onError={imageFallback} /><div className="absolute inset-0 bg-gradient-to-r from-[#17251c]/20 via-[#17251c]/10 to-[#17251c]/65" /><div className="absolute inset-x-5 bottom-5 flex items-center justify-between gap-3"><span className="scorebook-stamp scorebook-stamp-light">COACH PICK · {carousel + 1}/{carouselItems.length}</span><div className="flex gap-2"><button onClick={() => setCarousel((current) => (current - 1 + carouselItems.length) % carouselItems.length)} className="grid h-10 w-10 place-items-center rounded-full border border-white/40 bg-[#15251b]/50 text-white" aria-label="Previous coach pick"><ChevronLeft size={17} /></button><button onClick={() => setCarousel((current) => (current + 1) % carouselItems.length)} className="grid h-10 w-10 place-items-center rounded-full border border-white/40 bg-[#15251b]/50 text-white" aria-label="Next coach pick"><ChevronRight size={17} /></button></div></div></div><div className="p-5 sm:p-7"><div className="eyebrow text-[#b6c8ba]">Featured carousel · {featured.category} · {featured.duration}</div><h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.05em]">{featured.title}</h2><p className="mt-4 text-sm leading-6 text-[#d0dbd0]">{featured.cue}. Equipment: {featured.id === "shadow" ? "bat" : featured.id === "cones" ? "ball + cones" : "no equipment"}.</p><div className="mt-6 flex flex-wrap gap-3"><button onClick={() => onToggle(featured.id)} className={completedIds.includes(featured.id) ? "ghost-button border-white/25 bg-white/10 text-white" : "primary-button"}>{completedIds.includes(featured.id) ? <><Check size={14} /> Completed</> : <><Play size={14} fill="currentColor" /> Start this drill</>}</button><span className="self-center text-xs font-bold text-[#b6c8ba]">Use arrows to browse picks</span></div><div className="mt-6 flex gap-2">{carouselItems.map((drill, index) => <button key={drill.id} onClick={() => setCarousel(index)} className={`h-2 rounded-full ${carousel === index ? "w-8 bg-[#e66a2c]" : "w-2 bg-white/30"}`} aria-label={`Show ${drill.title}`} />)}</div></div></div></section><section className="paper-card p-5 sm:p-6"><div className="flex flex-wrap items-end justify-between gap-3"><div><div className="eyebrow mb-1">All drills</div><h2 className="font-display text-2xl font-semibold tracking-[-0.04em]">{results.length} results</h2></div><div className="text-xs font-bold text-[#958d84]">Filter by type and duration</div></div><div className="mt-5 grid gap-3 lg:grid-cols-[1.3fr_auto_auto]"><input value={query} onChange={(event) => setQuery(event.target.value)} className="field-input" placeholder="Search drills by skill or cue…" aria-label="Search drills" /><div className="flex flex-wrap gap-2">{["All", "Technique", "Bowling", "Recovery"].map((value) => <button key={value} onClick={() => setCategory(value)} className={`rounded-full border px-3 py-2 text-xs font-bold ${category === value ? "border-[#e66a2c] bg-[#fff0e7] text-[#b45124]" : "border-[#e4d9cf] bg-[#fcfaf7] text-[#746d66]"}`}>{value}</button>)}</div><select value={duration} onChange={(event) => setDuration(event.target.value)} className="field-input min-w-[150px]"><option>Any length</option><option>12 min or less</option><option>20 min or more</option></select></div><div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{results.length ? results.map((drill) => <article key={drill.id} className="surface-card p-4"><div className="flex items-start gap-3"><img src={drill.image} alt="" className="h-14 w-14 rounded-xl object-cover" onError={imageFallback} /><div className="min-w-0"><div className="text-sm font-bold text-[#2b362d]">{drill.title}</div><div className="mt-1 text-xs text-[#968d84]">{drill.category} · {drill.duration}</div></div></div><p className="mt-4 text-xs leading-5 text-[#766f67]">{drill.cue}</p><div className="mt-4 flex items-center justify-between gap-2"><button onClick={() => setSelected(drill)} className="text-button text-xs">View instructions</button><button onClick={() => onToggle(drill.id)} className="ghost-button px-3 py-2 text-xs">{completedIds.includes(drill.id) ? "Done" : "Start"}</button></div></article>) : <div className="empty-table md:col-span-2 xl:col-span-3"><CircleHelp size={18} /><span>No drills match those filters. Clear a filter to see the shelf.</span></div>}</div></section>{selected && <DrillDialog drill={selected} completed={completedIds.includes(selected.id)} onClose={() => setSelected(null)} onToggle={() => { onToggle(selected.id); setSelected(null); }} />}</div>;
}

function useDialogFocus(onClose: () => void) {
  useEffect(() => {
    const lastActiveElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    const focusable = () => Array.from(dialog?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])') ?? []).filter((element) => !element.hasAttribute("disabled"));
    requestAnimationFrame(() => focusable()[0]?.focus());
    const manageKeys = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); onClose(); return; }
      if (event.key !== "Tab") return;
      const controls = focusable();
      if (!controls.length) return;
      const first = controls[0]; const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", manageKeys);
    return () => { window.removeEventListener("keydown", manageKeys); lastActiveElement?.focus(); };
  }, [onClose]);
}

function DrillVideoPlaceholder({ drill }: { drill: Drill }) {
  return <section className="overflow-hidden rounded-2xl border border-dashed border-[#d9cec2] bg-[#f6f2ec]" aria-label={`Demonstration video placeholder for ${drill.title}`}><div className="flex min-h-36 items-center justify-center bg-[radial-gradient(circle_at_75%_20%,#f3a774_0,transparent_26%),linear-gradient(135deg,#1d3024,#34513b)] p-5 text-center text-white"><div><span className="mx-auto grid h-11 w-11 place-items-center rounded-full border border-white/35 bg-white/10"><Play size={17} fill="currentColor" /></span><div className="mt-3 text-sm font-bold">Demonstration video</div><p className="mt-1 text-xs leading-5 text-[#d9e2d9]">Video guidance will appear here when a coach upload is available.</p></div></div><div className="flex items-center justify-between gap-3 px-4 py-3"><span className="text-xs font-bold text-[#4b594e]">Watch the setup, movement, and finish.</span><span className="rounded-full bg-[#fff0e7] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#b45124]">Coming soon</span></div></section>;
}

function RichDrillInstructions({ drill }: { drill: Drill }) {
  return <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-[#eee6de] bg-[#fcfaf7] p-3"><div className="eyebrow mb-1">Set-up</div><p className="text-xs leading-5 text-[#685f56]">{drill.setup}</p></div><div className="rounded-xl border border-[#edcdb8] bg-[#fff8f3] p-3"><div className="eyebrow mb-1 text-[#b45124]">Key cue</div><p className="text-xs font-bold leading-5 text-[#68422e]">“{drill.cue}”</p></div><div className="rounded-xl border border-[#dce7dc] bg-[#f1f7f0] p-3"><div className="eyebrow mb-1 text-[#47604d]">Finish check</div><p className="text-xs leading-5 text-[#47604d]">{drill.completion}</p></div></div><DrillVideoPlaceholder drill={drill} /><section><div className="eyebrow mb-3">Practice sequence</div><ol className="space-y-3">{drill.steps.map((step, index) => <li key={step} className="flex gap-3 rounded-xl border border-[#eee6de] bg-[#fcfaf7] p-3 text-sm leading-6 text-[#675f57]"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#fff0e7] text-xs font-bold text-[#b45124]">{index + 1}</span><span><strong className="text-[#354239]">Step {index + 1}.</strong> {step}</span></li>)}</ol></section></div>;
}

function DrillDialog({ drill, completed, onClose, onToggle }: { drill: Drill; completed: boolean; onClose: () => void; onToggle: () => void }) {
  useDialogFocus(onClose);
  return <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Drill instructions"><div className="modal-card max-w-3xl"><div className="flex items-start justify-between"><div><div className="eyebrow mb-1">Drill instructions</div><h2 className="font-display text-2xl font-semibold tracking-[-0.04em]">{drill.title}</h2></div><button onClick={onClose} className="rounded-full p-2 text-[#958d84] hover:bg-[#f0ece6]" aria-label="Close instructions"><X size={18} /></button></div><div className="mt-5 grid gap-4 md:grid-cols-[.8fr_1.2fr]"><img src={drill.image} alt="" className="aspect-[16/10] w-full rounded-2xl object-cover" onError={imageFallback} /><div className="rounded-2xl bg-[#1d3024] p-5 text-[#f6f2ec]"><div className="eyebrow text-[#b6c8ba]">Practice brief</div><div className="mt-3 font-display text-3xl font-semibold">{drill.duration}</div><p className="mt-3 text-sm leading-6 text-[#d0dbd0]">Read the set-up, keep the cue simple, and use the finish check to decide whether the rep was useful.</p></div></div><div className="mt-5"><RichDrillInstructions drill={drill} /></div><button onClick={onToggle} className="primary-button mt-6"><Check size={15} /> {completed ? "Mark incomplete" : "Mark as complete"}</button></div></div>;
}

function GuidedDrillSession({ drill, completed, onClose, onComplete }: { drill: Drill; completed: boolean; onClose: () => void; onComplete: () => void }) {
  useDialogFocus(onClose);
  const totalSeconds = durationToSeconds(drill.duration);
  const [remainingSeconds, setRemainingSeconds] = useState(totalSeconds);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    setRemainingSeconds(totalSeconds);
    setRunning(false);
    setFinished(false);
  }, [drill.id, totalSeconds]);

  useEffect(() => {
    if (!running || remainingSeconds <= 0) return;
    const interval = window.setInterval(() => setRemainingSeconds((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearInterval(interval);
  }, [remainingSeconds, running]);

  useEffect(() => {
    if (running && remainingSeconds === 0) {
      setRunning(false);
      setFinished(true);
    }
  }, [remainingSeconds, running]);

  const restart = () => {
    setRemainingSeconds(totalSeconds);
    setRunning(false);
    setFinished(false);
  };
  const progress = sessionProgress(totalSeconds, remainingSeconds);

  return <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={`Guided session for ${drill.title}`}><div className="modal-card max-w-3xl"><div className="flex items-start justify-between gap-4"><div><div className="eyebrow mb-1">Guided practice</div><h2 className="font-display text-2xl font-semibold tracking-[-0.04em]">{drill.title}</h2></div><button onClick={onClose} className="rounded-full p-2 text-[#958d84] hover:bg-[#f0ece6]" aria-label="Close guided practice"><X size={18} /></button></div><div className="mt-5 grid gap-5 md:grid-cols-[.78fr_1.22fr]"><img src={drill.image} alt="" className="h-full min-h-48 w-full rounded-2xl object-cover" onError={imageFallback} /><div className="rounded-2xl bg-[#1d3024] p-5 text-[#f6f2ec]"><div className="flex items-center justify-between"><span className="eyebrow text-[#b6c8ba]">Practice clock</span><Clock3 size={18} className="text-[#e66a2c]" /></div><div className="mt-4 font-display text-5xl font-semibold tracking-[-0.06em]" aria-live="polite">{formatCountdown(remainingSeconds)}</div><p className="mt-2 text-xs leading-5 text-[#c9d8cb]">{finished ? "The countdown is complete. Your work is not logged until you choose Mark drill complete." : running ? "The timer is running. Pause it whenever you need to reset safely." : "Read the steps, then start when your space and equipment are ready."}</p><div className="mt-5"><div className="h-3 overflow-hidden rounded-full border border-white/10 bg-[#48614e]" role="progressbar" aria-label="Drill countdown progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}><div className="h-full rounded-full bg-gradient-to-r from-[#e66a2c] to-[#f4a261] transition-[width] duration-300" style={{ width: `${progress}%` }} /></div><div className="mt-2 flex justify-between text-[10px] font-bold uppercase tracking-[0.12em] text-[#b6c8ba]"><span>{Math.round(progress)}% complete</span><span>{formatCountdown(remainingSeconds)} remaining</span></div></div><div className="mt-5 flex flex-wrap gap-2">{running ? <button onClick={() => setRunning(false)} className="ghost-button border-white/25 bg-white/10 text-white"><Pause size={14} fill="currentColor" /> Pause timer</button> : remainingSeconds > 0 ? <button onClick={() => setRunning(true)} className="primary-button"><Play size={14} fill="currentColor" /> {remainingSeconds === totalSeconds ? "Start countdown" : "Resume countdown"}</button> : null}<button onClick={restart} className="ghost-button border-white/25 bg-white/10 text-white"><RotateCcw size={14} /> Restart</button></div></div></div><section className="mt-6"><RichDrillInstructions drill={drill} /></section><div className="mt-6 flex flex-wrap justify-between gap-3 border-t border-[#eee6de] pt-5"><button onClick={onClose} className="text-button">Keep this open for reference</button><button onClick={onComplete} disabled={completed} className={`primary-button ${completed ? "cursor-not-allowed opacity-60" : ""}`}><Flag size={15} /> {completed ? "Already logged today" : "Mark drill complete"}</button></div></div></div>;
}

function ProfileView({ draft, setDraft, onSave, onOpenPhotoModal }: { draft: Profile; setDraft: Dispatch<SetStateAction<Profile>>; onSave: () => void; onOpenPhotoModal: () => void }) {
  const initials = (draft.name.trim().split(" ").map((word) => word[0]).join("") || "CQ").slice(0, 2).toUpperCase();
  const profileSignals = [{ label: "Role", value: draft.role || "Set role" }, { label: "Level", value: draft.level || "Set level" }, { label: "Weekly load", value: `${draft.sessions} × ${draft.minutes} min` }, { label: "Availability", value: draft.availableDays || "Flexible" }];
  return <div className="space-y-5">
    <section className="overflow-hidden rounded-[28px] bg-[#1d3024] text-[#f6f2ec] shadow-[0_16px_36px_rgba(29,48,36,0.16)]">
      <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[auto_1fr_auto] lg:items-center">
        <div className="relative group mx-auto lg:mx-0">
          {draft.avatarUrl ? (
            <img
              src={draft.avatarUrl}
              alt={draft.name || "Player avatar"}
              className="h-24 w-24 rounded-[26px] border border-white/20 object-cover shadow-lg"
              referrerPolicy="no-referrer"
              onError={(event) => handleAssetImageError(event, "avatar")}
            />
          ) : (
            <div className="grid h-24 w-24 place-items-center rounded-[26px] border border-white/15 bg-[radial-gradient(circle_at_30%_20%,#f4a261_0,transparent_28%),linear-gradient(145deg,#3d6046,#1d3024)] font-display text-3xl font-semibold text-white shadow-lg">
              {initials}
            </div>
          )}
          <button
            type="button"
            onClick={onOpenPhotoModal}
            className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#1d3024] bg-[#e66a2c] text-white shadow-lg transition hover:scale-105 hover:bg-[#d65a20]"
            aria-label="Change profile photo"
            title="Change profile photo"
          >
            <Camera size={15} />
          </button>
        </div>
        <div>
          <div className="eyebrow text-[#b6c8ba]">Player card · saved in this browser</div>
          <h2 className="mt-2 font-display text-4xl font-semibold tracking-[-0.06em]">{draft.name || "Your CoachIQ profile"}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#d0dbd0]">A clearer player card gives your drills, fuel estimate, coaching cue, and weekly schedule a more useful starting point.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onOpenPhotoModal}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-white/20"
            >
              <Camera size={14} /> Change profile photo / avatar
            </button>
          </div>
        </div>
        <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
          <div className="eyebrow text-[#b6c8ba]">This week’s focus</div>
          <div className="mt-2 text-sm font-bold leading-5">{draft.improvementNote || draft.goal || "Choose a focused outcome"}</div>
        </div>
      </div>
      <div className="grid border-t border-white/10 sm:grid-cols-4">{profileSignals.map((signal) => <div key={signal.label} className="border-b border-white/10 px-5 py-4 sm:border-b-0 sm:border-r sm:last:border-r-0"><div className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#b6c8ba]">{signal.label}</div><div className="mt-2 text-sm font-bold text-white">{signal.value}</div></div>)}</div>
    </section>
    <div className="grid gap-5 xl:grid-cols-[1fr_.72fr]"><section className="paper-card p-5 sm:p-7"><div className="eyebrow mb-1">Tune the inputs</div><h2 className="font-display text-3xl font-semibold tracking-[-0.05em]">The details behind the plan.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-[#7d756d]">Update a meaningful detail, then re-cut your week. CoachIQ keeps the changes on this device.</p><ProfileForm draft={draft} setDraft={setDraft} onSave={onSave} /></section><aside className="space-y-5"><section className="coach-note-card p-5 sm:p-6"><div className="eyebrow mb-3 text-[#b46a44]">Private by default</div><h3 className="font-display text-2xl font-semibold leading-tight tracking-[-0.04em]">Your profile is yours.</h3><p className="mt-3 text-sm leading-6 text-[#765d4f]">No account, email, password, or server profile. This information remains on this device.</p></section><section className="surface-card p-5 sm:p-6"><div className="eyebrow">Current lens</div><div className="mt-4 space-y-3"><div className="rounded-xl bg-[#fff8f3] p-3 text-sm font-bold text-[#74472e]">{draft.goal || "Set your primary goal"}</div><p className="text-sm leading-6 text-[#7d756d]">{draft.role || "Role not set"} · {draft.level || "Level not set"} · {draft.sessions} sessions / week · {draft.availableDays || "Flexible"}</p></div></section><section className="surface-card p-5 sm:p-6"><div className="eyebrow">Body inputs</div><div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-xl bg-[#f6f2ec] p-3"><div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8b837b]">Height</div><div className="mt-1 font-display text-xl font-semibold">{draft.heightCm ? `${draft.heightCm} cm` : "—"}</div></div><div className="rounded-xl bg-[#f6f2ec] p-3"><div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8b837b]">Weight</div><div className="mt-1 font-display text-xl font-semibold">{draft.weightKg ? `${draft.weightKg} kg` : "—"}</div></div></div></section></aside></div></div>;
}

function DataControls({ onExport, onImport, onReset, storageAvailable }: { onExport: () => void; onImport: (file: File) => Promise<void>; onReset: () => void; storageAvailable: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return <section className="surface-card mt-5 p-5 sm:p-6"><div className="eyebrow mb-1">Your browser-only data</div><h2 className="font-display text-2xl font-semibold tracking-[-0.04em]">Keep a copy. Stay in control.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-[#7d756d]">CoachIQ keeps your player card, weekly schedule, completed reps, and scorecards in this browser only. It does not create an account or send this player data to CoachIQ. Export a JSON copy before changing browsers, using private browsing, or clearing site data.</p><div className={`mt-4 rounded-xl border px-3 py-2.5 text-sm leading-5 ${storageAvailable ? "border-[#dce7dc] bg-[#f1f7f0] text-[#47604d]" : "border-[#edc0a5] bg-[#fff4ed] text-[#a4512b]"}`} role="status">{storageAvailable ? <><strong>Saved on this device.</strong> Your newest changes are stored in this browser. A downloaded export is your portable backup.</> : <><strong>Browser storage is unavailable.</strong> CoachIQ can run in this tab, but changes may disappear when it closes. Enable browser storage before relying on this device.</>}</div><input ref={inputRef} type="file" accept="application/json" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void onImport(file); event.currentTarget.value = ""; }} /><div className="mt-5 flex flex-wrap gap-3"><button onClick={onExport} className="primary-button" disabled={!storageAvailable}>Export my data</button><button onClick={() => inputRef.current?.click()} className="ghost-button">Import data</button><button onClick={onReset} className="text-button text-[#b45124]">Reset this device</button></div></section>;
}

function ProfileDialog({ draft, setDraft, onClose, onSave }: { draft: Profile; setDraft: Dispatch<SetStateAction<Profile>>; onClose: () => void; onSave: () => void }) {
  useDialogFocus(onClose);
  return <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Edit player details"><div className="modal-card"><div className="flex items-start justify-between"><div><div className="eyebrow mb-1">Tune your week</div><h2 className="font-display text-2xl font-semibold tracking-[-0.04em]">A little context goes a long way.</h2></div><button onClick={onClose} className="rounded-full p-2 text-[#958d84] hover:bg-[#f0ece6]" aria-label="Close"><X size={18} /></button></div><ProfileForm draft={draft} setDraft={setDraft} onSave={onSave} /></div></div>;
}

function ProfileForm({ draft, setDraft, onSave }: { draft: Profile; setDraft: Dispatch<SetStateAction<Profile>>; onSave: () => void }) {
  const update = (key: keyof Profile, value: string) => setDraft((previous) => ({ ...previous, [key]: value }));
  return <div className="mt-7 space-y-5"><section className="rounded-2xl border border-[#eee6de] bg-[#fcfaf7] p-4 sm:p-5"><div className="flex items-start justify-between gap-3"><div><div className="eyebrow">Plan essentials</div><p className="mt-1 text-xs leading-5 text-[#8a8178]">These few inputs have the biggest effect on your weekly practice.</p></div><span className="rounded-full bg-[#fff0e7] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#b45124]">Fast edit</span></div><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="field-label sm:col-span-2">Your name <span className="normal-case font-medium tracking-normal text-[#a0968b]">(optional)</span><input className="field-input" value={draft.name} onChange={(event) => update("name", event.target.value)} placeholder="How CoachIQ should address you" /></label><SelectField label="Role" value={draft.role} values={roles} onChange={(value) => update("role", value)} /><SelectField label="Skill level" value={draft.level} values={["Beginner", "Intermediate", "Advanced"]} onChange={(value) => update("level", value)} /><SelectField label="Sessions / week" value={draft.sessions} values={["2", "3", "4", "5", "6"]} onChange={(value) => update("sessions", value)} /><SelectField label="Session length" value={draft.minutes} values={["20", "30", "45", "60"]} onChange={(value) => update("minutes", value)} /><ImprovementFocusField className="sm:col-span-2" goal={draft.goal} note={draft.improvementNote} onGoalChange={(value) => update("goal", value)} onNoteChange={(value) => update("improvementNote", value)} /></div></section><details className="group rounded-2xl border border-[#eee6de] bg-white p-4"><summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold text-[#405047]"><span>More player context</span><span className="text-xs font-medium text-[#8b837b]">Body, playing style, availability and fuel</span></summary><div className="mt-5 grid gap-4 border-t border-[#eee6de] pt-5 sm:grid-cols-2"><NumberInput label="Age" value={draft.age} onChange={(value) => update("age", value)} placeholder="e.g. 18" min={10} max={80} /><SelectField label="Gender" value={draft.gender || "Prefer not to say"} values={["Prefer not to say", "Female", "Male", "Non-binary"]} onChange={(value) => update("gender", value === "Prefer not to say" ? "" : value)} /><NumberInput label="Height" value={draft.heightCm} onChange={(value) => update("heightCm", value)} placeholder="e.g. 172" suffix="cm" min={100} max={240} /><NumberInput label="Weight" value={draft.weightKg} onChange={(value) => update("weightKg", value)} placeholder="e.g. 68" suffix="kg" min={30} max={220} /><label className="field-label">Home ground <input className="field-input" value={draft.region} onChange={(event) => update("region", event.target.value)} /></label><SelectField label="Batting hand" value={draft.battingHand} values={["Right-hand", "Left-hand"]} onChange={(value) => update("battingHand", value)} /><SelectField label="Bowling style" value={draft.bowlingStyle} values={["Pace", "Off-spin", "Leg-spin", "Not applicable"]} onChange={(value) => update("bowlingStyle", value)} /><SelectField label="Availability" value={draft.availableDays} values={["Weekdays", "Weekends", "Flexible"]} onChange={(value) => update("availableDays", value)} /><SelectField label="Food preference" value={draft.diet} values={["Vegetarian", "Non-vegetarian", "Plant-forward", "No preference"]} onChange={(value) => update("diet", value)} /><label className="field-label sm:col-span-2">Equipment on hand<input className="field-input" value={draft.equipment} onChange={(event) => update("equipment", event.target.value)} placeholder="Bat, balls, cones, a wall…" /></label></div></details><button onClick={onSave} className="primary-button"><Sparkles size={15} /> Re-cut my week</button></div>;
}

function NumberInput({ label, value, onChange, placeholder, suffix, min, max }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; suffix?: string; min: number; max: number }) {
  return <label className="field-label">{label} <span className="normal-case font-medium tracking-normal text-[#a0968b]">(optional)</span><div className="relative"><input className={`field-input ${suffix ? "pr-14" : ""}`} type="number" min={min} max={max} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />{suffix && <span className="field-suffix">{suffix}</span>}</div></label>;
}

function SelectField({ label, value, values, onChange }: { label: string; value: string; values: readonly string[]; onChange: (value: string) => void }) {
  return <label className="field-label">{label}<select className="field-input" value={value} onChange={(event) => onChange(event.target.value)}>{values.map((item) => <option key={item}>{item}</option>)}</select></label>;
}

function ImprovementFocusField({ goal, note, onGoalChange, onNoteChange, required = false, className = "", invalid = false }: { goal: string; note: string; onGoalChange: (value: string) => void; onNoteChange: (value: string) => void; required?: boolean; className?: string; invalid?: boolean }) {
  return <fieldset className={`field-label ${className}`}><legend>Focus for this week {required && <span className="text-[#d65a20]">*</span>}</legend><p className="mb-2 mt-1 normal-case text-xs font-medium leading-5 tracking-normal text-[#8a8178]">Choose the area, then add the cricket detail you want CoachIQ to carry into your plan.</p><select className={`field-input ${invalid ? "border-[#e66a2c] bg-[#fff8f3]" : ""}`} value={goal} onChange={(event) => onGoalChange(event.target.value)} aria-invalid={invalid}><option value="">Choose your primary focus</option>{goals.map((item) => <option key={item}>{item}</option>)}</select><textarea className="field-input mt-3 min-h-24 resize-y" maxLength={360} value={note} onChange={(event) => onNoteChange(event.target.value)} placeholder="Optional: e.g. I lose balance when driving on the front foot, or want a more consistent release point." /></fieldset>;
}

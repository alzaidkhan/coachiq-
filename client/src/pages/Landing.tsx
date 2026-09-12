import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ArrowRight, ArrowUpRight, BarChart3, BrainCircuit, CalendarDays, ChevronDown, ChevronRight, CircleCheck, Dumbbell, Menu, NotebookPen, Play, Sparkles, Target, Utensils, X } from "lucide-react";
import { COACHIQ_APP_ROUTE } from "../lib/landing";
import { handleAssetImageError, ASSET_IMAGES } from "../lib/media";
import { portableAssets } from "../lib/portableAssets";
import { FeedbackModal } from "../components/FeedbackModal";

const COACHIQ_MARK = portableAssets.mark;
const COACHIQ_HERO = ASSET_IMAGES.hero;
const LANDING_VIDEO_URL = (import.meta.env.VITE_LANDING_VIDEO_URL || "").trim();

const navItems = [
  ["The desk", "#desk"],
  ["Your week", "#week"],
  ["The toolkit", "#toolkit"],
  ["Progress", "#progress"],
] as const;

function Wordmark({ light = false }: { light?: boolean }) {
  return <span className={`scroll-wordmark ${light ? "is-light" : ""}`}><img src={COACHIQ_MARK} alt="" onError={(event) => handleAssetImageError(event, "brand")} /><b>COACH<span>IQ</span></b></span>;
}

function ProductLink({ children, view, solid = false }: { children: React.ReactNode; view?: string; solid?: boolean }) {
  const [, setLocation] = useLocation();
  return <button onClick={() => setLocation(view ? `${COACHIQ_APP_ROUTE}?view=${view}` : COACHIQ_APP_ROUTE)} className={`scroll-action ${solid ? "is-solid" : ""}`}>{children}<ArrowRight size={16} /></button>;
}

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [, setLocation] = useLocation();

  const jumpTo = (target: string) => { setMenuOpen(false); document.querySelector(target)?.scrollIntoView({ behavior: "smooth" }); };

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setMenuOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>(".scroll-landing [data-reveal]"));
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); } }), { threshold: 0.14, rootMargin: "0px 0px -7%" });
    sections.forEach((section, index) => { section.style.setProperty("--reveal-delay", `${Math.min((index % 3) * 70, 140)}ms`); observer.observe(section); });
    return () => observer.disconnect();
  }, []);

  return <div className={`scroll-landing ${menuOpen ? "menu-open" : ""}`}>
    <header className="scroll-header">
      <button className="scroll-brand" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="CoachIQ home"><Wordmark /></button>
      <nav className="scroll-nav" aria-label="Landing navigation">{navItems.map(([label, target]) => <button key={target} onClick={() => jumpTo(target)}>{label}</button>)}</nav>
      <div className="scroll-header-actions"><span>FREE, BY DESIGN</span><ProductLink solid>Build my desk</ProductLink></div>
      <button className="scroll-mobile-toggle" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-label={menuOpen ? "Close menu" : "Open menu"}>{menuOpen ? <X size={18} /> : <Menu size={19} />}</button>
    </header>

    <aside className="scroll-mobile-menu" aria-hidden={!menuOpen}><div><Wordmark /><p>START WHERE YOU ARE.</p>{navItems.map(([label, target], index) => <button key={target} onClick={() => jumpTo(target)}><span>0{index + 1}</span>{label}<ChevronRight size={18} /></button>)}<ProductLink solid>Build my free desk</ProductLink><button className="scroll-menu-secondary" onClick={() => { setMenuOpen(false); setLocation(`${COACHIQ_APP_ROUTE}?view=plan`); }}>See the week <ArrowUpRight size={16} /></button></div></aside>

    <main>
      <section className="scroll-hero" id="top">
        <div className="scroll-hero-media" aria-hidden="true"><img src={COACHIQ_HERO} alt="" onError={(event) => handleAssetImageError(event, "hero")} />{LANDING_VIDEO_URL && <video className={videoReady ? "is-ready" : ""} poster={COACHIQ_HERO} autoPlay muted loop playsInline preload="metadata" onCanPlay={() => setVideoReady(true)} onError={() => setVideoReady(false)}><source src={LANDING_VIDEO_URL} type="video/mp4" /></video>}<div className="scroll-hero-vignette" /></div>
        <div className="scroll-hero-content"><div className="scroll-kicker"><i />CRICKET, CUT TO FIT</div><h1>Train with a plan.<br /><em>Play with more clarity.</em></h1><p>CoachIQ makes your next training decision easy — a free cricket desk built around your game, your body, and the time you actually have.</p><div className="scroll-hero-actions"><ProductLink solid>Build my free desk</ProductLink><button className="scroll-play-link" onClick={() => jumpTo("#desk")}><span><Play size={14} fill="currentColor" /></span>Explore CoachIQ</button></div></div>
        <div className="scroll-hero-note"><span>FIELD NOTE / 01</span><b>Small reps.<br />Big difference.</b><i>↗</i></div><div className="scroll-hero-trajectory" aria-hidden="true" /><div className="scroll-hero-meta"><span>SCROLL FOR THE DESK</span><ChevronDown size={16} /><span>01 / 06</span></div>
      </section>

      <section className="scroll-marquee" aria-label="CoachIQ principles"><div><span>PLAYER-LED</span><i /> <span>LOCAL BY DESIGN</span><i /> <span>CRICKET, NOT CONTENT</span><i /> <span>NO LOGIN REQUIRED</span><i /> <span>PLAYER-LED</span><i /> <span>LOCAL BY DESIGN</span></div></section>

      <section className="scroll-section scroll-profile" id="desk" data-reveal><div className="scroll-section-index"><span>01</span><p>THE PLAYER CARD</p></div><div className="scroll-section-lead"><h2>Before the drills,<br /><em>there’s you.</em></h2><p>CoachIQ starts by learning the useful details: your role, your goals, your body inputs, your weekly availability, and what you have to work with.</p><ProductLink>Start my player card</ProductLink></div><div className="scroll-profile-card"><div className="scroll-card-top"><span>PLAYER PROFILE / FIRST INNINGS</span><i>01</i></div><div className="scroll-profile-name"><b>YOUR NAME</b><span>Set your starting point.</span></div><div className="scroll-profile-fields"><div><small>ROLE</small><b>BATTER / BOWLER / ALL-ROUNDER</b></div><div><small>FOCUS</small><b>BUILD MATCH STAMINA</b></div><div><small>HEIGHT + WEIGHT</small><b>FUEL TARGETS THAT FIT</b></div><div><small>TRAINING DAYS</small><b>YOUR REAL WEEK</b></div></div><div className="scroll-card-rule" /></div></section>

      <section className="scroll-week" id="week" data-reveal><div className="scroll-week-intro"><div className="scroll-section-index"><span>02</span><p>THE RHYTHM</p></div><h2>A week that moves<br /><em>with your cricket.</em></h2><p>Once your player card is complete, your desk cuts a focused weekly rhythm — drills, recovery, fuel, and a clear point of attention for every day.</p></div><div className="scroll-week-board"><div className="scroll-week-head"><span>THIS WEEK / ADAPTIVE PLAN</span><span>RE-SCHEDULE ANYTIME</span></div><article className="scroll-day-card active"><div><span>MON</span><small>01</small></div><b>Build your base</b><p>Footwork, line &amp; length, or athletic reset — shaped by your role.</p><i><Target size={18} /></i></article><article className="scroll-day-card"><div><span>WED</span><small>02</small></div><b>Train the detail</b><p>One purposeful session, with a cue you can take into the nets.</p><i><Dumbbell size={18} /></i></article><article className="scroll-day-card"><div><span>FRI</span><small>03</small></div><b>Recover for repeatability</b><p>Make the next session possible, not just harder.</p><i><Sparkles size={18} /></i></article><div className="scroll-week-footer"><span>THE PLAN IS YOURS TO MOVE.</span><ProductLink view="plan">Open my week</ProductLink></div></div></section>

      <section className="scroll-toolkit" id="toolkit" data-reveal><div className="scroll-toolkit-sticky"><div className="scroll-section-index"><span>03</span><p>THE TOOLKIT</p></div><h2>Every screen<br /><em>has a next move.</em></h2><p>CoachIQ collects the practical pieces of a better cricket week in one calm coaching desk.</p></div><div className="scroll-toolkit-stack"><article className="scroll-tool-card drills"><div className="scroll-tool-number">01</div><Dumbbell size={24} /><small>DRILL LIBRARY</small><h3>Useful reps,<br />not endless clips.</h3><p>Role-aware drill cards combine setup, target, time, coaching cue, and simple progression.</p><ProductLink view="drills">Browse drills</ProductLink></article><article className="scroll-tool-card nutrition"><div className="scroll-tool-number">02</div><Utensils size={24} /><small>NUTRITION</small><h3>Fuel that knows<br />your load.</h3><p>Daily calories, macros, practical meals, and rescheduling from your plan — built around your inputs.</p><ProductLink view="nutrition">See fuel plan</ProductLink></article><article className="scroll-tool-card coach"><div className="scroll-tool-number">03</div><BrainCircuit size={24} /><small>AI COACH</small><h3>A cricket question<br />deserves context.</h3><p>Ask about batting, bowling, recovery, match prep, or what to work on next.</p><ProductLink view="coach">Ask CoachIQ</ProductLink></article></div></section>

      <section className="scroll-data" id="progress" data-reveal><div className="scroll-data-copy"><div className="scroll-section-index"><span>04</span><p>THE EVIDENCE</p></div><h2>Make the work<br /><em>visible.</em></h2><p>Log match details and completed sessions. CoachIQ turns your own records into a simpler story about where the next rep should go.</p><ProductLink view="progress">Open dashboard</ProductLink></div><div className="scroll-analytics-panel"><div className="scroll-analytics-head"><span>PLAYER DASHBOARD / LOCAL DATA</span><BarChart3 size={18} /></div><div className="scroll-metric-row"><div><small>RUNS</small><b>—</b><span>Load a scorecard</span></div><div><small>STRIKE RATE</small><b>—</b><span>Build your first data point</span></div><div><small>SESSIONS</small><b>0</b><span>Progress starts here</span></div></div><div className="scroll-chart"><div className="scroll-chart-grid" /><svg viewBox="0 0 540 170" aria-hidden="true"><path d="M0 142 C65 142 84 109 135 119 S203 78 258 92 S336 53 394 73 S466 26 540 36" fill="none" stroke="#e66a2c" strokeWidth="3" strokeDasharray="5 8" /><circle cx="0" cy="142" r="5" fill="#e66a2c" /><circle cx="540" cy="36" r="5" fill="#e66a2c" /></svg><span>YOUR NEXT MATCH LOG MAKES THIS REAL.</span></div><div className="scroll-analytics-foot"><NotebookPen size={16} /><span>Runs · balls faced · boundaries · overs · wickets · recovery · training minutes</span></div></div></section>

      <section className="scroll-ai-band" data-reveal><div className="scroll-ai-band-text"><span>05 / THE COACH NOTE</span><h2>Your question.<br /><em>Your context.</em></h2><p>The AI Coach uses your player card and training focus to make every answer more useful than a generic search.</p></div><div className="scroll-ai-prompt"><span>ASK COACHIQ</span><b>“What should I work on before Saturday’s match?”</b><div><i>COACHIQ</i><p>Start with your match-week session. Keep the volume calm; make the detail repeatable.</p></div><ProductLink view="coach">Open AI Coach</ProductLink></div></section>

      <section className="scroll-cta" data-reveal><div className="scroll-cta-grid" /><div><Wordmark light /><span>THE FIRST REP IS FREE.</span><h2>Build a cricket<br /><em>week that fits.</em></h2><p>No account, no paywall, no invented history. Just your player card and a better next move.</p><ProductLink solid>Start my free desk</ProductLink></div></section>
    </main>

    <footer className="scroll-footer"><Wordmark /><span>COACHIQ / FREE CRICKET COACHING DESK</span><div className="scroll-footer-links"><button onClick={() => setLocation("/privacy")}>Privacy</button><button onClick={() => setLocation("/terms")}>Terms</button><button onClick={() => setFeedbackOpen(true)}>Feedback</button><button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Back to top <ArrowUpRight size={14} /></button></div></footer>{feedbackOpen && <FeedbackModal onClose={() => setFeedbackOpen(false)} />}
  </div>;
}

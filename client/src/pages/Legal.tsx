import { ArrowLeft, ArrowUpRight, ShieldCheck } from "lucide-react";
import { useLocation } from "wouter";

type LegalKind = "privacy" | "terms";

const copy = {
  privacy: {
    eyebrow: "PRIVACY / LOCAL BY DESIGN",
    title: <>Your data<br /><em>stays in your hands.</em></>,
    intro: "CoachIQ is designed to work without an account. This policy explains what is stored in your browser, when information is sent to our services, and the controls you have over it.",
    sections: [
      ["What CoachIQ stores locally", "Your player profile, schedule, completed training sessions, match logs, and nutrition preferences are stored in your browser so the coaching desk can work without a login. You can export, import, or reset this data from your Player Profile at any time."],
      ["When information leaves your device", "When you ask the AI Coach a question, CoachIQ sends your question along with relevant player-card and activity context to the coaching service so it can generate a tailored reply. When you send feedback, the note, category, and technical source label are sent to CoachIQ for review. Do not include passwords, payment details, or sensitive medical information."],
      ["Feedback review and retention", "Feedback notes are stored in CoachIQ’s service database and are available only to the site owner through a protected feedback desk. Notes may be marked reviewed or resolved, and may be deleted when they are no longer needed for support, security, or service improvement. You should not use the feedback form for requests that require a response or to send sensitive information."],
      ["How we use information", "We use the information processed through CoachIQ only to provide the requested coaching response, operate and improve the service, investigate reported issues, and protect the service from misuse. CoachIQ does not sell your personal information or require an account to use the core coaching desk."],
      ["Your choices", "You can clear local data from Player Profile, remove browser-site data through your browser settings, or avoid the AI Coach and feedback form if you do not want to send information to CoachIQ services."],
      ["Young players", "CoachIQ is a general cricket-planning tool. If you are below the age required to consent to online services where you live, use CoachIQ with a parent, guardian, or coach who can help you make appropriate choices."],
    ],
  },
  terms: {
    eyebrow: "TERMS / PLAY WITH CARE",
    title: <>Clear terms.<br /><em>Better next reps.</em></>,
    intro: "These Terms describe the acceptable use of CoachIQ’s free cricket coaching desk. By using CoachIQ, you agree to use the service responsibly and in line with these terms.",
    sections: [
      ["Coaching, not medical or professional advice", "CoachIQ provides general cricket training and wellness education. It does not diagnose, treat, or prevent injury or illness, and AI Coach replies are not a substitute for qualified medical, coaching, or safeguarding advice. Stop activity if you experience pain or feel unwell, and seek appropriate professional support."],
      ["Your responsibility", "You are responsible for deciding whether a drill, nutrition suggestion, or training load is suitable for you. Use safe spaces and equipment, follow venue rules, and obtain any supervision or permission appropriate to your age and circumstances."],
      ["Acceptable use", "Do not misuse CoachIQ, interfere with its operation, attempt to access systems or data that are not yours, submit unlawful or harmful content, or rely on the service for emergency support."],
      ["AI Coach and service availability", "AI Coach replies are generated from the details you provide and may be incomplete or inaccurate. To keep the free service available and protect it from misuse, CoachIQ may limit question length, request frequency, simultaneous requests, answer length, or daily AI access. CoachIQ may update, pause, or change features as the service evolves. We do not guarantee that every feature will be available at all times."],
      ["Feedback and updates", "If you send feedback, you allow CoachIQ to review and use it to improve the service without any obligation to compensate you. We may update these terms or the Privacy Policy when the service changes; the current version will be available on this site."],
    ],
  },
} as const;

export default function Legal({ kind }: { kind: LegalKind }) {
  const [, setLocation] = useLocation();
  const page = copy[kind];
  const other = kind === "privacy" ? "terms" : "privacy";
  return <main className="legal-page"><header className="legal-header"><button onClick={() => setLocation("/")} className="legal-brand"><span>COACH<span>IQ</span></span><small>FREE CRICKET COACHING DESK</small></button><button onClick={() => setLocation("/")} className="legal-back"><ArrowLeft size={15} /> Back to CoachIQ</button></header><section className="legal-hero"><div className="scroll-kicker"><i />{page.eyebrow}</div><h1>{page.title}</h1><p>{page.intro}</p><div className="legal-meta"><ShieldCheck size={15} /> Last updated 21 August 2026</div></section><section className="legal-content">{page.sections.map(([heading, text], index) => <article key={heading}><span>0{index + 1}</span><div><h2>{heading}</h2><p>{text}</p></div></article>)}</section><footer className="legal-footer"><p>This is a plain-language working policy for CoachIQ’s public launch. Have a qualified lawyer review it for your jurisdiction before relying on it as a final legal document.</p><button onClick={() => setLocation(`/${other}`)}>Read {other === "privacy" ? "Privacy Policy" : "Terms of Service"} <ArrowUpRight size={15} /></button></footer></main>;
}

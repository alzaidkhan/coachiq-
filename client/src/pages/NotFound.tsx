import { ArrowLeft, Compass } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return <main className="grid min-h-screen place-items-center bg-[#f6f2ec] px-5 text-[#19221c]">
    <section className="paper-card max-w-lg p-8 text-center sm:p-12">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#fff0e7] text-[#d65a20]"><Compass size={26} /></span>
      <div className="eyebrow mt-6">Field note · 404</div>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-[-0.06em]">That page is off the pitch.</h1>
      <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-[#746d66]">The route you opened does not exist in CoachIQ. Return to your cricket desk to keep your plan moving.</p>
      <button onClick={() => setLocation("/")} className="primary-button mt-7"><ArrowLeft size={15} /> Back to CoachIQ</button>
    </section>
  </main>;
}

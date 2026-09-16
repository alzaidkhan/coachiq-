import { BrainCircuit } from "lucide-react";

export function PageSkeleton() {
  return (
    <main className="min-h-screen bg-[#f6f2ec] p-4 sm:p-8 animate-pulse text-[#4b554d]">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex items-center justify-between border-b border-[#e6ddd4] pb-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#e5dcce]" />
            <div className="space-y-2">
              <div className="h-4 w-28 rounded bg-[#e5dcce]" />
              <div className="h-3 w-40 rounded bg-[#eee6db]" />
            </div>
          </div>
          <div className="h-9 w-24 rounded-xl bg-[#e5dcce]" />
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="h-36 rounded-2xl bg-[#ede5d8]" />
          <div className="h-36 rounded-2xl bg-[#ede5d8]" />
          <div className="h-36 rounded-2xl bg-[#ede5d8]" />
        </div>

        <div className="h-72 rounded-3xl bg-[#ede5d8]" />
      </div>
    </main>
  );
}

export function CardSkeleton({ title = "Loading content…" }: { title?: string }) {
  return (
    <div className="paper-card animate-pulse space-y-4 p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#e5dcce]">
          <BrainCircuit size={20} className="animate-spin text-[#a0968b]" />
        </div>
        <div className="space-y-1.5">
          <div className="h-4 w-32 rounded bg-[#e5dcce]" />
          <div className="h-3 w-48 rounded bg-[#eee6db]" />
        </div>
      </div>
      <div className="h-44 w-full rounded-2xl bg-[#eee7dd]" />
    </div>
  );
}

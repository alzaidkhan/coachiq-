export const AI_MAX_QUESTION_LENGTH = 500;
export const AI_DAILY_REQUEST_BUDGET = 60;
export const AI_MAX_CONCURRENT_REQUESTS = 2;

type WindowEntry = { startedAt: number[] };

export class SlidingWindowLimiter {
  private readonly entries = new Map<string, WindowEntry>();

  constructor(private readonly limit: number, private readonly windowMs: number) {}

  take(key: string, now = Date.now()) {
    const existing = this.entries.get(key)?.startedAt ?? [];
    const active = existing.filter((timestamp) => now - timestamp < this.windowMs);
    if (active.length >= this.limit) {
      this.entries.set(key, { startedAt: active });
      const retryAfterSeconds = Math.max(1, Math.ceil((this.windowMs - (now - active[0])) / 1000));
      return { allowed: false, remaining: 0, retryAfterSeconds };
    }
    active.push(now);
    this.entries.set(key, { startedAt: active });
    return { allowed: true, remaining: this.limit - active.length, retryAfterSeconds: 0 };
  }
}

let activeAiRequests = 0;

export function acquireAiSlot() {
  if (activeAiRequests >= AI_MAX_CONCURRENT_REQUESTS) return null;
  activeAiRequests += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    activeAiRequests = Math.max(0, activeAiRequests - 1);
  };
}

export function sanitizeShortText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export function validateCoachQuestion(value: unknown) {
  const question = sanitizeShortText(value, AI_MAX_QUESTION_LENGTH + 1);
  if (question.length < 5) return { ok: false as const, error: "Ask a specific cricket question so CoachIQ can help." };
  if (question.length > AI_MAX_QUESTION_LENGTH) return { ok: false as const, error: `Keep questions to ${AI_MAX_QUESTION_LENGTH} characters or fewer.` };
  const lower = question.toLowerCase();
  
  // Guard against prompt injection, jailbreaks, system exfiltration, and script injection
  const unsafePattern = /(ignore|reveal|show|print|repeat|dump|leak).{0,50}(system|developer|hidden|prompt|instruction|rule|guideline)|api\s*key|jailbreak|bypass.{0,30}(guard|safety|rule|limitation)|<script|javascript:|data:text\/html/i;
  if (unsafePattern.test(lower)) return { ok: false as const, error: "CoachIQ supports cricket training questions, not requests to alter or inspect its instructions." };
  
  // Broad cricket, biomechanics, conditioning, and sports performance lexicon
  const cricketPattern = /\b(cricket|bat|batting|batter|batsman|batsmen|bowling|bowler|wicket|keeper|keeping|glove|pads?|crease|pitch|stumps?|bails?|spin|spinner|leg[- ]?spin|off[- ]?spin|googly|doosra|carrom|flipper|pace|fast|seam|swing|outswing|inswing|reverse|cutter|knuckle|yorker|bouncer|short[- ]?pitch|full[- ]?toss|drive|cover drive|straight drive|on drive|off drive|cut|square cut|late cut|pull|hook|sweep|reverse sweep|paddle|flick|glance|dab|ramp|scoop|loft|forward defensive|backfoot|back-foot|punch|backlift|stance|trigger|grip|footwork|stride|wrist|release|gather|run[- ]?up|follow[- ]?through|slip|gully|point|cover|midwicket|mid-on|mid-off|fine leg|third man|long-on|long-off|field|fielding|catch|catching|run[- ]?out|direct hit|throw|over|innings|match|powerplay|death overs?|strike rotation|single|boundary|four|six|net|nets|session|drill|drills|coach|coaching|training|stamina|endurance|agility|fitness|strength|recovery|warm[- ]?up|cool[- ]?down|nutrition|hydration|diet|form|technique|timing|ball)\b/i;
  if (!cricketPattern.test(lower)) return { ok: false as const, error: "CoachIQ is focused on cricket training. Ask about your skills, preparation, recovery, or match play." };
  return { ok: true as const, question };
}

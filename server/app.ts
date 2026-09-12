import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { buildCoachMessages, buildDashboardInsightMessages, type CoachActivityContext, type CoachProfileContext } from "../client/src/lib/coachContext";
import { acquireAiSlot, AI_DAILY_REQUEST_BUDGET, sanitizeShortText, SlidingWindowLimiter, validateCoachQuestion } from "./aiSecurity";
import { requireAdmin } from "./adminAuth";
import { parseFeedback } from "./feedback";
import { deleteFeedback, feedbackStatuses, listFeedback, reserveDailyAiRequest, saveFeedback, setFeedbackStatus } from "./feedbackStore";
import { generateFallbackCoachAnswer, generateFallbackDashboardInsight } from "./coachFallback";

type CoachRequest = { question?: unknown; profile?: unknown; activity?: unknown };
type DashboardInsightRequest = { profile?: unknown; activity?: unknown; filterLabel?: unknown };
type CompletionResponse = { choices?: { message?: { content?: string | null } }[]; error?: { message?: string } };
type AppOptions = { staticPath?: string };

const coachProfileFields = ["name", "age", "gender", "region", "heightCm", "weightKg", "role", "battingHand", "bowlingStyle", "level", "goal", "sessions", "minutes", "availableDays", "diet", "equipment", "improvementNote"] as const;
const asRecord = (value: unknown): Record<string, unknown> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const boundedNumber = (value: unknown, maximum: number) => Number.isFinite(Number(value)) ? Math.min(Math.max(0, Number(value)), maximum) : 0;

const DEPRECATED_MODEL_MAP: Record<string, string> = {
  "gemini-2.5-flash": "gemini-3.8-flash",
  "gemini-2.5-flash-lite": "gemini-3.8-flash",
  "gemini-2.0-flash": "gemini-3.8-flash",
  "gemini-2.0-flash-lite": "gemini-3.8-flash",
  "gemini-1.5-flash": "gemini-3.8-flash",
  "gemini-1.5-pro": "gemini-3.1-pro-preview",
};

const normalizeModel = (model?: string): string => {
  const trimmed = model?.trim();
  if (!trimmed) return "";
  return DEPRECATED_MODEL_MAP[trimmed] || trimmed;
};

const configuredModels = () =>
  Array.from(
    new Set(
      [process.env.AI_MODEL, process.env.AI_FALLBACK_MODEL]
        .map((value) => normalizeModel(value))
        .filter((value): value is string => Boolean(value))
    )
  );

const DEFAULT_GEMINI_MODELS = ["gemini-3.8-flash", "gemini-flash-latest", "gemini-3.1-flash-lite", "gemini-3.1-pro-preview"];

function getAiConfig() {
  const customBase = process.env.AI_API_BASE_URL?.replace(/\/+$/, "");
  const customKey = process.env.AI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;

  if (customBase && customKey) {
    const models = configuredModels();
    return {
      baseUrl: customBase,
      apiKey: customKey,
      models: models.length ? models : DEFAULT_GEMINI_MODELS,
      isGeminiDirect: false,
    };
  }

  if (geminiKey) {
    const models = configuredModels();
    return {
      baseUrl: customBase || "https://generativelanguage.googleapis.com/v1beta/openai",
      apiKey: geminiKey,
      models: models.length ? models : DEFAULT_GEMINI_MODELS,
      isGeminiDirect: !customBase,
    };
  }

  if (customKey) {
    return {
      baseUrl: customBase || "https://api.openai.com/v1",
      apiKey: customKey,
      models: configuredModels().length ? configuredModels() : ["gpt-4o-mini", "gpt-4o"],
      isGeminiDirect: false,
    };
  }

  return null;
}

let genAiInstance: GoogleGenAI | null = null;
function getGenAi(apiKey: string): GoogleGenAI {
  if (!genAiInstance) {
    genAiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAiInstance;
}

function boundedCoachProfile(value: unknown): CoachProfileContext {
  const profile = asRecord(value);
  return coachProfileFields.reduce<CoachProfileContext>((safe, field) => ({ ...safe, [field]: sanitizeShortText(profile[field], 160) }), {});
}

function boundedCoachActivity(value: unknown): CoachActivityContext {
  const activity = asRecord(value);
  const sessionRecords = Array.isArray(activity.sessions) ? activity.sessions.slice(-30).map(asRecord) : [];
  const matchRecords = Array.isArray(activity.matches) ? activity.matches.slice(-30).map(asRecord) : [];
  return {
    sessions: sessionRecords.map((entry, index) => ({ id: sanitizeShortText(entry.id, 64) || `session-${index}`, date: sanitizeShortText(entry.date, 16), drillId: sanitizeShortText(entry.drillId, 64), minutes: boundedNumber(entry.minutes, 240) })),
    matches: matchRecords.map((entry, index) => ({ id: sanitizeShortText(entry.id, 64) || `match-${index}`, date: sanitizeShortText(entry.date, 16), format: sanitizeShortText(entry.format, 40), dismissalType: sanitizeShortText(entry.dismissalType, 40), bowlingPhase: sanitizeShortText(entry.bowlingPhase, 40), runs: boundedNumber(entry.runs, 500), ballsFaced: boundedNumber(entry.ballsFaced, 500), fours: boundedNumber(entry.fours, 125), sixes: boundedNumber(entry.sixes, 80), wickets: boundedNumber(entry.wickets, 20), overs: boundedNumber(entry.overs, 50), runsConceded: boundedNumber(entry.runsConceded, 500), maidens: boundedNumber(entry.maidens, 50), catches: boundedNumber(entry.catches, 20), runOuts: boundedNumber(entry.runOuts, 20) })),
  };
}

let quotaCooldownUntil = 0;

function isQuotaOrRateLimitError(err: unknown): boolean {
  if (!err) return false;
  const msg = typeof err === "string" ? err : err instanceof Error ? err.message : JSON.stringify(err);
  return /429|quota|RESOURCE_EXHAUSTED|rate[- ]?limit/i.test(msg);
}

function parseRetryDelayMs(err: unknown): number {
  try {
    const str = typeof err === "string" ? err : err instanceof Error ? err.message : JSON.stringify(err);
    const secMatch = str.match(/retry in ([0-9.]+)s/i) || str.match(/retryDelay["']?:\s*["']?([0-9.]+)s?/i);
    if (secMatch && secMatch[1]) {
      const sec = parseFloat(secMatch[1]);
      if (!isNaN(sec) && sec > 0) return Math.min(Math.ceil(sec * 1000) + 1000, 60_000);
    }
  } catch {
    // default
  }
  return 30_000;
}

export function createCoachIQApp({ staticPath }: AppOptions = {}) {
  const app = express();
  const coachLimiter = new SlidingWindowLimiter(20, 10 * 60 * 1000);
  const insightLimiter = new SlidingWindowLimiter(15, 10 * 60 * 1000);
  const feedbackLimiter = new SlidingWindowLimiter(6, 15 * 60 * 1000);
  const adminLimiter = new SlidingWindowLimiter(15, 10 * 60 * 1000);

  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    res.setHeader("X-Permitted-Cross-Domain-Policies", "none");

    const isApi = req.path.startsWith("/api");
    if (isApi) {
      res.setHeader("X-Frame-Options", "DENY");
      res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
      res.setHeader("Cross-Origin-Resource-Policy", "same-site");
      res.setHeader(
        "Content-Security-Policy",
        "default-src 'self'; base-uri 'self'; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data:; media-src 'self' https:; connect-src 'self'; frame-ancestors 'none'; form-action 'self'; upgrade-insecure-requests"
      );
    } else {
      res.setHeader(
        "Content-Security-Policy",
        "default-src 'self'; base-uri 'self'; object-src 'none'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: https:; media-src 'self' https:; connect-src 'self' ws: wss: https:; frame-ancestors *; form-action 'self'"
      );
    }
    next();
  });
  app.use(express.json({ limit: "48kb" }));

  app.use((error: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (error instanceof SyntaxError) return res.status(400).json({ error: "Use a valid JSON request body." });
    return next(error);
  });

  const clientKey = (req: express.Request) => req.ip || req.socket.remoteAddress || "unknown";
  const validateId = (value: string) => Number.isSafeInteger(Number(value)) && Number(value) > 0 ? Number(value) : null;

  app.use("/api/admin", (req, res, next) => {
    const rate = adminLimiter.take(clientKey(req));
    res.setHeader("Cache-Control", "no-store, max-age=0");
    if (!rate.allowed) { res.setHeader("Retry-After", String(rate.retryAfterSeconds)); return res.status(429).json({ error: `Too many owner-access attempts. Try again in about ${rate.retryAfterSeconds} seconds.` }); }
    return next();
  });

  app.post("/api/coach", async (req, res) => {
    const body = req.body as CoachRequest;
    const rate = coachLimiter.take(clientKey(req));
    if (!rate.allowed) { res.setHeader("Retry-After", String(rate.retryAfterSeconds)); return res.status(429).json({ error: `CoachIQ is taking a short break for this device. Try again in about ${rate.retryAfterSeconds} seconds.` }); }
    const validated = validateCoachQuestion(body.question);
    if (!validated.ok) return res.status(400).json({ error: validated.error });
    const releaseSlot = acquireAiSlot();
    if (!releaseSlot) return res.status(429).json({ error: "CoachIQ is handling a couple of questions right now. Please try again in a moment." });
    const aiConfig = getAiConfig();
    if (!aiConfig) { releaseSlot(); return res.status(503).json({ error: "CoachIQ AI is not available right now. Please try again shortly." }); }
    const { baseUrl, apiKey, models, isGeminiDirect } = aiConfig;
    const budgetAvailable = await reserveDailyAiRequest(AI_DAILY_REQUEST_BUDGET).catch(() => false);
    if (!budgetAvailable) { releaseSlot(); return res.status(429).json({ error: "CoachIQ AI has reached today’s free coaching limit. Please come back tomorrow." }); }
    const { system, user } = buildCoachMessages(validated.question, boundedCoachProfile(body.profile), boundedCoachActivity(body.activity));
    try {
      if (Date.now() < quotaCooldownUntil) {
        const fallback = generateFallbackCoachAnswer(validated.question, boundedCoachProfile(body.profile), boundedCoachActivity(body.activity));
        return res.json({ answer: fallback });
      }

      if (isGeminiDirect) {
        try {
          const ai = getGenAi(apiKey);
          for (const model of models) {
            try {
              const directRes = await ai.models.generateContent({
                model,
                contents: user,
                config: {
                  systemInstruction: system,
                  temperature: 0.45,
                },
              });
              const answer = directRes.text?.trim();
              if (answer && answer.length >= 40) return res.json({ answer });
            } catch (err) {
              if (isQuotaOrRateLimitError(err)) {
                const delay = parseRetryDelayMs(err);
                quotaCooldownUntil = Date.now() + delay;
                break;
              }
            }
          }
        } catch {
          // Direct client fallback
        }
        const fallback = generateFallbackCoachAnswer(validated.question, boundedCoachProfile(body.profile), boundedCoachActivity(body.activity));
        return res.json({ answer: fallback });
      }

      const completionUrl = baseUrl.endsWith("/chat/completions") ? baseUrl : `${baseUrl}/chat/completions`;
      if (!models.length) { return res.status(503).json({ error: "CoachIQ AI needs a configured coaching model. Please try again shortly." }); }
      let lastError = "No answer returned";
      for (const model of models) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 24_000);
        try {
          const upstream = await fetch(completionUrl, { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, signal: controller.signal, body: JSON.stringify({ model, max_tokens: 1000, temperature: 0.45, messages: [{ role: "system", content: system }, { role: "user", content: user }] }) });
          const payload = await upstream.json() as CompletionResponse;
          const answer = payload.choices?.[0]?.message?.content?.trim();
          if (upstream.ok && answer && answer.length >= 40) return res.json({ answer });
          lastError = payload.error?.message ?? `HTTP ${upstream.status}`;
          if (isQuotaOrRateLimitError(lastError)) {
            quotaCooldownUntil = Date.now() + parseRetryDelayMs(lastError);
            break;
          }
        } catch (error) { lastError = error instanceof Error ? error.message : "Network failure"; }
        finally { clearTimeout(timeout); }
      }
      if (lastError.includes("429") || lastError.includes("quota") || lastError.includes("RESOURCE_EXHAUSTED") || !process.env.AI_API_BASE_URL) {
        const fallback = generateFallbackCoachAnswer(validated.question, boundedCoachProfile(body.profile), boundedCoachActivity(body.activity));
        return res.json({ answer: fallback });
      }
      return res.status(502).json({ error: "CoachIQ could not finish that answer. Please try again." });
    } catch {
      const fallback = generateFallbackCoachAnswer(validated.question, boundedCoachProfile(body.profile), boundedCoachActivity(body.activity));
      return res.json({ answer: fallback });
    } finally { releaseSlot(); }
  });

  app.post("/api/dashboard-insights", async (req, res) => {
    const body = req.body as DashboardInsightRequest;
    const rate = insightLimiter.take(clientKey(req));
    if (!rate.allowed) { res.setHeader("Retry-After", String(rate.retryAfterSeconds)); return res.status(429).json({ error: `CoachIQ has refreshed insights recently on this device. Try again in about ${rate.retryAfterSeconds} seconds.` }); }
    const activity = boundedCoachActivity(body.activity);
    if (!activity.matches?.length) return res.status(400).json({ error: "Add a match in this selected view before requesting an insight." });
    const releaseSlot = acquireAiSlot();
    if (!releaseSlot) return res.status(429).json({ error: "CoachIQ is preparing other coaching responses. Please try again in a moment." });
    const aiConfig = getAiConfig();
    if (!aiConfig) { releaseSlot(); return res.status(503).json({ error: "CoachIQ insights are not available right now. Please try again shortly." }); }
    const { baseUrl, apiKey, models, isGeminiDirect } = aiConfig;
    const budgetAvailable = await reserveDailyAiRequest(AI_DAILY_REQUEST_BUDGET).catch(() => false);
    if (!budgetAvailable) { releaseSlot(); return res.status(429).json({ error: "CoachIQ AI has reached today’s free coaching limit. Please come back tomorrow." }); }
    const { system, user } = buildDashboardInsightMessages(boundedCoachProfile(body.profile), activity, sanitizeShortText(body.filterLabel, 120) || "All matches");
    try {
      if (Date.now() < quotaCooldownUntil) {
        const fallback = generateFallbackDashboardInsight(boundedCoachProfile(body.profile), activity, sanitizeShortText(body.filterLabel, 120) || "All matches");
        return res.json({ answer: fallback });
      }

      if (isGeminiDirect) {
        try {
          const ai = getGenAi(apiKey);
          for (const model of models) {
            try {
              const directRes = await ai.models.generateContent({
                model,
                contents: user,
                config: {
                  systemInstruction: system,
                  temperature: 0.35,
                },
              });
              const answer = directRes.text?.trim();
              if (answer && answer.length >= 40) return res.json({ answer });
            } catch (err) {
              if (isQuotaOrRateLimitError(err)) {
                const delay = parseRetryDelayMs(err);
                quotaCooldownUntil = Date.now() + delay;
                break;
              }
            }
          }
        } catch {
          // Direct client fallback
        }
        const fallback = generateFallbackDashboardInsight(boundedCoachProfile(body.profile), activity, sanitizeShortText(body.filterLabel, 120) || "All matches");
        return res.json({ answer: fallback });
      }

      const completionUrl = baseUrl.endsWith("/chat/completions") ? baseUrl : `${baseUrl}/chat/completions`;
      if (!models.length) return res.status(503).json({ error: "CoachIQ insights need a configured coaching model. Please try again shortly." });
      let lastError = "No answer returned";
      for (const model of models) {
        const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 24_000);
        try {
          const upstream = await fetch(completionUrl, { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, signal: controller.signal, body: JSON.stringify({ model, max_tokens: 650, temperature: 0.35, messages: [{ role: "system", content: system }, { role: "user", content: user }] }) });
          const payload = await upstream.json() as CompletionResponse; const answer = payload.choices?.[0]?.message?.content?.trim();
          if (upstream.ok && answer && answer.length >= 40) return res.json({ answer });
          lastError = payload.error?.message ?? `HTTP ${upstream.status}`;
          if (isQuotaOrRateLimitError(lastError)) {
            quotaCooldownUntil = Date.now() + parseRetryDelayMs(lastError);
            break;
          }
        } catch (error) { lastError = error instanceof Error ? error.message : "Network failure"; }
        finally { clearTimeout(timeout); }
      }
      if (lastError.includes("429") || lastError.includes("quota") || lastError.includes("RESOURCE_EXHAUSTED") || !process.env.AI_API_BASE_URL) {
        const fallback = generateFallbackDashboardInsight(boundedCoachProfile(body.profile), activity, sanitizeShortText(body.filterLabel, 120) || "All matches");
        return res.json({ answer: fallback });
      }
      return res.status(502).json({ error: "CoachIQ could not prepare that insight. Please try again." });
    } catch {
      const fallback = generateFallbackDashboardInsight(boundedCoachProfile(body.profile), activity, sanitizeShortText(body.filterLabel, 120) || "All matches");
      return res.json({ answer: fallback });
    } finally { releaseSlot(); }
  });

  app.post("/api/feedback", async (req, res) => {
    const rate = feedbackLimiter.take(clientKey(req));
    if (!rate.allowed) { res.setHeader("Retry-After", String(rate.retryAfterSeconds)); return res.status(429).json({ error: `Thanks for the note. Please wait about ${rate.retryAfterSeconds} seconds before sending another.` }); }
    const note = parseFeedback(req.body ?? {});
    if (!note) return res.status(400).json({ error: "Please add a little more detail." });
    try { await saveFeedback(note); return res.status(202).json({ received: true }); }
    catch (error) { console.error("[CoachIQ feedback] storage failed", error); return res.status(503).json({ error: "CoachIQ could not receive that note. Please try again shortly." }); }
  });

  app.get("/api/ai-status", (_req, res) => {
    const config = getAiConfig();
    return res.json({
      engine: "Google Gemini",
      ready: true,
      model: config?.models[0] || "gemini-3.8-flash",
      provider: config ? (config.isGeminiDirect ? "gemini" : "custom") : "offline-fallback",
    });
  });

  app.get("/api/admin/health", requireAdmin, (_req, res) => res.json({ ready: true }));
  app.get("/api/admin/feedback", requireAdmin, async (_req, res) => { try { return res.json({ feedback: await listFeedback() }); } catch (error) { console.error("[CoachIQ admin] feedback list failed", error); return res.status(503).json({ error: "Feedback is temporarily unavailable." }); } });
  app.patch("/api/admin/feedback/:id", requireAdmin, async (req, res) => {
    const id = validateId(req.params.id); const status = typeof req.body?.status === "string" ? req.body.status : "";
    if (!id || !feedbackStatuses.includes(status as (typeof feedbackStatuses)[number])) return res.status(400).json({ error: "Use a valid feedback record and status." });
    try { return (await setFeedbackStatus(id, status as (typeof feedbackStatuses)[number])) ? res.json({ updated: true }) : res.status(404).json({ error: "Feedback record not found." }); } catch (error) { console.error("[CoachIQ admin] feedback status failed", error); return res.status(503).json({ error: "Feedback could not be updated right now." }); }
  });
  app.delete("/api/admin/feedback/:id", requireAdmin, async (req, res) => {
    const id = validateId(req.params.id); if (!id) return res.status(400).json({ error: "Use a valid feedback record." });
    try { return (await deleteFeedback(id)) ? res.json({ deleted: true }) : res.status(404).json({ error: "Feedback record not found." }); } catch (error) { console.error("[CoachIQ admin] feedback deletion failed", error); return res.status(503).json({ error: "Feedback could not be deleted right now." }); }
  });

  if (staticPath) {
    app.use(express.static(staticPath));
    app.get("*", (_req, res) => res.sendFile(path.join(staticPath, "index.html")));
  }
  return app;
}

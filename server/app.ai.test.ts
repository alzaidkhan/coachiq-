import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./feedbackStore", () => ({
  reserveDailyAiRequest: vi.fn(async () => true),
  deleteFeedback: vi.fn(),
  feedbackStatuses: ["new", "reviewed", "resolved"],
  listFeedback: vi.fn(),
  saveFeedback: vi.fn(),
  setFeedbackStatus: vi.fn(),
}));

import { createCoachIQApp } from "./app";

const originalFetch = global.fetch;
const originalEnv = { base: process.env.AI_API_BASE_URL, key: process.env.AI_API_KEY, model: process.env.AI_MODEL, fallback: process.env.AI_FALLBACK_MODEL };

async function requestCoach() {
  const server = createCoachIQApp().listen(0);
  const port = (server.address() as { port: number }).port;
  try {
    return await originalFetch(`http://127.0.0.1:${port}/api/coach`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: "How can I improve my front-foot batting this week?", profile: { role: "Batter", level: "Intermediate", goal: "Build match stamina", sessions: "3", minutes: "45", heightCm: "178", weightKg: "70" }, activity: { sessions: [], matches: [] } }) });
  } finally { await new Promise<void>((resolve) => server.close(() => resolve())); }
}

async function requestDashboardInsight() {
  const server = createCoachIQApp().listen(0);
  const port = (server.address() as { port: number }).port;
  try {
    return await originalFetch(`http://127.0.0.1:${port}/api/dashboard-insights`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profile: { name: "Arjun", role: "Batter", level: "Intermediate", goal: "Build match stamina", sessions: "3", minutes: "45" }, filterLabel: "T20 · 2026-08-01 to 2026-08-31", activity: { matches: [{ id: "match-1", date: "2026-08-23", format: "T20", runs: 48, ballsFaced: 32, fours: 5, sixes: 2, wickets: 0, overs: 0, runsConceded: 0, maidens: 0, catches: 1, runOuts: 0 }] } }) });
  } finally { await new Promise<void>((resolve) => server.close(() => resolve())); }
}

async function requestMalformedCoachBody() {
  const server = createCoachIQApp().listen(0);
  const port = (server.address() as { port: number }).port;
  try {
    return await originalFetch(`http://127.0.0.1:${port}/api/coach`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{not-json" });
  } finally { await new Promise<void>((resolve) => server.close(() => resolve())); }
}

afterEach(() => {
  global.fetch = originalFetch;
  process.env.AI_API_BASE_URL = originalEnv.base;
  process.env.AI_API_KEY = originalEnv.key;
  process.env.AI_MODEL = originalEnv.model;
  process.env.AI_FALLBACK_MODEL = originalEnv.fallback;
});

describe("CoachIQ AI model resilience", () => {
  it("returns a safe malformed-request response with security headers", async () => {
    const response = await requestMalformedCoachBody();
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Use a valid JSON request body." });
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
  });

  it("uses the configured primary model and returns the practical structured coaching answer", async () => {
    process.env.AI_API_BASE_URL = "https://coach.example/v1";
    process.env.AI_API_KEY = "test-key";
    process.env.AI_MODEL = "primary-model";
    delete process.env.AI_FALLBACK_MODEL;
    const upstream = vi.fn(async () => new Response(JSON.stringify({ choices: [{ message: { content: "**Coach note** Your intermediate batting plan benefits from 45-minute sessions.\n\n**Next practice**\n1. Take 12 front-foot shadow drives with a stable head.\n2. Use 3 sets of 6 target-ball drives.\n3. Note how often your front knee stays aligned.\n\n**Watch** Keep your weight balanced through contact." } }] }), { status: 200, headers: { "Content-Type": "application/json" } }));
    global.fetch = upstream as typeof fetch;

    const response = await requestCoach();
    const payload = await response.json() as { answer: string };
    expect(response.status).toBe(200);
    expect(payload.answer).toContain("**Next practice**");
    expect(upstream).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(upstream.mock.calls[0][1]?.body)).model).toBe("primary-model");
  });

  it("retries once with the configured fallback model when the primary model fails", async () => {
    process.env.AI_API_BASE_URL = "https://coach.example/v1";
    process.env.AI_API_KEY = "test-key";
    process.env.AI_MODEL = "primary-model";
    process.env.AI_FALLBACK_MODEL = "fallback-model";
    const upstream = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: { message: "temporarily unavailable" } }), { status: 503, headers: { "Content-Type": "application/json" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ choices: [{ message: { content: "**Coach note** Your goal and weekly load point to a controlled batting session.\n\n**Next practice**\n1. Use 18 balanced drives.\n2. Pause after every six.\n3. Record the cleanest contact.\n\n**Watch** Avoid reaching for the ball." } }] }), { status: 200, headers: { "Content-Type": "application/json" } }));
    global.fetch = upstream as typeof fetch;

    const response = await requestCoach();
    expect(response.status).toBe(200);
    expect(upstream).toHaveBeenCalledTimes(2);
    expect(JSON.parse(String(upstream.mock.calls[0][1]?.body)).model).toBe("primary-model");
    expect(JSON.parse(String(upstream.mock.calls[1][1]?.body)).model).toBe("fallback-model");
  });

  it("returns a structured insight based on the selected dashboard matches", async () => {
    process.env.AI_API_BASE_URL = "https://coach.example/v1";
    process.env.AI_API_KEY = "test-key";
    process.env.AI_MODEL = "primary-model";
    delete process.env.AI_FALLBACK_MODEL;
    const upstream = vi.fn(async () => new Response(JSON.stringify({ choices: [{ message: { content: "**Strength** You scored 48 from 32 balls in the selected T20 match.\n\n**Opportunity** Build a repeatable finish over the final 12 balls.\n\n**Next session**\n1. Face 18 target balls.\n2. Record clean contacts." } }] }), { status: 200, headers: { "Content-Type": "application/json" } }));
    global.fetch = upstream as typeof fetch;

    const response = await requestDashboardInsight();
    const payload = await response.json() as { answer: string };
    expect(response.status).toBe(200);
    expect(payload.answer).toContain("**Strength**");
    expect(JSON.parse(String(upstream.mock.calls[0][1]?.body)).model).toBe("primary-model");
    expect(JSON.parse(String(upstream.mock.calls[0][1]?.body)).messages[1].content).toContain("Filtered dashboard scope: T20");
  });

  it("normalizes deprecated Gemini models to gemini-3.8-flash to prevent upstream 404s", async () => {
    process.env.AI_API_BASE_URL = "https://coach.example/v1";
    process.env.AI_API_KEY = "test-key";
    process.env.AI_MODEL = "gemini-2.5-flash";
    process.env.AI_FALLBACK_MODEL = "gemini-2.5-flash-lite";
    const upstream = vi.fn(async () => new Response(JSON.stringify({ choices: [{ message: { content: "**Coach note** Excellent batting balance.\n\n**Next practice**\n1. 10 forward defenses.\n2. Record quality contacts." } }] }), { status: 200, headers: { "Content-Type": "application/json" } }));
    global.fetch = upstream as typeof fetch;

    const response = await requestCoach();
    expect(response.status).toBe(200);
    expect(upstream).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(upstream.mock.calls[0][1]?.body)).model).toBe("gemini-3.8-flash");
  });
});

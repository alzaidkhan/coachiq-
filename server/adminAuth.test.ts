import express from "express";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { requireAdmin } from "./adminAuth";

let server: ReturnType<typeof express.application.listen>;
let baseUrl = "";
const prevAdminKey = process.env.COACHIQ_ADMIN_ACCESS_KEY;

beforeAll(async () => {
  process.env.COACHIQ_ADMIN_ACCESS_KEY = process.env.COACHIQ_ADMIN_ACCESS_KEY || "test-owner-access-key";
  const app = express();
  app.get("/api/admin/health", requireAdmin, (_req, res) => res.json({ ready: true }));
  await new Promise<void>((resolve) => { server = app.listen(0, "127.0.0.1", () => { const address = server.address(); baseUrl = `http://127.0.0.1:${typeof address === "object" && address ? address.port : 0}`; resolve(); }); });
});

afterAll(async () => {
  if (prevAdminKey !== undefined) {
    process.env.COACHIQ_ADMIN_ACCESS_KEY = prevAdminKey;
  } else {
    delete process.env.COACHIQ_ADMIN_ACCESS_KEY;
  }
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe("owner access endpoint", () => {
  it("accepts the configured owner access code and rejects missing or invalid codes", async () => {
    const valid = await fetch(`${baseUrl}/api/admin/health`, { headers: { "x-coachiq-admin-key": process.env.COACHIQ_ADMIN_ACCESS_KEY ?? "" } });
    const bearerValid = await fetch(`${baseUrl}/api/admin/health`, { headers: { Authorization: `Bearer ${process.env.COACHIQ_ADMIN_ACCESS_KEY ?? ""}` } });
    const missing = await fetch(`${baseUrl}/api/admin/health`);
    const invalid = await fetch(`${baseUrl}/api/admin/health`, { headers: { "x-coachiq-admin-key": "wrong-access-code" } });
    const empty = await fetch(`${baseUrl}/api/admin/health`, { headers: { "x-coachiq-admin-key": "   " } });
    
    expect(valid.status).toBe(200);
    expect(await valid.json()).toEqual({ ready: true });
    expect(bearerValid.status).toBe(200);
    expect(missing.status).toBe(401);
    expect(missing.headers.get("www-authenticate")).toContain("Bearer");
    expect(invalid.status).toBe(401);
    expect(empty.status).toBe(401);
  });
});


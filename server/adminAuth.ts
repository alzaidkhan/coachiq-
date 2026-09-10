import { timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

function configuredAdminKey() {
  return process.env.COACHIQ_ADMIN_ACCESS_KEY?.trim() ?? "";
}

export function hasValidAdminKey(candidate: unknown) {
  const expected = configuredAdminKey();
  if (!expected || typeof candidate !== "string") return false;
  const actualBuffer = Buffer.from(candidate);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const candidate = req.header("x-coachiq-admin-key");
  if (!hasValidAdminKey(candidate)) return res.status(401).json({ error: "Owner access is required." });
  return next();
}

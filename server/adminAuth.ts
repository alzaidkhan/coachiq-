import { createHash, timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

function configuredAdminKey(): string {
  return (
    process.env.COACHIQ_ADMIN_ACCESS_KEY?.trim() ||
    process.env.ADMIN_ACCESS_KEY?.trim() ||
    process.env.ADMIN_KEY?.trim() ||
    process.env.ADMIN_CODE?.trim() ||
    ""
  );
}

function sha256Digest(content: string): Buffer {
  return createHash("sha256").update(content, "utf8").digest();
}

/**
 * Constant-time comparison using fixed 32-byte SHA-256 digests.
 * This guarantees uniform execution time and eliminates timing side-channel attacks on key length.
 */
export function hasValidAdminKey(candidate: unknown): boolean {
  if (typeof candidate !== "string") return false;
  const trimmed = candidate.trim();
  if (!trimmed) return false;
  
  const expected = configuredAdminKey();
  if (!expected) return false;

  const candidateDigest = sha256Digest(trimmed);
  const expectedDigest = sha256Digest(expected);
  
  return timingSafeEqual(candidateDigest, expectedDigest);
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const candidate = req.header("x-coachiq-admin-key") || req.header("authorization")?.replace(/^Bearer\s+/i, "");
  
  if (!hasValidAdminKey(candidate)) {
    res.setHeader("WWW-Authenticate", 'Bearer realm="CoachIQ Owner Access"');
    return res.status(401).json({ error: "Owner access is required." });
  }
  
  return next();
}


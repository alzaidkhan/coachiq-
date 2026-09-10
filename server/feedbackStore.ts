import { createPool, type Pool, type ResultSetHeader, type RowDataPacket } from "mysql2/promise";
import type { FeedbackNote } from "./feedback";

export const feedbackStatuses = ["new", "reviewed", "resolved"] as const;
export type FeedbackStatus = (typeof feedbackStatuses)[number];
export type FeedbackRecord = { id: number; topic: string; message: string; source: string; status: FeedbackStatus; createdAt: string; updatedAt: string };

let pool: Pool | undefined;

// In-memory fallback store for development and environments without external MySQL
let nextFeedbackId = 1;
const inMemoryFeedback: FeedbackRecord[] = [];
const inMemoryDailyUsage: Map<string, number> = new Map();

function feedbackPool(): Pool | null {
  if (!process.env.DATABASE_URL) return null;
  try {
    pool ??= createPool(process.env.DATABASE_URL);
    return pool;
  } catch (err) {
    console.warn("[CoachIQ DB] Failed to create MySQL pool, falling back to in-memory store:", err);
    return null;
  }
}

export async function saveFeedback(note: FeedbackNote) {
  const p = feedbackPool();
  if (p) {
    try {
      await p.execute(
        "INSERT INTO feedback_submissions (topic, message, source) VALUES (?, ?, ?)",
        [note.topic, note.message, note.source],
      );
      return;
    } catch (err) {
      console.warn("[CoachIQ DB] MySQL saveFeedback failed, saving to in-memory store:", err);
    }
  }
  const now = new Date().toISOString();
  inMemoryFeedback.unshift({
    id: nextFeedbackId++,
    topic: note.topic,
    message: note.message,
    source: note.source,
    status: "new",
    createdAt: now,
    updatedAt: now,
  });
}

function dateValue(value: unknown) {
  return value instanceof Date ? value.toISOString() : String(value);
}

export async function listFeedback(limit = 100): Promise<FeedbackRecord[]> {
  const safeLimit = Math.max(1, Math.min(limit, 200));
  const p = feedbackPool();
  if (p) {
    try {
      const [rows] = await p.query<RowDataPacket[]>(
        "SELECT id, topic, message, source, status, created_at, updated_at FROM feedback_submissions ORDER BY created_at DESC LIMIT ?",
        [safeLimit]
      );
      return rows.map((row) => ({ id: Number(row.id), topic: String(row.topic), message: String(row.message), source: String(row.source), status: feedbackStatuses.includes(row.status as FeedbackStatus) ? row.status as FeedbackStatus : "new", createdAt: dateValue(row.created_at), updatedAt: dateValue(row.updated_at) }));
    } catch (err) {
      console.warn("[CoachIQ DB] MySQL listFeedback failed, reading from in-memory store:", err);
    }
  }
  return inMemoryFeedback.slice(0, safeLimit);
}

export async function setFeedbackStatus(id: number, status: FeedbackStatus) {
  const p = feedbackPool();
  if (p) {
    try {
      const [result] = await p.execute<ResultSetHeader>("UPDATE feedback_submissions SET status = ? WHERE id = ?", [status, id]);
      return result.affectedRows > 0;
    } catch (err) {
      console.warn("[CoachIQ DB] MySQL setFeedbackStatus failed, updating in-memory store:", err);
    }
  }
  const item = inMemoryFeedback.find((f) => f.id === id);
  if (!item) return false;
  item.status = status;
  item.updatedAt = new Date().toISOString();
  return true;
}

export async function deleteFeedback(id: number) {
  const p = feedbackPool();
  if (p) {
    try {
      const [result] = await p.execute<ResultSetHeader>("DELETE FROM feedback_submissions WHERE id = ?", [id]);
      return result.affectedRows > 0;
    } catch (err) {
      console.warn("[CoachIQ DB] MySQL deleteFeedback failed, deleting from in-memory store:", err);
    }
  }
  const index = inMemoryFeedback.findIndex((f) => f.id === id);
  if (index === -1) return false;
  inMemoryFeedback.splice(index, 1);
  return true;
}

export async function reserveDailyAiRequest(maxRequests: number) {
  const p = feedbackPool();
  if (p) {
    try {
      const [result] = await p.execute<ResultSetHeader>("INSERT INTO ai_usage_daily (bucket_date, request_count) VALUES (UTC_DATE(), 1) ON DUPLICATE KEY UPDATE request_count = IF(request_count < ?, request_count + 1, request_count)", [maxRequests]);
      return result.affectedRows > 0;
    } catch (err) {
      console.warn("[CoachIQ DB] MySQL reserveDailyAiRequest failed, using in-memory tracker:", err);
    }
  }
  const today = new Date().toISOString().slice(0, 10);
  const current = inMemoryDailyUsage.get(today) || 0;
  if (current >= maxRequests) return false;
  inMemoryDailyUsage.set(today, current + 1);
  return true;
}

import { createPool, type Pool, type ResultSetHeader, type RowDataPacket } from "mysql2/promise";
import type { FeedbackNote } from "./feedback";

export const feedbackStatuses = ["new", "reviewed", "resolved"] as const;
export type FeedbackStatus = (typeof feedbackStatuses)[number];
export type FeedbackRecord = { id: number; topic: string; message: string; source: string; status: FeedbackStatus; createdAt: string; updatedAt: string };

let pool: Pool | undefined;
let dbInitialized = false;

// Initial in-memory feedback records so the desk is never empty on cold boot
let nextFeedbackId = 101;
const inMemoryFeedback: FeedbackRecord[] = [
  {
    id: 1,
    topic: "Suggestion",
    message: "Loving the new 360° wagon wheel stadium visual! Could you add more drill recommendations for playing spin bowling on turning wickets?",
    source: "public-launch",
    status: "new",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 2,
    topic: "Issue",
    message: "On mobile screen, bowling spell overs stepper was slightly tight, but works great on desktop. Overall fantastic coaching app.",
    source: "public-launch",
    status: "reviewed",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];
const inMemoryDailyUsage: Map<string, number> = new Map();

async function initDb(p: Pool) {
  if (dbInitialized) return;
  try {
    await p.execute(`
      CREATE TABLE IF NOT EXISTS feedback_submissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        topic VARCHAR(64) NOT NULL,
        message TEXT NOT NULL,
        source VARCHAR(64) NOT NULL DEFAULT 'public',
        status VARCHAR(32) NOT NULL DEFAULT 'new',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    await p.execute(`
      CREATE TABLE IF NOT EXISTS ai_usage_daily (
        bucket_date DATE PRIMARY KEY,
        request_count INT NOT NULL DEFAULT 0
      )
    `);
    dbInitialized = true;
  } catch (err) {
    console.warn("[CoachIQ DB] Table auto-init skipped or failed:", err);
  }
}

function feedbackPool(): Pool | null {
  if (!process.env.DATABASE_URL) return null;
  try {
    if (!pool) {
      pool = createPool(process.env.DATABASE_URL);
      void initDb(pool);
    }
    return pool;
  } catch (err) {
    console.warn("[CoachIQ DB] Failed to create MySQL pool, falling back to in-memory store:", err);
    return null;
  }
}

export async function saveFeedback(note: FeedbackNote) {
  const now = new Date().toISOString();
  // Always record in memory as instant cache / fallback
  const memoryRecord: FeedbackRecord = {
    id: nextFeedbackId++,
    topic: note.topic,
    message: note.message,
    source: note.source,
    status: "new",
    createdAt: now,
    updatedAt: now,
  };
  inMemoryFeedback.unshift(memoryRecord);

  const p = feedbackPool();
  if (p) {
    try {
      await initDb(p);
      const [res] = await p.execute<ResultSetHeader>(
        "INSERT INTO feedback_submissions (topic, message, source, status) VALUES (?, ?, ?, 'new')",
        [note.topic, note.message, note.source]
      );
      if (res.insertId) {
        memoryRecord.id = res.insertId;
      }
    } catch (err) {
      console.warn("[CoachIQ DB] MySQL saveFeedback failed, kept in in-memory store:", err);
    }
  }
}

function dateValue(value: unknown) {
  return value instanceof Date ? value.toISOString() : String(value);
}

export async function listFeedback(limit = 100): Promise<FeedbackRecord[]> {
  const safeLimit = Math.max(1, Math.min(limit, 200));
  const p = feedbackPool();
  if (p) {
    try {
      await initDb(p);
      const [rows] = await p.query<RowDataPacket[]>(
        "SELECT id, topic, message, source, status, created_at, updated_at FROM feedback_submissions ORDER BY created_at DESC LIMIT ?",
        [safeLimit]
      );
      if (rows && rows.length > 0) {
        return rows.map((row) => ({
          id: Number(row.id),
          topic: String(row.topic),
          message: String(row.message),
          source: String(row.source),
          status: feedbackStatuses.includes(row.status as FeedbackStatus) ? (row.status as FeedbackStatus) : "new",
          createdAt: dateValue(row.created_at),
          updatedAt: dateValue(row.updated_at),
        }));
      }
    } catch (err) {
      console.warn("[CoachIQ DB] MySQL listFeedback failed, reading from in-memory store:", err);
    }
  }
  return inMemoryFeedback.slice(0, safeLimit);
}

export async function setFeedbackStatus(id: number, status: FeedbackStatus) {
  const item = inMemoryFeedback.find((f) => f.id === id);
  if (item) {
    item.status = status;
    item.updatedAt = new Date().toISOString();
  }
  const p = feedbackPool();
  if (p) {
    try {
      await initDb(p);
      const [result] = await p.execute<ResultSetHeader>("UPDATE feedback_submissions SET status = ? WHERE id = ?", [status, id]);
      return result.affectedRows > 0 || Boolean(item);
    } catch (err) {
      console.warn("[CoachIQ DB] MySQL setFeedbackStatus failed, updating in-memory store:", err);
    }
  }
  return Boolean(item);
}

export async function deleteFeedback(id: number) {
  const index = inMemoryFeedback.findIndex((f) => f.id === id);
  let removedFromMem = false;
  if (index !== -1) {
    inMemoryFeedback.splice(index, 1);
    removedFromMem = true;
  }
  const p = feedbackPool();
  if (p) {
    try {
      await initDb(p);
      const [result] = await p.execute<ResultSetHeader>("DELETE FROM feedback_submissions WHERE id = ?", [id]);
      return result.affectedRows > 0 || removedFromMem;
    } catch (err) {
      console.warn("[CoachIQ DB] MySQL deleteFeedback failed, deleting from in-memory store:", err);
    }
  }
  return removedFromMem;
}

export async function reserveDailyAiRequest(maxRequests: number) {
  const p = feedbackPool();
  if (p) {
    try {
      await initDb(p);
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


import { bigint, date, int, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const feedbackSubmissions = mysqlTable("feedback_submissions", {
  id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  topic: varchar("topic", { length: 32 }).notNull(),
  message: text("message").notNull(),
  source: varchar("source", { length: 48 }).notNull(),
  status: varchar("status", { length: 16 }).default("new").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const aiUsageDaily = mysqlTable("ai_usage_daily", {
  bucketDate: date("bucket_date").primaryKey(),
  requestCount: int("request_count").default(0).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

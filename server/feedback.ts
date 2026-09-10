export type FeedbackInput = { topic?: unknown; message?: unknown; source?: unknown };
export type FeedbackNote = { topic: string; message: string; source: string };

export function parseFeedback(input: FeedbackInput): FeedbackNote | null {
  const topic = typeof input.topic === "string" ? input.topic.trim().slice(0, 32) : "Other";
  const message = typeof input.message === "string" ? input.message.trim().slice(0, 1200) : "";
  const source = typeof input.source === "string" ? input.source.trim().slice(0, 48) : "public";
  if (message.length < 8) return null;
  return { topic: topic || "Other", message, source: source || "public" };
}

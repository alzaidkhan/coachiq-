import { describe, expect, it } from "vitest";
import {
  addMessageToSession,
  clearSessionMessages,
  createNewSession,
  deleteChatSession,
  formatSessionTitle,
  loadChatStore,
  saveChatStore,
} from "./coachChatStore";

describe("coachChatStore", () => {
  it("creates a new session with formatted title", () => {
    const session = createNewSession("How do I improve my cover drive timing?");
    expect(session.id).toBeDefined();
    expect(session.title).toBe("How do I improve my cover drive timing?");
    expect(session.messages).toEqual([]);
  });

  it("truncates long prompt titles gracefully", () => {
    const longPrompt = "This is a very long cricket coaching question about how to bowl inswing at pace on subcontinental pitches in test matches";
    const title = formatSessionTitle(longPrompt);
    expect(title.length).toBeLessThanOrEqual(40);
    expect(title.endsWith("…")).toBe(true);
  });

  it("appends messages and updates session title on first message", () => {
    const session = createNewSession();
    const { sessions, updatedSession } = addMessageToSession([session], session.id, {
      role: "user",
      text: "What length should I bowl in powerplay?",
    });

    expect(updatedSession.messages.length).toBe(1);
    expect(updatedSession.messages[0].text).toBe("What length should I bowl in powerplay?");
    expect(updatedSession.title).toBe("What length should I bowl in powerplay?");

    const second = addMessageToSession(sessions, session.id, {
      role: "coach",
      text: "Target top of off stump on a good length.",
    });

    expect(second.updatedSession.messages.length).toBe(2);
    expect(second.updatedSession.title).toBe("What length should I bowl in powerplay?");
  });

  it("deletes a session and provides fallback active ID", () => {
    const s1 = createNewSession("Session 1");
    const s2 = createNewSession("Session 2");

    const result = deleteChatSession([s1, s2], s1.id);
    expect(result.sessions.length).toBe(1);
    expect(result.nextActiveId).toBe(s2.id);

    const emptyResult = deleteChatSession([s2], s2.id);
    expect(emptyResult.sessions.length).toBe(1);
    expect(emptyResult.nextActiveId).toBe(emptyResult.sessions[0].id);
  });

  it("clears messages in a session", () => {
    const session = createNewSession("Session");
    session.messages.push({
      id: "m1",
      role: "user",
      text: "Test",
      timestamp: Date.now(),
    });

    const cleared = clearSessionMessages([session], session.id);
    expect(cleared[0].messages).toEqual([]);
  });
});

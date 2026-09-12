// CoachIQ persistent AI coach chat store: manages persistent chat sessions, history, and active thread state.

export type ChatMessage = {
  id: string;
  role: "user" | "coach";
  text: string;
  timestamp: number;
};

export type ChatSession = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
};

export type CoachChatStore = {
  sessions: ChatSession[];
  activeSessionId: string;
};

export const CHAT_STORAGE_KEY = "coachiq_ai_coach_sessions_v1";
export const ACTIVE_SESSION_STORAGE_KEY = "coachiq_ai_coach_active_session_id_v1";

export function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function generateMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createNewSession(firstPrompt?: string): ChatSession {
  const now = Date.now();
  const title = firstPrompt ? formatSessionTitle(firstPrompt) : "New Consultation";
  return {
    id: generateSessionId(),
    title,
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
}

export function formatSessionTitle(prompt: string): string {
  const clean = prompt.trim().replace(/^["']|["']$/g, "");
  if (!clean) return "Cricket Discussion";
  if (clean.length <= 40) return clean;
  return `${clean.slice(0, 37).trim()}…`;
}

export function loadChatStore(storage?: Storage | null): CoachChatStore {
  const targetStorage = storage ?? (typeof window !== "undefined" ? window.localStorage : null);
  if (!targetStorage) {
    const defaultSession = createNewSession();
    return { sessions: [defaultSession], activeSessionId: defaultSession.id };
  }

  try {
    const rawSessions = targetStorage.getItem(CHAT_STORAGE_KEY);
    const rawActiveId = targetStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);

    let parsedSessions: ChatSession[] = [];
    if (rawSessions) {
      const parsed = JSON.parse(rawSessions);
      if (Array.isArray(parsed)) {
        parsedSessions = parsed.filter((item): item is ChatSession => {
          return (
            Boolean(item) &&
            typeof item === "object" &&
            typeof item.id === "string" &&
            typeof item.title === "string" &&
            Array.isArray(item.messages)
          );
        });
      }
    }

    if (parsedSessions.length === 0) {
      const initial = createNewSession();
      parsedSessions = [initial];
    }

    let activeId = rawActiveId;
    if (!activeId || !parsedSessions.some((s) => s.id === activeId)) {
      activeId = parsedSessions[0].id;
    }

    return {
      sessions: parsedSessions,
      activeSessionId: activeId,
    };
  } catch {
    const fallback = createNewSession();
    return { sessions: [fallback], activeSessionId: fallback.id };
  }
}

export function saveChatStore(store: CoachChatStore, storage?: Storage | null): boolean {
  const targetStorage = storage ?? (typeof window !== "undefined" ? window.localStorage : null);
  if (!targetStorage) return false;

  try {
    targetStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(store.sessions));
    targetStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, store.activeSessionId);
    return true;
  } catch {
    return false;
  }
}

export function addMessageToSession(
  sessions: ChatSession[],
  sessionId: string,
  message: { role: "user" | "coach"; text: string }
): { sessions: ChatSession[]; updatedSession: ChatSession } {
  const now = Date.now();
  const newMessage: ChatMessage = {
    id: generateMessageId(),
    role: message.role,
    text: message.text,
    timestamp: now,
  };

  let targetFound = false;
  const updatedSessions = sessions.map((session) => {
    if (session.id !== sessionId) return session;
    targetFound = true;
    const isFirstUserMessage = session.messages.length === 0 && message.role === "user";
    const title = isFirstUserMessage ? formatSessionTitle(message.text) : session.title;

    return {
      ...session,
      title: session.title === "New Consultation" || isFirstUserMessage ? title : session.title,
      updatedAt: now,
      messages: [...session.messages, newMessage],
    };
  });

  if (!targetFound) {
    const newSession: ChatSession = {
      id: sessionId,
      title: formatSessionTitle(message.text),
      createdAt: now,
      updatedAt: now,
      messages: [newMessage],
    };
    return {
      sessions: [newSession, ...sessions],
      updatedSession: newSession,
    };
  }

  const updatedSession = updatedSessions.find((s) => s.id === sessionId)!;
  return {
    sessions: updatedSessions,
    updatedSession,
  };
}

export function deleteChatSession(
  sessions: ChatSession[],
  sessionIdToDelete: string
): { sessions: ChatSession[]; nextActiveId: string } {
  const remaining = sessions.filter((s) => s.id !== sessionIdToDelete);
  if (remaining.length === 0) {
    const fresh = createNewSession();
    return {
      sessions: [fresh],
      nextActiveId: fresh.id,
    };
  }

  return {
    sessions: remaining,
    nextActiveId: remaining[0].id,
  };
}

export function clearSessionMessages(sessions: ChatSession[], sessionId: string): ChatSession[] {
  return sessions.map((session) => {
    if (session.id !== sessionId) return session;
    return {
      ...session,
      updatedAt: Date.now(),
      messages: [],
    };
  });
}

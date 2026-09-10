export const COACHIQ_DATA_KEY = "coachiq-data";
export const COACHIQ_DATA_VERSION = 1;

export type CoachIQEnvelope = {
  version: number;
  updatedAt: string;
  profile: Record<string, unknown>;
  activity: Record<string, unknown>;
  schedule: Record<string, unknown>;
};

export type CoachIQReadResult = { data: CoachIQEnvelope; migrated: boolean; available: boolean };
export type CoachIQWriteResult = { envelope: CoachIQEnvelope; stored: boolean };

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function parse(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    return record(JSON.parse(raw));
  } catch {
    return {};
  }
}

function getItem(storage: Storage | null | undefined, key: string) {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function isAvailable(storage: Storage | null | undefined) {
  if (!storage) return false;
  try {
    storage.getItem(COACHIQ_DATA_KEY);
    return true;
  } catch {
    return false;
  }
}

export function getBrowserStorage() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readCoachIQData(storage: Storage | null | undefined): CoachIQReadResult {
  const available = isAvailable(storage);
  const current = parse(getItem(storage, COACHIQ_DATA_KEY));
  if (current.version === COACHIQ_DATA_VERSION) {
    return {
      data: {
        version: COACHIQ_DATA_VERSION,
        updatedAt: typeof current.updatedAt === "string" ? current.updatedAt : new Date().toISOString(),
        profile: record(current.profile),
        activity: record(current.activity),
        schedule: record(current.schedule),
      },
      migrated: false,
      available,
    };
  }

  const legacyProfile = getItem(storage, "coachiq-profile");
  const legacyActivity = getItem(storage, "coachiq-activity");
  const legacySchedule = getItem(storage, "coachiq-schedule");
  return {
    data: {
      version: COACHIQ_DATA_VERSION,
      updatedAt: new Date().toISOString(),
      profile: parse(legacyProfile),
      activity: parse(legacyActivity),
      schedule: parse(legacySchedule),
    },
    migrated: Boolean(legacyProfile || legacyActivity || legacySchedule),
    available,
  };
}

export function writeCoachIQData(storage: Storage | null | undefined, data: Pick<CoachIQEnvelope, "profile" | "activity" | "schedule">): CoachIQWriteResult {
  const envelope: CoachIQEnvelope = { version: COACHIQ_DATA_VERSION, updatedAt: new Date().toISOString(), ...data };
  try {
    if (!storage) return { envelope, stored: false };
    storage.setItem(COACHIQ_DATA_KEY, JSON.stringify(envelope));
    storage.removeItem("coachiq-profile");
    storage.removeItem("coachiq-activity");
    storage.removeItem("coachiq-schedule");
    return { envelope, stored: true };
  } catch {
    return { envelope, stored: false };
  }
}

export function parseImportedCoachIQData(raw: string): CoachIQEnvelope | null {
  const candidate = parse(raw);
  if (candidate.version !== COACHIQ_DATA_VERSION) return null;
  const updatedAt = typeof candidate.updatedAt === "string" ? candidate.updatedAt : new Date().toISOString();
  return { version: COACHIQ_DATA_VERSION, updatedAt, profile: record(candidate.profile), activity: record(candidate.activity), schedule: record(candidate.schedule) };
}

export function clearCoachIQData(storage: Storage | null | undefined) {
  try {
    if (!storage) return false;
    [COACHIQ_DATA_KEY, "coachiq-profile", "coachiq-activity", "coachiq-schedule"].forEach((key) => storage.removeItem(key));
    return true;
  } catch {
    return false;
  }
}

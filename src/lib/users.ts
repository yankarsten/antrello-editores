// The name doubles as the login credential, so it needs a canonical form:
// people type their own name inconsistently ("marina duarte", "Marina  Duarte")
// and none of those variations should be a different account — or fail to log
// in. `nameKey` is what the unique index and every lookup use; `name` keeps the
// capitalization the admin typed, for display.
export function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export const NAME_MAX_LENGTH = 60;
export const PASSWORD_MIN_LENGTH = 6;

// Returns the cleaned-up display name, or null when the input is unusable.
export function cleanName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const name = raw.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > NAME_MAX_LENGTH) return null;
  return name;
}

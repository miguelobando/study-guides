import type { Session, SessionConfig } from '../types';

const SESSION_KEY = 'nodejs-interview:session:v1';
const CONFIG_KEY = 'nodejs-interview:config:v1';

// Storage can be unavailable (private mode, blocked site data) or full; the app must keep working.
function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore: persistence is a convenience, not a requirement
  }
}

function isSession(value: unknown): value is Session {
  if (!value || typeof value !== 'object') return false;
  const s = value as Partial<Session>;
  return (
    typeof s.id === 'string' &&
    Array.isArray(s.questionIds) &&
    typeof s.currentIndex === 'number' &&
    typeof s.answers === 'object' &&
    s.answers !== null &&
    typeof s.config === 'object'
  );
}

export function loadSession(): Session | null {
  const value = read<unknown>(SESSION_KEY);
  return isSession(value) ? value : null;
}

export function saveSession(session: Session): void {
  write(SESSION_KEY, session);
}

export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

export function loadConfig(): Partial<SessionConfig> | null {
  return read<Partial<SessionConfig>>(CONFIG_KEY);
}

export function saveConfig(config: SessionConfig): void {
  write(CONFIG_KEY, config);
}

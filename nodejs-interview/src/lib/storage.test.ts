import { describe, expect, it, vi } from 'vitest';
import { QUESTIONS } from '../data';
import { createSession, DEFAULT_CONFIG } from './session';
import { clearSession, loadConfig, loadSession, saveConfig, saveSession } from './storage';

describe('storage', () => {
  it('round-trips a session', () => {
    const s = createSession({ ...DEFAULT_CONFIG, count: 3 }, QUESTIONS);
    saveSession(s);
    expect(loadSession()).toEqual(s);
    clearSession();
    expect(loadSession()).toBeNull();
  });

  it('ignores corrupted or foreign data', () => {
    localStorage.setItem('nodejs-interview:session:v1', '{not json');
    expect(loadSession()).toBeNull();
    localStorage.setItem('nodejs-interview:session:v1', JSON.stringify({ hello: 'world' }));
    expect(loadSession()).toBeNull();
  });

  it('round-trips the last used config', () => {
    saveConfig({ ...DEFAULT_CONFIG, count: 10 });
    expect(loadConfig()).toMatchObject({ count: 10 });
  });

  it('does not throw when storage is unavailable', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError');
    });
    expect(() => saveSession(createSession(DEFAULT_CONFIG, QUESTIONS))).not.toThrow();
    spy.mockRestore();
  });
});

import { applyAway, migrate, newGame, tick, type GameState } from '@ledger/engine';
import { useEffect, useState } from 'preact/hooks';
import { restartClock } from './persist/backup.ts';
import { webStorage, type Storage } from './persist/storage.ts';

/** The game state, owned by the engine; screens read it and call `act`. */
let state: GameState = newGame(Date.now());
let storage: Storage = webStorage;
let version = 0;
const listeners = new Set<() => void>();
let saveTimer: ReturnType<typeof setTimeout> | null = null;

export function game(): GameState {
  return state;
}

function notify(): void {
  version++;
  for (const listener of listeners) listener();
}

/** Re-renders the component on every tick and action. */
export function useGame(): GameState {
  const [, setVersion] = useState(version);
  useEffect(() => {
    const listener = (): void => setVersion(version);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return state;
}

export function save(): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = null;
  storage.save(JSON.stringify(state));
}

function saveSoon(): void {
  saveTimer ??= setTimeout(save, 400);
}

/** Runs an engine action, re-renders and saves. */
export function act<T>(fn: (s: GameState) => T): T {
  const result = fn(state);
  notify();
  saveSoon();
  return result;
}

export function eraseSave(): void {
  storage.erase();
  state = newGame(Date.now());
  notify();
  save();
}

/**
 * Replaces the game with one from a backup code, keeping this device's Gold Edition, and saves
 * it at once.
 */
export function restoreGame(next: GameState): void {
  next.meta.gold = state.meta.gold;
  // The player may have looked at the preview for a while: the game starts from now.
  restartClock(next, Date.now());
  state = next;
  catchUp();
  notify();
  save();
}

/** Brings the game up to now: a normal tick, or an absence with its receipt. */
function catchUp(): void {
  const now = Date.now();
  if (now - state.lastTick >= 60_000) applyAway(state, now);
  else tick(state, now);
}

export function boot(custom?: Storage): void {
  if (custom) storage = custom;
  const text = storage.load();
  let loaded = !text;
  if (text) {
    try {
      const migrated = migrate(JSON.parse(text), Date.now());
      if (migrated) {
        state = migrated;
        loaded = true;
      }
    } catch {
      // A broken save: start anew, but leave it in place until the first action.
    }
  }
  catchUp();
  notify();
  if (loaded) save();

  let last = 0;
  const loop = (time: number): void => {
    if (time - last >= 100) {
      last = time;
      catchUp();
      notify();
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  setInterval(save, 5000);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) save();
    else {
      catchUp();
      notify();
    }
  });
  window.addEventListener('pagehide', save);
}

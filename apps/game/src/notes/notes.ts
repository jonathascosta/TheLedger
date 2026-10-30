import { hire, type GameState } from '@ledger/engine';
import { t } from '../i18n/index.ts';
import { platform } from '../platform/index.ts';
import { act, game } from '../store.ts';
import { notes, reconcile, shouldAsk, type Note, type Permission } from './schedule.ts';

/** What the app needs of the device's notifications (iOS only; none on the website). */
export interface NotesApi {
  /** Asks iOS for permission; true when granted. */
  request(): Promise<boolean>;
  schedule(
    notes: readonly { id: number; at: number; title: string; body: string }[],
  ): Promise<void>;
  /** Removes pending and delivered notes. */
  clear(): Promise<void>;
  /** What iOS allows now: the player can change it in the iPhone's Settings at any time. */
  check(): Promise<Permission>;
}

const IDS: Record<Note['kind'], number> = { receipt: 1, sponsorship: 2, tills: 3 };

/** Hires a manager (Classifieds or a business's page), then asks for permission if it is time. */
export function hireAndAsk(business: number): void {
  if (act((s) => hire(s, business)).ok) void askIfDue();
}

/** Brings the setting in line with what iOS allows now (a switch changed in the iPhone's Settings). */
async function sync(api: NotesApi): Promise<void> {
  const permission = await api.check().catch(() => null);
  if (permission === null) return;
  const next = reconcile(game().settings.notes, permission);
  if (next !== game().settings.notes) act((s) => (s.settings.notes = next));
}

/** Asks for permission if it is time (a hire, or a launch with a manager, never asked). */
export async function askIfDue(): Promise<void> {
  const api = platform().notes;
  if (!api || !shouldAsk(game())) return;
  const granted = await api.request().catch(() => false);
  act((s: GameState) => (s.settings.notes = granted ? 'on' : 'denied'));
}

/** The Settings switch: on asks iOS (again) if needed; off stops the notes. */
export async function setNotes(on: boolean): Promise<void> {
  const api = platform().notes;
  if (!api) return;
  if (!on) {
    act((s) => (s.settings.notes = 'off'));
    await api.clear().catch(() => undefined);
    return;
  }
  const granted = await api.request().catch(() => false);
  act((s) => (s.settings.notes = granted ? 'on' : 'denied'));
}

/** Schedules on hide, clears on show (docs/PRODUCT.md, Away from the game). */
export function initNotes(): void {
  const api = platform().notes;
  if (!api) return;
  // Clearing waits for a schedule still in flight, so a quick hide and show leaves no note.
  let pending: Promise<unknown> = Promise.resolve();
  const clear = (): void => {
    pending = pending.then(() => api.clear()).catch(() => undefined);
  };
  clear();
  void sync(api).then(() => askIfDue());
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      clear();
      void sync(api);
      return;
    }
    const state = game();
    if (state.settings.notes !== 'on') return;
    const list = notes(state, Date.now()).map((n) => ({
      id: IDS[n.kind],
      at: n.at,
      title: t(`notes.${n.kind}.title`),
      body: t(`notes.${n.kind}.body`),
    }));
    pending = pending.then(() => api.schedule(list)).catch(() => undefined);
  });
}

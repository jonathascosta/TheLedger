import { BUSINESSES, cycleOf, parkRate, rentRate, type GameState } from '@ledger/engine';

/** Notes from the night shift (docs/PRODUCT.md, Away from the game). */
export type NoteKind = 'receipt' | 'sponsorship' | 'tills';

export interface Note {
  kind: NoteKind;
  /** When it shows (ms, device clock). */
  at: number;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
/** An absence stops counting after this long. */
export const RECEIPT_FULL_MS = 12 * HOUR;
/** The quiet hours: none from 22:00 to 8:00, device time. */
export const QUIET_FROM = 22;
export const QUIET_UNTIL = 8;

/** Whether anything earns while away: a manager, rents, bonds or parks. */
function earnsAway(state: GameState): boolean {
  const v = state.volume;
  return (
    v.managers.some((m) => m !== null) || rentRate(state) > 0 || v.bonds > 0 || parkRate(state) > 0
  );
}

/** When every open business without a manager has a till waiting (ms from now), or null. */
function tillsFullIn(state: GameState): number | null {
  const v = state.volume;
  let latest: number | null = null;
  for (let i = 0; i < BUSINESSES.length; i++) {
    const b = v.businesses[i]!;
    if (b.level === 0 || v.managers[i]) continue;
    const wait = b.till > 0 ? 0 : Math.max(0, cycleOf(state, i).seconds - b.progress) * 1000;
    latest = Math.max(latest ?? 0, wait);
  }
  return latest;
}

/** Moves a time out of the quiet hours, to 8:00 (device time). */
export function outOfQuiet(at: number): number {
  const d = new Date(at);
  const hour = d.getHours();
  if (hour >= QUIET_UNTIL && hour < QUIET_FROM) return at;
  const morning = new Date(at);
  if (hour >= QUIET_FROM) morning.setDate(morning.getDate() + 1);
  morning.setHours(QUIET_UNTIL, 0, 0, 0);
  return morning.getTime();
}

/**
 * The notes to leave when the game goes to the background at `now`, in order. Each note due
 * less than an hour after the one before moves to an hour after it; one in the quiet hours moves
 * to 8:00.
 */
export function notes(state: GameState, now: number): Note[] {
  const list: Note[] = [];
  if (earnsAway(state)) list.push({ kind: 'receipt', at: now + RECEIPT_FULL_MS });
  const sponsorEnds = state.sponsors.sponsoredUntil;
  if (sponsorEnds - now >= 10 * MINUTE) list.push({ kind: 'sponsorship', at: sponsorEnds });
  const tills = tillsFullIn(state);
  if (tills !== null && tills >= 5 * MINUTE) list.push({ kind: 'tills', at: now + tills });
  list.sort((a, b) => a.at - b.at);
  let previous = -Infinity;
  for (const note of list) {
    note.at = outOfQuiet(Math.max(note.at, previous + HOUR));
    previous = note.at;
  }
  return list;
}

/** Whether to ask for permission now: at a hire, or at a launch with a manager, if never asked. */
export function shouldAsk(state: GameState): boolean {
  return state.settings.notes === 'unasked' && state.volume.managers.some((m) => m !== null);
}

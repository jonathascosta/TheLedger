import { useEffect, useState } from 'preact/hooks';
import { platform } from './platform/index.ts';
import { game } from './store.ts';

/**
 * The app's side of the sponsors (docs/PRODUCT.md, Sponsors): whether they are offered, the
 * device's date that keys the engine's daily limits, and watching an ad. The engine grants the
 * reward; the screens call it only when `watch` resolves true.
 */

/** The device's local date, `YYYY-MM-DD`. */
export function today(now = Date.now()): string {
  const d = new Date(now);
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Whether sponsors are offered: on iPhone, or anywhere with the Gold Edition. */
export function sponsorsOffered(): boolean {
  return platform().ads.available || game().meta.gold;
}

/** With the Gold Edition a sponsor is granted with a tap, no ad (docs/PRODUCT.md). */
export function noAds(): boolean {
  return game().meta.gold;
}

export type WatchOutcome = 'earned' | 'skipped' | 'none';

let notice: WatchOutcome | null = null;
/** True while a sponsor's ad loads or plays: one at a time, and the alternatives wait. */
let watching = false;
const listeners = new Set<() => void>();

function changed(): void {
  for (const listener of listeners) listener();
}

function announce(outcome: WatchOutcome | null): void {
  notice = outcome;
  changed();
}

/**
 * Plays a sponsor's ad: 'earned' when watched to the end, 'skipped' when closed early, 'none'
 * when there was no ad. While one plays, another call answers null at once (a double tap).
 */
export async function watch(): Promise<WatchOutcome | null> {
  if (watching) return null;
  if (noAds()) return 'earned';
  watching = true;
  changed();
  let outcome: WatchOutcome;
  try {
    outcome = (await platform().ads.showRewarded()) ? 'earned' : 'skipped';
  } catch {
    outcome = 'none';
  } finally {
    watching = false;
    changed();
  }
  if (outcome !== 'earned') announce(outcome);
  return outcome;
}

function useChanges(): void {
  const [, setTick] = useState(0);
  useEffect(() => {
    const listener = (): void => setTick((n) => n + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
}

/** Whether a sponsor's ad is loading or playing (the alternatives are disabled meanwhile). */
export function useWatching(): boolean {
  useChanges();
  return watching;
}

/** The last ad that gave nothing, for the notice; it clears itself. */
export function useSponsorNotice(): WatchOutcome | null {
  useChanges();
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => announce(null), 2600);
    return () => clearTimeout(timer);
  }, [notice]);
  return notice;
}

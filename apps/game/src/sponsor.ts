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
const listeners = new Set<() => void>();

function announce(outcome: WatchOutcome | null): void {
  notice = outcome;
  for (const listener of listeners) listener();
}

/** Plays a sponsor's ad: 'earned' when watched to the end, 'skipped' or 'none' otherwise. */
export async function watch(): Promise<WatchOutcome> {
  if (noAds()) return 'earned';
  let outcome: WatchOutcome;
  try {
    outcome = (await platform().ads.showRewarded()) ? 'earned' : 'skipped';
  } catch {
    outcome = 'none';
  }
  if (outcome !== 'earned') announce(outcome);
  return outcome;
}

/** The last ad that gave nothing, for the notice; it clears itself. */
export function useSponsorNotice(): WatchOutcome | null {
  const [, setTick] = useState(0);
  useEffect(() => {
    const listener = (): void => setTick((n) => n + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => announce(null), 2600);
    return () => clearTimeout(timer);
  }, [notice]);
  return notice;
}

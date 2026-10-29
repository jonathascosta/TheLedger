import { useEffect, useState } from 'preact/hooks';

export type Tab = 'ledger' | 'market' | 'portfolio' | 'achievements';

export type Route =
  | { name: 'ledger' }
  | { name: 'desk' }
  | { name: 'business'; index: number }
  | { name: 'upgrades' }
  | { name: 'classifieds' }
  | { name: 'gazette' }
  | { name: 'market'; kind: 'stock' | 'commodity' | 'coin' }
  | { name: 'instrument'; id: string }
  | { name: 'portfolio' }
  | { name: 'bonds' }
  | { name: 'estate' }
  | { name: 'startups' }
  | { name: 'art' }
  | { name: 'energy' }
  | { name: 'achievements' }
  | { name: 'close' }
  | { name: 'partners' }
  | { name: 'shelf' }
  | { name: 'settings' };

const ROOT: Record<Tab, Route> = {
  ledger: { name: 'ledger' },
  market: { name: 'market', kind: 'stock' },
  portfolio: { name: 'portfolio' },
  achievements: { name: 'achievements' },
};

let tab: Tab = 'ledger';
let stack: Route[] = [ROOT.ledger];
const listeners = new Set<() => void>();

function changed(): void {
  for (const l of listeners) l();
}

export function current(): Route {
  return stack[stack.length - 1]!;
}

export function currentTab(): Tab {
  return tab;
}

export function go(route: Route): void {
  stack = [...stack, route];
  changed();
}

/** Replaces the top of the stack (switching between market kinds, for example). */
export function replace(route: Route): void {
  stack = [...stack.slice(0, -1), route];
  changed();
}

export function back(): void {
  if (stack.length > 1) stack = stack.slice(0, -1);
  changed();
}

export function canGoBack(): boolean {
  return stack.length > 1;
}

export function switchTab(next: Tab): void {
  tab = next;
  stack = [ROOT[next]];
  changed();
}

export function useRoute(): Route {
  const [, set] = useState(0);
  useEffect(() => {
    const l = (): void => set((n) => n + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return current();
}

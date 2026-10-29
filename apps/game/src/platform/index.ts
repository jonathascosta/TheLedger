import { Capacitor } from '@capacitor/core';
import { webStorage, type Storage } from '../persist/storage.ts';

/** What differs between the website and the iPhone app. */
export interface Platform {
  storage: Storage;
  /** A light tap of the haptic engine (a stamp, a purchase). */
  tap(): void;
}

const web: Platform = { storage: webStorage, tap: () => undefined };

let current: Platform = web;

export function platform(): Platform {
  return current;
}

/** Loads the native platform on iOS; the website keeps the web one. */
export async function initPlatform(): Promise<Platform> {
  if (Capacitor.isNativePlatform()) {
    const native = await import('./native.ts');
    current = await native.createNativePlatform();
  }
  return current;
}

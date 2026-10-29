/** Where the save lives: `localStorage` on the web (Capacitor Preferences on iOS, later). */
export interface Storage {
  load(): string | null;
  save(text: string): void;
  erase(): void;
}

const KEY = 'theledger.save';

export const webStorage: Storage = {
  load() {
    try {
      return localStorage.getItem(KEY);
    } catch {
      return null;
    }
  },
  save(text) {
    try {
      localStorage.setItem(KEY, text);
    } catch {
      // Private mode or a full disk: the game goes on unsaved.
    }
  },
  erase() {
    try {
      localStorage.removeItem(KEY);
    } catch {
      // Nothing to erase.
    }
  },
};

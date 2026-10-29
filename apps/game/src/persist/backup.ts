import { migrate, netWorth, SAVE_VERSION, type GameState } from '@ledger/engine';
import { hmacSha256, sha256 } from './sha256.ts';

/**
 * The backup code (docs/PRODUCT.md, Saving; docs/ARCHITECTURE.md, Backup code): one line of text
 * that holds the game, `LEDGER1.<body>.<signature>`. The body is the save without the histories
 * the game rebuilds and without the Gold Edition, scrambled; the signature is an HMAC-SHA-256 of
 * the prefix and the body. The key ships with the app, so the signature stops casual edits only.
 */

/** The code format's version; a newer one is refused as 'version'. */
export const BACKUP_FORMAT = 1;
const PREFIX = `LEDGER${BACKUP_FORMAT}.`;
const KEY = utf8('The Ledger · backup code · a signature against casual edits');

/** Why a code was refused. */
export type BackupError =
  /** Not a backup code at all. */
  | 'format'
  /** Changed by hand, or cut short. */
  | 'signature'
  /** Made by a newer version of the game. */
  | 'version'
  /** Signed, but its save does not load. */
  | 'broken';

export type Decoded =
  { ok: true; state: GameState; madeAt: number } | { ok: false; error: BackupError };

interface Payload {
  /** When the code was made (ms since the epoch). */
  made: number;
  save: unknown;
}

function utf8(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

/** A keystream as long as the text, from the key: SHA-256(key ‖ block counter). */
function scramble(bytes: Uint8Array): Uint8Array {
  const out = new Uint8Array(bytes.length);
  const seed = new Uint8Array(KEY.length + 4);
  seed.set(KEY);
  const counter = new DataView(seed.buffer, KEY.length, 4);
  for (let block = 0; block * 32 < bytes.length; block++) {
    counter.setUint32(0, block);
    const stream = sha256(seed);
    for (let i = 0; i < 32 && block * 32 + i < bytes.length; i++) {
      const at = block * 32 + i;
      out[at] = bytes[at]! ^ stream[i]!;
    }
  }
  return out;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

function toBase64Url(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const n = (bytes[i]! << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
    const chars = Math.min(4, Math.ceil(((bytes.length - i) * 8) / 6));
    for (let c = 0; c < chars; c++) out += ALPHABET.charAt((n >>> (18 - c * 6)) & 63);
  }
  return out;
}

/** Null when the text is not base64url (without padding). */
function fromBase64Url(text: string): Uint8Array | null {
  if (text.length % 4 === 1) return null;
  const out = new Uint8Array(Math.floor((text.length * 6) / 8));
  let bits = 0;
  let value = 0;
  let at = 0;
  for (const char of text) {
    const digit = ALPHABET.indexOf(char);
    if (digit < 0) return null;
    value = ((value << 6) | digit) & 0xffffff;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[at++] = (value >>> bits) & 0xff;
    }
  }
  return out;
}

function sign(signed: string): string {
  return toBase64Url(hmacSha256(KEY, utf8(signed)));
}

/** The game as one line of text, made at `now`. */
export function encodeBackup(state: GameState, now: number): string {
  const save = JSON.parse(JSON.stringify(state)) as GameState;
  // Rebuilt on restore: the price histories and the net-worth history.
  const volume = save.volume as Partial<GameState['volume']>;
  delete volume.history;
  delete (save.volume.market as Partial<GameState['volume']['market']>).history;
  // The Gold Edition belongs to the device.
  delete (save.meta as Partial<GameState['meta']>).gold;
  const payload: Payload = { made: now, save };
  const body = PREFIX + toBase64Url(scramble(utf8(JSON.stringify(payload))));
  return `${body}.${sign(body)}`;
}

/** Reads a code pasted by the player; spaces and line breaks a mail client added are ignored. */
export function decodeBackup(text: string, now: number = Date.now()): Decoded {
  const code = text.replace(/\s+/g, '');
  const head = /^LEDGER(\d+)\./.exec(code);
  if (!head) return { ok: false, error: 'format' };
  if (Number(head[1]) !== BACKUP_FORMAT)
    return { ok: false, error: Number(head[1]) > BACKUP_FORMAT ? 'version' : 'format' };
  const dot = code.lastIndexOf('.');
  const body = code.slice(0, dot);
  if (body.length <= PREFIX.length || sign(body) !== code.slice(dot + 1))
    return { ok: false, error: 'signature' };
  const bytes = fromBase64Url(body.slice(PREFIX.length));
  if (!bytes) return { ok: false, error: 'broken' };
  let payload: Payload;
  try {
    payload = JSON.parse(
      new TextDecoder('utf-8', { fatal: true }).decode(scramble(bytes)),
    ) as Payload;
  } catch {
    return { ok: false, error: 'broken' };
  }
  const save = payload.save as Partial<GameState> | null;
  if (typeof payload.made !== 'number' || typeof save !== 'object' || save === null)
    return { ok: false, error: 'broken' };
  if (typeof save.version === 'number' && save.version > SAVE_VERSION)
    return { ok: false, error: 'version' };
  const state = migrate(save, now);
  if (!state || typeof state.volume.market !== 'object') return { ok: false, error: 'broken' };
  // Not in the code: the device's own Gold Edition comes back with the restore.
  state.meta.gold = false;
  const market = state.volume.market;
  market.history = Object.fromEntries(
    Object.entries(market.prices).map(([id, price]) => [id, [price]]),
  );
  state.volume.history = [netWorth(state)];
  restartClock(state, now);
  return { ok: true, state, madeAt: payload.made };
}

/**
 * A restored game goes on from `now`: the time since the code was made earns nothing (the same
 * hours went on earning on the device it came from), so there is no absence to receipt. The
 * market and the paper restart from now, as after an absence; an uncollected receipt that was
 * already in the save stays.
 */
export function restartClock(state: GameState, now: number): void {
  const v = state.volume;
  state.lastTick = now;
  v.lastSampleAt = now;
  v.market.nextAt = Math.max(v.market.nextAt, now);
  v.paper.nextAt = Math.max(v.paper.nextAt, now + 30_000);
}

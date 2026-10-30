import {
  EDITION_SECONDS,
  MARKET_TICK_SECONDS,
  applyAway,
  migrate,
  netWorth,
  restartGolden,
  restartMatchDays,
  SAVE_VERSION,
  tick,
  type GameState,
} from '@ledger/engine';
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
  return sealBackup({ made: now, save });
}

/** Scrambles and signs any payload; exported for the tests, which forge malformed codes. */
export function sealBackup(payload: unknown): string {
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
  // Past the signature the code came from the app, or from someone with its key: whatever it
  // holds, a save that does not load is 'broken', never an exception.
  try {
    return unpack(body.slice(PREFIX.length), now);
  } catch {
    return { ok: false, error: 'broken' };
  }
}

function isRecord(value: unknown): boolean {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function unpack(scrambled: string, now: number): Decoded {
  const bytes = fromBase64Url(scrambled);
  if (!bytes) return { ok: false, error: 'broken' };
  const payload = JSON.parse(
    new TextDecoder('utf-8', { fatal: true }).decode(scramble(bytes)),
  ) as Partial<Payload> | null;
  if (typeof payload !== 'object' || payload === null) return { ok: false, error: 'broken' };
  const save = payload.save as Partial<GameState> | null | undefined;
  if (typeof payload.made !== 'number' || typeof save !== 'object' || save === null)
    return { ok: false, error: 'broken' };
  if (!isRecord(save.volume) || !isRecord(save.meta)) return { ok: false, error: 'broken' };
  if (typeof save.version === 'number' && save.version > SAVE_VERSION)
    return { ok: false, error: 'version' };
  const state = migrate(save, now);
  const market = state?.volume.market as GameState['volume']['market'] | null | undefined;
  if (!state || typeof market !== 'object' || market === null)
    return { ok: false, error: 'broken' };
  // Not in the code: the device's own Gold Edition comes back with the restore.
  state.meta.gold = false;
  // Announced on the device the code came from.
  state.fresh = [];
  market.history = Object.fromEntries(
    Object.entries(market.prices).map(([id, price]) => [id, [price]]),
  );
  state.volume.history = [netWorth(state)];
  restartClock(state, now);
  // A game that loads but would stop the engine (a forged field of the wrong shape) is refused:
  // a minute of play and an hour away on copies must run. JSON copies: iOS 15.0 has no
  // structuredClone.
  const copy = (): GameState => JSON.parse(JSON.stringify(state)) as GameState;
  tick(copy(), now + 60_000);
  applyAway(copy(), now + 3600_000);
  return { ok: true, state, madeAt: payload.made };
}

/**
 * A restored game goes on from `now`: the time since the code was made earns nothing (the same
 * hours went on earning on the device it came from), so there is no absence to receipt. The
 * market, the paper and the golden invoice restart from now, as after an absence; an uncollected
 * receipt that was already in the save stays.
 */
export function restartClock(state: GameState, now: number): void {
  const v = state.volume;
  state.lastTick = now;
  v.lastSampleAt = now;
  // Clamped both ways: a device whose clock ran ahead must not freeze the market or the paper.
  v.market.nextAt = Math.min(Math.max(v.market.nextAt, now), now + MARKET_TICK_SECONDS * 1000);
  v.paper.nextAt = Math.min(Math.max(v.paper.nextAt, now + 30_000), now + EDITION_SECONDS * 1000);
  restartGolden(state, now);
  restartMatchDays(state, now);
}

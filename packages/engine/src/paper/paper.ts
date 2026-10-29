import { CHOICES, EDITION_SECONDS, EVENTS, type ChoiceId, type EventDef } from '../data/events.ts';
import { earn, OK, type ActionResult } from '../economy/economy.ts';
import { applyShocks } from '../market/market.ts';
import { createRng } from '../rng/rng.ts';
import type { GameState } from '../state/state.ts';

export function eventOf(state: GameState): EventDef | null {
  const id = state.volume.paper.event;
  return EVENTS.find((e) => e.id === id) ?? null;
}

/** The event of an edition: the first is always the satellite, then a seeded draw. */
function drawEvent(state: GameState, edition: number): EventDef {
  if (edition === 1) return EVENTS[0]!;
  const rng = createRng(state.volume.seed).fork('paper').fork(String(edition));
  return rng.pick(EVENTS);
}

/** Whether the bold coupon of the current edition wins (seeded; the Insider partner peeks). */
export function boldWins(state: GameState): boolean {
  return outcomeWins(state, 'bold');
}

function outcomeWins(state: GameState, choice: Exclude<ChoiceId, 'hold'>): boolean {
  const rng = createRng(state.volume.seed)
    .fork('paper')
    .fork(String(state.volume.paper.edition))
    .fork(choice);
  return rng.next() < CHOICES[choice].pWin;
}

/** Brings out a new edition when one is due; its shocks hit the market at once. */
export function advancePaper(state: GameState, now: number): boolean {
  const paper = state.volume.paper;
  if (now < paper.nextAt) return false;
  paper.edition += 1;
  const event = drawEvent(state, paper.edition);
  paper.event = event.id;
  paper.answer = null;
  paper.unread = true;
  paper.nextAt = now + EDITION_SECONDS * 1000;
  applyShocks(state, event.shocks);
  return true;
}

export interface AnswerResult {
  ok: boolean;
  delta: number;
  /** Held steady in a crash. */
  steady: boolean;
}

export function answer(state: GameState, choice: ChoiceId): AnswerResult {
  const paper = state.volume.paper;
  if (!paper.event || paper.answer) return { ok: false, delta: 0, steady: false };
  let delta = 0;
  if (choice !== 'hold') {
    const c = CHOICES[choice];
    const stake = state.volume.cash * c.stake;
    const factor = outcomeWins(state, choice) ? c.win : c.lose;
    delta = stake * (factor - 1);
    if (delta > 0) earn(state, delta);
    else state.volume.cash = Math.max(0, state.volume.cash + delta);
  }
  paper.answer = { choice, delta };
  paper.unread = false;
  state.meta.editionsAnswered += 1;
  return { ok: true, delta, steady: choice === 'hold' && eventOf(state)?.crash === true };
}

export function markRead(state: GameState): ActionResult {
  state.volume.paper.unread = false;
  return OK;
}

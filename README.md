# The Ledger: Business Simulator

An idle business game where the whole game is your accounting notebook. Stamp invoices at the
front desk, open businesses, hire managers from the newspaper's classifieds, and grow a
portfolio of stocks, real estate, bonds, startups, commodities, art and crypto. Charts are drawn
in ink as they happen, purchases are stuck in as stickers, achievements are rubber stamps and wax
seals. When growth slows, close the volume, earn goodwill, and start the next one faster.

It runs in the browser and, wrapped with Capacitor, on iPhone: one code base for both.

## Documents

| Document                                       | What it says                                       |
| :--------------------------------------------- | :------------------------------------------------- |
| [`docs/PRODUCT.md`](docs/PRODUCT.md)           | What we are building and why                       |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | How the code is put together                       |
| [`docs/PLAN.md`](docs/PLAN.md)                 | What comes next, task by task, and what done means |

## Status

| Area                                              | State                                                                                         |
| :------------------------------------------------ | :-------------------------------------------------------------------------------------------- |
| [`packages/engine`](packages/engine/src/index.ts) | Seeded RNG; the economy comes next                                                            |
| `apps/game`                                       | Not started: the web app, then iOS                                                            |
| CI                                                | Lint, format, typecheck, unit tests, build; Playwright end to end; the iOS build; the website |

## Quick start

You need Node 20.19+ or 22.13+ (22 LTS is recommended; `nvm use` reads [`.nvmrc`](.nvmrc)) and
pnpm, which Corepack provides at the version pinned in `package.json`.

```sh
corepack enable
pnpm install
pnpm dev   # the game at http://localhost:5173
```

| Command                                        | What it does                                                                                    |
| :--------------------------------------------- | :---------------------------------------------------------------------------------------------- |
| `pnpm test`                                    | Unit tests for every package (seconds)                                                          |
| `pnpm lint` · `pnpm format` · `pnpm typecheck` | Type-aware ESLint, Prettier, and `tsc` everywhere                                               |
| `pnpm test:e2e`                                | Playwright on the production build: the first session, every tab, an absence (phone, EN and PT) |
| `pnpm build`                                   | Builds every package                                                                            |

A Husky pre-commit hook runs `lint`, `format:check`, `typecheck` and `test`.

## Rules of the code

- **Deterministic.** Every random draw goes through a seeded `Rng`
  ([`packages/engine/src/rng`](packages/engine/src/rng/rng.ts)); `Math.random` fails lint. A day's
  market, a newspaper event or a manager's face is the same on every phone and replayable in tests.
- **Pure engine.** `packages/engine` has no dependencies and no DOM. It runs in the app, in Node
  for tests and the balance simulator, and on a server if one ever exists. The UI never decides
  outcomes.

## Licence

Copyright © Jonathas Costa. All rights reserved.

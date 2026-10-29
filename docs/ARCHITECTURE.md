# Architecture

How the repository is put together and why. [PRODUCT.md](PRODUCT.md) says what we are building.

## Goals and constraints

- **One code base, two platforms.** A Vite web app that is also the iPhone app, wrapped with
  Capacitor. The web build never loads native plugins.
- **Pure, deterministic engine.** `packages/engine` has no dependencies and no DOM, and never
  reads the clock: the app passes the time in. Every random draw goes through a seeded `Rng`, so a
  volume's market, its newspaper and its candidates are replayable in tests.
- **The UI never decides outcomes.** Screens call engine actions and render engine state.
- **Testable in the cloud.** Everything but the iOS build runs on Linux.

## Packages

| Package           | Role                                                                 | May import |
| :---------------- | :------------------------------------------------------------------- | :--------- |
| `packages/engine` | Game state, economy, market, events, achievements, prestige, formats | Nothing    |
| `apps/game`       | The Preact app: screens, art, input, strings, persistence, platform  | engine     |

Workspace packages export their TypeScript sources (`"exports": "./src/index.ts"`).

## Engine

### State

`GameState` is one plain, JSON-serialisable object: the save. It holds the current volume
(cash, businesses, managers, upgrades, holdings, market prices and history, the paper, the
desk), the meta progress that survives a reset (goodwill, partners, achievements, the shelf,
lifetime earnings) and a save version.

Actions are functions `(state, …args) => result` that **mutate** the state they are given and
return what happened (for example `{ ok: false, reason: 'cash' }`). Mutation keeps a 10 Hz tick
cheap; the app treats the state as owned by the engine and re-renders after each action or tick.

### Time

- `tick(state, nowMs)` advances everything from `state.lastTick` to `nowMs`: business cycles
  (closed form for cycles shorter than the step), market ticks (every 5 s of game time), the
  paper's schedule, startups maturing, unlocks and achievements.
- `applyAway(state, nowMs)` handles a long absence (over a minute): it computes the offline
  earnings as a receipt, advances the market (capped at 12 hours) and returns the receipt for
  the app to show. `collectAway` adds it.

### Module map

| Module          | Contents                                                                                                                                            |
| :-------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rng/`          | `createRng(seed)`: xoshiro128\*\* from a string hash, `fork(label)`                                                                                 |
| `format/`       | Money and number formatting in English and Portuguese, long and short forms                                                                         |
| `data/`         | Static tables: businesses, upgrades, managers' names and traits, stocks, coins, commodities, properties, art, parks, events, achievements, partners |
| `state/`        | `GameState`, `newGame`, `newVolume`, save version and migration                                                                                     |
| `economy/`      | Level costs, buying (×1/×10/×100/Max), cycles and tills, milestones, multipliers, income per second, net worth                                      |
| `desk/`         | Stamps, invoices, combo                                                                                                                             |
| `managers/`     | Candidates (seeded from the volume), hiring                                                                                                         |
| `market/`       | Price walks, shocks, buying and selling stocks, commodities and coins                                                                               |
| `assets/`       | Bonds, real estate, startups, art, energy                                                                                                           |
| `paper/`        | Editions, events, choices and their seeded outcomes                                                                                                 |
| `achievements/` | Predicates over the state, checked on tick and after actions                                                                                        |
| `prestige/`     | Goodwill, closing the volume, partners, the shelf                                                                                                   |
| `away/`         | Offline receipt                                                                                                                                     |
| `game.ts`       | `tick`, `applyAway`, and the public actions                                                                                                         |

### Numbers

Plain `number` (doubles) for now: enough to 10^308, past the decillions the product names. A
mantissa-and-exponent type comes later (PRODUCT.md, Later) behind the same `format` functions.

### Seeds

Each volume has its own seed (`vol:<n>:<started-at>`), so worlds differ between players and volumes but each one replays exactly. Market tick `k` draws from
`fork('market').fork(k)`; edition `e` of the paper from `fork('paper').fork(e)`; candidates from
`fork('managers')`; startups and auctions likewise. The same volume replays the same world.

## App

`apps/game`: Vite, Preact with TSX (chosen over vanilla DOM because the game has many screens
that re-render at 10 Hz), CSS with custom properties.

| Folder          | Contents                                                                                                                                                                                                |
| :-------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/main.tsx`  | Boot: load the save, apply the absence, start the loop, mount the app                                                                                                                                   |
| `src/store.ts`  | The game state, the loop (`requestAnimationFrame`, a tick at most 10 times a second), autosave, a version signal for re-rendering                                                                       |
| `src/screens/`  | Ledger, Desk, Business, Upgrades, Market (stocks, commodities, crypto), Portfolio and the class pages, Achievements, Gazette and Classifieds, Away receipt, Close the volume, Partners, Shelf, Settings |
| `src/art/`      | SVG pieces: stickers and doodles, ink charts, the donut, stamps and seals, covers, the city map, portraits                                                                                              |
| `src/i18n/`     | `en.ts` and `pt.ts`, one key set; `t(key, params)`; the language follows the device and Settings                                                                                                        |
| `src/persist/`  | `Storage` interface: `localStorage` on the web, Capacitor Preferences on iOS                                                                                                                            |
| `src/theme.css` | Every colour, font and size as a custom property                                                                                                                                                        |

Art is drawn with inline SVG and CSS. The paper grain is one small noise texture made once at
start; heavy SVG filters are kept to static pieces, so the 10 Hz render stays cheap on a phone.

### Routing

A small in-memory router (a screen name and parameters, with a back stack); the index tabs
switch between the four roots.

## Website

`pnpm build` produces `apps/game/dist`, which the `Website` workflow publishes to GitHub Pages
from `main` (the owner sets Settings › Pages › Source to "GitHub Actions" once).

## iOS

Capacitor wraps `apps/game/dist` in `apps/game/ios` (Swift Package Manager, no CocoaPods). The
iOS build runs on macOS only; `pnpm ios:sync` builds the app and copies it into the Xcode
project.

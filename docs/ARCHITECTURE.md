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
desk, the golden invoice's schedule, the headhunter's count and star), the meta progress that
survives a reset (goodwill, partners, achievements, the shelf, lifetime earnings, the Gold
Edition flag), the sponsors' timers and daily counts (also kept across volumes) and a save
version. A save without a newer field loads with its default (`migrate` fills it from a new
game), so adding a field needs no version bump.

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
| `away/`         | Offline receipt, the audit (Collect ×2)                                                                                                             |
| `sponsors/`     | Sponsor rewards: overtime, the golden invoice (take, then pay), the sponsorship, the headhunter, daily limits keyed by the date the app passes in   |
| `game.ts`       | `tick`, `applyAway`, and the public actions                                                                                                         |

### Sponsors

The engine knows nothing of ads or the store. When the app has a reward (an ad watched, or a tap
with the Gold Edition) it calls the reward's action with the time and the device's date
(`YYYY-MM-DD`), which keys the daily limits. The multipliers live where they apply: the
sponsorship and the Gold Edition in `profitPerCycle` (so stamps, the golden invoice and the
receipt's business lines follow), overtime in `stamp`, the star's weight on each trait, the
closing bonus in `closeVolume` (added to the goodwill held, not to the goodwill claimed). The
app ticks the game to now before granting a reward, so time spent watching the ad is not paid at
the new rate. `tick` moves `lastTick` second by second, so a sponsorship that ends inside a tick
doubles only the seconds before its end; the bond cap leaves the sponsorship out.

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
iOS build runs on macOS only (the `iOS` workflow builds it for the simulator, unsigned);
`pnpm ios:sync` builds the app and copies it into the Xcode project.

`src/platform/` hides what differs: on the website the save lives in `localStorage`; in the app
`platform/native.ts` (loaded only there, with a dynamic import) keeps it in Capacitor
Preferences, taps the haptic engine on each stamp and styles the status bar.

### Sponsors in the app

`src/ads/` holds the ads layer, ported from Arrows (rewarded ads only):

- `AdProvider` (`ads.ts`): `available` and `showRewarded()`, which resolves with whether the
  reward was earned and rejects when no ad could be shown.
- `AdMobAds` (`admob.ts`, iOS): keeps the next ad loaded, reloads one older than 55 minutes, waits
  up to 6 s for one still loading, tries a failed load once more.
- `AdConsent` (`consent.ts`): Google's consent form where the law asks for one, then Apple's
  tracking prompt, then the SDK starts; nothing loads before. The plugin carries a patch
  (`patches/`) so its forms can show before the SDK starts; `consent.test.ts` fails without it,
  so an upgrade of `@capacitor-community/admob` must carry it over.
- `DebugAds` (`debug.ts`): the test card on the website with `?ads=test`, for the end-to-end
  tests. Without it the website gets `NO_ADS` and shows no sponsor; only `platform/native.ts`
  imports AdMob (`bundle.test.ts` checks it).

`src/sponsor.ts` gives the screens `sponsorsOffered()`, `today()` (the device's date for the
engine's daily limits) and `watch()`; `ui/Sponsor.tsx` is the clipping, `ui/Golden.tsx` the golden
invoice and its choice. A reward goes through `grant` in the store, which brings the game up to
now before the engine's action. The owner's ad unit comes in at build time
(`VITE_ADMOB_REWARDED_ID`) and the AdMob app id through the `ADMOB_APP_ID` build setting; both are
Google's test ids until then (docs/STORE.md).

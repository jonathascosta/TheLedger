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
| `src/persist/`  | `Storage` interface: `localStorage` on the web, Capacitor Preferences on iOS; the backup code                                                                                                           |
| `src/theme.css` | Every colour, font and size as a custom property                                                                                                                                                        |

Art is drawn with inline SVG and CSS. The paper grain is one small noise texture made once at
start; heavy SVG filters are kept to static pieces, so the 10 Hz render stays cheap on a phone.

### Backup code

`src/persist/backup.ts` turns the save into one line of text and back (PRODUCT.md, Saving):
`LEDGER1.<body>.<signature>`.

- `LEDGER1.` names the format; a code with a newer number is refused as "newer version".
- The body is `{"made": <ms>, "save": <GameState>}` as JSON, without what the game rebuilds (the
  price histories `volume.market.history` and the net-worth history `volume.history`) and without
  the Gold Edition (`meta.gold`, which belongs to the device). Its UTF-8 bytes are XORed with a
  keystream (SHA-256 of the key and a block counter) and written in base64url, so it is not
  readable JSON.
- The signature is HMAC-SHA-256 of `LEDGER1.<body>`, in base64url. The hash is plain TypeScript
  (`src/persist/sha256.ts`), synchronous, because the iOS 15 web view may lack WebCrypto.
- Decoding ignores white space, checks the prefix, then the signature (a changed or cut code fails
  here), unscrambles, refuses a save version newer than `SAVE_VERSION`, runs the engine's
  `migrate`, and starts the histories again from the current prices and net worth.
- The clock restarts at the restore (`restartClock`): `lastTick`, the net-worth sample, the
  market's and the paper's `nextAt` move to now, as after an absence, so the time since the code
  was made earns no receipt (those hours earned on the other device). An uncollected receipt
  already in the save stays. The store then keeps this device's `meta.gold` and saves.

The key is a constant in the app, so anyone with the app's code can sign a code: the signature
stops casual edits, not a determined player.

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

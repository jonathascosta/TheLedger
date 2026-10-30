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

| Module          | Contents                                                                                                                                                                      |
| :-------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rng/`          | `createRng(seed)`: xoshiro128\*\* from a string hash, `fork(label)`                                                                                                           |
| `format/`       | Money and number formatting in English and Portuguese, long and short forms                                                                                                   |
| `data/`         | Static tables: businesses, upgrades (with the special orders), managers' names and traits, stocks, coins, commodities, properties, art, parks, events, achievements, partners |
| `state/`        | `GameState`, `newGame`, `newVolume`, save version and migration                                                                                                               |
| `economy/`      | Level costs, buying (×1/×10/×100/Max), cycles and tills, milestones, multipliers, income per second, net worth                                                                |
| `desk/`         | Stamps, invoices, combo                                                                                                                                                       |
| `managers/`     | Candidates (seeded from the volume), hiring                                                                                                                                   |
| `market/`       | Price walks, shocks, buying and selling stocks, commodities and coins                                                                                                         |
| `assets/`       | Bonds, real estate, startups, art, energy                                                                                                                                     |
| `clubs/`        | Sports clubs: seeded strengths, match days in play (restarting after an absence), prizes, values, buying at value and selling at 90%                                          |
| `paper/`        | Editions, events, choices and their seeded outcomes                                                                                                                           |
| `achievements/` | Predicates over the state, checked on tick and after actions                                                                                                                  |
| `prestige/`     | Goodwill, closing the volume, partners, the shelf                                                                                                                             |
| `dynasty/`      | Retiring to an heir: the era, legacy, the family's names (PRODUCT.md, The dynasty)                                                                                            |
| `away/`         | Offline receipt, the audit (Collect ×2)                                                                                                                                       |
| `sponsors/`     | Sponsor rewards: overtime, the golden invoice (take, then pay), the sponsorship, the headhunter, daily limits keyed by the date the app passes in                             |
| `sim/`          | The simulated player and the balance bands (PRODUCT.md, Balance), run by `pnpm test:calibration`                                                                              |
| `game.ts`       | `tick`, `applyAway`, and the public actions                                                                                                                                   |

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

### The dynasty

`meta.era` and `meta.legacy` hold the dynasty; `retire` collects the receipt, closes the volume
(no closing sponsor), earns legacy from the era's claimed goodwill and opens Vol. I of the next
era. Legacy is its own factor in `profitPerCycle`. The family's surname comes from the game's
start (`family:<createdAt>`) and each era's first name from its fork, so names replay. The app
sets `data-era` on the root (1 to 4, `eraStyle`), and `theme.css` redefines the paper, rules,
margin and ink for each era; `app.css` adds the 1980s bars and the 2010s graph lines.

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
- Once the signature holds, anything that does not load (a forged payload included) is refused as
  "broken"; decoding never throws.
- The clock restarts at the restore (`restartClock`): `lastTick` and the net-worth sample move to
  now, the market's and the paper's `nextAt` are clamped to within one tick and one edition of
  now (a device whose clock ran ahead must not freeze them), and the golden invoice restarts as
  after an absence. So the time since the code was made earns no receipt (those hours earned on
  the other device). An uncollected receipt already in the save stays; achievements waiting to be
  announced (`fresh`) are dropped. The store then keeps this device's `meta.gold` and saves.

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
  imports AdMob (`bundle.test.ts` checks the sources, and an end-to-end test that the built entry
  script holds none of it).

`src/sponsor.ts` gives the screens `sponsorsOffered()`, `today()` (the device's date for the
engine's daily limits) and `watch()`; `ui/Sponsor.tsx` is the clipping, `ui/Golden.tsx` the golden
invoice and its choice. One ad plays at a time: while it loads or plays, `useWatching()` disables
the alternatives (Take, Collect, Seal without a sponsor) and a second tap does nothing. A reward
goes through `grant` in the store, which ticks the game up to now (as play, never as an absence)
before the engine's action. The closing sponsor's ad closed early seals without the bonus; the
seal runs once. The owner's ad unit comes in at build time
(`VITE_ADMOB_REWARDED_ID`) and the AdMob app id through the `ADMOB_APP_ID` build setting; both are
Google's test ids until then (docs/STORE.md).

### Notes from the night shift

`src/notes/schedule.ts` is pure: `notes(state, now)` gives the notes to leave (the receipt full
after 12 hours when something earns away, the sponsorship's end, the tills full), an hour apart
and out of the quiet hours (22:00 to 8:00, device time); `shouldAsk` says when to ask for
permission. `src/notes/notes.ts` asks at a hire or at a launch with a manager, schedules when
the page is hidden (only with `settings.notes` on) and removes pending and delivered notes when it
shows again. On iOS `platform/native.ts` drives `@capacitor/local-notifications`; the website has
none (`platform().notes` is null).

### The Gold Edition

`src/gold/gold.ts` holds the rules over a `GoldStore` (price, buy, owned, restore): buying sets
`meta.gold` only when the store says it was bought; at launch `confirmAtLaunch` asks the store
and removes the flag only on a definite no (a refund), never when the store does not answer
(`owned` is null). `src/gold/native.ts` is the App Store through `@capgo/native-purchases`
(StoreKit 2, Swift Package Manager, iOS 15): ownership is the current entitlements without a
revocation date. Those are read on the device: with no Apple ID signed in, or another one, they
are empty and the flag goes, until Restore purchases with the right account. A purchase waiting
for approval (Ask to Buy) arrives at the next launch. A launch check that answers after a
purchase or a restore is ignored. A save holding the flag starts no ads at launch (no consent
form, no tracking prompt, no SDK), and erasing the game keeps the flag. The website has no store
(`platform().gold` is null). With the flag,
`sponsor.ts` grants every sponsor at once (`noAds`) and offers sponsors on any platform.

# Plan

The work, in tasks that each become one pull request. [PRODUCT.md](PRODUCT.md) says what we
build, [ARCHITECTURE.md](ARCHITECTURE.md) how. The owner's priority for the first release is a
**playable, complete game**: tests are written where they protect the economy, and skipped where
they would only slow the release down.

## How a task runs

1. A branch `claude/<task-id>-<short-name>` from `main`.
2. Done means: the task's criteria are met, `pnpm lint`, `pnpm format:check`, `pnpm typecheck`,
   `pnpm test` and `pnpm build` pass, the pull request is open against `main` with the criteria
   and how each was checked, CI is green, and the isolated reviewer has approved it.
3. The reviewer is a separate agent in its own worktree with no session context. Fix what it
   finds, ask again, repeat until it approves; record the rounds in one comment; merge.
4. Then the next open task, from the updated `main`.

## Tasks

### T1. Documents — done

`PRODUCT.md`, `ARCHITECTURE.md`, this plan.

### T2. Engine: the economy — done

- Formats (EN and PT, long and short), the data tables (businesses, upgrades, managers, desk),
  `GameState`, `newGame`, saves with a version.
- Businesses: buying with the multiplier, cycles, tills, collecting, milestones, multipliers,
  income per second. Managers: candidates and hiring. Upgrades. The desk: stamps, invoices,
  combo. `tick` and the absence receipt.
- Tests: costs and buying, cycles over a long tick equal many short ticks, milestones, the
  receipt, formats.

### T3. Engine: investments, the paper, achievements, prestige — done

- Stocks, commodities, coins (seeded walks, shocks, buy and sell), bonds, real estate, startups,
  art, energy; unlocks by peak net worth; net worth.
- The paper: editions every 4 minutes, events, choices with seeded outcomes.
- Achievements; goodwill, closing the volume, partners, the shelf.
- Tests: determinism of the market for a seed, goodwill formula, a reset keeps what it should.

### T4. App: the ledger playable in the browser — done (with T5)

- `apps/game` scaffold (Vite, Preact, fonts, theme), store and loop, persistence, the index
  tabs, English and Portuguese strings.
- Screens: Ledger (net worth, ink chart, businesses with tills and buy buttons), Front desk,
  Business page (sketch, upgrades, manager), Upgrades page (all upgrades, ledger and desk ones
  included), Classifieds, Away receipt, Settings.
- CI builds the app.

### T5. App: investments, paper, achievements, prestige — done (with T4)

- Market (stocks, commodities, crypto) with ink charts and stamp buttons; Portfolio with the
  pencil donut and the class pages (bonds, the city map, startups, art, energy).
- The Gazette with the event and its coupons; achievements page and the stamp that announces a
  new one; closing the volume (ceremony), Partners, the Shelf, the covers.

### T6. Website — done

- The `Website` workflow publishes `apps/game/dist` to GitHub Pages; the game works offline once
  loaded (fonts bundled). A smoke test in a real browser of the first session's steps.

### T7. iOS wrapper — done

- Capacitor config, `apps/game/ios` (Swift Package Manager), Preferences storage on iOS, safe
  areas, status bar, `pnpm ios:sync`, an `iOS` workflow building on macOS.

### T8. Playtest polish — done

A new player's first minutes at 375 px, in Portuguese and English: business rows that keep one
line where they can, ledger cards that say what they count ("2 on offer", "3 applicants"), the
manager hint before the collect hint once three businesses are open, the locked market showing
how far the player is from opening it, the portfolio's wording.

### T9. End-to-end test in CI — done

Playwright on the production build, phone profile: the first session (stamp, open the café,
collect, buy) and a tour of every tab, in CI on every pull request, with the Chromium that cloud
sessions already have.

### T10. Engine: sponsor rewards and the Gold Edition's effects

PRODUCT.md, Sponsors and The Gold Edition, in the engine, with no ad or store in sight: the app
calls an action once a reward is earned.

- Overtime, the golden invoice (its schedule drawn from the volume's seed, its plain and sponsored
  pay), the audit, the sponsorship (banked hours, its share of an absence), the headhunter (new
  candidates and the star, whose trait counts twice), the closing sponsor.
- Daily counts keyed by the device's date, which the app passes in.
- The Gold Edition as a flag in the save's meta: ×3 business profit.
- Tests: each reward's value and limit, the sponsorship across an absence, the star's trait,
  the golden invoice's schedule replays for a seed, an old save migrates.

### T11. App: sponsors on iPhone

- The ads layer from Arrows (`AdProvider`, AdMob on iOS loading ahead, consent and tracking
  prompt, the AdMob patch), rewarded only; nothing on the website.
- The SPONSORED clippings for each offer, the golden invoice on the desk and the ledger page,
  Collect ×2 on the receipt, the closing sponsor in the ceremony. The development build has a test
  card instead of the SDK, for the end-to-end tests.
- `docs/STORE.md`: what the owner sets up in AdMob (app and ad unit ids, the consent form).

### T12. App: the Gold Edition

- The non-consumable purchase through StoreKit (a Capacitor plugin), Restore purchases, the
  flag kept in the save and confirmed by the store at launch; sponsors granted with a tap; the
  gold ribbon.
- `docs/STORE.md`: the in-app purchase to create in App Store Connect.

### T13. App: the backup code

- Settings: copy the backup code; restore from a code with a preview and a confirmation.
- The code: a prefix and version, the save scrambled and signed (HMAC with a key in the app), so
  a hand-edited or truncated code is refused. Tests: a round trip, a changed character, a cut code,
  a code from a newer version.

### Later

Everything in PRODUCT.md, Later: the dynasty, special editions, more classes, rules on post-its,
Game Center, cloud saves, ads on the website, more purchases, haptics, notifications, the big-number type, the
balance simulator.

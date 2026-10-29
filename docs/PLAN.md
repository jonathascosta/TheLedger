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

### T4. App: the ledger playable in the browser

- `apps/game` scaffold (Vite, Preact, fonts, theme), store and loop, persistence, the index
  tabs, English and Portuguese strings.
- Screens: Ledger (net worth, ink chart, businesses with tills and buy buttons), Front desk,
  Business page (sketch, upgrades, manager), Upgrades page (all upgrades, ledger and desk ones
  included), Classifieds, Away receipt, Settings.
- CI builds the app.

### T5. App: investments, paper, achievements, prestige

- Market (stocks, commodities, crypto) with ink charts and stamp buttons; Portfolio with the
  pencil donut and the class pages (bonds, the city map, startups, art, energy).
- The Gazette with the event and its coupons; achievements page and the stamp that announces a
  new one; closing the volume (ceremony), Partners, the Shelf, the covers.

### T6. Website

- The `Website` workflow publishes `apps/game/dist` to GitHub Pages; the game works offline once
  loaded (fonts bundled). A smoke test in a real browser of the first session's steps.

### T7. iOS wrapper

- Capacitor config, `apps/game/ios` (Swift Package Manager), Preferences storage on iOS, safe
  areas, status bar, `pnpm ios:sync`, an `iOS` workflow building on macOS.

### Later

Everything in PRODUCT.md, Later: the dynasty, special editions, more classes, rules on post-its,
Game Center, cloud saves, ads, purchases, haptics, notifications, the big-number type, the
balance simulator.

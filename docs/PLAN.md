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

### T10. Engine: sponsor rewards and the Gold Edition's effects — done

PRODUCT.md, Sponsors and The Gold Edition, in the engine, with no ad or store in sight: the app
calls an action once a reward is earned.

- New state: the sponsors' timers and daily counts (kept across volumes), the golden invoice's
  schedule, the headhunter's count and star (in the volume), the Gold flag (in the meta). Old
  saves load with the defaults.
- Overtime, the golden invoice (taken by the tap, paid plain or sponsored once the ad ends), the
  audit, the sponsorship (banked, its share of an absence), the headhunter, the closing sponsor;
  daily counts keyed by the device's date, which the app passes in.
- Done: tests for each reward's value and limit, the sponsorship across an absence, the star's traits,
  the golden invoice's schedule replays for a seed, the closing bonus leaves later claims alone,
  an old save loads.

### T11. App: sponsors on iPhone — done

- The ads layer, ported from Arrows to this app (Arrows' is plain DOM, this one is Preact):
  `AdProvider` with rewarded ads only, AdMob on iOS (loading ahead), the consent form and the
  tracking prompt, the AdMob patch and its unit test. The website gets none, except the test card
  when opened with `?ads=test`, for the end-to-end tests.
- The SPONSORED clippings for each offer, the golden invoice on the desk and the ledger page,
  Collect ×2 on the receipt, the closing sponsor in the ceremony.
- Create `docs/STORE.md` with what the owner sets up in AdMob (app and ad unit ids, the consent
  form); ARCHITECTURE.md describes the layer.
- Done: an end-to-end test watches the test card for overtime, the audit and the sponsorship and
  checks each reward, and closes it early to check nothing is given; a test checks the website
  build has no AdMob code; the iOS workflow builds.

### T12. App: the Gold Edition — done

- The non-consumable purchase through StoreKit with a Capacitor 8 plugin that supports Swift
  Package Manager (`@capgo/native-purchases` or similar), Restore purchases, the flag kept in the
  save and confirmed at launch (PRODUCT.md), sponsors granted with a tap, the gold ribbon.
- `docs/STORE.md`: the in-app purchase to create in App Store Connect; ARCHITECTURE.md: the store.
- Done: unit tests with a fake store (buy, restore, launch offline keeps the flag, a refund
  removes it); the iOS workflow builds.

### T13. App: the backup code — done

- Settings: copy the backup code; restore from a code pasted into a text field, with a preview and
  a confirmation.
- The code: a prefix and version, the save without the histories, scrambled and signed with a
  small synchronous HMAC-SHA-256 in the app (not WebCrypto, which the iOS web view may lack), so a
  hand-edited or truncated code is refused. ARCHITECTURE.md describes the format.
- Done: unit tests for a round trip, a changed character, a cut code and a code from a newer
  version; an end-to-end test copies a code and restores it in a fresh page.

### T14. Engine: the balance simulator — done

- A simulated player in the engine (`sim/`), playing as PRODUCT.md, Balance says; deterministic.
- `pnpm test:calibration`: a separate Vitest project for `*.calibration.test.ts`, which `pnpm test`
  (and so the pre-commit hook) leaves out; a CI job runs it; CLAUDE.md lists the command.
- Done: the bands pass on main; the simulation replays; a deliberately broken economy (a billion
  at the start) fails them.

### T15. The dynasty — done

- Engine: era and legacy in the save (old saves are era I with no legacy), the family's surname
  and the heirs' names, Retire (closes the volume first, then what is kept and what starts
  again), the legacy factor on business profit, the shelf entries' era, _Heir_.
- App: Retire on the Partners page (no closing sponsor) with the ceremony, the note on the
  shelf, the shelf grouped by era, the eras' paper and ink as theme variables chosen by the era,
  the header from era II, the era in the backup preview.
- Done: engine tests (the threshold counting the pending claim, the legacy formula, what is kept,
  the factor, an old save as era I, a backup code carrying era and legacy); an end-to-end test
  retiring a seeded save and seeing era II's paper.

### T16. Notes from the night shift (iPhone) — done

- A pure schedule (`notes(state, now)`): the three notes, quiet hours and the hour between notes;
  `@capacitor/local-notifications` on iOS, scheduling on hide and removing pending and delivered
  notes on show; the permission at a hire or at the first launch with a manager; the Settings
  switch. None on the website. ARCHITECTURE.md describes the layer.
- Done: unit tests of the schedule (each note, quiet hours, the spacing chain, none without a
  reason) and of when permission is asked (new and existing players); the iOS workflow builds.

### T17. Sports clubs — done

- Engine: the clubs class (data, seeded strengths, match days in play and their restart after an
  absence, prizes, value moves, buying at value and selling at 90%, net worth, _Chairman_). App:
  the Clubs page (crests, stars, the W/D/L row), the Portfolio entry (ten classes).
- Done: engine tests (unlock, a match day replays for a seed, prize and value bounds, average
  earnings within 15% of half a park's over 10,000 seeded match days, no profit from buying and
  selling back); an end-to-end test buying a club.

### T18. Post-its

- A post-it with each investment's rule on its page, folded away per class and kept in the
  settings; Settings brings them back.
- Done: an end-to-end test folding a post-it, reloading, and bringing it back.

### Later

Everything in PRODUCT.md, Later: special editions, royalties, satellites and the IPO, Game
Center, cloud saves, ads on the website, more purchases, haptics, the big-number type.

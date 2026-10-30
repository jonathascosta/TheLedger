# The Ledger

Read `docs/PRODUCT.md` (what we build), `docs/ARCHITECTURE.md` (how) and `docs/PLAN.md` (what is
next, and what done means) before changing anything.

## Workflow

- One task of `docs/PLAN.md` per pull request.
- Every pull request goes through an isolated review agent (its own worktree, no session
  context). Fix what it finds, ask it to review again, and repeat until it approves. Then post
  one comment on the pull request recording the rounds.
- Once the reviewer approves and CI is green on the head, merge the pull request yourself (the
  owner asked for this), then continue with the next open task of the plan from the updated
  `main`.

## Commands

- `pnpm test` — unit tests (seconds). Run before every commit.
- `pnpm test:calibration` — the simulated player against the balance bands (about a minute). Run
  after touching the economy: businesses, upgrades, managers, the desk, goodwill, sponsors.
- `pnpm lint`, `pnpm format:check`, `pnpm typecheck` — the same gates as CI and the pre-commit hook.
- `pnpm build` — builds every package.

## Rules

- Every random draw goes through a seeded `Rng` (`packages/engine/src/rng`). `Math.random` fails lint.
- The engine (`packages/engine`) has no dependencies and no DOM. Rendering, input, persistence,
  ads and native plugins live in the app.
- Keep the product document current: when behaviour changes, change `docs/PRODUCT.md` first.
- Code, comments and documents are in English; player-facing text goes through the app's strings,
  in English and Brazilian Portuguese.

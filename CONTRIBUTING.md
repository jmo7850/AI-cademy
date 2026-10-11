# Contributing to PathBolt

## Set up

```bash
npm ci
npm run dev
```

Node 20 or newer is required (see `.nvmrc`).

## Before you open a pull request

```bash
npm run check                    # type check, lint, unit tests, production build
npx playwright install chromium  # first time only
npm run test:e2e                 # browser journeys and accessibility scans
```

CI runs the same commands on every push to `main` and on every pull request.

## Rules that keep the product honest

- **Facts are sourced.** A catalog fact is `verified()` only when you read it on the provider's official page; set `sourceUrl` and `checkedOn`. Otherwise use `unverified()` or `estimate()`. Never show a course badge as a certification.
- **Practice questions are original.** Never copy real exam questions. Every option needs a `why`.
- **Learning rules.** No forced timers, no streaks, nothing lost for a wrong answer, one clear next action. Games stay optional.
- **Progress is sacred.** Any change to saved data bumps `SCHEMA_VERSION` in `src/store/schema.ts` and adds a step to `MIGRATIONS` in `src/store/persistence.ts`, with a test. Never change the storage key.
- **Colours come from tokens** in `src/ui/styles.css`, defined for light and dark mode.
- **Accessibility.** New pages must pass the axe scan in `e2e/journey.spec.ts` with no serious or critical issues and no horizontal scroll on a phone.

## Where things live

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). In short: seed content in `src/data`, pure tested logic in `src/engine`, state and persistence in `src/store`, React pages in `src/ui`.

## Commits

Small, focused commits with an imperative subject line, for example `Add NVIDIA NCA-GENM prep course`.

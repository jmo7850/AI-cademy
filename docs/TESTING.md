# Testing and validation

How the app is checked and the most recent results.

## Validation results

| Check | Result (re-run for this handoff, 2026-10-10, from a clean `npm ci` of the working tree) |
| --- | --- |
| `npm run typecheck` | pass |
| `npm run lint` | pass |
| `npm test` (Vitest) | **84/84** passed in 6 files |
| `npm run build` | pass: 471.5 kB JS (167.0 kB gzip), 13.1 kB CSS |
| `npm run test:e2e` (Playwright, desktop + Pixel 7) | **16/16** passed |

The e2e suite covers:
- The full learner journey: onboard, course, lesson, answer, explanation, leave, resume, weak-concept review, practice exam, results.
- Quick-credential filters.
- Path customisation.
- Backup download.
- Every nav section with axe WCAG 2 A/AA scans (no serious or critical issues) and no horizontal overflow.
- The new-provider flow with persistence.
- Dark theme accessibility.
- Playing Bolt Run and Flash Match, persisting results, the Win board, badges and Boss Battle.

**Not tested:** a manual screen-reader pass, and Safari or Firefox (CI and the dev environment run Chromium only).

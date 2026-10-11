# Testing and validation

How the app is checked and the most recent results.

## Validation results

| Check | Result (re-run 2026-10-11) |
| --- | --- |
| `npm run typecheck` | pass |
| `npm run lint` | pass |
| `npm test` (Vitest) | **121/121** passed in 7 files |
| `npm run build` | pass: 471.5 kB JS (167.0 kB gzip), 13.1 kB CSS |
| `npm run test:e2e` (Playwright: desktop Chrome, Pixel 7, Firefox, WebKit) | 12 journeys per browser. **24/24** passed locally on the two Chromium projects; Firefox and WebKit run in CI |

The e2e suite covers:
- The full learner journey: onboard, course, lesson, answer, explanation, leave, resume, weak-concept review, practice exam, results.
- Outside courses: finish, add a note, take the return check, see the honest status; a recorded credential reads "Poqeni has not verified it".
- Project milestone evidence, and the "What Poqeni knows about me" screen (add, delete, forget everything).
- Quick-credential filters.
- Path customisation.
- Backup download.
- Every nav section with axe WCAG 2 A/AA scans (no serious or critical issues) and no horizontal overflow.
- The new-provider flow with persistence.
- Dark theme accessibility.
- Playing Poqeni Run and Flash Match, persisting results, the Win board, badges and Boss Battle.

**Not tested:** a manual screen-reader pass, and real Safari on iOS (WebKit on desktop is the closest CI gets).

## Catalog drift check

`npm run catalog:drift` (and the weekly **Catalog drift check** workflow, which can also be run by hand from the Actions tab) requests every official source page in the catalog and lists the ones that moved, changed since their check date (when the server sends `Last-Modified`), are blocked, or are gone. It never edits the catalog: a person re-reads each flagged page and updates the facts and `checkedOn`. It fails only when a page returns 404 or 410.

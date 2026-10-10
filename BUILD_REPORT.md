# Build report: first release (2026-10-10)

## Starting state
Empty workspace, no repository attached. Reference repo `ayghri/i-have-adhd` was cloned and its `SKILL.md` rules applied as interaction guidance (one next action first, visible progress, state restated, expandable detail, concrete time estimates, visible wins, neutral errors, no forced timers or streaks).

## What works now
- **Catalog**: 29 entries across Claude Academy (12), AWS (3), Microsoft (3, one retired), Google Cloud (3) and app curricula/projects (8). Every fact carries a Verified / Unverified / Estimate badge, source URL and check date, with a 90-day "Needs re-check" flag. Six credential classes kept distinct; badges are never shown as certifications.
- **Study**: 9 in-app courses (AI foundations, developer foundations, LLM app engineering, local LLMs, career readiness, AWS AIF-C01, AWS CLF-C02, Azure AI-901, Google Generative AI Leader), 18 lessons, 93 original questions in 6 formats, 39 flashcards. Explanations for every option.
- **Practice**: blueprint-weighted exam simulator (official weights where published), practice vs exam mode, optional timer with pause, flags, domain results, weak-area remediation, retake advice, readiness.
- **Mastery and review**: per-concept mastery (needs varied correct answers, discounts guesses), modified SM-2 scheduling using correctness, confidence and difficulty, weak-concept review with a different example.
- **Paths**: 5 templates, onboarding (8 questions + optional 9-question skills check), explained recommendations honouring provider, budget, experience and diagnostic results, with include/skip overrides and full editing.
- **Quick Credentials**: 13 filters, trade-off notes. **Project Lab**: 9 projects with milestones, definition of done, validation, hardware notes and portfolio entries.
- **Data**: localStorage with schema versioning and migrations, corrupt-data recovery, JSON export/restore (file or copy/paste), validated course import labelled user-added.

## Validation (actual results)
| Command | Result |
| --- | --- |
| `npm run typecheck` | pass |
| `npm run lint` | pass, 0 warnings |
| `npm test` (Vitest) | 71/71 passed |
| `npm run build` | pass (≈371 kB JS, 114 kB gzipped) |
| `npm run test:e2e` (Playwright, desktop + Pixel 7) | 10/10 passed: full learner journey (onboard → course → lesson → answer → explanation → leave → resume → weak-concept review → practice exam → results), quick filters, path customisation, backup download, every nav section with axe WCAG 2 A/AA (no serious/critical issues) and no horizontal overflow |

Not run: a manual screen-reader pass, and Safari/Firefox (only Chromium is installed here).

## Course sources
See README "Data sources and accuracy". Unverified items: Claude Academy per-course price and badge terms, AWS Cloud Practitioner Essentials duration/cost, AI-901 price/duration/renewal, Applied Skills assessment cost, Google Generative AI Leader domain weights.

## Known limitations
Small question banks; single-browser storage; study time counts timer sessions only; in-app reminders only; external credentials are self-reported; no AI tutor provider yet (interface only).

## Next recommended step
Grow the AIF-C01 and AI-901 question banks to ~60 each so full-length practice exams don't repeat questions, then add a second lesson for each vendor course.

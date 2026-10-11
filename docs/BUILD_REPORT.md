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

---

# Update: course expansion and Vector theme (2026-10-10)

## Providers and entries added (13, all checked on the official pages on 2026-10-10)
| Provider | Entry | Credential class | Cost | Notes |
| --- | --- | --- | --- | --- |
| Google | Google AI Professional Certificate | Professional certificate program | $49/month (Coursera, US/Canada) | 8 courses of ~1 h; Coursera, Google Skills, Udemy |
| Google | Google AI Essentials | Course completion certificate | $49/month after 7-day trial | Under 5 h, 5 modules |
| OpenAI | Apply AI at Work | Learning resource (no credential) | Not shown (unverified) | Duration is an app estimate |
| OpenAI | Build with AI (Codex, API) | Learning resource | Not shown (unverified) | Duration is an app estimate |
| AMD | AI Foundations, Build AI, Optimize & Deploy AI | Course completion certificate (per-path terms unverified) | Free (verified) | AMD AI Academy learning paths |
| AMD | Core ROCm Software Application Development, Certified Associate | Vendor skill credential (AMD calls it a certification) | Free | 5 modules, GPU labs, exam, Credly badge; proctoring not stated |
| NVIDIA | NCA-GENL Generative AI LLMs | Foundational certification | $125 exam | 60 min, 50–60 questions, 2-year validity, published domain weights; in-app prep course |
| NVIDIA | NCA-GENM Generative AI Multimodal | Foundational certification | $125 exam | 60 min |
| NVIDIA | NCA-AIIO AI Infrastructure and Operations | Foundational certification | $125 exam | 60 min |
| NVIDIA | NCP-GENL Generative AI LLMs (Professional) | Professional certification | $200 exam | 120 min, advanced |
| NVIDIA | DLI free self-paced courses | Learning resource | Free | "A day or less"; certificate only in select courses |

Totals now: 42 catalog entries, 10 study courses, 19 lessons, 105 original questions, 43 flashcards. No first-release ids were changed or removed, and the saved-data schema is unchanged, so existing progress loads as before (unit test checks all 29 original ids).

## Integration
- Two new credential classes: **Professional certificate program** and **Learning resource (no credential stated)**, shown as visually distinct badges (gold = formal certification, navy = certificate program, grey = no credential).
- Catalog search and provider filter, onboarding provider preferences, a new "Professional certificate program" quick filter (14 total). "Free credential" no longer counts entries with no credential, and "Paid exam" requires an actual exam.
- Career paths: new options in AI Foundations, Cloud and AI, AI Application Developer and Local LLM Developer. Steps can now be marked choose-one, so alternatives from different providers recommend one (your preferred provider first) instead of all. Existing saved plans are not changed; "Reset to template" picks up the new steps.
- NVIDIA NCA-GENL prep: one lesson, 12 questions across all 5 published domains (30/14/22/24/10), 4 flashcards; works with mastery, spaced review and the exam simulator.

## Vector theme
Navy/cyan/gold/ice tokens with dark-mode equivalents, Montserrat + Lato, 16 px rounded cards with soft shadows, navy sidebar with cyan active state, navy hero with gold "Start now" and the robot mascot (inline SVG), pill buttons, cyan-on-navy progress bars, gold status for mastery and recorded credentials. Applied through shared tokens and components, so every section (dashboard, catalog, lessons, exam simulator, progress, paths, settings) picks it up. App name unchanged.

## Validation (actual results)
| Command | Result |
| --- | --- |
| `npm run typecheck` | pass |
| `npm run lint` | pass, 0 warnings |
| `npm test` | 77/77 passed (6 new: providers, credential classes, NVIDIA fees, first-release ids, choose-one paths, paid-program wording; plus new filter assertions) |
| `npm run build` | pass (≈396 kB JS, 122 kB gzipped; 10 kB CSS) |
| `npm run test:e2e` | 14/14 passed (desktop + Pixel 7): previous journeys, plus new-provider flow (filter → NVIDIA entry → enrol → lesson → NVIDIA practice exam → reload → still enrolled) and axe WCAG A/AA in dark mode on 8 pages, plus Home in light mode |

Not run: manual screen-reader pass; browsers other than Chromium.

---

# Update: Vector Academy rebrand (2026-10-10)
- Renamed the app to **Vector Academy** (nav wordmark, page titles, backup file name `vector-academy-backup-*.json`, favicon). Saved progress is untouched: the storage key and backup format id are unchanged, so older backups still restore.
- Replaced the drawn SVG robot everywhere with **Vector**, the supplied white-and-gold mascot. The checkerboard was removed with an ML background-removal model (run once offline; not a project dependency), and stray specks were cleaned. Head crop = logo, full figure = home hero.
- Colours retuned to the brand board (navy #232F42, cyan, brushed gold #D4A74F, silver #B4B7BD, warm cream #F7F4E8), with a navy circuit pattern on the sidebar and hero and cream light panels. Dark mode uses the same navy family.
- Validation: typecheck pass, lint pass, 77/77 unit tests, build pass (443 kB JS incl. ~35 kB of inlined mascot images), 14/14 Playwright tests incl. axe WCAG A/AA in light and dark mode.

---

# Update: PathBolt and the Arcade (2026-10-10)
> Later renamed: the app and its mascot Bolt are now both called **Poqeni**, and `bolt-*` assets are `poqeni-*`. This section is kept as written.
- Renamed to **PathBolt**; the mascot is **Bolt** (same white-and-gold art and brand colours). Backups now download as `pathbolt-backup-*.json`; older backups still restore.
- **Arcade** (new nav section, optional, can be hidden in Settings), hosted by Bolt:
  - Bolt Run: 5 questions, due reviews first, then weak concepts. Bolt walks a 5-tile track; correct answers charge the battery (a run of correct answers charges double; misses never remove charge).
  - Flash Match: pair 5 terms with meanings, unseen and due cards first. A card counts as known only if matched first time.
  - Boss Battle: one boss per exam-blueprint domain; 3 hits win, with 2 spare questions; misses cost nothing.
  - Level and XP from concept mastery (+10 per game won), 6 badges, and a Win board on Progress.
  - Every game answer goes through the same `recordAnswer` path (context `game`), so mastery and spaced review update exactly as for lessons.
- Storage schema 2 → 3 with a migration (adds game results and the Arcade preference); existing progress is untouched (unit test).
- Validation: typecheck pass, lint pass, 84/84 unit tests (7 new), build pass (456 kB JS), 16/16 Playwright tests (new: plays Bolt Run and Flash Match, checks persistence, Win board, badges, Boss Battle and axe).

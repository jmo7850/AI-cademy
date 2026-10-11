<p align="center">
  <img src="docs/images/logo.svg" alt="Poqeni" width="360">
</p>

<p align="center"><strong>Learn. Build. Certify.</strong><br>
A local-first, ADHD-friendly study platform for entry-level AI careers.</p>

<p align="center">
  <a href="https://github.com/jmo7850/AI-cademy/actions/workflows/ci.yml"><img src="https://github.com/jmo7850/AI-cademy/actions/workflows/ci.yml/badge.svg" alt="CI status"></a>
</p>

Poqeni brings courses and credentials from Claude Academy, AWS, Microsoft, Google, OpenAI Academy, AMD AI Academy and NVIDIA into one catalog, and adds its own lessons, practice exams, spaced repetition, mastery tracking, career paths, a project lab and an optional games Arcade hosted by poqeni.

No account, server or paid AI API is needed. All progress stays in your browser and can be exported as JSON.

| Dashboard | Arcade |
| --- | --- |
| ![Home dashboard with the next recommended step](docs/images/home.webp) | ![Arcade with Poqeni Run, Flash Match and Boss Battle](docs/images/arcade.webp) |
| **Course page with verified facts** | **Phone, dark mode** |
| ![NVIDIA certification page showing verified exam facts](docs/images/course.webp) | ![Flash Match on a phone in dark mode](docs/images/mobile-dark.webp) |

## Contents

- [Quick start](#quick-start)
- [Scripts](#scripts)
- [What is in it](#what-is-in-it)
- [Visual design](#visual-design)
- [Architecture](#architecture)
- [Data sources and accuracy](#data-sources-and-accuracy)
- [Known limitations](#known-limitations)
- [Documentation](#documentation)
- [Contributing](#contributing)

## Quick start

Requires **Node 20 or newer**; CI uses Node 22 (see `.nvmrc`).

```bash
git clone https://github.com/jmo7850/AI-cademy.git
cd AI-cademy
npm ci
npm run dev        # open http://localhost:5173
```

On Windows PowerShell the same commands work. If PowerShell blocks scripts, use `npm.cmd ci` and `npm.cmd run dev`.

To build a static site, run `npm run build`. It writes to `dist/`, which any static host can serve, because the app uses hash routing and relative asset paths.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the dev server with hot reload. |
| `npm run check` | Type check, lint, unit tests and production build in one go. CI runs this. |
| `npm run typecheck` | TypeScript in strict mode, no emit. |
| `npm run lint` | ESLint with the TypeScript and React Hooks rules. |
| `npm test` | Vitest unit tests (engines, store, catalog integrity). |
| `npm run test:e2e` | Playwright journeys in desktop Chrome, a Pixel 7 profile, Firefox and Safari (WebKit), with axe accessibility scans. Run `npx playwright install chromium firefox webkit` once first, and `npm run build` before it. Add `--project=desktop` to run one browser. |
| `npm run catalog:drift` | Requests every official source page in the catalog and lists the ones that moved, changed or went away, for a person to re-check. Also runs weekly in GitHub Actions. |
| `npm run build` | Type check, then a production build in `dist/`. |
| `npm run preview` | Serves `dist/` on port 4173. |

## What is in it

| Section | What it does |
| --- | --- |
| Home | One recommended next action with its reason, plus continue-learning, reviews, recent results and path progress. |
| Course Catalog | Search and filter by provider, credential type, subject. Credential classes are kept apart: formal certifications (proctored exams), professional certificate programs, course completion certificates or badges, vendor skill credentials, and learning resources with no credential. Each entry shows every fact with a provenance badge: **Verified** (read on the official page on the date shown), **Unverified**, or **Estimate**. |
| My Learning | Enrolled, bookmarked and custom plans. |
| Career Paths | Five templates (AI Foundations, Cloud and AI, AI Application Developer, AI Agent and Runtime Engineer, Local LLM Developer). Reorder, add, remove, skip or include; every suggestion says why. |
| Quick Credentials | Short courses, badges and beginner certifications with 14 filters and a speed/depth/cost trade-off note. |
| Practice Center | Review queue, weak areas, flashcards, and an exam simulator that follows published domain weights. |
| Arcade | Optional, untimed games hosted by Poqeni: **Poqeni Run** (5 questions from due reviews and weak concepts), **Flash Match** (pair terms with meanings), **Boss Battle** (beat one exam domain). Every answer is recorded like normal practice, so it updates mastery and the review schedule. Levels come from concept mastery (not time spent), plus badges and a Win board on Progress. Can be hidden in Settings. |
| Project Lab | 9 projects from exercises to capstones, with milestones, definition of done, validation and portfolio entries. |
| Progress | Mastery per concept, activity, study time, review backlog, confidence, status and history. |
| Settings | Preferences, schedule, budget, theme, backup export/restore, course import, delete all data. |

### Learning loop

Lesson sections (one at a time, "Go deeper" is optional) → knowledge check with per-option explanations and an optional confidence rating → answers schedule spaced reviews (missed items return in 10 minutes) → concept mastery updates → weak concepts get a *different* example in targeted review → practice exam by official domain → domain results, weak-area remediation, readiness.

### Courses studied elsewhere

For courses that run on the provider's site, the course page is a short guide: what to look for (the course's published objectives), a time estimate with its provenance, and a "Back from it?" step. You can tick "I finished this course", add a note or an https link, and take a five-question check drawn from Poqeni's own question banks. The status says exactly that, for example "You said you finished this" or "You passed Poqeni's check on this topic (4 of 5)". It never claims the provider course or a credential is confirmed. Project milestones accept optional evidence the same way.

### Lessons that teach, and send you back

The AWS AI Practitioner course is the pilot for a lesson standard: short sections that give the idea, a worked example or diagram, something that looks the same but is not, a common mix-up, and a two-line recap. When you miss a question, the feedback links to the exact section that teaches it.

### Flashcards

Every Practice category has a deck of 35 to 41 original flashcards written for the app: definitions, "X vs Y" pairs, which-service-for-this-job and common traps. Grading a card puts it on the same spaced-review schedule as questions. Cards describe what a service or idea does and avoid prices, quotas and version numbers, which change.

The AWS AI Practitioner bank is now 60 original practice questions weighted across the five exam domains, and its course page links to a coverage view showing, per domain, its exam weight, the lessons that teach it and how many questions test it. The Microsoft Azure AI Fundamentals (AI-901) course has the same treatment: five lessons to the lesson standard and 60 original questions across its two skill areas. Questions are original practice, never official exam content.

### Fast tracks

Career Paths links to fixed-order routes with a fixed hours budget and a pace picker (5, 10 or 20 hours a week) that shows an estimated finish. The first is the Claude fast track: three Claude Academy courses, with the credential labelled as a completion badge and never as a certification. The second is the AWS AI Practitioner route: an optional on-ramp course, then the exam preparation, with the exam described as AWS-granted and never earned in the app. A route can be copied into your plans. Poqeni never marks a credential earned.

### What Poqeni knows about me

Settings links to a screen listing everything remembered: setup answers, notes you add, and facts worked out from your activity. Each item can be changed or forgotten, and "Forget everything" clears it while keeping your progress. It all stays on your device.

### Status levels kept separate

Not started · In progress · Completed · Practice assessment passed · Demonstrated mastery · Credential recorded by you. The last one is only what you enter after the provider issues the credential; finishing study never sets it.

### ADHD-friendly design

Applied from [ayghri/i-have-adhd](https://github.com/ayghri/i-have-adhd) (its `SKILL.md` rules): one clear next action first, numbered and visible progress ("Step 4 of 8"), state restated on every screen, details behind expandable sections, concrete time estimates, visible wins, neutral error wording ("Not quite." plus the fix), no streaks, no forced timers. The optional session timer (5/10/20/30 min) offers a break and can be ignored. Focus mode hides navigation. Lessons and exams resume exactly where you left off.

## Visual design

Poqeni (first drawn up as Vector Academy, then PathBolt) uses its logo's colours: Deep Navy `#232F42`, Sky Blue `#6FB3E0` and Cream `#F2F0EA`, with Brushed Gold `#D4A74F` kept for certifications and achievements. Montserrat headings and Lato body (Google Fonts, with system fallbacks). Light panels are cream; the sidebar and hero card are navy with a faint sky-blue circuit pattern. The mascot, a line-art robot with a graduation cap, is the logo (head and lockup) and stands in the hero card (full figure); it is drawn as inline SVG in `src/ui/components/Mascot.tsx`, so it follows light and dark themes. Sky blue is used on navy; links on cream use a deeper blue for contrast. All colours are tokens in `src/ui/styles.css`, redefined for dark mode.

## Architecture

```
src/
  domain/types.ts        Catalog, curriculum, question and Fact<T> provenance types
  data/                  Seed content (no logic)
    catalog.ts           42 entries; official facts carry sourceUrl + checkedOn
    curriculum/          10 study courses (lessons, questions, flashcards, blueprints)
    paths.ts projects.ts Career path templates and project lab
    registry.ts          Merges built-in and user-imported content
  engine/                Pure, tested logic (no React)
    grading.ts           All question types; normalised and numeric-tolerance fill answers
    srs.ts               Modified SM-2 using correctness, confidence and difficulty
    mastery.ts           Per-concept mastery, weak areas, readiness, course status
    exam.ts              Blueprint-weighted selection (largest remainder), scoring
    recommend.ts         Path personalisation with reasons; single next action
    games.ts             Arcade picks, charge, XP levels and badges
    catalogFilter.ts     Search, quick-credential filters, trade-offs, staleness
    validate.ts          Import validation (courses and backups)
    tutor.ts             Optional AI tutor interface; default = authored explanations
  store/                 Versioned state, reducer, localStorage persistence + migrations
  ui/                    React pages and components, hash router, Vector theme tokens (light/dark) in styles.css
```

Dependencies: React and Vite at runtime; Vitest, Testing Library/jsdom, Playwright, axe-core and ESLint for development. No state, routing or validation libraries.

### Extending

- **New provider or course:** add a `CatalogEntry` in `src/data/catalog.ts` (use `verified()` only for facts you read on the official page, and set `sourceUrl` and `checkedOn`). Add a `StudyCourse` in `src/data/curriculum/` and register it in `curriculum/index.ts`. `tests/catalog.test.ts` validates links, ids, explanations and blueprint coverage.
- **New exam blueprint:** set `blueprint.domains` with published weights (`weightsStatus: 'verified'`) and give every domain at least one question.
- **Without code:** Settings → Import a course (`aca-course@1` JSON; the format is shown in the app). Imports are always labelled user-added and unverified.
- **Schema change:** bump `SCHEMA_VERSION` in `store/schema.ts` and add a step to `MIGRATIONS` in `store/persistence.ts`.
- **AI tutoring:** implement `TutorProvider` behind a server you control. Never put API keys in client code.

## Data sources and accuracy

Official facts were read on these pages on **2026-10-10** and are flagged "Needs re-check" after 90 days. You can mark a re-check from any entry page.

- Claude Academy catalog: <https://academy.claude.com/all> and course pages (e.g. Claude 101)
- AWS AI Practitioner: <https://aws.amazon.com/certification/certified-ai-practitioner/> and the AIF-C01 exam guide
- AWS Cloud Practitioner: <https://aws.amazon.com/certification/certified-cloud-practitioner/> and the CLF-C02 exam guide
- Microsoft Azure AI Fundamentals (AI-901): certification page, exam page and study guide on learn.microsoft.com
- Microsoft Applied Skills: Foundry agents (available) and Copilot Studio agents (retired) pages
- Google Cloud: certification overview, Generative AI Leader, Cloud Digital Leader, and Google Skills "Introduction to Generative AI"
- Google AI Professional Certificate: <https://grow.google/ai-professional/> (Coursera: <https://www.coursera.org/google-certificates/google-ai>); Google AI Essentials: <https://grow.google/ai-essentials/>
- OpenAI Academy: <https://academy.openai.com/pages/courses> and the "Apply AI at Work" page
- AMD AI Academy: <https://developer.amd.com/amd-ai-academy/> (courses at <https://academy.amd.com>); ROCm certification: <https://developer.amd.com/rocm-certified/>
- NVIDIA certifications: <https://www.nvidia.com/en-us/learn/certification/> and the NCA-GENL page; NVIDIA DLI free courses: <https://www.nvidia.com/en-us/training/find-training/?Free+Courses=Free>

Not verified and labelled as such: per-course pricing and badge terms on Claude Academy; AWS Cloud Practitioner Essentials duration and cost (page needs sign-in); AI-901 price, duration and renewal (region-dependent or not shown); Applied Skills assessment cost; Google Generative AI Leader domain weights (the simulator uses equal weights and says so); OpenAI Academy cost and duration (not shown; no certificate mentioned); AMD per-path completion certificates and whether the ROCm exam is proctored; which NVIDIA DLI free courses give a certificate; question counts for NVIDIA exams other than NCA-GENL; Google AI Professional Certificate total hours (8 one-hour courses is an inference; Google's FAQ also says seven). Not listed yet: AMD's announced ROCm Professional and Expert levels.

All lessons, explanations and practice questions are original. Practice questions are labelled as such and are never official exam questions. Study-time figures for certifications are app estimates.

## Known limitations

See also [docs/ROADMAP.md](docs/ROADMAP.md) for open decisions and next steps.


- Question banks are small (3–20 per course), so long practice exams repeat the bank; the simulator caps the count and says why.
- Progress lives in one browser. Use export/restore to move it.
- Study time counts only sessions started with the timer.
- Reminders are in-app only (no push notifications).
- In the hosted preview, the "Export backup" file download is blocked by the viewer; use "Copy backup text" there.
- External credentials are self-reported; the app cannot verify them.

## Documentation

| Document | What it covers |
| --- | --- |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Product rules, brand, code layout, data flow and engine rules. |
| [docs/CATALOG.md](docs/CATALOG.md) | Catalog contents, credential classes and verification status. |
| [docs/GAMES.md](docs/GAMES.md) | The Arcade today, and the specification for the next games. |
| [docs/TESTING.md](docs/TESTING.md) | What the unit and end-to-end tests cover, and the latest results. |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Known limitations, open decisions and next steps. |
| [docs/BUILD_REPORT.md](docs/BUILD_REPORT.md) | Release-by-release notes with validation results. |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). In short: keep facts sourced, keep the learning rules (no forced timers or streaks), and run `npm run check` and `npm run test:e2e` before opening a pull request.

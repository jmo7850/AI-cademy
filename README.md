# AI Career Academy

A local-first, ADHD-friendly study platform for entry-level AI careers. It brings Claude Academy, AWS, Microsoft and Google Cloud credentials together with vendor-neutral curricula, practice exams, spaced repetition, career pathways and a project lab.

No account, server or paid AI API is needed. All progress stays in your browser and can be exported as JSON.

## Run it

Requires Node 20+.

```bash
npm install
npm run dev          # http://localhost:5173
npm run check        # typecheck + lint + unit tests + production build
npm run test:e2e     # Playwright journeys (desktop + mobile), after `npm run build`
```

`npm run build` writes a static site to `dist/` that any static host can serve (it uses hash routing and relative asset paths).

## What is in it

| Section | What it does |
| --- | --- |
| Home | One recommended next action with its reason, plus continue-learning, reviews, recent results and path progress. |
| Course Catalog | Search and filter by provider, credential type, subject. Each entry shows every fact with a provenance badge: **Verified** (read on the official page on the date shown), **Unverified**, or **Estimate**. |
| My Learning | Enrolled, bookmarked and custom plans. |
| Career Paths | Five templates (AI Foundations, Cloud and AI, AI Application Developer, AI Agent and Runtime Engineer, Local LLM Developer). Reorder, add, remove, skip or include; every suggestion says why. |
| Quick Credentials | Short courses, badges and beginner certifications with 13 filters and a speed/depth/cost trade-off note. |
| Practice Center | Review queue, weak areas, flashcards, and an exam simulator that follows published domain weights. |
| Project Lab | 9 projects from exercises to capstones, with milestones, definition of done, validation and portfolio entries. |
| Progress | Mastery per concept, activity, study time, review backlog, confidence, status and history. |
| Settings | Preferences, schedule, budget, theme, backup export/restore, course import, delete all data. |

### Learning loop

Lesson sections (one at a time, "Go deeper" is optional) → knowledge check with per-option explanations and an optional confidence rating → answers schedule spaced reviews (missed items return in 10 minutes) → concept mastery updates → weak concepts get a *different* example in targeted review → practice exam by official domain → domain results, weak-area remediation, readiness.

### Status levels kept separate

Not started · In progress · Completed · Practice assessment passed · Demonstrated mastery · External credential recorded. The last one is only what you enter after the provider issues the credential; finishing study never sets it.

### ADHD-friendly design

Applied from [ayghri/i-have-adhd](https://github.com/ayghri/i-have-adhd) (its `SKILL.md` rules): one clear next action first, numbered and visible progress ("Step 4 of 8"), state restated on every screen, details behind expandable sections, concrete time estimates, visible wins, neutral error wording ("Not quite." plus the fix), no streaks, no forced timers. The optional session timer (5/10/20/30 min) offers a break and can be ignored. Focus mode hides navigation. Lessons and exams resume exactly where you left off.

## Architecture

```
src/
  domain/types.ts        Catalog, curriculum, question and Fact<T> provenance types
  data/                  Seed content (no logic)
    catalog.ts           29 entries; official facts carry sourceUrl + checkedOn
    curriculum/          9 study courses (lessons, questions, flashcards, blueprints)
    paths.ts projects.ts Career path templates and project lab
    registry.ts          Merges built-in and user-imported content
  engine/                Pure, tested logic (no React)
    grading.ts           All question types; normalised and numeric-tolerance fill answers
    srs.ts               Modified SM-2 using correctness, confidence and difficulty
    mastery.ts           Per-concept mastery, weak areas, readiness, course status
    exam.ts              Blueprint-weighted selection (largest remainder), scoring
    recommend.ts         Path personalisation with reasons; single next action
    catalogFilter.ts     Search, quick-credential filters, trade-offs, staleness
    validate.ts          Import validation (courses and backups)
    tutor.ts             Optional AI tutor interface; default = authored explanations
  store/                 Versioned state, reducer, localStorage persistence + migrations
  ui/                    React pages and components, hash router, CSS tokens (light/dark)
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

Not verified and labelled as such: per-course pricing and badge terms on Claude Academy; AWS Cloud Practitioner Essentials duration and cost (page needs sign-in); AI-901 price, duration and renewal (region-dependent or not shown); Applied Skills assessment cost; Google Generative AI Leader domain weights (the simulator uses equal weights and says so).

All lessons, explanations and practice questions are original. Practice questions are labelled as such and are never official exam questions. Study-time figures for certifications are app estimates.

## Known limitations

- Question banks are small (3–20 per course), so long practice exams repeat the bank; the simulator caps the count and says why.
- Progress lives in one browser. Use export/restore to move it.
- Study time counts only sessions started with the timer.
- Reminders are in-app only (no push notifications).
- In the hosted preview, the "Export backup" file download is blocked by the viewer; use "Copy backup text" there.
- External credentials are self-reported; the app cannot verify them.

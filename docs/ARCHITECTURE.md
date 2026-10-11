# Product, brand and architecture

How Poqeni is meant to behave, how it looks, and how the code is organised. Start here before changing the app.

## Product

### Who it is for and the three questions it answers
The learner is someone aiming for an entry-level AI role, such as AI support or implementation specialist, AI operations associate, junior AI application developer, AI automation specialist, junior cloud or AI practitioner, or LLM application developer. The app helps them answer three questions:
1. What can I learn or get certified in?
2. What should I study next for the AI career I want?
3. Can I show that I actually understand and can apply the material?

### Non-negotiable product rules
These came from the spec and from the ADHD reference repo, [ayghri/i-have-adhd](https://github.com/ayghri/i-have-adhd) (its `SKILL.md`). Keep them in any change.
- Show one clear next action first. Keep progress numbered and visible ("Step 4 of 8"), and restate the learner's state on every screen.
- Put detail behind expandable sections, give concrete time estimates, and make wins visible.
- Use neutral error wording: "Not quite." followed by the fix.
- **No streaks, no forced timers, and no punitive gamification.** The session timer (5, 10, 20 or 30 minutes) is optional and can be ignored.
- Keep credential classes separate. **A course badge is never presented as a certification.**
- Every official fact carries provenance: **Verified** (read on the official page on the date shown), **Unverified**, or **Estimate**.
- Finishing study never marks an external credential as earned. Only the learner records that, after the provider issues it.
- Collecting certificates is never presented as enough on its own; credentials are paired with projects and demonstrable skills.

### Sections (left nav)
| Section | What it does |
| --- | --- |
| Home | One recommended next action with its reason, plus continue-learning, reviews, recent results and path progress. |
| Course Catalog | Search and filter by provider, credential type and subject. Every fact shows a provenance badge, its source and its check date. |
| My Learning | Enrolled, bookmarked and custom plans. |
| Career Paths | 5 templates (AI Foundations, Cloud and AI, AI Application Developer, AI Agent and Runtime Engineer, Local LLM Developer). The learner can reorder, add, remove, skip or include steps, and every suggestion says why. Choose-one steps recommend a single provider and prefer the learner's choice. |
| Quick Credentials | Short courses, badges and beginner certifications with 14 filters and a note on the speed, depth and cost trade-off. |
| Practice Center | Review queue, weak areas, flashcards, and an exam simulator weighted by the published domain weights. |
| Arcade | Optional, untimed games hosted by Poqeni: Poqeni Run, Flash Match and Boss Battle. It can be hidden in Settings. |
| Project Lab | 9 projects from exercises to capstones, each with milestones, a definition of done, validation and a portfolio entry. |
| Progress | Mastery per concept, activity, study time, review backlog, confidence, history, and the Arcade Win board. |
| Settings | Preferences, schedule, budget, theme, backup export and restore (file or pasted text), course import, and delete all data. |

### The learning loop
Lessons are shown one section at a time, and "Go deeper" is optional. Each lesson ends with a knowledge check that explains every option and asks for an optional confidence rating. Answers schedule spaced reviews, and a missed item returns after 10 minutes. Concept mastery updates with each answer, and a weak concept gets a *different* example in targeted review. Practice exams run by official domain and show domain results, weak-area remediation and readiness.

Course status levels are kept separate: Not started, In progress, Completed, Practice assessment passed, Demonstrated mastery, and Credential recorded by you.

## Brand

| Item | Value |
| --- | --- |
| Name | **Poqeni**, with a capital P, as drawn in the logo. Pronounced poh-KEN-ee. Files and the package name stay lowercase (`poqeni-*`, `"name": "poqeni"`). |
| Mascot | **Poqeni**, a flat line-art robot with a graduation cap and two antennae: cream outlines with sky-blue fills. Every robot in the app uses this art. The head is the logo mark and the standing figure appears in the Home and Arcade hero cards. |
| Logo and mascot files | The supplied lockup is kept as `src/ui/assets/brand/poqeni-lockup-on-dark.svg`, with the standing figure (`poqeni-standing-on-dark.svg`) and a favicon beside it (`poqeni-icon.svg`) and a navy banner for the README (`docs/images/logo.svg`). The app draws the mark, standing figure and lockup as inline SVG in `src/ui/components/Mascot.tsx`, using the same geometry, so they follow the theme (`--mk-line` and `--mk-fill`). If the logo changes, update the SVG files and that component together. |
| Palette | Deep Navy `#232F42` · Sky Blue `#6FB3E0` · Cream `#F2F0EA` (the last two are the logo's colours) · Brushed Gold `#D4A74F` · Metallic Silver `#B4B7BD` |
| Fonts | Montserrat for headings and Lato for body text, both from Google Fonts with system fallbacks. |
| Surfaces | Light panels are cream. The sidebar and hero card are navy with a faint sky-blue circuit pattern (the `--circuit` token). Cards are rounded at 16 px with soft shadows, and buttons are pills. |
| Colour rules | Sky blue appears on navy, as a glow, and as the main call to action. Links on cream use a deeper blue `#175F93` (`--accent`) for contrast. Gold is kept for formal certifications and achievements. Credential badges are gold for formal certifications, navy for certificate programs and grey for no credential. Text and controls meet WCAG AA contrast in both themes. |
| Tokens | All colours are CSS custom properties in `src/ui/styles.css`, redefined for dark mode. Never hard-code colours in components. |
| Tagline | "Learn. Build. Certify." |

Name clearance (domains and trademark) is still open; see [ROADMAP.md](ROADMAP.md).

## Architecture

```
AI-cademy/
  index.html, vite.config.ts, tsconfig.json, eslint.config.js, playwright.config.ts
  README.md              Setup, features, sources, limitations
  CONTRIBUTING.md        How to work on the project
  .github/workflows/     CI on every push and pull request; weekly catalog drift check
  docs/                  Architecture, catalog, games, testing, roadmap, build report
  src/
    domain/types.ts      Catalog, curriculum, question and Fact<T> provenance types
    data/                Seed content only, no logic
      catalog.ts         42 entries; official facts carry sourceUrl + checkedOn via verified()
      facts.ts           Fact helpers (verified / unverified / estimate)
      curriculum/        10 study courses (lessons, questions, flashcards, blueprints); index.ts registers them
      paths.ts           5 career path templates
      projects.ts        9 Project Lab projects
      registry.ts        Merges built-in and user-imported content
    engine/              Pure, unit-tested logic with no React
      grading.ts         All question types; normalised text and numeric-tolerance fill answers
      srs.ts             Modified SM-2 using correctness, confidence and difficulty
      mastery.ts         Per-concept mastery, weak concepts, readiness, course status
      exam.ts            Blueprint-weighted selection (allocate = largest remainder), scoring, weak domains
      recommend.ts       Path personalisation with reasons; nextAction() for Home
      games.ts           Arcade pickers, charge, XP levels, badges
      catalogFilter.ts   Search, quick-credential filters, trade-offs, staleness
      validate.ts        Import validation (courses and backups)
      random.ts          mulberry32 seeded PRNG, hashString, seededShuffle
      coverage.ts        Per-domain lessons and question counts for an exam course (the coverage view)
      fastTrack.ts       Fixed-order route hours and pace-based finish estimate (data in data/fastTracks.ts)
      outside.ts         Honest status for courses studied elsewhere (self-report, note, return check); return-check picker
      memory.ts          Everything remembered about the learner, for the "What Poqeni knows about me" screen
      tutor.ts           Optional TutorProvider interface; default returns authored explanations
    store/
      schema.ts          AppState, SCHEMA_VERSION = 4, initial state
      reducer.ts         All actions (recordAnswer, recordGame, startExam, …)
      persistence.ts     localStorage key "ai-career-academy", ordered MIGRATIONS, corrupt-data recovery
      StoreContext.tsx   React context + dispatch
    ui/
      App.tsx, router.ts Hash router (#/section/...), so it works on any static host and in the artifact preview
      pages/             Home, Catalog, MyLearning, Paths, Quick, Practice, Lesson, Arcade, Projects, Progress, Settings, Onboarding, Outside (guided outside courses and return checks), Know (What Poqeni knows about me)
      components/        QuestionView (renders all question formats with per-option feedback), Mascot, SessionTimer, ConfirmButton, bits
      styles.css         Theme tokens (light and dark) and all styles
  scripts/catalog-drift.mjs  Weekly check of catalog source pages (npm run catalog:drift)
  tests/                 Vitest: catalog, games, grading, mastery-exam, srs, store (160 tests)
  e2e/journey.spec.ts    Playwright: 16 journeys × desktop Chrome, Pixel 7, Firefox and WebKit = 64 tests, with axe WCAG A/AA scans
```

**Dependencies:** React and React DOM at runtime. Development uses Vite, TypeScript, Vitest, Testing Library with jsdom, Playwright, axe-core and ESLint. There are no state, routing or validation libraries, and new dependencies should be avoided unless they clearly earn their place.

### Data flow
1. The UI dispatches an action to `reducer.ts`.
2. State is persisted to `localStorage` under the key `ai-career-academy`.
3. Every answer anywhere in the app (lesson, review, exam, diagnostic, flashcard or game) goes through `recordAnswer`. That action appends an `Attempt` (capped at 5,000) and, unless `noSchedule` is set, updates the item's `ReviewCard` with `srs.schedule`. The review key is `${courseId}:${itemId}`.
4. Mastery is always **derived** from `attempts` by `mastery.ts` and is never stored.

### Key engine rules

- **Lesson standard:** each `LessonSection` can carry a `diagram` (a text flow, so it stays accessible and safe in imported courses), a worked `example`, a `nonExample`, a `misconception` and a two-line `recap`. Each `Question` can carry `teachIn` (lesson id and section index); a wrong answer then shows "Review this section" linking to `#/learn/<entry>/<lesson>/<section>`. `tests/lessons.test.ts` checks every link resolves and, for AWS AI Practitioner (the pilot, one lesson per exam domain), that every section has all the parts.

- **Outside courses:** Poqeni cannot see a provider course, so status is what the learner reported plus what Poqeni itself tested. `engine/outside.ts` never says "confirmed" or "earned"; a recorded credential reads "Poqeni has not verified it". Return-check questions come from Poqeni's own banks (`data/returnChecks.ts` maps each outside entry to a bank and optional concepts) and are recorded as `review` attempts.
- **Memory is local and visible:** everything remembered is listed on `#/know` (setup answers, optional notes, facts derived from activity), editable and deletable, with "Forget everything". Nothing leaves the device.
- **SRS (`srs.ts`):**
  - Quality is derived from correctness and confidence: 1 = guessed, 2 = unsure, 3 = confident. A confident miss counts as a misconception and gets quality 0.
  - A miss comes back in 10 minutes. The first successes come back at 1 day, then 3 days, and after that at interval × ease, adjusted for item difficulty.
  - A guessed correct answer is capped at a 1-day interval.
- **Mastery (`mastery.ts`):**
  - Mastery is per concept, using a recency-weighted score over the last 8 attempts with a decay of 0.7.
  - A guessed correct answer earns 0.5 credit and an unsure one 0.8.
  - "Mastered" needs at least 3 attempts, a score of 0.8 or more, at least 2 *different* items answered correctly, and a correct most recent attempt.
- **Exam (`exam.ts`):** `allocate()` splits the question count across domains by weight using the largest-remainder method. Each `passPercent` is an app readiness threshold, not the official cut score.
- **Games (`games.ts`):**
  - `pickRun()` picks due reviews first (most overdue first), then weak concepts, then fresh questions.
  - `pickMatch()` puts unseen and due flashcards first.
  - `bossFor()` gives one boss per blueprint domain, with HP = min(3, the number of questions), plus 2 spare questions.
  - `charge()` gives 1 per correct answer, or 2 when it continues a run of correct answers, and never subtracts.
  - XP comes from mastery (mastered 50, familiar 20, learning 5 per concept) plus 10 per game won. Level n needs 50·n·(n−1) XP.
  - There are 6 badges.

### Extending
- **New provider or course:**
  - Add a `CatalogEntry` in `data/catalog.ts`. Use `verified()` only for facts read on the official page, and set `sourceUrl` and `checkedOn`.
  - Add a `StudyCourse` in `src/data/curriculum/` and register it in `curriculum/index.ts`.
  - `tests/catalog.test.ts` checks links, ids, explanations and blueprint coverage.
- **New exam blueprint:** set `blueprint.domains` with the published weights (`weightsStatus: 'verified'`), and give every domain at least one question.
- **Without code:** use Settings → Import a course (`aca-course@1` JSON). Imported courses are always labelled user-added and unverified.
- **Schema change:** bump `SCHEMA_VERSION` in `store/schema.ts`, add a step to `MIGRATIONS` in `store/persistence.ts`, and add a store test showing that an older save loads unchanged.
- **AI tutoring:** implement `TutorProvider` behind a server you control. Never put API keys in client code.

Keep these ids stable: the storage key `ai-career-academy`, the backup format id, and the 29 first-release catalog ids (a unit test checks the ids). They were deliberately not renamed, so saved progress and older backups still load. Only the downloaded backup file name changed, to `poqeni-backup-*.json`.

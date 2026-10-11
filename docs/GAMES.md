# Games

The Arcade ships with three games: **Bolt Run**, **Flash Match** and **Boss Battle** (`src/ui/pages/Arcade.tsx`, logic in `src/engine/games.ts`). Every answer goes through the normal `recordAnswer` path, so games update mastery and spaced review. This document specifies the next, more video-game style games, which are **not built yet**.

> **Status: NOT YET BUILT.** This is a specification for a future change; none of it exists in the code yet. The existing Arcade (Bolt Run, Flash Match, Boss Battle) stays as it is.

## 0. Rules every game must keep
These come from [the product rules](ARCHITECTURE.md#product) and are acceptance criteria for **every** game below.
- **Optional:** games live in the Arcade, and they disappear when Settings → "Show the Arcade" is off (`profile.games`).
- **No forced timers:** nothing ever counts down against the learner. Animations pause whenever a question is on screen, the tab is hidden, or the learner presses Pause. Any speed-up (2×) is opt-in.
- **No punitive streaks:** nothing tracks consecutive days, and missing a day shows nothing.
- **A wrong answer never loses points:** every score, currency or progress meter only goes up. A miss earns less, never minus. There are no lives, health that ends the game, or game-over screens. Every game can always be finished.
- **Stopping costs nothing:** every answer is recorded the moment it is given. "Stop here" saves partial results and any loot.
- **Learning first:** every question is shown with the existing `QuestionView`, so the learner always gets the explanation and each option's `why` after answering.
- **Bolt hosts:** every game uses the existing Bolt art (`Mascot.tsx`) and the brand tokens. Do not add new robot art or silver variants.

## 1. Shared foundation (build this first)

**Question picking.** Generalise `pickRun()` in `engine/games.ts` into a single picker:
```ts
pickQueue(course, state, now, seed, n, opts?: {
  domainId?: string;          // restrict to one blueprint domain
  conceptIds?: string[];      // restrict to concepts (e.g. a chosen weak concept)
  kinds?: Question['kind'][]; // restrict formats where a game needs it
  exclude?: string[];         // question ids already used this run
}): Question[]
```
- The priority order is unchanged: due reviews (most overdue first), then weak concepts (`weakConcepts()`), then a seeded shuffle of the rest.
- `pickRun()` becomes a thin wrapper, so the existing tests keep passing.
- Add `pickSameConcept(course, conceptId, excludeIds, seed)`. It returns a *different* question on the same concept, to match the app's rule that a weak concept gets a different example.

**Recording.**
- Every answer goes through the existing `useRecorder(course).answer()`, which dispatches `recordAnswer` with `context: 'game'`. Do not add a parallel path.
- Flashcard-based answers record on the flashcard id, as Flash Match already does.
- **Assisted answers** (a hint, or a removed distractor) are recorded with `confidence: 1`. That gives the answer 0.5 mastery credit and caps the review interval at 1 day, using engine rules that already exist, so assists can't inflate mastery.
- **First try counts:** in any game where the learner can retry the same item, only the first try is recorded, as Flash Match already does.

**Scoring and the meta layer.**
- In-game score is game-local and only goes up.
- Games award **Bolt Parts**, a cosmetic currency spent in a new **Bolt's Garage** on Progress: cap colours, a gold bolt badge, trails for Dash and Racer, and tower skins for Defense. This idea comes from the game-ideas note.
- Bolt Parts never affect XP, mastery, readiness or reviews. XP stays mastery-based (`playerXp()`), and each new game's "won" (always reachable) adds the existing +10.
- Add one badge per new game to `badges()` (for example "Gatecrasher", "Firewall", "Vault diver", "Photo finish", "Sorted"), and show new wins on the existing Win board.

**State and schema: `SCHEMA_VERSION` 3 → 4, with migration step `3:` in `persistence.ts`.**
- Extend `GameKind` to `'run' | 'match' | 'boss' | 'dash' | 'defense' | 'dungeon' | 'race' | 'sort' | 'spark'`.
- Add `score?: number` and `meta?: Record<string, number | string>` to `GameResult`. Keep `meta` small; for example, the racer's ghost trace goes here.
- Add `activeGame?: { kind; courseId; seed; step; data: unknown }`, so a game resumes exactly where the learner left off after a reload. Lessons and exams already behave this way. Clear it when the game finishes or the learner chooses "Stop here".
- Add `boltParts: number` and `garage: { owned: string[]; equipped: Record<string, string> }`.
- Add `profile.gameMotion: 'system' | 'reduced'`, which defaults to `'system'` and follows `prefers-reduced-motion`.
- The migration must load a v3 save unchanged apart from the new defaults. Add a store test for it.

**Rendering.**
- Use React with DOM, CSS and inline SVG. **Do not add a game engine dependency** (Phaser and similar add about 1 MB).
- Add a small `useGameLoop(update, { paused })` hook built on `requestAnimationFrame` with a fixed timestep. It pauses on question open, on `visibilitychange` and on Pause.
- Simulation logic (movement, waves, collisions, map generation) goes in pure functions under `engine/arcade/`, seeded with `mulberry32`, so it is deterministic and unit-testable.
- Lazy-load each game with `React.lazy`, so the core study pages don't get heavier.
- Budget: at most +60 kB gzip in total for all new games. Today's build is 167 kB gzip.

**Accessibility.**
- Every game is fully playable by keyboard (arrows/WASD, Space, Enter, P to pause) and by touch, with on-screen buttons of at least 44 px.
- Narrate state changes in an `aria-live` region.
- Never use colour as the only cue, and never flash more than 3 times a second.
- Reduced motion swaps continuous movement for step transitions.
- Every action-style game has a **"Play as list"** mode that presents the same questions and rewards without the action layer.

**Shared acceptance criteria (apply to every game).**
- [ ] Each answer creates exactly one `Attempt` with `context: 'game'` and the right `courseId`, `itemId` and `conceptIds`, and updates the matching `ReviewCard`. Covered by a unit test.
- [ ] A property test over random answer sequences shows that score, Bolt Parts and progress never decrease after a wrong answer or any other in-game event.
- [ ] No visible timer counts down; pausing stops everything; leaving and reloading resumes the same state.
- [ ] "Stop here" at any point keeps every recorded answer and the loot earned so far.
- [ ] The game is hidden when `profile.games` is false.
- [ ] A Playwright test plays the game to the end on desktop and Pixel 7, and it passes axe WCAG A/AA in light and dark mode with no horizontal overflow.
- [ ] The existing 84 unit tests and 16 e2e tests still pass, and a v3 save migrates cleanly.
- [ ] The game card is disabled with a plain reason when the course content is too small, following the pattern in `ArcadePage`.

## 2. Circuit Dash: arcade platformer run
**Pitch:** Bolt runs and jumps across a side-scrolling circuit-board level. Data gates block the way, and answering opens them.

**Mechanics**
- A level is 6 segments, each ending in a **data gate**. Bolt moves only while the learner holds Right (or the on-screen arrow). Nothing auto-scrolls, so the player sets the pace.
- **Jump** (Space or a button) gets over gaps and onto platforms. Collecting **sparks** along the way adds to the score.
- **At a gate:** movement pauses and a question opens.
  - A correct answer drops a **boost pad**, and Bolt dashes through a short bonus lane full of sparks.
  - A wrong answer shows the explanation, and the gate opens normally with no bonus lane.
- **Falling into a gap** respawns Bolt at the segment start. Nothing is lost, and collected sparks stay collected.
- **Assist mode** (on by default when reduced motion is set) bridges every gap, so the level becomes walk-and-answer.
- Each level's theme comes from the course domain: for example the "AWS" level uses cloud tiles and "Local LLMs" uses GPU tiles. These are visual only.

**Question hook:** `pickQueue(n = 6)` with any format. Gate 6 prefers the weakest concept.

**Mastery and reviews:** one recorded answer per gate, so a level is 6 attempts. A missed gate's question is due again in 10 minutes through the normal SRS, so it can show up in the next Bolt Run.

**Scoring:**
- 1 per spark, +5 for each gate answered correctly, and a +3 bonus if the learner marked themselves confident and was right. Bolt Parts equal score ÷ 10.
- Won means reaching the finish, which is always possible.

**Acceptance criteria**
- [ ] 6 gates produce exactly 6 attempts, and no gate can be skipped without answering.
- [ ] Falling never reduces score or sparks (unit test on the pure physics/score reducer).
- [ ] Assist mode removes every gap, and the level can be finished with keyboard only and with touch only.
- [ ] Bolt never moves without player input, and the camera snaps per segment under reduced motion.
- [ ] "Play as list" gives the same 6 questions and the same spark rewards for correct answers.

## 3. Firewall Defense: tower defense
**Pitch:** defend the Model Server from waves of "bugs" (Hallucinations, Prompt Injections, Leaked Keys, Drifting Data) by building towers powered by what you know.

**Mechanics**
- **Map and towers:**
  - The map is a grid with a fixed path and 5 waves.
  - Each **tower type maps to a blueprint domain** of the course. For example, on AIF-C01: "Fundamentals" is a pulse tower, "Responsible AI" a shield, and "Security" a firewall. Courses without a blueprint use their concepts grouped into at most 4 tower types.
- **Build phase (no timer; the next wave starts only when the learner presses Start wave):**
  - **Earn charge:** answer a question from any domain. A correct answer gives +2 charge and a confident correct answer gives +3. A wrong answer gives +0 charge but keeps the explanation on screen.
  - **Build** a tower for 2 charge, or **upgrade** one (up to level 3) by answering a question **from that tower's domain**. A correct answer upgrades it. A wrong answer leaves it as it is, and the learner can try another question from that domain.
  - Every wave grants one free basic tower, so the game can always be finished even with no correct answers.
  - Bolt suggests a placement on the weakest domain ("Your Security tower could use an upgrade").
- **Wave phase:**
  - A deterministic simulation runs at 1× (2× is opt-in) and can be paused at any time.
  - Bugs that reach the server are just "not caught". The server has no health and there is no game over.
- **End of wave:** the screen shows "Caught 13 of 15" and 1–3 stars for the wave. The framing stays positive; there is no "you lost".

**Question hook:**
- `pickQueue` with `domainId` for upgrades and unrestricted for earning charge.
- Over a full game, the questions asked across domains should roughly follow the blueprint weights, using `allocate()` from `exam.ts` to steer the "Earn charge" picks.
- A typical game asks 10 to 15 questions.

**Mastery and reviews:** each answer is recorded once. Because upgrades come from each domain's questions, the game nudges practice toward weak domains without forcing it.

**Scoring:**
- Score = bugs caught + 5 per correct answer. Bolt Parts come from stars.
- Won means finishing wave 5, which is always reachable.

**Acceptance criteria**
- [ ] The build phase never auto-advances, and the next wave starts only on an explicit press.
- [ ] Simulation is deterministic: the same seed and placements always give the same result (unit test).
- [ ] With zero correct answers, the free towers still let the learner finish all 5 waves.
- [ ] Every tower type maps to a domain or concept group that has at least one question. If none does, the tower type is hidden.
- [ ] "Play as list" lets the learner answer questions and see each wave's outcome as text, with no grid.
- [ ] Bugs reaching the server never reduce score, charge or Bolt Parts.

## 4. Data Vault: roguelike quiz dungeon
**Pitch:** Bolt dives through a procedurally generated vault. Every run is different, the learner picks the route, and the route decides what they practise.

**Mechanics**
- **The map:** 3 floors, each a seeded branching map of 5 to 6 rooms (like Slay the Spire), with a boss room at the end. **Quick dive** is a single floor.
- **Room types:**

  | Room | What happens |
  | --- | --- |
  | Question | One question. The room is labelled with its concept, so the learner chooses what to practise. |
  | Elite | One difficulty-3 question in multi, order or match format, for a bigger reward. |
  | Rest | A 3-card flashcard flip that picks due cards first, using `pickMatch` ordering. |
  | Shrine | The learner picks one weak concept, and the next 2 question rooms target it. |
  | Treasure | Gives the learner a relic. |
  | Boss | A mini Boss Battle on the run's weakest domain, reusing `bossFor()`. |

- **Relics** (they last for one run):
  - **Lens:** removes one wrong option and shows its `why`. The answer is recorded as assisted (`confidence: 1`).
  - **Echo:** after a miss, guarantees a follow-up room on that concept.
  - **Magnet:** doubles Bolt Parts from the next 3 rooms.
  - **Map:** reveals the concepts of all rooms on the floor.
- **No health and no permadeath.**
  - A miss leaves a **Fog** marker on that concept. Fog spawns a follow-up room later in the run, using `pickSameConcept()` to ask a different question on the same concept.
  - The run ends when the learner clears the last floor or chooses "Leave the vault", and both keep all loot.

**Question hook:** room questions come from `pickQueue` with `conceptIds` set from the room's label. The map generator seeds rooms so that due and weak concepts appear on at least one route of every floor.

**Mastery and reviews:** each room records one attempt. Fog makes sure a missed concept is practised again in the same session with a new example, which builds mastery properly (mastery needs 2 distinct correct items).

**Scoring:**
- Rooms give Bolt Parts: question 2, elite 5, boss 10, and +1 for a confident correct answer.
- A miss gives 0, never less.
- Won means clearing the final room of the run.

**Acceptance criteria**
- [ ] The same seed always produces the same map (unit test), and resuming after a reload restores the exact room and relics.
- [ ] A missed concept spawns a follow-up room with a **different question id** when the bank has one. If it has none, it spawns a flashcard room for that concept (unit test).
- [ ] Lens-assisted answers are recorded with `confidence: 1`.
- [ ] Every floor has a route through at least one due or weak concept when any exist.
- [ ] Leaving early keeps all recorded answers and loot, and there is no way to "die".
- [ ] A Quick dive (one floor) fits a 10-minute session setting, and the room count is shown up front ("6 rooms").

## 5. Cert Circuit Racer: racing
**Pitch:** race Bolt's kart around a 3-lap circuit against a ghost of your own best run. Knowledge is your turbo.

**Mechanics**
- **The track:** 3 laps of 4 sectors each, so 12 questions. **Each lap is a domain**, chosen by blueprint weight with `allocate()`, or the 3 weakest domains if the learner picks "Train weak spots".
- **Turn-based racing; there is no clock.**
  - At each sector line the kart stops and a question opens.
  - A correct answer triggers **Turbo**: the kart animates 2 sector-lengths ahead, and pulls further ahead of the ghost.
  - A wrong answer moves the kart 1 sector-length at normal speed and shows the explanation. It is never a slowdown or a spin-out.
- **The ghost:**
  - The ghost replays the learner's **own previous best** on this course, stored as a compact per-question trace in `GameResult.meta`.
  - There is no AI opponent and no leaderboard.
  - On a learner's first race, the ghost is an "even pace" baseline of 1.5 sector-lengths per question.
- **Pit stop (optional):** between laps, a 3-card flashcard round gives a cosmetic trail.

**Question hook:** `pickQueue` with `domainId` set to each lap's domain and n = 4. Any format can be used, and fill questions get a keyboard-first input.

**Mastery and reviews:** 12 attempts per race, spread across domains in proportion to the exam weights, like a mini mock exam. A course without a blueprint uses its concepts in place of domains.

**Scoring:**
- Distance only goes up, at 2 per correct answer and 1 per miss. Beating the ghost earns a "Personal best" Win board entry and Bolt Parts.
- Won means crossing the finish line, which is always possible.

**Acceptance criteria**
- [ ] No timer is shown or used, and the race advances only on answers.
- [ ] A wrong answer always moves the kart forward, never backward or to a stop (unit test).
- [ ] Laps follow `allocate()` for the course's blueprint (unit test), and "Train weak spots" uses `weakDomains`/`weakConcepts`.
- [ ] The ghost trace is stored in under 200 bytes, and a ghost only replaces the old one when the learner sets a new best.
- [ ] There is no ranking against other people anywhere.

## 6. Sorting Factory: conveyor puzzle
**Pitch:** items roll down Bolt's conveyor belt and the learner sorts each into the right bin. This is the "Sort It" idea from the game-ideas note.

**Mechanics**
- **The belt:** 2 to 4 labelled bins, and a belt that **stops and waits** at the sorter, with no time pressure. Sort by drag, tap-then-bin, or the keys 1–4.
- **Content sources:**
  - **Flashcard mode:** each item is a flashcard front, and the bins are concepts (`flashcard.conceptId`).
  - **Match mode:** a `match` question's left items are sorted into bins labelled with its right items. The question is graded as one answer with `gradeQuestion()` when every pair is placed.
- **A wrong bin:** the item bounces back, Bolt shows which bin is right and why (the flashcard back, or the question explanation), and the item re-queues at the end of the belt.
- **Rounds** are 10 items.

**Question hook:** flashcards via `pickMatch` ordering (unseen and due first), filtered to concepts that have at least 2 cards, and match questions via `pickQueue({ kinds: ['match'] })`.

**Mastery and reviews:** the first-try rule applies, as in Flash Match. Each flashcard is recorded once, as correct only if it was sorted right the first time, and each match question is recorded once.

**Scoring:** 2 per item sorted right the first time and 1 per item sorted after a retry. Won means emptying the belt.

**Acceptance criteria**
- [ ] The belt never moves an item into a bin, or off screen, without input.
- [ ] Each flashcard or match question in a round is recorded exactly once, using the first-try rule.
- [ ] The game is disabled with a reason when the course has fewer than 2 concepts with flashcards and no match questions.
- [ ] The keyboard-only flow (1–4 keys) and screen-reader announcements ("Item 3 of 10: Embeddings. Bins: …") both work.

## 7. Daily Spark: optional daily puzzle (smallest)
**Pitch:** one small puzzle a day for low-energy days.

**Mechanics:**
- The day's puzzle is 3 questions seeded by the date (`hashString(YYYY-MM-DD)`), drawn from the learner's due reviews or, if none are due, from weak concepts.
- Completing it gives a small cosmetic.
- **There is no streak counter, no calendar of missed days, and no notification.** If the learner skips a day, the next day is simply a new Spark.

**Acceptance criteria**
- [ ] The same date and state always give the same 3 questions, and a different date gives a new set.
- [ ] Nothing in the UI or state counts consecutive days (code review plus a test that `games` holds no streak field).
- [ ] It works offline, like the rest of the app.

## 8. Suggested build order
| Order | Item | Relative size | Why |
| --- | --- | --- | --- |
| 1 | 9.1 Shared foundation | M | Everything else depends on it, including the schema bump. |
| 2 | 9.6 Sorting Factory | S | DOM only, no game loop, and it reuses the Flash Match patterns. |
| 3 | 9.4 Data Vault | M | The highest learning value: learner choice plus in-session relearning. |
| 4 | 9.5 Cert Circuit Racer | M | Domain-weighted practice framed as a race, with a simple animation. |
| 5 | 9.2 Circuit Dash | M–L | The first real game loop and physics. |
| 6 | 9.3 Firewall Defense | L | The largest simulation and balancing effort. |
| 7 | 9.7 Daily Spark | S | Can be slotted in anywhere after step 1. |

**Content dependency:** several games want 10 to 15 questions per course. Courses with 3 to 5 questions will repeat quickly, so growing the question banks (step 2 of the next steps in [ROADMAP.md](ROADMAP.md)) should run in parallel.

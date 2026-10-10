import { useMemo, useState } from 'react';
import type { Question, StudyCourse } from '../../domain/types';
import { badges, bossFor, charge, levelFor, pickMatch, pickRun, playerXp } from '../../engine/games';
import { newSeed } from '../../engine/random';
import type { GameKind } from '../../store/schema';
import { nowIso, useStore } from '../../store/StoreContext';
import { Empty, ProgressBar } from '../components/bits';
import { Mascot } from '../components/Mascot';
import { QuestionView } from '../components/QuestionView';
import { href } from '../router';
import { allCourses } from './Practice';

const GAMES: { kind: GameKind; title: string; blurb: string; minutes: string }[] = [
  { kind: 'run', title: 'Bolt Run', blurb: 'Five questions picked from your due reviews and weak spots. Each right answer moves Bolt one step and charges his battery.', minutes: 'about 3 minutes' },
  { kind: 'match', title: 'Flash Match', blurb: 'Pair each term with its meaning. Good for low-energy moments.', minutes: 'about 2 minutes' },
  { kind: 'boss', title: 'Boss Battle', blurb: 'Take on one exam domain. Three right answers beat the boss; misses cost nothing.', minutes: 'about 3 minutes' },
];

export function ArcadePage() {
  const { state, registry } = useStore();
  const courses = allCourses(registry).filter((c) => c.questions.length >= 3);
  const [courseId, setCourseId] = useState(() => {
    const recent = [...state.attempts].reverse().find((a) => courses.some((c) => c.id === a.courseId));
    return recent?.courseId ?? courses[0]?.id ?? '';
  });
  const course = courses.find((c) => c.id === courseId);
  const xp = playerXp(state, courses);
  const lvl = levelFor(xp);
  const earned = badges(state, courses);
  const domains = course?.blueprint?.domains.filter((d) => course.questions.some((q) => q.domainId === d.id)) ?? [];

  return (
    <div>
      <h1 className="sr-only">Arcade</h1>
      <section className="card hero" aria-labelledby="arc-h">
        <div className="hero-body">
          <div>
            <p className="eyebrow">Arcade with Bolt</p>
            <h2 id="arc-h" style={{ fontSize: '1.45rem' }}>Level {lvl.level}</h2>
            <p className="muted">{lvl.into} of {lvl.span} XP to level {lvl.level + 1}. XP comes from concepts you know, so it grows as you learn.</p>
            <ProgressBar value={lvl.into / lvl.span} label={`Level ${lvl.level} progress`} />
            <p className="small muted" style={{ marginTop: 8 }}>Every game is optional and untimed. Answers count toward mastery and your review schedule.</p>
          </div>
          <Mascot variant="full" size={190} />
        </div>
      </section>

      {courses.length === 0 ? <Empty>No course has enough questions for games yet.</Empty> : (
        <>
          <div className="field">
            <label htmlFor="arc-course">Course</label>
            <select id="arc-course" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div className="grid">
            {GAMES.map((g) => {
              const disabled = !course || (g.kind === 'match' && course.flashcards.length < 3) || (g.kind === 'boss' && domains.length === 0);
              return (
                <section key={g.kind} className="card game-card" aria-labelledby={`g-${g.kind}`}>
                  <Mascot size={44} />
                  <h2 id={`g-${g.kind}`}>{g.title}</h2>
                  <p>{g.blurb}</p>
                  <p className="small muted">{g.minutes}</p>
                  {disabled ? (
                    <p className="small muted">{g.kind === 'match' ? 'Needs a course with at least 3 flashcards.' : 'Needs a course with an exam blueprint.'}</p>
                  ) : g.kind === 'boss' ? (
                    <ul className="stack" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {domains.map((d) => <li key={d.id}><a className="btn" href={href('play', 'boss', course!.id, d.id)}>Fight: {d.name}</a></li>)}
                    </ul>
                  ) : (
                    <a className="btn primary" href={href('play', g.kind, course!.id)}>Play {g.title}</a>
                  )}
                </section>
              );
            })}
          </div>
        </>
      )}

      <section className="card" aria-labelledby="badge-h" style={{ marginTop: 16 }}>
        <h2 id="badge-h">Badges</h2>
        <ul className="badge-grid">
          {earned.map((b) => (
            <li key={b.id} className={b.earned ? 'earned' : ''}>
              <strong>{b.label}</strong>
              <span className="small">{b.earned ? 'Earned' : b.how}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

// ---------- Shared pieces ----------

function useRecorder(course: StudyCourse) {
  const { dispatch } = useStore();
  return {
    answer: (q: Question, correct: boolean, confidence?: 1 | 2 | 3) =>
      dispatch({ type: 'recordAnswer', attempt: { itemId: q.id, courseId: course.id, conceptIds: q.conceptIds, correct, confidence, at: nowIso(), context: 'game' }, difficulty: q.difficulty }),
    finish: (kind: GameKind, correct: number, total: number, won: boolean, domainId?: string) =>
      dispatch({ type: 'recordGame', result: { id: `g-${Date.now().toString(36)}`, kind, courseId: course.id, domainId, at: nowIso(), correct, total, won } }),
  };
}

function Finish({ title, children, again }: { title: string; children: React.ReactNode; again: () => void }) {
  return (
    <section className="card hero" role="status" aria-labelledby="fin-h">
      <div className="hero-body">
        <div>
          <h1 id="fin-h">{title}</h1>
          {children}
          <p className="muted small">Your answers are saved to mastery, and anything you missed comes back in reviews.</p>
          <div className="row">
            <button type="button" className="primary" onClick={again}>Play again</button>
            <a className="btn" href={href('arcade')}>Back to Arcade</a>
          </div>
        </div>
        <Mascot variant="full" size={170} />
      </div>
    </section>
  );
}

export function PlayPage({ kind, courseId, domainId }: { kind?: string; courseId?: string; domainId?: string }) {
  const { registry } = useStore();
  const [round, setRound] = useState(0);
  const course = registry.course(courseId ?? '');
  if (!course) return <Empty>That game is not available. <a href={href('arcade')}>Back to Arcade</a></Empty>;
  const again = () => setRound((r) => r + 1);
  if (kind === 'run') return <RunGame key={round} course={course} again={again} />;
  if (kind === 'match') return <MatchGame key={round} course={course} again={again} />;
  if (kind === 'boss' && domainId) return <BossGame key={round} course={course} domainId={domainId} again={again} />;
  return <Empty>Unknown game. <a href={href('arcade')}>Back to Arcade</a></Empty>;
}

// ---------- Bolt Run ----------

function RunGame({ course, again }: { course: StudyCourse; again: () => void }) {
  const { state } = useStore();
  const rec = useRecorder(course);
  const [seed] = useState(newSeed);
  // Picked once per round so answering does not reshuffle the run.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const qs = useMemo(() => pickRun(course, state, new Date(), seed), [course.id, seed]);
  const [results, setResults] = useState<boolean[]>([]);
  const [answered, setAnswered] = useState(false);
  const idx = results.length - (answered ? 1 : 0);
  const q = qs[idx];
  const steps = results.filter(Boolean).length;
  const battery = charge(results);

  if (!q || (results.length === qs.length && !answered)) {
    return (
      <Finish title={`Run complete: ${steps} of ${qs.length}`} again={again}>
        <p>Battery charge: {battery}. {steps === qs.length ? 'Every answer right. Full charge!' : 'Each run adds to what you know.'}</p>
      </Finish>
    );
  }
  return (
    <article>
      <p className="eyebrow">Bolt Run · {course.title}</p>
      <ol className="run-track" aria-label={`Bolt has moved ${steps} of ${qs.length} steps`}>
        {qs.map((_, i) => (
          <li key={i} className={i < steps ? 'done' : ''}>{i === steps ? <Mascot size={36} /> : <span aria-hidden="true">{i < steps ? '⚡' : ''}</span>}</li>
        ))}
        <li className="goal" aria-hidden="true">🏁</li>
      </ol>
      <p className="small muted">Question {idx + 1} of {qs.length} · battery {battery}</p>
      <div className="card">
        <QuestionView
          key={q.id}
          question={q}
          seed={seed}
          onSubmit={(r, _a, c) => {
            rec.answer(q, r.correct, c);
            setResults([...results, r.correct]);
            setAnswered(true);
          }}
        />
      </div>
      {answered && (
        <button
          type="button"
          className="primary"
          onClick={() => {
            setAnswered(false);
            if (results.length === qs.length) rec.finish('run', results.filter(Boolean).length, qs.length, results.filter(Boolean).length >= Math.ceil(qs.length * 0.6));
          }}
        >
          {results.length === qs.length ? 'See results' : 'Next question'}
        </button>
      )}
    </article>
  );
}

// ---------- Flash Match ----------

function MatchGame({ course, again }: { course: StudyCourse; again: () => void }) {
  const { state, dispatch } = useStore();
  const [seed] = useState(newSeed);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const board = useMemo(() => pickMatch(course, state, new Date(), seed), [course.id, seed]);
  const [selected, setSelected] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [missed, setMissed] = useState<string[]>([]);
  const [msg, setMsg] = useState('Pick a term, then its meaning.');
  const byId = new Map(board.cards.map((c) => [c.id, c]));

  const record = (cardId: string, correct: boolean) => {
    const c = byId.get(cardId)!;
    dispatch({ type: 'recordAnswer', attempt: { itemId: c.id, courseId: course.id, conceptIds: [c.conceptId], correct, at: nowIso(), context: 'game' } });
  };
  const choose = (answerId: string) => {
    if (!selected) return setMsg('Pick a term first.');
    if (answerId === selected) {
      // A card counts as known only if it was matched without a miss.
      if (!missed.includes(selected)) record(selected, true);
      const next = [...matched, selected];
      setMatched(next);
      setSelected(null);
      setMsg(`Matched: ${byId.get(answerId)!.front}.`);
      if (next.length === board.cards.length) dispatch({ type: 'recordGame', result: { id: `g-${Date.now().toString(36)}`, kind: 'match', courseId: course.id, at: nowIso(), correct: board.cards.length - missed.length, total: board.cards.length, won: true } });
    } else {
      if (!missed.includes(selected)) {
        record(selected, false);
        setMissed([...missed, selected]);
      }
      setMsg('Not quite. Try another meaning.');
    }
  };

  if (matched.length === board.cards.length) {
    return (
      <Finish title="Board cleared" again={again}>
        <p>{board.cards.length - missed.length} of {board.cards.length} matched on the first try.</p>
      </Finish>
    );
  }
  return (
    <article>
      <p className="eyebrow">Flash Match · {course.title}</p>
      <ProgressBar value={matched.length / board.cards.length} label="Pairs matched" />
      <p role="status" className="small" style={{ marginTop: 8 }}>{msg}</p>
      <div className="match-board">
        <div>
          <h2 className="small">Terms</h2>
          {board.cards.map((c) => (
            <button key={c.id} type="button" className="match-tile" aria-pressed={selected === c.id} disabled={matched.includes(c.id)} onClick={() => setSelected(c.id)}>
              {c.front}
            </button>
          ))}
        </div>
        <div>
          <h2 className="small">Meanings</h2>
          {board.answers.map((id) => (
            <button key={id} type="button" className="match-tile" disabled={matched.includes(id)} onClick={() => choose(id)}>
              {byId.get(id)!.back}
            </button>
          ))}
        </div>
      </div>
    </article>
  );
}

// ---------- Boss Battle ----------

function BossGame({ course, domainId, again }: { course: StudyCourse; domainId: string; again: () => void }) {
  const rec = useRecorder(course);
  const [seed] = useState(newSeed);
  const boss = useMemo(() => bossFor(course, domainId, seed), [course, domainId, seed]);
  const [results, setResults] = useState<boolean[]>([]);
  const [answered, setAnswered] = useState(false);
  if (!boss) return <Empty>No questions for that domain yet. <a href={href('arcade')}>Back to Arcade</a></Empty>;
  const hits = results.filter(Boolean).length;
  const hp = Math.max(0, boss.hp - hits);
  const idx = results.length - (answered ? 1 : 0);
  const done = !answered && (hp === 0 || results.length === boss.questions.length);

  if (done) {
    return (
      <Finish title={hp === 0 ? 'Boss beaten!' : 'The boss is still standing'} again={again}>
        <p>{hp === 0 ? `You cleared "${boss.name}" in ${results.length} questions.` : `You landed ${hits} of ${boss.hp} hits. Review this domain and come back any time.`}</p>
      </Finish>
    );
  }
  const q = boss.questions[idx]!;
  return (
    <article>
      <p className="eyebrow">Boss Battle · {course.title}</p>
      <section className="card boss" aria-label="Boss health">
        <h1 style={{ fontSize: '1.2rem' }}>Domain boss: {boss.name}</h1>
        <div className="hp" role="meter" aria-label="Boss health" aria-valuemin={0} aria-valuemax={boss.hp} aria-valuenow={hp}>
          {Array.from({ length: boss.hp }, (_, i) => <span key={i} className={i < hp ? 'on' : ''} />)}
        </div>
        <p className="small muted">{hp} hit{hp === 1 ? '' : 's'} left · {boss.questions.length - results.length + (answered ? 1 : 0)} questions available</p>
      </section>
      <div className="card">
        <QuestionView key={q.id} question={q} seed={seed} onSubmit={(r, _a, c) => { rec.answer(q, r.correct, c); setResults([...results, r.correct]); setAnswered(true); }} />
      </div>
      {answered && (
        <button
          type="button"
          className="primary"
          onClick={() => {
            setAnswered(false);
            const nowHits = results.filter(Boolean).length;
            if (nowHits >= boss.hp || results.length === boss.questions.length) rec.finish('boss', nowHits, results.length, nowHits >= boss.hp, domainId);
          }}
        >
          {hits >= boss.hp || results.length === boss.questions.length ? 'See results' : 'Next attack'}
        </button>
      )}
    </article>
  );
}

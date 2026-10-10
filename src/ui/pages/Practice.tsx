import { useEffect, useMemo, useRef, useState } from 'react';
import type { Flashcard, Question, StudyCourse } from '../../domain/types';
import { buildExam, scoreExam, suggestedMinutes, weakDomains, type ExamConfig } from '../../engine/exam';
import { gradeQuestion } from '../../engine/grading';
import { readiness, repeatedMistakes, weakConcepts } from '../../engine/mastery';
import { newSeed, seededShuffle } from '../../engine/random';
import { reviewBatchSize } from '../../engine/recommend';
import { dueCards } from '../../engine/srs';
import type { ExamAttempt } from '../../store/schema';
import { nowIso, useStore } from '../../store/StoreContext';
import { Empty, ProgressBar } from '../components/bits';
import { ConfirmButton } from '../components/ConfirmButton';
import { QuestionView } from '../components/QuestionView';
import { go, href } from '../router';

const ORIGINAL_NOTE = 'Original practice questions written for this app. They are not official, leaked or actual exam questions, and practice scores are not official results.';

function allCourses(registry: ReturnType<typeof useStore>['registry']): StudyCourse[] {
  return registry.entries.map((e) => registry.courseForEntry(e.id)).filter((c, i, arr): c is StudyCourse => !!c && arr.indexOf(c) === i);
}

export function PracticePage() {
  const { state, registry } = useStore();
  const now = new Date();
  const due = dueCards(state.reviews, now);
  const courses = allCourses(registry);
  const history = state.exams.filter((e) => e.finishedAt).sort((a, b) => b.finishedAt!.localeCompare(a.finishedAt!));
  const open = state.exams.filter((e) => !e.finishedAt);

  return (
    <div>
      <h1>Practice Center</h1>
      {open.map((e) => (
        <div key={e.id} className="notice">
          Paused: {registry.course(e.courseId)?.title} ({e.mode}), question {e.current + 1} of {e.questionIds.length}. <a href={href('exam', e.id)}>Resume</a>
        </div>
      ))}
      <section className="card" aria-labelledby="rq-h">
        <h2 id="rq-h">Review queue</h2>
        <p><strong>{due.length}</strong> item{due.length === 1 ? '' : 's'} due now.</p>
        {due.length > 0 ? <a className="btn primary" href={href('review')}>Review {Math.min(due.length, reviewBatchSize(state.profile))} now</a> : <p className="muted small">Nothing due. Answers from lessons and exams are scheduled here automatically.</p>}
      </section>

      <WeakAreas courses={courses} />
      <ExamSetup courses={courses} />

      <section className="card" aria-labelledby="fc-h">
        <h2 id="fc-h">Flashcards</h2>
        <ul>
          {courses.filter((c) => c.flashcards.length).map((c) => (
            <li key={c.id}><a href={href('flashcards', c.id)}>{c.title}</a> ({c.flashcards.length} cards)</li>
          ))}
        </ul>
      </section>

      <section className="card" aria-labelledby="hist-h">
        <h2 id="hist-h">Assessment history</h2>
        {history.length === 0 ? <p className="muted">No finished practice exams yet.</p> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Date</th><th>Course</th><th>Mode</th><th>Score</th></tr></thead>
              <tbody>
                {history.slice(0, 20).map((e) => (
                  <tr key={e.id}>
                    <td>{e.finishedAt!.slice(0, 10)}</td>
                    <td><a href={href('exam', e.id)}>{registry.course(e.courseId)?.title}</a></td>
                    <td>{e.mode}{e.timed ? ', timed' : ''}</td>
                    <td>{Math.round((e.score ?? 0) * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function WeakAreas({ courses }: { courses: StudyCourse[] }) {
  const { state } = useStore();
  const rows = courses.map((c) => ({ c, weak: weakConcepts(c, state.attempts), repeated: repeatedMistakes(state.attempts, c.id).length })).filter((r) => r.weak.length || r.repeated);
  return (
    <section className="card" aria-labelledby="weak-h">
      <h2 id="weak-h">Weak areas</h2>
      {rows.length === 0 ? <p className="muted">No weak concepts yet. They show up after you miss questions.</p> : (
        <ul>
          {rows.slice(0, 5).map(({ c, weak, repeated }) => (
            <li key={c.id}>
              <strong>{c.title}</strong>: {weak.slice(0, 3).map((w) => c.concepts.find((k) => k.id === w.conceptId)?.label).join(', ')}
              {repeated > 0 && ` · ${repeated} repeated mistake${repeated === 1 ? '' : 's'}`} · <a href={href('review', c.id)}>Practise these</a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ExamSetup({ courses }: { courses: StudyCourse[] }) {
  const { state, dispatch } = useStore();
  const eligible = courses.filter((c) => c.questions.length >= 3);
  const [courseId, setCourseId] = useState(eligible.find((c) => c.blueprint)?.id ?? eligible[0]?.id ?? '');
  const course = eligible.find((c) => c.id === courseId);
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState<ExamConfig['difficulty']>('mixed');
  const [mode, setMode] = useState<'practice' | 'exam'>('practice');
  const [timed, setTimed] = useState(false);
  const [minutesInput, setMinutesInput] = useState<number | ''>('');
  if (!course) return null;

  const max = course.questions.length;
  const n = Math.min(count, max);
  const suggested = suggestedMinutes(course, n) ?? Math.ceil(n * 1.4);
  const minutes = minutesInput === '' ? suggested : minutesInput;
  const ready = readiness(course, state.attempts, state.exams);

  const start = (domainIds?: string[], overrideMode?: 'practice' | 'exam') => {
    const seed = newSeed();
    const built = buildExam(course, { count: n, difficulty, mode, timed, minutes, domainIds }, seed);
    const exam: ExamAttempt = {
      id: `ex-${Date.now().toString(36)}`, courseId: course.id, mode: overrideMode ?? mode, timed: !domainIds && timed, minutes: !domainIds && timed ? minutes : undefined,
      startedAt: nowIso(), questionIds: built.questionIds, seed, answers: {}, flagged: [], current: 0, elapsedMs: 0,
    };
    dispatch({ type: 'startExam', exam });
    go('exam', exam.id);
  };

  return (
    <section className="card" aria-labelledby="ex-h">
      <h2 id="ex-h">Exam simulator</h2>
      <p className="small muted">{ORIGINAL_NOTE}</p>
      <div className="field">
        <label htmlFor="ex-course">Course</label>
        <select id="ex-course" value={courseId} onChange={(e) => { setCourseId(e.target.value); setMinutesInput(''); }}>
          {eligible.map((c) => <option key={c.id} value={c.id}>{c.title}{c.blueprint ? '' : ' (no official blueprint)'}</option>)}
        </select>
      </div>
      {course.blueprint && (
        <details>
          <summary className="small">Blueprint: {course.blueprint.domains.length} domains ({course.blueprint.weightsStatus === 'verified' ? 'official weights' : 'equal weights assumed; official weights unpublished'})</summary>
          <ul className="small">{course.blueprint.domains.map((d) => <li key={d.id}>{d.name}: {d.weightLabel ?? `${d.weight}%`}</li>)}</ul>
          {course.blueprint.officialQuestionCount && <p className="small muted">The real exam has {course.blueprint.officialQuestionCount} questions in {course.blueprint.officialMinutes} minutes.</p>}
        </details>
      )}
      <div className="row">
        <div className="field">
          <label htmlFor="ex-count">Questions (max {max})</label>
          <input id="ex-count" type="number" min={1} max={max} value={n} onChange={(e) => setCount(Math.max(1, Number(e.target.value) || 1))} />
        </div>
        <div className="field">
          <label htmlFor="ex-diff">Difficulty</label>
          <select id="ex-diff" value={String(difficulty)} onChange={(e) => setDifficulty(e.target.value === 'mixed' ? 'mixed' : (Number(e.target.value) as 1 | 2 | 3))}>
            <option value="mixed">Mixed</option><option value="1">Easier</option><option value="2">Medium</option><option value="3">Harder</option>
          </select>
        </div>
      </div>
      <fieldset>
        <legend>Mode</legend>
        <label className="choice"><input type="radio" name="ex-mode" checked={mode === 'practice'} onChange={() => setMode('practice')} /> <span>Practice: explanation after each answer</span></label>
        <label className="choice"><input type="radio" name="ex-mode" checked={mode === 'exam'} onChange={() => setMode('exam')} /> <span>Exam: explanations after you submit</span></label>
      </fieldset>
      <label className="choice"><input type="checkbox" checked={timed} onChange={(e) => setTimed(e.target.checked)} /> <span>Timed (optional). You can pause; the clock stops while paused.</span></label>
      {timed && (
        <div className="field">
          <label htmlFor="ex-min">Minutes</label>
          <input id="ex-min" type="number" min={1} value={minutes} onChange={(e) => setMinutesInput(e.target.value === '' ? '' : Math.max(1, Number(e.target.value)))} />
          <p className="small muted">{suggestedMinutes(course, n) ? 'Default matches the official exam pace.' : 'Default is about 1.4 minutes per question (no official pace published).'}</p>
        </div>
      )}
      <button type="button" className="primary" onClick={() => start()}>Start {mode === 'exam' ? 'exam' : 'practice'} ({n} questions)</button>
      {ready.label !== 'not-enough-data' && <p className="small" style={{ marginTop: 8 }}>Readiness for this course: <strong>{ready.label.replace(/-/g, ' ')}</strong>{ready.examAverage !== null && ` (last exams average ${Math.round(ready.examAverage * 100)}%)`}.</p>}
    </section>
  );
}

// ---------------- Exam runner ----------------

export function ExamPage({ examId }: { examId: string }) {
  const { state, registry } = useStore();
  const exam = state.exams.find((e) => e.id === examId);
  const course = exam ? registry.course(exam.courseId) : undefined;
  if (!exam || !course) return <Empty>That exam was not found. <a href={href('practice')}>Back to Practice Center</a></Empty>;
  return exam.finishedAt ? <ExamResults exam={exam} course={course} /> : <ExamRunner exam={exam} course={course} />;
}

function ExamRunner({ exam, course }: { exam: ExamAttempt; course: StudyCourse }) {
  const { dispatch } = useStore();
  const [elapsed, setElapsed] = useState(exam.elapsedMs ?? 0);
  const [paused, setPaused] = useState(false);
  const elapsedRef = useRef(elapsed);
  elapsedRef.current = elapsed;
  const q = course.questions.find((x) => x.id === exam.questionIds[exam.current]);
  const limit = exam.timed && exam.minutes ? exam.minutes * 60_000 : null;
  const update = (patch: Partial<ExamAttempt>) => dispatch({ type: 'updateExam', id: exam.id, patch });

  useEffect(() => {
    if (paused) return;
    const t = window.setInterval(() => setElapsed((e) => e + 1000), 1000);
    return () => window.clearInterval(t);
  }, [paused]);

  // Persist elapsed time periodically and when leaving the page.
  useEffect(() => {
    const t = window.setInterval(() => dispatch({ type: 'updateExam', id: exam.id, patch: { elapsedMs: elapsedRef.current } }), 5000);
    return () => {
      window.clearInterval(t);
      dispatch({ type: 'updateExam', id: exam.id, patch: { elapsedMs: elapsedRef.current } });
    };
  }, [exam.id, dispatch]);

  const unanswered = exam.questionIds.filter((id) => !exam.answers[id]).length;
  const [askSubmit, setAskSubmit] = useState(false);
  const submit = (force = false) => {
    if (!force && unanswered > 0) return setAskSubmit(true);
    const scored = scoreExam(exam, course);
    const at = nowIso();
    if (exam.mode === 'exam') {
      for (const id of exam.questionIds) {
        const qq = course.questions.find((x) => x.id === id);
        const a = exam.answers[id];
        if (!qq) continue;
        dispatch({ type: 'recordAnswer', attempt: { itemId: id, courseId: course.id, conceptIds: qq.conceptIds, correct: !!a && gradeQuestion(qq, a).correct, at, context: 'exam' }, difficulty: qq.difficulty });
      }
    }
    update({ ...scored, finishedAt: at, elapsedMs: elapsedRef.current });
  };

  const timeUp = limit !== null && elapsed >= limit;
  useEffect(() => {
    if (timeUp) submit(true);
    // submit once when time runs out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeUp]);

  if (!q) return <Empty>Question missing from the bank.</Empty>;
  const answer = exam.answers[q.id];
  const practiceAnswered = exam.mode === 'practice' && !!answer;
  const remaining = limit !== null ? Math.max(0, limit - elapsed) : null;
  const fmt = (ms: number) => `${Math.floor(ms / 60_000)}:${String(Math.floor((ms % 60_000) / 1000)).padStart(2, '0')}`;
  const answeredCount = exam.questionIds.filter((id) => exam.answers[id]).length;

  return (
    <article>
      <p className="small muted" style={{ margin: 0 }}>{course.title} · {exam.mode === 'exam' ? 'Exam mode' : 'Practice mode'} · Original practice questions</p>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0 }}>Question {exam.current + 1} of {exam.questionIds.length}</h1>
        {remaining !== null && <span className="timer" aria-label="Time remaining">{paused ? 'Paused · ' : ''}{fmt(remaining)} left</span>}
      </div>
      <ProgressBar value={answeredCount / exam.questionIds.length} label="Questions answered" />
      <p className="small muted">{answeredCount} answered{exam.flagged.length ? ` · ${exam.flagged.length} flagged` : ''}</p>

      {paused ? (
        <div className="card">
          <p>Paused. Your answers and time are saved, so you can leave and come back later.</p>
          <div className="row"><button className="primary" type="button" onClick={() => setPaused(false)}>Resume</button><a className="btn" href={href('practice')}>Leave for now</a></div>
        </div>
      ) : (
        <div className="card">
          {exam.mode === 'practice' ? (
            <QuestionView key={q.id} question={q} seed={exam.seed} value={answer} reviewOnly={practiceAnswered}
              onSubmit={practiceAnswered ? undefined : (r, a, confidence) => {
                update({ answers: { ...exam.answers, [q.id]: a } });
                dispatch({ type: 'recordAnswer', attempt: { itemId: q.id, courseId: course.id, conceptIds: q.conceptIds, correct: r.correct, confidence, at: nowIso(), context: 'exam' }, difficulty: q.difficulty });
              }} />
          ) : (
            <QuestionView key={q.id} question={q} seed={exam.seed} value={answer} onChange={(a) => update({ answers: { ...exam.answers, [q.id]: a } })} />
          )}
        </div>
      )}

      <nav className="row" aria-label="Exam navigation">
        <button type="button" disabled={exam.current === 0} onClick={() => update({ current: exam.current - 1 })}>Previous</button>
        <button type="button" disabled={exam.current + 1 >= exam.questionIds.length} className={practiceAnswered ? 'primary' : ''} onClick={() => update({ current: exam.current + 1 })}>Next</button>
        <button type="button" aria-pressed={exam.flagged.includes(q.id)} onClick={() => update({ flagged: exam.flagged.includes(q.id) ? exam.flagged.filter((x) => x !== q.id) : [...exam.flagged, q.id] })}>
          {exam.flagged.includes(q.id) ? 'Flagged' : 'Flag for review'}
        </button>
        <button type="button" onClick={() => setPaused(true)}>Pause</button>
        <button type="button" className={exam.current + 1 >= exam.questionIds.length ? 'primary' : ''} onClick={() => submit()}>Submit {exam.mode === 'exam' ? 'exam' : 'and see results'}</button>
      </nav>
      {askSubmit && (
        <div className="notice warn row" role="alert">
          <span>{unanswered} question{unanswered === 1 ? ' is' : 's are'} unanswered and will be marked incorrect.</span>
          <button type="button" className="primary" onClick={() => submit(true)}>Submit anyway</button>
          <button type="button" onClick={() => setAskSubmit(false)}>Keep answering</button>
        </div>
      )}
      <details>
        <summary>Jump to a question</summary>
        <div className="row" style={{ marginTop: 8 }}>
          {exam.questionIds.map((id, i) => (
            <button key={id} type="button" className="chip" aria-current={i === exam.current ? 'step' : undefined} aria-label={`Question ${i + 1}${exam.answers[id] ? ', answered' : ''}${exam.flagged.includes(id) ? ', flagged' : ''}`} onClick={() => update({ current: i })}>
              {i + 1}{exam.answers[id] ? ' ✓' : ''}{exam.flagged.includes(id) ? ' ⚑' : ''}
            </button>
          ))}
        </div>
      </details>
      <ConfirmButton className="link" label="Discard attempt" question="Discard this attempt? Its answers are deleted." confirmLabel="Discard" onConfirm={() => { dispatch({ type: 'discardExam', id: exam.id }); go('practice'); }} />
    </article>
  );
}

function ExamResults({ exam, course }: { exam: ExamAttempt; course: StudyCourse }) {
  const { state, dispatch } = useStore();
  const [onlyWrong, setOnlyWrong] = useState(false);
  const pass = (course.blueprint?.passPercent ?? 75) / 100;
  const score = exam.score ?? 0;
  const weak = weakDomains(exam, course);
  const ready = readiness(course, state.attempts, state.exams);
  const questions = exam.questionIds.map((id) => course.questions.find((q) => q.id === id)).filter((q): q is Question => !!q);
  const wrong = questions.filter((q) => !exam.answers[q.id] || !gradeQuestion(q, exam.answers[q.id]!).correct);
  const shown = onlyWrong ? wrong : questions;

  const remediate = () => {
    const seed = newSeed();
    const ids = weak.map((w) => w.id);
    const built = buildExam(course, { count: Math.max(4, Math.min(10, wrong.length * 2)), difficulty: 'mixed', mode: 'practice', timed: false, domainIds: ids }, seed);
    const next: ExamAttempt = { id: `ex-${Date.now().toString(36)}`, courseId: course.id, mode: 'practice', timed: false, startedAt: nowIso(), questionIds: built.questionIds, seed, answers: {}, flagged: [], current: 0, elapsedMs: 0 };
    dispatch({ type: 'startExam', exam: next });
    go('exam', next.id);
  };

  return (
    <article>
      <p><a href={href('practice')}>← Practice Center</a></p>
      <h1>{course.title}: {Math.round(score * 100)}%</h1>
      <p className="small muted">{ORIGINAL_NOTE}</p>
      <div className={`feedback ${score >= pass ? 'ok' : 'no'}`} role="status">
        {score >= pass
          ? `At or above this app's readiness threshold (${Math.round(pass * 100)}%). Readiness: ${ready.label.replace(/-/g, ' ')}.`
          : `Below this app's readiness threshold (${Math.round(pass * 100)}%). The domain results below show where to focus.`}
        {' '}This is not the official cut score.
      </div>
      <section className="card" aria-labelledby="dom-h">
        <h2 id="dom-h">By domain</h2>
        {Object.entries(exam.byDomain ?? {}).map(([id, v]) => {
          const name = course.blueprint?.domains.find((d) => d.id === id)?.name ?? 'General';
          return (
            <div className="bar-row" key={id}>
              <span className="small">{name}</span>
              <ProgressBar value={v.total ? v.correct / v.total : 0} label={`${name} score`} />
              <span className="small">{v.correct}/{v.total}</span>
            </div>
          );
        })}
        {weak.length > 0 ? (
          <>
            <p style={{ marginTop: 8 }}>Focus next on: {weak.map((w) => w.name).join(', ')}.</p>
            <button type="button" className="primary" onClick={remediate}>Practise weak domains</button>
          </>
        ) : (
          <p style={{ marginTop: 8 }}>No domain below the threshold. Retake in a few days with a fresh mix to confirm it sticks.</p>
        )}
        <p className="small muted" style={{ marginTop: 8 }}>
          {score >= pass ? 'Retake advice: one more timed attempt at full length before booking the real exam.' : 'Retake advice: review missed questions and weak domains first, then retake in 2–3 days.'}
        </p>
      </section>
      <section aria-labelledby="rev-h">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2 id="rev-h">Review answers</h2>
          <label className="choice" style={{ margin: 0 }}><input type="checkbox" checked={onlyWrong} onChange={(e) => setOnlyWrong(e.target.checked)} /> Only incorrect ({wrong.length})</label>
        </div>
        {shown.map((q, i) => (
          <div className="card" key={q.id}>
            <QuestionView question={q} seed={exam.seed} value={exam.answers[q.id] ?? emptyFor(q)} reviewOnly label={`Question ${onlyWrong ? i + 1 : exam.questionIds.indexOf(q.id) + 1}`} />
          </div>
        ))}
      </section>
    </article>
  );
}

const emptyFor = (q: Question) =>
  q.kind === 'fill' ? { kind: 'fill' as const, text: '' } : q.kind === 'order' ? { kind: 'order' as const, order: [] } : q.kind === 'match' ? { kind: 'match' as const, mapping: {} } : { kind: 'choice' as const, selected: [] };

// ---------------- Review session ----------------

type ReviewItem = { courseId: string; question?: Question; card?: Flashcard; why: string };

export function ReviewPage({ courseId }: { courseId?: string }) {
  const { state, dispatch, registry } = useStore();
  const [seed] = useState(newSeed);
  const [idx, setIdx] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);

  // Build the queue once per visit so answering does not reshuffle it.
  const queue = useMemo<ReviewItem[]>(() => {
    const now = new Date();
    const limit = reviewBatchSize(state.profile);
    const items: ReviewItem[] = [];
    for (const c of dueCards(state.reviews, now)) {
      if (courseId && c.courseId !== courseId) continue;
      const course = registry.course(c.courseId);
      const question = course?.questions.find((q) => q.id === c.itemId);
      const card = course?.flashcards.find((f) => f.id === c.itemId);
      if (question || card) items.push({ courseId: c.courseId, question, card, why: c.lastResult === 'incorrect' ? 'Missed last time' : 'Scheduled review' });
    }
    if (courseId) {
      // Targeted remediation: a different example for each weak concept.
      const course = registry.course(courseId);
      if (course) {
        const recentIds = new Set(state.attempts.slice(-30).map((a) => a.itemId));
        for (const w of weakConcepts(course, state.attempts)) {
          const candidates = course.questions.filter((q) => q.conceptIds.includes(w.conceptId) && !items.some((i) => i.question?.id === q.id));
          const pick = candidates.find((q) => !recentIds.has(q.id)) ?? candidates[0];
          if (pick) items.push({ courseId, question: pick, why: `Weak concept: ${course.concepts.find((k) => k.id === w.conceptId)?.label}` });
        }
        if (items.length === 0) items.push(...seededShuffle(course.questions, courseId, seed).slice(0, 5).map((q) => ({ courseId, question: q, why: 'Mixed practice' })));
      }
    }
    return items.slice(0, limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  if (queue.length === 0) return <Empty>Nothing to review right now. New items appear as you answer questions. <a href={href('practice')}>Practice Center</a></Empty>;

  if (idx >= queue.length) {
    const correct = results.filter(Boolean).length;
    return (
      <div className="card hero" role="status">
        <h1>Review done</h1>
        <p>{correct} of {results.length} correct. Missed items come back in about 10 minutes; correct ones are spaced further out.</p>
        <div className="row"><a className="btn primary" href={href()}>Back to Home</a><a className="btn" href={href('practice')}>Practice Center</a></div>
      </div>
    );
  }

  const item = queue[idx]!;
  const next = () => { setIdx(idx + 1); setAnswered(false); };
  const record = (itemId: string, conceptIds: string[], correct: boolean, confidence?: 1 | 2 | 3, difficulty?: 1 | 2 | 3, context: 'review' | 'flashcard' = 'review') => {
    setAnswered(true);
    setResults((r) => [...r, correct]);
    dispatch({ type: 'recordAnswer', attempt: { itemId, courseId: item.courseId, conceptIds, correct, confidence, at: nowIso(), context }, difficulty });
  };

  return (
    <article>
      <p className="small muted" style={{ margin: 0 }}>Review {idx + 1} of {queue.length} · {registry.course(item.courseId)?.title} · {item.why}</p>
      <ProgressBar value={idx / queue.length} label="Review progress" />
      <div className="card" style={{ marginTop: 12 }}>
        {item.question ? (
          <QuestionView key={`${idx}-${item.question.id}`} question={item.question} seed={seed} onSubmit={(r, _a, c) => record(item.question!.id, item.question!.conceptIds, r.correct, c, item.question!.difficulty)} />
        ) : (
          <FlashcardView key={`${idx}-${item.card!.id}`} card={item.card!} onGrade={(ok, c) => record(item.card!.id, [item.card!.conceptId], ok, c, undefined, 'flashcard')} />
        )}
      </div>
      {answered && <button type="button" className="primary" onClick={next}>{idx + 1 < queue.length ? 'Next' : 'Finish'}</button>}
      {!answered && <button type="button" className="link" onClick={() => go()}>Stop here. Your progress so far is saved.</button>}
    </article>
  );
}

// ---------------- Flashcards ----------------

function FlashcardView({ card, onGrade }: { card: Flashcard; onGrade: (correct: boolean, confidence: 1 | 2 | 3) => void }) {
  const [shown, setShown] = useState(false);
  const [graded, setGraded] = useState(false);
  return (
    <div>
      <p className="muted small">Flashcard</p>
      <p style={{ fontSize: '1.2rem', fontWeight: 600 }}>{card.front}</p>
      {!shown ? (
        <button type="button" className="primary" onClick={() => setShown(true)}>Show answer</button>
      ) : (
        <>
          <div className="feedback ok"><p style={{ margin: 0 }}>{card.back}</p></div>
          {!graded && (
            <div className="row" style={{ marginTop: 8 }} role="group" aria-label="How well did you know it?">
              <button type="button" onClick={() => { setGraded(true); onGrade(false, 2); }}>Didn't know</button>
              <button type="button" onClick={() => { setGraded(true); onGrade(true, 2); }}>Knew it, with effort</button>
              <button type="button" onClick={() => { setGraded(true); onGrade(true, 3); }}>Knew it easily</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function FlashcardsPage({ courseId }: { courseId: string }) {
  const { state, dispatch, registry } = useStore();
  const course = registry.course(courseId);
  const [idx, setIdx] = useState(0);
  const [graded, setGraded] = useState(false);
  const deck = useMemo(() => {
    if (!course) return [];
    const now = Date.now();
    const dueFirst = (f: Flashcard) => {
      const r = state.reviews[`${course.id}:${f.id}`];
      return r ? new Date(r.due).getTime() - now : -Infinity; // never-seen cards first, then most overdue
    };
    return [...course.flashcards].sort((a, b) => dueFirst(a) - dueFirst(b));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);
  if (!course || deck.length === 0) return <Empty>No flashcards for this course. <a href={href('practice')}>Practice Center</a></Empty>;
  if (idx >= deck.length) return <div className="card hero" role="status"><h1>Deck done</h1><p>{deck.length} cards reviewed. They are scheduled for spaced review.</p><a className="btn primary" href={href('practice')}>Practice Center</a></div>;
  const card = deck[idx]!;
  return (
    <article>
      <p className="small muted">{course.title} · card {idx + 1} of {deck.length}</p>
      <ProgressBar value={idx / deck.length} label="Deck progress" />
      <div className="card" style={{ marginTop: 12 }}>
        <FlashcardView key={card.id} card={card} onGrade={(ok, c) => { setGraded(true); dispatch({ type: 'recordAnswer', attempt: { itemId: card.id, courseId: course.id, conceptIds: [card.conceptId], correct: ok, confidence: c, at: nowIso(), context: 'flashcard' } }); }} />
      </div>
      {graded && <button type="button" className="primary" onClick={() => { setIdx(idx + 1); setGraded(false); }}>Next card</button>}
    </article>
  );
}

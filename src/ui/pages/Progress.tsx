import { courseMastery, type MasteryLevel } from '../../engine/mastery';
import { dueCards, upcomingCards } from '../../engine/srs';
import { useStore } from '../../store/StoreContext';
import { Empty, ProgressBar, StatusPill } from '../components/bits';
import { useStatuses } from '../hooks';
import { href } from '../router';

const LEVEL: Record<MasteryLevel, string> = { none: 'Not started', learning: 'Learning', familiar: 'Familiar', mastered: 'Mastered' };
const TREND = { up: '↑ improving', down: '↓ slipping', flat: '' };

export function ProgressPage() {
  const { state, registry } = useStore();
  const status = useStatuses();
  const now = new Date();
  const enrolled = Object.keys(state.courses).map((id) => registry.entry(id)).filter((e) => !!e);
  const touched = [...new Set(state.attempts.map((a) => a.courseId))].map((id) => registry.course(id)).filter((c) => !!c);
  const minutes = state.sessions.reduce((s, x) => s + x.minutes, 0);
  const byDay = new Map<string, number>();
  for (const a of state.attempts) byDay.set(a.at.slice(0, 10), (byDay.get(a.at.slice(0, 10)) ?? 0) + 1);
  const days = [...byDay.entries()].sort().slice(-14);
  const maxDay = Math.max(1, ...days.map(([, n]) => n));
  const exams = state.exams.filter((e) => e.finishedAt);
  const lowConfidenceRight = state.attempts.filter((a) => a.correct && a.confidence === 1).length;
  const confidentWrong = state.attempts.filter((a) => !a.correct && a.confidence === 3).length;

  return (
    <div>
      <h1>Progress</h1>
      <div className="grid">
        <div className="card"><h2>Answers</h2><p><strong>{state.attempts.length}</strong> total · {state.attempts.filter((a) => a.correct).length} correct</p></div>
        <div className="card"><h2>Study time</h2><p><strong>{minutes}</strong> minutes in timed sessions</p><p className="small muted">Only sessions you start with the timer are counted.</p></div>
        <div className="card"><h2>Review backlog</h2><p><strong>{dueCards(state.reviews, now).length}</strong> due · {upcomingCards(state.reviews, now, 7).length} in the next 7 days</p></div>
        <div className="card"><h2>Confidence</h2><p className="small">{lowConfidenceRight} correct guesses · {confidentWrong} confident misses</p><p className="small muted">Confident misses point to misconceptions worth reviewing.</p></div>
      </div>

      <section className="card" aria-labelledby="act-h">
        <h2 id="act-h">Questions answered per day (last 14 active days)</h2>
        {days.length === 0 ? <p className="muted">No activity yet.</p> : days.map(([d, n]) => (
          <div className="bar-row" key={d}><span className="small">{d}</span><ProgressBar value={n / maxDay} label={`${d}: ${n} answers`} /><span className="small">{n}</span></div>
        ))}
      </section>

      <section aria-labelledby="mast-h">
        <h2 id="mast-h">Mastery by skill</h2>
        {touched.length === 0 && <Empty>Mastery appears after you answer questions in a course.</Empty>}
        {touched.map((c) => (
          <details className="card" key={c!.id} open={touched.length <= 2}>
            <summary>{c!.title}</summary>
            {courseMastery(c!, state.attempts).map((m) => (
              <div className="bar-row" key={m.conceptId}>
                <span className="small">{c!.concepts.find((k) => k.id === m.conceptId)?.label}</span>
                <ProgressBar value={m.score} label={`${m.conceptId} mastery`} />
                <span className="small" title={`${m.attempts} attempts`}>{LEVEL[m.level]} {TREND[m.trend]}</span>
              </div>
            ))}
            <a href={href('review', c!.id)}>Practise weak concepts</a>
          </details>
        ))}
      </section>

      <section className="card" aria-labelledby="comp-h">
        <h2 id="comp-h">Course status</h2>
        {enrolled.length === 0 ? <p className="muted">No courses yet.</p> : (
          <ul style={{ listStyle: 'none', padding: 0 }}>{enrolled.map((e) => <li key={e!.id} className="row" style={{ justifyContent: 'space-between' }}><a href={href('course', e!.id)}>{e!.title}</a><StatusPill status={status(e!)} /></li>)}</ul>
        )}
        <p className="small muted">"Practice assessment passed" and "Demonstrated mastery" are app results. Only "External credential recorded" refers to a provider-issued credential, and only as you reported it.</p>
      </section>

      <section className="card" aria-labelledby="eh-h">
        <h2 id="eh-h">Assessment history</h2>
        {exams.length === 0 ? <p className="muted">No practice exams yet.</p> : (
          <ul>{exams.map((e) => <li key={e.id}><a href={href('exam', e.id)}>{e.finishedAt!.slice(0, 10)} · {registry.course(e.courseId)?.title}</a>: {Math.round((e.score ?? 0) * 100)}% ({e.mode})</li>)}</ul>
        )}
      </section>
    </div>
  );
}

import { personalizePath, nextAction } from '../../engine/recommend';
import { dueCards, upcomingCards } from '../../engine/srs';
import { useStore } from '../../store/StoreContext';
import { Empty, ProgressBar } from '../components/bits';
import { useLessonProgress } from '../hooks';
import { go, href } from '../router';

export function HomePage() {
  const { state, registry } = useStore();
  const now = new Date();
  const action = nextAction(state, registry, now);
  const progress = useLessonProgress();

  const act = () => {
    switch (action.kind) {
      case 'onboard': return go('onboarding');
      case 'resume-exam': return go('exam', action.examId);
      case 'review': return go('review');
      case 'continue': return go('learn', action.entryId);
      case 'start': return go('course', action.entryId);
      case 'exam': return go('practice');
      case 'browse': return go('catalog');
    }
  };

  const active = Object.values(state.courses)
    .filter((c) => !c.external)
    .sort((a, b) => (b.lastStudiedAt ?? b.enrolledAt).localeCompare(a.lastStudiedAt ?? a.enrolledAt))
    .slice(0, 5);
  const due = dueCards(state.reviews, now).length;
  const week = upcomingCards(state.reviews, now, 7).length;
  const recentExams = state.exams.filter((e) => e.finishedAt).sort((a, b) => b.finishedAt!.localeCompare(a.finishedAt!)).slice(0, 3);
  const plan = state.plans.find((p) => p.id === state.activePlanId);
  const planItems = plan ? personalizePath(plan.steps, state, registry, plan.overrides) : [];
  const planCounted = planItems.filter((i) => i.recommended || i.status !== 'not-started');
  const planDone = planCounted.filter((i) => !['not-started', 'in-progress'].includes(i.status)).length;

  const weekAgo = new Date(now.getTime() - 7 * 86_400_000).toISOString();
  const answeredThisWeek = state.attempts.filter((a) => a.at >= weekAgo).length;
  const correctThisWeek = state.attempts.filter((a) => a.at >= weekAgo && a.correct).length;
  const minutesThisWeek = state.sessions.filter((s) => s.start >= weekAgo).reduce((s, x) => s + x.minutes, 0);

  return (
    <div>
      <h1 className="sr-only">Learning Command Center</h1>
      <section className="card hero" aria-labelledby="next-h">
        <p className="muted small" style={{ margin: 0 }}>Your next step</p>
        <h2 id="next-h" style={{ fontSize: '1.35rem' }}>{action.label}</h2>
        <p>{action.reason}</p>
        <button type="button" className="primary" onClick={act}>Start now</button>
      </section>

      {(answeredThisWeek > 0 || minutesThisWeek > 0) && (
        <p className="notice" role="status">
          This week: {answeredThisWeek} question{answeredThisWeek === 1 ? '' : 's'} answered ({correctThisWeek} correct)
          {minutesThisWeek > 0 && `, ${minutesThisWeek} minutes in timed sessions`}.
        </p>
      )}

      <div className="grid">
        <section className="card" aria-labelledby="cont-h">
          <h2 id="cont-h">Continue learning</h2>
          {active.length === 0 ? (
            <p className="muted">Nothing started yet. <a href={href('catalog')}>Browse the catalog</a>.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }} className="stack">
              {active.map((c) => {
                const e = registry.entry(c.courseId);
                if (!e) return null;
                const p = progress(c.courseId);
                return (
                  <li key={c.courseId}>
                    <a href={href(registry.courseForEntry(e.id) ? 'learn' : 'course', e.id)}>{e.title}</a>
                    <ProgressBar value={p} label={`${e.title} lesson progress`} />
                    <span className="small muted">{Math.round(p * 100)}% of lessons</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="card" aria-labelledby="rev-h">
          <h2 id="rev-h">Reviews</h2>
          <p><strong>{due}</strong> due now · {week} more in the next 7 days</p>
          {due > 0 ? <a className="btn" href={href('review')}>Review now</a> : <p className="muted small">Answer questions in lessons and they will come back here on a schedule.</p>}
        </section>

        <section className="card" aria-labelledby="res-h">
          <h2 id="res-h">Recent practice results</h2>
          {recentExams.length === 0 ? (
            <p className="muted">No practice exams yet. <a href={href('practice')}>Open the Practice Center</a>.</p>
          ) : (
            <ul>
              {recentExams.map((e) => (
                <li key={e.id}>
                  <a href={href('exam', e.id)}>{registry.course(e.courseId)?.title ?? 'Exam'}</a>: {Math.round((e.score ?? 0) * 100)}% ({e.mode})
                </li>
              ))}
            </ul>
          )}
          <p className="small muted">App practice results, not official exam scores.</p>
        </section>

        <section className="card" aria-labelledby="path-h">
          <h2 id="path-h">Career path</h2>
          {plan ? (
            <>
              <p>{plan.title}: {planDone} of {planCounted.length} recommended courses done</p>
              <ProgressBar value={planCounted.length ? planDone / planCounted.length : 0} label="Career path progress" />
              <p style={{ marginTop: 8 }}><a href={href('paths')}>View or change your path</a></p>
            </>
          ) : (
            <Empty>No active path. <a href={href('paths')}>Choose one</a>.</Empty>
          )}
        </section>
      </div>
    </div>
  );
}

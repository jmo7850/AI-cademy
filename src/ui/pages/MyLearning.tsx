import { useStore } from '../../store/StoreContext';
import { Empty, ProgressBar, StatusPill } from '../components/bits';
import { useLessonProgress, useStatuses } from '../hooks';
import { href } from '../router';

export function MyLearningPage() {
  const { state, registry } = useStore();
  const status = useStatuses();
  const progress = useLessonProgress();
  const enrolled = Object.values(state.courses).map((c) => ({ c, e: registry.entry(c.courseId) })).filter((x) => !!x.e);
  const bookmarked = enrolled.filter((x) => x.c.bookmarked);

  return (
    <div>
      <h1>My Learning</h1>
      <section aria-labelledby="enr-h">
        <h2 id="enr-h">Enrolled courses ({enrolled.length})</h2>
        {enrolled.length === 0 && <Empty>You have not added any courses. <a href={href('catalog')}>Browse the catalog</a> or <a href={href('paths')}>pick a career path</a>.</Empty>}
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {enrolled.map(({ c, e }) => {
            const hasLessons = !!registry.courseForEntry(e!.id)?.lessons.length;
            return (
              <li key={c.courseId} className="card">
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <a href={href('course', e!.id)}><strong>{e!.title}</strong></a>
                  <StatusPill status={status(e!)} />
                </div>
                <ProgressBar value={progress(e!.id)} label={`${e!.title} progress`} />
                <div className="row small" style={{ marginTop: 6 }}>
                  {hasLessons && <a className="btn" href={href('learn', e!.id)}>{c.position ? 'Resume' : 'Start'}</a>}
                  {c.external && <span className="badge b-verified">Credential recorded {c.external.earnedOn}</span>}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
      <section aria-labelledby="bm-h">
        <h2 id="bm-h">Bookmarked ({bookmarked.length})</h2>
        {bookmarked.length === 0 ? <p className="muted">Bookmark courses from their catalog page to find them here.</p> : (
          <ul>{bookmarked.map(({ e }) => <li key={e!.id}><a href={href('course', e!.id)}>{e!.title}</a></li>)}</ul>
        )}
      </section>
      <section aria-labelledby="pl-h">
        <h2 id="pl-h">Custom learning plans ({state.plans.length})</h2>
        {state.plans.length === 0 ? <p className="muted">Create one from <a href={href('paths')}>Career Paths</a>.</p> : (
          <ul>{state.plans.map((p) => <li key={p.id}>{p.title}{p.id === state.activePlanId && ' (active)'} · {p.steps.length} steps · <a href={href('paths')}>Edit</a></li>)}</ul>
        )}
      </section>
    </div>
  );
}

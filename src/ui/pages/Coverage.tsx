import { examCoverage } from '../../engine/coverage';
import { useStore } from '../../store/StoreContext';
import { href } from '../router';

export function CoveragePage({ entryId }: { entryId: string }) {
  const { registry } = useStore();
  const entry = registry.entry(entryId);
  const course = registry.courseForEntry(entryId);
  if (!entry || !course?.blueprint) {
    return <div className="card"><h1>No coverage view</h1><p>This entry has no published exam outline in the app.</p><a href={href('catalog')}>Course Catalog</a></div>;
  }
  const rows = examCoverage(course);
  const b = course.blueprint;
  return (
    <article>
      <p><a href={href('course', entryId)}>← {entry.title}</a></p>
      <h1>What this course covers</h1>
      <p>
        The exam outline has {rows.length} domains. This shows, for each one, how much of it Poqeni teaches and tests.
        Weights {b.weightsStatus === 'verified' ? 'come from the published exam guide' : 'are assumed equal because the official weights were not published on the page we checked'}.
        {b.sourceUrl && <> <a href={b.sourceUrl} target="_blank" rel="noreferrer noopener">Official exam guide</a>.</>}
      </p>
      <div className="table-wrap">
        <table>
          <thead><tr><th scope="col">Domain</th><th scope="col">Exam weight</th><th scope="col">In-app lessons</th><th scope="col">Practice questions</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <th scope="row">{r.name}</th>
                <td>{r.weight}%</td>
                <td>
                  {r.lessons.length === 0 ? 'None yet. Study this outside Poqeni.' : (
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {r.lessons.map((l) => <li key={l.id}><a href={href('learn', entryId, l.id)}>{l.title}</a></li>)}
                    </ul>
                  )}
                </td>
                <td>{r.questions} ({Math.round(r.share * 100)}% of the bank)</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="small muted">All {course.questions.length} questions are original practice questions written for Poqeni. They are not official exam questions, and a high score does not guarantee a pass.</p>
    </article>
  );
}

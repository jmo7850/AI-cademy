import { useMemo, useState } from 'react';
import type { CatalogEntry, CredentialType } from '../../domain/types';
import { credentialTypeLabel, isStale, providerLabel, searchCatalog, tradeOff } from '../../engine/catalogFilter';
import { readiness } from '../../engine/mastery';
import { nowIso, useStore } from '../../store/StoreContext';
import { EntryMeta, FactLine, hoursText, StatusPill } from '../components/bits';
import { useStatuses } from '../hooks';
import { go, href } from '../router';

function toggle<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

export function costSummary(e: CatalogEntry): string {
  const learn = e.learningCost.value === 'free' ? 'Free to learn' : e.learningCost.value === 'mixed' ? 'Free and paid study options' : 'Paid course';
  const fee = e.exam?.feeUSD?.value;
  const cred = e.credentialFree.value ? 'free credential' : fee ? `exam $${fee}` : 'paid exam (price varies by region)';
  return `${learn} · ${cred}`;
}

export function CatalogPage() {
  const { registry } = useStore();
  const status = useStatuses();
  const [text, setText] = useState('');
  const [providers, setProviders] = useState<string[]>([]);
  const [types, setTypes] = useState<CredentialType[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [includeRetired, setIncludeRetired] = useState(false);
  const results = useMemo(
    () => searchCatalog(registry.entries, { text, providers, types, categories, includeRetired }),
    [registry.entries, text, providers, types, categories, includeRetired],
  );

  return (
    <div>
      <h1>Course Catalog</h1>
      <p className="muted">Courses, credentials and projects from several providers. Each fact is labelled verified, unverified or estimate.</p>
      <div className="card">
        <div className="field">
          <label htmlFor="cat-q">Search</label>
          <input id="cat-q" type="search" placeholder="e.g. Bedrock, AI-901, agents" value={text} onChange={(e) => setText(e.target.value)} style={{ width: '100%' }} />
        </div>
        <details>
          <summary>Filters{providers.length + types.length + categories.length ? ` (${providers.length + types.length + categories.length} on)` : ''}</summary>
          <p className="small muted" style={{ marginTop: 8 }}>Provider</p>
          <div className="row">
            {Object.entries(providerLabel).map(([k, label]) => (
              <button key={k} type="button" className="chip" aria-pressed={providers.includes(k)} onClick={() => setProviders(toggle(providers, k))}>{label}</button>
            ))}
          </div>
          <p className="small muted" style={{ marginTop: 8 }}>Credential type</p>
          <div className="row">
            {(Object.keys(credentialTypeLabel) as CredentialType[]).map((k) => (
              <button key={k} type="button" className="chip" aria-pressed={types.includes(k)} onClick={() => setTypes(toggle(types, k))}>{credentialTypeLabel[k]}</button>
            ))}
          </div>
          <p className="small muted" style={{ marginTop: 8 }}>Subject</p>
          <div className="row">
            {['ai', 'cloud', 'programming', 'career'].map((k) => (
              <button key={k} type="button" className="chip" aria-pressed={categories.includes(k)} onClick={() => setCategories(toggle(categories, k))}>{k}</button>
            ))}
          </div>
          <label className="choice" style={{ marginTop: 8 }}>
            <input type="checkbox" checked={includeRetired} onChange={(e) => setIncludeRetired(e.target.checked)} /> Show retired credentials
          </label>
        </details>
      </div>
      <p className="small muted" role="status">{results.length} result{results.length === 1 ? '' : 's'}</p>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {results.map((e) => (
          <li key={e.id} className="card">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <h2 style={{ margin: 0 }}><a href={href('course', e.id)}>{e.title}</a></h2>
              <StatusPill status={status(e)} />
            </div>
            <EntryMeta entry={e} />
            <p className="small" style={{ marginTop: 6 }}>{costSummary(e)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function EntryPage({ entryId }: { entryId: string }) {
  const { state, dispatch, registry } = useStore();
  const status = useStatuses();
  const e = registry.entry(entryId);
  const [extOpen, setExtOpen] = useState(false);
  if (!e) return <div className="card"><h1>Not found</h1><p>No catalog entry with that id.</p><a href={href('catalog')}>Back to catalog</a></div>;

  const progress = state.courses[e.id];
  const course = registry.courseForEntry(e.id);
  const st = status(e);
  const prereqs = (e.prerequisiteIds ?? []).map((id) => registry.entry(id)).filter((x): x is CatalogEntry => !!x);
  const unmet = prereqs.filter((p) => ['not-started', 'in-progress'].includes(status(p)));
  const isCredential = e.credentialType !== 'independent-assessment' && e.credentialType !== 'portfolio-project';
  const stale = isStale(e, state.recheckedOn[e.id], new Date());
  const ready = course?.blueprint ? readiness(course, state.attempts, state.exams) : null;

  const start = () => {
    dispatch({ type: 'enroll', entryId: e.id, now: nowIso() });
    if (course) go('learn', e.id);
  };

  return (
    <article>
      <p><a href={href('catalog')}>← Catalog</a></p>
      <h1>{e.title}</h1>
      <EntryMeta entry={e} recheckedOn={state.recheckedOn[e.id]} />
      <div className="row" style={{ margin: '12px 0' }}>
        <StatusPill status={st} />
        {course ? (
          <button type="button" className="primary" onClick={start}>{progress ? 'Continue studying' : 'Start studying'}</button>
        ) : !progress ? (
          <button type="button" className="primary" onClick={start}>Add to My Learning</button>
        ) : null}
        <button type="button" aria-pressed={!!progress?.bookmarked} onClick={() => dispatch({ type: 'toggleBookmark', entryId: e.id, now: nowIso() })}>
          {progress?.bookmarked ? 'Bookmarked' : 'Bookmark'}
        </button>
        {e.credentialType === 'portfolio-project' && <a className="btn" href={href('projects')}>Open Project Lab</a>}
      </div>

      {unmet.length > 0 && (
        <div className="notice warn">
          Suggested first: {unmet.map((p, i) => <span key={p.id}>{i > 0 && ', '}<a href={href('course', p.id)}>{p.title}</a></span>)}. You can start anyway.
        </div>
      )}
      {e.availability.value === 'retired' && <div className="notice warn">{e.availability.note ?? 'This credential is retired.'}</div>}
      {stale && <div className="notice warn">These facts were last checked over 90 days ago. Confirm them on the official page before paying or booking.</div>}

      <section className="card">
        <h2>What it proves</h2>
        <p>{e.proves}</p>
        <p className="muted small">{tradeOff(e)}</p>
        <h3>Career value</h3>
        <p>{e.careerValue}</p>
      </section>

      <section className="card">
        <h2>Key facts</h2>
        <div className="table-wrap">
          <table>
            <tbody>
              <FactLine label="Study time" fact={e.studyHours} checkedOn={e.checkedOn} render={(v) => hoursText(v as number)} />
              <FactLine label="Learning materials" fact={e.learningCost} checkedOn={e.checkedOn} render={(v) => ({ free: 'Free', paid: 'Paid', mixed: 'Free and paid options' })[v as string] ?? String(v)} />
              <FactLine label="Credential cost" fact={e.credentialFree} checkedOn={e.checkedOn} render={(v) => (v ? 'Free' : 'Paid')} />
              <FactLine label="Exam code" fact={e.exam?.code} checkedOn={e.checkedOn} />
              <FactLine label="Exam fee (USD)" fact={e.exam?.feeUSD} checkedOn={e.checkedOn} render={(v) => (v === null ? 'Not published' : `$${v}`)} />
              <FactLine label="Exam length" fact={e.exam?.minutes} checkedOn={e.checkedOn} render={(v) => `${v} minutes`} />
              <FactLine label="Questions" fact={e.exam?.questions} checkedOn={e.checkedOn} />
              <FactLine label="Proctored exam" fact={e.exam?.proctored} checkedOn={e.checkedOn} render={(v) => (v ? 'Yes' : 'No')} />
              <FactLine label="Passing score" fact={e.exam?.passing} checkedOn={e.checkedOn} />
              <FactLine label="Valid for" fact={e.exam?.validity} checkedOn={e.checkedOn} />
              <FactLine label="Availability" fact={e.availability} checkedOn={e.checkedOn} render={(v) => ({ available: 'Available', retired: 'Retired', unknown: 'Unknown' })[v as string] ?? String(v)} />
              <tr><th scope="row">Programming required</th><td>{e.programmingRequired ? 'Yes' : 'No'}</td></tr>
              <tr><th scope="row">Hands-on</th><td>{e.handsOn ? 'Yes' : 'No'}</td></tr>
            </tbody>
          </table>
        </div>
        {e.prerequisites.length > 0 && <p style={{ marginTop: 8 }}><strong>Prerequisites:</strong> {e.prerequisites.join(' ')}</p>}
      </section>

      <section className="card">
        <h2>Objectives and assessed skills</h2>
        <ul>{e.objectives.map((o) => <li key={o}>{o}</li>)}</ul>
        {course?.blueprint && (
          <p className="small muted">
            Practice exam domains follow {course.blueprint.weightsStatus === 'verified' ? 'the published weights' : 'app-assumed equal weights (official weights not published on the page we checked)'}.
          </p>
        )}
        {ready && ready.label !== 'not-enough-data' && <p>Practice readiness: <strong>{ready.label.replace(/-/g, ' ')}</strong>.</p>}
      </section>

      <section className="card">
        <h2>Official links and sources</h2>
        <ul>
          {e.officialUrl && <li><a href={e.officialUrl} target="_blank" rel="noreferrer">Official page</a></li>}
          {e.registrationUrl && e.registrationUrl !== e.officialUrl && <li><a href={e.registrationUrl} target="_blank" rel="noreferrer">Enrol or register</a></li>}
          {e.sourceUrl && <li><a href={e.sourceUrl} target="_blank" rel="noreferrer">Source used for these facts</a></li>}
        </ul>
        {e.checkedOn && <p className="small muted">Official facts last checked {e.checkedOn}{state.recheckedOn[e.id] ? `; you re-checked them ${state.recheckedOn[e.id]!.slice(0, 10)}` : ''}.</p>}
        {e.origin === 'official' && (
          <button type="button" onClick={() => dispatch({ type: 'recheck', entryId: e.id, date: nowIso() })}>I checked the official page today</button>
        )}
        {e.origin === 'app' && <p className="small muted">App-authored learning content with original practice questions.</p>}
        {e.origin === 'user' && <p className="small muted">Imported by you. Not verified by this app.</p>}
      </section>

      {progress && !course && e.credentialType !== 'portfolio-project' && (
        <section className="card">
          <h2>Provider course</h2>
          <p>This course is studied on the provider's site. Mark it finished here when you complete it.</p>
          <label className="choice">
            <input type="checkbox" checked={progress.completedLessons.includes('external-course')} onChange={(ev) => dispatch({ type: 'markProviderCourseDone', entryId: e.id, done: ev.target.checked, now: nowIso() })} />
            I finished this course
          </label>
        </section>
      )}

      {progress && isCredential && (
        <section className="card">
          <h2>External credential</h2>
          <p className="small muted">Finishing study here does not mean you earned the credential. Record it only after the provider issues it. The app stores what you enter; it cannot verify it.</p>
          {progress.external ? (
            <div>
              <p>Recorded: earned {progress.external.earnedOn}{progress.external.credentialId ? `, ID ${progress.external.credentialId}` : ''}.</p>
              {progress.external.verificationUrl && <p><a href={progress.external.verificationUrl} target="_blank" rel="noreferrer">Provider verification link</a></p>}
              <button type="button" onClick={() => dispatch({ type: 'recordExternal', entryId: e.id, external: undefined })}>Remove record</button>
            </div>
          ) : extOpen ? (
            <ExternalForm onSave={(ext) => { dispatch({ type: 'recordExternal', entryId: e.id, external: ext }); setExtOpen(false); }} onCancel={() => setExtOpen(false)} />
          ) : (
            <button type="button" onClick={() => setExtOpen(true)}>Record an earned credential</button>
          )}
        </section>
      )}

      {e.nextSteps.length > 0 && (
        <section className="card">
          <h2>Recommended next steps</h2>
          <ul>
            {e.nextSteps.map((id) => registry.entry(id)).filter(Boolean).map((n) => (
              <li key={n!.id}><a href={href('course', n!.id)}>{n!.title}</a></li>
            ))}
          </ul>
        </section>
      )}

      {progress && (
        <button type="button" className="link" onClick={() => { if (confirm('Remove this from My Learning? Your answer history is kept.')) dispatch({ type: 'unenroll', entryId: e.id }); }}>
          Remove from My Learning
        </button>
      )}
    </article>
  );
}

function ExternalForm({ onSave, onCancel }: { onSave: (x: { earnedOn: string; credentialId?: string; verificationUrl?: string }) => void; onCancel: () => void }) {
  const [earnedOn, setEarnedOn] = useState('');
  const [credentialId, setCredentialId] = useState('');
  const [url, setUrl] = useState('');
  const urlOk = !url || /^https:\/\//.test(url);
  return (
    <form onSubmit={(ev) => { ev.preventDefault(); if (earnedOn && urlOk) onSave({ earnedOn, credentialId: credentialId || undefined, verificationUrl: url || undefined }); }}>
      <div className="field"><label htmlFor="ext-date">Date earned</label><input id="ext-date" type="date" required value={earnedOn} onChange={(e) => setEarnedOn(e.target.value)} /></div>
      <div className="field"><label htmlFor="ext-id">Credential ID (optional)</label><input id="ext-id" type="text" value={credentialId} onChange={(e) => setCredentialId(e.target.value)} /></div>
      <div className="field">
        <label htmlFor="ext-url">Verification link from the provider (optional)</label>
        <input id="ext-url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} aria-invalid={!urlOk} aria-describedby="ext-url-help" />
        <p id="ext-url-help" className="small muted">{urlOk ? 'Must start with https://' : 'This link needs to start with https://'}</p>
      </div>
      <div className="row"><button className="primary" type="submit">Save record</button><button type="button" onClick={onCancel}>Cancel</button></div>
    </form>
  );
}

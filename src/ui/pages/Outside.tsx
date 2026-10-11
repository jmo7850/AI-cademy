import { useMemo, useState } from 'react';
import type { CatalogEntry } from '../../domain/types';
import { outsideStatus, pickReturnCheck, RETURN_CHECK_PASS, returnCheckPlan, type OutsideStatus } from '../../engine/outside';
import { newSeed } from '../../engine/random';
import { nowIso, useStore } from '../../store/StoreContext';
import { hoursText, FactBadge } from '../components/bits';
import { QuestionView } from '../components/QuestionView';
import { ProgressBar } from '../components/bits';
import { go, href } from '../router';

const MAX_TEXT = 500;

/** A note and/or an https link. Poqeni keeps it for the learner; it is never checked or counted as proof. */
export function EvidenceForm({ idPrefix, initial, onSave, onCancel }: {
  idPrefix: string;
  initial?: { note?: string; url?: string };
  onSave: (v: { note?: string; url?: string }) => void;
  onCancel?: () => void;
}) {
  const [note, setNote] = useState(initial?.note ?? '');
  const [url, setUrl] = useState(initial?.url ?? '');
  const urlOk = !url || /^https:\/\//.test(url);
  const empty = !note.trim() && !url.trim();
  return (
    <form onSubmit={(ev) => { ev.preventDefault(); if (!empty && urlOk) onSave({ note: note.trim() || undefined, url: url.trim() || undefined }); }}>
      <div className="field">
        <label htmlFor={`${idPrefix}-note`}>What you did or learned (optional)</label>
        <textarea id={`${idPrefix}-note`} rows={3} maxLength={MAX_TEXT} value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor={`${idPrefix}-url`}>Link to your work or certificate page (optional)</label>
        <input id={`${idPrefix}-url`} type="url" value={url} onChange={(e) => setUrl(e.target.value)} aria-invalid={!urlOk} aria-describedby={`${idPrefix}-help`} />
        <p id={`${idPrefix}-help`} className="small muted">{urlOk ? 'Must start with https://' : 'This link needs to start with https://'}</p>
      </div>
      <div className="row">
        <button className="primary" type="submit" disabled={empty || !urlOk}>Save</button>
        {onCancel && <button type="button" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}

export function EvidenceView({ value }: { value: { note?: string; url?: string; addedOn: string } }) {
  return (
    <div>
      {value.note && <p style={{ whiteSpace: 'pre-wrap' }}>{value.note}</p>}
      {value.url && <p><a href={value.url} target="_blank" rel="noreferrer noopener">{value.url}</a></p>}
      <p className="small muted">Added {value.addedOn.slice(0, 10)}. Poqeni keeps this for you. It is not checked.</p>
    </div>
  );
}

/** Plain-word status for a course studied elsewhere; nothing for courses Poqeni teaches itself. */
export function OutsideBadge({ entry }: { entry: CatalogEntry }) {
  const { state, registry } = useStore();
  if (registry.courseForEntry(entry.id) || entry.credentialType === 'portfolio-project') return null;
  const st = outsideStatus(state.courses[entry.id]);
  if (st.level === 'none') return null;
  return <span className={`badge ${st.level === 'check-passed' ? 'b-verified' : 'b-unverified'}`}>{st.label}</span>;
}

export function OutsideStatusLine({ status }: { status: OutsideStatus }) {
  if (status.lines.length === 0) return null;
  return <ul className="small" style={{ margin: '4px 0' }}>{status.lines.map((l) => <li key={l}>{l}</li>)}</ul>;
}

/** Guided card for a course that is studied on the provider's site. */
export function OutsideModule({ entry }: { entry: CatalogEntry }) {
  const { state, dispatch, registry } = useStore();
  const progress = state.courses[entry.id];
  const status = outsideStatus(progress);
  const plan = returnCheckPlan(entry.id, (id) => registry.course(id));
  const [editing, setEditing] = useState(false);
  const done = !!progress?.completedLessons.includes('external-course');
  const link = entry.registrationUrl ?? entry.officialUrl;

  return (
    <section className="card" aria-labelledby="out-h">
      <h2 id="out-h">Study this outside Poqeni</h2>
      <p>This course runs on the provider's site. Poqeni cannot see your progress there, so you tell it, and then it can ask a few questions to see what stuck.</p>
      <ol>
        <li>
          Take the course{link ? <> on <a href={link} target="_blank" rel="noreferrer noopener">the provider's page</a></> : ''}.
          {' '}Plan for about {hoursText(entry.studyHours.value)} <FactBadge fact={entry.studyHours} checkedOn={entry.checkedOn} />.
        </li>
        <li>
          While you go, look for these (from the course's published objectives):
          <ul>{entry.objectives.slice(0, 4).map((o) => <li key={o}>{o}</li>)}</ul>
        </li>
        <li>Come back here when you finish, or when you stop. Both are fine.</li>
      </ol>

      <h3>Back from it?</h3>
      <label className="choice">
        <input type="checkbox" checked={done} onChange={(ev) => dispatch({ type: 'markProviderCourseDone', entryId: entry.id, done: ev.target.checked, now: nowIso() })} />
        I finished this course
      </label>

      {progress?.evidence && !editing ? (
        <div>
          <EvidenceView value={progress.evidence} />
          <div className="row">
            <button type="button" onClick={() => setEditing(true)}>Edit note</button>
            <button type="button" onClick={() => dispatch({ type: 'saveEvidence', entryId: entry.id, evidence: undefined, now: nowIso() })}>Remove note</button>
          </div>
        </div>
      ) : editing || done ? (
        <EvidenceForm
          idPrefix="ev"
          initial={progress?.evidence}
          onCancel={editing ? () => setEditing(false) : undefined}
          onSave={(v) => { dispatch({ type: 'saveEvidence', entryId: entry.id, evidence: { ...v, addedOn: nowIso() }, now: nowIso() }); setEditing(false); }}
        />
      ) : null}

      <div style={{ marginTop: 12 }}>
        {plan ? (
          <a className="btn primary" href={href('return', entry.id)}>Check what I learned</a>
        ) : (
          <p className="small muted">Poqeni has no questions for this topic yet, so there is no check. Your note above is still saved.</p>
        )}
        {plan && <p className="small muted">Five questions from Poqeni's own bank on this topic. They test understanding, not completion, and you can retry.</p>}
      </div>

      <div role="status" aria-live="polite" style={{ marginTop: 8 }}>
        <p><strong>Where this stands:</strong> {status.label}</p>
        <OutsideStatusLine status={status} />
      </div>
    </section>
  );
}

export function ReturnCheckPage({ entryId }: { entryId: string }) {
  const [round, setRound] = useState(0);
  return <ReturnCheck key={round} entryId={entryId} onRetry={() => setRound((r) => r + 1)} />;
}

function ReturnCheck({ entryId, onRetry }: { entryId: string; onRetry: () => void }) {
  const { state, dispatch, registry } = useStore();
  const entry = registry.entry(entryId);
  const plan = useMemo(() => returnCheckPlan(entryId, (id) => registry.course(id)), [entryId, registry]);
  const [seed] = useState(newSeed);
  const questions = useMemo(
    () => (plan ? pickReturnCheck(plan, new Set(state.attempts.map((a) => a.itemId)), seed) : []),
    // Fixed for the visit so answering does not reshuffle it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [plan, seed],
  );
  const [idx, setIdx] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);

  if (!entry || !plan || questions.length === 0) {
    return <div className="card"><p>There is no check for this course yet.</p><a href={href('course', entryId)}>Back to the course</a></div>;
  }

  if (idx >= questions.length) {
    const correct = results.filter(Boolean).length;
    const pass = correct / results.length >= RETURN_CHECK_PASS;
    return (
      <div className="card hero" role="status">
        <h1>You got {correct} of {results.length}</h1>
        <p>{pass
          ? "That is a pass on Poqeni's check. It shows what you understand today; it does not confirm the provider's course or any credential."
          : 'Not there yet. That is useful to know. Revisit the course material and try again whenever you like; a different mix of questions comes up.'}</p>
        <div className="row">
          <a className="btn primary" href={href('course', entryId)}>Back to the course</a>
          {!pass && <button type="button" onClick={onRetry}>Try again</button>}
        </div>
      </div>
    );
  }

  const q = questions[idx]!;
  const finish = (all: boolean[]) => {
    dispatch({ type: 'recordReturnCheck', entryId, check: { at: nowIso(), correct: all.filter(Boolean).length, total: all.length }, now: nowIso() });
    setIdx(questions.length);
  };

  return (
    <article>
      <p className="small muted" style={{ margin: 0 }}>Check {idx + 1} of {questions.length} · {entry.title}</p>
      <ProgressBar value={idx / questions.length} label="Check progress" />
      <div className="card" style={{ marginTop: 12 }}>
        <QuestionView
          key={`${idx}-${q.id}`}
          question={q}
          seed={seed}
          onSubmit={(r, _a, c) => {
            setAnswered(true);
            setResults((rs) => [...rs, r.correct]);
            dispatch({ type: 'recordAnswer', attempt: { itemId: q.id, courseId: plan.course.id, conceptIds: q.conceptIds, correct: r.correct, confidence: c, at: nowIso(), context: 'review' }, difficulty: q.difficulty });
          }}
        />
      </div>
      {answered && (
        <button type="button" className="primary" onClick={() => { setAnswered(false); if (idx + 1 < questions.length) setIdx(idx + 1); else finish(results); }}>
          {idx + 1 < questions.length ? 'Next' : 'See result'}
        </button>
      )}
      {!answered && <button type="button" className="link" onClick={() => go('course', entryId)}>Stop here. Nothing is recorded for this check.</button>}
    </article>
  );
}

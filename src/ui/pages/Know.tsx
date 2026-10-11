import { useState } from 'react';
import { derivedFromActivity, knownFromProfile } from '../../engine/memory';
import { MAX_MEMORY_NOTES, MAX_NOTE_LENGTH } from '../../store/reducer';
import { defaultProfile, type Profile } from '../../store/schema';
import { nowIso, useStore } from '../../store/StoreContext';
import { ConfirmButton } from '../components/ConfirmButton';
import { href } from '../router';

/** Profile fields behind each remembered item, so one item can be put back to its default. */
const FIELDS: Record<string, (keyof Profile)[]> = {
  goal: ['goal'], experience: ['experience'], learningStyle: ['learningStyle'], time: ['weeklyHours', 'timelineWeeks'],
  budget: ['budget'], sessionMinutes: ['sessionMinutes'], providers: ['providers'],
};

export function KnowPage() {
  const { state, dispatch, registry } = useStore();
  const known = knownFromProfile(state.profile);
  const derived = derivedFromActivity(state, registry);
  const [text, setText] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const full = state.memoryNotes.length >= MAX_MEMORY_NOTES;

  const forgetItem = (id: string) => {
    const patch: Partial<Profile> = {};
    for (const f of FIELDS[id] ?? []) (patch as Record<string, unknown>)[f] = defaultProfile[f];
    dispatch({ type: 'updateProfile', patch });
  };

  return (
    <div>
      <p><a href={href('settings')}>← Settings</a></p>
      <h1>What Poqeni knows about me</h1>
      <p>This is everything Poqeni remembers about you. It stays on this device. Nothing is sent anywhere, and nothing is remembered that is not listed on this page.</p>

      <section className="card" aria-labelledby="k-told">
        <h2 id="k-told">What you told Poqeni</h2>
        {known.length === 0 ? <p className="muted">Nothing yet. <a href={href('onboarding')}>Answer the setup questions</a> if you want Poqeni to tailor suggestions.</p> : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {known.map((k) => (
              <li key={k.id} className="row" style={{ justifyContent: 'space-between', padding: '6px 0' }}>
                <span><strong>{k.label}:</strong> {k.value} <span className="small muted">(from {k.source})</span></span>
                <span className="row">
                  <a href={href('settings')} aria-label={`Change ${k.label}`}>Change</a>
                  <button type="button" className="link" aria-label={`Forget ${k.label}`} onClick={() => forgetItem(k.id)}>Forget</button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card" aria-labelledby="k-notes">
        <h2 id="k-notes">Notes you asked Poqeni to keep</h2>
        <p className="small muted">Anything that helps you learn, such as a schedule limit or a way you like to be taught. Health details are optional and are not stored unless you write them here yourself.</p>
        {state.memoryNotes.length === 0 && <p className="muted">No notes.</p>}
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {state.memoryNotes.map((n) => (
            <li key={n.id} style={{ padding: '6px 0' }}>
              {editing === n.id ? (
                <form className="row" onSubmit={(ev) => { ev.preventDefault(); dispatch({ type: 'updateMemoryNote', id: n.id, text: draft }); setEditing(null); }}>
                  <label className="sr-only" htmlFor={`edit-${n.id}`}>Edit note</label>
                  <input id={`edit-${n.id}`} type="text" maxLength={MAX_NOTE_LENGTH} value={draft} onChange={(e) => setDraft(e.target.value)} />
                  <button className="primary" type="submit">Save</button>
                  <button type="button" onClick={() => setEditing(null)}>Cancel</button>
                </form>
              ) : (
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span>{n.text} <span className="small muted">(added {n.addedOn.slice(0, 10)})</span></span>
                  <span className="row">
                    <button type="button" className="link" onClick={() => { setEditing(n.id); setDraft(n.text); }}>Edit</button>
                    <button type="button" className="link" onClick={() => dispatch({ type: 'deleteMemoryNote', id: n.id })}>Delete</button>
                  </span>
                </div>
              )}
            </li>
          ))}
        </ul>
        <form className="row" onSubmit={(ev) => { ev.preventDefault(); if (text.trim() && !full) { dispatch({ type: 'addMemoryNote', note: { id: `n-${Date.now().toString(36)}-${state.memoryNotes.length}`, text, addedOn: nowIso() } }); setText(''); } }}>
          <div className="field" style={{ flex: 1 }}>
            <label htmlFor="new-note">Add a note</label>
            <input id="new-note" type="text" maxLength={MAX_NOTE_LENGTH} value={text} disabled={full} onChange={(e) => setText(e.target.value)} />
          </div>
          <button type="submit" disabled={!text.trim() || full}>Add</button>
        </form>
        {full && <p className="small muted">You have {MAX_MEMORY_NOTES} notes, the most Poqeni keeps. Delete one to add another.</p>}
      </section>

      <section className="card" aria-labelledby="k-derived">
        <h2 id="k-derived">Worked out from your activity</h2>
        <p className="small muted">Calculated from your answers and timed study. Not stored separately. To remove the source, delete your data in Settings.</p>
        <ul>{derived.map((d) => <li key={d.label}><strong>{d.label}:</strong> {d.value}</li>)}</ul>
      </section>

      <section className="card" aria-labelledby="k-forget">
        <h2 id="k-forget">Forget everything</h2>
        <p>Clears the setup answers above and every note. Your progress, answers and plans are kept.</p>
        <ConfirmButton label="Forget everything" question="Clear everything Poqeni remembers about you? Your progress stays." confirmLabel="Forget everything" onConfirm={() => dispatch({ type: 'forgetMemory' })} />
      </section>
    </div>
  );
}

import { useState } from 'react';
import { pathById, pathTemplates } from '../../data/paths';
import { parseCourseImport } from '../../engine/validate';
import { exportState, importState } from '../../store/persistence';
import type { CareerGoal, Profile } from '../../store/schema';
import { useStore } from '../../store/StoreContext';
import { go, href } from '../router';

const EXAMPLE_IMPORT = `{
  "format": "aca-course@1",
  "entry": { "title": "My course", "credentialType": "independent-assessment", "studyHours": 2 },
  "course": {
    "id": "my-course", "title": "My course", "summary": "",
    "concepts": [{ "id": "c1", "label": "Concept" }],
    "lessons": [], "flashcards": [],
    "questions": [{ "id": "q1", "kind": "single", "conceptIds": ["c1"], "difficulty": 1,
      "prompt": "…", "explanation": "…",
      "options": [{ "id": "a", "text": "…", "why": "…" }, { "id": "b", "text": "…", "why": "…" }],
      "correct": ["a"] }]
  }
}`;

function readFile(file: File): Promise<string> {
  return file.text();
}

export function SettingsPage() {
  const { state, dispatch } = useStore();
  const p = state.profile;
  const [msg, setMsg] = useState<{ tone: 'ok' | 'warn'; text: string; list?: string[] } | null>(null);
  const set = (patch: Partial<Profile>) => dispatch({ type: 'updateProfile', patch });
  const bytes = new Blob([JSON.stringify(state)]).size;

  const download = () => {
    const blob = new Blob([exportState(state, new Date())], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ai-career-academy-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setMsg({ tone: 'ok', text: 'Backup downloaded.' });
  };

  const importBackup = async (file?: File) => {
    if (!file) return;
    const r = importState(await readFile(file));
    if (!r.ok) return setMsg({ tone: 'warn', text: r.error });
    if (!confirm('Replace all current progress with this backup? Export first if you want to keep it.')) return;
    dispatch({ type: 'replaceState', state: r.state });
    setMsg({ tone: 'ok', text: 'Backup restored.' });
  };

  const importCourse = async (file?: File) => {
    if (!file) return;
    let json: unknown;
    try {
      json = JSON.parse(await readFile(file));
    } catch {
      return setMsg({ tone: 'warn', text: 'That file is not valid JSON.' });
    }
    const r = parseCourseImport(json);
    if (!r.ok) return setMsg({ tone: 'warn', text: 'The course was not imported. Fix these problems and try again:', list: r.errors.slice(0, 10) });
    dispatch({ type: 'importCourse', entry: r.value.entry, course: r.value.course });
    setMsg({ tone: 'ok', text: `Imported "${r.value.entry.title}". It is labelled user-added and unverified.` });
  };

  const changeGoal = (goal: CareerGoal) => {
    set({ goal });
    const t = pathById.get(goal)!;
    if (confirm(`Also start a "${t.title}" plan and make it active? Your other plans are kept.`)) {
      dispatch({ type: 'savePlan', plan: { id: `plan-${t.id}-${Date.now().toString(36)}`, title: t.title, steps: structuredClone(t.steps), createdFrom: t.id }, activate: true });
    }
  };

  return (
    <div>
      <h1>Settings</h1>
      {msg && (
        <div className={`notice ${msg.tone === 'warn' ? 'warn' : ''}`} role={msg.tone === 'warn' ? 'alert' : 'status'}>
          {msg.text}
          {msg.list && <ul>{msg.list.map((e) => <li key={e}><code>{e}</code></li>)}</ul>}
        </div>
      )}

      <section className="card" aria-labelledby="lp-h">
        <h2 id="lp-h">Learning preferences</h2>
        <div className="field">
          <label htmlFor="s-goal">Career goal</label>
          <select id="s-goal" value={p.goal} onChange={(e) => changeGoal(e.target.value as CareerGoal)}>
            {pathTemplates.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="s-sess">Session length</label>
          <select id="s-sess" value={p.sessionMinutes} onChange={(e) => set({ sessionMinutes: Number(e.target.value) as Profile['sessionMinutes'] })}>
            {[5, 10, 20, 30].map((m) => <option key={m} value={m}>{m} minutes</option>)}
          </select>
        </div>
        <label className="choice"><input type="checkbox" checked={p.breakPrompts} onChange={(e) => set({ breakPrompts: e.target.checked })} /> <span>Offer a break when a timed session ends (never forced)</span></label>
        <label className="choice"><input type="checkbox" checked={p.reminders} onChange={(e) => set({ reminders: e.target.checked })} /> <span>Show an in-app reminder when reviews are due</span></label>
        <div className="field">
          <label htmlFor="s-theme">Theme</label>
          <select id="s-theme" value={p.theme} onChange={(e) => set({ theme: e.target.value as Profile['theme'] })}>
            <option value="system">Match system</option><option value="light">Light</option><option value="dark">Dark</option>
          </select>
        </div>
      </section>

      <section className="card" aria-labelledby="sch-h">
        <h2 id="sch-h">Study schedule and budget</h2>
        <div className="row">
          <div className="field"><label htmlFor="s-hours">Hours per week</label><input id="s-hours" type="number" min={1} max={60} value={p.weeklyHours} onChange={(e) => set({ weeklyHours: Math.max(1, Number(e.target.value) || 1) })} /></div>
          <div className="field"><label htmlFor="s-weeks">Timeline (weeks)</label><input id="s-weeks" type="number" min={1} max={104} value={p.timelineWeeks} onChange={(e) => set({ timelineWeeks: Math.max(1, Number(e.target.value) || 1) })} /></div>
        </div>
        <p className="small muted">That is about {p.weeklyHours * p.timelineWeeks} study hours in total.</p>
        <div className="field">
          <label htmlFor="s-budget">Budget</label>
          <select id="s-budget" value={p.budget} onChange={(e) => set({ budget: e.target.value as Profile['budget'] })}>
            <option value="free">Free only</option><option value="low">Up to about $100 per exam</option><option value="any">No constraint</option>
          </select>
        </div>
        <button type="button" onClick={() => go('onboarding')}>Redo setup questions</button>
      </section>

      <section className="card" aria-labelledby="data-h">
        <h2 id="data-h">Data import and export</h2>
        <div className="row">
          <button type="button" className="primary" onClick={download}>Export backup (JSON)</button>
          <label className="btn" style={{ fontWeight: 400, marginBottom: 0 }}>
            Restore backup…
            <input type="file" accept="application/json,.json" className="sr-only" onChange={(e) => { void importBackup(e.target.files?.[0]); e.target.value = ''; }} />
          </label>
        </div>
        <h3 style={{ marginTop: 16 }}>Import a course</h3>
        <p className="small">Add your own course as JSON. Imported content is checked for structure and always labelled user-added and unverified.</p>
        <label className="btn" style={{ fontWeight: 400 }}>
          Import course file…
          <input type="file" accept="application/json,.json" className="sr-only" onChange={(e) => { void importCourse(e.target.files?.[0]); e.target.value = ''; }} />
        </label>
        <details><summary className="small">Course file format</summary><pre>{EXAMPLE_IMPORT}</pre></details>
        {state.importedEntries.length > 0 && (
          <ul>
            {state.importedEntries.map((e) => (
              <li key={e.id}><a href={href('course', e.id)}>{e.title}</a> <button type="button" className="link" onClick={() => { if (confirm(`Remove "${e.title}"?`)) dispatch({ type: 'removeImported', entryId: e.id }); }}>Remove</button></li>
            ))}
          </ul>
        )}
      </section>

      <section className="card" aria-labelledby="priv-h">
        <h2 id="priv-h">Privacy and storage</h2>
        <p>Everything is stored only in this browser (local storage, about {Math.ceil(bytes / 1024)} KB). Nothing is sent to a server, and no account or AI API is needed. Clearing browser data deletes it, so export a backup now and then.</p>
        <button type="button" onClick={() => {
          if (confirm('Delete all progress, plans and imports in this browser? This cannot be undone.') && confirm('Are you sure? Export a backup first if you might want it.')) {
            dispatch({ type: 'reset' });
            go('onboarding');
          }
        }}>Delete all data</button>
      </section>
    </div>
  );
}

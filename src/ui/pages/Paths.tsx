import { useState } from 'react';
import type { PathStep } from '../../domain/types';
import { pathById, pathTemplates } from '../../data/paths';
import { projectById } from '../../data/projects';
import { weakConcepts } from '../../engine/mastery';
import { personalizePath, type PlanItem } from '../../engine/recommend';
import type { CustomPlan } from '../../store/schema';
import { ConfirmButton } from '../components/ConfirmButton';
import { useStore } from '../../store/StoreContext';
import { Empty, StatusPill } from '../components/bits';
import { href } from '../router';

export function PathsPage() {
  const { state, dispatch } = useStore();
  const plan = state.plans.find((p) => p.id === state.activePlanId);

  const createFrom = (templateId: string) => {
    const t = pathById.get(templateId as never)!;
    const id = `plan-${t.id}-${Date.now().toString(36)}`;
    dispatch({ type: 'savePlan', plan: { id, title: t.title, steps: structuredClone(t.steps), createdFrom: t.id }, activate: true });
  };

  return (
    <div>
      <h1>Career Paths</h1>
      <p className="muted">Templates are starting points. Reorder, skip or add courses from any provider. Every suggestion says why.</p>

      {state.plans.length > 0 && (
        <div className="field">
          <label htmlFor="plan-sel">Active plan</label>
          <select id="plan-sel" value={state.activePlanId ?? ''} onChange={(e) => dispatch({ type: 'setActivePlan', id: e.target.value })}>
            {state.plans.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </div>
      )}

      {plan ? <PlanEditor plan={plan} /> : <Empty>No active plan yet. Pick a template below.</Empty>}

      <details>
        <summary>Start a new plan from a template</summary>
        <div className="grid" style={{ marginTop: 8 }}>
          {pathTemplates.map((t) => (
            <div className="card" key={t.id}>
              <h3>{t.title}</h3>
              <p className="small">{t.summary}</p>
              <p className="small muted">Roles: {t.roles.join(', ')}</p>
              <button type="button" onClick={() => createFrom(t.id)}>Use this template</button>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}

function PlanEditor({ plan }: { plan: CustomPlan }) {
  const { state, dispatch, registry } = useStore();
  const [adding, setAdding] = useState<number | null>(null);
  const items = personalizePath(plan.steps, state, registry, plan.overrides);
  const save = (patch: Partial<CustomPlan>) => dispatch({ type: 'savePlan', plan: { ...plan, ...patch } });
  const setSteps = (steps: PathStep[]) => save({ steps });
  const moveStep = (i: number, d: -1 | 1) => {
    const s = [...plan.steps];
    const j = i + d;
    if (j < 0 || j >= s.length) return;
    [s[i], s[j]] = [s[j]!, s[i]!];
    setSteps(s);
  };
  const override = (id: string, v: 'include' | 'skip' | undefined) => {
    const o = { ...(plan.overrides ?? {}) };
    if (v) o[id] = v;
    else delete o[id];
    save({ overrides: o });
  };

  const template = plan.createdFrom ? pathById.get(plan.createdFrom as never) : undefined;
  const studyCourses = [...new Set(plan.steps.flatMap((s) => s.catalogIds))].map((id) => registry.courseForEntry(id)).filter((c) => !!c);
  const gaps = studyCourses.flatMap((c) => weakConcepts(c, state.attempts).map((m) => ({ c, m })));
  const recommendedItems = items.filter((i) => i.recommended || i.status !== 'not-started');
  const doneCount = recommendedItems.filter((i) => !['not-started', 'in-progress'].includes(i.status)).length;

  return (
    <section aria-labelledby="plan-h">
      <div className="card">
        <label htmlFor="plan-title">Plan name</label>
        <input id="plan-title" type="text" value={plan.title} onChange={(e) => save({ title: e.target.value })} />
        <p className="small muted" style={{ marginTop: 6 }}>Milestone: {doneCount} of {recommendedItems.length} recommended courses finished.</p>
      </div>
      <h2 id="plan-h" className="sr-only">Plan steps</h2>
      <ol style={{ paddingLeft: 0, listStyle: 'none' }}>
        {plan.steps.map((step, si) => (
          <li key={`${si}-${step.title}`} className="card">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0 }}>Step {si + 1}: {step.title}</h3>
              <span className="row">
                <button type="button" aria-label={`Move step ${si + 1} up`} disabled={si === 0} onClick={() => moveStep(si, -1)}>↑</button>
                <button type="button" aria-label={`Move step ${si + 1} down`} disabled={si === plan.steps.length - 1} onClick={() => moveStep(si, 1)}>↓</button>
                <ConfirmButton label="Remove step" question={`Remove step "${step.title}"?`} confirmLabel="Remove" onConfirm={() => setSteps(plan.steps.filter((_, k) => k !== si))} />
              </span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {items.filter((it) => it.stepIndex === si).map((it) => (
                <PlanRow key={it.entry.id} item={it} onOverride={(v) => override(it.entry.id, v)}
                  onRemove={() => setSteps(plan.steps.map((s, k) => (k === si ? { ...s, catalogIds: s.catalogIds.filter((c) => c !== it.entry.id) } : s)))} />
              ))}
            </ul>
            {adding === si ? (
              <AddCourse exclude={step.catalogIds} onAdd={(id) => { setSteps(plan.steps.map((s, k) => (k === si ? { ...s, catalogIds: [...s.catalogIds, id] } : s))); setAdding(null); }} onCancel={() => setAdding(null)} />
            ) : (
              <button type="button" onClick={() => setAdding(si)}>Add a course to this step</button>
            )}
          </li>
        ))}
      </ol>
      <div className="row">
        <button type="button" onClick={() => setSteps([...plan.steps, { title: 'New step', catalogIds: [], why: 'Added by you.' }])}>Add a step</button>
        {template && <ConfirmButton label="Reset to template" question="Reset this plan? Your changes to its steps are lost." confirmLabel="Reset" onConfirm={() => save({ steps: structuredClone(template.steps), overrides: {} })} />}
        <ConfirmButton label="Delete plan" question={`Delete "${plan.title}"?`} confirmLabel="Delete" onConfirm={() => dispatch({ type: 'deletePlan', id: plan.id })} />
      </div>

      <section className="card" aria-labelledby="gap-h" style={{ marginTop: 12 }}>
        <h2 id="gap-h">Skill gaps</h2>
        {gaps.length === 0 ? <p className="muted">No weak concepts found yet. Gaps appear here after you answer questions.</p> : (
          <ul>{gaps.slice(0, 5).map(({ c, m }) => <li key={m.conceptId}>{c.concepts.find((k) => k.id === m.conceptId)?.label} ({c.title}): {Math.round(m.score * 100)}% · <a href={href('review', c.id)}>Practise</a></li>)}</ul>
        )}
      </section>

      {template && template.projectIds.length > 0 && (
        <section className="card" aria-labelledby="proj-h">
          <h2 id="proj-h">Projects that fit this path</h2>
          <ul>{template.projectIds.map((id) => projectById.get(id)).filter(Boolean).map((p) => <li key={p!.id}><a href={href('project', p!.id)}>{p!.title}</a></li>)}</ul>
        </section>
      )}
    </section>
  );
}

function PlanRow({ item, onOverride, onRemove }: { item: PlanItem; onOverride: (v: 'include' | 'skip' | undefined) => void; onRemove: () => void }) {
  const e = item.entry;
  return (
    <li style={{ borderTop: '1px solid var(--border)', padding: '8px 0' }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <span>
          <a href={href('course', e.id)}>{e.title}</a>{' '}
          <span className={`badge ${item.recommended ? 'b-type' : 'b-estimate'}`}>{item.recommended ? 'Recommended' : 'Optional'}</span>
        </span>
        <StatusPill status={item.status} />
      </div>
      <details>
        <summary className="small">Why?</summary>
        <ul className="small">{item.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
      </details>
      <div className="row small">
        {item.overridden ? (
          <button type="button" onClick={() => onOverride(undefined)}>Use the app's suggestion</button>
        ) : item.recommended ? (
          <button type="button" onClick={() => onOverride('skip')}>Skip this</button>
        ) : (
          <button type="button" onClick={() => onOverride('include')}>Include anyway</button>
        )}
        <button type="button" onClick={onRemove}>Remove from plan</button>
      </div>
    </li>
  );
}

function AddCourse({ exclude, onAdd, onCancel }: { exclude: string[]; onAdd: (id: string) => void; onCancel: () => void }) {
  const { registry } = useStore();
  const [id, setId] = useState('');
  const options = registry.entries.filter((e) => !exclude.includes(e.id) && e.availability.value !== 'retired');
  return (
    <div className="row">
      <label htmlFor="add-course" className="sr-only">Course to add</label>
      <select id="add-course" value={id} onChange={(e) => setId(e.target.value)}>
        <option value="">Choose a course…</option>
        {options.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
      </select>
      <button type="button" className="primary" disabled={!id} onClick={() => onAdd(id)}>Add</button>
      <button type="button" onClick={onCancel}>Cancel</button>
    </div>
  );
}

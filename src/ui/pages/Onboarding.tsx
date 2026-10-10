import { useState } from 'react';
import { diagnosticItems } from '../../data/curriculum';
import { pathById, pathTemplates } from '../../data/paths';
import { newSeed } from '../../engine/random';
import type { Profile } from '../../store/schema';
import { defaultProfile } from '../../store/schema';
import { nowIso, useStore } from '../../store/StoreContext';
import { ProgressBar } from '../components/bits';
import { QuestionView } from '../components/QuestionView';
import { go } from '../router';

type Step = { key: keyof Profile; title: string; help?: string; options: { value: unknown; label: string; hint?: string }[]; multi?: boolean };

const STEPS: Step[] = [
  { key: 'goal', title: 'What career goal are you working toward?', options: pathTemplates.map((p) => ({ value: p.id, label: p.title, hint: p.roles.join(', ') })) },
  { key: 'experience', title: 'How much technical experience do you have?', options: [
    { value: 'none', label: 'New to tech', hint: 'No programming yet' },
    { value: 'some', label: 'Some', hint: 'Scripts, spreadsheets, a little code' },
    { value: 'developer', label: 'I write software', hint: 'Comfortable with code and Git' },
  ] },
  { key: 'learningStyle', title: 'How do you like to learn?', options: [
    { value: 'reading', label: 'Read first, then practice' },
    { value: 'practice', label: 'Practice first, read when stuck' },
    { value: 'mixed', label: 'A mix' },
  ] },
  { key: 'weeklyHours', title: 'How many hours a week can you study?', help: 'Rough is fine. You can change this later.', options: [2, 5, 10, 15].map((h) => ({ value: h, label: `${h} hours` })) },
  { key: 'budget', title: 'What is your budget for courses and exams?', options: [
    { value: 'free', label: 'Free only' },
    { value: 'low', label: 'Up to about $100 per exam' },
    { value: 'any', label: 'Budget is not a constraint' },
  ] },
  { key: 'providers', title: 'Any preferred providers?', help: 'Pick any, or none.', multi: true, options: [
    { value: 'anthropic', label: 'Claude Academy' }, { value: 'aws', label: 'AWS' }, { value: 'microsoft', label: 'Microsoft' }, { value: 'google', label: 'Google Cloud' },
  ] },
  { key: 'timelineWeeks', title: 'What timeline are you aiming for?', options: [4, 12, 26, 52].map((w) => ({ value: w, label: w < 52 ? `${w} weeks` : '1 year' })) },
  { key: 'sessionMinutes', title: 'How long should a study session be?', help: 'Short sessions are easier to start. You can always keep going.', options: [5, 10, 20, 30].map((m) => ({ value: m, label: `${m} minutes` })) },
];

export function OnboardingPage() {
  const { state, dispatch } = useStore();
  const [i, setI] = useState(0);
  const [profile, setProfile] = useState<Profile>({ ...defaultProfile, ...state.profile, onboarded: false });
  const [phase, setPhase] = useState<'questions' | 'offer' | 'diagnostic' | 'done'>('questions');

  const finish = (p: Profile) => {
    const t = pathById.get(p.goal)!;
    dispatch({ type: 'completeOnboarding', profile: p, plan: { id: `plan-${t.id}`, title: t.title, steps: t.steps, createdFrom: t.id } });
  };

  if (phase === 'diagnostic') return <Diagnostic onDone={() => { finish(profile); setPhase('done'); }} />;
  if (phase === 'done') {
    return (
      <div className="card hero">
        <h1>Your plan is ready</h1>
        <p>Your home screen now shows one recommended next step. Every suggestion explains why, and you can change your path at any time.</p>
        <button className="primary" type="button" onClick={() => go()}>Go to Home</button>
      </div>
    );
  }
  if (phase === 'offer') {
    return (
      <div className="card hero">
        <h1>Optional: quick skills check</h1>
        <p>{diagnosticItems.length} questions, about 5 minutes. Your answers mark what you already know so the plan can skip it. You will see an explanation after each answer.</p>
        <div className="row">
          <button className="primary" type="button" onClick={() => setPhase('diagnostic')}>Take the skills check</button>
          <button type="button" onClick={() => { finish(profile); setPhase('done'); }}>Skip it</button>
        </div>
      </div>
    );
  }

  const step = STEPS[i]!;
  const val = profile[step.key];
  const choose = (v: unknown) => {
    if (step.multi) {
      const arr = (val as string[]).includes(v as string) ? (val as string[]).filter((x) => x !== v) : [...(val as string[]), v as string];
      setProfile({ ...profile, [step.key]: arr });
    } else {
      setProfile({ ...profile, [step.key]: v });
    }
  };

  return (
    <div className="stack">
      <p className="muted small">Question {i + 1} of {STEPS.length}</p>
      <ProgressBar value={i / STEPS.length} label="Setup progress" />
      <div className="card">
        <fieldset>
          <legend><h1 style={{ fontSize: '1.3rem', margin: 0 }}>{step.title}</h1></legend>
          {step.help && <p className="muted">{step.help}</p>}
          {step.options.map((o) => {
            const checked = step.multi ? (val as string[]).includes(o.value as string) : val === o.value;
            return (
              <label key={String(o.value)} className="choice">
                <input type={step.multi ? 'checkbox' : 'radio'} name={`ob-${step.key}`} checked={checked} onChange={() => choose(o.value)} />
                <span>{o.label}{o.hint && <span className="small muted" style={{ display: 'block' }}>{o.hint}</span>}</span>
              </label>
            );
          })}
        </fieldset>
        <div className="row">
          {i > 0 && <button type="button" onClick={() => setI(i - 1)}>Back</button>}
          <button className="primary" type="button" onClick={() => (i + 1 < STEPS.length ? setI(i + 1) : setPhase('offer'))}>
            {i + 1 < STEPS.length ? 'Next' : 'Continue'}
          </button>
          <button type="button" className="link" onClick={() => { finish({ ...defaultProfile, ...profile }); go(); }}>
            Skip setup and use the default AI Foundations path
          </button>
        </div>
      </div>
    </div>
  );
}

function Diagnostic({ onDone }: { onDone: () => void }) {
  const { dispatch, registry } = useStore();
  const [i, setI] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [seed] = useState(newSeed);
  const [score, setScore] = useState(0);
  const item = diagnosticItems[i]!;
  const q = registry.question(item.courseId, item.questionId)!;
  const last = i + 1 >= diagnosticItems.length;

  return (
    <div className="stack">
      <p className="muted small">Skills check: question {i + 1} of {diagnosticItems.length}</p>
      <ProgressBar value={i / diagnosticItems.length} label="Skills check progress" />
      <div className="card">
        <QuestionView
          key={q.id}
          question={q}
          seed={seed}
          onSubmit={(r, _a, confidence) => {
            setAnswered(true);
            if (r.correct) setScore((s) => s + 1);
            dispatch({ type: 'recordAnswer', attempt: { itemId: q.id, courseId: item.courseId, conceptIds: q.conceptIds, correct: r.correct, confidence, at: nowIso(), context: 'diagnostic' }, noSchedule: r.correct, difficulty: q.difficulty });
          }}
        />
        <div className="row" style={{ marginTop: 12 }}>
          {answered && !last && <button className="primary" type="button" onClick={() => { setI(i + 1); setAnswered(false); }}>Next question</button>}
          {answered && last && <button className="primary" type="button" onClick={onDone}>See my plan ({score} of {diagnosticItems.length} correct)</button>}
          {!answered && <button type="button" onClick={() => (last ? onDone() : setI(i + 1))}>I don't know this, skip</button>}
        </div>
      </div>
    </div>
  );
}


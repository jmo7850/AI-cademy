import { useId, useMemo, useState } from 'react';
import type { Answer, Question } from '../../domain/types';
import { correctAnswerText, gradeQuestion, isAnswerComplete, type GradeResult } from '../../engine/grading';
import { seededShuffle } from '../../engine/random';

interface Props {
  question: Question;
  seed: number;
  /** Controlled answer (exam mode). */
  value?: Answer;
  onChange?: (a: Answer) => void;
  /** When set, the component grades on submit and shows feedback. */
  onSubmit?: (r: GradeResult, answer: Answer, confidence?: 1 | 2 | 3) => void;
  /** Show a graded review (exam results) without inputs. */
  reviewOnly?: boolean;
  label?: string;
}

const emptyAnswer = (q: Question): Answer =>
  q.kind === 'fill' ? { kind: 'fill', text: '' } : q.kind === 'order' ? { kind: 'order', order: [] } : q.kind === 'match' ? { kind: 'match', mapping: {} } : { kind: 'choice', selected: [] };

export function QuestionView({ question: q, seed, value, onChange, onSubmit, reviewOnly, label }: Props) {
  const uid = useId();
  const [local, setLocal] = useState<Answer>(() => emptyAnswer(q));
  const [confidence, setConfidence] = useState<1 | 2 | 3 | undefined>();
  const [result, setResult] = useState<GradeResult | null>(null);
  const answer = value ?? local;
  const graded = reviewOnly ? gradeQuestion(q, answer) : result;
  const locked = !!graded;

  const setAnswer = (a: Answer) => {
    if (locked) return;
    setLocal(a);
    onChange?.(a);
  };

  const options = useMemo(() => ('options' in q ? (q.fixedOrder ? q.options : seededShuffle(q.options, q.id, seed)) : []), [q, seed]);
  const orderStart = useMemo(() => (q.kind === 'order' ? seededShuffle(q.items, q.id, seed).map((i) => i.id) : []), [q, seed]);
  const rightChoices = useMemo(() => (q.kind === 'match' ? seededShuffle(q.pairs, `${q.id}r`, seed) : []), [q, seed]);

  const submit = () => {
    const r = gradeQuestion(q, answer);
    setResult(r);
    onSubmit?.(r, answer, confidence);
  };

  const cls = (id: string) => (graded ? graded.details[id] ?? '' : '');

  return (
    <div className="question" aria-live="polite">
      {label && <p className="muted small">{label}</p>}
      <p style={{ fontWeight: 600, whiteSpace: 'pre-line' }} id={`${uid}-prompt`}>{q.prompt}</p>
      {q.code && <pre aria-label="Code">{q.code}</pre>}

      {(q.kind === 'single' || q.kind === 'truefalse' || q.kind === 'multi') && answer.kind === 'choice' && (
        <fieldset aria-labelledby={`${uid}-prompt`}>
          <legend className="sr-only">{q.kind === 'multi' ? 'Select all that apply' : 'Select one'}</legend>
          {options.map((o) => {
            const checked = answer.selected.includes(o.id);
            return (
              <label key={o.id} className={`choice ${cls(o.id)}`}>
                <input
                  type={q.kind === 'multi' ? 'checkbox' : 'radio'}
                  name={`${uid}-opt`}
                  checked={checked}
                  disabled={locked}
                  onChange={() =>
                    setAnswer({ kind: 'choice', selected: q.kind === 'multi' ? (checked ? answer.selected.filter((x) => x !== o.id) : [...answer.selected, o.id]) : [o.id] })
                  }
                />
                <span>
                  {o.text}
                  {graded && (checked || q.correct.includes(o.id)) && (
                    <span className="small" style={{ display: 'block', marginTop: 4 }}>
                      <strong>{q.correct.includes(o.id) ? '✓ ' : 'Not correct. '}</strong>
                      {o.why}
                    </span>
                  )}
                </span>
              </label>
            );
          })}
        </fieldset>
      )}

      {q.kind === 'fill' && answer.kind === 'fill' && (
        <div className="field">
          <label htmlFor={`${uid}-fill`}>Your answer</label>
          <input id={`${uid}-fill`} type="text" autoComplete="off" value={answer.text} disabled={locked} onChange={(e) => setAnswer({ kind: 'fill', text: e.target.value })}
            onKeyDown={(e) => { if (e.key === 'Enter' && onSubmit && !locked && isAnswerComplete(q, answer)) submit(); }} />
        </div>
      )}

      {q.kind === 'order' && answer.kind === 'order' && (
        <OrderInput items={q.items} start={orderStart} value={answer.order} locked={locked} details={graded?.details} onChange={(order) => setAnswer({ kind: 'order', order })} />
      )}

      {q.kind === 'match' && answer.kind === 'match' && (
        <div>
          {q.pairs.map((p) => (
            <div className="field" key={p.id}>
              <label htmlFor={`${uid}-${p.id}`}>
                {p.left} {graded && <span className={`badge ${graded.details[p.id] === 'right' ? 'b-verified' : 'b-bad'}`}>{graded.details[p.id] === 'right' ? 'right' : 'wrong'}</span>}
              </label>
              <select id={`${uid}-${p.id}`} value={answer.mapping[p.id] ?? ''} disabled={locked} onChange={(e) => setAnswer({ kind: 'match', mapping: { ...answer.mapping, [p.id]: e.target.value } })}>
                <option value="">Choose…</option>
                {rightChoices.map((r) => (
                  <option key={r.id} value={r.id}>{r.right}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      {onSubmit && !locked && (
        <div className="row" style={{ marginTop: 8 }}>
          <span className="small muted" id={`${uid}-conf`}>How sure are you? (optional)</span>
          {([1, 2, 3] as const).map((c) => (
            <button key={c} type="button" className="chip" aria-pressed={confidence === c} onClick={() => setConfidence(confidence === c ? undefined : c)}>
              {c === 1 ? 'Guessing' : c === 2 ? 'Unsure' : 'Sure'}
            </button>
          ))}
          <button type="button" className="primary" disabled={!isAnswerComplete(q, answer)} onClick={submit}>Check answer</button>
        </div>
      )}

      {graded && (
        <div className={`feedback ${graded.correct ? 'ok' : 'no'}`} role="status">
          <p style={{ marginBottom: 6 }}><strong>{graded.correct ? 'Correct.' : 'Not quite.'}</strong> {!graded.correct && <>Correct answer: {correctAnswerText(q)}</>}</p>
          <p style={{ margin: 0 }}>{q.explanation}</p>
        </div>
      )}
    </div>
  );
}

function OrderInput({ items, start, value, locked, details, onChange }: {
  items: { id: string; text: string }[];
  start: string[];
  value: string[];
  locked: boolean;
  details?: Record<string, string>;
  onChange: (order: string[]) => void;
}) {
  const current = value.length === items.length ? value : start;
  const text = (id: string) => items.find((i) => i.id === id)?.text ?? id;
  const move = (i: number, d: -1 | 1) => {
    const next = [...current];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j]!, next[i]!];
    onChange(next);
  };
  return (
    <div>
      <p className="small muted">Use the arrows to put the steps in order{value.length === 0 ? ', then press "Use this order" if it is already right' : ''}.</p>
      <ol style={{ paddingLeft: 0, listStyle: 'none' }}>
        {current.map((id, i) => (
          <li key={id} className={`order-item ${locked && details ? (current[i] === items[i]!.id ? 'right' : 'wrong') : ''}`}>
            <span>{i + 1}. {text(id)}{locked && details && current[i] !== items[i]!.id && <span className="small muted"> (should be: {items[i]!.text})</span>}</span>
            {!locked && (
              <span className="row">
                <button type="button" aria-label={`Move "${text(id)}" up`} disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
                <button type="button" aria-label={`Move "${text(id)}" down`} disabled={i === current.length - 1} onClick={() => move(i, 1)}>↓</button>
              </span>
            )}
          </li>
        ))}
      </ol>
      {!locked && value.length === 0 && <button type="button" onClick={() => onChange(current)}>Use this order</button>}
    </div>
  );
}

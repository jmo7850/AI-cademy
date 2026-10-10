import { aiFoundations } from '../src/data/curriculum/aiFoundations';
import { localLlm } from '../src/data/curriculum/engineering';
import type { ChoiceQuestion, FillQuestion, MatchQuestion, OrderQuestion } from '../src/domain/types';
import { correctAnswerText, gradeQuestion, isAnswerComplete, normalizeText } from '../src/engine/grading';

const q = (id: string) => [...aiFoundations.questions, ...localLlm.questions].find((x) => x.id === id)!;

describe('choice grading', () => {
  const single = q('aif-q1') as ChoiceQuestion;
  const multi = q('aif-q9') as ChoiceQuestion;

  it('accepts the correct single answer and rejects others', () => {
    expect(gradeQuestion(single, { kind: 'choice', selected: single.correct }).correct).toBe(true);
    const wrong = single.options.find((o) => !single.correct.includes(o.id))!.id;
    const r = gradeQuestion(single, { kind: 'choice', selected: [wrong] });
    expect(r.correct).toBe(false);
    expect(r.details[wrong]).toBe('wrong');
    expect(r.details[single.correct[0]!]).toBe('missed');
  });

  it('requires the exact set for multi-select and gives partial credit', () => {
    expect(gradeQuestion(multi, { kind: 'choice', selected: multi.correct }).correct).toBe(true);
    const partial = gradeQuestion(multi, { kind: 'choice', selected: multi.correct.slice(0, 2) });
    expect(partial.correct).toBe(false);
    expect(partial.score).toBeCloseTo(2 / 3);
    const withWrong = gradeQuestion(multi, { kind: 'choice', selected: [...multi.correct, 'd'] });
    expect(withWrong.correct).toBe(false);
  });

  it('rejects an answer of the wrong shape', () => {
    expect(gradeQuestion(single, { kind: 'fill', text: 'a' }).correct).toBe(false);
  });
});

describe('fill-in grading', () => {
  const fs = q('aif-q11') as FillQuestion;
  it('tolerates case, spacing, quotes, punctuation and listed variants', () => {
    for (const t of ['few-shot', 'Few-Shot', '  few shot ', '"fewshot"', 'few-shot.', 'few shots']) {
      expect(gradeQuestion(fs, { kind: 'fill', text: t }).correct, t).toBe(true);
    }
  });
  it('does not accept answers that merely resemble the phrase', () => {
    for (const t of ['zero-shot', 'few', 'shot', '', 'few-shot learning is great']) {
      expect(gradeQuestion(fs, { kind: 'fill', text: t }).correct, t).toBe(false);
    }
  });
  it('grades numeric answers within tolerance and ignores units', () => {
    const n = q('loc-q1') as FillQuestion;
    expect(gradeQuestion(n, { kind: 'fill', text: '4 GB' }).correct).toBe(true);
    expect(gradeQuestion(n, { kind: 'fill', text: '4.2' }).correct).toBe(true);
    expect(gradeQuestion(n, { kind: 'fill', text: '8' }).correct).toBe(false);
    expect(gradeQuestion(n, { kind: 'fill', text: 'four' }).correct).toBe(false);
  });
  it('normalises text predictably', () => {
    expect(normalizeText('  "Hello   World!" ')).toBe('hello world');
  });
});

describe('order and match grading', () => {
  const o = q('aif-q16') as OrderQuestion;
  const m = q('aif-q19') as MatchQuestion;
  it('requires the full correct order', () => {
    const ids = o.items.map((i) => i.id);
    expect(gradeQuestion(o, { kind: 'order', order: ids }).correct).toBe(true);
    const swapped = [ids[1]!, ids[0]!, ...ids.slice(2)];
    const r = gradeQuestion(o, { kind: 'order', order: swapped });
    expect(r.correct).toBe(false);
    expect(r.score).toBeCloseTo(3 / 5);
  });
  it('grades each pair', () => {
    const mapping = Object.fromEntries(m.pairs.map((p) => [p.id, p.id]));
    expect(gradeQuestion(m, { kind: 'match', mapping }).correct).toBe(true);
    const bad = { ...mapping, [m.pairs[0]!.id]: m.pairs[1]!.id, [m.pairs[1]!.id]: m.pairs[0]!.id };
    const r = gradeQuestion(m, { kind: 'match', mapping: bad });
    expect(r.correct).toBe(false);
    expect(r.score).toBeCloseTo(0.5);
  });
  it('knows when an answer is complete', () => {
    expect(isAnswerComplete(m, { kind: 'match', mapping: { p0: 'p0' } })).toBe(false);
    expect(isAnswerComplete(o, { kind: 'order', order: o.items.map((i) => i.id) })).toBe(true);
    expect(isAnswerComplete(o, undefined)).toBe(false);
  });
  it('renders the correct answer text for review', () => {
    expect(correctAnswerText(m)).toContain('RAG → Answer from your own documents');
  });
});

import type { ChoiceQuestion, FillQuestion, MatchQuestion, OrderQuestion, Question } from '../../domain/types';

/** Compact authoring helpers. Option ids are assigned a, b, c… in authored order. */

export interface Opt {
  t: string;
  why: string;
  ok?: boolean;
}

interface Meta {
  domain?: string;
  level?: 1 | 2 | 3;
  code?: string;
  fixedOrder?: boolean;
}

const letters = 'abcdefgh';

function choice(kind: ChoiceQuestion['kind'], id: string, concepts: string[], prompt: string, opts: Opt[], explanation: string, meta: Meta = {}): ChoiceQuestion {
  const options = opts.map((o, i) => ({ id: letters[i]!, text: o.t, why: o.why }));
  return {
    id,
    kind,
    conceptIds: concepts,
    domainId: meta.domain,
    difficulty: meta.level ?? 1,
    prompt,
    code: meta.code,
    options,
    correct: opts.flatMap((o, i) => (o.ok ? [letters[i]!] : [])),
    fixedOrder: meta.fixedOrder ?? kind === 'truefalse',
    explanation,
  };
}

export const single = (id: string, c: string[], p: string, o: Opt[], e: string, m?: Meta) => choice('single', id, c, p, o, e, m);
export const multi = (id: string, c: string[], p: string, o: Opt[], e: string, m?: Meta) => choice('multi', id, c, p, o, e, m);
export const tf = (id: string, c: string[], p: string, answer: boolean, whyTrue: string, whyFalse: string, e: string, m?: Meta) =>
  choice('truefalse', id, c, p, [
    { t: 'True', why: whyTrue, ok: answer },
    { t: 'False', why: whyFalse, ok: !answer },
  ], e, m);

export function fill(id: string, c: string[], p: string, accept: string[], e: string, m: Meta & { patterns?: string[]; numeric?: FillQuestion['numeric'] } = {}): FillQuestion {
  return { id, kind: 'fill', conceptIds: c, domainId: m.domain, difficulty: m.level ?? 1, prompt: p, code: m.code, accept, acceptPatterns: m.patterns, numeric: m.numeric, explanation: e };
}

/** Items are given in the correct order. */
export function order(id: string, c: string[], p: string, items: string[], e: string, m: Meta = {}): OrderQuestion {
  return { id, kind: 'order', conceptIds: c, domainId: m.domain, difficulty: m.level ?? 2, prompt: p, items: items.map((t, i) => ({ id: `i${i}`, text: t })), explanation: e };
}

export function match(id: string, c: string[], p: string, pairs: [string, string][], e: string, m: Meta = {}): MatchQuestion {
  return { id, kind: 'match', conceptIds: c, domainId: m.domain, difficulty: m.level ?? 2, prompt: p, pairs: pairs.map(([l, r], i) => ({ id: `p${i}`, left: l, right: r })), explanation: e };
}

export const card = (id: string, conceptId: string, front: string, back: string) => ({ id, conceptId, front, back });

export type { Question };

/** Attach "taught in" links to authored questions: question id -> [lessonId, section index]. */
export function withTeachIn(questions: Question[], map: Record<string, [string, number]>): Question[] {
  return questions.map((q) => {
    const t = map[q.id];
    return t ? { ...q, teachIn: { lessonId: t[0], section: t[1] } } : q;
  });
}

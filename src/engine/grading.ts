import type { Answer, Question } from '../domain/types';

export interface GradeResult {
  correct: boolean;
  /** 0..1 partial credit, used for analytics only; mastery uses `correct`. */
  score: number;
  /** Per-option or per-item verdicts for feedback rendering. */
  details: Record<string, 'right' | 'wrong' | 'missed'>;
}

/** Normalise free text: case, whitespace, surrounding quotes and trailing punctuation. */
export function normalizeText(s: string): string {
  return s
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/^["'`]+|["'`]+$/g, '')
    .replace(/[.!?;:,]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Extract the first number from text such as "4 GB" or "≈4.0". */
export function parseNumber(s: string): number | null {
  const m = s.replace(/,/g, '').match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
}

export function gradeQuestion(q: Question, answer: Answer): GradeResult {
  switch (q.kind) {
    case 'single':
    case 'truefalse':
    case 'multi': {
      if (answer.kind !== 'choice') return wrongShape();
      const selected = new Set(answer.selected);
      const correctSet = new Set(q.correct);
      const details: GradeResult['details'] = {};
      let hits = 0;
      let falsePicks = 0;
      for (const o of q.options) {
        const isCorrect = correctSet.has(o.id);
        const picked = selected.has(o.id);
        if (picked && isCorrect) { details[o.id] = 'right'; hits++; }
        else if (picked && !isCorrect) { details[o.id] = 'wrong'; falsePicks++; }
        else if (!picked && isCorrect) details[o.id] = 'missed';
      }
      const correct = hits === correctSet.size && falsePicks === 0;
      const score = correct ? 1 : Math.max(0, (hits - falsePicks) / correctSet.size);
      return { correct, score, details };
    }
    case 'fill': {
      if (answer.kind !== 'fill') return wrongShape();
      const raw = answer.text;
      if (q.numeric) {
        const n = parseNumber(raw);
        const ok = n !== null && Math.abs(n - q.numeric.value) <= q.numeric.tolerance;
        return { correct: ok, score: ok ? 1 : 0, details: {} };
      }
      const norm = normalizeText(raw);
      const ok =
        norm.length > 0 &&
        (q.accept.some((a) => normalizeText(a) === norm) ||
          (q.acceptPatterns ?? []).some((p) => new RegExp(p, 'i').test(norm)));
      return { correct: ok, score: ok ? 1 : 0, details: {} };
    }
    case 'order': {
      if (answer.kind !== 'order') return wrongShape();
      const details: GradeResult['details'] = {};
      let placed = 0;
      q.items.forEach((item, i) => {
        const ok = answer.order[i] === item.id;
        details[item.id] = ok ? 'right' : 'wrong';
        if (ok) placed++;
      });
      const correct = placed === q.items.length && answer.order.length === q.items.length;
      return { correct, score: placed / q.items.length, details };
    }
    case 'match': {
      if (answer.kind !== 'match') return wrongShape();
      const details: GradeResult['details'] = {};
      let right = 0;
      for (const p of q.pairs) {
        // A pair is right when the chosen right-hand text equals this pair's text,
        // so duplicate right-hand texts are graded as equivalent.
        const chosen = q.pairs.find((x) => x.id === answer.mapping[p.id]);
        const ok = chosen !== undefined && chosen.right === p.right;
        details[p.id] = ok ? 'right' : 'wrong';
        if (ok) right++;
      }
      return { correct: right === q.pairs.length, score: right / q.pairs.length, details };
    }
  }
}

function wrongShape(): GradeResult {
  return { correct: false, score: 0, details: {} };
}

/** True when the learner has provided enough input to submit. */
export function isAnswerComplete(q: Question, a: Answer | undefined): boolean {
  if (!a) return false;
  switch (a.kind) {
    case 'choice':
      return a.selected.length > 0;
    case 'fill':
      return a.text.trim().length > 0;
    case 'order':
      return q.kind === 'order' && a.order.length === q.items.length;
    case 'match':
      return q.kind === 'match' && q.pairs.every((p) => a.mapping[p.id]);
  }
}

/** Human-readable correct answer, for review screens. */
export function correctAnswerText(q: Question): string {
  switch (q.kind) {
    case 'single':
    case 'multi':
    case 'truefalse':
      return q.options.filter((o) => q.correct.includes(o.id)).map((o) => o.text).join('; ');
    case 'fill':
      return q.numeric ? `${q.numeric.value} (±${q.numeric.tolerance})` : q.accept[0] ?? '';
    case 'order':
      return q.items.map((i, n) => `${n + 1}. ${i.text}`).join('  ');
    case 'match':
      return q.pairs.map((p) => `${p.left} → ${p.right}`).join('; ');
  }
}

import type { Question } from '../domain/types';

/**
 * Extension point for optional AI tutoring. The core app never requires it:
 * the default provider returns the authored explanation. A real provider must
 * run behind a server you control so API keys never reach browser code.
 */
export interface TutorProvider {
  readonly name: string;
  explain(q: Question, learnerAnswerText: string): Promise<string>;
}

export const authoredTutor: TutorProvider = {
  name: 'Authored explanations',
  async explain(q) {
    return q.explanation;
  },
};

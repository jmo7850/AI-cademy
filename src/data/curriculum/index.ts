import type { StudyCourse } from '../../domain/types';
import { aiFoundations } from './aiFoundations';
import { awsAif } from './awsAif';
import { careerReadiness, devFoundations, llmAppEng, localLlm } from './engineering';
import { nvidiaGenl } from './nvidiaGenl';
import { extraFlashcards } from './extraFlashcards';
import { awsClf, gcpGail, msAi901 } from './vendorCourses';

const withExtraCards = (c: StudyCourse): StudyCourse => ({ ...c, flashcards: [...c.flashcards, ...(extraFlashcards[c.id] ?? [])] });

export const builtInCourses: StudyCourse[] = [aiFoundations, devFoundations, llmAppEng, localLlm, careerReadiness, awsAif, awsClf, msAi901, gcpGail, nvidiaGenl].map(withExtraCards);

/** Diagnostic: one or two questions per foundational area, drawn from course banks. */
export const diagnosticItems: { courseId: string; questionId: string }[] = [
  { courseId: 'study-ai-foundations', questionId: 'aif-q1' },
  { courseId: 'study-ai-foundations', questionId: 'aif-q6' },
  { courseId: 'study-ai-foundations', questionId: 'aif-q12' },
  { courseId: 'study-ai-foundations', questionId: 'aif-q16' },
  { courseId: 'study-dev-foundations', questionId: 'dev-q2' },
  { courseId: 'study-dev-foundations', questionId: 'dev-q6' },
  { courseId: 'study-llm-app-eng', questionId: 'llm-q2' },
  { courseId: 'study-aws-clf', questionId: 'aws-clf-q3' },
  { courseId: 'study-local-llm', questionId: 'loc-q4' },
];

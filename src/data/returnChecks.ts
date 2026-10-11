/**
 * Which of Poqeni's own question banks to use for the "Check what I took in" step of an outside course.
 * The questions are about the topic the course covers, not about the provider's own material, so they test
 * what the learner understands, not that they completed the course. Entries not listed here have no check yet.
 */
export interface ReturnCheckSource {
  /** Study course whose questions are used. */
  courseId: string;
  /** Prefer questions on these concepts when there are enough of them. */
  conceptIds?: string[];
}

const FOUNDATIONS = 'study-ai-foundations';
const LLM_APPS = 'study-llm-app-eng';

export const returnCheckSources: Record<string, ReturnCheckSource> = {
  'claude-ai-fluency-framework-foundations': { courseId: FOUNDATIONS, conceptIds: ['ai.basics', 'ai.prompting', 'ai.limits', 'ai.governance'] },
  'claude-ai-capabilities-and-limitations': { courseId: FOUNDATIONS, conceptIds: ['ai.limits', 'ai.basics', 'ai.eval', 'ai.governance'] },
  'claude-claude-101': { courseId: FOUNDATIONS, conceptIds: ['ai.basics', 'ai.prompting', 'ai.limits'] },
  'claude-building-with-the-claude-api': { courseId: LLM_APPS, conceptIds: ['llm.api', 'llm.structured', 'llm.tools'] },
  'claude-introduction-to-model-context-protocol': { courseId: LLM_APPS, conceptIds: ['llm.tools', 'llm.api'] },
  'claude-introduction-to-agent-skills': { courseId: FOUNDATIONS, conceptIds: ['ai.agents', 'ai.prompting'] },
  'claude-introduction-to-subagents': { courseId: FOUNDATIONS, conceptIds: ['ai.agents'] },
  'claude-building-effective-human-agent-teams': { courseId: FOUNDATIONS, conceptIds: ['ai.agents', 'ai.governance'] },
  'claude-claude-with-amazon-bedrock': { courseId: 'study-aws-aif', conceptIds: ['aif.bedrock', 'aif.genai'] },
  'claude-claude-with-google-cloud-s-vertex-ai': { courseId: 'study-gcp-gail', conceptIds: ['g.offer', 'g.fund'] },
  'aws-cloud-practitioner-essentials': { courseId: 'study-aws-clf' },
  'ms-applied-foundry-agents': { courseId: 'study-ms-ai901', conceptIds: ['ms.foundry', 'ms.models'] },
  'gcp-intro-generative-ai': { courseId: 'study-gcp-gail', conceptIds: ['g.fund'] },
  'google-ai-professional-certificate': { courseId: FOUNDATIONS, conceptIds: ['ai.basics', 'ai.prompting', 'ai.limits'] },
  'google-ai-essentials': { courseId: FOUNDATIONS, conceptIds: ['ai.basics', 'ai.prompting', 'ai.limits'] },
  'openai-apply-ai-at-work': { courseId: FOUNDATIONS, conceptIds: ['ai.prompting', 'ai.limits', 'ai.governance'] },
  'openai-build-with-ai': { courseId: LLM_APPS, conceptIds: ['llm.api', 'llm.structured', 'llm.tools'] },
  'amd-ai-foundations': { courseId: FOUNDATIONS, conceptIds: ['ai.basics', 'ai.neural', 'ai.tokens'] },
  'amd-optimize-deploy-ai': { courseId: 'study-local-llm', conceptIds: ['loc.quant', 'loc.memory', 'loc.select'] },
  'nvidia-ncp-genl': { courseId: 'study-nvidia-genl' },
};

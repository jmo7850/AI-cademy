import type { PathTemplate } from '../domain/types';
import type { CareerGoal } from '../store/schema';

/** Starting templates. Learners can copy, reorder, skip and combine steps. */
export const pathTemplates: (PathTemplate & { id: CareerGoal })[] = [
  {
    id: 'ai-foundations',
    title: 'AI Foundations',
    summary: 'Learn how AI works and how to use it well, then earn a first credential and show one project.',
    roles: ['AI support or implementation specialist', 'AI operations associate'],
    steps: [
      { title: 'AI fluency', catalogIds: ['claude-ai-fluency-framework-foundations'], why: 'Builds the habits for working with AI that every later step assumes.' },
      { title: 'AI and LLM fundamentals', catalogIds: ['academy-ai-foundations', 'claude-ai-capabilities-and-limitations'], why: 'Vendor-neutral concepts that every certification exam tests.' },
      { title: 'Introductory AI credential', catalogIds: ['aws-ai-practitioner', 'ms-azure-ai-fundamentals', 'gcp-generative-ai-leader'], why: 'A proctored foundational certification employers recognise. Pick one provider.' },
      { title: 'Practical AI exercises', catalogIds: ['claude-claude-101'], why: 'Applies the concepts to real tasks.' },
      { title: 'Small portfolio project', catalogIds: ['project-rag'], why: 'Turns knowledge into evidence you can show.' },
    ],
    projectIds: ['api-client', 'structured-output'],
  },
  {
    id: 'cloud-ai',
    title: 'Cloud and AI',
    summary: 'Cloud fundamentals, then foundational AI certification and a small deployed project.',
    roles: ['Junior cloud or AI practitioner', 'AI operations associate'],
    steps: [
      { title: 'Cloud fundamentals', catalogIds: ['aws-cloud-practitioner-essentials', 'aws-cloud-practitioner'], why: 'Cloud basics are assumed by every cloud AI role.' },
      { title: 'Foundational AI learning', catalogIds: ['academy-ai-foundations', 'aws-ai-practitioner'], why: 'Connects AI concepts to the provider\'s services.' },
      { title: 'Official exam preparation', catalogIds: ['aws-ai-practitioner'], why: 'Practice exams by official domain until readiness is consistently high.' },
      { title: 'Hands-on cloud exercises', catalogIds: ['claude-claude-with-amazon-bedrock'], why: 'Builds with a managed model service.' },
      { title: 'Entry-level deployment project', catalogIds: ['project-rag'], why: 'A deployed project proves you can operate what you studied.' },
    ],
    projectIds: ['cloud-deploy'],
  },
  {
    id: 'ai-app-dev',
    title: 'AI Application Developer',
    summary: 'Programming and APIs through RAG and a deployed AI application.',
    roles: ['Junior AI application developer', 'LLM application developer', 'Junior software developer working with AI'],
    steps: [
      { title: 'Programming and APIs', catalogIds: ['academy-dev-foundations'], why: 'You cannot build LLM apps without HTTP, JSON and Git.' },
      { title: 'LLM fundamentals', catalogIds: ['academy-ai-foundations'], why: 'Tokens, context and failure modes shape every design decision.' },
      { title: 'Tool calling and structured outputs', catalogIds: ['claude-building-with-the-claude-api', 'academy-llm-app-eng'], why: 'The core techniques of production LLM apps.' },
      { title: 'RAG and evaluation', catalogIds: ['academy-llm-app-eng'], why: 'Grounding and measurement separate demos from products.' },
      { title: 'Build and deploy an AI application', catalogIds: ['project-rag'], why: 'Your main portfolio evidence.' },
      { title: 'Relevant technical credential', catalogIds: ['aws-ai-practitioner', 'ms-applied-foundry-agents'], why: 'Adds an employer-recognised signal to your projects.' },
    ],
    projectIds: ['api-client', 'structured-output', 'rag-app', 'tool-assistant', 'eval-harness'],
  },
  {
    id: 'agent-runtime',
    title: 'AI Agent and Runtime Engineer',
    summary: 'Software engineering through orchestration, routing, permissions and a production-style agent runtime.',
    roles: ['LLM application developer', 'AI automation specialist'],
    steps: [
      { title: 'Programming and software engineering', catalogIds: ['academy-dev-foundations'], why: 'Agent runtimes are software systems first.' },
      { title: 'LLM and agent fundamentals', catalogIds: ['academy-ai-foundations', 'claude-introduction-to-model-context-protocol'], why: 'Tool use and MCP are the building blocks.' },
      { title: 'Tool execution and orchestration', catalogIds: ['academy-llm-app-eng', 'claude-introduction-to-subagents'], why: 'Loops, delegation and failure handling.' },
      { title: 'Model routing and evaluation', catalogIds: ['academy-llm-app-eng'], why: 'Cost and quality control across models.' },
      { title: 'Recovery, permissions and resource limits', catalogIds: ['claude-building-effective-human-agent-teams'], why: 'Safe autonomy needs approvals and limits.' },
      { title: 'Build a production-style agent runtime', catalogIds: ['project-agent-runtime'], why: 'The capstone that demonstrates all of the above.' },
    ],
    projectIds: ['tool-assistant', 'eval-harness', 'agent-runtime'],
  },
  {
    id: 'local-llm',
    title: 'Local LLM Developer',
    summary: 'ML foundations through quantized local deployment, fine-tuning and a documented local-model project.',
    roles: ['LLM application developer', 'Junior AI application developer'],
    steps: [
      { title: 'Python and ML foundations', catalogIds: ['academy-dev-foundations', 'academy-ai-foundations'], why: 'Model work starts with Python and core ML ideas.' },
      { title: 'Model architecture and inference', catalogIds: ['academy-local-llm'], why: 'Know what you are running and what it needs.' },
      { title: 'Quantization and local deployment', catalogIds: ['academy-local-llm'], why: 'Fit useful models on consumer hardware.' },
      { title: 'Fine-tuning and evaluation', catalogIds: ['academy-local-llm'], why: 'LoRA/QLoRA plus honest benchmarks.' },
      { title: 'Build and document a local-model project', catalogIds: ['project-local-model'], why: 'Portfolio evidence for model-level work.' },
    ],
    projectIds: ['local-model', 'eval-harness'],
  },
];

export const pathById = new Map(pathTemplates.map((p) => [p.id, p]));

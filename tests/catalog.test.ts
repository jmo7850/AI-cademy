import { catalog, catalogById } from '../src/data/catalog';
import { builtInCourses, diagnosticItems } from '../src/data/curriculum';
import { pathTemplates } from '../src/data/paths';
import { projectById } from '../src/data/projects';
import { validateStudyCourse } from '../src/engine/validate';

describe('seed catalog', () => {
  it('has unique ids', () => {
    expect(new Set(catalog.map((c) => c.id)).size).toBe(catalog.length);
  });

  it('keeps every id from the first release, so saved progress still resolves', () => {
    const firstRelease = [
      'academy-ai-foundations',
      'academy-career-readiness',
      'academy-dev-foundations',
      'academy-llm-app-eng',
      'academy-local-llm',
      'aws-ai-practitioner',
      'aws-cloud-practitioner',
      'aws-cloud-practitioner-essentials',
      'claude-ai-capabilities-and-limitations',
      'claude-ai-fluency-framework-foundations',
      'claude-building-effective-human-agent-teams',
      'claude-building-with-the-claude-api',
      'claude-claude-101',
      'claude-claude-code-101',
      'claude-claude-code-in-action',
      'claude-claude-with-amazon-bedrock',
      'claude-claude-with-google-cloud-s-vertex-ai',
      'claude-introduction-to-agent-skills',
      'claude-introduction-to-model-context-protocol',
      'claude-introduction-to-subagents',
      'gcp-cloud-digital-leader',
      'gcp-generative-ai-leader',
      'gcp-intro-generative-ai',
      'ms-applied-copilot-studio',
      'ms-applied-foundry-agents',
      'ms-azure-ai-fundamentals',
      'project-agent-runtime',
      'project-local-model',
      'project-rag',
    ];
    for (const id of firstRelease) expect(catalogById.has(id), id).toBe(true);
  });

  it('covers Claude Academy, AWS, Microsoft, Google, OpenAI, AMD and NVIDIA', () => {
    for (const p of ['anthropic', 'aws', 'microsoft', 'google', 'openai', 'amd', 'nvidia']) expect(catalog.some((c) => c.provider === p)).toBe(true);
  });

  it('keeps each provider\'s own credential structure distinct', () => {
    const type = (id: string) => catalogById.get(id)?.credentialType;
    expect(type('google-ai-professional-certificate')).toBe('professional-certificate');
    expect(type('google-ai-essentials')).toBe('course-certificate');
    expect(type('nvidia-nca-genl')).toBe('foundational-cert');
    expect(type('nvidia-ncp-genl')).toBe('professional-cert');
    expect(type('amd-rocm-certified-associate')).toBe('microcredential');
    // OpenAI Academy does not mention any certificate.
    for (const e of catalog.filter((c) => c.provider === 'openai')) expect(e.credentialType).toBe('learning-resource');
    // Facts OpenAI does not publish must not be shown as verified.
    for (const e of catalog.filter((c) => c.provider === 'openai')) {
      expect(e.studyHours.status).toBe('estimate');
      expect(e.learningCost.status).toBe('unverified');
    }
  });

  it('only shows a verified exam fee for proctored certifications', () => {
    for (const e of catalog.filter((c) => c.provider === 'nvidia' && c.exam)) {
      expect(e.exam!.feeUSD!.status).toBe('verified');
      expect(e.exam!.proctored.value).toBe(true);
      expect(e.credentialFree.value).toBe(false);
    }
  });

  it('gives every official entry a source URL and check date', () => {
    for (const e of catalog.filter((c) => c.origin === 'official')) {
      expect(e.sourceUrl, e.id).toMatch(/^https:\/\//);
      expect(e.checkedOn, e.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('never classifies provider courses or badges as certifications', () => {
    for (const e of catalog.filter((c) => c.provider === 'anthropic' || c.id === 'gcp-intro-generative-ai')) {
      expect(e.credentialType).toBe('course-certificate');
    }
  });

  it('never labels app-authored entries as official', () => {
    for (const e of catalog.filter((c) => c.provider === 'academy')) {
      expect(e.origin).toBe('app');
      expect(['independent-assessment', 'portfolio-project']).toContain(e.credentialType);
    }
  });

  it('marks study time for formal certifications as an estimate unless verified', () => {
    for (const e of catalog.filter((c) => c.credentialType === 'foundational-cert')) {
      expect(['estimate', 'verified']).toContain(e.studyHours.status);
      expect(e.exam?.proctored.value).toBe(true);
    }
  });

  it('links every study course id and next step to something that exists', () => {
    const courseIds = new Set(builtInCourses.map((c) => c.id));
    for (const e of catalog) {
      if (e.studyCourseId) expect(courseIds.has(e.studyCourseId), e.id).toBe(true);
      for (const n of e.nextSteps) expect(catalogById.has(n), `${e.id} -> ${n}`).toBe(true);
      for (const p of e.prerequisiteIds ?? []) expect(catalogById.has(p), `${e.id} prereq ${p}`).toBe(true);
    }
  });
});

describe('built-in study courses', () => {
  it.each(builtInCourses.map((c) => [c.id, c] as const))('%s passes import validation', (_id, course) => {
    expect(validateStudyCourse(JSON.parse(JSON.stringify(course)))).toEqual([]);
  });

  it('has an explanation and a reason for every option', () => {
    for (const c of builtInCourses)
      for (const q of c.questions) {
        expect(q.explanation.length).toBeGreaterThan(5);
        if ('options' in q) for (const o of q.options) expect(o.why.length, `${q.id}/${o.id}`).toBeGreaterThan(0);
      }
  });

  it('has questions in every blueprint domain', () => {
    for (const c of builtInCourses.filter((x) => x.blueprint)) {
      for (const d of c.blueprint!.domains) expect(c.questions.some((q) => q.domainId === d.id), `${c.id}/${d.id}`).toBe(true);
    }
  });

  it('points flashcards and lessons at real concepts', () => {
    for (const c of builtInCourses) {
      const concepts = new Set(c.concepts.map((k) => k.id));
      for (const f of c.flashcards) expect(concepts.has(f.conceptId), f.id).toBe(true);
      for (const l of c.lessons) for (const k of l.conceptIds) expect(concepts.has(k), `${l.id}/${k}`).toBe(true);
    }
  });

  it('uses unique question ids across all courses', () => {
    const ids = builtInCourses.flatMap((c) => c.questions.map((q) => q.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('resolves diagnostic items', () => {
    for (const d of diagnosticItems) {
      const c = builtInCourses.find((x) => x.id === d.courseId);
      expect(c?.questions.some((q) => q.id === d.questionId), d.questionId).toBe(true);
    }
  });
});

describe('career path templates', () => {
  it('reference existing catalog entries and projects', () => {
    for (const p of pathTemplates) {
      for (const s of p.steps) for (const id of s.catalogIds) expect(catalogById.has(id), `${p.id}: ${id}`).toBe(true);
      for (const id of p.projectIds) expect(projectById.has(id), `${p.id}: ${id}`).toBe(true);
    }
  });
});

/**
 * Strict, ordered routes to an entry-level credential. Order and hours are fixed; the learner picks the pace.
 * A route is the shortest ordered path among the courses this app lists, not a claim that nothing faster exists,
 * and it never marks a credential earned.
 */

export interface FastTrackStep {
  catalogId: string;
  why: string;
  optional?: boolean;
}

export interface FastTrack {
  id: string;
  title: string;
  provider: string;
  summary: string;
  /** What finishing gives, in the provider's own terms. */
  credential: { name: string; kind: 'badge' | 'certification'; note: string };
  steps: FastTrackStep[];
}

export const fastTracks: FastTrack[] = [
  {
    id: 'claude',
    title: 'Claude fast track',
    provider: 'Claude Academy',
    summary: 'Three short courses, in order, to a working grasp of AI and Claude.',
    credential: {
      name: 'Course completion badges',
      kind: 'badge',
      note: 'Claude Academy lists a completion badge for its courses. It is a badge, not a certification, and there is no Claude exam in this app. Badge terms can change, so check each course page.',
    },
    steps: [
      { catalogId: 'claude-ai-fluency-framework-foundations', why: 'The vocabulary and habits every later course assumes.' },
      { catalogId: 'claude-ai-capabilities-and-limitations', why: 'What current AI can and cannot do, so you know when to trust a result.' },
      { catalogId: 'claude-claude-101', why: 'Puts the first two into practice with Claude itself.' },
      { catalogId: 'claude-claude-code-101', why: 'Only if you write software. Skip it otherwise.', optional: true },
    ],
  },
  {
    id: 'aws-ai',
    title: 'AWS AI Practitioner fast track',
    provider: 'AWS',
    summary: 'An optional on-ramp to AWS, then Poqeni practice and lessons for the AI Practitioner exam.',
    credential: {
      name: 'AWS Certified AI Practitioner',
      kind: 'certification',
      note: 'This is a proctored exam that AWS grants, not something finishing these steps earns. The exam page lists the fee, length and renewal terms and shows when each was checked. Poqeni practice never counts as the exam, and Poqeni cannot confirm a result until AWS issues it.',
    },
    steps: [
      { catalogId: 'aws-cloud-practitioner-essentials', why: 'AWS suggests it if cloud terms are new to you. Skip it if you already know what a Region, IAM and S3 are.', optional: true },
      { catalogId: 'aws-ai-practitioner', why: 'Study the five exam domains with lessons, a 60-question practice bank and the coverage view, then book the exam when your practice scores are steady.' },
    ],
  },
];

export const fastTrackById = new Map(fastTracks.map((t) => [t.id, t]));

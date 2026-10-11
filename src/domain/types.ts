/**
 * Core domain schema. Catalog/curriculum data (authored or imported) and
 * learner data (persisted) are deliberately separate types.
 */

// ---------- Provenance ----------

/** Where a piece of information came from. Rendered as a visible label. */
export type FactStatus =
  | 'verified' // read on the official provider page on `checkedOn`
  | 'unverified' // could not be confirmed on an official page
  | 'estimate'; // app-authored estimate (e.g. study time)

export interface Fact<T> {
  value: T;
  status: FactStatus;
  note?: string;
}

export type ContentOrigin = 'official' | 'app' | 'user';

// ---------- Catalog ----------

export type ProviderId = 'anthropic' | 'aws' | 'microsoft' | 'google' | 'openai' | 'amd' | 'nvidia' | 'academy' | 'custom';

/** Credential classifications from the product spec, in order. */
export type CredentialType =
  | 'professional-cert'
  | 'foundational-cert'
  | 'professional-certificate'
  | 'course-certificate'
  | 'microcredential'
  | 'independent-assessment'
  | 'portfolio-project'
  | 'learning-resource';

/** A–D: Claude, AWS, Microsoft, Google. E–H: app tracks. I–K: OpenAI, AMD, NVIDIA. */
export type Track = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type Availability = 'available' | 'retired' | 'unknown';
export type SkillCategory = 'ai' | 'cloud' | 'programming' | 'career';

export interface ExamInfo {
  code?: Fact<string>;
  feeUSD?: Fact<number | null>;
  minutes?: Fact<number>;
  questions?: Fact<string>;
  proctored: Fact<boolean>;
  passing?: Fact<string>;
  validity?: Fact<string>;
}

export interface CatalogEntry {
  id: string;
  title: string;
  provider: ProviderId;
  track: Track;
  category: SkillCategory;
  credentialType: CredentialType;
  difficulty: Difficulty;
  prerequisites: string[];
  /** Prerequisite catalog ids (soft; used for warnings and ordering). */
  prerequisiteIds?: string[];
  studyHours: Fact<number>;
  learningCost: Fact<'free' | 'paid' | 'mixed'>;
  /** True when the credential itself (badge/cert) costs nothing to earn. */
  credentialFree: Fact<boolean>;
  exam?: ExamInfo;
  officialUrl?: string;
  registrationUrl?: string;
  sourceUrl?: string;
  checkedOn?: string; // ISO date the official facts were last read
  availability: Fact<Availability>;
  objectives: string[];
  /** What earning this actually proves, in plain words. */
  proves: string;
  programmingRequired: boolean;
  handsOn: boolean;
  careerValue: string;
  nextSteps: string[];
  origin: ContentOrigin;
  /** Id of the in-app study course that prepares for this entry, if any. */
  studyCourseId?: string;
  tags?: string[];
}

// ---------- Curriculum ----------

export interface Concept {
  id: string;
  label: string;
}

export interface LessonSection {
  heading: string;
  body: string; // short paragraph(s); blank-line separated
  details?: string; // progressive disclosure: "Go deeper"
  example?: string; // worked example
  code?: string;
  /** A simple flow diagram, drawn from text so it is accessible and safe for imported courses. */
  diagram?: { caption: string; flow: string[] };
  /** Something that looks like the idea but is not. */
  nonExample?: string;
  /** A common wrong belief, stated and corrected. */
  misconception?: string;
  /** One or two lines to remember. */
  recap?: string;
}

/** Where a question is taught: a lesson and the zero-based index of its section. */
export interface TeachIn {
  lessonId: string;
  section: number;
}

export interface Lesson {
  id: string;
  title: string;
  minutes: number; // app estimate
  objectives: string[];
  conceptIds: string[];
  sections: LessonSection[];
  /** Question ids used as the end-of-lesson knowledge check. */
  checkIds: string[];
  practical?: string;
  sourceLinks?: { label: string; url: string }[];
}

export interface Option {
  id: string;
  text: string;
  /** Why this option is right or wrong (misconception for distractors). */
  why: string;
}

interface QuestionBase {
  id: string;
  conceptIds: string[];
  domainId?: string;
  difficulty: 1 | 2 | 3;
  prompt: string;
  code?: string;
  explanation: string;
  /** The lesson section that teaches this, so a miss can link straight back to it. */
  teachIn?: TeachIn;
}

export interface ChoiceQuestion extends QuestionBase {
  kind: 'single' | 'multi' | 'truefalse';
  options: Option[];
  correct: string[];
  /** Keep option order (e.g. "All of the above"); default shuffles. */
  fixedOrder?: boolean;
}

export interface FillQuestion extends QuestionBase {
  kind: 'fill';
  /** Accepted answers; compared after normalisation. */
  accept: string[];
  /** Optional regexes for valid equivalent forms (case-insensitive). */
  acceptPatterns?: string[];
  numeric?: { value: number; tolerance: number };
}

export interface OrderQuestion extends QuestionBase {
  kind: 'order';
  items: { id: string; text: string }[]; // stored in correct order
}

export interface MatchQuestion extends QuestionBase {
  kind: 'match';
  pairs: { id: string; left: string; right: string }[];
}

export type Question = ChoiceQuestion | FillQuestion | OrderQuestion | MatchQuestion;

export type Answer =
  | { kind: 'choice'; selected: string[] }
  | { kind: 'fill'; text: string }
  | { kind: 'order'; order: string[] }
  | { kind: 'match'; mapping: Record<string, string> };

export interface Flashcard {
  id: string;
  conceptId: string;
  front: string;
  back: string;
}

export interface ExamDomain {
  id: string;
  name: string;
  weight: number; // percent of scored content (midpoint when published as a range)
  weightLabel?: string; // e.g. "40–45%" when the provider publishes a range
}

export interface ExamBlueprint {
  title: string;
  /** Domains + weights as published; `weightsStatus` says if verified. */
  domains: ExamDomain[];
  weightsStatus: FactStatus;
  officialQuestionCount?: number;
  officialMinutes?: number;
  passPercent: number; // app readiness threshold, not the official cut score
  sourceUrl?: string;
}

export interface StudyCourse {
  id: string;
  title: string;
  catalogId?: string;
  summary: string;
  origin: ContentOrigin;
  concepts: Concept[];
  lessons: Lesson[];
  questions: Question[];
  flashcards: Flashcard[];
  blueprint?: ExamBlueprint;
}

// ---------- Career paths & projects ----------

export interface PathStep {
  title: string;
  catalogIds: string[];
  why: string;
  /** The entries are interchangeable options; one is recommended (preferred provider first). */
  chooseOne?: boolean;
}

export interface PathTemplate {
  id: string;
  title: string;
  summary: string;
  roles: string[];
  steps: PathStep[];
  projectIds: string[];
}

export interface Project {
  id: string;
  title: string;
  level: 'exercise' | 'project' | 'capstone';
  hardware: 'laptop' | 'gpu-recommended' | 'gpu-required';
  objectives: string[];
  prerequisites: string[];
  milestones: { id: string; text: string }[];
  definitionOfDone: string[];
  validation: string[];
  skills: string[];
  hours: Fact<number>;
}

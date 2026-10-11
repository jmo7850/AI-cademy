import type { StudyCourse } from '../../domain/types';
import { card, match, multi, single, tf } from './helpers';

/* Original practice questions aligned to published objectives. Not official exam questions. */

export const awsClf: StudyCourse = {
  id: 'study-aws-clf',
  catalogId: 'aws-cloud-practitioner',
  title: 'AWS Certified Cloud Practitioner prep',
  summary: 'Core cloud concepts, security, services and billing for CLF-C02.',
  origin: 'app',
  concepts: [
    { id: 'clf.concepts', label: 'Cloud value and concepts' },
    { id: 'clf.security', label: 'Shared responsibility and IAM' },
    { id: 'clf.services', label: 'Core AWS services' },
    { id: 'clf.billing', label: 'Pricing and support' },
  ],
  blueprint: {
    title: 'CLF-C02 practice exam',
    domains: [
      { id: 'd1', name: 'Cloud Concepts', weight: 24 },
      { id: 'd2', name: 'Security and Compliance', weight: 30 },
      { id: 'd3', name: 'Cloud Technology and Services', weight: 34 },
      { id: 'd4', name: 'Billing, Pricing, and Support', weight: 12 },
    ],
    weightsStatus: 'verified',
    officialQuestionCount: 65,
    officialMinutes: 90,
    passPercent: 75,
    sourceUrl: 'https://docs.aws.amazon.com/aws-certification/latest/cloud-practitioner-02/cloud-practitioner-02.html',
  },
  lessons: [
    {
      id: 'aws-clf-1',
      title: 'Cloud essentials for the exam',
      minutes: 10,
      objectives: ['Explain cloud benefits and global infrastructure', 'Apply the shared responsibility model', 'Pick core services by need'],
      conceptIds: ['clf.concepts', 'clf.security', 'clf.services', 'clf.billing'],
      sections: [
        {
          heading: 'Why cloud',
          body: 'Trade fixed up-front spending for pay-as-you-go, scale up and down on demand, and deploy globally in minutes. AWS Regions contain multiple isolated Availability Zones; deploying across AZs improves availability.',
        },
        {
          heading: 'Shared responsibility',
          body: 'AWS is responsible for security "of" the cloud: hardware, facilities, the global network. You are responsible for security "in" the cloud: your data, IAM users and permissions, and (on EC2) the guest operating system and patches.',
          details: 'IAM best practices: protect the root user with MFA and do not use it daily; grant least privilege; prefer roles over long-lived access keys.',
        },
        {
          heading: 'Core services and billing',
          body: 'Compute: EC2 (virtual servers), Lambda (run code without servers). Storage: S3 (objects), EBS (block volumes for EC2). Databases: RDS (managed relational), DynamoDB (managed NoSQL). Networking: VPC, CloudFront (CDN).\n\nCost tools: AWS Budgets alerts on spend; Cost Explorer analyses it; the Pricing Calculator estimates it.',
        },
      ],
      checkIds: ['aws-clf-q1', 'aws-clf-q3', 'aws-clf-q6'],
      sourceLinks: [{ label: 'CLF-C02 exam guide', url: 'https://docs.aws.amazon.com/aws-certification/latest/cloud-practitioner-02/cloud-practitioner-02.html' }],
    },
  ],
  questions: [
    single('aws-clf-q1', ['clf.concepts'], 'Which benefit describes replacing large up-front hardware purchases with paying only for what you use?', [
      { t: 'Trade fixed expense for variable expense', why: 'Correct.', ok: true },
      { t: 'Increase speed and agility', why: 'A benefit, but about time to provision.' },
      { t: 'Go global in minutes', why: 'About geographic reach.' },
      { t: 'Stop guessing capacity', why: 'About scaling, though related.' },
    ], 'CapEx → OpEx is the core economic benefit.', { domain: 'd1' }),
    single('aws-clf-q2', ['clf.concepts'], 'How do you make an application resilient to the failure of a single data centre in one Region?', [
      { t: 'Deploy across multiple Availability Zones', why: 'Correct: AZs are isolated within a Region.', ok: true },
      { t: 'Use a larger EC2 instance', why: 'Bigger is not more available.' },
      { t: 'Use one edge location', why: 'Edge locations cache content; they do not host your app tier.' },
      { t: 'Enable MFA', why: 'Security, not availability.' },
    ], 'Multi-AZ for high availability; multi-Region for disaster recovery and latency.', { domain: 'd1', level: 2 }),
    single('aws-clf-q3', ['clf.security'], 'For an EC2 instance, who patches the guest operating system?', [
      { t: 'The customer', why: 'Correct: the OS on EC2 is "in" the cloud.', ok: true },
      { t: 'AWS', why: 'AWS patches the host and hypervisor, not your guest OS.' },
      { t: 'Both equally', why: 'Responsibilities are divided, not shared equally here.' },
      { t: 'The AWS Marketplace vendor', why: 'Only for vendor-managed software, and still not by default.' },
    ], 'Managed services (e.g. RDS) shift more patching to AWS.', { domain: 'd2' }),
    multi('aws-clf-q4', ['clf.security'], 'Which are IAM best practices? (Select all that apply.)', [
      { t: 'Enable MFA on the root user', why: 'Correct.', ok: true },
      { t: 'Grant least privilege', why: 'Correct.', ok: true },
      { t: 'Use the root user for daily admin work', why: 'Avoid using root for everyday tasks.' },
      { t: 'Share one IAM user across the team', why: 'Each person needs their own identity for auditing.' },
    ], 'Root locked away, MFA everywhere, least privilege, roles over keys.', { domain: 'd2' }),
    single('aws-clf-q5', ['clf.security'], 'Which service protects web applications from common exploits like SQL injection?', [
      { t: 'AWS WAF', why: 'Correct: web application firewall.', ok: true },
      { t: 'AWS Shield', why: 'Focused on DDoS protection.' },
      { t: 'Amazon GuardDuty', why: 'Threat detection from logs.' },
      { t: 'AWS KMS', why: 'Key management for encryption.' },
    ], 'WAF filters HTTP requests by rules.', { domain: 'd2', level: 2 }),
    match('aws-clf-q6', ['clf.services'], 'Match each need to the AWS service.', [
      ['Store files as objects', 'Amazon S3'],
      ['Run code without managing servers', 'AWS Lambda'],
      ['Managed relational database', 'Amazon RDS'],
      ['Virtual servers', 'Amazon EC2'],
    ], 'Know one-line purposes for the core services.', { domain: 'd3' }),
    single('aws-clf-q7', ['clf.services'], 'Which service delivers content to users with low latency using edge locations?', [
      { t: 'Amazon CloudFront', why: 'Correct: the AWS CDN.', ok: true },
      { t: 'Amazon Route 53', why: 'DNS, not caching.' },
      { t: 'Amazon VPC', why: 'Private networking.' },
      { t: 'AWS Direct Connect', why: 'Dedicated private link to AWS.' },
    ], 'CDN = CloudFront.', { domain: 'd3' }),
    single('aws-clf-q8', ['clf.services'], 'A workload needs a serverless NoSQL key-value database with single-digit millisecond latency. Which service?', [
      { t: 'Amazon DynamoDB', why: 'Correct.', ok: true },
      { t: 'Amazon RDS', why: 'Relational.' },
      { t: 'Amazon Redshift', why: 'Data warehouse for analytics.' },
      { t: 'Amazon S3', why: 'Object storage, not a database.' },
    ], 'DynamoDB = managed NoSQL.', { domain: 'd3', level: 2 }),
    single('aws-clf-q11', ['clf.services'], 'An EC2 instance needs a persistent disk volume for its operating system and database files. Which service provides it?', [
      { t: 'Amazon EBS', why: 'Correct: block storage volumes that attach to EC2.', ok: true },
      { t: 'Amazon S3', why: 'Object storage over HTTP, not an attached disk.' },
      { t: 'Amazon CloudFront', why: 'Content delivery, not storage for an instance.' },
      { t: 'AWS Backup', why: 'Manages backups; it is not the volume itself.' },
    ], 'EBS = block disk for EC2; S3 = objects.', { domain: 'd3' }),
    single('aws-clf-q9', ['clf.billing'], 'Which tool sends an alert when monthly spend is forecast to exceed a set amount?', [
      { t: 'AWS Budgets', why: 'Correct.', ok: true },
      { t: 'AWS Pricing Calculator', why: 'Estimates before you build.' },
      { t: 'AWS Cost Explorer', why: 'Analyses past and forecast spend, but alerts are Budgets.' },
      { t: 'AWS Artifact', why: 'Compliance reports.' },
    ], 'Budgets alerts; Cost Explorer analyses; Calculator estimates.', { domain: 'd4' }),
    tf('aws-clf-q10', ['clf.billing'], 'Savings Plans and Reserved Instances can reduce cost in exchange for a usage commitment.', true,
      'Correct: commitment discounts.',
      'They are AWS\'s commitment-based discount models.',
      'Spot Instances are another discount option for interruptible work.', { domain: 'd4' }),
  ],
  flashcards: [
    card('aws-clf-f1', 'clf.security', 'Shared responsibility', 'AWS: security OF the cloud. You: security IN the cloud.'),
    card('aws-clf-f2', 'clf.concepts', 'Availability Zone', 'One or more isolated data centres within a Region.'),
    card('aws-clf-f3', 'clf.billing', 'Budgets vs Cost Explorer', 'Budgets alerts on thresholds; Cost Explorer analyses spend.'),
    card('aws-clf-f4', 'clf.services', 'S3 vs EBS', 'S3 = object storage over HTTP; EBS = block disk attached to EC2.'),
  ],
};

export const gcpGail: StudyCourse = {
  id: 'study-gcp-gail',
  catalogId: 'gcp-generative-ai-leader',
  title: 'Google Cloud Generative AI Leader prep',
  summary: 'Business-level gen AI concepts and Google Cloud offerings, aligned to the four published exam areas.',
  origin: 'app',
  concepts: [
    { id: 'g.fund', label: 'Gen AI fundamentals' },
    { id: 'g.offer', label: 'Google Cloud gen AI offerings' },
    { id: 'g.improve', label: 'Improving model output' },
    { id: 'g.strategy', label: 'Business strategy for gen AI' },
  ],
  blueprint: {
    title: 'Generative AI Leader practice exam',
    domains: [
      { id: 'd1', name: 'Fundamentals of gen AI', weight: 25 },
      { id: 'd2', name: "Google Cloud's gen AI offerings", weight: 25 },
      { id: 'd3', name: 'Techniques to improve gen AI model output', weight: 25 },
      { id: 'd4', name: 'Business strategies for a successful gen AI solution', weight: 25 },
    ],
    weightsStatus: 'unverified',
    passPercent: 75,
    sourceUrl: 'https://cloud.google.com/learn/certification/generative-ai-leader',
  },
  lessons: [
    {
      id: 'gcp-gail-1',
      title: 'Gen AI leadership essentials',
      minutes: 8,
      objectives: ['Explain grounding and why it matters', 'Place Vertex AI and Gemini in Google Cloud', 'Frame a gen AI business case'],
      conceptIds: ['g.fund', 'g.offer', 'g.improve', 'g.strategy'],
      sections: [
        {
          heading: 'Offerings',
          body: 'Gemini is Google\'s family of multimodal models. Vertex AI is Google Cloud\'s platform for building with models, including Model Garden for choosing first- and third-party models.',
          details: 'Equal domain weights in this app\'s simulator are an app assumption: Google lists the four areas but the weights were not shown on the certification page.',
        },
        {
          heading: 'Better output',
          body: 'Prompt engineering, grounding in enterprise data or search, and tuning improve output. Grounding connects responses to verifiable sources and reduces hallucination.',
        },
        {
          heading: 'Business strategy',
          body: 'Start with a valuable, measurable use case; involve stakeholders; plan for data readiness, security and responsible AI; measure outcomes after launch.',
        },
      ],
      checkIds: ['g-q1', 'g-q3', 'g-q5'],
      sourceLinks: [{ label: 'Generative AI Leader certification', url: 'https://cloud.google.com/learn/certification/generative-ai-leader' }],
    },
  ],
  questions: [
    single('g-q1', ['g.offer'], 'Which Google Cloud platform is used to build, deploy and manage ML and gen AI models?', [
      { t: 'Vertex AI', why: 'Correct.', ok: true },
      { t: 'BigQuery', why: 'Data warehouse, though it has ML features.' },
      { t: 'Cloud Storage', why: 'Object storage.' },
      { t: 'Cloud Run', why: 'Runs containers.' },
    ], 'Vertex AI is the unified AI platform.', { domain: 'd2' }),
    single('g-q2', ['g.offer'], 'Where in Vertex AI can a team browse and choose from many first- and third-party models?', [
      { t: 'Model Garden', why: 'Correct.', ok: true },
      { t: 'Cloud Shell', why: 'A terminal.' },
      { t: 'Looker', why: 'Business intelligence.' },
      { t: 'Cloud Armor', why: 'Security service.' },
    ], 'Model Garden is the model catalogue.', { domain: 'd2' }),
    single('g-q3', ['g.improve'], 'A model must answer with facts from the company\'s internal documents and cite them. Which technique fits best?', [
      { t: 'Grounding on enterprise data', why: 'Correct: ties answers to verifiable sources.', ok: true },
      { t: 'Raising temperature', why: 'Adds randomness.' },
      { t: 'Training a model from scratch', why: 'Very costly; unnecessary.' },
      { t: 'Shorter prompts', why: 'Does not add knowledge.' },
    ], 'Grounding reduces hallucination and enables citations.', { domain: 'd3' }),
    tf('g-q4', ['g.fund'], 'Multimodal models can take more than one type of input, such as text and images.', true,
      'Correct.', 'That is the definition of multimodal.', 'Gemini models are multimodal.', { domain: 'd1' }),
    single('g-q5', ['g.strategy'], 'What is the best first step for a successful gen AI initiative?', [
      { t: 'Pick a high-value use case with measurable success criteria', why: 'Correct: value and measurement drive adoption.', ok: true },
      { t: 'Buy the largest available model', why: 'Model choice follows the use case.' },
      { t: 'Roll out to every department at once', why: 'High risk without a proven case.' },
      { t: 'Skip data readiness review', why: 'Data quality determines results.' },
    ], 'Start small, measure, then scale.', { domain: 'd4' }),
    single('g-q6', ['g.fund'], 'Which statement about foundation models is accurate?', [
      { t: 'They are trained on broad data and can be adapted to many tasks', why: 'Correct.', ok: true },
      { t: 'They only work for one specific task', why: 'That describes narrow models.' },
      { t: 'They never produce errors', why: 'They can hallucinate.' },
      { t: 'They always know current events', why: 'Knowledge stops at the training cutoff unless grounded.' },
    ], 'Broad pre-training → adaptable.', { domain: 'd1' }),
    multi('g-q7', ['g.strategy'], 'Which belong in a responsible gen AI rollout? (Select all that apply.)', [
      { t: 'Human oversight for high-impact outputs', why: 'Correct.', ok: true },
      { t: 'Clear data privacy and security controls', why: 'Correct.', ok: true },
      { t: 'Monitoring quality after launch', why: 'Correct.', ok: true },
      { t: 'Hiding that AI is used from users', why: 'Transparency is a core principle.' },
    ], 'Oversight, privacy, monitoring and transparency.', { domain: 'd4' }),
    single('g-q8', ['g.improve'], 'Which technique adapts a model to a specialised style using example data, beyond prompting?', [
      { t: 'Tuning (fine-tuning)', why: 'Correct.', ok: true },
      { t: 'Grounding', why: 'Adds facts at query time; does not change style training.' },
      { t: 'Zero-shot prompting', why: 'No examples, no tuning.' },
      { t: 'Caching', why: 'Performance technique.' },
    ], 'Tune for behaviour; ground for facts.', { domain: 'd3', level: 2 }),
  ],
  flashcards: [
    card('g-f1', 'g.offer', 'Vertex AI', 'Google Cloud\'s platform to build, deploy and manage ML and gen AI.'),
    card('g-f2', 'g.improve', 'Grounding', 'Connecting model output to verifiable sources such as enterprise data or search.'),
    card('g-f3', 'g.offer', 'Model Garden', 'Vertex AI catalogue of first- and third-party models.'),
  ],
};

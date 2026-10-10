import type { StudyCourse } from '../../domain/types';
import { card, match, multi, single, tf } from './helpers';

/*
 * Original practice questions aligned to the published AIF-C01 domains.
 * They are not official AWS questions.
 */
export const awsAif: StudyCourse = {
  id: 'study-aws-aif',
  catalogId: 'aws-ai-practitioner',
  title: 'AWS Certified AI Practitioner prep',
  summary: 'Domain-by-domain prep for AIF-C01 with original practice questions.',
  origin: 'app',
  concepts: [
    { id: 'aif.mlbasics', label: 'AI/ML terminology and lifecycle' },
    { id: 'aif.genai', label: 'Generative AI concepts and limits' },
    { id: 'aif.bedrock', label: 'Amazon Bedrock and foundation models' },
    { id: 'aif.customize', label: 'Prompting, RAG and fine-tuning choices' },
    { id: 'aif.responsible', label: 'Responsible AI on AWS' },
    { id: 'aif.security', label: 'Security, compliance and governance' },
    { id: 'aif.services', label: 'AWS AI services' },
  ],
  blueprint: {
    title: 'AIF-C01 practice exam',
    domains: [
      { id: 'd1', name: 'Fundamentals of AI and ML', weight: 20 },
      { id: 'd2', name: 'Fundamentals of Generative AI', weight: 24 },
      { id: 'd3', name: 'Applications of Foundation Models', weight: 28 },
      { id: 'd4', name: 'Guidelines for Responsible AI', weight: 14 },
      { id: 'd5', name: 'Security, Compliance, and Governance for AI Solutions', weight: 14 },
    ],
    weightsStatus: 'verified',
    officialQuestionCount: 65,
    officialMinutes: 90,
    passPercent: 75,
    sourceUrl: 'https://docs.aws.amazon.com/aws-certification/latest/ai-practitioner-01/ai-practitioner-01.html',
  },
  lessons: [
    {
      id: 'aws-aif-1',
      title: 'Exam map and AWS AI building blocks',
      minutes: 10,
      objectives: ['Know the five domains and their weights', 'Place Bedrock, SageMaker AI and the task-specific AI services'],
      conceptIds: ['aif.services', 'aif.bedrock', 'aif.mlbasics'],
      sections: [
        {
          heading: 'What the exam covers',
          body: 'AIF-C01 has five domains. Applications of foundation models carries the most weight (28%), then generative AI fundamentals (24%), AI/ML fundamentals (20%), and responsible AI and security/governance (14% each).\n\n50 of the 65 questions are scored. You need 700 on a 100–1,000 scale overall; domains are not passed separately.',
        },
        {
          heading: 'Three layers of AWS AI',
          body: 'Task-specific AI services solve one job with an API, no ML expertise needed: e.g. Amazon Comprehend (text analysis), Amazon Rekognition (images and video), Amazon Transcribe (speech to text), Amazon Polly (text to speech), Amazon Translate, Amazon Textract (document text and forms).\n\nAmazon Bedrock gives API access to foundation models from several providers, plus features such as knowledge bases, agents and guardrails.\n\nAmazon SageMaker AI is for building, training and deploying your own ML models.',
          details: 'Exam pattern: if the scenario wants the least ML effort for a common task, pick the task-specific service. If it wants generative AI without managing infrastructure, pick Bedrock. If it needs a custom-trained model, pick SageMaker AI.',
        },
      ],
      checkIds: ['aws-aif-q1', 'aws-aif-q9', 'aws-aif-q10'],
      practical: 'Open the AWS console free tier or the Bedrock documentation and list three model providers available in Bedrock in your region.',
      sourceLinks: [
        { label: 'AIF-C01 exam guide', url: 'https://docs.aws.amazon.com/aws-certification/latest/ai-practitioner-01/ai-practitioner-01.html' },
        { label: 'Amazon Bedrock documentation', url: 'https://docs.aws.amazon.com/bedrock/' },
      ],
    },
    {
      id: 'aws-aif-2',
      title: 'Customising foundation models and staying safe',
      minutes: 10,
      objectives: ['Choose between prompting, RAG and fine-tuning', 'Name AWS controls for responsible and secure AI'],
      conceptIds: ['aif.customize', 'aif.responsible', 'aif.security'],
      sections: [
        {
          heading: 'Cheapest change first',
          body: 'Prompt engineering changes nothing in the model and costs least. RAG adds current or private knowledge at query time (Bedrock Knowledge Bases manage this). Fine-tuning changes model weights to learn a style or task from labelled examples, and costs the most to build and maintain.',
          example: 'Policy documents change weekly → RAG. You need a consistent brand voice in thousands of outputs → consider fine-tuning.',
        },
        {
          heading: 'Responsible and secure',
          body: 'Amazon Bedrock Guardrails filter harmful content, deny topics and redact sensitive information. SageMaker Clarify helps detect bias and explain predictions. IAM controls who can call models; AWS CloudTrail records API calls for audit.\n\nUnder the shared responsibility model, AWS secures the cloud infrastructure; you secure your data, access and configuration.',
        },
      ],
      checkIds: ['aws-aif-q11', 'aws-aif-q14', 'aws-aif-q17'],
      sourceLinks: [{ label: 'Amazon Bedrock Guardrails', url: 'https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html' }],
    },
  ],
  questions: [
    // Domain 1
    single('aws-aif-q1', ['aif.services'], 'A company wants to extract printed text and form fields from scanned invoices with the least ML expertise. Which service fits best?', [
      { t: 'Amazon Textract', why: 'Correct: purpose-built for text and form extraction from documents.', ok: true },
      { t: 'Amazon SageMaker AI', why: 'Would work only after building and training a custom model: more effort.' },
      { t: 'Amazon Comprehend', why: 'Analyses text that already exists; it does not read scanned images.' },
      { t: 'Amazon Polly', why: 'Polly converts text to speech.' },
    ], 'Least effort + common task = a task-specific AI service.', { domain: 'd1' }),
    single('aws-aif-q2', ['aif.mlbasics'], 'A model scores 99% on training data but 70% on new data. What is the most likely problem?', [
      { t: 'Overfitting', why: 'Correct: it memorised training data instead of generalising.', ok: true },
      { t: 'Underfitting', why: 'Underfitting would show poor training accuracy too.' },
      { t: 'Data drift', why: 'Drift happens over time in production; this gap appears immediately.' },
      { t: 'Hallucination', why: 'A generative AI term, not a training/validation gap.' },
    ], 'Fixes include more data, regularisation, or a simpler model.', { domain: 'd1', level: 2 }),
    single('aws-aif-q3', ['aif.mlbasics'], 'Grouping customers into segments when there are no labels is an example of which learning type?', [
      { t: 'Unsupervised learning', why: 'Correct: clustering finds structure without labels.', ok: true },
      { t: 'Supervised learning', why: 'Needs labelled examples.' },
      { t: 'Reinforcement learning', why: 'Learns from rewards through actions.' },
      { t: 'Transfer learning', why: 'Reuses a trained model; does not describe this task.' },
    ], 'No labels + grouping = clustering, an unsupervised method.', { domain: 'd1' }),
    match('aws-aif-q4', ['aif.mlbasics'], 'Match each ML lifecycle stage to its activity.', [
      ['Data preparation', 'Clean, label and split data'],
      ['Training', 'Fit model weights to data'],
      ['Evaluation', 'Measure performance on held-out data'],
      ['Monitoring', 'Watch for drift after deployment'],
    ], 'The lifecycle continues after deployment: monitoring triggers retraining.', { domain: 'd1' }),
    // Domain 2
    single('aws-aif-q5', ['aif.genai'], 'Which setting most directly makes a model\'s output more random and varied?', [
      { t: 'Higher temperature', why: 'Correct: temperature flattens the token probability distribution.', ok: true },
      { t: 'Lower temperature', why: 'Makes output more deterministic.' },
      { t: 'Smaller max tokens', why: 'Limits length, not randomness.' },
      { t: 'More stop sequences', why: 'Controls where output stops.' },
    ], 'Use low temperature for factual or structured tasks.', { domain: 'd2' }),
    tf('aws-aif-q6', ['aif.genai'], 'A foundation model is a large model pre-trained on broad data that can be adapted to many tasks.', true,
      'Correct: that is the definition.',
      'It is the standard definition used by AWS and the research community.',
      'Foundation models are general-purpose starting points for many tasks.', { domain: 'd2' }),
    multi('aws-aif-q7', ['aif.genai'], 'Which are known limitations of generative AI? (Select all that apply.)', [
      { t: 'Hallucinations', why: 'Correct.', ok: true },
      { t: 'Non-deterministic output', why: 'Correct: the same prompt can give different answers.', ok: true },
      { t: 'Knowledge cutoff', why: 'Correct: no knowledge after training unless supplied.', ok: true },
      { t: 'Cannot process text', why: 'Text is their main input.' },
    ], 'Design around these with grounding, low temperature and evaluation.', { domain: 'd2' }),
    single('aws-aif-q8', ['aif.genai'], 'Which use case is a poor fit for generative AI on its own?', [
      { t: 'Calculating exact tax owed for regulatory filing', why: 'Correct: requires deterministic, auditable calculation.', ok: true },
      { t: 'Drafting marketing copy variations', why: 'A strong fit.' },
      { t: 'Summarising meeting notes', why: 'A strong fit.' },
      { t: 'Generating code suggestions for review', why: 'A common fit with human review.' },
    ], 'Use deterministic systems where exactness and auditability are required.', { domain: 'd2', level: 2 }),
    // Domain 3
    single('aws-aif-q9', ['aif.bedrock'], 'A team wants to use foundation models from several providers through one managed API without managing infrastructure. Which service?', [
      { t: 'Amazon Bedrock', why: 'Correct: managed API access to multiple foundation models.', ok: true },
      { t: 'Amazon EC2', why: 'You would manage servers and models yourself.' },
      { t: 'Amazon Rekognition', why: 'Task-specific vision service.' },
      { t: 'AWS Lambda', why: 'Runs your code; does not provide models.' },
    ], 'Bedrock = serverless access to foundation models plus features like knowledge bases, agents and guardrails.', { domain: 'd3' }),
    single('aws-aif-q10', ['aif.bedrock', 'aif.customize'], 'A chatbot must answer from HR policies that change every week. Which approach is most cost-effective?', [
      { t: 'RAG with Amazon Bedrock Knowledge Bases', why: 'Correct: updates are re-indexed, no retraining.', ok: true },
      { t: 'Fine-tune a model every week', why: 'Expensive and slow for frequently changing facts.' },
      { t: 'Pre-train a new model', why: 'Far too costly.' },
      { t: 'Increase temperature', why: 'Does not add knowledge.' },
    ], 'Frequently changing knowledge → retrieval, not training.', { domain: 'd3', level: 2 }),
    single('aws-aif-q11', ['aif.customize'], 'Which approach changes the model\'s weights using labelled task examples?', [
      { t: 'Fine-tuning', why: 'Correct.', ok: true },
      { t: 'Prompt engineering', why: 'Changes inputs only.' },
      { t: 'RAG', why: 'Adds context at query time; weights unchanged.' },
      { t: 'Inference parameter tuning', why: 'Changes generation settings, not weights.' },
    ], 'Order of cost: prompting < RAG < fine-tuning < pre-training.', { domain: 'd3' }),
    single('aws-aif-q12', ['aif.customize'], 'Which metric is commonly used to evaluate text summarisation against reference summaries?', [
      { t: 'ROUGE', why: 'Correct: measures overlap with reference summaries.', ok: true },
      { t: 'Accuracy', why: 'Suited to classification, not free text.' },
      { t: 'Mean squared error', why: 'For numeric regression.' },
      { t: 'Latency', why: 'An operational metric, not quality.' },
    ], 'ROUGE for summarisation, BLEU for translation; human or model-based review for nuance.', { domain: 'd3', level: 2 }),
    single('aws-aif-q13', ['aif.bedrock'], 'An application must let a model look up order status in an internal API during a conversation. Which Bedrock capability fits?', [
      { t: 'Amazon Bedrock Agents (with action groups)', why: 'Correct: agents call APIs to complete tasks.', ok: true },
      { t: 'Amazon Bedrock Guardrails', why: 'Filters content; does not call APIs.' },
      { t: 'Model evaluation', why: 'Compares model quality.' },
      { t: 'Provisioned throughput', why: 'Reserves capacity.' },
    ], 'Agents orchestrate tool/API calls on the model\'s behalf.', { domain: 'd3', level: 2 }),
    // Domain 4
    single('aws-aif-q14', ['aif.responsible'], 'A loan-approval model approves one demographic group far less often. Which AWS tool helps detect this bias?', [
      { t: 'Amazon SageMaker Clarify', why: 'Correct: bias detection and explainability.', ok: true },
      { t: 'AWS CloudTrail', why: 'Audits API calls.' },
      { t: 'Amazon Polly', why: 'Text to speech.' },
      { t: 'AWS Shield', why: 'DDoS protection.' },
    ], 'Clarify measures bias in data and predictions and explains feature influence.', { domain: 'd4' }),
    multi('aws-aif-q15', ['aif.responsible'], 'Which are dimensions of responsible AI? (Select all that apply.)', [
      { t: 'Fairness', why: 'Correct.', ok: true },
      { t: 'Explainability', why: 'Correct.', ok: true },
      { t: 'Privacy and security', why: 'Correct.', ok: true },
      { t: 'Lowest possible cost', why: 'Cost matters, but it is not a responsible-AI dimension.' },
    ], 'Others include safety, controllability, veracity and robustness, governance and transparency.', { domain: 'd4' }),
    tf('aws-aif-q16', ['aif.responsible'], 'Human review of high-impact model decisions is a responsible-AI practice.', true,
      'Correct: human oversight reduces harm from errors.',
      'Human-in-the-loop review is widely recommended for high-impact decisions.',
      'Amazon Augmented AI (A2I) is one AWS service for human review workflows.', { domain: 'd4' }),
    // Domain 5
    single('aws-aif-q17', ['aif.security'], 'Under the shared responsibility model for Amazon Bedrock, which is the customer\'s responsibility?', [
      { t: 'Controlling who can invoke models with IAM policies', why: 'Correct: access configuration is the customer\'s.', ok: true },
      { t: 'Physical security of data centres', why: 'AWS.' },
      { t: 'Patching the underlying hosts', why: 'AWS, for managed services.' },
      { t: 'Hardware replacement', why: 'AWS.' },
    ], 'AWS secures the cloud; you secure what you put in it and who can access it.', { domain: 'd5' }),
    single('aws-aif-q18', ['aif.security'], 'Auditors want a record of who called which Bedrock API and when. Which service provides it?', [
      { t: 'AWS CloudTrail', why: 'Correct: records API activity.', ok: true },
      { t: 'Amazon CloudWatch dashboards', why: 'Metrics and logs, but API audit trail is CloudTrail.' },
      { t: 'Amazon Macie', why: 'Discovers sensitive data in S3.' },
      { t: 'AWS Config', why: 'Tracks resource configuration changes, not API calls per user.' },
    ], 'CloudTrail = who did what, when.', { domain: 'd5', level: 2 }),
    single('aws-aif-q19', ['aif.security'], 'A team must find personal data in S3 training data before using it. Which service helps?', [
      { t: 'Amazon Macie', why: 'Correct: discovers sensitive data in S3.', ok: true },
      { t: 'Amazon Inspector', why: 'Scans workloads for vulnerabilities.' },
      { t: 'AWS Artifact', why: 'Provides compliance reports.' },
      { t: 'Amazon Comprehend Medical', why: 'Analyses medical text; not an S3 discovery tool.' },
    ], 'Data governance starts with knowing what data you hold.', { domain: 'd5', level: 2 }),
    single('aws-aif-q20', ['aif.security'], 'Where can a customer download AWS compliance reports such as SOC reports?', [
      { t: 'AWS Artifact', why: 'Correct.', ok: true },
      { t: 'AWS Trusted Advisor', why: 'Best-practice checks.' },
      { t: 'Amazon Bedrock console', why: 'Not where compliance reports live.' },
      { t: 'AWS Support Center', why: 'Support cases, not reports.' },
    ], 'Artifact = on-demand compliance documents.', { domain: 'd5' }),
  ],
  flashcards: [
    card('aws-aif-f1', 'aif.services', 'Amazon Textract', 'Extracts text, forms and tables from scanned documents.'),
    card('aws-aif-f2', 'aif.services', 'Amazon Comprehend', 'NLP on text: sentiment, entities, key phrases, PII detection.'),
    card('aws-aif-f3', 'aif.bedrock', 'Amazon Bedrock', 'Managed API access to foundation models, with knowledge bases, agents and guardrails.'),
    card('aws-aif-f4', 'aif.responsible', 'SageMaker Clarify', 'Detects bias and explains model predictions.'),
    card('aws-aif-f5', 'aif.security', 'AWS CloudTrail', 'Audit log of API calls: who, what, when.'),
    card('aws-aif-f6', 'aif.security', 'Amazon Macie', 'Finds sensitive data such as PII in S3.'),
    card('aws-aif-f7', 'aif.customize', 'Prompting vs RAG vs fine-tuning', 'Cheapest to costliest. RAG for changing knowledge; fine-tuning for style or task behaviour.'),
    card('aws-aif-f8', 'aif.responsible', 'Bedrock Guardrails', 'Content filters, denied topics and sensitive-information redaction for model I/O.'),
  ],
};

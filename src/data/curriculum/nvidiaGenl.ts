import type { StudyCourse } from '../../domain/types';
import { card, match, multi, single, tf } from './helpers';

const SRC = 'https://www.nvidia.com/en-us/learn/certification/generative-ai-llm-associate/';

/** Prep for NVIDIA-Certified Associate: Generative AI LLMs (NCA-GENL). Questions are original. */
export const nvidiaGenl: StudyCourse = {
  id: 'study-nvidia-genl',
  catalogId: 'nvidia-nca-genl',
  title: 'NVIDIA Generative AI LLMs Associate prep',
  summary: 'LLM fundamentals, experimentation, data analysis, software development and trustworthy AI, weighted like the published NCA-GENL exam.',
  origin: 'app',
  concepts: [
    { id: 'n.ml', label: 'Core ML and AI knowledge' },
    { id: 'n.data', label: 'Data analysis and visualisation' },
    { id: 'n.exp', label: 'Experimentation' },
    { id: 'n.dev', label: 'Software development with LLMs' },
    { id: 'n.trust', label: 'Trustworthy AI' },
  ],
  blueprint: {
    title: 'NCA-GENL practice exam',
    domains: [
      { id: 'd1', name: 'Core machine learning and AI knowledge', weight: 30 },
      { id: 'd2', name: 'Data analysis and visualisation', weight: 14 },
      { id: 'd3', name: 'Experimentation', weight: 22 },
      { id: 'd4', name: 'Software development', weight: 24 },
      { id: 'd5', name: 'Trustworthy AI', weight: 10 },
    ],
    weightsStatus: 'verified',
    passPercent: 70,
    sourceUrl: SRC,
  },
  lessons: [
    {
      id: 'nvidia-genl-1',
      title: 'LLM essentials for the NVIDIA Associate exam',
      minutes: 10,
      objectives: ['Explain how transformers generate text', 'Choose between prompting, RAG and fine-tuning', 'Name the GPU tools NVIDIA uses to serve LLMs'],
      conceptIds: ['n.ml', 'n.exp', 'n.dev', 'n.trust'],
      sections: [
        {
          heading: 'How LLMs work',
          body: 'A transformer turns text into tokens, maps tokens to embeddings, and uses self-attention to weigh every token against the others. The model predicts the next token, one at a time.\n\nPre-training on broad text gives general ability. Fine-tuning on smaller, focused data adapts it to a task or style.',
          details: 'The exam domains and weights come from the NCA-GENL page: core ML and AI 30%, software development 24%, experimentation 22%, data analysis 14%, trustworthy AI 10%. The 70% pass mark used in this simulator is an app threshold; NVIDIA does not publish a passing score on that page.',
        },
        {
          heading: 'Prompting, RAG or fine-tuning',
          body: 'Try prompting first: it is cheapest. Use retrieval-augmented generation (RAG) when answers need private or current facts. Fine-tune when you need a consistent behaviour or format that prompting cannot hold. Parameter-efficient methods such as LoRA train a small set of extra weights instead of the whole model.',
          example: 'A support bot must quote this week\'s policy documents. RAG fits: documents change weekly, so baking them into weights by fine-tuning would go stale.',
        },
        {
          heading: 'Serving on GPUs',
          body: 'NVIDIA\'s stack includes TensorRT-LLM for optimised inference, Triton Inference Server for serving models, and NeMo for building and customising models. Quantisation (for example FP16 to INT8) cuts memory and raises throughput at some cost in accuracy.',
        },
        {
          heading: 'Trustworthy AI',
          body: 'Check outputs for bias, protect private data, explain limitations to users, and add guardrails that block unsafe topics. Evaluate before and after launch.',
        },
      ],
      checkIds: ['nv-q1', 'nv-q3', 'nv-q6', 'nv-q9'],
      sourceLinks: [{ label: 'NCA-GENL certification page', url: SRC }],
    },
  ],
  questions: [
    single('nv-q1', ['n.ml'], 'In a transformer, what does self-attention do?', [
      { t: 'Weighs how much each token should influence every other token', why: 'Correct.', ok: true },
      { t: 'Splits text into tokens', why: 'That is the tokenizer.' },
      { t: 'Reduces model size for deployment', why: 'That is quantisation or distillation.' },
      { t: 'Stores documents for retrieval', why: 'That is a vector database in RAG.' },
    ], 'Self-attention relates tokens to each other within the context.', { domain: 'd1' }),
    single('nv-q2', ['n.ml'], 'What is an embedding?', [
      { t: 'A vector of numbers that represents meaning, so similar items sit close together', why: 'Correct.', ok: true },
      { t: 'A compressed copy of the model weights', why: 'Weights are parameters, not embeddings.' },
      { t: 'A rule that blocks unsafe output', why: 'That is a guardrail.' },
      { t: 'The text a user types', why: 'That is the prompt.' },
    ], 'Embeddings map tokens or texts to vectors.', { domain: 'd1' }),
    single('nv-q3', ['n.exp'], 'A chatbot must answer from policy documents that change every week. Which approach fits best?', [
      { t: 'Retrieval-augmented generation over the current documents', why: 'Correct: retrieval always uses the latest files.', ok: true },
      { t: 'Fine-tune the model every week', why: 'Costly and always slightly stale.' },
      { t: 'Raise the temperature', why: 'Adds randomness, not knowledge.' },
      { t: 'Train a new model from scratch', why: 'Far more costly and still stale.' },
    ], 'Use RAG for changing facts, fine-tuning for behaviour.', { domain: 'd3' }),
    single('nv-q4', ['n.exp'], 'What does LoRA do?', [
      { t: 'Trains a small set of added low-rank weights instead of all model weights', why: 'Correct.', ok: true },
      { t: 'Retrieves documents from a vector store', why: 'That is RAG.' },
      { t: 'Converts weights to INT8', why: 'That is quantisation.' },
      { t: 'Measures bias in outputs', why: 'That is evaluation.' },
    ], 'LoRA is parameter-efficient fine-tuning.', { domain: 'd3', level: 2 }),
    tf('nv-q5', ['n.exp'], 'Lowering the sampling temperature makes an LLM\'s output more deterministic.', true,
      'Correct.', 'Lower temperature concentrates probability on the likeliest tokens.', 'Low temperature: focused, repeatable. High: varied.', { domain: 'd3' }),
    single('nv-q6', ['n.dev'], 'Which NVIDIA tool is built to optimise LLM inference on NVIDIA GPUs?', [
      { t: 'TensorRT-LLM', why: 'Correct.', ok: true },
      { t: 'cuDF', why: 'GPU dataframes for data science.' },
      { t: 'Omniverse', why: '3D simulation and OpenUSD platform.' },
      { t: 'Nsight Systems', why: 'A profiler, not an inference engine.' },
    ], 'TensorRT-LLM compiles and optimises LLMs for inference.', { domain: 'd4' }),
    match('nv-q7', ['n.dev'], 'Match each NVIDIA tool to its main job.', [
      ['NeMo', 'Build and customise generative models'],
      ['Triton Inference Server', 'Serve models behind an API'],
      ['TensorRT-LLM', 'Optimise LLM inference'],
    ], 'Build with NeMo, optimise with TensorRT-LLM, serve with Triton.', { domain: 'd4' }),
    single('nv-q8', ['n.dev'], 'Quantising a model from FP16 to INT8 usually…', [
      { t: 'Cuts memory use and raises throughput, with a small accuracy cost', why: 'Correct.', ok: true },
      { t: 'Improves accuracy for free', why: 'Lower precision rarely improves accuracy.' },
      { t: 'Doubles the context window', why: 'Unrelated.' },
      { t: 'Removes the need for a GPU', why: 'Not necessarily.' },
    ], 'Precision trades against memory and speed.', { domain: 'd4', level: 2 }),
    multi('nv-q9', ['n.trust'], 'Which are trustworthy-AI practices for an LLM product? (Select all that apply.)', [
      { t: 'Guardrails that block unsafe topics', why: 'Correct.', ok: true },
      { t: 'Testing outputs for bias across user groups', why: 'Correct.', ok: true },
      { t: 'Protecting personal data in prompts and logs', why: 'Correct.', ok: true },
      { t: 'Hiding model limitations from users', why: 'Transparency is part of trustworthy AI.' },
    ], 'Guardrails, fairness testing, privacy and transparency.', { domain: 'd5' }),
    single('nv-q10', ['n.data'], 'Before fine-tuning, you plot the length of each training example and see a long tail of very long examples. What should you do first?', [
      { t: 'Inspect them and decide whether to truncate, split or drop them', why: 'Correct: understand outliers before training.', ok: true },
      { t: 'Ignore the plot and train', why: 'Outliers can waste compute or exceed the context window.' },
      { t: 'Delete every example above the median', why: 'Throws away half the data.' },
      { t: 'Raise the learning rate', why: 'Unrelated to data quality.' },
    ], 'Exploring data comes before training on it.', { domain: 'd2' }),
    single('nv-q11', ['n.data'], 'Which chart best shows how token counts are spread across a dataset?', [
      { t: 'Histogram', why: 'Correct: shows a distribution.', ok: true },
      { t: 'Pie chart', why: 'Shows parts of a whole, not a distribution.' },
      { t: 'Line chart over row number', why: 'Row order is arbitrary.' },
      { t: 'Single bar for the mean', why: 'Hides the spread.' },
    ], 'Distributions → histogram.', { domain: 'd2' }),
    single('nv-q12', ['n.ml'], 'Which metric is commonly used to measure how well a language model predicts text?', [
      { t: 'Perplexity', why: 'Correct: lower is better.', ok: true },
      { t: 'Recall at k only', why: 'A retrieval metric.' },
      { t: 'Frames per second', why: 'A graphics metric.' },
      { t: 'Mean time to recovery', why: 'An operations metric.' },
    ], 'Perplexity measures next-token prediction quality.', { domain: 'd1', level: 2 }),
  ],
  flashcards: [
    card('nv-f1', 'n.ml', 'Self-attention', 'Lets each token weigh every other token in the context.'),
    card('nv-f2', 'n.exp', 'RAG vs fine-tuning', 'RAG for current or private facts; fine-tuning for behaviour and format.'),
    card('nv-f3', 'n.dev', 'TensorRT-LLM', 'NVIDIA library that optimises LLM inference on GPUs.'),
    card('nv-f4', 'n.exp', 'LoRA', 'Parameter-efficient fine-tuning with small low-rank weight updates.'),
  ],
};

import type { StudyCourse } from '../../domain/types';
import { card, fill, match, multi, order, single, tf } from './helpers';

export const devFoundations: StudyCourse = {
  id: 'study-dev-foundations',
  catalogId: 'academy-dev-foundations',
  title: 'Developer foundations for AI work',
  summary: 'The programming, Git, HTTP, JSON, SQL and debugging basics every AI application role assumes.',
  origin: 'app',
  concepts: [
    { id: 'dev.python', label: 'Python basics' },
    { id: 'dev.ts', label: 'TypeScript basics' },
    { id: 'dev.git', label: 'Git workflow' },
    { id: 'dev.http', label: 'HTTP and APIs' },
    { id: 'dev.json', label: 'JSON' },
    { id: 'dev.sql', label: 'Databases and SQL' },
    { id: 'dev.debug', label: 'Testing and debugging' },
  ],
  lessons: [
    {
      id: 'dev-1',
      title: 'APIs, HTTP and JSON',
      minutes: 9,
      objectives: ['Read an HTTP request and response', 'Use status codes correctly', 'Parse JSON safely'],
      conceptIds: ['dev.http', 'dev.json'],
      sections: [
        {
          heading: 'Requests and responses',
          body: 'An HTTP request has a method (GET reads, POST creates or triggers), a URL, headers (e.g. Authorization, Content-Type) and an optional body. The response has a status code, headers and a body, usually JSON for APIs.',
          example: 'POST /v1/messages\nContent-Type: application/json\nx-api-key: (from server-side env var, never in browser code)',
        },
        {
          heading: 'Status codes',
          body: '2xx success, 4xx your request is wrong (400 bad input, 401 not authenticated, 403 not allowed, 404 not found, 429 rate limited), 5xx the server failed. Retry 429 and most 5xx with backoff; do not blindly retry 4xx.',
        },
        {
          heading: 'JSON',
          body: 'JSON has objects, arrays, strings, numbers, booleans and null. Keys are double-quoted strings. Parse inside error handling and validate the shape before use.',
          code: 'try {\n  const data = JSON.parse(text);\n} catch {\n  // handle malformed JSON\n}',
        },
      ],
      checkIds: ['dev-q1', 'dev-q2', 'dev-q3'],
      sourceLinks: [{ label: 'MDN: HTTP overview', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview' }],
    },
    {
      id: 'dev-2',
      title: 'Git, SQL and debugging',
      minutes: 10,
      objectives: ['Follow a branch → commit → PR workflow', 'Write a basic SQL query', 'Debug by reproducing first'],
      conceptIds: ['dev.git', 'dev.sql', 'dev.debug', 'dev.python', 'dev.ts'],
      sections: [
        {
          heading: 'Git workflow',
          body: 'Create a branch, make small commits with clear messages, push, open a pull request, get review, merge. Never commit secrets; use environment variables and a .gitignore.',
        },
        {
          heading: 'SQL in one query',
          body: 'SELECT picks columns, FROM picks the table, WHERE filters rows, ORDER BY sorts, LIMIT caps the result. Use parameterised queries, never string concatenation, to avoid SQL injection.',
          code: 'SELECT title, score FROM courses WHERE score >= 0.8 ORDER BY score DESC LIMIT 5;',
        },
        {
          heading: 'Debugging',
          body: 'Reproduce the bug, read the full error and stack trace, form one hypothesis, test it with the smallest change, then add a test that would have caught it.',
        },
      ],
      checkIds: ['dev-q4', 'dev-q5', 'dev-q6', 'dev-q7'],
      sourceLinks: [
        { label: 'Pro Git book (free)', url: 'https://git-scm.com/book/en/v2' },
        { label: 'Python tutorial', url: 'https://docs.python.org/3/tutorial/' },
        { label: 'TypeScript handbook', url: 'https://www.typescriptlang.org/docs/handbook/intro.html' },
      ],
    },
  ],
  questions: [
    single('dev-q1', ['dev.http'], 'An API returns HTTP 429. What should your client do?', [
      { t: 'Wait and retry with backoff', why: 'Correct: 429 means rate limited.', ok: true },
      { t: 'Retry immediately in a tight loop', why: 'Makes rate limiting worse.' },
      { t: 'Treat it as a permanent failure', why: 'It is temporary by design.' },
      { t: 'Change the API key', why: 'Usually unnecessary; you are just sending too fast.' },
    ], 'Respect Retry-After headers when present.'),
    single('dev-q2', ['dev.http'], 'Where should an API secret key live in a web app?', [
      { t: 'On the server, read from an environment variable or secret store', why: 'Correct.', ok: true },
      { t: 'In the browser JavaScript bundle', why: 'Anyone can read it from the bundle.' },
      { t: 'In the Git repository', why: 'Leaks to everyone with repo access, forever in history.' },
      { t: 'In a URL query parameter', why: 'Ends up in logs and browser history.' },
    ], 'Client code is public. Keep secrets server-side.'),
    single('dev-q3', ['dev.json'], 'Which is valid JSON?', [
      { t: '{"ok": true, "items": [1, 2]}', why: 'Correct.', ok: true },
      { t: "{'ok': true}", why: 'JSON requires double quotes.' },
      { t: '{ok: true}', why: 'Keys must be quoted strings.' },
      { t: '{"ok": true,}', why: 'Trailing commas are not allowed.' },
    ], 'Double-quoted keys and strings, no trailing commas.'),
    order('dev-q4', ['dev.git'], 'Order a typical Git contribution workflow.', [
      'Create a branch',
      'Commit small, focused changes',
      'Push the branch',
      'Open a pull request',
      'Merge after review and passing checks',
    ], 'Branch, commit, push, PR, merge.'),
    fill('dev-q5', ['dev.sql'], 'Complete the query to return only rows where status equals \'active\':\nSELECT * FROM users ____ status = \'active\';', ['WHERE'], 'WHERE filters rows.'),
    single('dev-q6', ['dev.python', 'dev.debug'], 'What does this Python code print?', [
      { t: '[1, 2, 3, 4]', why: 'Correct: b refers to the same list object as a.', ok: true },
      { t: '[1, 2, 3]', why: 'Misconception: assignment copies the list. It only copies the reference.' },
      { t: 'An error', why: 'append on a list is valid.' },
      { t: 'None', why: 'print(a) prints the list, not append\'s return value.' },
    ], 'Use a.copy() or list(a) to copy.', {
      code: 'a = [1, 2, 3]\nb = a\nb.append(4)\nprint(a)',
      level: 2,
    }),
    single('dev-q7', ['dev.ts', 'dev.debug'], 'This TypeScript function sometimes returns undefined. Why?', [
      { t: 'The forEach callback\'s return does not return from findUser', why: 'Correct: return inside forEach exits only the callback.', ok: true },
      { t: 'users is not an array', why: 'It is typed as User[].' },
      { t: '=== should be ==', why: 'Strict equality is correct here.' },
      { t: 'TypeScript cannot return objects', why: 'It can.' },
    ], 'Use users.find(u => u.id === id) or a for...of loop.', {
      code: 'function findUser(users: User[], id: string) {\n  users.forEach((u) => {\n    if (u.id === id) return u;\n  });\n}',
      level: 3,
    }),
    multi('dev-q8', ['dev.debug'], 'Which steps belong in a disciplined debugging process? (Select all that apply.)', [
      { t: 'Reproduce the failure reliably', why: 'Correct.', ok: true },
      { t: 'Read the full error and stack trace', why: 'Correct.', ok: true },
      { t: 'Add a test that would have caught it', why: 'Correct.', ok: true },
      { t: 'Change several things at once to save time', why: 'You will not know which change mattered.' },
    ], 'One hypothesis, one change at a time.'),
  ],
  flashcards: [
    card('dev-f1', 'dev.http', '401 vs 403', '401: not authenticated. 403: authenticated but not allowed.'),
    card('dev-f2', 'dev.sql', 'SQL injection defence', 'Parameterised queries; never concatenate user input into SQL.'),
    card('dev-f3', 'dev.git', 'Never commit…', 'Secrets, API keys, .env files.'),
  ],
};

export const llmAppEng: StudyCourse = {
  id: 'study-llm-app-eng',
  catalogId: 'academy-llm-app-eng',
  title: 'LLM application engineering',
  summary: 'Structured outputs, RAG, tool calling, routing, observability, security and deployment for real LLM apps.',
  origin: 'app',
  concepts: [
    { id: 'llm.api', label: 'LLM API calls' },
    { id: 'llm.structured', label: 'Structured outputs' },
    { id: 'llm.rag', label: 'Embeddings, vector search and RAG' },
    { id: 'llm.tools', label: 'Tool calling and agent loops' },
    { id: 'llm.routing', label: 'Model routing' },
    { id: 'llm.observability', label: 'Logging and telemetry' },
    { id: 'llm.security', label: 'Permissions and human approval' },
    { id: 'llm.deploy', label: 'Deployment and reliability' },
  ],
  lessons: [
    {
      id: 'llm-1',
      title: 'Calling models and getting structured output',
      minutes: 10,
      objectives: ['Make a model call from server code', 'Validate structured output and handle failure'],
      conceptIds: ['llm.api', 'llm.structured'],
      sections: [
        {
          heading: 'Anatomy of a call',
          body: 'A model call sends a model name, a system prompt, a list of messages and limits such as max tokens. The response contains content blocks, a stop reason and token usage. Log usage: it is your cost.',
          code: 'const res = await client.messages.create({\n  model: MODEL,            // from config, not hard-coded everywhere\n  max_tokens: 512,\n  system: "Classify support tickets.",\n  messages: [{ role: "user", content: ticket }],\n});',
        },
        {
          heading: 'Structured output',
          body: 'Define a schema (e.g. with a tool definition or JSON schema), ask the model to fill it, then validate. On failure: retry once with the validation error, then fall back or escalate.',
          details: 'Prefer enums over free text for categories. Keep schemas small. Version them like any API.',
        },
      ],
      checkIds: ['llm-q1', 'llm-q2'],
      sourceLinks: [{ label: 'Claude API documentation', url: 'https://docs.claude.com/en/api/overview' }],
    },
    {
      id: 'llm-2',
      title: 'RAG and vector search',
      minutes: 10,
      objectives: ['Choose chunk sizes and top-k', 'Evaluate retrieval separately from generation'],
      conceptIds: ['llm.rag'],
      sections: [
        {
          heading: 'Retrieval quality first',
          body: 'If the right chunk is not retrieved, no prompt can save the answer. Measure retrieval with recall@k: for a set of questions with known source chunks, how often is the source in the top k?',
          details: 'Hybrid search (keyword BM25 + vector) and re-ranking often beat vector search alone, especially for codes, names and exact phrases.',
        },
        {
          heading: 'Chunking',
          body: 'Chunks too small lose context; too large dilute relevance and waste tokens. Split on document structure (headings, paragraphs) and keep a little overlap. Store source and position metadata for citations.',
        },
      ],
      checkIds: ['llm-q3', 'llm-q4'],
    },
    {
      id: 'llm-3',
      title: 'Tools, agents, routing and safety',
      minutes: 12,
      objectives: ['Implement a safe agent loop', 'Route requests between models', 'Instrument an LLM app'],
      conceptIds: ['llm.tools', 'llm.routing', 'llm.observability', 'llm.security', 'llm.deploy'],
      sections: [
        {
          heading: 'A safe agent loop',
          body: 'Loop: call the model with tool definitions → if it requests a tool, validate the arguments, check permission, run it with a timeout, return the result → repeat until it answers or a step limit is hit.',
          code: 'for (let step = 0; step < MAX_STEPS; step++) {\n  const res = await callModel(history, tools);\n  if (res.stop_reason !== "tool_use") return res;\n  for (const call of res.toolCalls) {\n    const args = schema[call.name].parse(call.input);\n    if (needsApproval(call.name)) await askHuman(call);\n    history.push(await runWithTimeout(call.name, args));\n  }\n}\nthrow new Error("step limit reached");',
        },
        {
          heading: 'Routing',
          body: 'Send simple, high-volume requests to a small fast model and hard ones to a larger model. Route on measurable signals (task type, input length, a cheap classifier) and keep an eval per route.',
        },
        {
          heading: 'Observe and deploy',
          body: 'Log for each call: model, prompt version, token usage, latency, stop reason, tool calls and errors, with personal data redacted. Deploy in containers with health checks, timeouts, retries with backoff, and a kill switch for risky features.',
        },
      ],
      checkIds: ['llm-q5', 'llm-q6', 'llm-q7', 'llm-q8'],
      practical: 'Start the Project Lab exercise "Tool-using assistant" and implement the loop above with one read-only tool.',
    },
  ],
  questions: [
    single('llm-q1', ['llm.api'], 'Which field in a model response tells you why generation stopped (finished, hit the token limit, or wants a tool)?', [
      { t: 'The stop reason', why: 'Correct.', ok: true },
      { t: 'The model name', why: 'Identifies the model only.' },
      { t: 'The system prompt', why: 'That is input.' },
      { t: 'Token usage', why: 'Counts tokens; does not explain stopping.' },
    ], 'Always branch on stop reason: a truncated answer is not a complete one.'),
    single('llm-q2', ['llm.structured'], 'The model returned JSON missing a required field. Best handling?', [
      { t: 'Retry once including the validation error, then fall back or escalate', why: 'Correct: bounded recovery.', ok: true },
      { t: 'Fill in a default value silently', why: 'Hides real failures and corrupts data.' },
      { t: 'Retry forever until it works', why: 'Unbounded cost and latency.' },
      { t: 'Crash the server', why: 'One bad response should not take down the service.' },
    ], 'Validate, bounded retry, explicit fallback.', { level: 2 }),
    single('llm-q3', ['llm.rag'], 'Users ask about part number "XK-4471" and vector search returns unrelated parts. What usually helps most?', [
      { t: 'Add keyword (hybrid) search', why: 'Correct: exact identifiers are a keyword-search strength.', ok: true },
      { t: 'Increase temperature', why: 'Affects generation, not retrieval.' },
      { t: 'Use bigger chunks', why: 'Dilutes relevance further.' },
      { t: 'Remove metadata', why: 'Metadata helps filtering and citations.' },
    ], 'Embeddings capture meaning; exact codes need lexical matching.', { level: 2 }),
    fill('llm-q4', ['llm.rag'], 'The metric "for each test question, is the correct source chunk in the top k results?" is called recall@____ (one letter).', ['k'], 'Recall@k measures retrieval separately from answer quality.'),
    order('llm-q5', ['llm.tools', 'llm.security'], 'Order the steps for safely executing a model-requested tool call.', [
      'Parse and validate the tool arguments against the schema',
      'Check the caller\'s permission for this tool',
      'Ask for human approval if the action is risky',
      'Execute with a timeout',
      'Return the result (or error) to the model',
    ], 'Validate → authorise → approve → execute → report.', { level: 3 }),
    single('llm-q6', ['llm.tools'], 'Why should an agent loop have a maximum step count?', [
      { t: 'To prevent runaway loops and unbounded cost', why: 'Correct.', ok: true },
      { t: 'Because models can only call one tool', why: 'They can call many.' },
      { t: 'To make the model smarter', why: 'Limits do not add capability.' },
      { t: 'It is required by HTTP', why: 'Unrelated.' },
    ], 'Every loop needs a termination guarantee.'),
    single('llm-q7', ['llm.routing'], '90% of requests are simple FAQ lookups; 10% need multi-step reasoning. What routing strategy fits?', [
      { t: 'Classify each request and send simple ones to a small fast model, hard ones to a larger model', why: 'Correct: cost and latency drop without hurting hard cases.', ok: true },
      { t: 'Send everything to the largest model', why: 'Works, but wastes cost and latency on easy requests.' },
      { t: 'Send everything to the smallest model', why: 'Hard cases fail.' },
      { t: 'Pick a model at random', why: 'Unpredictable quality.' },
    ], 'Evaluate each route separately so you know the router is not hiding regressions.', { level: 2 }),
    match('llm-q8', ['llm.observability', 'llm.deploy', 'llm.security'], 'Match each production concern to a control.', [
      ['Cost spikes', 'Log token usage per request'],
      ['Slow upstream model', 'Timeouts with retry and backoff'],
      ['Risky actions such as sending email', 'Human approval step'],
      ['Debugging bad answers later', 'Log prompt version and model per call'],
    ], 'Production LLM apps are normal distributed systems plus model-specific logging.'),
    tf('llm-q9', ['llm.security'], 'It is acceptable to call a paid LLM API directly from browser JavaScript using your secret key if the site has a login page.', false,
      'A login page does not hide the bundle; the key is still readable.',
      'Correct: route calls through your server so the key never reaches the client.',
      'Client code is public regardless of authentication.'),
  ],
  flashcards: [
    card('llm-f1', 'llm.structured', 'Structured output failure path', 'Validate → retry once with error → fallback/escalate.'),
    card('llm-f2', 'llm.rag', 'Hybrid search', 'Keyword (BM25) + vector search, often re-ranked.'),
    card('llm-f3', 'llm.tools', 'Agent loop guardrails', 'Schema validation, permissions, approval, timeouts, step limit.'),
    card('llm-f4', 'llm.routing', 'Model routing', 'Send each request to the cheapest model that meets its quality bar.'),
  ],
};

export const localLlm: StudyCourse = {
  id: 'study-local-llm',
  catalogId: 'academy-local-llm',
  title: 'Local LLMs and model development',
  summary: 'From running an open-weight model on your laptop to understanding fine-tuning and pretraining costs.',
  origin: 'app',
  concepts: [
    { id: 'loc.select', label: 'Open-weight model selection' },
    { id: 'loc.memory', label: 'GPU and memory requirements' },
    { id: 'loc.quant', label: 'Quantization' },
    { id: 'loc.data', label: 'Datasets and tokenization' },
    { id: 'loc.finetune', label: 'SFT and LoRA/QLoRA' },
    { id: 'loc.eval', label: 'Evaluation and benchmarks' },
    { id: 'loc.pretrain', label: 'Pretraining realities' },
  ],
  lessons: [
    {
      id: 'loc-1',
      title: 'Will it fit? Memory and quantization',
      minutes: 10,
      objectives: ['Estimate the memory a model needs', 'Explain what quantization trades away'],
      conceptIds: ['loc.memory', 'loc.quant', 'loc.select'],
      sections: [
        {
          heading: 'Rule of thumb',
          body: 'Weights memory ≈ parameters × bytes per parameter. 16-bit = 2 bytes, 8-bit = 1 byte, 4-bit = 0.5 bytes. Add headroom for the KV cache (grows with context length) and runtime overhead.',
          example: '7B parameters at 4-bit: 7 × 0.5 = 3.5 GB of weights, so roughly 5–6 GB in practice. At 16-bit: about 14 GB of weights.',
        },
        {
          heading: 'Quantization',
          body: 'Quantization stores weights with fewer bits. It cuts memory and often speeds inference, at some quality cost that grows as bits shrink. 4-bit variants are a common laptop sweet spot.',
          details: 'Common local tools include llama.cpp (GGUF files) and Ollama. Check each model\'s licence before commercial use.',
        },
        {
          heading: 'What runs where',
          body: 'Consumer laptop or desktop: inference of small to mid-size quantized models, embeddings, small evals, LoRA on tiny models. Rented or large GPUs: fine-tuning larger models, long-context serving at scale, and any meaningful pretraining.',
        },
      ],
      checkIds: ['loc-q1', 'loc-q2', 'loc-q3'],
      sourceLinks: [
        { label: 'llama.cpp', url: 'https://github.com/ggml-org/llama.cpp' },
        { label: 'Hugging Face: quantization', url: 'https://huggingface.co/docs/transformers/main/en/quantization/overview' },
      ],
    },
    {
      id: 'loc-2',
      title: 'Fine-tuning, evaluation and pretraining',
      minutes: 10,
      objectives: ['Explain SFT and LoRA/QLoRA', 'Design a small benchmark', 'Explain why pretraining is out of reach for individuals'],
      conceptIds: ['loc.finetune', 'loc.data', 'loc.eval', 'loc.pretrain'],
      sections: [
        {
          heading: 'SFT and LoRA',
          body: 'Supervised fine-tuning (SFT) trains on prompt/response pairs. LoRA freezes the base weights and trains small low-rank adapter matrices, cutting memory and storage. QLoRA does this on a 4-bit quantized base model, cutting memory further.',
          details: 'Data quality beats quantity: a few hundred to a few thousand clean, consistent examples often matter more than volume. Hold out a test split you never train on.',
        },
        {
          heading: 'Evaluate honestly',
          body: 'Build a held-out benchmark that reflects your task. Compare base vs fine-tuned vs a hosted model on the same set. Watch for contamination: test items that leaked into training data inflate scores.',
        },
        {
          heading: 'Pretraining',
          body: 'Pretraining learns from scratch on huge token counts and needs large GPU clusters. Individuals learn it by training tiny models (millions of parameters) on small datasets to understand the mechanics.',
        },
      ],
      checkIds: ['loc-q4', 'loc-q5', 'loc-q6', 'loc-q7'],
      sourceLinks: [{ label: 'LoRA paper (Hu et al., 2021)', url: 'https://arxiv.org/abs/2106.09685' }, { label: 'QLoRA paper (Dettmers et al., 2023)', url: 'https://arxiv.org/abs/2305.14314' }],
    },
  ],
  questions: [
    fill('loc-q1', ['loc.memory', 'loc.quant'], 'Approximately how many GB are needed just for the weights of an 8-billion-parameter model quantized to 4 bits? (number only)', ['4'], '8 × 0.5 bytes = 4 GB of weights, before KV cache and overhead.', { numeric: { value: 4, tolerance: 0.3 }, level: 2 }),
    single('loc-q2', ['loc.quant'], 'What is the main trade-off of more aggressive quantization (e.g. 8-bit → 3-bit)?', [
      { t: 'Less memory, but more quality loss', why: 'Correct.', ok: true },
      { t: 'More memory, better quality', why: 'Reversed.' },
      { t: 'No trade-off at all', why: 'Quality loss grows as bits shrink.' },
      { t: 'It changes the model\'s licence', why: 'Licences are unaffected by quantization.' },
    ], 'Pick the smallest quantization that still passes your evals.'),
    multi('loc-q3', ['loc.select', 'loc.pretrain'], 'Which are realistic on a typical 16 GB-RAM consumer laptop? (Select all that apply.)', [
      { t: 'Running a 4-bit 7B–8B model for chat', why: 'Correct.', ok: true },
      { t: 'Generating embeddings for a few thousand documents', why: 'Correct.', ok: true },
      { t: 'Pretraining a 7B model from scratch', why: 'Needs large GPU clusters.' },
      { t: 'Full fine-tuning of a 70B model', why: 'Needs many high-memory GPUs.' },
    ], 'Inference and small experiments locally; heavy training on rented compute.', { level: 2 }),
    single('loc-q4', ['loc.finetune'], 'What does LoRA train?', [
      { t: 'Small low-rank adapter matrices while the base weights stay frozen', why: 'Correct.', ok: true },
      { t: 'All model weights', why: 'That is full fine-tuning.' },
      { t: 'Only the tokenizer', why: 'Tokenizers are not trained by LoRA.' },
      { t: 'The prompt only', why: 'That is prompt engineering.' },
    ], 'QLoRA = LoRA on a 4-bit quantized base.'),
    single('loc-q5', ['loc.eval'], 'Your fine-tuned model scores 98% on your benchmark, but you later find test items in the training data. What happened?', [
      { t: 'Contamination inflated the score', why: 'Correct.', ok: true },
      { t: 'Quantization error', why: 'Unrelated to leaked test data.' },
      { t: 'The model is genuinely 98% accurate', why: 'The score is not trustworthy.' },
      { t: 'Underfitting', why: 'The opposite symptom.' },
    ], 'Keep a held-out split and check for overlap.', { level: 2 }),
    tf('loc-q6', ['loc.data'], 'Changing tokenizers between pretraining and fine-tuning is safe by default.', false,
      'The model\'s embeddings are tied to its tokenizer vocabulary.',
      'Correct: use the base model\'s tokenizer.',
      'Token ids must mean the same thing the model learned.'),
    order('loc-q7', ['loc.finetune', 'loc.eval'], 'Order a sensible fine-tuning project.', [
      'Define the task and success metric',
      'Build a held-out evaluation set',
      'Measure the base model',
      'Prepare training data and fine-tune with LoRA',
      'Re-run the same evaluation and compare',
    ], 'Measure before you train, or you cannot prove the tune helped.', { level: 2 }),
  ],
  flashcards: [
    card('loc-f1', 'loc.memory', 'Weights memory formula', 'Parameters × bytes per parameter (16-bit = 2, 8-bit = 1, 4-bit = 0.5).'),
    card('loc-f2', 'loc.finetune', 'QLoRA', 'LoRA adapters trained on a 4-bit quantized frozen base model.'),
    card('loc-f3', 'loc.eval', 'Contamination', 'Test data leaked into training, inflating scores.'),
  ],
};

export const careerReadiness: StudyCourse = {
  id: 'study-career',
  catalogId: 'academy-career-readiness',
  title: 'Entry-level AI career readiness',
  summary: 'Roles, portfolios and interviews: turning study into hireable evidence.',
  origin: 'app',
  concepts: [
    { id: 'car.roles', label: 'Entry-level AI roles' },
    { id: 'car.portfolio', label: 'Portfolio evidence' },
    { id: 'car.interview', label: 'Technical interviews' },
  ],
  lessons: [
    {
      id: 'car-1',
      title: 'Credentials, skills and evidence',
      minutes: 8,
      objectives: ['Map roles to skills', 'Write a portfolio entry that proves a skill', 'Answer a behavioural question with STAR'],
      conceptIds: ['car.roles', 'car.portfolio', 'car.interview'],
      sections: [
        {
          heading: 'Certificates are not the job',
          body: 'Credentials get attention; evidence gets offers. Pair each credential with a project that shows you can apply it. A foundational certification plus one deployed project beats five badges with no projects.',
        },
        {
          heading: 'Roles at a glance',
          body: 'AI support or implementation specialist: configure tools, write docs, help users. AI operations associate: monitor, evaluate, triage. Junior AI application developer: build features on LLM APIs. AI automation specialist: connect tools and workflows. Junior cloud/AI practitioner: deploy and operate cloud AI services.',
        },
        {
          heading: 'Portfolio entries',
          body: 'Each entry: problem, what you built, your decisions and trade-offs, how you evaluated it, and a link to code or a demo. Be precise about what you did versus what a tool or tutorial did.',
          details: 'STAR for interviews: Situation, Task, Action, Result. Quantify results where you can.',
        },
      ],
      checkIds: ['car-q1', 'car-q2', 'car-q3'],
    },
  ],
  questions: [
    single('car-q1', ['car.portfolio'], 'Which portfolio entry is strongest evidence for a junior LLM developer role?', [
      { t: 'A deployed RAG app with an eval set, results, and a write-up of trade-offs', why: 'Correct: shows building and measuring.', ok: true },
      { t: 'A list of ten completed course badges', why: 'Shows study, not application.' },
      { t: 'A screenshot of a chatbot conversation', why: 'No evidence of what you built.' },
      { t: 'A forked tutorial repo with no changes', why: 'Shows nothing original.' },
    ], 'Evidence = something you built, measured and explained.'),
    match('car-q2', ['car.roles'], 'Match each role to a typical core activity.', [
      ['AI support/implementation specialist', 'Configure AI tools and help users adopt them'],
      ['AI operations associate', 'Monitor and evaluate AI system quality'],
      ['Junior AI application developer', 'Build features on LLM APIs'],
      ['AI automation specialist', 'Connect tools into automated workflows'],
    ], 'Pick the role that matches your strengths, then build evidence for it.'),
    order('car-q3', ['car.interview'], 'Put the STAR answer structure in order.', ['Situation', 'Task', 'Action', 'Result'], 'STAR keeps answers concrete and short.', { level: 1 }),
  ],
  flashcards: [card('car-f1', 'car.interview', 'STAR', 'Situation, Task, Action, Result.')],
};

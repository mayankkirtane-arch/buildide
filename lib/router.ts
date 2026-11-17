// Hybrid model router: classify task, pick cheapest adequate model.
export type ModelChoice = {
  model: string;
  tier: 'fast' | 'smart';
  reason: string;
};

const FAST_MODEL = 'deepseek/deepseek-chat-v3-0324:free';
const SMART_MODEL = 'anthropic/claude-3.7-sonnet';

// Heuristic classifier. Cheap + instant, no extra LLM call.
export function routeModel(prompt: string): ModelChoice {
  const p = prompt.toLowerCase();
  const complexSignals = [
    'refactor', 'architecture', 'debug', 'fix bug', 'whole app', 'full app',
    'from scratch', 'complex', 'optimize', 'security', 'migrate', 'test suite',
    'multi-file', 'entire', 'redesign', 'implement', 'build me a', 'create a',
  ];
  const isComplex = complexSignals.some((s) => p.includes(s)) || prompt.length > 220;
  return isComplex
    ? { model: SMART_MODEL, tier: 'smart', reason: 'Complex/multi-file task routed to frontier model.' }
    : { model: FAST_MODEL, tier: 'fast', reason: 'Simple edit routed to free fast model.' };
}

const FENCE = String.fromCharCode(96, 96, 96);
export const SYSTEM_PROMPT =
  "You are BuildIDE's coding agent. You edit files in a browser WebContainer. " +
  "Respond with a short explanation followed by a fenced JSON block of file changes in this exact format: " +
  FENCE + "files\n" +
  '[\n  { "path": "src/App.jsx", "content": "// full new file content here" }\n]\n' +
  FENCE + "\n" +
  "Only output files that need to be created or fully replaced. Always give complete file contents. " +
  "Keep code runnable with Vite + React. Never output partial files.";

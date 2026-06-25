import { seedCard } from './srs';
import { CRITERIA, type Attempt, type Config, type ReviewCard, type ScoreResult, type Criterion } from './practiceTypes';

export interface KeyValue {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const DEFAULT_CONFIG: Config = {
  apiKey: '',
  baseURL: 'https://api.openai.com/v1',
  model: '',
};

const k = (slug: string, leaf: string) => `studymate:${slug}:${leaf}`;

function readJson<T>(s: KeyValue, key: string, fallback: T): T {
  const raw = s.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadConfig(s: KeyValue, slug: string): Config {
  return { ...DEFAULT_CONFIG, ...readJson<Partial<Config>>(s, k(slug, 'config'), {}) };
}
export function saveConfig(s: KeyValue, slug: string, cfg: Config): void {
  s.setItem(k(slug, 'config'), JSON.stringify(cfg));
}

export function loadAttempts(s: KeyValue, slug: string): Attempt[] {
  return readJson<Attempt[]>(s, k(slug, 'attempts'), []);
}
export function appendAttempt(s: KeyValue, slug: string, a: Attempt): Attempt[] {
  const next = [...loadAttempts(s, slug), a];
  s.setItem(k(slug, 'attempts'), JSON.stringify(next));
  return next;
}

export function loadDeck(s: KeyValue, slug: string): ReviewCard[] {
  return readJson<ReviewCard[]>(s, k(slug, 'deck'), []);
}
export function saveDeck(s: KeyValue, slug: string, deck: ReviewCard[]): void {
  s.setItem(k(slug, 'deck'), JSON.stringify(deck));
}

/** Build the per-criterion band map for the trajectory. */
function bandMap(result: ScoreResult): Record<Criterion, number> {
  const out = {} as Record<Criterion, number>;
  for (const c of CRITERIA) out[c] = result.criteria[c].band;
  return out;
}

export function summarizeAttempt(
  result: ScoreResult,
  meta: { task: 1 | 2; promptId: string; wordCount: number },
): Attempt {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `a-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    ts: new Date().toISOString(),
    task: meta.task,
    promptId: meta.promptId,
    wordCount: meta.wordCount,
    overall: result.overall,
    criteria: bandMap(result),
    recurringErrorTags: result.recurringErrorTags,
  };
}

/** Add one SM-2 card per NEW recurring-error tag (deduped by id `err:<tag>`). Pure. */
export function seedCardsFromResult(deck: ReviewCard[], result: ScoreResult, today: string): ReviewCard[] {
  const have = new Set(deck.map((c) => c.id));
  const next = [...deck];
  for (const tag of result.recurringErrorTags) {
    const id = `err:${tag}`;
    if (have.has(id)) continue;
    const fix = result.inlineErrors.find((e) => e.fix)?.fix ?? 'Check the relevant band descriptor.';
    next.push(
      seedCard(
        {
          id,
          concept: tag,
          question: `Recurring issue: "${tag}". Write a correct sentence that avoids it.`,
          answer: fix,
        },
        today,
      ),
    );
    have.add(id);
  }
  return next;
}

export function exportData(s: KeyValue, slug: string): string {
  return JSON.stringify(
    { slug, attempts: loadAttempts(s, slug), deck: loadDeck(s, slug) },
    null,
    2,
  );
}
export function resetData(s: KeyValue, slug: string): void {
  s.removeItem(k(slug, 'attempts'));
  s.removeItem(k(slug, 'deck'));
}

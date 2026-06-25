import { CRITERIA, type Config, type Criterion, type ScoreResult } from './practiceTypes';

export type ScoreErrorKind =
  | 'no-key' | 'auth' | 'rate-limit' | 'network' | 'format' | 'provider';

export class ScoreError extends Error {
  kind: ScoreErrorKind;
  constructor(kind: ScoreErrorKind, message: string) {
    super(message);
    this.name = 'ScoreError';
    this.kind = kind;
  }
}
export class NoKeyError extends ScoreError { constructor() { super('no-key', 'No API key set. Add your key in settings.'); } }
export class AuthError extends ScoreError { constructor() { super('auth', 'Key rejected — check your API key.'); } }
export class RateLimitError extends ScoreError { constructor() { super('rate-limit', 'Rate-limited — retry in a moment.'); } }
export class NetworkError extends ScoreError { constructor(m = 'Network error reaching the provider.') { super('network', m); } }
export class ScoreFormatError extends ScoreError { constructor(m = "Couldn't parse the grade — retry.") { super('format', m); } }
export class ProviderError extends ScoreError { constructor(m = 'The provider returned an error.') { super('provider', m); } }

const isHalfStep = (n: unknown): n is number =>
  typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 9 && Math.round(n * 2) === n * 2;
const nonEmpty = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;

/** Validate the model's JSON content string against the grading contract. */
export function parseScoreResponse(content: string): ScoreResult {
  let raw: unknown;
  try {
    raw = JSON.parse(content);
  } catch {
    throw new ScoreFormatError('Response was not valid JSON.');
  }
  if (typeof raw !== 'object' || raw === null) throw new ScoreFormatError('Response was not an object.');
  const o = raw as Record<string, unknown>;

  if (!isHalfStep(o.overall)) throw new ScoreFormatError('overall band is missing or not a 0–9 half-step.');

  const criteria = o.criteria as Record<string, unknown> | undefined;
  if (!criteria || typeof criteria !== 'object') throw new ScoreFormatError('criteria object missing.');
  const outCriteria = {} as Record<Criterion, ScoreResult['criteria'][Criterion]>;
  for (const c of CRITERIA) {
    const entry = criteria[c] as Record<string, unknown> | undefined;
    if (!entry || typeof entry !== 'object') throw new ScoreFormatError(`criterion ${c} missing.`);
    if (!isHalfStep(entry.band)) throw new ScoreFormatError(`criterion ${c} band invalid.`);
    if (!nonEmpty(entry.justification)) throw new ScoreFormatError(`criterion ${c} justification missing.`);
    if (!nonEmpty(entry.descriptorQuote)) throw new ScoreFormatError(`criterion ${c} descriptorQuote missing.`);
    outCriteria[c] = { band: entry.band, justification: entry.justification, descriptorQuote: entry.descriptorQuote };
  }

  const inlineErrors = Array.isArray(o.inlineErrors) ? (o.inlineErrors as ScoreResult['inlineErrors']) : [];
  const rewrites = Array.isArray(o.rewrites) ? (o.rewrites as ScoreResult['rewrites']) : [];
  const recurringErrorTags = Array.isArray(o.recurringErrorTags)
    ? (o.recurringErrorTags as unknown[]).filter((t): t is string => typeof t === 'string')
    : [];

  const roundToHalf = (n: number): number => Math.round(n * 2) / 2;
  const overall = roundToHalf(
    (outCriteria.TR.band + outCriteria.CC.band + outCriteria.LR.band + outCriteria.GRA.band) / 4,
  );

  return { overall, criteria: outCriteria, inlineErrors, rewrites, recurringErrorTags };
}

const SCORE_SCHEMA = {
  name: 'ielts_score',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['overall', 'criteria', 'inlineErrors', 'rewrites', 'recurringErrorTags'],
    properties: {
      overall: { type: 'number' },
      criteria: {
        type: 'object',
        additionalProperties: false,
        required: ['TR', 'CC', 'LR', 'GRA'],
        properties: Object.fromEntries(
          ['TR', 'CC', 'LR', 'GRA'].map((c) => [c, {
            type: 'object',
            additionalProperties: false,
            required: ['band', 'justification', 'descriptorQuote'],
            properties: {
              band: { type: 'number' },
              justification: { type: 'string' },
              descriptorQuote: { type: 'string' },
            },
          }]),
        ),
      },
      inlineErrors: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['quote', 'type', 'issue', 'fix'],
          properties: {
            quote: { type: 'string' },
            type: { type: 'string', enum: ['grammar', 'lexis', 'cohesion', 'task'] },
            issue: { type: 'string' },
            fix: { type: 'string' },
          },
        },
      },
      rewrites: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['original', 'improved', 'why'],
          properties: { original: { type: 'string' }, improved: { type: 'string' }, why: { type: 'string' } },
        },
      },
      recurringErrorTags: { type: 'array', items: { type: 'string' } },
    },
  },
} as const;

export interface ScoreArgs {
  config: Config;
  rubric: string;
  feedbackSpec: string;
  task: 1 | 2;
  prompt: string;
  essay: string;
}

export function buildScoreRequest(args: ScoreArgs, url: string): { url: string; init: RequestInit } {
  const system = `${args.rubric}\n\n---\n\n${args.feedbackSpec}\n\nReturn ONLY JSON matching the required schema.`;
  const user = `IELTS Academic Writing — Task ${args.task}.\n\nPrompt:\n${args.prompt}\n\nCandidate essay:\n${args.essay}`;
  const body = {
    model: args.config.model,
    temperature: 0,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    response_format: { type: 'json_schema', json_schema: SCORE_SCHEMA },
  };
  return {
    url,
    init: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${args.config.apiKey}` },
      body: JSON.stringify(body),
    },
  };
}

interface ScoreDeps {
  fetchFn?: typeof fetch;
}

function directUrl(config: Config): string {
  return `${config.baseURL.replace(/\/$/, '')}/chat/completions`;
}

/** Map an HTTP status to a typed error (or null if OK). */
function statusError(status: number): ScoreError | null {
  if (status === 401 || status === 403) return new AuthError();
  if (status === 429) return new RateLimitError();
  if (status >= 500) return new ProviderError(`Provider returned ${status}.`);
  if (status >= 400) return new ProviderError(`Request rejected (${status}).`);
  return null;
}

async function callOnce(url: string, init: RequestInit, fetchFn: typeof fetch): Promise<ScoreResult> {
  let res: Response;
  try {
    res = await fetchFn(url, init);
  } catch {
    throw new NetworkError();
  }
  const httpErr = statusError(res.status);
  if (httpErr) throw httpErr;
  let outer: unknown;
  try {
    outer = await res.json();
  } catch {
    throw new ScoreFormatError('Provider response was not JSON.');
  }
  const content = (outer as { choices?: { message?: { content?: string } }[] })?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') throw new ScoreFormatError('Provider response had no message content.');
  return parseScoreResponse(content);
}

/** Score an essay with at most one automatic retry (CORS→fallback, or format→re-request). */
export async function scoreEssay(args: ScoreArgs, deps: ScoreDeps = {}): Promise<ScoreResult> {
  if (!args.config.apiKey.trim()) throw new NoKeyError();
  const fetchFn = deps.fetchFn ?? fetch;
  const direct = buildScoreRequest(args, directUrl(args.config));

  try {
    return await callOnce(direct.url, direct.init, fetchFn);
  } catch (err) {
    if (err instanceof NetworkError) {
      // CORS / network: retry once through the keyless Pages Function.
      const fallback = buildScoreRequest(args, '/api/score');
      const init = { ...fallback.init, headers: { ...(fallback.init.headers as Record<string, string>), 'X-Target': directUrl(args.config) } };
      return await callOnce('/api/score', init, fetchFn);
    }
    if (err instanceof ScoreFormatError) {
      // Bad JSON: one re-request before giving up.
      return await callOnce(direct.url, direct.init, fetchFn);
    }
    throw err;
  }
}

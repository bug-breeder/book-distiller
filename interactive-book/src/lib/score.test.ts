import { describe, it, expect, vi } from 'vitest';
import {
  parseScoreResponse, scoreEssay, ScoreFormatError, NoKeyError, AuthError, RateLimitError,
} from './score';
import type { Config, ScoreResult } from './practiceTypes';

const VALID: ScoreResult = {
  overall: 6.5,
  criteria: {
    TR: { band: 6, justification: 'j', descriptorQuote: 'd' },
    CC: { band: 7, justification: 'j', descriptorQuote: 'd' },
    LR: { band: 6.5, justification: 'j', descriptorQuote: 'd' },
    GRA: { band: 6.5, justification: 'j', descriptorQuote: 'd' },
  },
  inlineErrors: [],
  rewrites: [],
  recurringErrorTags: [],
};

const CONFIG: Config = { apiKey: 'sk-x', baseURL: 'https://api.openai.com/v1', model: 'gpt-5.5' };
const ARGS = { config: CONFIG, rubric: 'R', feedbackSpec: 'S', task: 2 as const, prompt: 'P', essay: 'E' };

function chatResponse(body: ScoreResult, status = 200): Response {
  const payload = { choices: [{ message: { content: JSON.stringify(body) } }] };
  return new Response(JSON.stringify(payload), { status });
}

describe('parseScoreResponse', () => {
  it('accepts a valid contract', () => {
    expect(parseScoreResponse(JSON.stringify(VALID)).overall).toBe(6.5);
  });
  it('rejects non-JSON', () => {
    expect(() => parseScoreResponse('not json')).toThrow(ScoreFormatError);
  });
  it('rejects a missing criterion', () => {
    const bad = { ...VALID, criteria: { ...VALID.criteria } } as Record<string, unknown>;
    delete (bad.criteria as Record<string, unknown>).GRA;
    expect(() => parseScoreResponse(JSON.stringify(bad))).toThrow(ScoreFormatError);
  });
  it('rejects a missing descriptorQuote', () => {
    const bad = JSON.parse(JSON.stringify(VALID));
    bad.criteria.TR.descriptorQuote = '';
    expect(() => parseScoreResponse(JSON.stringify(bad))).toThrow(ScoreFormatError);
  });
  it('rejects an out-of-range / non-half-step band', () => {
    const bad = JSON.parse(JSON.stringify(VALID));
    bad.criteria.TR.band = 6.3;
    expect(() => parseScoreResponse(JSON.stringify(bad))).toThrow(ScoreFormatError);
  });
});

describe('scoreEssay', () => {
  it('throws NoKeyError when the key is empty', async () => {
    await expect(scoreEssay({ ...ARGS, config: { ...CONFIG, apiKey: '' } })).rejects.toThrow(NoKeyError);
  });
  it('returns a parsed result on success', async () => {
    const fetchFn = vi.fn().mockResolvedValue(chatResponse(VALID));
    const out = await scoreEssay(ARGS, { fetchFn });
    expect(out.overall).toBe(6.5);
    expect(fetchFn).toHaveBeenCalledOnce();
  });
  it('maps 401 to AuthError', async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response('no', { status: 401 }));
    await expect(scoreEssay(ARGS, { fetchFn })).rejects.toThrow(AuthError);
  });
  it('maps 429 to RateLimitError', async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response('slow', { status: 429 }));
    await expect(scoreEssay(ARGS, { fetchFn })).rejects.toThrow(RateLimitError);
  });
  it('on a network error, retries once via the /api/score fallback', async () => {
    const fetchFn = vi.fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(chatResponse(VALID));
    const out = await scoreEssay(ARGS, { fetchFn });
    expect(out.overall).toBe(6.5);
    expect(fetchFn).toHaveBeenCalledTimes(2);
    expect(String(fetchFn.mock.calls[1][0])).toContain('/api/score');
  });
  it('on a format error, retries once then throws ScoreFormatError', async () => {
    const fetchFn = vi.fn().mockResolvedValue(chatResponse({ ...VALID, overall: 99 } as ScoreResult));
    await expect(scoreEssay(ARGS, { fetchFn })).rejects.toThrow(ScoreFormatError);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadConfig, saveConfig, loadAttempts, appendAttempt, loadDeck, saveDeck,
  seedCardsFromResult, summarizeAttempt, exportData, resetData, DEFAULT_CONFIG, type KeyValue,
} from './practiceStore';
import type { ScoreResult } from './practiceTypes';

function memStorage(): KeyValue {
  const m = new Map<string, string>();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
  };
}

const RESULT: ScoreResult = {
  overall: 6.5,
  criteria: {
    TR: { band: 6, justification: 'j', descriptorQuote: 'd' },
    CC: { band: 7, justification: 'j', descriptorQuote: 'd' },
    LR: { band: 6.5, justification: 'j', descriptorQuote: 'd' },
    GRA: { band: 6.5, justification: 'j', descriptorQuote: 'd' },
  },
  inlineErrors: [{ quote: 'a car', type: 'grammar', issue: 'article', fix: 'the car' }],
  rewrites: [],
  recurringErrorTags: ['article-misuse', 'subject-verb-agreement'],
};

let s: KeyValue;
beforeEach(() => { s = memStorage(); });

describe('config', () => {
  it('returns DEFAULT_CONFIG when unset', () => {
    expect(loadConfig(s, 'ielts')).toEqual(DEFAULT_CONFIG);
  });
  it('round-trips', () => {
    saveConfig(s, 'ielts', { apiKey: 'sk-x', baseURL: 'https://api.openai.com/v1', model: 'gpt-5.5' });
    expect(loadConfig(s, 'ielts').model).toBe('gpt-5.5');
  });
  it('namespaces by slug', () => {
    saveConfig(s, 'ielts', { apiKey: 'sk-x', baseURL: 'b', model: 'm' });
    expect(loadConfig(s, 'other')).toEqual(DEFAULT_CONFIG);
  });
});

describe('attempts', () => {
  it('appends and reads back', () => {
    const a = summarizeAttempt(RESULT, { task: 2, promptId: 'p1', wordCount: 250 });
    appendAttempt(s, 'ielts', a);
    const out = loadAttempts(s, 'ielts');
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ overall: 6.5, task: 2, promptId: 'p1', wordCount: 250 });
    expect(out[0].criteria).toEqual({ TR: 6, CC: 7, LR: 6.5, GRA: 6.5 });
  });
});

describe('seedCardsFromResult', () => {
  it('creates one card per new tag', () => {
    const deck = seedCardsFromResult([], RESULT, '2026-06-25');
    expect(deck.map((c) => c.id)).toEqual(['err:article-misuse', 'err:subject-verb-agreement']);
  });
  it('dedupes against existing cards by id', () => {
    const first = seedCardsFromResult([], RESULT, '2026-06-25');
    const again = seedCardsFromResult(first, RESULT, '2026-06-26');
    expect(again).toHaveLength(2); // no duplicates added
  });
});

describe('export/reset', () => {
  it('exports attempts + deck and reset clears them', () => {
    appendAttempt(s, 'ielts', summarizeAttempt(RESULT, { task: 2, promptId: 'p1', wordCount: 250 }));
    saveDeck(s, 'ielts', seedCardsFromResult([], RESULT, '2026-06-25'));
    const json = JSON.parse(exportData(s, 'ielts'));
    expect(json.attempts).toHaveLength(1);
    expect(json.deck).toHaveLength(2);
    resetData(s, 'ielts');
    expect(loadAttempts(s, 'ielts')).toEqual([]);
    expect(loadDeck(s, 'ielts')).toEqual([]);
  });
});

// interactive-book/src/components/PracticeScorer.tsx
import React, { useEffect, useState } from 'react';
import type { PracticeBundle, Config, ScoreResult } from '../lib/practiceTypes';
import { scoreEssay, ScoreError } from '../lib/score';
import {
  loadConfig, saveConfig, appendAttempt, summarizeAttempt,
  loadDeck, saveDeck, seedCardsFromResult, DEFAULT_CONFIG,
} from '../lib/practiceStore';

const today = (): string => new Date().toISOString().slice(0, 10);
const wordCount = (s: string): number => (s.trim() ? s.trim().split(/\s+/).length : 0);

export default function PracticeScorer({ bundle }: { bundle: PracticeBundle }): React.ReactElement {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [promptId, setPromptId] = useState<string>(bundle.prompts[0]?.id ?? '');
  const [essay, setEssay] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScoreResult | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') setConfig(loadConfig(window.localStorage, bundle.slug));
  }, [bundle.slug]);

  const prompt = bundle.prompts.find((p) => p.id === promptId) ?? bundle.prompts[0];

  function persistConfig(next: Config): void {
    setConfig(next);
    if (typeof window !== 'undefined') saveConfig(window.localStorage, bundle.slug, next);
  }

  async function onSubmit(): Promise<void> {
    if (!prompt) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const r = await scoreEssay({
        config, rubric: bundle.rubric, feedbackSpec: bundle.feedbackSpec,
        task: prompt.task, prompt: prompt.prompt, essay,
      });
      setResult(r);
      if (typeof window !== 'undefined') {
        const s = window.localStorage;
        appendAttempt(s, bundle.slug, summarizeAttempt(r, { task: prompt.task, promptId: prompt.id, wordCount: wordCount(essay) }));
        saveDeck(s, bundle.slug, seedCardsFromResult(loadDeck(s, bundle.slug), r, today()));
      }
    } catch (e) {
      setError(e instanceof ScoreError ? e.message : 'Unexpected error.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ border: '1px solid var(--ifm-color-emphasis-300)', borderRadius: 8, padding: 16 }}>
      <details style={{ marginBottom: 12 }}>
        <summary><strong>API settings</strong> (stored only in this browser)</summary>
        <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
          <label>API key
            <input type="password" value={config.apiKey} placeholder="sk-..."
              onChange={(e) => persistConfig({ ...config, apiKey: e.target.value })} style={{ width: '100%' }} />
          </label>
          <label>Base URL
            <input type="text" value={config.baseURL}
              onChange={(e) => persistConfig({ ...config, baseURL: e.target.value })} style={{ width: '100%' }} />
          </label>
          <label>Model
            <input type="text" value={config.model} placeholder="gpt-5.5"
              onChange={(e) => persistConfig({ ...config, model: e.target.value })} style={{ width: '100%' }} />
          </label>
        </div>
      </details>

      <label>Prompt
        <select value={promptId} onChange={(e) => setPromptId(e.target.value)} style={{ width: '100%' }}>
          {bundle.prompts.map((p) => (
            <option key={p.id} value={p.id}>Task {p.task} — {p.type}: {p.prompt.slice(0, 60)}…</option>
          ))}
        </select>
      </label>

      {prompt?.imageUrl && <img src={prompt.imageUrl} alt="Task 1 visual" style={{ maxWidth: '100%', margin: '8px 0' }} />}
      {prompt && <p style={{ fontStyle: 'italic' }}>{prompt.prompt}</p>}

      <textarea value={essay} onChange={(e) => setEssay(e.target.value)} rows={14}
        placeholder="Write your essay here…" style={{ width: '100%' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0' }}>
        <span>{wordCount(essay)} words</span>
        <button onClick={onSubmit} disabled={busy || !essay.trim()}>
          {busy ? 'Scoring…' : 'Score my essay'}
        </button>
      </div>

      {error && (
        <div style={{ color: 'var(--ifm-color-danger)', marginBottom: 8 }}>
          {error} <button onClick={onSubmit} disabled={busy}>Retry</button>
        </div>
      )}

      {result && <ScoreView result={result} />}

      <p style={{ fontSize: '0.8em', opacity: 0.7, marginTop: 12 }}>
        Your key and history stay in this browser; your essay is sent only to the provider you configured. Estimated
        bands are practice feedback, not an official IELTS score.
      </p>
    </div>
  );
}

function ScoreView({ result }: { result: ScoreResult }): React.ReactElement {
  const labels: Record<string, string> = {
    TR: 'Task Response', CC: 'Coherence & Cohesion', LR: 'Lexical Resource', GRA: 'Grammatical Range & Accuracy',
  };
  return (
    <div style={{ marginTop: 16 }}>
      <h3>Overall band: {result.overall}</h3>
      <div style={{ display: 'grid', gap: 8 }}>
        {(['TR', 'CC', 'LR', 'GRA'] as const).map((c) => (
          <div key={c} style={{ border: '1px solid var(--ifm-color-emphasis-200)', borderRadius: 6, padding: 8 }}>
            <strong>{labels[c]}: {result.criteria[c].band}</strong>
            <p style={{ margin: '4px 0' }}>{result.criteria[c].justification}</p>
            <p style={{ margin: 0, fontSize: '0.85em', opacity: 0.8 }}>Descriptor: "{result.criteria[c].descriptorQuote}"</p>
          </div>
        ))}
      </div>

      {result.inlineErrors.length > 0 && (
        <>
          <h4>Errors to fix</h4>
          <ul>
            {result.inlineErrors.map((e, i) => (
              <li key={i}><code>{e.quote}</code> — <em>{e.type}</em>: {e.issue} → <strong>{e.fix}</strong></li>
            ))}
          </ul>
        </>
      )}

      {result.rewrites.length > 0 && (
        <>
          <h4>Band-7 rewrites</h4>
          <ul>
            {result.rewrites.map((r, i) => (
              <li key={i}><s>{r.original}</s> → <strong>{r.improved}</strong> <em>({r.why})</em></li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

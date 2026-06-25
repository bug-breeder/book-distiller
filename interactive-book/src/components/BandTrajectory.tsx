import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Attempt } from '../lib/practiceTypes';
import { loadAttempts, exportData, resetData } from '../lib/practiceStore';

export default function BandTrajectory({ slug }: { slug: string }): React.ReactElement {
  const [attempts, setAttempts] = useState<Attempt[]>([]);

  function refresh(): void {
    if (typeof window !== 'undefined') setAttempts(loadAttempts(window.localStorage, slug));
  }
  useEffect(refresh, [slug]);

  if (attempts.length === 0) return <p>No scored essays yet. Your band trajectory appears here after your first submission.</p>;

  const data = attempts.map((a, i) => ({
    n: i + 1,
    Overall: a.overall,
    TR: a.criteria.TR, CC: a.criteria.CC, LR: a.criteria.LR, GRA: a.criteria.GRA,
  }));

  function onExport(): void {
    if (typeof window === 'undefined') return;
    const blob = new Blob([exportData(window.localStorage, slug)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${slug}-practice.json`; a.click();
    URL.revokeObjectURL(url);
  }
  function onReset(): void {
    if (typeof window === 'undefined') return;
    if (window.confirm('Clear all practice history for this course?')) { resetData(window.localStorage, slug); refresh(); }
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <XAxis dataKey="n" label={{ value: 'attempt', position: 'insideBottom', offset: -4 }} />
          <YAxis domain={[4, 9]} />
          <Tooltip /><Legend />
          <Line type="monotone" dataKey="Overall" strokeWidth={2} />
          <Line type="monotone" dataKey="TR" /><Line type="monotone" dataKey="CC" />
          <Line type="monotone" dataKey="LR" /><Line type="monotone" dataKey="GRA" />
        </LineChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button onClick={onExport}>Export data</button>
        <button onClick={onReset}>Reset this course</button>
      </div>
    </div>
  );
}

import React, {useEffect, useRef, useState} from 'react';
import VizFrame from './VizFrame';
import {seedFromString} from '../lib/rng';
import type {SimProps, SimMeta} from '../sims/types';

interface SimHostProps {
  meta: SimMeta;
  /** The sim's default-exported component. */
  component: React.ComponentType<SimProps>;
}

/**
 * The single wrapper every generated sim renders through. Measures the container
 * width (ResizeObserver), reads the active theme (the `data-theme` attribute
 * Docusaurus sets on <html>, the same signal the CSS uses), derives a stable seed
 * from the sim title, and renders the sim inside the shared VizFrame chrome.
 * SSR-safe: the sim only mounts once a width has been measured on the client.
 */
export default function SimHost({meta, component: Sim}: SimHostProps): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [isDark, setIsDark] = useState(false);
  const seed = seedFromString(meta.title);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      if (w > 0) setWidth(Math.round(w));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const read = () => setIsDark(document.documentElement.getAttribute('data-theme') === 'dark');
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, {attributes: true, attributeFilter: ['data-theme']});
    return () => mo.disconnect();
  }, []);

  return (
    <VizFrame title={meta.title} caption={meta.caption}>
      <div ref={ref} style={{width: '100%', minHeight: 1}}>
        {width > 0 ? <Sim width={width} seed={seed} isDark={isDark} /> : null}
      </div>
    </VizFrame>
  );
}

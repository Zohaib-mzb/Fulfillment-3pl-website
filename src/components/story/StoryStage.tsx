/**
 * Homepage scroll-story island (hydrated with client:visible).
 * This file is tiny on purpose: it decides whether the device should get the
 * 3D scene and only then lazy-loads the heavy chunk (three + R3F + GSAP + Lenis).
 * Otherwise the server-rendered SVG frames stay in place (static fallback).
 */
import { lazy, Suspense, useEffect, useState } from 'react';

const StoryScene = lazy(() => import('./StoryScene'));

type Mode = 'pending' | '3d' | 'static';

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

/** Measures ~24 animation frames; a busy or throttled main thread means "low-end". */
function frameProbe(frames = 24): Promise<number> {
  return new Promise((resolve) => {
    let n = 0;
    let start = 0;
    const tick = (t: number) => {
      if (!start) start = t;
      if (++n >= frames) return resolve((n - 1) / ((t - start) / 1000));
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

export async function canRun3D(): Promise<{ ok: boolean; reason: string }> {
  if (typeof window === 'undefined') return { ok: false, reason: 'ssr' };
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return { ok: false, reason: 'reduced-motion' };
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  if (nav.connection?.saveData) return { ok: false, reason: 'save-data' };
  if ((nav.hardwareConcurrency ?? 8) <= 4) return { ok: false, reason: 'low-cpu' };
  if (nav.deviceMemory !== undefined && nav.deviceMemory <= 2) return { ok: false, reason: 'low-memory' };
  if (!hasWebGL()) return { ok: false, reason: 'no-webgl' };
  const fps = await frameProbe();
  if (fps < 40) return { ok: false, reason: `fps-${Math.round(fps)}` };
  return { ok: true, reason: 'ok' };
}

export default function StoryStage() {
  const [mode, setMode] = useState<Mode>('pending');

  useEffect(() => {
    let alive = true;
    canRun3D().then(({ ok, reason }) => {
      if (!alive) return;
      document.getElementById('story')?.setAttribute('data-fallback-reason', reason);
      setMode(ok ? '3d' : 'static');
    });
    const mq = matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => mq.matches && setMode('static');
    mq.addEventListener('change', onChange);
    return () => {
      alive = false;
      mq.removeEventListener('change', onChange);
    };
  }, []);

  useEffect(() => {
    const el = document.getElementById('story');
    if (!el) return;
    if (mode === 'static') el.setAttribute('data-mode', 'static');
    if (mode === 'pending') el.removeAttribute('data-mode');
  }, [mode]);

  if (mode !== '3d') return <div className="h-full w-full" />;
  return (
    <Suspense fallback={<div className="h-full w-full" />}>
      <StoryScene
        onReady={() => document.getElementById('story')?.setAttribute('data-mode', '3d')}
        onFail={(reason) => {
          document.getElementById('story')?.setAttribute('data-fallback-reason', reason);
          setMode('static');
        }}
      />
    </Suspense>
  );
}

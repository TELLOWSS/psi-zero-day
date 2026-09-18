import { useEffect, useMemo, useState } from 'react';
import { COMPANY_NAME } from '../app/brand';

export function CinematicLoadingScreen({
  backgroundUri,
  preloadUris,
  crew = [],
  onComplete,
}: {
  readonly backgroundUri?: string;
  readonly preloadUris: readonly string[];
  readonly crew?: readonly { readonly id: string; readonly uri?: string; readonly name: string; readonly role: string }[];
  readonly onComplete: () => void;
}) {
  const [progress, setProgress] = useState(6);
  const [assetsReady, setAssetsReady] = useState(false);
  const [exiting, setExiting] = useState(false);
  const uniqueUris = useMemo(() => [...new Set(preloadUris.filter(Boolean))], [preloadUris]);

  useEffect(() => {
    let cancelled = false;
    const fallback = window.setTimeout(() => !cancelled && setAssetsReady(true), 2200);
    if (!uniqueUris.length) {
      setAssetsReady(true);
      return () => window.clearTimeout(fallback);
    }

    Promise.allSettled(uniqueUris.map(uri => new Promise<void>(resolve => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => resolve();
      image.onerror = () => resolve();
      image.src = uri;
    }))).then(() => {
      if (!cancelled) setAssetsReady(true);
    });

    return () => {
      cancelled = true;
      window.clearTimeout(fallback);
    };
  }, [uniqueUris]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setProgress(current => {
        const ceiling = assetsReady ? 100 : 91;
        if (current >= ceiling) return current;
        const remaining = ceiling - current;
        const step = remaining > 55 ? 5 : remaining > 25 ? 3 : remaining > 8 ? 2 : 1;
        return Math.min(ceiling, current + step);
      });
    }, 86);
    return () => window.clearInterval(timer);
  }, [assetsReady]);

  useEffect(() => {
    if (progress < 100) return;
    setExiting(true);
    const done = window.setTimeout(onComplete, 620);
    return () => window.clearTimeout(done);
  }, [progress, onComplete]);

  const status = progress < 32
    ? '현장 자산을 확인하고 있습니다.'
    : progress < 58
      ? '작업자 배치와 동선을 불러오고 있습니다.'
      : progress < 84
        ? 'PSI가 위험 신호를 스캔하고 있습니다.'
        : progress < 100
          ? '현장 진입을 준비하고 있습니다.'
          : '진입 준비 완료';

  return <main className={`cinematic-loading${exiting ? ' is-complete' : ''}`} aria-label="현장 진입 준비">
    {backgroundUri ? <img className="cinematic-loading-backdrop" src={backgroundUri} alt="" aria-hidden="true" /> : null}
    <div className="cinematic-loading-vignette" aria-hidden="true" />
    <div className="cinematic-scanline" aria-hidden="true"><i /></div>

    <header className="cinematic-loading-brand">
      <strong>PSI : ZERO DAY</strong>
      <small>{COMPANY_NAME}</small>
      <span>현장, 오늘도 무사히</span>
    </header>

    <section className="cinematic-loading-panel" role="status" aria-live="polite">
      <div className="cinematic-loading-kicker"><span>CHAPTER 01</span><b>ON SITE</b></div>
      <h1>현장 진입 중<span className="cinematic-loading-dots" aria-hidden="true">...</span></h1>
      <small>PROACTIVE SAFETY INTELLIGENCE</small>
      <div
        className="cinematic-progress"
        role="progressbar"
        aria-label="현장 진입 진행률"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
      >
        <span><i style={{ width: `${progress}%` }} /></span>
        <strong>{progress}%</strong>
      </div>
      <p>{status}</p>
    </section>

    {crew.length ? <section className="cinematic-loading-team" aria-label="현장 투입 인원">
      <header><span>FIELD TEAM</span><strong>{String(crew.length).padStart(2, '0')}</strong></header>
      <div>{crew.map((member, index) => <article key={member.id} className={`crew-${index}`} data-art-surface="loading" data-character={member.id}>
        {member.uri ? <img src={member.uri} alt="" aria-hidden="true" /> : <span aria-hidden="true" />}
        <p><strong>{member.name}</strong><small>{member.role}</small></p>
      </article>)}</div>
    </section> : null}

    <aside className="cinematic-loading-tip">
      <b>TIP</b>
      <span>위험은 사라진 것이 아니라, 확인된 것이다.</span>
    </aside>
  </main>;
}

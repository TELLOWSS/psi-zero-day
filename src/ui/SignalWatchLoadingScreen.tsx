import { useEffect, useState } from 'react';
import './signal-watch-loading.css';

const assets = [
  '/mode-previews/signal-watch.webp',
  '/assets/survivors/sprite_player_yoon.webp',
  '/assets/survivors/sprite_mob_worker.webp',
  '/assets/survivors/stage-01-ground-v2.webp',
];

export function SignalWatchLoadingScreen({ loadGame, onComplete, onExit }: {
  readonly loadGame: () => Promise<unknown>;
  readonly onComplete: () => void;
  readonly onExit: () => void;
}) {
  const [progress, setProgress] = useState(0);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    const started = performance.now();
    setProgress(0);
    setFailed(false);
    const images = assets.map(uri => new Promise<void>(resolve => {
      const image = new Image();
      const timeout = window.setTimeout(resolve, 5000);
      const finish = () => { window.clearTimeout(timeout); resolve(); };
      image.onload = finish;
      image.onerror = finish;
      image.src = uri;
    }).then(() => { if (!cancelled) setProgress(value => Math.min(80, value + 16)); }));
    let transition: number | undefined;
    Promise.all([loadGame(), ...images]).then(() => {
      if (cancelled) return;
      setProgress(100);
      transition = window.setTimeout(onComplete, Math.max(350, 1400 - (performance.now() - started)));
    }).catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; window.clearTimeout(transition); };
  }, [loadGame, onComplete, attempt]);
  return <main className="signal-watch-loading" aria-label="시그널 워치 진입 준비">
    <img className="signal-watch-loading-art" src={assets[0]} alt="" aria-hidden="true" />
    <div className="signal-watch-loading-light" aria-hidden="true" />
    <section className="signal-watch-loading-brand" role="status" aria-live="polite">
      <small>NEW-PSI : ZERO DAY</small>
      <h1>SIGNAL<br /><em>WATCH</em></h1>
      <p>사고 전 신호를 읽고, 현장을 지켜라.</p>
      <progress max={100} value={progress} aria-label="시그널 워치 준비 진행률" />
      <span>{failed ? '현장을 불러오지 못했습니다.' : progress === 100 ? '현장 준비 완료' : '위험 신호 스캔 · 현장 준비 중'}</span>
      {failed ? <button type="button" onClick={() => setAttempt(value => value + 1)}>다시 준비</button> : null}
    </section>
    <button className="signal-watch-loading-exit" type="button" onClick={onExit}>메인으로 ↗</button>
  </main>;
}

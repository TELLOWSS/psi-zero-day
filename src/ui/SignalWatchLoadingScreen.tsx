import { useEffect, useState } from 'react';
import './signal-watch-loading.css';

const HERO = '/signal-watch-loading/signal-watch-a-v1.webp';
const PRELOAD_ASSETS = [
  HERO,
  '/assets/survivors/sprite_player_yoon.webp',
  '/assets/survivors/sprite_mob_worker.webp',
  '/assets/survivors/stage-01-ground-v2.webp',
] as const;

function preloadImage(uri: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const timeout = window.setTimeout(() => reject(new Error(`Asset loading timed out: ${uri}`)), 12000);
    image.onload = () => { window.clearTimeout(timeout); resolve(); };
    image.onerror = () => { window.clearTimeout(timeout); reject(new Error(`Asset loading failed: ${uri}`)); };
    image.src = uri;
  });
}

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
    let completed = 0;
    let transition: number | undefined;
    let watchdog: number | undefined;
    const started = performance.now();
    setProgress(0);
    setFailed(false);

    const markPrepared = () => {
      if (!cancelled) {
        completed += 1;
        setProgress(Math.round((completed / (PRELOAD_ASSETS.length + 1)) * 96));
      }
    };

    const assets = PRELOAD_ASSETS.map((uri, index) => preloadImage(uri)
      .then(markPrepared)
      .catch(error => {
        // The cinematic artwork is mandatory; missing auxiliary sprites should not lock the app.
        if (index === 0) throw error;
        markPrepared();
      }));
    const game = Promise.resolve().then(loadGame).then(markPrepared);
    const timeout = new Promise<never>((_, reject) => {
      watchdog = window.setTimeout(() => reject(new Error('SIGNAL WATCH loading timed out')), 20000);
    });

    Promise.race([Promise.all([...assets, game]), timeout])
      .then(() => {
        if (cancelled) return;
        window.clearTimeout(watchdog);
        setProgress(100);
        transition = window.setTimeout(onComplete, Math.max(300, 1000 - (performance.now() - started)));
      })
      .catch(() => {
        if (cancelled) return;
        window.clearTimeout(watchdog);
        setFailed(true);
      });

    return () => {
      cancelled = true;
      window.clearTimeout(watchdog);
      window.clearTimeout(transition);
    };
  }, [loadGame, onComplete, attempt]);

  const status = failed
    ? '현장을 불러오지 못했습니다.'
    : progress === 100
      ? '현장 진입 준비 완료'
      : progress < 40
        ? '현장 환경과 장비를 확인하는 중'
        : progress < 80
          ? '작업자와 위험 신호를 연결하는 중'
          : '안전 신호 분석을 마무리하는 중';

  return <main className="signal-watch-loading" aria-label="시그널 워치 진입 준비">
    <img className="signal-watch-loading-backdrop" src={HERO} alt="" aria-hidden="true" />
    <div className="signal-watch-loading-atmosphere" aria-hidden="true" />
    <div className="signal-watch-loading-poster">
      <img className="signal-watch-loading-art" src={HERO} alt="" aria-hidden="true" fetchPriority="high" />
      <div className="signal-watch-loading-scan" aria-hidden="true" />
      <section className="signal-watch-loading-panel" aria-live="polite">
        <div className="signal-watch-loading-progress-title">
          <strong>LOADING<span aria-hidden="true">...</span></strong>
          <b>{progress}%</b>
        </div>
        <div className="signal-watch-loading-progress" role="progressbar"
          aria-label="시그널 워치 준비 진행률" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
          <i style={{ width: `${progress}%` }} />
        </div>
        <p>{status}</p>
        {failed ? <button className="signal-watch-loading-retry" type="button" onClick={() => setAttempt(value => value + 1)}>다시 준비</button> : null}
        <small>PEOPLE <span>│</span> SITES <span>│</span> A SAFER TOMORROW</small>
      </section>
    </div>
    <button className="signal-watch-loading-exit" type="button" onClick={onExit}>↗ 메인</button>
  </main>;
}

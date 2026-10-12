import { useEffect, useState } from 'react';
import './signal-watch-loading.css';
import { SIGNAL_WATCH_KEY_ART } from './signal-watch-art';
import { resumePatrolStage, parseSave, LAST_PATROL_STAGE_KEY } from '../app/survivors-save';
import { stageGroundUri } from './survivors-equipment-art';

const HERO = SIGNAL_WATCH_KEY_ART;
function entryGround(): string {
  try {
    return stageGroundUri(resumePatrolStage(localStorage.getItem(LAST_PATROL_STAGE_KEY),
      parseSave(localStorage.getItem('psi.survivors.unlocked_stages')),
      parseSave(localStorage.getItem('psi.survivors.stage_stars'))));
  } catch { return stageGroundUri('stage_01'); }
}

function preloadImage(uri: string, attempt = 0): Promise<void> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const timeout = window.setTimeout(() => reject(new Error(`Asset loading timed out: ${uri}`)), 12000);
    image.onload = () => { window.clearTimeout(timeout); resolve(); };
    image.onerror = () => { window.clearTimeout(timeout); reject(new Error(`Asset loading failed: ${uri}`)); };
    // A transient failed request may remain negatively cached by the browser.
    image.src = attempt ? `${uri}${uri.includes('?') ? '&' : '?'}entryRetry=${attempt}` : uri;
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
    const assetsToPrepare = [HERO, entryGround()];
    setProgress(0);
    setFailed(false);

    const markPrepared = () => {
      if (!cancelled) {
        completed += 1;
        setProgress(Math.round((completed / (assetsToPrepare.length + 1)) * 96));
      }
    };

    const assets = assetsToPrepare.map((uri, index) => preloadImage(uri, attempt)
      .then(markPrepared)
      .catch(error => {
        // The cinematic artwork is mandatory; a missing selected map should not lock the app.
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
        transition = window.setTimeout(onComplete, 180);
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
      ? '작전 선택 화면 준비 완료'
      : progress < 40
        ? '현장 환경과 장비를 확인하는 중'
        : progress < 80
          ? '작업자와 위험 신호를 연결하는 중'
          : '안전 신호 분석을 마무리하는 중';

  const hero = attempt ? `${HERO}?entryRetry=${attempt}` : HERO;

  return <main className="signal-watch-loading" aria-label="시그널 워치 진입 준비">
    <div className="signal-watch-loading-poster">
      <img key={attempt} className="signal-watch-loading-art" src={hero} alt="" aria-hidden="true" fetchPriority="high" />
      <section className="signal-watch-loading-panel" aria-live="polite">
        <span className="signal-watch-loading-brand">SIGNAL WATCH / NEW PSI</span>
        <h1>시그널 워치</h1>
        <p className="signal-watch-loading-tagline">사고 전 신호를 읽고, 현장을 바꿔라.</p>
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

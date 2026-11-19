import { useCallback, useEffect, useRef, useState } from 'react';
import {
  OMEGA_SECTORS,
  OMEGA_WEAPONS,
  OMEGA_WEAPON_ORDER,
  type OmegaQualityPreset,
  type OmegaRank,
  type OmegaUpgradeConfig,
  type OmegaWeaponId,
} from '../domain/omega-protocol';
import { OmegaProtocolEngine, type OmegaPhase } from '../engine/omega-protocol-engine';
import { OmegaAudioEngine } from '../app/omega-audio';
import {
  countClearedOmegaSectors,
  readOmegaSave,
  recordOmegaRunResult,
  type OmegaSaveDocument,
} from '../app/omega-save';
import { OmegaRenderer } from './omega-renderer';
import './omega-protocol.css';

export interface OmegaProtocolGameProps {
  readonly onExit: () => void;
  readonly audioMuted: boolean;
  readonly onToggleAudio: () => void;
  readonly initialView?: 'hub' | 'combat';
}

interface OmegaHudSnapshot {
  readonly phase: OmegaPhase;
  readonly singleSectorMode: boolean;
  readonly sectorIndex: number;
  readonly waveLabel: string;
  readonly hp: number;
  readonly maxHp: number;
  readonly shield: number;
  readonly maxShield: number;
  readonly weapon: OmegaWeaponId;
  readonly mag: Record<OmegaWeaponId, number>;
  readonly overchargedShots: number;
  readonly reloadActive: boolean;
  readonly reloadProgress: number;
  readonly omegaGauge: number;
  readonly overdriveCutIn: boolean;
  readonly overdriveActive: boolean;
  readonly slowMoActive: boolean;
  readonly score: number;
  readonly combo: number;
  readonly maxCombo: number;
  readonly kills: number;
  readonly weakpointKills: number;
  readonly perfectEvades: number;
  readonly counterBreaks: number;
  readonly clearedSectors: readonly number[];
  readonly upgradeChoices: readonly OmegaUpgradeConfig[];
  readonly commsText: string;
  readonly bossWarningText: string;
  readonly bossName: string | null;
  readonly bossHp: number;
  readonly bossMaxHp: number;
  readonly bossPhase: 1 | 2;
  readonly rank: OmegaRank;
}

const QUALITY_LABELS: Record<OmegaQualityPreset, string> = {
  high: '품질: 높음 (6레이어 풀효과)',
  balanced: '품질: 균형',
  low: '품질: 경량 (저전력)',
};

function snapshotFromEngine(engine: OmegaProtocolEngine): OmegaHudSnapshot {
  const s = engine.state;
  const boss = s.enemies.find(e => e.isBoss) ?? null;
  const sec = engine.sector;
  return {
    phase: s.phase,
    singleSectorMode: s.singleSectorMode,
    sectorIndex: s.sectorIndex,
    waveLabel: s.waveLabel,
    hp: Math.ceil(s.hp),
    maxHp: s.maxHp,
    shield: Math.ceil(s.shield),
    maxShield: s.maxShield,
    weapon: s.weapon,
    mag: { ...s.mag },
    overchargedShots: s.overchargedShots,
    reloadActive: s.reloadActive,
    reloadProgress: s.reloadProgress,
    omegaGauge: Math.floor(s.omegaGauge),
    overdriveCutIn: s.overdriveCutInTimer > 0,
    overdriveActive: s.overdriveTimer > 0,
    slowMoActive: s.slowMoTimer > 0,
    score: s.score,
    combo: s.combo,
    maxCombo: s.maxCombo,
    kills: s.kills,
    weakpointKills: s.weakpointKills,
    perfectEvades: s.perfectEvades,
    counterBreaks: s.counterBreaks,
    clearedSectors: [...s.clearedSectors],
    upgradeChoices: [...s.upgradeChoices],
    commsText: s.commsTimer > 0 ? s.commsText : '',
    bossWarningText: s.bossWarningTimer > 0 ? s.bossTitle : '',
    bossName: boss ? `${sec.bossTitleEn} · ${sec.bossTitleKo}` : null,
    bossHp: boss ? Math.ceil(boss.hp) : 0,
    bossMaxHp: boss ? boss.maxHp : 1,
    bossPhase: boss ? boss.phase : 1,
    rank: s.rank,
  };
}

export function OmegaProtocolGame(props: OmegaProtocolGameProps) {
  const [view, setView] = useState<'hub' | 'combat'>(props.initialView ?? 'hub');
  const [quality, setQuality] = useState<OmegaQualityPreset>('high');
  const [saveDoc, setSaveDoc] = useState<OmegaSaveDocument>(() =>
    readOmegaSave(typeof window !== 'undefined' ? window.localStorage : null),
  );
  const [hubTilt, setHubTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [previewBackdrop, setPreviewBackdrop] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  const engineRef = useRef<OmegaProtocolEngine | null>(null);
  if (!engineRef.current) {
    engineRef.current = new OmegaProtocolEngine();
    if (props.initialView === 'combat') {
      engineRef.current.startCampaign(0, false);
    }
  }
  const rendererRef = useRef<OmegaRenderer | null>(null);
  if (!rendererRef.current) {
    rendererRef.current = new OmegaRenderer();
  }
  const audioRef = useRef<OmegaAudioEngine | null>(null);
  if (!audioRef.current) {
    audioRef.current = new OmegaAudioEngine();
  }

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const inputRef = useRef<{ aimX: number; aimY: number; firing: boolean; forcingCover: boolean }>({
    aimX: 0.5,
    aimY: 0.44,
    firing: false,
    forcingCover: false,
  });
  const qualityRef = useRef<OmegaQualityPreset>(quality);
  qualityRef.current = quality;
  const reducedMotionRef = useRef<boolean>(reducedMotion);
  reducedMotionRef.current = reducedMotion;
  const resultRecordedRef = useRef(false);

  const [hud, setHud] = useState<OmegaHudSnapshot>(() => snapshotFromEngine(engineRef.current!));

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    audioRef.current?.setMuted(props.audioMuted);
  }, [props.audioMuted]);

  useEffect(() => {
    rendererRef.current?.preloadBackdrops(OMEGA_SECTORS.map(s => s.backdropUri));
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      audio?.dispose();
    };
  }, []);

  const syncHud = useCallback(() => {
    if (!engineRef.current) return;
    setHud(snapshotFromEngine(engineRef.current));
  }, []);

  const launchRun = useCallback((sectorIndex: number, singleSector: boolean) => {
    const engine = engineRef.current!;
    resultRecordedRef.current = false;
    inputRef.current.firing = false;
    inputRef.current.forcingCover = false;
    audioRef.current?.unlock();
    engine.startCampaign(sectorIndex, singleSector);
    setView('combat');
    syncHud();
  }, [syncHud]);

  // Persist campaign / sector clear once when run ends
  useEffect(() => {
    if ((hud.phase === 'victory' || hud.phase === 'defeat') && !resultRecordedRef.current) {
      resultRecordedRef.current = true;
      const storage = typeof window !== 'undefined' ? window.localStorage : null;
      if (hud.clearedSectors.length > 0) {
        const updated = recordOmegaRunResult(storage, {
          clearedSectorIndices: hud.clearedSectors,
          fullCampaignClear: hud.phase === 'victory' && !hud.singleSectorMode && hud.clearedSectors.includes(4),
          score: hud.score,
          rank: hud.rank,
          maxCombo: hud.maxCombo,
        });
        setSaveDoc(updated);
      }
    }
  }, [hud.clearedSectors, hud.maxCombo, hud.phase, hud.rank, hud.score, hud.singleSectorMode]);

  // Main 60fps simulation + 6-layer render loop while in combat
  useEffect(() => {
    if (view !== 'combat') return;
    const engine = engineRef.current!;
    const renderer = rendererRef.current!;
    const audio = audioRef.current!;
    let rafId = 0;
    let lastTime = performance.now();
    let hudTimer = 0;

    const tick = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      engine.update(dt, inputRef.current);

      const cues = engine.drainAudioEvents();
      for (const cue of cues) {
        audio.playCue(cue.kind, cue.pan);
      }
      audio.setSceneState({
        combatActive: engine.state.phase === 'playing',
        bossMode: engine.state.enemies.some(e => e.isBoss),
        slowMo: engine.state.slowMoTimer > 0 || engine.state.overdriveTimer > 0,
      });

      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const maxDpr = qualityRef.current === 'high' ? 2 : qualityRef.current === 'balanced' ? 1.5 : 1;
        const dpr = Math.min(maxDpr, window.devicePixelRatio || 1);
        const targetW = Math.max(1, Math.round(rect.width * dpr));
        const targetH = Math.max(1, Math.round(rect.height * dpr));
        if (canvas.width !== targetW || canvas.height !== targetH) {
          canvas.width = targetW;
          canvas.height = targetH;
        }
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.save();
          ctx.scale(dpr, dpr);
          renderer.render(ctx, engine, rect.width, rect.height, dt, {
            quality: qualityRef.current,
            reducedMotion: reducedMotionRef.current,
          });
          ctx.restore();
        }
      }

      hudTimer += dt;
      if (hudTimer >= 0.045) {
        hudTimer = 0;
        syncHud();
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [view, syncHud]);

  // Keyboard combat controls
  useEffect(() => {
    if (view !== 'combat') return;
    const engine = engineRef.current!;

    const onKeyDown = (e: KeyboardEvent) => {
      audioRef.current?.unlock();
      const key = e.key.toLowerCase();
      if (engine.state.phase === 'upgrade' && (key === '1' || key === '2' || key === '3')) {
        const pick = engine.state.upgradeChoices[Number(key) - 1];
        if (pick) {
          e.preventDefault();
          engine.chooseUpgrade(pick.id);
          syncHud();
        }
        return;
      }
      if (key === 'a' || e.key === 'ArrowLeft') {
        e.preventDefault();
        engine.dash(-1);
        syncHud();
      } else if (key === 'd' || e.key === 'ArrowRight') {
        e.preventDefault();
        engine.dash(1);
        syncHud();
      } else if (key === 's' || key === 'shift') {
        inputRef.current.forcingCover = true;
      } else if (e.key === ' ') {
        e.preventDefault();
        inputRef.current.firing = true;
      } else if (key === 'r') {
        e.preventDefault();
        engine.triggerReload();
        syncHud();
      } else if (key === '1') {
        engine.selectWeapon('pulse');
        syncHud();
      } else if (key === '2') {
        engine.selectWeapon('scatter');
        syncHud();
      } else if (key === '3') {
        engine.selectWeapon('rail');
        syncHud();
      } else if (key === 'q') {
        engine.cycleWeapon();
        syncHud();
      } else if (key === 'e' || key === 'f') {
        engine.activateOverdrive();
        syncHud();
      } else if (key === 'p' || e.key === 'Escape') {
        e.preventDefault();
        engine.togglePause();
        syncHud();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 's' || key === 'shift') {
        inputRef.current.forcingCover = false;
      } else if (e.key === ' ') {
        inputRef.current.firing = false;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [view, syncHud]);

  const updatePointerAim = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    inputRef.current.aimX = Math.max(0.04, Math.min(0.96, (clientX - rect.left) / rect.width));
    inputRef.current.aimY = Math.max(0.06, Math.min(0.86, (clientY - rect.top) / rect.height));
  };

  const cycleQuality = () => {
    const order: readonly OmegaQualityPreset[] = ['high', 'balanced', 'low'];
    const idx = order.indexOf(quality);
    setQuality(order[(idx + 1) % order.length]!);
  };

  const clearedCount = countClearedOmegaSectors(saveDoc);
  const currentSector = OMEGA_SECTORS[hud.sectorIndex] ?? OMEGA_SECTORS[0]!;
  const nextSector = OMEGA_SECTORS[hud.sectorIndex + 1];

  if (view === 'hub') {
    return (
      <main
        className="omega-shell omega-hub"
        data-omega-screen="hub"
        onMouseMove={e => {
          if (reducedMotion) return;
          const nx = e.clientX / (window.innerWidth || 1) - 0.5;
          const ny = e.clientY / (window.innerHeight || 1) - 0.5;
          setHubTilt({ x: nx * -18, y: ny * -12 });
        }}
      >
        <div className="omega-hub-backdrop" aria-hidden="true">
          <img
            src="/assets/reignition/aira-silver-dawn.webp"
            alt=""
            style={{ transform: `scale(1.06) translate3d(${hubTilt.x}px, ${hubTilt.y}px, 0)` }}
          />
          {previewBackdrop ? (
            <img
              key={previewBackdrop}
              src={previewBackdrop}
              alt=""
              className="omega-hub-backdrop-preview"
              style={{ transform: `scale(1.08) translate3d(${hubTilt.x * 1.15}px, ${hubTilt.y * 1.15}px, 0)` }}
            />
          ) : null}
          <span className="omega-hub-shimmer" />
        </div>

        <header className="omega-hub-topbar">
          <div className="omega-hub-brand">
            <span className="omega-hub-badge">SPECIAL EDITION</span>
            <strong>OMEGA PROTOCOL · AIRA</strong>
          </div>
          <div className="omega-hub-tools">
            <button type="button" className="omega-pill-btn" onClick={cycleQuality}>
              {QUALITY_LABELS[quality]}
            </button>
            <button
              type="button"
              className="omega-pill-btn"
              aria-pressed={!props.audioMuted}
              onClick={props.onToggleAudio}
            >
              사운드 {props.audioMuted ? 'OFF' : 'ON'}
            </button>
            <button type="button" className="omega-pill-btn" onClick={props.onExit}>
              허브로 돌아가기
            </button>
          </div>
        </header>

        <section className="omega-hub-hero" aria-label="오메가 프로토콜 작전 브리핑">
          <div className="omega-hub-intro">
            <span className="omega-hub-kicker">1~4구역 연결 전장 · 시네마틱 엄폐 건액션</span>
            <h1>OMEGA PROTOCOL</h1>
            <p>
              폭우가 쏟아지는 1~4구역 산업 요새를 돌파하라. 6레이어 입체 원근 전장 위에서 엄폐물 사격,
              대시 퍼펙트 회피 슬로모션, 액티브 리로드 오버차지, 그리고 오메가 오버드라이브로 4대 보스를 제압하세요.
            </p>
            <div className="omega-hub-metrics">
              <div>
                <small>SECTOR CLEAR</small>
                <strong>{clearedCount} / 4</strong>
              </div>
              <div>
                <small>CAMPAIGN CLEARS</small>
                <strong>{saveDoc.campaignClears}</strong>
              </div>
              <div>
                <small>BEST CAMPAIGN</small>
                <strong>{saveDoc.bestCampaignScore.toLocaleString()}</strong>
              </div>
            </div>
            <div className="omega-hub-cta-row">
              <button
                type="button"
                className="omega-launch-btn"
                data-omega-launch="campaign"
                onClick={() => launchRun(0, false)}
              >
                1~4구역 연결 전장 투입 ↗
              </button>
            </div>
          </div>

          <aside
            className="omega-hub-aira-card"
            style={
              reducedMotion
                ? undefined
                : {
                    transform: `perspective(1100px) rotateY(${(-hubTilt.x * 0.25).toFixed(2)}deg) rotateX(${(hubTilt.y * 0.25).toFixed(2)}deg)`,
                  }
            }
          >
            <img src="/assets/omega/aira-v2/hero-splash.webp" alt="오메가 프로토콜 특임 오퍼레이터 AIRA" />
            <div className="omega-hub-aira-caption">
              <small>TACTICAL OPERATOR</small>
              <strong>AIRA (아이라)</strong>
              <span>펄스 피스톨 · 플라즈마 샷건 · 레일 랜스</span>
            </div>
          </aside>
        </section>

        <section aria-label="1~4구역 연결 전장 맵">
          <div className="omega-sector-section-head">
            <h2>1~4구역 연결 작전 구역</h2>
            <span>연결 전장 완료 또는 구역 클리어 시 개별 재도전 해금</span>
          </div>
          <div className="omega-sector-grid">
            {OMEGA_SECTORS.map(sec => {
              const prog = saveDoc.sectors[sec.id];
              const unlocked = sec.index <= saveDoc.unlockedSector;
              return (
                <article
                  key={sec.id}
                  className={`omega-sector-card ${unlocked ? '' : 'is-locked'}`}
                  data-omega-sector={sec.id}
                  onMouseEnter={() => setPreviewBackdrop(sec.backdropUri)}
                  onMouseLeave={() => setPreviewBackdrop(null)}
                  onFocus={() => setPreviewBackdrop(sec.backdropUri)}
                  onBlur={() => setPreviewBackdrop(null)}
                >
                  <div className="omega-sector-thumb">
                    <img src={sec.backdropUri} alt={sec.nameKo} loading="lazy" decoding="async" />
                    <span className="omega-sector-code">{sec.code}</span>
                    {prog.bestRank ? <span className="omega-sector-rank">RANK {prog.bestRank}</span> : null}
                  </div>
                  <div className="omega-sector-body">
                    <small>{sec.nameEn}</small>
                    <strong>{sec.nameKo}</strong>
                    <p>{sec.environmentHint}</p>
                    <p>보스: {sec.bossTitleKo} ({sec.bossTitleEn})</p>
                    <div className="omega-sector-action">
                      <small>{prog.bestScore > 0 ? `BEST ${prog.bestScore.toLocaleString()}` : unlocked ? '출격 가능' : '잠김'}</small>
                      <button
                        type="button"
                        className="omega-sector-play-btn"
                        disabled={!unlocked}
                        onClick={() => launchRun(sec.index - 1, true)}
                      >
                        {unlocked ? '단독 출격' : '이전 구역 클리어 필요'}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="omega-controls-strip" aria-label="전투 조작 안내">
          <div>
            <strong>조준 &amp; 엄폐 사격</strong>
            <span>마우스 조준 + 클릭(또는 Space) 시 엄폐 해제 사격 · 떼면 자동 엄폐</span>
          </div>
          <div>
            <strong>대시 &amp; 퍼펙트 회피</strong>
            <span>A / D 또는 ◀ / ▶ 키로 방벽 이동 · 락온 직전 회피 시 슬로모션 발동</span>
          </div>
          <div>
            <strong>액티브 리로드 &amp; 무장</strong>
            <span>R 키 재장전 중 황금 구간 재입력 시 오버차지 · 1 / 2 / 3 또는 우클릭 무기 교체</span>
          </div>
          <div>
            <strong>오메가 오버드라이브</strong>
            <span>게이지 100% 시 E / F 키 발동 · 시간 감속 + 관통 무한 탄창</span>
          </div>
        </section>
      </main>
    );
  }

  // LIVE COMBAT VIEW
  const activeWeaponCfg = OMEGA_WEAPONS[hud.weapon];
  const [sweetStart, sweetEnd] = activeWeaponCfg.activeReloadWindow;

  return (
    <main className="omega-shell omega-combat" data-omega-screen="combat">
      <canvas
        ref={canvasRef}
        className="omega-canvas"
        aria-label="오메가 프로토콜 3D 입체 전장 화면"
        onMouseMove={e => updatePointerAim(e.clientX, e.clientY)}
        onMouseDown={e => {
          audioRef.current?.unlock();
          if (e.button === 2) {
            engineRef.current?.cycleWeapon();
            syncHud();
            return;
          }
          if (e.button === 0) {
            updatePointerAim(e.clientX, e.clientY);
            inputRef.current.firing = true;
          }
        }}
        onMouseUp={e => {
          if (e.button === 0) inputRef.current.firing = false;
        }}
        onMouseLeave={() => {
          inputRef.current.firing = false;
        }}
        onContextMenu={e => e.preventDefault()}
        onTouchStart={e => {
          audioRef.current?.unlock();
          const touch = e.touches[0];
          if (touch) {
            updatePointerAim(touch.clientX, touch.clientY);
            inputRef.current.firing = true;
          }
        }}
        onTouchMove={e => {
          const touch = e.touches[0];
          if (touch) updatePointerAim(touch.clientX, touch.clientY);
        }}
        onTouchEnd={() => {
          inputRef.current.firing = false;
        }}
      />

      {/* TOP HUD */}
      <div className="omega-hud-top">
        <section className="omega-hud-card omega-hud-operator" aria-label="오퍼레이터 상태">
          <img src="/assets/omega/aira-v2/portrait.webp" alt="AIRA" />
          <div className="omega-hud-bars">
            <span className="omega-hud-sector">
              {currentSector.code} · {hud.waveLabel}
            </span>
            <div className="omega-bar-track" aria-label="체력">
              <div className="omega-bar-fill is-hp" style={{ width: `${Math.max(0, (hud.hp / hud.maxHp) * 100)}%` }} />
            </div>
            <div className="omega-bar-track" aria-label="실드">
              <div className="omega-bar-fill is-shield" style={{ width: `${Math.max(0, (hud.shield / hud.maxShield) * 100)}%` }} />
            </div>
            <div className="omega-bar-values">
              <span>HP {hud.hp}/{hud.maxHp}</span>
              <span>SHD {hud.shield}/{hud.maxShield}</span>
            </div>
          </div>
        </section>

        {hud.bossName ? (
          <section className="omega-hud-card omega-hud-boss" aria-label="보스 상태">
            <div className="omega-hud-boss-head">
              <strong>{hud.bossName}</strong>
              <small>PHASE {hud.bossPhase}</small>
            </div>
            <div className="omega-bar-track">
              <div className="omega-bar-fill is-boss" style={{ width: `${Math.max(0, (hud.bossHp / hud.bossMaxHp) * 100)}%` }} />
            </div>
          </section>
        ) : null}

        <section className="omega-hud-card omega-hud-score" aria-label="점수 및 제어">
          <div className="omega-score-readout">
            <span className="omega-parallax-tag">6-LAYER 3D PARALLAX · {quality.toUpperCase()}</span>
            <strong>{hud.score.toLocaleString()}</strong>
            <small>{hud.combo > 1 ? `${hud.combo} COMBO` : hud.slowMoActive ? 'SLOW-MO' : 'READY'}</small>
          </div>
          <button
            type="button"
            className="omega-pill-btn"
            aria-label="일시정지"
            onClick={() => {
              engineRef.current?.togglePause();
              syncHud();
            }}
          >
            일시정지
          </button>
        </section>
      </div>

      {/* NON-BLOCKING RADIO COMMS & BOSS WARNING */}
      {hud.commsText ? (
        <div className="omega-comms-toast" role="status" aria-live="polite">
          {hud.commsText}
        </div>
      ) : null}

      {hud.bossWarningText ? (
        <div className="omega-boss-banner" role="alert">
          <small>WARNING // SECTOR BOSS DETECTED</small>
          <strong>{hud.bossWarningText}</strong>
        </div>
      ) : null}

      {/* BOTTOM HUD */}
      <div className="omega-hud-bottom">
        <section className="omega-hud-card omega-weapon-dock" aria-label="무기 및 재장전">
          <div className="omega-weapon-pills">
            {OMEGA_WEAPON_ORDER.map((wId, idx) => {
              const cfg = OMEGA_WEAPONS[wId];
              const ammo = hud.mag[wId];
              return (
                <button
                  key={wId}
                  type="button"
                  className="omega-weapon-pill"
                  aria-pressed={hud.weapon === wId}
                  onClick={() => {
                    engineRef.current?.selectWeapon(wId);
                    syncHud();
                  }}
                >
                  <span>
                    [{idx + 1}] {cfg.nameKo}
                  </span>
                  <strong>
                    {ammo} / {cfg.magazineSize}
                    {hud.weapon === wId && hud.overchargedShots > 0 ? ' ★' : ''}
                  </strong>
                </button>
              );
            })}
          </div>
          {hud.reloadActive ? (
            <div className="omega-reload-bar" aria-label="액티브 리로드 게이지">
              <div
                className="omega-reload-sweet"
                style={{ left: `${sweetStart * 100}%`, width: `${(sweetEnd - sweetStart) * 100}%` }}
              />
              <div className="omega-reload-cursor" style={{ left: `${Math.min(98, hud.reloadProgress * 100)}%` }} />
            </div>
          ) : null}
        </section>

        <div className="omega-action-cluster">
          <button
            type="button"
            className="omega-touch-btn"
            aria-label="좌측 방벽으로 대시"
            onClick={() => {
              engineRef.current?.dash(-1);
              syncHud();
            }}
          >
            ◀ 대시
          </button>
          <button
            type="button"
            className="omega-touch-btn"
            aria-label="우측 방벽으로 대시"
            onClick={() => {
              engineRef.current?.dash(1);
              syncHud();
            }}
          >
            대시 ▶
          </button>
          <button
            type="button"
            className="omega-touch-btn"
            aria-label="재장전"
            onClick={() => {
              engineRef.current?.triggerReload();
              syncHud();
            }}
          >
            {hud.reloadActive ? '오버차지!' : '재장전 (R)'}
          </button>
          <button
            type="button"
            className={`omega-overdrive-btn ${hud.omegaGauge >= 100 ? 'is-ready' : ''}`}
            disabled={hud.omegaGauge < 100 && !hud.overdriveActive}
            onClick={() => {
              engineRef.current?.activateOverdrive();
              syncHud();
            }}
          >
            {hud.overdriveActive
              ? 'Ω OVERDRIVE 활성!'
              : hud.omegaGauge >= 100
                ? 'Ω OVERDRIVE 발동 (E)'
                : `Ω ${hud.omegaGauge}%`}
          </button>
        </div>
      </div>

      {/* OVERDRIVE CUT-IN */}
      {hud.overdriveCutIn ? (
        <div className="omega-cutin-overlay" aria-hidden="true">
          <img src="/assets/omega/aira-v2/hero-splash.webp" alt="" />
          <div className="omega-cutin-title">OMEGA OVERDRIVE</div>
        </div>
      ) : null}

      {/* SECTOR BREACH TRANSITION */}
      {hud.phase === 'transition' && nextSector ? (
        <div className="omega-breach-banner" role="status">
          <div>
            <small>SECTOR BREACH // ADVANCING</small>
            <strong>{nextSector.code} · {nextSector.nameKo} 진입 중</strong>
          </div>
        </div>
      ) : null}

      {/* BETWEEN-SECTOR UPGRADE DRAFT */}
      {hud.phase === 'upgrade' ? (
        <div className="omega-modal-backdrop" role="presentation">
          <section className="omega-modal-card" role="dialog" aria-modal="true" aria-labelledby="omega-upgrade-title">
            <span className="omega-hub-kicker">{currentSector.code} 돌파 완료 · 전술 모듈 강화</span>
            <h2 id="omega-upgrade-title">다음 구역 돌파 전 전술 강화를 선택하세요</h2>
            <div className="omega-upgrade-grid">
              {hud.upgradeChoices.map(upg => (
                <button
                  key={upg.id}
                  type="button"
                  className="omega-upgrade-card"
                  onClick={() => {
                    engineRef.current?.chooseUpgrade(upg.id);
                    syncHud();
                  }}
                >
                  <small>{upg.tag}</small>
                  <strong>{upg.nameKo}</strong>
                  <p>{upg.descriptionKo}</p>
                </button>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {/* PAUSE MODAL */}
      {hud.phase === 'paused' ? (
        <div className="omega-modal-backdrop" role="presentation">
          <section className="omega-modal-card" role="dialog" aria-modal="true" aria-labelledby="omega-pause-title">
            <h2 id="omega-pause-title">작전 일시정지</h2>
            <div className="omega-modal-actions">
              <button
                type="button"
                className="omega-launch-btn"
                onClick={() => {
                  engineRef.current?.togglePause();
                  syncHud();
                }}
              >
                전투 재개
              </button>
              <button
                type="button"
                className="omega-pill-btn"
                onClick={() => launchRun(hud.singleSectorMode ? hud.sectorIndex : 0, hud.singleSectorMode)}
              >
                처음부터 다시 시작
              </button>
              <button type="button" className="omega-pill-btn" onClick={cycleQuality}>
                {QUALITY_LABELS[quality]}
              </button>
              <button type="button" className="omega-pill-btn" onClick={props.onToggleAudio}>
                사운드 {props.audioMuted ? 'OFF' : 'ON'}
              </button>
              <button
                type="button"
                className="omega-pill-btn"
                onClick={() => {
                  inputRef.current.firing = false;
                  setView('hub');
                }}
              >
                작전 브리핑 허브로
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {/* VICTORY / DEFEAT DEBRIEF */}
      {hud.phase === 'victory' || hud.phase === 'defeat' ? (
        <div className="omega-modal-backdrop" role="presentation">
          <section className="omega-modal-card" role="dialog" aria-modal="true" aria-labelledby="omega-result-title">
            <span className="omega-hub-kicker">
              {hud.phase === 'victory' ? 'MISSION ACCOMPLISHED' : 'OPERATOR DOWN'}
            </span>
            <h2 id="omega-result-title">
              {hud.phase === 'victory'
                ? hud.singleSectorMode
                  ? `${currentSector.code} 제압 완료 — RANK ${hud.rank}`
                  : `1~4구역 오메가 프로토콜 완수 — RANK ${hud.rank}`
                : `${currentSector.code}에서 작전 중단`}
            </h2>
            <div className="omega-debrief-stats">
              <div>
                <small>최종 점수</small>
                <strong>{hud.score.toLocaleString()}</strong>
              </div>
              <div>
                <small>제압 적 / 약점 처치</small>
                <strong>{hud.kills} / {hud.weakpointKills}</strong>
              </div>
              <div>
                <small>최대 콤보</small>
                <strong>{hud.maxCombo}</strong>
              </div>
              <div>
                <small>퍼펙트 회피</small>
                <strong>{hud.perfectEvades}</strong>
              </div>
              <div>
                <small>카운터 브레이크</small>
                <strong>{hud.counterBreaks}</strong>
              </div>
              <div>
                <small>돌파 구역</small>
                <strong>{hud.clearedSectors.length} / {hud.singleSectorMode ? 1 : 4}</strong>
              </div>
            </div>
            <div className="omega-modal-actions">
              <button
                type="button"
                className="omega-launch-btn"
                onClick={() => launchRun(hud.singleSectorMode ? hud.sectorIndex : 0, hud.singleSectorMode)}
              >
                재출격
              </button>
              <button
                type="button"
                className="omega-pill-btn"
                onClick={() => {
                  inputRef.current.firing = false;
                  setView('hub');
                }}
              >
                오메가 작전 허브로
              </button>
              <button type="button" className="omega-pill-btn" onClick={props.onExit}>
                메인 타이틀로
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}

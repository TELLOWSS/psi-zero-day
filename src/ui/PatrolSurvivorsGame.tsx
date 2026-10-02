import { useCallback, useEffect, useRef, useState } from 'react';
import type { Perk, PerkId } from '../domain/patrol-survivors';
import {
  PERK_CATALOG,
  SurvivorsEngine,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from '../engine/patrol-survivors-engine';
import './patrol-survivors.css';

interface PatrolSurvivorsGameProps {
  onExit: () => void;
  audioMuted?: boolean;
}

interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

export function PatrolSurvivorsGame({ onExit, audioMuted = false }: PatrolSurvivorsGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<SurvivorsEngine | null>(null);
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const floatingIdRef = useRef(1);

  // Keyboard input state
  const keysRef = useRef<{ [key: string]: boolean }>({});

  // React UI Mirrors for HUD & Modals
  const [phase, setPhase] = useState<'ready' | 'playing' | 'paused' | 'levelup' | 'victory' | 'defeat'>('ready');
  const [level, setLevel] = useState(1);
  const [hp, setHp] = useState(100);
  const [maxHp, setMaxHp] = useState(100);
  const [exp, setExp] = useState(0);
  const [nextExp, setNextExp] = useState(10);
  const [gameTime, setGameTime] = useState(0);
  const [score, setScore] = useState(0);
  const [kills, setKills] = useState(0);
  const [perkOptions, setPerkOptions] = useState<Perk[]>([]);
  const [activePerks, setActivePerks] = useState<Record<PerkId, number>>({
    radio_boost: 1,
    extinguisher: 0,
    floodlight: 0,
    cone_trap: 0,
    safety_drone: 0,
    steel_boots: 0,
    magnet_beacon: 0,
    safety_harness: 0,
    quick_reflexes: 0,
  });

  // Simple procedural Web Audio SFX
  const playSfx = useCallback((type: 'shoot' | 'spray' | 'hit' | 'pickup' | 'levelup' | 'defeat' | 'win') => {
    if (audioMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      if (type === 'shoot') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.12);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'pickup') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'levelup') {
        const notes = [440, 554, 659, 880];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const t = now + idx * 0.07;
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.25, t);
          gain.gain.linearRampToValueAtTime(0.01, t + 0.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.2);
        });
      } else if (type === 'hit') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.linearRampToValueAtTime(40, now + 0.15);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
      }
    } catch {
      // AudioContext blocked or not supported
    }
  }, [audioMuted]);

  // Spawn floating number
  const spawnFloating = (x: number, y: number, text: string, color = '#fbbf24') => {
    floatingTextsRef.current.push({
      id: floatingIdRef.current++,
      x,
      y,
      text,
      color,
      life: 0.8,
      maxLife: 0.8,
    });
  };

  // Initialize Game Engine
  const initGame = useCallback(() => {
    const engine = new SurvivorsEngine();
    engineRef.current = engine;
    setPhase('ready');
    setLevel(1);
    setHp(100);
    setMaxHp(100);
    setExp(0);
    setNextExp(10);
    setGameTime(0);
    setScore(0);
    setKills(0);
    setActivePerks({ ...engine.state.activePerks });
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const startGame = () => {
    if (!engineRef.current) return;
    engineRef.current.start();
    setPhase('playing');
    lastTimeRef.current = performance.now();
  };

  // Perk Selection handler
  const handleSelectPerk = (perkId: PerkId) => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.applyPerk(perkId);
    playSfx('levelup');
    setActivePerks({ ...engine.state.activePerks });
    setPhase(engine.state.phase);
    lastTimeRef.current = performance.now();
  };

  // Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      if (e.code === 'Escape' || e.code === 'KeyP') {
        const engine = engineRef.current;
        if (engine && (engine.state.phase === 'playing' || engine.state.phase === 'paused')) {
          const next = engine.state.phase === 'playing' ? 'paused' : 'playing';
          engine.state.phase = next;
          setPhase(next);
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Main Render & Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let prevNeutralized = 0;
    let prevHp = 100;
    let prevLevel = 1;

    const renderLoop = (time: number) => {
      const dt = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      const engine = engineRef.current;
      if (!engine) return;

      // Handle Inputs
      let moveX = 0;
      let moveY = 0;
      if (keysRef.current['KeyW'] || keysRef.current['ArrowUp']) moveY -= 1;
      if (keysRef.current['KeyS'] || keysRef.current['ArrowDown']) moveY += 1;
      if (keysRef.current['KeyA'] || keysRef.current['ArrowLeft']) moveX -= 1;
      if (keysRef.current['KeyD'] || keysRef.current['ArrowRight']) moveX += 1;

      // Update engine physics if playing
      if (engine.state.phase === 'playing') {
        engine.update(dt, { moveX, moveY });

        // Check state changes
        if (engine.state.hazardsNeutralized > prevNeutralized) {
          prevNeutralized = engine.state.hazardsNeutralized;
          setKills(prevNeutralized);
          setScore(engine.state.score);
        }
        if (engine.state.player.hp < prevHp) {
          playSfx('hit');
          spawnFloating(engine.state.player.x, engine.state.player.y - 25, `-${Math.round(prevHp - engine.state.player.hp)}`, '#ef4444');
          prevHp = engine.state.player.hp;
        } else if (engine.state.player.hp > prevHp) {
          prevHp = engine.state.player.hp;
        }
        if (engine.state.level > prevLevel) {
          playSfx('levelup');
          prevLevel = engine.state.level;
        }

        // Sync React HUD
        setHp(Math.round(engine.state.player.hp));
        setMaxHp(engine.state.player.maxHp);
        setExp(engine.state.currentExp);
        setNextExp(engine.state.nextLevelExp);
        setLevel(engine.state.level);
        setGameTime(Math.floor(engine.state.gameTime));

        if (engine.state.phase !== 'playing') {
          setPhase(engine.state.phase);
          if (engine.state.phase === 'levelup') {
            setPerkOptions(engine.state.perkOptions);
          }
        }
      }

      // Resize canvas to full window
      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }

      const { width, height } = canvas;
      const { player, hazards, projectiles, drops, activePerks } = engine.state;

      // CAMERA FOLLOW (Center on player)
      const camX = player.x - width / 2;
      const camY = player.y - height / 2;

      ctx.save();
      // Clear background
      ctx.fillStyle = '#101418';
      ctx.fillRect(0, 0, width, height);

      // Translate view to camera
      ctx.translate(-camX, -camY);

      // 1. RENDER WORLD FLOOR & GRID
      const gridSize = 80;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= WORLD_WIDTH; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, WORLD_HEIGHT);
        ctx.stroke();
      }
      for (let y = 0; y <= WORLD_HEIGHT; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(WORLD_WIDTH, y);
        ctx.stroke();
      }

      // Construction Boundary Stripes
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 4;
      ctx.strokeRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

      // 2. RENDER FLOODLIGHT AURA (If perk active)
      if (activePerks.floodlight > 0) {
        const auraRadius = 90 + activePerks.floodlight * 22;
        const grad = ctx.createRadialGradient(player.x, player.y, 10, player.x, player.y, auraRadius);
        grad.addColorStop(0, 'rgba(251, 191, 36, 0.28)');
        grad.addColorStop(0.7, 'rgba(245, 158, 11, 0.12)');
        grad.addColorStop(1, 'rgba(245, 158, 11, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(player.x, player.y, auraRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(251, 191, 36, 0.35)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // 3. RENDER DROPS (PSI Safety Logs)
      for (const drop of drops) {
        if (drop.isHeal) {
          // Green Heal Medkit
          ctx.fillStyle = '#10b981';
          ctx.fillRect(drop.x - 7, drop.y - 7, 14, 14);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(drop.x - 5, drop.y - 1.5, 10, 3);
          ctx.fillRect(drop.x - 1.5, drop.y - 5, 3, 10);
        } else {
          // Cyan PSI Data Crystal
          ctx.save();
          ctx.translate(drop.x, drop.y);
          ctx.rotate((time / 1000) * 2);
          ctx.fillStyle = '#38bdf8';
          ctx.shadowColor = '#0284c7';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.moveTo(0, -7);
          ctx.lineTo(6, 0);
          ctx.lineTo(0, 7);
          ctx.lineTo(-6, 0);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      }

      // 4. RENDER PROJECTILES
      for (const p of projectiles) {
        if (p.kind === 'radio') {
          // Golden radio wave
          ctx.save();
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 3;
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        } else if (p.kind === 'extinguisher') {
          // White-blue powder smoke
          ctx.fillStyle = 'rgba(224, 242, 254, 0.7)';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.kind === 'drone_laser') {
          // Cyan laser
          ctx.fillStyle = '#06b6d4';
          ctx.shadowColor = '#22d3ee';
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.kind === 'cone_trap') {
          // Orange Traffic Cone
          ctx.fillStyle = '#ea580c';
          ctx.beginPath();
          ctx.moveTo(p.x, p.y - 14);
          ctx.lineTo(p.x + 10, p.y + 8);
          ctx.lineTo(p.x - 10, p.y + 8);
          ctx.closePath();
          ctx.fill();
          // White stripes on cone
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(p.x - 5, p.y - 3, 10, 4);
        }
      }

      // 5. RENDER HAZARDS (Enemies)
      for (const h of hazards) {
        ctx.save();
        ctx.translate(h.x, h.y);

        if (h.type === 'UNHELMETED') {
          // Unhelmeted walking worker (Grey jacket, warning alert)
          ctx.fillStyle = '#4b5563';
          ctx.beginPath();
          ctx.arc(0, 0, h.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Danger exclamation
          ctx.fillStyle = '#f87171';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('!', 0, 4);
        } else if (h.type === 'RUNAWAY_CART') {
          // Speeding trolley cart
          ctx.fillStyle = '#d97706';
          ctx.fillRect(-h.radius, -h.radius + 4, h.radius * 2, h.radius * 2 - 8);
          ctx.fillStyle = '#1f2937';
          ctx.beginPath();
          ctx.arc(-8, 10, 4, 0, Math.PI * 2);
          ctx.arc(8, 10, 4, 0, Math.PI * 2);
          ctx.fill();
        } else if (h.type === 'GAS_LEAK') {
          // Toxic green gas cloud
          ctx.fillStyle = 'rgba(34, 197, 94, 0.6)';
          ctx.beginPath();
          ctx.arc(0, 0, h.radius, 0, Math.PI * 2);
          ctx.fill();
        } else if (h.type === 'CRANE_BOSS') {
          // Large Industrial Machinery Boss
          ctx.fillStyle = '#b91c1c';
          ctx.beginPath();
          ctx.arc(0, 0, h.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#fca5a5';
          ctx.lineWidth = 3;
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 14px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('CRANE', 0, 5);
        }

        // Mini HP Bar above hazard
        const barW = h.radius * 2;
        const barH = 4;
        const hpPercent = Math.max(0, h.hp / h.maxHp);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(-barW / 2, -h.radius - 8, barW, barH);
        ctx.fillStyle = h.type === 'CRANE_BOSS' ? '#ef4444' : '#fbbf24';
        ctx.fillRect(-barW / 2, -h.radius - 8, barW * hpPercent, barH);

        ctx.restore();
      }

      // 6. RENDER PLAYER (Safety Officer)
      ctx.save();
      ctx.translate(player.x, player.y);

      // Invincible flash
      if (player.invincibleTime > 0 && Math.floor(time / 80) % 2 === 0) {
        ctx.globalAlpha = 0.5;
      }

      // Body (Safety fluorescent vest)
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();

      // Reflective vest stripe
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-8, -4, 16, 8);

      // Hard hat (White Safety Helmet)
      ctx.fillStyle = '#f9fafb';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(0, -3, 11, 0, Math.PI * 2);
      ctx.fill();

      // NEW PSI Cross symbol on helmet
      ctx.fillStyle = '#10b981';
      ctx.fillRect(-4, -4, 8, 2);
      ctx.fillRect(-1, -7, 2, 8);

      ctx.restore();

      // 7. RENDER DRONE (If active)
      if (activePerks.safety_drone > 0 && engine.state.droneAngle !== undefined) {
        const droneDist = 65;
        const dX = player.x + Math.cos(engine.state.droneAngle) * droneDist;
        const dY = player.y + Math.sin(engine.state.droneAngle) * droneDist;

        ctx.save();
        ctx.translate(dX, dY);
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Pulsing green beacon
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 8. RENDER FLOATING TEXTS
      const aliveTexts: FloatingText[] = [];
      for (const ft of floatingTextsRef.current) {
        ft.life -= dt;
        ft.y -= 35 * dt;
        if (ft.life > 0) {
          ctx.save();
          ctx.font = 'bold 15px sans-serif';
          ctx.fillStyle = ft.color;
          ctx.shadowColor = '#000000';
          ctx.shadowBlur = 4;
          ctx.textAlign = 'center';
          ctx.globalAlpha = ft.life / ft.maxLife;
          ctx.fillText(ft.text, ft.x, ft.y);
          ctx.restore();
          aliveTexts.push(ft);
        }
      }
      floatingTextsRef.current = aliveTexts;

      ctx.restore(); // Restore camera translation

      requestRef.current = requestAnimationFrame(renderLoop);
    };

    requestRef.current = requestAnimationFrame(renderLoop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [playSfx]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="survivors-container">
      {/* EXP PROGRESS BAR */}
      <div className="survivors-exp-bar-wrap">
        <div
          className="survivors-exp-bar"
          style={{ width: `${Math.min(100, (exp / nextExp) * 100)}%` }}
        />
      </div>

      {/* TOP CENTER HUD */}
      <div className="survivors-hud-top">
        <div className="survivors-timer">
          <strong>{formatTime(gameTime)}</strong>
          <small>/ 03:00</small>
        </div>
        <div className="survivors-score-badge">
          <span>SAFE SCORE</span>
          <strong>{score.toLocaleString()}</strong>
        </div>
        <div className="survivors-kills-badge">
          <span>🛡️</span>
          <b>{kills} 제압</b>
        </div>
      </div>

      {/* TOP LEFT PLAYER STATUS */}
      <div className="survivors-player-hud">
        <div className="survivors-hp-container">
          <span className="survivors-level-tag">LV {level}</span>
          <div className="survivors-hp-bar-bg">
            <div
              className="survivors-hp-bar-fill"
              style={{ width: `${Math.max(0, (hp / maxHp) * 100)}%` }}
            />
          </div>
          <span className="survivors-hp-text">{hp} / {maxHp}</span>
        </div>

        {/* ACTIVE PERKS BAR */}
        <div className="survivors-perks-list">
          {(Object.entries(activePerks) as [PerkId, number][])
            .filter(([, lvl]) => lvl > 0)
            .map(([id, lvl]) => (
              <div key={id} className="survivors-perk-badge" title={`${PERK_CATALOG[id].name} (Lv.${lvl})`}>
                <span>{PERK_CATALOG[id].icon}</span>
                <small>{lvl}</small>
              </div>
            ))}
        </div>
      </div>

      {/* TOP RIGHT ACTIONS */}
      <div className="survivors-top-actions">
        <button
          type="button"
          className="survivors-btn-icon"
          onClick={() => {
            const engine = engineRef.current;
            if (engine && (phase === 'playing' || phase === 'paused')) {
              const next = phase === 'playing' ? 'paused' : 'playing';
              engine.state.phase = next;
              setPhase(next);
            }
          }}
        >
          {phase === 'paused' ? '재개 (P)' : '일시정지 (P)'}
        </button>
        <button type="button" className="survivors-btn-icon" onClick={onExit}>
          현장 복귀
        </button>
      </div>

      {/* MAIN GAME CANVAS */}
      <canvas ref={canvasRef} className="survivors-canvas" />

      {/* READY / START MODAL */}
      {phase === 'ready' && (
        <div className="survivors-modal-backdrop">
          <div className="survivors-modal-content">
            <h2 className="survivors-modal-title is-gold">PSI: 야간 긴급 순찰 (SURVIVORS)</h2>
            <p className="survivors-modal-sub">
              야간 타설 공사 중 쏟아지는 현장 위험 요소들을 직접 누비며 제압하고 3분간 무사고를 달성하세요!
            </p>

            <div className="survivors-controls-guide">
              <div><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> 또는 <kbd>방향키</kbd> : 안전관리자 현장 이동</div>
              <div>📢 <strong>자동 요격</strong>: 접근하는 위험에 무전 경고 및 소화기 자동 발사</div>
              <div>💎 <strong>안전 기록(PSI 큐브)</strong>: 위험 제압 후 떨어지는 데이터를 모아 레벨업 & 안전 도구 강화</div>
              <div><kbd>P</kbd> / <kbd>ESC</kbd> : 게임 일시정지</div>
            </div>

            <div className="survivors-actions-row">
              <button type="button" className="survivors-btn-primary" onClick={startGame}>
                순찰 시작하기
              </button>
              <button type="button" className="survivors-btn-secondary" onClick={onExit}>
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LEVEL UP MODAL (3-Choice Perk Selection) */}
      {phase === 'levelup' && (
        <div className="survivors-modal-backdrop">
          <div className="survivors-modal-content">
            <h2 className="survivors-modal-title is-gold">⚡ 안전 장비 & 역량 강화</h2>
            <p className="survivors-modal-sub">
              현장 안전 데이터 확보! 보급받을 안전 장비 또는 훈련을 선택하세요.
            </p>

            <div className="survivors-perk-cards">
              {perkOptions.map(perk => (
                <div
                  key={perk.id}
                  className="survivors-perk-card"
                  onClick={() => handleSelectPerk(perk.id)}
                >
                  <div className="survivors-perk-card-icon">{perk.icon}</div>
                  <div className="survivors-perk-card-info">
                    <h4>
                      {perk.name}
                      <span>LV {perk.level}</span>
                    </h4>
                    <p>{perk.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PAUSE MODAL */}
      {phase === 'paused' && (
        <div className="survivors-modal-backdrop">
          <div className="survivors-modal-content">
            <h2 className="survivors-modal-title">일시 정지</h2>
            <p className="survivors-modal-sub">현장 순찰이 일시 중단되었습니다.</p>
            <div className="survivors-actions-row">
              <button
                type="button"
                className="survivors-btn-primary"
                onClick={() => {
                  if (engineRef.current) {
                    engineRef.current.state.phase = 'playing';
                    setPhase('playing');
                    lastTimeRef.current = performance.now();
                  }
                }}
              >
                순찰 재개
              </button>
              <button type="button" className="survivors-btn-secondary" onClick={onExit}>
                메인으로 나가기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DEFEAT MODAL */}
      {phase === 'defeat' && (
        <div className="survivors-modal-backdrop">
          <div className="survivors-modal-content">
            <h2 className="survivors-modal-title is-red">🚨 현장 중대위험 발생</h2>
            <p className="survivors-modal-sub">
              안전관리자의 방호 한계 초과로 현장에 사고가 발생했습니다.
            </p>

            <div className="survivors-results-grid">
              <div className="survivors-stat-box">
                <span>순찰 생존 시간</span>
                <strong>{formatTime(gameTime)}</strong>
              </div>
              <div className="survivors-stat-box">
                <span>안전 기록 점수</span>
                <strong>{score.toLocaleString()}</strong>
              </div>
              <div className="survivors-stat-box">
                <span>차단한 위험 건수</span>
                <strong>{kills}건</strong>
              </div>
              <div className="survivors-stat-box">
                <span>도달 안전 등급</span>
                <strong>LV {level}</strong>
              </div>
            </div>

            <div className="survivors-actions-row">
              <button
                type="button"
                className="survivors-btn-primary"
                onClick={() => {
                  initGame();
                  setTimeout(() => startGame(), 50);
                }}
              >
                다시 순찰하기
              </button>
              <button type="button" className="survivors-btn-secondary" onClick={onExit}>
                현장 복귀
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VICTORY MODAL */}
      {phase === 'victory' && (
        <div className="survivors-modal-backdrop">
          <div className="survivors-modal-content">
            <h2 className="survivors-modal-title is-green">🏆 야간 무사고 달성 완료!</h2>
            <p className="survivors-modal-sub">
              3분간의 극한 야간 타설 현장을 단 한 건의 사고 없이 안전하게 사수했습니다!
            </p>

            <div className="survivors-results-grid">
              <div className="survivors-stat-box">
                <span>최종 안전 등급</span>
                <strong style={{ color: '#10b981' }}>ZERO DAY S급</strong>
              </div>
              <div className="survivors-stat-box">
                <span>최종 안전 점수</span>
                <strong>{score.toLocaleString()}</strong>
              </div>
              <div className="survivors-stat-box">
                <span>총 차단 위험</span>
                <strong>{kills}건</strong>
              </div>
              <div className="survivors-stat-box">
                <span>최종 장비 레벨</span>
                <strong>LV {level}</strong>
              </div>
            </div>

            <div className="survivors-actions-row">
              <button
                type="button"
                className="survivors-btn-primary"
                onClick={() => {
                  initGame();
                  setTimeout(() => startGame(), 50);
                }}
              >
                재도전
              </button>
              <button type="button" className="survivors-btn-secondary" onClick={onExit}>
                현장 복귀
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export function PatrolSurvivorsGame({ onExit, audioMuted = false }: PatrolSurvivorsGameProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<SurvivorsEngine | null>(null);
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const floatingIdRef = useRef(1);
  const particlesRef = useRef<Particle[]>([]);

  // Keyboard input state
  const keysRef = useRef<{ [key: string]: boolean }>({});

  // Screen shake
  const screenShakeRef = useRef<number>(0);

  // Virtual Touch Joystick state
  const touchIdRef = useRef<number | null>(null);
  const touchCenterRef = useRef<{ x: number; y: number } | null>(null);
  const touchVectorRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [joystickVisual, setJoystickVisual] = useState<{
    visible: boolean;
    baseX: number;
    baseY: number;
    knobX: number;
    knobY: number;
  }>({
    visible: false,
    baseX: 0,
    baseY: 0,
    knobX: 0,
    knobY: 0,
  });

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

  // Spawn impact / dust particles
  const spawnParticles = (x: number, y: number, color: string, count = 8, speed = 60) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = (0.3 + Math.random() * 0.7) * speed;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        color,
        size: 2 + Math.random() * 3,
        life: 0.4 + Math.random() * 0.3,
        maxLife: 0.7,
      });
    }
  };

  // Initialize Game Engine
  const initGame = useCallback(() => {
    const engine = new SurvivorsEngine();
    engineRef.current = engine;
    touchVectorRef.current = { x: 0, y: 0 };
    touchIdRef.current = null;
    touchCenterRef.current = null;
    setJoystickVisual({ visible: false, baseX: 0, baseY: 0, knobX: 0, knobY: 0 });
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

  // Touch Event Handlers for Mobile Virtual Joystick
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (phase !== 'playing') return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('.survivors-modal-content')) return;

    if (touchIdRef.current === null && e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      if (!touch) return;
      touchIdRef.current = touch.identifier;
      const x = touch.clientX;
      const y = touch.clientY;
      touchCenterRef.current = { x, y };
      touchVectorRef.current = { x: 0, y: 0 };
      setJoystickVisual({
        visible: true,
        baseX: x,
        baseY: y,
        knobX: x,
        knobY: y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchIdRef.current === null || !touchCenterRef.current) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch && touch.identifier === touchIdRef.current) {
        const dx = touch.clientX - touchCenterRef.current.x;
        const dy = touch.clientY - touchCenterRef.current.y;
        const dist = Math.hypot(dx, dy);
        const maxRadius = 55;
        const deadzone = 6;

        let knobX = touch.clientX;
        let knobY = touch.clientY;
        if (dist > maxRadius) {
          const angle = Math.atan2(dy, dx);
          knobX = touchCenterRef.current.x + Math.cos(angle) * maxRadius;
          knobY = touchCenterRef.current.y + Math.sin(angle) * maxRadius;
        }

        setJoystickVisual(prev => ({
          ...prev,
          knobX,
          knobY,
        }));

        if (dist > deadzone) {
          const angle = Math.atan2(dy, dx);
          const factor = Math.min(1, (dist - deadzone) / (maxRadius - deadzone));
          touchVectorRef.current = {
            x: Math.cos(angle) * factor,
            y: Math.sin(angle) * factor,
          };
        } else {
          touchVectorRef.current = { x: 0, y: 0 };
        }
        break;
      }
    }
  };

  const handleTouchEndOrCancel = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch && touch.identifier === touchIdRef.current) {
        touchIdRef.current = null;
        touchCenterRef.current = null;
        touchVectorRef.current = { x: 0, y: 0 };
        setJoystickVisual(prev => ({ ...prev, visible: false }));
        break;
      }
    }
  };

  // Main Render & Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let prevNeutralized = 0;
    let prevHp = 100;
    let prevLevel = 1;
    let facingAngle = 0;

    const renderLoop = (time: number) => {
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = time;

      const engine = engineRef.current;
      if (!engine) return;

      // Merge Inputs (Touch Virtual Joystick + Keyboard WASD)
      let moveX = touchVectorRef.current.x;
      let moveY = touchVectorRef.current.y;
      if (keysRef.current['KeyW'] || keysRef.current['ArrowUp']) moveY -= 1;
      if (keysRef.current['KeyS'] || keysRef.current['ArrowDown']) moveY += 1;
      if (keysRef.current['KeyA'] || keysRef.current['ArrowLeft']) moveX -= 1;
      if (keysRef.current['KeyD'] || keysRef.current['ArrowRight']) moveX += 1;

      const inputMag = Math.hypot(moveX, moveY);
      if (inputMag > 1) {
        moveX /= inputMag;
        moveY /= inputMag;
      }
      if (inputMag > 0.05) {
        facingAngle = Math.atan2(moveY, moveX);
      }

      // Update engine physics if playing
      if (engine.state.phase === 'playing') {
        engine.update(dt, { moveX, moveY });

        // Check state changes
        if (engine.state.hazardsNeutralized > prevNeutralized) {
          const diff = engine.state.hazardsNeutralized - prevNeutralized;
          prevNeutralized = engine.state.hazardsNeutralized;
          setKills(prevNeutralized);
          setScore(engine.state.score);
          spawnParticles(engine.state.player.x, engine.state.player.y, '#38bdf8', diff * 5, 80);
        }
        if (engine.state.player.hp < prevHp) {
          playSfx('hit');
          screenShakeRef.current = 10;
          spawnFloating(engine.state.player.x, engine.state.player.y - 25, `-${Math.round(prevHp - engine.state.player.hp)}`, '#ef4444');
          spawnParticles(engine.state.player.x, engine.state.player.y, '#ef4444', 12, 110);
          prevHp = engine.state.player.hp;
        } else if (engine.state.player.hp > prevHp) {
          prevHp = engine.state.player.hp;
        }
        if (engine.state.level > prevLevel) {
          playSfx('levelup');
          spawnParticles(engine.state.player.x, engine.state.player.y, '#fbbf24', 20, 140);
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

      // High-DPI Resolution & Mobile Resize
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const displayW = window.innerWidth;
      const displayH = window.innerHeight;
      const targetCanvasW = Math.floor(displayW * dpr);
      const targetCanvasH = Math.floor(displayH * dpr);

      if (canvas.width !== targetCanvasW || canvas.height !== targetCanvasH) {
        canvas.width = targetCanvasW;
        canvas.height = targetCanvasH;
      }

      const { player, hazards, projectiles, drops, activePerks } = engine.state;

      // Decay screen shake
      let shakeX = 0;
      let shakeY = 0;
      if (screenShakeRef.current > 0) {
        shakeX = (Math.random() - 0.5) * screenShakeRef.current;
        shakeY = (Math.random() - 0.5) * screenShakeRef.current;
        screenShakeRef.current = Math.max(0, screenShakeRef.current - dt * 25);
      }

      // Responsive Portrait / Landscape Zoom Factor
      const isPortrait = displayH > displayW;
      const baseZoom = isPortrait ? Math.max(0.72, Math.min(1.0, displayW / 560)) : 1.0;
      const viewW = displayW / baseZoom;
      const viewH = displayH / baseZoom;

      // CAMERA FOLLOW (Center on player)
      const camX = player.x - viewW / 2 + shakeX;
      const camY = player.y - viewH / 2 + shakeY;

      ctx.save();
      ctx.scale(dpr * baseZoom, dpr * baseZoom);

      // Clear background (Industrial Night Concrete floor)
      ctx.fillStyle = '#0a0e13';
      ctx.fillRect(0, 0, viewW, viewH);

      // Translate view to camera
      ctx.translate(-camX, -camY);

      // 1. RENDER WORLD FLOOR & GRID
      const gridSize = 70;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
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

      // Construction Boundary Stripes (Yellow/Black Hazard Edge)
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 5;
      ctx.strokeRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

      // Warning chevron marks at corners
      ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
      ctx.fillRect(0, 0, WORLD_WIDTH, 12);
      ctx.fillRect(0, WORLD_HEIGHT - 12, WORLD_WIDTH, 12);
      ctx.fillRect(0, 0, 12, WORLD_HEIGHT);
      ctx.fillRect(WORLD_WIDTH - 12, 0, 12, WORLD_HEIGHT);

      // 2. DIRECTIONAL FLASHLIGHT BEAM (Headlamp Cone)
      ctx.save();
      const beamDist = 260;
      const beamHalfAngle = Math.PI / 4.8;
      const beamGrad = ctx.createRadialGradient(player.x, player.y, 10, player.x, player.y, beamDist);
      beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.32)');
      beamGrad.addColorStop(0.5, 'rgba(253, 224, 71, 0.12)');
      beamGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');

      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(player.x, player.y);
      ctx.arc(player.x, player.y, beamDist, facingAngle - beamHalfAngle, facingAngle + beamHalfAngle);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // 3. FLOODLIGHT AURA (If perk active)
      if (activePerks.floodlight > 0) {
        const auraRadius = 90 + activePerks.floodlight * 24;
        const grad = ctx.createRadialGradient(player.x, player.y, 10, player.x, player.y, auraRadius);
        grad.addColorStop(0, 'rgba(251, 191, 36, 0.32)');
        grad.addColorStop(0.7, 'rgba(245, 158, 11, 0.14)');
        grad.addColorStop(1, 'rgba(245, 158, 11, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(player.x, player.y, auraRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)';
        ctx.setLineDash([6, 6]);
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 4. RENDER DROPS (PSI Safety Logs / Crystals)
      for (const drop of drops) {
        if (drop.isHeal) {
          // Green Heal Medkit with glow
          ctx.save();
          ctx.shadowColor = '#10b981';
          ctx.shadowBlur = 10;
          ctx.fillStyle = '#10b981';
          ctx.fillRect(drop.x - 8, drop.y - 8, 16, 16);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(drop.x - 6, drop.y - 2, 12, 4);
          ctx.fillRect(drop.x - 2, drop.y - 6, 4, 12);
          ctx.restore();
        } else {
          // Cyan PSI Data Crystal with pulsing glow
          ctx.save();
          ctx.translate(drop.x, drop.y);
          const spin = (time / 1000) * 3;
          ctx.rotate(spin);
          ctx.fillStyle = '#38bdf8';
          ctx.shadowColor = '#0ea5e9';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.moveTo(0, -9);
          ctx.lineTo(7, 0);
          ctx.lineTo(0, 9);
          ctx.lineTo(-7, 0);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // 5. RENDER PROJECTILES
      for (const p of projectiles) {
        if (p.kind === 'radio') {
          // Golden radio wave ring
          ctx.save();
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 3.5;
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 14;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        } else if (p.kind === 'extinguisher') {
          // White-cyan extinguisher mist
          ctx.save();
          ctx.fillStyle = 'rgba(224, 242, 254, 0.75)';
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else if (p.kind === 'drone_laser') {
          // Cyan high-tech laser beam
          ctx.save();
          ctx.fillStyle = '#06b6d4';
          ctx.shadowColor = '#22d3ee';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else if (p.kind === 'cone_trap') {
          // Industrial Traffic Cone
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.fillStyle = '#ea580c';
          ctx.shadowColor = '#c2410c';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.moveTo(0, -15);
          ctx.lineTo(11, 9);
          ctx.lineTo(-11, 9);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-6, -3, 12, 4);
          ctx.restore();
        }
      }

      // 6. RENDER HAZARDS (High-Impact Modern Visuals)
      for (const h of hazards) {
        ctx.save();
        ctx.translate(h.x, h.y);

        if (h.type === 'UNHELMETED') {
          // Worker without hard hat: Dark uniform + warning outline
          ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
          ctx.beginPath();
          ctx.arc(0, 0, h.radius + 6, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#374151';
          ctx.beginPath();
          ctx.arc(0, 0, h.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // Black hair (unhelmeted)
          ctx.fillStyle = '#111827';
          ctx.beginPath();
          ctx.arc(0, -2, h.radius * 0.55, 0, Math.PI * 2);
          ctx.fill();

          // Warning badge above
          ctx.fillStyle = '#ef4444';
          ctx.font = '900 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('⚠', 0, -h.radius - 12);
        } else if (h.type === 'RUNAWAY_CART') {
          // Speeding industrial trolley cart with hazard stripes
          ctx.fillStyle = '#b45309';
          ctx.fillRect(-h.radius, -h.radius + 4, h.radius * 2, h.radius * 2 - 8);

          // Diagonal hazard warning stripes
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-h.radius + 4, -h.radius + 6);
          ctx.lineTo(-h.radius + 12, h.radius - 6);
          ctx.moveTo(-h.radius + 14, -h.radius + 6);
          ctx.lineTo(-h.radius + 22, h.radius - 6);
          ctx.stroke();

          // Industrial Wheels
          ctx.fillStyle = '#111827';
          ctx.beginPath();
          ctx.arc(-9, 11, 4.5, 0, Math.PI * 2);
          ctx.arc(9, 11, 4.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (h.type === 'GAS_LEAK') {
          // Swirling toxic gas cloud
          const pulse = Math.sin(time / 200) * 3;
          const gasGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, h.radius + pulse);
          gasGrad.addColorStop(0, 'rgba(34, 197, 94, 0.85)');
          gasGrad.addColorStop(0.6, 'rgba(16, 185, 129, 0.45)');
          gasGrad.addColorStop(1, 'rgba(5, 150, 105, 0)');
          ctx.fillStyle = gasGrad;
          ctx.beginPath();
          ctx.arc(0, 0, h.radius + pulse, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#dcfce7';
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('GAS', 0, 3);
        } else if (h.type === 'CRANE_BOSS') {
          // Heavy industrial crane gantry & hook boss
          ctx.shadowColor = '#dc2626';
          ctx.shadowBlur = 18;
          ctx.fillStyle = '#991b1b';
          ctx.beginPath();
          ctx.arc(0, 0, h.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#f87171';
          ctx.lineWidth = 4;
          ctx.stroke();

          // Rotating warning beacon on boss
          const beaconAngle = (time / 150) % (Math.PI * 2);
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(Math.cos(beaconAngle) * (h.radius - 8), Math.sin(beaconAngle) * (h.radius - 8), 5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = '900 13px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('CRANE', 0, 5);
        }

        // Mini HP Bar above hazard
        const barW = Math.max(24, h.radius * 2);
        const barH = 5;
        const hpPercent = Math.max(0, h.hp / h.maxHp);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(-barW / 2, -h.radius - 8, barW, barH);
        ctx.fillStyle = h.type === 'CRANE_BOSS' ? '#ef4444' : '#f59e0b';
        ctx.fillRect(-barW / 2, -h.radius - 8, barW * hpPercent, barH);

        ctx.restore();
      }

      // 7. RENDER PLAYER (High-Vis Safety Officer)
      ctx.save();
      ctx.translate(player.x, player.y);

      // Invincible flash
      if (player.invincibleTime > 0 && Math.floor(time / 80) % 2 === 0) {
        ctx.globalAlpha = 0.45;
      }

      // Drop shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.beginPath();
      ctx.ellipse(0, 10, 16, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Body (Navy Field Work Uniform)
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(0, 0, 17, 0, Math.PI * 2);
      ctx.fill();

      // Hi-Vis Fluorescent Lime Safety Vest
      ctx.fillStyle = '#84cc16';
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();

      // Retroreflective Silver Stripes
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(-7, -4, 14, 8);

      // Hard Hat (White Construction Safety Helmet with visor)
      ctx.fillStyle = '#f8fafc';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(0, -3, 11, 0, Math.PI * 2);
      ctx.fill();

      // NEW PSI Green Cross Symbol on helmet
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(-4, -4, 8, 2.5);
      ctx.fillRect(-1.25, -7, 2.5, 8);

      ctx.restore();

      // 8. RENDER SAFETY DRONE (If active)
      if (activePerks.safety_drone > 0 && engine.state.droneAngle !== undefined) {
        const droneDist = 65;
        const dX = player.x + Math.cos(engine.state.droneAngle) * droneDist;
        const dY = player.y + Math.sin(engine.state.droneAngle) * droneDist;

        ctx.save();
        ctx.translate(dX, dY);

        // Drone body
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // 4 Rotor arms & spinning blades
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
          const a = (i * Math.PI) / 2 + (time / 80);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(a) * 11, Math.sin(a) * 11);
          ctx.stroke();
        }

        // Green scanning sensor LED
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // 9. RENDER PARTICLES
      const aliveParticles: Particle[] = [];
      for (const p of particlesRef.current) {
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.life > 0) {
          ctx.save();
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.life / p.maxLife;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          aliveParticles.push(p);
        }
      }
      particlesRef.current = aliveParticles;

      // 10. RENDER FLOATING TEXTS
      const aliveTexts: FloatingText[] = [];
      for (const ft of floatingTextsRef.current) {
        ft.life -= dt;
        ft.y -= 38 * dt;
        if (ft.life > 0) {
          ctx.save();
          ctx.font = '900 16px sans-serif';
          ctx.fillStyle = ft.color;
          ctx.shadowColor = '#000000';
          ctx.shadowBlur = 5;
          ctx.textAlign = 'center';
          ctx.globalAlpha = ft.life / ft.maxLife;
          ctx.fillText(ft.text, ft.x, ft.y);
          ctx.restore();
          aliveTexts.push(ft);
        }
      }
      floatingTextsRef.current = aliveTexts;

      ctx.restore(); // Restore camera translation & scaling

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
    <div
      ref={containerRef}
      className="survivors-container"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEndOrCancel}
      onTouchCancel={handleTouchEndOrCancel}
    >
      {/* EXP PROGRESS BAR */}
      <div className="survivors-exp-bar-wrap">
        <div
          className="survivors-exp-bar"
          style={{ width: `${Math.min(100, (exp / nextExp) * 100)}%` }}
        />
      </div>

      {/* TOP COMPACT HUD */}
      <header className="survivors-hud-top" role="toolbar" aria-label="순찰 상황판">
        {/* PLAYER STATUS & HP */}
        <div className="survivors-player-hud">
          <div className="survivors-hp-container">
            <span className="survivors-level-tag">LV {level}</span>
            <div className="survivors-hp-bar-bg">
              <div
                className="survivors-hp-bar-fill"
                style={{ width: `${Math.max(0, (hp / maxHp) * 100)}%` }}
              />
            </div>
            <span className="survivors-hp-text">{hp}/{maxHp}</span>
          </div>
        </div>

        {/* TIMER & SCORE */}
        <div className="survivors-hud-center">
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

        {/* TOP ACTIONS */}
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
      </header>

      {/* ACTIVE PERKS TRAY */}
      <div className="survivors-perks-tray">
        {(Object.entries(activePerks) as [PerkId, number][])
          .filter(([, lvl]) => lvl > 0)
          .map(([id, lvl]) => (
            <div key={id} className="survivors-perk-badge" title={`${PERK_CATALOG[id].name} (Lv.${lvl})`}>
              <span>{PERK_CATALOG[id].icon}</span>
              <small>{lvl}</small>
            </div>
          ))}
      </div>

      {/* MAIN GAME CANVAS */}
      <canvas ref={canvasRef} className="survivors-canvas" />

      {/* MOBILE VIRTUAL JOYSTICK (VISIBLE ON TOUCH) */}
      {joystickVisual.visible && (
        <div
          className="survivors-touch-joystick"
          style={{
            left: `${joystickVisual.baseX - 60}px`,
            top: `${joystickVisual.baseY - 60}px`,
            display: 'block',
          }}
          aria-hidden="true"
        >
          <div
            className="survivors-touch-knob"
            style={{
              left: `${joystickVisual.knobX - joystickVisual.baseX + 60}px`,
              top: `${joystickVisual.knobY - joystickVisual.baseY + 60}px`,
            }}
          />
        </div>
      )}

      {/* MOBILE TOUCH HINT (BOTTOM CORNER) */}
      {phase === 'playing' && !joystickVisual.visible && (
        <div className="survivors-mobile-touch-hint" aria-hidden="true">
          <span>🕹️ 화면을 터치해 이동</span>
        </div>
      )}

      {/* READY / START MODAL */}
      {phase === 'ready' && (
        <div className="survivors-modal-backdrop">
          <div className="survivors-modal-content">
            <h2 className="survivors-modal-title is-gold">PSI: 야간 긴급 순찰 (SURVIVORS)</h2>
            <p className="survivors-modal-sub">
              야간 타설 공사 중 쏟아지는 현장 위험 요소들을 직접 누비며 제압하고 3분간 무사고를 달성하세요!
            </p>

            <div className="survivors-controls-guide">
              <div><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> / <kbd>방향키</kbd> 또는 <strong>화면 터치 드래그</strong> : 안전관리자 이동</div>
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

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  CharacterId,
  Perk,
  PerkId,
  PermanentUpgrades,
  PatrolStageId,
} from '../domain/patrol-survivors';
import {
  CHARACTER_PROFILES,
  DEFAULT_PERMANENT_UPGRADES,
  EVOLUTION_RECIPES,
  PATROL_STAGES,
  PERK_CATALOG,
  SurvivorsEngine,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  createInitialSurvivorsState,
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

const STORAGE_KEY_UPGRADES = 'psi.survivors.rd_upgrades';
const STORAGE_KEY_CREDITS = 'psi.survivors.credits';

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

  // Meta Progression (Stored in LocalStorage)
  const [selectedChar, setSelectedChar] = useState<CharacterId>('yoon');
  const [selectedStage, setSelectedStage] = useState<PatrolStageId>('stage_01');
  const [permanentUpgrades, setPermanentUpgrades] = useState<PermanentUpgrades>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_UPGRADES);
      return saved ? JSON.parse(saved) : DEFAULT_PERMANENT_UPGRADES;
    } catch {
      return DEFAULT_PERMANENT_UPGRADES;
    }
  });
  const [psiCredits, setPsiCredits] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CREDITS);
      return saved ? Number(saved) : 0;
    } catch {
      return 0;
    }
  });

  // Modal Views in Ready screen
  const [showRdModal, setShowRdModal] = useState(false);
  const [showArsenalModal, setShowArsenalModal] = useState(false);

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
  const [rerollsLeft, setRerollsLeft] = useState(0);
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
    data_chip: 0,
    satellite_broadcast: 0,
    cryo_blizzard: 0,
    tesla_dome: 0,
    emf_barricade: 0,
    hunter_swarm: 0,
  });

  // Ultimate Director Roar & Boss Alert Mirrors
  const [ultimateCharge, setUltimateCharge] = useState(0);
  const [directorCutinPhase, setDirectorCutinPhase] = useState<'none' | 'cutin' | 'shout' | 'invert' | 'recovering'>('none');
  const [evolutionBanner, setEvolutionBanner] = useState<{ title: string; subtitle: string; icon: string } | null>(null);
  const [bossAlert, setBossAlert] = useState<string | null>(null);

  // Save Meta Progress to LocalStorage
  const saveMetaProgress = (newUpgrades: PermanentUpgrades, newCredits: number) => {
    setPermanentUpgrades(newUpgrades);
    setPsiCredits(newCredits);
    try {
      localStorage.setItem(STORAGE_KEY_UPGRADES, JSON.stringify(newUpgrades));
      localStorage.setItem(STORAGE_KEY_CREDITS, String(newCredits));
    } catch {
      // LocalStorage unavailable
    }
  };

  // Web Audio Pro Synthesizer (Commercial Grade Sound FX)
  const playSfx = useCallback((type: 'shoot' | 'spray' | 'hit' | 'pickup' | 'levelup' | 'defeat' | 'win' | 'laser' | 'boss_alarm' | 'shout' | 'evolution') => {
    if (audioMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      if (type === 'shoot') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.1);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'laser') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1400, now);
        osc.frequency.exponentialRampToValueAtTime(350, now + 0.09);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.09);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.09);
      } else if (type === 'spray') {
        const bufferSize = ctx.sampleRate * 0.15;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
        noise.connect(gain);
        gain.connect(ctx.destination);
        noise.start(now);
      } else if (type === 'pickup') {
        [659.25, 1046.5].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const t = now + i * 0.04;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.18, t);
          gain.gain.exponentialRampToValueAtTime(0.005, t + 0.14);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.14);
        });
      } else if (type === 'levelup') {
        const notes = [440, 554.37, 659.25, 880, 1108.73];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const t = now + idx * 0.07;
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.28, t);
          gain.gain.linearRampToValueAtTime(0.01, t + 0.28);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.28);
        });
      } else if (type === 'shout') {
        // Massive bass boom + siren sweep + distorted megaphone thunder
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.8);
        gain.gain.setValueAtTime(0.65, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.8);

        // Second resonant harmonic
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(320, now);
        osc2.frequency.exponentialRampToValueAtTime(80, now + 0.5);
        gain2.gain.setValueAtTime(0.4, now);
        gain2.gain.linearRampToValueAtTime(0.01, now + 0.5);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now);
        osc2.stop(now + 0.5);
      } else if (type === 'evolution') {
        // Epic Ascension Major Chime
        const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const t = now + idx * 0.06;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.3, t);
          gain.gain.exponentialRampToValueAtTime(0.005, t + 0.45);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.45);
        });
      } else if (type === 'hit') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.14);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.14);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.14);
      } else if (type === 'boss_alarm') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.linearRampToValueAtTime(640, now + 0.2);
        osc.frequency.linearRampToValueAtTime(320, now + 0.4);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
      }
    } catch {
      // AudioContext blocked
    }
  }, [audioMuted]);

  // Floating text & particle helpers
  const spawnFloating = (x: number, y: number, text: string, color = '#fbbf24', isCrit = false) => {
    floatingTextsRef.current.push({
      id: floatingIdRef.current++,
      x,
      y,
      text: isCrit ? `CRIT! ${text}` : text,
      color: isCrit ? '#f43f5e' : color,
      life: isCrit ? 1.0 : 0.75,
      maxLife: isCrit ? 1.0 : 0.75,
    });
  };

  const spawnParticles = (x: number, y: number, color: string, count = 8, speed = 60, size = 3) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = (0.2 + Math.random() * 0.8) * speed;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        color,
        size: Math.max(1.5, (0.6 + Math.random() * 0.8) * size),
        life: 0.35 + Math.random() * 0.35,
        maxLife: 0.7,
      });
    }
  };

  // Initialize Game Engine with selected character, permanent upgrades & stage
  const initGame = useCallback((charId: CharacterId = selectedChar, stageId: PatrolStageId = selectedStage) => {
    const engine = new SurvivorsEngine(createInitialSurvivorsState(charId, permanentUpgrades, stageId));
    engineRef.current = engine;
    touchVectorRef.current = { x: 0, y: 0 };
    touchIdRef.current = null;
    touchCenterRef.current = null;
    setJoystickVisual({ visible: false, baseX: 0, baseY: 0, knobX: 0, knobY: 0 });
    setPhase('ready');
    setLevel(1);
    setHp(engine.state.player.hp);
    setMaxHp(engine.state.player.maxHp);
    setExp(0);
    setNextExp(10);
    setGameTime(0);
    setScore(0);
    setKills(0);
    setUltimateCharge(0);
    setDirectorCutinPhase('none');
    setRerollsLeft(engine.state.rerollsLeft);
    setActivePerks({ ...engine.state.activePerks });
  }, [selectedChar, selectedStage, permanentUpgrades]);

  useEffect(() => {
    initGame(selectedChar, selectedStage);
  }, [initGame, selectedChar, selectedStage]);

  const startGame = () => {
    if (!engineRef.current) return;
    engineRef.current.start();
    setPhase('playing');
    lastTimeRef.current = performance.now();
  };

  // Trigger Director Roaring Shout Ultimate
  const handleTriggerDirectorShout = () => {
    const engine = engineRef.current;
    if (!engine) return;
    if (engine.state.ultimateCharge < engine.state.maxUltimateCharge) return;

    const ok = engine.triggerDirectorShout();
    if (ok) {
      playSfx('shout');
      screenShakeRef.current = 24;
      spawnParticles(engine.state.player.x, engine.state.player.y, '#f59e0b', 40, 160, 5);
      spawnFloating(engine.state.player.x, engine.state.player.y - 40, '🚨 소장 샤우팅 발동!! 🚨', '#f59e0b', true);
    }
  };

  // Perk Selection handler
  const handleSelectPerk = (perkId: PerkId) => {
    const engine = engineRef.current;
    if (!engine) return;

    const meta = PERK_CATALOG[perkId];
    engine.applyPerk(perkId);

    if (meta.category === 'evolution') {
      playSfx('evolution');
      screenShakeRef.current = 18;
      spawnParticles(engine.state.player.x, engine.state.player.y, '#fbbf24', 35, 140, 4);
    } else {
      playSfx('levelup');
      spawnParticles(engine.state.player.x, engine.state.player.y, '#38bdf8', 16, 90, 3);
    }

    setActivePerks({ ...engine.state.activePerks });
    setPhase(engine.state.phase);
    lastTimeRef.current = performance.now();
  };

  // Reroll handler in Level Up Modal
  const handleRerollPerks = () => {
    const engine = engineRef.current;
    if (!engine) return;
    if (engine.rerollPerks()) {
      playSfx('pickup');
      setRerollsLeft(engine.state.rerollsLeft);
      setPerkOptions([...engine.state.perkOptions]);
    }
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
      if (e.code === 'Space' || e.code === 'KeyF') {
        handleTriggerDirectorShout();
      }
      if (e.code === 'KeyR' && phase === 'levelup') {
        handleRerollPerks();
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
  });

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

        setJoystickVisual(prev => ({ ...prev, knobX, knobY }));

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
        setUltimateCharge(Math.round(engine.state.ultimateCharge));
        setDirectorCutinPhase(engine.state.directorCutinPhase);
        setEvolutionBanner(engine.state.evolutionBanner ?? null);
        setBossAlert(engine.state.bossName);

        if (engine.state.phase !== 'playing') {
          setPhase(engine.state.phase);
          if (engine.state.phase === 'levelup') {
            setPerkOptions(engine.state.perkOptions);
            setRerollsLeft(engine.state.rerollsLeft);
          }
          if (engine.state.phase === 'victory' || engine.state.phase === 'defeat') {
            // Save earned credits
            saveMetaProgress(permanentUpgrades, psiCredits + engine.state.psiCredits);
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

      // Invert color flash during Director Shout 'invert' phase
      if (engine.state.directorCutinPhase === 'invert') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, viewW, viewH);
      } else {
        ctx.fillStyle = '#0a0e13';
        ctx.fillRect(0, 0, viewW, viewH);
      }

      // Translate view to camera
      ctx.translate(-camX, -camY);

      // 1. RENDER WORLD FLOOR & GRID
      const slabSize = 100;
      const stage = engine.state.stage;
      ctx.fillStyle = stage?.floorColor || '#0c1219';
      ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

      ctx.strokeStyle = stage?.gridColor || 'rgba(148, 163, 184, 0.08)';
      ctx.lineWidth = 2;
      for (let x = 0; x <= WORLD_WIDTH; x += slabSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, WORLD_HEIGHT);
        ctx.stroke();
      }
      for (let y = 0; y <= WORLD_HEIGHT; y += slabSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(WORLD_WIDTH, y);
        ctx.stroke();
      }

      // Safety perimeter boundary
      ctx.save();
      ctx.lineWidth = 14;
      ctx.strokeStyle = stage?.borderColor || '#f59e0b';
      ctx.strokeRect(7, 7, WORLD_WIDTH - 14, WORLD_HEIGHT - 14);
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
      ctx.strokeRect(18, 18, WORLD_WIDTH - 36, WORLD_HEIGHT - 36);
      ctx.restore();

      // 1.5. RENDER STAGE INTERACTIVE HAZARDS
      if (engine.state.interactiveHazards) {
        for (const h of engine.state.interactiveHazards) {
          if (h.state === 'destroyed') continue;

          // A. Floodlight Tower (Safety Light Zone)
          if (h.type === 'floodlight_tower') {
            ctx.save();
            const grad = ctx.createRadialGradient(h.x, h.y, 15, h.x, h.y, h.radius);
            grad.addColorStop(0, 'rgba(251, 191, 36, 0.32)');
            grad.addColorStop(0.6, 'rgba(245, 158, 11, 0.15)');
            grad.addColorStop(1, 'rgba(245, 158, 11, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
            ctx.fill();

            // Light perimeter dashed circle
            ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
            ctx.lineWidth = 2;
            ctx.setLineDash([8, 6]);
            ctx.beginPath();
            ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
            ctx.stroke();

            // Tripod tower base
            ctx.setLineDash([]);
            ctx.fillStyle = '#475569';
            ctx.beginPath();
            ctx.arc(h.x, h.y, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(h.x, h.y, 8, 0, Math.PI * 2);
            ctx.fill();

            // Zone tag
            ctx.font = 'bold 10px sans-serif';
            ctx.fillStyle = '#fbbf24';
            ctx.textAlign = 'center';
            ctx.fillText('⚡ BUFF ZONE (+25% SPD)', h.x, h.y - 24);
            ctx.restore();
          }

          // B. Slurry Puddle (Mud Drag)
          if (h.type === 'slurry_puddle') {
            ctx.save();
            ctx.fillStyle = 'rgba(68, 50, 32, 0.65)';
            ctx.beginPath();
            ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = 'rgba(160, 110, 60, 0.35)';
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.font = 'bold 10px sans-serif';
            ctx.fillStyle = '#d97706';
            ctx.textAlign = 'center';
            ctx.fillText('⚠️ SLURRY MUD (SLOW)', h.x, h.y);
            ctx.restore();
          }

          // C. Crane Drop Zone (Periodic overhead danger)
          if (h.type === 'crane_drop_zone') {
            ctx.save();
            if (h.state === 'warning') {
              const pulse = (Math.sin(time / 80) + 1) * 0.5;
              ctx.strokeStyle = `rgba(239, 68, 68, ${0.4 + pulse * 0.5})`;
              ctx.lineWidth = 4;
              ctx.setLineDash([12, 8]);
              ctx.beginPath();
              ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
              ctx.stroke();

              ctx.fillStyle = `rgba(239, 68, 68, ${0.12 + pulse * 0.15})`;
              ctx.beginPath();
              ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
              ctx.fill();

              ctx.setLineDash([]);
              ctx.font = 'bold 12px sans-serif';
              ctx.fillStyle = '#ef4444';
              ctx.textAlign = 'center';
              ctx.fillText(`⚠️ CRANE DROP: ${h.timer.toFixed(1)}s ⚠️`, h.x, h.y);
            } else if (h.state === 'active') {
              ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
              ctx.beginPath();
              ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
              ctx.fill();

              ctx.fillStyle = '#334155';
              ctx.fillRect(h.x - 45, h.y - 30, 90, 60);
              ctx.strokeStyle = '#ef4444';
              ctx.lineWidth = 3;
              ctx.strokeRect(h.x - 45, h.y - 30, 90, 60);
              ctx.font = 'bold 11px sans-serif';
              ctx.fillStyle = '#f87171';
              ctx.textAlign = 'center';
              ctx.fillText('5,000 CRUSH', h.x, h.y + 4);
            } else {
              ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
              ctx.lineWidth = 2;
              ctx.setLineDash([6, 6]);
              ctx.beginPath();
              ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
              ctx.stroke();
              ctx.font = '9px sans-serif';
              ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
              ctx.textAlign = 'center';
              ctx.fillText('HOIST ZONE', h.x, h.y);
            }
            ctx.restore();
          }

          // D. Explosive Barrel
          if (h.type === 'explosive_barrel') {
            ctx.save();
            if (h.state === 'warning') {
              const pulse = (Math.sin(time / 50) + 1) * 0.5;
              ctx.fillStyle = pulse > 0.5 ? '#ef4444' : '#f97316';
              ctx.beginPath();
              ctx.arc(h.x, h.y, h.radius + pulse * 4, 0, Math.PI * 2);
              ctx.fill();

              ctx.font = 'bold 11px sans-serif';
              ctx.fillStyle = '#ffffff';
              ctx.textAlign = 'center';
              ctx.fillText('💥 IGNITE!', h.x, h.y - h.radius - 8);
            } else if (h.state === 'idle') {
              ctx.fillStyle = '#ea580c';
              ctx.beginPath();
              ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
              ctx.fill();
              ctx.strokeStyle = '#7c2d12';
              ctx.lineWidth = 3;
              ctx.stroke();

              ctx.font = '14px sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('🔥', h.x, h.y);

              const barW = 32;
              const barH = 4;
              const hpRatio = Math.max(0, h.hp / h.maxHp);
              ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
              ctx.fillRect(h.x - barW / 2, h.y - h.radius - 8, barW, barH);
              ctx.fillStyle = '#f97316';
              ctx.fillRect(h.x - barW / 2, h.y - h.radius - 8, barW * hpRatio, barH);
            }
            ctx.restore();
          }

          // E. Electric Transformer
          if (h.type === 'electric_transformer') {
            ctx.save();
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(h.x - 22, h.y - 22, 44, 44);
            ctx.strokeStyle = h.state === 'active' ? '#38bdf8' : '#64748b';
            ctx.lineWidth = 3;
            ctx.strokeRect(h.x - 22, h.y - 22, 44, 44);

            ctx.font = '16px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('⚡', h.x, h.y);

            if (h.state === 'active') {
              ctx.strokeStyle = '#38bdf8';
              ctx.shadowColor = '#0284c7';
              ctx.shadowBlur = 15;
              ctx.lineWidth = 2;
              for (let i = 0; i < 6; i++) {
                const angle = (i * Math.PI) / 3 + Math.random() * 0.3;
                const r = 80 + Math.random() * 100;
                ctx.beginPath();
                ctx.moveTo(h.x, h.y);
                ctx.lineTo(h.x + Math.cos(angle) * r, h.y + Math.sin(angle) * r);
                ctx.stroke();
              }
            }
            ctx.restore();
          }
        }
      }

      // 2. DIRECTIONAL FLASHLIGHT BEAM
      ctx.save();
      const beamDist = 280;
      const beamHalfAngle = Math.PI / 4.4;
      const beamGrad = ctx.createRadialGradient(player.x, player.y, 12, player.x, player.y, beamDist);
      beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.42)');
      beamGrad.addColorStop(0.3, 'rgba(253, 224, 71, 0.18)');
      beamGrad.addColorStop(0.7, 'rgba(250, 204, 21, 0.06)');
      beamGrad.addColorStop(1, 'rgba(250, 204, 21, 0)');

      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(player.x, player.y);
      ctx.arc(player.x, player.y, beamDist, facingAngle - beamHalfAngle, facingAngle + beamHalfAngle);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // 3. FLOODLIGHT / TESLA DOME AURA
      if (activePerks.tesla_dome > 0) {
        // High voltage electric blue tesla dome
        ctx.save();
        const auraRadius = 220;
        const grad = ctx.createRadialGradient(player.x, player.y, 10, player.x, player.y, auraRadius);
        grad.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
        grad.addColorStop(0.6, 'rgba(14, 165, 233, 0.2)');
        grad.addColorStop(1, 'rgba(14, 165, 233, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(player.x, player.y, auraRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
      } else if (activePerks.floodlight > 0) {
        const auraRadius = 90 + activePerks.floodlight * 24;
        const grad = ctx.createRadialGradient(player.x, player.y, 10, player.x, player.y, auraRadius);
        grad.addColorStop(0, 'rgba(251, 191, 36, 0.35)');
        grad.addColorStop(0.6, 'rgba(245, 158, 11, 0.16)');
        grad.addColorStop(1, 'rgba(245, 158, 11, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(player.x, player.y, auraRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. RENDER DROPS (PSI Safety Logs / Crystals)
      for (const drop of drops) {
        if (drop.isHeal) {
          ctx.save();
          ctx.shadowColor = '#10b981';
          ctx.shadowBlur = 12;
          ctx.fillStyle = '#10b981';
          ctx.fillRect(drop.x - 9, drop.y - 9, 18, 18);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(drop.x - 7, drop.y - 2.5, 14, 5);
          ctx.fillRect(drop.x - 2.5, drop.y - 7, 5, 14);
          ctx.restore();
        } else {
          ctx.save();
          ctx.translate(drop.x, drop.y);
          const spin = (time / 1000) * 3.5;
          ctx.rotate(spin);
          ctx.fillStyle = '#38bdf8';
          ctx.shadowColor = '#0ea5e9';
          ctx.shadowBlur = 16;
          ctx.beginPath();
          ctx.moveTo(0, -11);
          ctx.lineTo(8, 0);
          ctx.lineTo(0, 11);
          ctx.lineTo(-8, 0);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, 0, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // 5. RENDER PROJECTILES (Standard & Super Protocol Evolutions)
      for (const p of projectiles) {
        if (p.kind === 'shout_shockwave') {
          // Massive expanding golden sonic ring of Site Director's Roar
          ctx.save();
          ctx.strokeStyle = '#f59e0b';
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 25;
          ctx.lineWidth = 12;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.stroke();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(0, p.radius - 10), 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        } else if (p.kind === 'satellite_wave') {
          // Cosmic expanding sonic ring
          ctx.save();
          ctx.strokeStyle = '#38bdf8';
          ctx.shadowColor = '#0284c7';
          ctx.shadowBlur = 20;
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        } else if (p.kind === 'cryo_blast') {
          // Freezing ice blast
          ctx.save();
          ctx.fillStyle = 'rgba(165, 243, 252, 0.85)';
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else if (p.kind === 'tesla_bolt') {
          // Electric chain lightning
          ctx.save();
          ctx.fillStyle = '#fbbf24';
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 20;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else if (p.kind === 'emf_beam') {
          // Magenta laser barricade
          ctx.save();
          ctx.fillStyle = '#ec4899';
          ctx.shadowColor = '#f43f5e';
          ctx.shadowBlur = 18;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else if (p.kind === 'hunter_beam') {
          // Hyper laser sniper
          ctx.save();
          ctx.fillStyle = '#a855f7';
          ctx.shadowColor = '#c084fc';
          ctx.shadowBlur = 16;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else if (p.kind === 'radio') {
          ctx.save();
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 3.5;
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 18;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        } else if (p.kind === 'extinguisher') {
          ctx.save();
          const mistGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
          mistGrad.addColorStop(0, 'rgba(240, 249, 255, 0.85)');
          mistGrad.addColorStop(1, 'rgba(186, 230, 253, 0)');
          ctx.fillStyle = mistGrad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else if (p.kind === 'drone_laser') {
          ctx.save();
          ctx.fillStyle = '#06b6d4';
          ctx.shadowColor = '#22d3ee';
          ctx.shadowBlur = 14;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else if (p.kind === 'cone_trap') {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.fillStyle = '#ea580c';
          ctx.beginPath();
          ctx.moveTo(0, -16);
          ctx.lineTo(12, 10);
          ctx.lineTo(-12, 10);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-7, -4, 14, 4.5);
          ctx.restore();
        }
      }

      // 6. RENDER HAZARDS
      for (const h of hazards) {
        ctx.save();
        ctx.translate(h.x, h.y);

        if (h.type === 'UNHELMETED') {
          ctx.fillStyle = '#334155';
          ctx.beginPath();
          ctx.arc(0, 0, h.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 3;
          ctx.stroke();

          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(0, -3, h.radius * 0.58, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ef4444';
          ctx.font = '900 13px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('⚠ NO HELMET', 0, -h.radius - 14);
        } else if (h.type === 'RUNAWAY_CART') {
          ctx.fillStyle = '#b45309';
          ctx.fillRect(-h.radius, -h.radius + 4, h.radius * 2, h.radius * 2 - 8);
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 3;
          ctx.strokeRect(-h.radius + 2, -h.radius + 6, h.radius * 2 - 4, h.radius * 2 - 12);
        } else if (h.type === 'GAS_LEAK') {
          ctx.fillStyle = 'rgba(34, 197, 94, 0.7)';
          ctx.beginPath();
          ctx.arc(0, 0, h.radius, 0, Math.PI * 2);
          ctx.fill();
        } else if (h.type === 'CRANE_BOSS') {
          ctx.fillStyle = '#7f1d1d';
          ctx.beginPath();
          ctx.arc(0, 0, h.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 5;
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = '900 14px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('🚨 TOWER CRANE', 0, 5);
        }

        // Mini HP Bar
        const barW = Math.max(28, h.radius * 2.2);
        const barH = 5.5;
        const hpPercent = Math.max(0, h.hp / h.maxHp);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(-barW / 2, -h.radius - 8, barW, barH);
        ctx.fillStyle = h.type === 'CRANE_BOSS' ? '#dc2626' : '#f59e0b';
        ctx.fillRect(-barW / 2, -h.radius - 8, barW * hpPercent, barH);
        ctx.restore();
      }

      // 7. RENDER PLAYER (With Character Visual Styling)
      ctx.save();
      ctx.translate(player.x, player.y);

      if (player.invincibleTime > 0 && Math.floor(time / 80) % 2 === 0) {
        ctx.globalAlpha = 0.45;
      }

      // Drop shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.beginPath();
      ctx.ellipse(0, 10, 16, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Body
      const charColor = CHARACTER_PROFILES[engine.state.characterId].color;
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(0, 0, 17, 0, Math.PI * 2);
      ctx.fill();

      // High-Vis Safety Vest
      ctx.fillStyle = charColor;
      ctx.beginPath();
      ctx.arc(0, 0, 15, -Math.PI / 3, Math.PI / 3);
      ctx.fill();

      // Hard hat helmet
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = charColor;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(0, -2, 11, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // 8. RENDER SAFETY DRONES (Single or Hunter Swarm)
      const hasHunter = activePerks.hunter_swarm > 0;
      const droneCount = hasHunter ? 3 : activePerks.safety_drone > 0 ? 1 : 0;
      if (droneCount > 0 && engine.state.droneAngle !== undefined) {
        for (let d = 0; d < droneCount; d++) {
          const a = (engine.state.droneAngle ?? 0) + (d * Math.PI * 2) / droneCount;
          const dist = hasHunter ? 85 : 65;
          const dX = player.x + Math.cos(a) * dist;
          const dY = player.y + Math.sin(a) * dist;

          ctx.save();
          ctx.translate(dX, dY);
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(0, 0, 9, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = hasHunter ? '#a855f7' : '#38bdf8';
          ctx.lineWidth = 2.5;
          ctx.stroke();
          ctx.restore();
        }
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

      ctx.restore();

      requestRef.current = requestAnimationFrame(renderLoop);
    };

    requestRef.current = requestAnimationFrame(renderLoop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [playSfx, permanentUpgrades, psiCredits]);

  // Format time MM:SS
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

      {/* BOSS ALERT BANNER */}
      {bossAlert && (
        <div className="survivors-boss-alert" role="alert">
          <span className="survivors-hazard-stripe" />
          <div className="survivors-boss-alert-text">
            <strong>⚠️ EMERGENCY: {bossAlert} 출현! ⚠️</strong>
            <small>모든 화력을 집중하여 중대사고를 방지하세요!</small>
          </div>
          <span className="survivors-hazard-stripe" />
        </div>
      )}

      {/* SUPER PROTOCOL EVOLUTION BANNER */}
      {evolutionBanner && (
        <div className="survivors-evo-banner" role="status">
          <div className="survivors-evo-banner-icon">{evolutionBanner.icon}</div>
          <div className="survivors-evo-banner-content">
            <h4>{evolutionBanner.title}</h4>
            <p>{evolutionBanner.subtitle}</p>
          </div>
        </div>
      )}

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

      {/* DIRECTOR SHOUT ULTIMATE BUTTON (HUD) */}
      {phase === 'playing' && (
        <div className="survivors-ultimate-control">
          <button
            type="button"
            className={`survivors-ultimate-btn ${ultimateCharge >= 100 ? 'is-ready' : ''}`}
            onClick={handleTriggerDirectorShout}
            disabled={ultimateCharge < 100}
            aria-label="현장소장 사자후 궁극기 발동"
          >
            <div className="survivors-ultimate-ring" style={{ '--charge': `${ultimateCharge}%` } as React.CSSProperties} />
            <span className="survivors-ultimate-icon">📢</span>
            <div className="survivors-ultimate-info">
              <strong>소장 샤우팅</strong>
              <small>{ultimateCharge >= 100 ? 'READY [Space/F]' : `${ultimateCharge}%`}</small>
            </div>
          </button>
        </div>
      )}

      {/* FULL-SCREEN CINEMATIC DIRECTOR CUT-IN OVERLAY */}
      {directorCutinPhase !== 'none' && (
        <div className={`survivors-director-cutin-layer phase-${directorCutinPhase}`} aria-live="assertive">
          <div className="survivors-cutin-speedlines" />
          <div className="survivors-cutin-diagonal-banner">
            <img
              src="/assets/episode01/characters/lee-jaehoon-portrait.webp"
              alt="현장소장 이재훈"
              className="survivors-cutin-portrait"
            />
            <div className="survivors-cutin-textbox">
              <span className="survivors-cutin-kicker">🚨 현 장 소 장  전 권  발 동 🚨</span>
              <h2 className="survivors-cutin-shout">"작업 중지! 전원 멈춰어어엇---!!"</h2>
              <p className="survivors-cutin-sub">모든 위험 강제 무력화 및 전 구역 안전 데이터 강제 회수</p>
            </div>
          </div>
        </div>
      )}

      {/* MAIN GAME CANVAS */}
      <canvas ref={canvasRef} className="survivors-canvas" />

      {/* MOBILE VIRTUAL JOYSTICK */}
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

      {/* READY / START SCREEN WITH CHARACTER SELECT */}
      {phase === 'ready' && !showRdModal && !showArsenalModal && (
        <div className="survivors-modal-backdrop">
          <div className="survivors-modal-content survivors-ready-dialog">
            <h2 className="survivors-modal-title is-gold">PSI: 야간 긴급 순찰 (SURVIVORS)</h2>
            <p className="survivors-modal-sub">
              야간 타설 현장을 직접 누비며 위험 요소를 요격하고 3분간 무사고를 달성하세요!
            </p>

            {/* STAGE SELECTOR (5 INDUSTRIAL ZONES) */}
            <div className="survivors-stage-select-section">
              <span className="survivors-section-label">작전 구역 선택 (5대 산업 스테이지)</span>
              <div className="survivors-stage-cards">
                {(Object.values(PATROL_STAGES)).map(stg => (
                  <button
                    key={stg.id}
                    type="button"
                    className={`survivors-stage-card ${selectedStage === stg.id ? 'is-selected' : ''}`}
                    onClick={() => {
                      setSelectedStage(stg.id);
                      initGame(selectedChar, stg.id);
                    }}
                  >
                    <div className="survivors-stage-badge">
                      <span>{stg.icon}</span>
                      <strong>STAGE 0{stg.stageNumber}</strong>
                    </div>
                    <h4>{stg.name}</h4>
                    <span className="survivors-stage-sub">{stg.subtitle}</span>
                    <p>{stg.description}</p>
                    <div className="survivors-stage-meta">
                      <span>👹 {stg.bossName}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* CHARACTER SELECTOR */}
            <div className="survivors-char-select-section">
              <span className="survivors-section-label">순찰 요원 선택</span>
              <div className="survivors-char-cards">
                {(Object.values(CHARACTER_PROFILES)).map(char => (
                  <button
                    key={char.id}
                    type="button"
                    className={`survivors-char-card ${selectedChar === char.id ? 'is-selected' : ''}`}
                    onClick={() => {
                      setSelectedChar(char.id);
                      initGame(char.id, selectedStage);
                    }}
                  >
                    <span className="survivors-char-avatar">{char.avatar}</span>
                    <strong style={{ color: char.color }}>{char.name}</strong>
                    <small>{char.role}</small>
                    <p>{char.description}</p>
                    <div className="survivors-char-weapon-tag">
                      시작: {PERK_CATALOG[char.startingWeapon].name}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="survivors-controls-guide">
              <div><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> / <kbd>터치 드래그</kbd> : 이동 | 📢 <strong>자동 요격</strong></div>
              <div>⚡ <strong>소장 샤우팅</strong>: <kbd>Space</kbd> / <kbd>F</kbd> (전화면 1.5초 시공간 정지 & 전리품 흡수)</div>
              <div>💼 <strong>보유 안전 크레딧</strong>: <strong>{psiCredits.toLocaleString()} PSI</strong></div>
            </div>

            <div className="survivors-actions-row">
              <button type="button" className="survivors-btn-primary" onClick={startGame}>
                순찰 시작하기
              </button>
              <button type="button" className="survivors-btn-secondary" onClick={() => setShowRdModal(true)}>
                🔬 R&D 연구소
              </button>
              <button type="button" className="survivors-btn-secondary" onClick={() => setShowArsenalModal(true)}>
                📖 무기 진화 도감
              </button>
              <button type="button" className="survivors-btn-secondary" onClick={onExit}>
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* R&D RESEARCH LAB MODAL */}
      {showRdModal && (
        <div className="survivors-modal-backdrop">
          <div className="survivors-modal-content">
            <h2 className="survivors-modal-title is-gold">🔬 R&D 안전 본부 영구 강화</h2>
            <p className="survivors-modal-sub">
              누적된 안전 크레딧으로 안전관리자의 기본 역량을 영구 업그레이드하세요!
            </p>
            <div className="survivors-credit-counter">
              보유 크레딧: <strong>{psiCredits.toLocaleString()} PSI</strong>
            </div>

            <div className="survivors-rd-grid">
              <div className="survivors-rd-item">
                <div>
                  <strong>기본 생명력 (Vitality)</strong>
                  <small>최대 HP +15 (현재 Lv.{permanentUpgrades.vitality}/5)</small>
                </div>
                <button
                  type="button"
                  disabled={permanentUpgrades.vitality >= 5 || psiCredits < 200}
                  onClick={() => {
                    if (psiCredits >= 200 && permanentUpgrades.vitality < 5) {
                      saveMetaProgress(
                        { ...permanentUpgrades, vitality: permanentUpgrades.vitality + 1 },
                        psiCredits - 200,
                      );
                    }
                  }}
                >
                  강화 (200 PSI)
                </button>
              </div>

              <div className="survivors-rd-item">
                <div>
                  <strong>신속 기동 (Mobility)</strong>
                  <small>기본 이동속도 +15 (현재 Lv.{permanentUpgrades.mobility}/5)</small>
                </div>
                <button
                  type="button"
                  disabled={permanentUpgrades.mobility >= 5 || psiCredits < 250}
                  onClick={() => {
                    if (psiCredits >= 250 && permanentUpgrades.mobility < 5) {
                      saveMetaProgress(
                        { ...permanentUpgrades, mobility: permanentUpgrades.mobility + 1 },
                        psiCredits - 250,
                      );
                    }
                  }}
                >
                  강화 (250 PSI)
                </button>
              </div>

              <div className="survivors-rd-item">
                <div>
                  <strong>위기 분석력 (Intelligence)</strong>
                  <small>데이터 흡수 반경 +20 (현재 Lv.{permanentUpgrades.intelligence}/5)</small>
                </div>
                <button
                  type="button"
                  disabled={permanentUpgrades.intelligence >= 5 || psiCredits < 300}
                  onClick={() => {
                    if (psiCredits >= 300 && permanentUpgrades.intelligence < 5) {
                      saveMetaProgress(
                        { ...permanentUpgrades, intelligence: permanentUpgrades.intelligence + 1 },
                        psiCredits - 300,
                      );
                    }
                  }}
                >
                  강화 (300 PSI)
                </button>
              </div>

              <div className="survivors-rd-item">
                <div>
                  <strong>긴급 처치 키트 (First Aid)</strong>
                  <small>런당 1회 사망 시 50% HP로 부활 ({permanentUpgrades.firstAid > 0 ? '해금 완료' : '미보유'})</small>
                </div>
                <button
                  type="button"
                  disabled={permanentUpgrades.firstAid >= 1 || psiCredits < 1000}
                  onClick={() => {
                    if (psiCredits >= 1000 && permanentUpgrades.firstAid === 0) {
                      saveMetaProgress(
                        { ...permanentUpgrades, firstAid: 1 },
                        psiCredits - 1000,
                      );
                    }
                  }}
                >
                  {permanentUpgrades.firstAid > 0 ? '완료' : '해금 (1,000 PSI)'}
                </button>
              </div>

              <div className="survivors-rd-item">
                <div>
                  <strong>현장 재검토 (Reroll)</strong>
                  <small>레벨업 퍽 새로고침 기회 +1회 (현재 Lv.{permanentUpgrades.reroll}/3)</small>
                </div>
                <button
                  type="button"
                  disabled={permanentUpgrades.reroll >= 3 || psiCredits < 500}
                  onClick={() => {
                    if (psiCredits >= 500 && permanentUpgrades.reroll < 3) {
                      saveMetaProgress(
                        { ...permanentUpgrades, reroll: permanentUpgrades.reroll + 1 },
                        psiCredits - 500,
                      );
                    }
                  }}
                >
                  강화 (500 PSI)
                </button>
              </div>
            </div>

            <div className="survivors-actions-row">
              <button type="button" className="survivors-btn-primary" onClick={() => setShowRdModal(false)}>
                완료 및 닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ARSENAL & EVOLUTION ARCHIVE MODAL */}
      {showArsenalModal && (
        <div className="survivors-modal-backdrop">
          <div className="survivors-modal-content">
            <h2 className="survivors-modal-title is-gold">📖 안전 장비 & 5대 슈퍼 프로토콜 진화 도감</h2>
            <p className="survivors-modal-sub">
              기본 무기 Lv.5 + 지원 퍽을 습득하면 최강의 진화 무기(Super Protocol)가 발동됩니다!
            </p>

            <div className="survivors-recipes-grid">
              {(Object.entries(EVOLUTION_RECIPES)).map(([evoId, recipe]) => {
                const evo = PERK_CATALOG[evoId as PerkId];
                const weapon = PERK_CATALOG[recipe.weapon];
                const support = PERK_CATALOG[recipe.support];
                return (
                  <div key={evoId} className="survivors-recipe-card">
                    <div className="survivors-recipe-head">
                      <span>{evo.icon}</span>
                      <h4>{evo.name}</h4>
                    </div>
                    <div className="survivors-recipe-parts">
                      <span className="survivors-recipe-part">{weapon.icon} {weapon.name} (Lv.5)</span>
                      <b>+</b>
                      <span className="survivors-recipe-part">{support.icon} {support.name}</span>
                    </div>
                    <p>{evo.description}</p>
                  </div>
                );
              })}
            </div>

            <div className="survivors-actions-row">
              <button type="button" className="survivors-btn-primary" onClick={() => setShowArsenalModal(false)}>
                도감 닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LEVEL UP MODAL */}
      {phase === 'levelup' && (
        <div className="survivors-modal-backdrop">
          <div className="survivors-modal-content">
            <h2 className="survivors-modal-title is-gold">⚡ 안전 장비 & 역량 강화</h2>
            <p className="survivors-modal-sub">
              현장 안전 데이터 확보! 보급받을 안전 장비 또는 슈퍼 프로토콜을 선택하세요.
            </p>

            <div className="survivors-perk-cards">
              {perkOptions.map(perk => {
                const isEvo = perk.category === 'evolution';
                return (
                  <div
                    key={perk.id}
                    className={`survivors-perk-card ${isEvo ? 'is-evolution' : ''}`}
                    onClick={() => handleSelectPerk(perk.id)}
                  >
                    <div className="survivors-perk-card-icon">{perk.icon}</div>
                    <div className="survivors-perk-card-info">
                      <h4>
                        {perk.name}
                        <span>{isEvo ? '★ SUPER EVOLUTION' : `LV ${perk.level}`}</span>
                      </h4>
                      <p>{perk.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {rerollsLeft > 0 && (
              <div className="survivors-reroll-wrap">
                <button type="button" className="survivors-btn-reroll" onClick={handleRerollPerks}>
                  🎲 퍽 새로고침 (REROLL) — 잔여 {rerollsLeft}회 [R]
                </button>
              </div>
            )}
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
                <span>획득 PSI 크레딧</span>
                <strong style={{ color: '#fbbf24' }}>+{Math.round(score / 15)} PSI</strong>
              </div>
            </div>

            <div className="survivors-actions-row">
              <button
                type="button"
                className="survivors-btn-primary"
                onClick={() => {
                  initGame(selectedChar, selectedStage);
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
            <h2 className="survivors-modal-title is-green">
              🏆 {engineRef.current?.state.stage ? `${engineRef.current.state.stage.icon} STAGE 0${engineRef.current.state.stage.stageNumber} 클리어!` : '야간 무사고 달성 완료!'}
            </h2>
            <p className="survivors-modal-sub">
              {engineRef.current?.state.stage ? `${engineRef.current.state.stage.name} (${engineRef.current.state.stage.subtitle}) 구역을 안전하게 사수했습니다!` : '3분간의 극한 야간 타설 현장을 단 한 건의 사고 없이 안전하게 사수했습니다!'}
            </p>

            {/* 3-STAR CHALLENGES DEBRIEFING */}
            {engineRef.current?.state.stage && (
              <div className="survivors-stage-debriefing">
                <h4 className="survivors-debriefing-title">⭐ 스테이지 미션 달성 현황</h4>
                <div className="survivors-star-checklist">
                  {engineRef.current.state.stage.starChallenges.map((star, idx) => {
                    const isEarned = engineRef.current?.state.starsEarned[idx];
                    return (
                      <div key={star.starIndex} className={`survivors-star-item ${isEarned ? 'is-earned' : ''}`}>
                        <div className="survivors-star-badge">{isEarned ? '⭐' : '⚪'}</div>
                        <div className="survivors-star-info">
                          <strong>{star.title}</strong>
                          <p>{star.description}</p>
                        </div>
                        <span className="survivors-star-progress">
                          {isEarned ? '달성 완료' : `${star.currentValue} / ${star.targetValue}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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
                <span>환경 기믹 격퇴</span>
                <strong style={{ color: '#38bdf8' }}>{engineRef.current?.state.environmentalKills ?? 0}건</strong>
              </div>
              <div className="survivors-stat-box">
                <span>획득 PSI 크레딧</span>
                <strong style={{ color: '#fbbf24' }}>+{Math.round(score / 10)} PSI</strong>
              </div>
            </div>

            <div className="survivors-actions-row">
              {(() => {
                const stageList: PatrolStageId[] = ['stage_01', 'stage_02', 'stage_03', 'stage_04', 'stage_05'];
                const currentIdx = stageList.indexOf(selectedStage);
                const nextStage = currentIdx >= 0 && currentIdx < stageList.length - 1 ? stageList[currentIdx + 1] : null;

                if (nextStage) {
                  return (
                    <button
                      type="button"
                      className="survivors-btn-primary"
                      onClick={() => {
                        setSelectedStage(nextStage);
                        initGame(selectedChar, nextStage);
                        setTimeout(() => startGame(), 60);
                      }}
                    >
                      다음 스테이지 진출 ➔
                    </button>
                  );
                }
                return null;
              })()}
              <button
                type="button"
                className="survivors-btn-secondary"
                onClick={() => {
                  initGame(selectedChar, selectedStage);
                  setTimeout(() => startGame(), 50);
                }}
              >
                스테이지 재도전
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

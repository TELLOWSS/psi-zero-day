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
const STORAGE_KEY_UNLOCKED_STAGES = 'psi.survivors.unlocked_stages';
const STORAGE_KEY_STAGE_STARS = 'psi.survivors.stage_stars';

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

  // Authentic Construction Safety Assets Cache
  const spritesRef = useRef<{
    playerYoon?: HTMLImageElement;
    mobWorker?: HTMLImageElement;
    slingChoker?: HTMLImageElement;
    rebarBundle?: HTMLImageElement;
    fanDuct?: HTMLImageElement;
  }>({});

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const pImg = new Image();
    pImg.src = '/assets/survivors/sprite_player_yoon.webp';
    pImg.onload = () => { spritesRef.current.playerYoon = pImg; };

    const mImg = new Image();
    mImg.src = '/assets/survivors/sprite_mob_worker.webp';
    mImg.onload = () => { spritesRef.current.mobWorker = mImg; };

    const sImg = new Image();
    sImg.src = '/assets/episode01/scene-elements/suspended-load-round-sling-choker.webp';
    sImg.onload = () => { spritesRef.current.slingChoker = sImg; };

    const rImg = new Image();
    rImg.src = '/assets/episode01/scene-elements/rebar-lifting-bundle.webp';
    rImg.onload = () => { spritesRef.current.rebarBundle = rImg; };

    const fImg = new Image();
    fImg.src = '/assets/episode01/scene-elements/ventilation-fan-duct.webp';
    fImg.onload = () => { spritesRef.current.fanDuct = fImg; };
  }, []);

  // Meta Progression (Stored in LocalStorage)
  const [selectedChar, setSelectedChar] = useState<CharacterId>('yoon');
  const [selectedStage, setSelectedStage] = useState<PatrolStageId>('stage_01');
  const [unlockedStages, setUnlockedStages] = useState<PatrolStageId[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_UNLOCKED_STAGES);
      return saved ? JSON.parse(saved) : ['stage_01'];
    } catch {
      return ['stage_01'];
    }
  });
  const [stageStars, setStageStars] = useState<Record<string, boolean[]>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STAGE_STARS);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
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

            if (engine.state.phase === 'victory') {
              // Unlock next stage in order
              const stageOrder: PatrolStageId[] = ['stage_01', 'stage_02', 'stage_03', 'stage_04', 'stage_05'];
              const currentIdx = stageOrder.indexOf(selectedStage);
              if (currentIdx !== -1 && currentIdx < stageOrder.length - 1) {
                const nextStageId = stageOrder[currentIdx + 1];
                if (nextStageId) {
                  setUnlockedStages(prev => {
                    if (!prev.includes(nextStageId)) {
                      const updated = [...prev, nextStageId];
                      try {
                        localStorage.setItem(STORAGE_KEY_UNLOCKED_STAGES, JSON.stringify(updated));
                      } catch {
                        // ignore
                      }
                      return updated;
                    }
                    return prev;
                  });
                }
              }

              // Save star challenges
              setStageStars(prev => {
                const current = prev[selectedStage] || [false, false, false];
                const earned = engine.state.starsEarned;
                const merged = [
                  current[0] || earned[0],
                  current[1] || earned[1],
                  current[2] || earned[2],
                ];
                const updated = { ...prev, [selectedStage]: merged };
                try {
                  localStorage.setItem(STORAGE_KEY_STAGE_STARS, JSON.stringify(updated));
                } catch {
                  // ignore
                }
                return updated;
              });
            }
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

      // Screen Shake: Controlled, tactile feedback without visual dizziness
      let shakeX = 0;
      let shakeY = 0;
      if (screenShakeRef.current > 0) {
        const clampedShake = Math.min(3.5, screenShakeRef.current * 0.25);
        shakeX = Math.round((Math.random() - 0.5) * clampedShake * 2);
        shakeY = Math.round((Math.random() - 0.5) * clampedShake * 2);
        screenShakeRef.current = Math.max(0, screenShakeRef.current - dt * 40);
      }

      // Responsive Portrait / Landscape Zoom Factor
      const isPortrait = displayH > displayW;
      const baseZoom = isPortrait ? Math.max(0.72, Math.min(1.0, displayW / 560)) : 1.0;
      const viewW = displayW / baseZoom;
      const viewH = displayH / baseZoom;

      // CAMERA FOLLOW (Pixel-snapped integer positioning to eliminate fractional jitter/shimmer)
      const camX = Math.floor(player.x - viewW / 2 + shakeX);
      const camY = Math.floor(player.y - viewH / 2 + shakeY);

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

      // 1. RENDER WORLD FLOOR (Authentic Heavy Civil Engineering Concrete Foundation Slab)
      const stage = engine.state.stage;
      ctx.fillStyle = stage?.floorColor || '#0f141c';
      ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

      // Concrete slabs & rebar expansion grid (120px slabs)
      const slabSize = 120;
      ctx.strokeStyle = stage?.gridColor || 'rgba(148, 163, 184, 0.08)';
      ctx.lineWidth = 1.5;
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

      // Rebar intersection anchor nodes
      ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
      for (let x = slabSize; x < WORLD_WIDTH; x += slabSize * 2) {
        for (let y = slabSize; y < WORLD_HEIGHT; y += slabSize * 2) {
          ctx.fillRect(x - 2, y - 2, 4, 4);
        }
      }

      // Designated Green/Yellow Safety Walkway (안전통로)
      ctx.save();
      ctx.fillStyle = 'rgba(34, 197, 94, 0.05)';
      ctx.fillRect(WORLD_WIDTH / 2 - 90, 0, 180, WORLD_HEIGHT);
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.25)';
      ctx.lineWidth = 2;
      ctx.setLineDash([12, 10]);
      ctx.strokeRect(WORLD_WIDTH / 2 - 90, 0, 180, WORLD_HEIGHT);

      // Safety Walkway Stencil Markings
      ctx.font = 'bold 13px sans-serif';
      ctx.fillStyle = 'rgba(34, 197, 94, 0.4)';
      ctx.textAlign = 'center';
      for (let y = 180; y < WORLD_HEIGHT; y += 320) {
        ctx.fillText('⛑️ 안전통로 / SAFETY WALKWAY ⛑️', WORLD_WIDTH / 2, y);
      }
      // STAGE-SPECIFIC ATMOSPHERIC WEATHER & INDUSTRIAL ENVIRONMENT
      if (selectedStage === 'stage_02') {
        // High-Rise Core Frame: High-altitude wind gust vapor streaks
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 7; i++) {
          const wx = ((time * 0.18 + i * 280) % (WORLD_WIDTH + 200)) - 100;
          const wy = 120 + i * 160;
          ctx.beginPath();
          ctx.moveTo(wx, wy);
          ctx.lineTo(wx + 110, wy - 18);
          ctx.stroke();
        }
        ctx.restore();
      } else if (selectedStage === 'stage_03') {
        // Tower Crane Lifting Zone: Overhead giant crane boom rotating shadow
        ctx.save();
        const craneAngle = (time / 14000) * Math.PI * 2;
        ctx.translate(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
        ctx.rotate(craneAngle);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
        ctx.fillRect(-18, -600, 36, 1200);
        ctx.fillRect(-40, -40, 80, 80);
        ctx.restore();
      } else if (selectedStage === 'stage_04') {
        // Confined Space Pit: Emergency green exit beacon lights along tunnel perimeter
        ctx.save();
        const greenPulse = (Math.sin(time / 350) + 1) * 0.5;
        ctx.fillStyle = `rgba(16, 185, 129, ${0.15 + greenPulse * 0.2})`;
        for (let x = 120; x < WORLD_WIDTH; x += 240) {
          ctx.beginPath();
          ctx.arc(x, 28, 5 + greenPulse * 3, 0, Math.PI * 2);
          ctx.arc(x, WORLD_HEIGHT - 28, 5 + greenPulse * 3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      } else if (selectedStage === 'stage_05') {
        // Typhoon Night Pour: Torrential diagonal rain streaks and lightning flashes
        ctx.save();
        ctx.strokeStyle = 'rgba(186, 230, 253, 0.26)';
        ctx.lineWidth = 1.2;
        for (let r = 0; r < 45; r++) {
          const rx = ((r * 71 + time * 1.3) % WORLD_WIDTH);
          const ry = ((r * 109 + time * 1.9) % WORLD_HEIGHT);
          ctx.beginPath();
          ctx.moveTo(rx, ry);
          ctx.lineTo(rx - 15, ry + 22);
          ctx.stroke();
        }
        // Dramatic atmospheric storm lightning flash
        if (Math.sin(time / 1600) > 0.988) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
        }
        ctx.restore();
      }

      // Perimeter Safety Boundary (45-degree yellow/black hazard chevron barrier)
      ctx.save();
      ctx.lineWidth = 16;
      ctx.strokeStyle = stage?.borderColor || '#f59e0b';
      ctx.strokeRect(8, 8, WORLD_WIDTH - 16, WORLD_HEIGHT - 16);
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
      ctx.strokeRect(20, 20, WORLD_WIDTH - 40, WORLD_HEIGHT - 40);
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

      // 6. RENDER HAZARDS (Authentic Industrial Construction Safety Incidents)
      for (const h of hazards) {
        ctx.save();
        ctx.translate(h.x, h.y);

        if (h.type === 'UNHELMETED') {
          // Unhelmeted Construction Worker in Danger
          const mSpr = spritesRef.current.mobWorker;
          const runPhase = time / 80 + h.x;
          const legOffset = Math.sin(runPhase) * 4;

          // Ground shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
          ctx.beginPath();
          ctx.ellipse(0, 12, h.radius * 1.1, h.radius * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();

          // Walking work boots
          ctx.fillStyle = '#334155';
          ctx.fillRect(-6, h.radius - 2 + legOffset, 4, 6);
          ctx.fillRect(2, h.radius - 2 - legOffset, 4, 6);

          if (mSpr && mSpr.complete) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(0, 0, h.radius, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(mSpr, -h.radius - 2, -h.radius - 2, (h.radius + 2) * 2, (h.radius + 2) * 2);
            ctx.restore();

            // Hazard border ring
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(0, 0, h.radius, 0, Math.PI * 2);
            ctx.stroke();
          } else {
            // Procedural unhelmeted worker
            ctx.fillStyle = '#334155'; // Work clothes
            ctx.beginPath();
            ctx.arc(0, 0, h.radius, 0, Math.PI * 2);
            ctx.fill();

            // Exposed hair (no hard hat!)
            ctx.fillStyle = '#1e1b4b';
            ctx.beginPath();
            ctx.arc(0, -3, 8, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(0, 0, h.radius, 0, Math.PI * 2);
            ctx.stroke();
          }

          // Clear Visual Badge: [⚠️ 안전모 미착용]
          const alertPulse = Math.sin(time / 200) > 0;
          ctx.font = 'bold 11px sans-serif';
          ctx.fillStyle = alertPulse ? '#ef4444' : '#f59e0b';
          ctx.textAlign = 'center';
          ctx.fillText('⚠️ 안전모 미착용', 0, -h.radius - 10);
        } else if (h.type === 'RUNAWAY_CART') {
          // Runaway Construction Heavy Equipment (Mini Dump Truck / Transport Cart)
          const angle = Math.atan2(player.y - h.y, player.x - h.x);
          ctx.rotate(angle);

          // Dual halogen headlights on concrete floor
          const lightGrad = ctx.createRadialGradient(h.radius, 0, 5, h.radius + 85, 0, 85);
          lightGrad.addColorStop(0, 'rgba(254, 240, 138, 0.55)');
          lightGrad.addColorStop(0.5, 'rgba(254, 240, 138, 0.2)');
          lightGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
          ctx.fillStyle = lightGrad;
          ctx.beginPath();
          ctx.moveTo(h.radius, -8);
          ctx.lineTo(h.radius + 85, -34);
          ctx.lineTo(h.radius + 85, 34);
          ctx.lineTo(h.radius, 8);
          ctx.closePath();
          ctx.fill();

          // Industrial Yellow Vehicle Body
          ctx.fillStyle = '#d97706';
          ctx.fillRect(-h.radius, -h.radius + 4, h.radius * 2, h.radius * 2 - 8);

          // Black/Yellow Hazard Stripes on Hood
          ctx.fillStyle = '#18181b';
          ctx.fillRect(-h.radius + 3, -h.radius + 6, h.radius * 2 - 6, 4);
          ctx.fillRect(-h.radius + 3, h.radius - 10, h.radius * 2 - 6, 4);

          // Cab window & Flashing Beacon
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(-2, -h.radius + 8, 10, h.radius * 2 - 16);

          // Flashing Yellow Warning Strobe
          const strobe = Math.sin(time / 120) > 0;
          ctx.fillStyle = strobe ? '#ef4444' : '#facc15';
          ctx.beginPath();
          ctx.arc(0, 0, 5, 0, Math.PI * 2);
          ctx.fill();

          // Heavy industrial wheels
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(-h.radius + 2, -h.radius - 2, 7, 4);
          ctx.fillRect(h.radius - 9, -h.radius - 2, 7, 4);
          ctx.fillRect(-h.radius + 2, h.radius - 2, 7, 4);
          ctx.fillRect(h.radius - 9, h.radius - 2, 7, 4);
        } else if (h.type === 'GAS_LEAK') {
          // Confined Space Toxic Gas Pocket (H2S / CO / O2 Low)
          const pulse = (Math.sin(time / 260) + 1) * 0.5;
          const currentRadius = h.radius + pulse * 4;

          const cloudGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, currentRadius);
          cloudGrad.addColorStop(0, 'rgba(234, 179, 8, 0.45)');
          cloudGrad.addColorStop(0.6, 'rgba(34, 197, 94, 0.25)');
          cloudGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');

          ctx.fillStyle = cloudGrad;
          ctx.beginPath();
          ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
          ctx.fill();

          // Swirling toxic gas eddies
          for (let i = 0; i < 4; i++) {
            const swirlAngle = (time / 500) + (i * Math.PI) / 2;
            const swirlDist = (h.radius * 0.45) * (0.8 + Math.sin(time / 300 + i) * 0.2);
            const sx = Math.cos(swirlAngle) * swirlDist;
            const sy = Math.sin(swirlAngle) * swirlDist;
            ctx.fillStyle = 'rgba(234, 179, 8, 0.2)';
            ctx.beginPath();
            ctx.arc(sx, sy, h.radius * 0.4, 0, Math.PI * 2);
            ctx.fill();
          }

          // Industrial Gas Warning Label
          ctx.font = 'bold 11px sans-serif';
          ctx.fillStyle = '#fef08a';
          ctx.textAlign = 'center';
          ctx.fillText('☣ 유독가스 주의', 0, -4);
          ctx.font = '9px sans-serif';
          ctx.fillStyle = '#86efac';
          ctx.fillText('CO/H2S: 140PPM', 0, 10);
        } else if (h.type === 'CRANE_BOSS') {
          // Giant Tower Crane Rigging Failure Hazard (Boss)
          // Ground Drop Hazard Red Zone
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.65)';
          ctx.lineWidth = 3;
          ctx.setLineDash([10, 8]);
          ctx.beginPath();
          ctx.arc(0, 0, h.radius + 14, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);

          // Crane drop shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
          ctx.beginPath();
          ctx.ellipse(0, 15, h.radius * 1.3, h.radius * 0.7, 0, 0, Math.PI * 2);
          ctx.fill();

          // Render authentic high-res rebar bundle / sling choker if available
          const sImg = spritesRef.current.slingChoker;
          const rImg = spritesRef.current.rebarBundle;
          const swayX = Math.sin(time / 450) * 8;

          if (sImg && sImg.complete) {
            ctx.save();
            ctx.translate(swayX, 0);
            const drawSize = (h.radius + 10) * 2;
            ctx.drawImage(sImg, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
            ctx.restore();
          } else if (rImg && rImg.complete) {
            ctx.save();
            ctx.translate(swayX, 0);
            const drawSize = (h.radius + 10) * 2;
            ctx.drawImage(rImg, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
            ctx.restore();
          } else {
            // Heavy steel crane hook block
            ctx.save();
            ctx.translate(swayX, 0);
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(-h.radius + 6, -h.radius + 6, (h.radius - 6) * 2, (h.radius - 6) * 2);

            // Yellow/Black Crane Hazard Stripes
            ctx.fillStyle = '#eab308';
            ctx.fillRect(-h.radius + 10, -h.radius + 10, (h.radius - 10) * 2, 6);
            ctx.fillRect(-h.radius + 10, h.radius - 16, (h.radius - 10) * 2, 6);

            // Giant Steel Hook & Rebar Load
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(0, -h.radius);
            ctx.lineTo(0, h.radius - 6);
            ctx.arc(8, h.radius - 6, 8, Math.PI, 0, true);
            ctx.stroke();
            ctx.restore();
          }

          // Boss Hazard Title Tag
          ctx.font = 'bold 12px sans-serif';
          ctx.fillStyle = '#f87171';
          ctx.textAlign = 'center';
          ctx.fillText('🚨 타워크레인 슬링 와이어 붕괴 위험', 0, -h.radius - 18);
        }

        // Mini HP Bar with clear contrast
        const barW = Math.max(30, h.radius * 2.2);
        const barH = 5;
        const hpPercent = Math.max(0, h.hp / h.maxHp);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(-barW / 2, -h.radius - 8, barW, barH);
        ctx.fillStyle = h.type === 'CRANE_BOSS' ? '#dc2626' : '#f59e0b';
        ctx.fillRect(-barW / 2, -h.radius - 8, barW * hpPercent, barH);
        ctx.restore();
      }

      // 7. RENDER PLAYER (Safety Director Yoon Sung-ho & Character Profiles)
      ctx.save();
      ctx.translate(player.x, player.y);

      // Real-time Tactical Flashlight Cone (어두운 현장을 밝히는 전방 조명 빔)
      ctx.save();
      ctx.rotate(facingAngle);
      const flashGrad = ctx.createRadialGradient(16, 0, 5, 160, 0, 110);
      flashGrad.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
      flashGrad.addColorStop(0.4, 'rgba(254, 240, 138, 0.18)');
      flashGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
      ctx.fillStyle = flashGrad;
      ctx.beginPath();
      ctx.moveTo(16, -6);
      ctx.lineTo(160, -55);
      ctx.lineTo(160, 55);
      ctx.lineTo(16, 6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      if (player.invincibleTime > 0 && Math.floor(time / 80) % 2 === 0) {
        ctx.globalAlpha = 0.45;
      }

      // Ground shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.beginPath();
      ctx.ellipse(0, 12, 18, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Safety Leadership Radius (은은한 안전지휘 반경 링)
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.3)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(0, 0, 28, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      const pSpr = spritesRef.current.playerYoon;
      if (pSpr && pSpr.complete && engine.state.characterId === 'yoon') {
        // High-Quality Yoon Sung-ho Token
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(pSpr, -24, -24, 48, 48);
        ctx.restore();

        // High-Visibility Neon-Lime Outer Ring
        ctx.strokeStyle = '#84cc16';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // Procedural Tactical Safety Officer
        const charColor = CHARACTER_PROFILES[engine.state.characterId].color;

        // Dark tactical work jacket
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fill();

        // High-Visibility Safety Vest
        ctx.fillStyle = charColor;
        ctx.beginPath();
        ctx.arc(0, 0, 15, -Math.PI / 3, Math.PI / 3);
        ctx.fill();

        // White Safety Helmet with Green Safety Cross
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, -3, 11, 0, Math.PI * 2);
        ctx.fill();

        // Green Safety Cross Emblem (안전제일 십자 마크)
        ctx.fillStyle = '#16a34a';
        ctx.fillRect(-2, -7, 4, 8);
        ctx.fillRect(-4, -5, 8, 4);
      }

      // Handheld Megaphone / Equipment Directional Pointer
      ctx.save();
      ctx.rotate(facingAngle);
      ctx.fillStyle = '#eab308'; // Industrial yellow megaphone
      ctx.fillRect(14, -3, 8, 6);
      ctx.beginPath();
      ctx.moveTo(22, -6);
      ctx.lineTo(29, -10);
      ctx.lineTo(29, 10);
      ctx.lineTo(22, 6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

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
              src="/assets/survivors/director_yoon_shout_cutin.jpg"
              alt="현장소장 윤성호 작업중지권 사자후"
              className="survivors-cutin-portrait"
            />
            <div className="survivors-cutin-textbox">
              <span className="survivors-cutin-kicker">🚨 중대재해 차단 긴급 작업중지권 발동! 🚨</span>
              <h2 className="survivors-cutin-shout">"작업 중지! 전원 대피해--!!"</h2>
              <p className="survivors-cutin-sub">전 구역 위험 설비 강제 정지 · 근로자 긴급 대피 · 안전 데이터 흡수</p>
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
            {/* DIRECTOR YOON SUNG-HO HERO KEY VISUAL BANNER */}
            <div className="survivors-monarch-hero-banner">
              <img
                src="/assets/survivors/director_yoon_hero.jpg"
                alt="현장소장 윤성호"
                className="survivors-monarch-hero-img"
              />
              <div className="survivors-monarch-hero-content">
                <span className="survivors-monarch-badge">🛡️ ZERO-BREACH COMMANDER</span>
                <h3>현장 지휘관 윤성호 소장</h3>
                <p>"30년 현장 경력의 베테랑 · 작업중지권 절대 사수 · 오늘도 무사히"</p>
                <div className="survivors-monarch-perks">
                  <span>✦ 확성기 사자후 제압</span>
                  <span>✦ 전 구역 작업중지권</span>
                  <span>✦ 현장 근로자 전원 구출</span>
                </div>
              </div>
            </div>

            <h2 className="survivors-modal-title is-gold">PSI: 야간 긴급 순찰 (SURVIVORS)</h2>
            <p className="survivors-modal-sub">
              야간 타설 현장을 직접 누비며 위험 요소를 요격하고 3분간 무사고를 달성하세요!
            </p>

            {/* STAGE SELECTOR (5 INDUSTRIAL ZONES) */}
            <div className="survivors-stage-select-section">
              <span className="survivors-section-label">작전 구역 선택 (5대 산업 스테이지)</span>
              <div className="survivors-stage-cards">
                {(Object.values(PATROL_STAGES)).map(stg => {
                  const isUnlocked = unlockedStages.includes(stg.id);
                  const stars = stageStars[stg.id] || [false, false, false];
                  return (
                    <button
                      key={stg.id}
                      type="button"
                      disabled={!isUnlocked}
                      className={`survivors-stage-card ${selectedStage === stg.id ? 'is-selected' : ''} ${!isUnlocked ? 'is-locked' : ''}`}
                      onClick={() => {
                        if (!isUnlocked) return;
                        setSelectedStage(stg.id);
                        initGame(selectedChar, stg.id);
                      }}
                    >
                      <div className="survivors-stage-badge">
                        <span>{isUnlocked ? stg.icon : '🔒'}</span>
                        <strong>STAGE 0{stg.stageNumber}</strong>
                        {isUnlocked && (
                          <span className="survivors-stage-stars-tag">
                            {stars.map(s => (s ? '⭐' : '⚪')).join('')}
                          </span>
                        )}
                      </div>
                      <h4>{stg.name}</h4>
                      <span className="survivors-stage-sub">{stg.subtitle}</span>
                      <p>{isUnlocked ? stg.description : `🔒 이전 구역 (STAGE 0${stg.stageNumber - 1}) 완수 시 해금`}</p>
                      <div className="survivors-stage-meta">
                        <span>{isUnlocked ? `👹 ${stg.bossName}` : '보안 인가 필요'}</span>
                      </div>
                    </button>
                  );
                })}
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

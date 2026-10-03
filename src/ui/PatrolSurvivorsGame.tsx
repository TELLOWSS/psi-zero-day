import { parseSave, safeNumber, validStages, validStars, validUpgrades } from '../app/survivors-save';
import { SurvivorsSessionAudio } from './survivors-session-audio';
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

export interface ApprovedStamp {
  id: number;
  x: number;
  y: number;
  life: number;
  maxLife: number;
}

export interface HelmetSnap {
  id: number;
  x: number;
  y: number;
  life: number;
  maxLife: number;
}

const STORAGE_KEY_UPGRADES = 'psi.survivors.rd_upgrades';
const STORAGE_KEY_CREDITS = 'psi.survivors.credits';
const STORAGE_KEY_UNLOCKED_STAGES = 'psi.survivors.unlocked_stages';
const STORAGE_KEY_STAGE_STARS = 'psi.survivors.stage_stars';

export const CANONICAL_CHAR_IDS: CharacterId[] = [
  'player',
  'kang_taesik',
  'yoon_sungho',
  'lee_jaehoon',
  'lim_junho',
];

export const STORAGE_KEY_FG_POINTS = 'psi.fieldguide.points';

export function PatrolSurvivorsGame({ onExit, audioMuted = false }: PatrolSurvivorsGameProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<SurvivorsEngine | null>(null);
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const floatingIdRef = useRef(1);
  const particlesRef = useRef<Particle[]>([]);
  const approvedStampsRef = useRef<ApprovedStamp[]>([]);
  const helmetSnapsRef = useRef<HelmetSnap[]>([]);

  // Keyboard input state
  const keysRef = useRef<{ [key: string]: boolean }>({});

  // Screen shake & Damage Flash
  const screenShakeRef = useRef<number>(0);
  const damageFlashRef = useRef<number>(0);

  // Authentic Construction Safety Assets Cache (including 2.5D Quarter-view standing maps)
  const spritesRef = useRef<{
    playerYoon?: HTMLImageElement;
    playerPark?: HTMLImageElement;
    playerJung?: HTMLImageElement;
    characters: Record<string, HTMLImageElement>;
    characterMaps: Record<string, HTMLImageElement>;
    mobWorker?: HTMLImageElement;
    groundV2?: HTMLImageElement;
    riskAtlasV2?: HTMLImageElement;
    slingChoker?: HTMLImageElement;
    rebarBundle?: HTMLImageElement;
    fanDuct?: HTMLImageElement;
  }>({
    characters: {},
    characterMaps: {},
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load canonical character portraits
    CANONICAL_CHAR_IDS.forEach(cId => {
      const prof = CHARACTER_PROFILES[cId];
      if (prof?.portraitUri) {
        const img = new Image();
        img.src = prof.portraitUri;
        img.onload = () => {
          spritesRef.current.characters[cId] = img;
        };
      }
    });

    // Load 2.5D Quarter-View Standing Character Map Arts
    const mapArtSources: Record<string, string> = {
      player: '/assets/episode01/characters/player-map.webp',
      kang_taesik: '/assets/episode01/characters/kang-taesik-map.webp',
      yoon_sungho: '/assets/episode01/characters/yoon-sungho-map.webp',
      lee_jaehoon: '/assets/episode01/characters/lee-jaehoon-map.webp',
      lim_junho: '/assets/episode01/characters/lim-junho-map.webp',
      // Legacy compatibility keys
      park: '/assets/episode01/characters/kang-taesik-map.webp',
      yoon: '/assets/episode01/characters/yoon-sungho-map.webp',
      jung: '/assets/episode01/characters/player-map.webp',
    };

    Object.entries(mapArtSources).forEach(([cId, src]) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        spritesRef.current.characterMaps[cId] = img;
      };
    });

    const pImg = new Image();
    pImg.src = '/assets/survivors/sprite_player_yoon.webp';
    pImg.onload = () => { spritesRef.current.playerYoon = pImg; };

    const parkImg = new Image();
    parkImg.src = '/assets/episode01/characters/kang-taesik-portrait.webp';
    parkImg.onload = () => { spritesRef.current.playerPark = parkImg; };

    const jungImg = new Image();
    jungImg.src = '/assets/episode01/characters/player-portrait.webp';
    jungImg.onload = () => { spritesRef.current.playerJung = jungImg; };

    const mImg = new Image();
    mImg.src = '/assets/survivors/sprite_mob_worker.webp';
    mImg.onload = () => { spritesRef.current.mobWorker = mImg; };

    const ground = new Image();
    ground.onload = () => { spritesRef.current.groundV2 = ground; };
    ground.src = '/assets/survivors/stage-01-ground-v2.webp';
    const atlas = new Image();
    atlas.onload = () => { spritesRef.current.riskAtlasV2 = atlas; };
    atlas.src = '/assets/survivors/risk-atlas-v2.webp';

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
  const [selectedChar, setSelectedChar] = useState<CharacterId>('player');
  const [selectedStage, setSelectedStage] = useState<PatrolStageId>('stage_01');
  const [unlockedStages, setUnlockedStages] = useState<PatrolStageId[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_UNLOCKED_STAGES);
      return validStages(parseSave(saved));
    } catch {
      return ['stage_01'];
    }
  });
  const [stageStars, setStageStars] = useState<Record<string, boolean[]>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STAGE_STARS);
      return validStars(parseSave(saved));
    } catch {
      return {};
    }
  });
  const [permanentUpgrades, setPermanentUpgrades] = useState<PermanentUpgrades>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_UPGRADES);
      return validUpgrades(parseSave(saved));
    } catch {
      return DEFAULT_PERMANENT_UPGRADES;
    }
  });
  const [psiCredits, setPsiCredits] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CREDITS);
      return safeNumber(saved);
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
  const [combo, setCombo] = useState(0);
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

  const audioRef = useRef(new SurvivorsSessionAudio());
  const rewardedRef = useRef(new WeakSet<SurvivorsEngine>());
  useEffect(() => () => audioRef.current.dispose(), []);
  useEffect(() => { audioRef.current.setMuted(audioMuted); if (phase === 'paused' || phase === 'ready') audioRef.current.silence(); }, [audioMuted, phase]);

  // Development synth; final orchestral assets are a separate production gate.
  const playSfx = useCallback((type: 'shoot' | 'spray' | 'hit' | 'pickup' | 'levelup' | 'defeat' | 'win' | 'laser' | 'boss_alarm' | 'shout' | 'evolution', position?: { x: number; y: number }) => {
    if (audioMuted) return;
    try {
      const ctx = audioRef.current.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const priority = type === 'boss_alarm' || type === 'shout' ? 4 : type === 'hit' || type === 'win' || type === 'defeat' ? 3 : type === 'pickup' || type === 'levelup' || type === 'evolution' ? 2 : 1;
      const listener = engineRef.current?.state.player;

      if (type === 'shoot') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.1);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
        if (!audioRef.current.track(osc, gain, priority)) return;
        osc.connect(gain);
        audioRef.current.connectSfx(osc, gain, position, listener);
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
        if (!audioRef.current.track(osc, gain, priority)) return;
        osc.connect(gain);
        audioRef.current.connectSfx(osc, gain, position, listener);
        osc.start(now);
        osc.stop(now + 0.09);
      } else if (type === 'spray') {
        const buffer = audioRef.current.noiseBuffer(ctx);
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
        if (!audioRef.current.track(noise, gain, priority)) return;
        noise.connect(gain);
        audioRef.current.connectSfx(noise, gain, position, listener);
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
          if (!audioRef.current.track(osc, gain, priority)) return;
        osc.connect(gain);
          audioRef.current.connectSfx(osc, gain, position, listener);
          osc.start(t);
          osc.stop(t + 0.14);
        });
      } else if (type === 'levelup' || type === 'win') {
        const notes = [440, 554.37, 659.25, 880, 1108.73];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const t = now + idx * 0.07;
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.28, t);
          gain.gain.linearRampToValueAtTime(0.01, t + 0.28);
          if (!audioRef.current.track(osc, gain, priority)) return;
        osc.connect(gain);
          audioRef.current.connectSfx(osc, gain, position, listener);
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
        if (!audioRef.current.track(osc, gain, priority)) return;
        osc.connect(gain);
        audioRef.current.connectSfx(osc, gain, position, listener);
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
        if (!audioRef.current.track(osc2, gain2, priority)) return;
        osc2.connect(gain2);
        audioRef.current.connectSfx(osc2, gain2, position, listener);
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
          if (!audioRef.current.track(osc, gain, priority)) return;
        osc.connect(gain);
          audioRef.current.connectSfx(osc, gain, position, listener);
          osc.start(t);
          osc.stop(t + 0.45);
        });
      } else if (type === 'hit' || type === 'defeat') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.14);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.14);
        if (!audioRef.current.track(osc, gain, priority)) return;
        osc.connect(gain);
        audioRef.current.connectSfx(osc, gain, position, listener);
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
        if (!audioRef.current.track(osc, gain, priority)) return;
        osc.connect(gain);
        audioRef.current.connectSfx(osc, gain, position, listener);
        osc.start(now);
        osc.stop(now + 0.4);
      }
    } catch (err) {
      audioRef.current.reportFailure(String(err));
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

  const spawnHelmetSnap = (x: number, y: number) => {
    helmetSnapsRef.current.push({
      id: Date.now() + Math.random(),
      x,
      y,
      life: 0.65,
      maxLife: 0.65,
    });
  };

  const spawnApprovedStamp = (x: number, y: number) => {
    approvedStampsRef.current.push({
      id: Date.now() + Math.random(),
      x,
      y,
      life: 1.8,
      maxLife: 1.8,
    });
  };

  // Initialize Game Engine with selected character, permanent upgrades & stage
  const initGame = useCallback((charId: CharacterId = selectedChar, stageId: PatrolStageId = selectedStage) => {
    const engine = new SurvivorsEngine(createInitialSurvivorsState(charId, permanentUpgrades, stageId), crypto.getRandomValues(new Uint32Array(1))[0]);
    audioRef.current.silence();
    floatingTextsRef.current = [];
    particlesRef.current = [];
    helmetSnapsRef.current = [];
    approvedStampsRef.current = [];
    setCombo(0);
    setEvolutionBanner(null);
    setBossAlert(null);
    keysRef.current = {};
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
    if (!engineRef.current || engineRef.current.state.phase === 'ready') initGame(selectedChar, selectedStage);
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
      if ((e.code === 'Escape' || e.code === 'KeyP') && !e.repeat) {
        const engine = engineRef.current;
        if (engine && (engine.state.phase === 'playing' || engine.state.phase === 'paused')) {
          const next = engine.state.phase === 'playing' ? 'paused' : 'playing';
          engine.setPaused(next === 'paused');
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

  const interruptSession = useCallback(() => {
    keysRef.current = {};
    touchIdRef.current = null;
    touchCenterRef.current = null;
    touchVectorRef.current = { x: 0, y: 0 };
    setJoystickVisual(prev => ({ ...prev, visible: false }));
    audioRef.current.silence();
    const engine = engineRef.current;
    if (engine?.state.phase === 'playing') { engine.setPaused(true); setPhase('paused'); }
    lastTimeRef.current = performance.now();
  }, []);
  useEffect(() => {
    const hidden = () => { if (document.hidden) interruptSession(); };
    window.addEventListener('blur', interruptSession);
    document.addEventListener('visibilitychange', hidden);
    return () => {
      window.removeEventListener('blur', interruptSession);
      document.removeEventListener('visibilitychange', hidden);
    };
  }, [interruptSession]);

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

  const reducedMotionRef = useRef(false);
  useEffect(() => {
    const query = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const update = () => { reducedMotionRef.current = query?.matches ?? false; };
    update(); query?.addEventListener('change', update);
    const header = containerRef.current?.querySelector('header');
    const reserveHud = () => {
      if (header && containerRef.current) {
        const bottom = header.getBoundingClientRect().bottom - containerRef.current.getBoundingClientRect().top;
        containerRef.current.style.setProperty('--survivors-hud-bottom', `${Math.ceil(bottom + 8)}px`);
      }
    };
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(reserveHud) : null;
    if (header) observer?.observe(header);
    window.addEventListener('resize', reserveHud); reserveHud();
    return () => { observer?.disconnect(); window.removeEventListener('resize', reserveHud); query?.removeEventListener('change', update); };
  }, []);

  // Main Render & Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastHudTime = -Infinity;
    let previousEngine: SurvivorsEngine | null = null;
    let prevNeutralized = 0;
    let prevHp = 100;
    let prevLevel = 1;
    let facingAngle = 0;

    const renderLoop = (time: number) => {
      requestRef.current = requestAnimationFrame(renderLoop);

      const dt = Math.max(0, (time - lastTimeRef.current) / 1000);
      lastTimeRef.current = time;

      const engine = engineRef.current;
      if (!engine) return;
      if (previousEngine !== engine) {
        previousEngine = engine;
        prevNeutralized = engine.state.hazardsNeutralized;
        prevHp = engine.state.player.hp;
        prevLevel = engine.state.level;
        facingAngle = 0;
      }

      try {

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
        const events = engine.drainAudioEvents();
        const audible = new Set<string>();
        for (const event of events) {
          const cue = event.type === 'impact' ? 'shoot' : event.type === 'control' ? 'pickup' : event.type;
          // Coalesce dense events per rendered batch. Engine event IDs remain unique.
          if (!audible.has(cue)) { audible.add(cue); playSfx(cue, event.x === undefined || event.y === undefined ? undefined : {x: event.x, y: event.y}); }
          if (event.type === 'boss_alarm' || event.type === 'shout') audioRef.current.duckMusic();
        }

        // Check state changes
        if (engine.state.hazardsNeutralized > prevNeutralized) {
          const diff = engine.state.hazardsNeutralized - prevNeutralized;
          prevNeutralized = engine.state.hazardsNeutralized;
          setKills(prevNeutralized);
          setScore(engine.state.score);

          // Process kill events (Golden helmet snap, approved stamp, boss defeat)
          const killEvents = engine.state.lastKilledEvents || [];
          for (const ev of killEvents) {
            if (ev.type === 'UNHELMETED') {
              spawnHelmetSnap(ev.x, ev.y);
              spawnApprovedStamp(ev.x, ev.y);
              spawnParticles(ev.x, ev.y - 20, '#10b981', 8, 65, 3.5);
              spawnFloating(ev.x, ev.y - 35, '+안전모 착용 완료! ✔', '#10b981');
            } else if (ev.type === 'CRANE_BOSS') {
              screenShakeRef.current = 28;
              spawnParticles(ev.x, ev.y, '#f59e0b', 40, 160, 5);
              spawnFloating(ev.x, ev.y - 50, '양중 작업 정지·작업반경 통제 완료', '#fbbf24', true);
            }
          }

          // Combo Juice Feedback
          const currentCombo = engine.state.comboCount;
          setCombo(currentCombo);
          if (currentCombo >= 2) {
            if (currentCombo % 5 === 0) {
              screenShakeRef.current = Math.min(20, 8 + currentCombo * 0.9);
              spawnFloating(engine.state.player.x, engine.state.player.y - 65, `🔥 ${currentCombo}연속 계도! 현장 안전 행진!`, '#fbbf24', true);
            }
          }

          spawnParticles(engine.state.player.x, engine.state.player.y, '#38bdf8', diff * 5, 80);
        }
        if (engine.state.comboCount !== combo) {
          setCombo(engine.state.comboCount);
        }

        if (engine.state.player.hp < prevHp) {

          screenShakeRef.current = 14;
          damageFlashRef.current = 0.45; // Red damage vignette flash
          spawnFloating(engine.state.player.x, engine.state.player.y - 25, `-${Math.round(prevHp - engine.state.player.hp)}`, '#ef4444');
          spawnParticles(engine.state.player.x, engine.state.player.y, '#ef4444', 16, 120);
          prevHp = engine.state.player.hp;
        } else if (engine.state.player.hp > prevHp) {
          prevHp = engine.state.player.hp;
        }
        if (engine.state.level > prevLevel) {

          spawnParticles(engine.state.player.x, engine.state.player.y, '#fbbf24', 20, 140);
          prevLevel = engine.state.level;
        }

        // Render physics at RAF cadence; mirrors update at 12Hz or immediately on phase change.
        if (time - lastHudTime >= 1000 / 12 || engine.state.phase !== 'playing') {
        lastHudTime = time;
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
        }

        if (engine.state.phase !== 'playing') {
          setPhase(engine.state.phase);
          if (engine.state.phase === 'levelup') {
            setPerkOptions(engine.state.perkOptions);
            setRerollsLeft(engine.state.rerollsLeft);
          }
          if ((engine.state.phase === 'victory' || engine.state.phase === 'defeat') && !rewardedRef.current.has(engine)) {
            rewardedRef.current.add(engine);
            // Save earned credits & Field Guide Points
            saveMetaProgress(permanentUpgrades, psiCredits + engine.state.psiCredits);
            try {
              const earnedFg = Math.max(1, Math.floor(engine.state.hazardsNeutralized / 8)) + (engine.state.phase === 'victory' ? 5 : 0);
              const currentFg = safeNumber(localStorage.getItem(STORAGE_KEY_FG_POINTS));
              localStorage.setItem(STORAGE_KEY_FG_POINTS, String(currentFg + earnedFg));
            } catch {
              // ignore
            }

            if (engine.state.phase === 'victory') {
              // Unlock next stage in order
              const stageOrder: PatrolStageId[] = ['stage_01', 'stage_02', 'stage_03', 'stage_04', 'stage_05'];
              const currentIdx = stageOrder.indexOf(engine.state.stageId);
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
                const current = prev[engine.state.stageId] || [false, false, false];
                const earned = engine.state.starsEarned;
                const merged = [
                  current[0] || earned[0],
                  current[1] || earned[1],
                  current[2] || earned[2],
                ];
                const updated = { ...prev, [engine.state.stageId]: merged };
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
      if (screenShakeRef.current > 0 && !reducedMotionRef.current) {
        const clampedShake = Math.min(3.5, screenShakeRef.current * 0.25);
        shakeX = Math.round((Math.random() - 0.5) * clampedShake * 2);
        shakeY = Math.round((Math.random() - 0.5) * clampedShake * 2);
        screenShakeRef.current = Math.max(0, screenShakeRef.current - dt * 40);
      }

      // Responsive Portrait / Landscape Zoom Factor
      const isPortrait = displayH > displayW;
      const preferredZoom = isPortrait ? Math.max(0.72, Math.min(1.0, displayW / 560)) : 1.0;
      // Cover the viewport with the world; never reveal a large empty off-map strip.
      const baseZoom = Math.max(preferredZoom, displayW / WORLD_WIDTH, displayH / WORLD_HEIGHT);
      const viewW = displayW / baseZoom;
      const viewH = displayH / baseZoom;

      // CAMERA FOLLOW (Pixel-snapped integer positioning to eliminate fractional jitter/shimmer)
      const camX = Math.floor(Math.max(0, Math.min(WORLD_WIDTH - viewW, player.x - viewW / 2)) + shakeX);
      const camY = Math.floor(Math.max(0, Math.min(WORLD_HEIGHT - viewH, player.y - viewH / 2)) + shakeY);

      // Reset transform to identity and clear screen to guarantee zero cumulative matrix drift
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.scale(dpr * baseZoom, dpr * baseZoom);

      // Invert color flash during Director Shout 'invert' phase
      if (engine.state.directorCutinPhase === 'invert' && !reducedMotionRef.current) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, viewW, viewH);
      } else {
        ctx.fillStyle = '#0a0e13';
        ctx.fillRect(0, 0, viewW, viewH);
      }

      // Translate view to camera
      ctx.translate(-camX, -camY);

      // 1. RENDER WORLD FLOOR (Authentic Heavy Civil Engineering 2.5D Foundation Slab)
      const stage = engine.state.stage;
      ctx.fillStyle = stage?.floorColor || '#0f141c';
      ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

      const groundV2 = spritesRef.current.groundV2;
      const useGroundArt = stage?.id === 'stage_01' && Boolean(groundV2?.naturalWidth);
      if (useGroundArt && groundV2) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(groundV2, 0, 0, WORLD_WIDTH, WORLD_HEIGHT);
      }
      if (!useGroundArt) {
      // Concrete slabs & 45-degree Isometric Foundation Grid
      const isoStep = 96;
      ctx.strokeStyle = stage?.gridColor || 'rgba(148, 163, 184, 0.09)';
      ctx.lineWidth = 1.4;

      // Diagonal family 1: / (slope +1, y - x = c)
      const minC1 = -WORLD_WIDTH;
      const maxC1 = WORLD_HEIGHT;
      for (let c = Math.floor(minC1 / isoStep) * isoStep; c <= maxC1; c += isoStep) {
        const x1 = Math.max(0, -c);
        const y1 = x1 + c;
        const x2 = Math.min(WORLD_WIDTH, WORLD_HEIGHT - c);
        const y2 = x2 + c;
        if (x1 < x2) {
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }

      // Diagonal family 2: \ (slope -1, y + x = c)
      const maxC2 = WORLD_WIDTH + WORLD_HEIGHT;
      for (let c = 0; c <= maxC2; c += isoStep) {
        const x1 = Math.max(0, c - WORLD_HEIGHT);
        const y1 = c - x1;
        const x2 = Math.min(WORLD_WIDTH, c);
        const y2 = c - x2;
        if (x1 < x2) {
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }

      // 45-degree Diamond Rebar Anchor Plates at diagonal intersections
      ctx.fillStyle = 'rgba(56, 189, 248, 0.16)';
      const nodeStep = isoStep * 2;
      for (let nx = 0; nx < WORLD_WIDTH; nx += nodeStep) {
        for (let ny = 0; ny < WORLD_HEIGHT; ny += nodeStep) {
          ctx.beginPath();
          ctx.moveTo(nx, ny - 3.5);
          ctx.lineTo(nx + 3.5, ny);
          ctx.lineTo(nx, ny + 3.5);
          ctx.lineTo(nx - 3.5, ny);
          ctx.closePath();
          ctx.fill();
        }
      }

      }

      // Designated Green/Yellow Safety Walkway (안전통로: 45도 투시감 강화)
      ctx.save();
      const walkW = 180;
      const walkX = WORLD_WIDTH / 2 - walkW / 2;
      ctx.fillStyle = 'rgba(34, 197, 94, 0.06)';
      ctx.fillRect(walkX, 0, walkW, WORLD_HEIGHT);

      // Walkway 45-degree hazard stripe markings inside
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.14)';
      ctx.lineWidth = 4;
      for (let sy = -walkW; sy < WORLD_HEIGHT + walkW; sy += 48) {
        ctx.beginPath();
        ctx.moveTo(walkX, sy);
        ctx.lineTo(walkX + walkW, sy + walkW * 0.7);
        ctx.stroke();
      }

      // Walkway borders
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.35)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([14, 10]);
      ctx.beginPath();
      ctx.moveTo(walkX, 0);
      ctx.lineTo(walkX, WORLD_HEIGHT);
      ctx.moveTo(walkX + walkW, 0);
      ctx.lineTo(walkX + walkW, WORLD_HEIGHT);
      ctx.stroke();
      ctx.setLineDash([]);

      // Safety Walkway Stencil Markings
      ctx.font = 'bold 13px sans-serif';
      ctx.fillStyle = 'rgba(34, 197, 94, 0.45)';
      ctx.textAlign = 'center';
      for (let y = 180; y < WORLD_HEIGHT; y += 320) {
        if (y === 180) ctx.fillText('안전통로', WORLD_WIDTH / 2, y);
      }
      ctx.restore();

      // Resolved workers leave the risk area along the safety corridor.
      for (const worker of engine.state.resolvedWorkers ?? []) {
        const sprite = spritesRef.current.mobWorker;
        if (!sprite?.complete || !sprite.naturalWidth) continue;
        ctx.save(); ctx.globalAlpha = Math.min(1, worker.remaining);
        const atlas = spritesRef.current.riskAtlasV2;
        if (atlas?.naturalWidth) {
          ctx.drawImage(atlas, 175, 20, 310, 635, worker.x - 17, worker.y - 68, 34, 72);
        } else {
          ctx.drawImage(sprite, worker.x - 21, worker.y - 52, 42, 56);
        }
        ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.arc(worker.x, worker.y - 61, 7, Math.PI, 0); ctx.fill();
        ctx.font = 'bold 10px sans-serif'; ctx.fillStyle = '#86efac'; ctx.textAlign = 'center';
        ctx.fillText('안전통로 이동', worker.x, worker.y - 65); ctx.restore();
      }

      // RENDER 2.5D APPROVED SAFETY STAMPS ON FLOOR
      const aliveStamps: ApprovedStamp[] = [];
      for (const st of approvedStampsRef.current) {
        st.life -= dt;
        if (st.life > 0) {
          ctx.save();
          ctx.translate(st.x, st.y);
          ctx.scale(1, 0.52); // 2.5D ground projection
          const alpha = Math.min(1.0, st.life / (st.maxLife * 0.4));
          ctx.globalAlpha = alpha;

          // Green safety approval ring
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, 24, 0, Math.PI * 2);
          ctx.stroke();

          // Green fill wash
          ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
          ctx.fill();

          // APPROVED stamp text
          ctx.font = 'bold 9px sans-serif';
          ctx.fillStyle = '#10b981';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('APPROVED ✔', 0, 0);
          ctx.restore();
          aliveStamps.push(st);
        }
      }
      approvedStampsRef.current = aliveStamps;

      // STAGE-SPECIFIC ATMOSPHERIC WEATHER & INDUSTRIAL ENVIRONMENT
      if (engine.state.stageId === 'stage_02') {
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
      } else if (engine.state.stageId === 'stage_03') {
        // Tower Crane Lifting Zone: Overhead giant crane boom rotating shadow
        ctx.save();
        const craneAngle = (time / 14000) * Math.PI * 2;
        ctx.translate(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
        ctx.rotate(craneAngle);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
        ctx.fillRect(-18, -600, 36, 1200);
        ctx.fillRect(-40, -40, 80, 80);
        ctx.restore();
      } else if (engine.state.stageId === 'stage_04') {
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
      } else if (engine.state.stageId === 'stage_05') {
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
              ctx.fillText(`양중 경고 · 통제 필요 ${h.timer.toFixed(1)}s`, h.x, h.y);
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
              ctx.fillText('위험구역 접근 금지', h.x, h.y + 4);
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
              ctx.fillText(h.state === 'cooldown' ? '작업 정지·구역 통제' : '양중 작업반경', h.x, h.y);
            }
            ctx.restore();
          }

          // D. Isolate flammable storage (legacy type ID retained)
          if (h.type === 'explosive_barrel') {
            ctx.save();
            if (h.state === 'active') {
              ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 3; ctx.setLineDash([8, 6]);
              ctx.beginPath(); ctx.arc(h.x, h.y, 50, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
              ctx.font = 'bold 11px sans-serif'; ctx.fillStyle = '#86efac'; ctx.textAlign = 'center';
              ctx.fillText('위험원 격리 완료', h.x, h.y - 58);
            } else if (h.state === 'warning') {
              const pulse = (Math.sin(time / 50) + 1) * 0.5;
              ctx.fillStyle = pulse > 0.5 ? '#ef4444' : '#f97316';
              ctx.beginPath();
              ctx.arc(h.x, h.y, h.radius + pulse * 4, 0, Math.PI * 2);
              ctx.fill();

              ctx.font = 'bold 11px sans-serif';
              ctx.fillStyle = '#ffffff';
              ctx.textAlign = 'center';
              ctx.fillText('격리·대피 진행', h.x, h.y - h.radius - 8);
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
              ctx.fillText('⚠️', h.x, h.y);

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

      // 2. DIRECTIONAL 2.5D QUARTER-VIEW FLASHLIGHT CONE (Projected onto 45-degree concrete floor)
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.save();
      ctx.scale(1, 0.58); // 45-degree isometric floor plane compression
      ctx.rotate(facingAngle);
      const beamDist = 320;
      const beamHalfAngle = Math.PI / 4.2;
      const beamGrad = ctx.createRadialGradient(16, 0, 8, beamDist, 0, 140);
      beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.48)');
      beamGrad.addColorStop(0.35, 'rgba(253, 224, 71, 0.2)');
      beamGrad.addColorStop(0.75, 'rgba(250, 204, 21, 0.07)');
      beamGrad.addColorStop(1, 'rgba(250, 204, 21, 0)');

      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, beamDist, -beamHalfAngle, beamHalfAngle);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      ctx.restore();

      // 3. FLOODLIGHT / TESLA DOME AURA (2.5D Ground Ellipse Projection)
      if (activePerks.tesla_dome > 0) {
        ctx.save();
        ctx.translate(player.x, player.y);
        ctx.scale(1, 0.58);
        const auraRadius = 240;
        const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, auraRadius);
        grad.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
        grad.addColorStop(0.6, 'rgba(14, 165, 233, 0.2)');
        grad.addColorStop(1, 'rgba(14, 165, 233, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, auraRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
      } else if (activePerks.floodlight > 0) {
        ctx.save();
        ctx.translate(player.x, player.y);
        ctx.scale(1, 0.58);
        const auraRadius = 100 + activePerks.floodlight * 28;
        const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, auraRadius);
        grad.addColorStop(0, 'rgba(251, 191, 36, 0.35)');
        grad.addColorStop(0.6, 'rgba(245, 158, 11, 0.16)');
        grad.addColorStop(1, 'rgba(245, 158, 11, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, auraRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 4. RENDER GROUND PROJECTILES (Mist & Traps lying on slab floor)
      for (const p of projectiles) {
        if (p.kind === 'extinguisher') {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.scale(1, 0.55); // ground spread
          const mistGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.radius);
          mistGrad.addColorStop(0, 'rgba(240, 249, 255, 0.85)');
          mistGrad.addColorStop(1, 'rgba(186, 230, 253, 0)');
          ctx.fillStyle = mistGrad;
          ctx.beginPath();
          ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else if (p.kind === 'cone_trap') {
          ctx.save();
          ctx.translate(p.x, p.y);
          // Ground shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
          ctx.beginPath();
          ctx.ellipse(0, 5, 12, 5, 0, 0, Math.PI * 2);
          ctx.fill();
          // 2.5D Traffic Cone Standing Billboard
          ctx.fillStyle = '#ea580c';
          ctx.beginPath();
          ctx.moveTo(0, -22);
          ctx.lineTo(11, 4);
          ctx.lineTo(-11, 4);
          ctx.closePath();
          ctx.fill();
          // White reflective retro tape
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(-5, -6);
          ctx.lineTo(5, -6);
          ctx.lineTo(7, -1);
          ctx.lineTo(-7, -1);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      }

      // 5. Y-SORTED ENTITY RENDER PIPELINE (Depth Ordering for Drops, Hazards, and Player)
      type EntityItem =
        | { kind: 'drop'; y: number; data: typeof drops[0] }
        | { kind: 'hazard'; y: number; data: typeof hazards[0] }
        | { kind: 'player'; y: number };

      const entityList: EntityItem[] = [];
      for (const d of drops) {
        entityList.push({ kind: 'drop', y: d.y, data: d });
      }
      for (const h of hazards) {
        entityList.push({ kind: 'hazard', y: h.y, data: h });
      }
      entityList.push({ kind: 'player', y: player.y });

      // Sort strictly by ground contact feet y-coordinate (ascending)
      entityList.sort((a, b) => a.y - b.y);

      for (const item of entityList) {
        if (item.kind === 'drop') {
          const drop = item.data;
          if (drop.isHeal) {
            ctx.save();
            // 2.5D Ground Shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.beginPath();
            ctx.ellipse(drop.x, drop.y + 4, 11, 5, 0, 0, Math.PI * 2);
            ctx.fill();

            // Floating Aid Kit Box
            const floatY = drop.y - 6 + Math.sin(time / 200) * 3;
            ctx.shadowColor = '#10b981';
            ctx.shadowBlur = 12;
            ctx.fillStyle = '#10b981';
            ctx.fillRect(drop.x - 9, floatY - 9, 18, 18);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(drop.x - 7, floatY - 2.5, 14, 5);
            ctx.fillRect(drop.x - 2.5, floatY - 7, 5, 14);
            ctx.restore();
          } else {
            ctx.save();
            // 2.5D Ground Shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.beginPath();
            ctx.ellipse(drop.x, drop.y + 4, 10, 4.5, 0, 0, Math.PI * 2);
            ctx.fill();

            // Floating Rotating PSI Crystal
            const floatY = drop.y - 7 + Math.sin(time / 220) * 3;
            ctx.translate(drop.x, floatY);
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
        } else if (item.kind === 'hazard') {
          const h = item.data;
          ctx.save();
          ctx.translate(h.x, h.y);

          if (h.type === 'UNHELMETED') {
            // 2.5D Ground Ellipse Contact Shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
            ctx.beginPath();
            ctx.ellipse(0, 2, h.radius * 1.05, h.radius * 0.44, 0, 0, Math.PI * 2);
            ctx.fill();

            // 2.5D Standing Worker Billboard
            const mSpr = spritesRef.current.mobWorker;
            const runPhase = time / 80 + h.x;
            const bob = Math.abs(Math.sin(runPhase)) * 3.5;

            const atlas = spritesRef.current.riskAtlasV2;
            if (atlas?.naturalWidth) {
              ctx.save();
              if (player.x < h.x) ctx.scale(-1, 1);
              ctx.drawImage(atlas, 175, 20, 310, 635, -17, -68 + bob * 0.4, 34, 72);
              ctx.restore();
            } else if (mSpr && mSpr.complete && mSpr.naturalWidth > 0) {
              const drawW = 42;
              const drawH = 56;
              ctx.save();
              ctx.drawImage(mSpr, -drawW / 2, -drawH + 4 + bob, drawW, drawH);
              ctx.restore();
            } else {
              // High-Quality Procedural 2.5D Unhelmeted Worker
              // Work Pants & Boots
              ctx.fillStyle = '#1e293b';
              ctx.fillRect(-8, -14 + bob, 6, 14);
              ctx.fillRect(2, -14 - bob + 3, 6, 14);
              // Work Jacket
              ctx.fillStyle = '#334155';
              ctx.fillRect(-10, -34 + bob, 20, 20);
              // Exposed Head & Dark Hair (No Helmet!)
              ctx.fillStyle = '#fed7aa';
              ctx.beginPath();
              ctx.arc(0, -41 + bob, 7, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = '#0f172a';
              ctx.beginPath();
              ctx.arc(0, -43 + bob, 7.5, Math.PI, 0);
              ctx.fill();
            }

            // 3D Billboard Floating Alert Badge
            const alertPulse = Math.sin(time / 200) > 0;
            ctx.font = 'bold 11px sans-serif';
            ctx.fillStyle = alertPulse ? '#ef4444' : '#f59e0b';
            ctx.textAlign = 'center';
            ctx.fillText('⚠ 안전모 미착용', 0, -88);
          } else if (h.type === 'RUNAWAY_CART') {
            // 2.5D Ground Contact Shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
            ctx.beginPath();
            ctx.ellipse(0, 8, h.radius * 1.3, h.radius * 0.6, 0, 0, Math.PI * 2);
            ctx.fill();

            // Dual halogen headlights on concrete floor (2.5D Ground Ellipse Cone)
            const angle = Math.atan2(player.y - h.y, player.x - h.x);
            ctx.save();
            ctx.scale(1, 0.58);
            ctx.rotate(angle);
            const lightGrad = ctx.createRadialGradient(h.radius, 0, 5, h.radius + 95, 0, 95);
            lightGrad.addColorStop(0, 'rgba(254, 240, 138, 0.6)');
            lightGrad.addColorStop(0.5, 'rgba(254, 240, 138, 0.22)');
            lightGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
            ctx.fillStyle = lightGrad;
            ctx.beginPath();
            ctx.moveTo(h.radius, -8);
            ctx.lineTo(h.radius + 95, -38);
            ctx.lineTo(h.radius + 95, 38);
            ctx.lineTo(h.radius, 8);
            ctx.closePath();
            ctx.fill();
            ctx.restore();

            const cartAtlas = spritesRef.current.riskAtlasV2;
            if (cartAtlas?.naturalWidth) {
              const width = Math.max(58, h.radius * 2.6);
              ctx.drawImage(cartAtlas, 650, 90, 620, 580, -width / 2, -width * 0.82, width, width * 0.94);
            } else {
            // 2.5D Isometric Cubic Transport Cart Body
            ctx.save();
            // Side panel (Shadowed)
            ctx.fillStyle = '#b45309';
            ctx.fillRect(-h.radius, -h.radius + 2, h.radius * 2, h.radius * 1.4);
            // Top panel (Lit)
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(-h.radius, -h.radius - 8, h.radius * 2, 12);
            // Black/Yellow Hazard Stripes on Front
            ctx.fillStyle = '#18181b';
            ctx.fillRect(-h.radius + 4, -h.radius + 6, h.radius * 2 - 8, 4);
            ctx.fillRect(-h.radius + 4, -h.radius + 14, h.radius * 2 - 8, 4);

            // Flashing Yellow Warning Strobe Beacon on top
            const strobe = Math.sin(time / 120) > 0;
            ctx.fillStyle = strobe ? '#ef4444' : '#facc15';
            ctx.beginPath();
            ctx.arc(0, -h.radius - 12, 6, 0, Math.PI * 2);
            ctx.fill();

            // Industrial wheels
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(-h.radius + 2, 4, 8, 6);
            ctx.fillRect(h.radius - 10, 4, 8, 6);
            ctx.restore();
            }
          } else if (h.type === 'FALLING_DEBRIS') {
            const atlas = spritesRef.current.riskAtlasV2;
            const width = Math.max(32, h.radius * 2.4);
            ctx.fillStyle = 'rgba(0,0,0,.4)';
            ctx.beginPath();
            ctx.ellipse(0, 3, width * .45, width * .18, 0, 0, Math.PI * 2);
            ctx.fill();
            if (atlas?.naturalWidth) ctx.drawImage(atlas, 35, 700, 585, 500, -width / 2, -width * .7, width, width * .85);
            else { ctx.fillStyle = '#94a3b8'; ctx.fillRect(-h.radius, -h.radius, h.radius * 2, h.radius * 2); }
          } else if (h.type === 'GAS_LEAK') {
            // Confined Space Toxic Gas Pocket (Projected onto 45-degree Ground Plane)
            ctx.save();
            ctx.scale(1, 0.58);
            const pulse = (Math.sin(time / 260) + 1) * 0.5;
            const currentRadius = h.radius + pulse * 5;

            const cloudGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, currentRadius);
            cloudGrad.addColorStop(0, 'rgba(234, 179, 8, 0.48)');
            cloudGrad.addColorStop(0.6, 'rgba(34, 197, 94, 0.28)');
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
              ctx.fillStyle = 'rgba(234, 179, 8, 0.22)';
              ctx.beginPath();
              ctx.arc(sx, sy, h.radius * 0.4, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.restore();

            // Industrial Gas Warning Label
            ctx.font = 'bold 11px sans-serif';
            ctx.fillStyle = '#fef08a';
            ctx.textAlign = 'center';
            ctx.fillText('☣ 유독가스 주의', 0, -h.radius * 0.5);
            ctx.font = '9px sans-serif';
            ctx.fillStyle = '#86efac';
            ctx.fillText('CO/H2S: 140PPM', 0, -h.radius * 0.5 + 13);
          } else if (h.type === 'CRANE_BOSS') {
            // Giant Tower Crane Rigging Failure Hazard (Boss)
            // 1. 2.5D Ground Drop Hazard Warning Ring (Oval)
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.75)';
            ctx.lineWidth = 3;
            ctx.setLineDash([12, 8]);
            ctx.beginPath();
            ctx.ellipse(0, 0, h.radius + 16, (h.radius + 16) * 0.52, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);

            // 2. 2.5D Giant Crane Heavy Ground Contact Shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
            ctx.beginPath();
            ctx.ellipse(0, 0, h.radius * 1.35, h.radius * 0.6, 0, 0, Math.PI * 2);
            ctx.fill();

            // 3. Overhead 3D Suspended Load (Z-axis offset + sway)
            const swayX = Math.sin(time / 450) * 9;
            const zOffset = -42 + Math.sin(time / 400) * 8; // Floating in the air!

            // Two high-tension steel wire ropes coming from overhead crane boom
            ctx.strokeStyle = 'rgba(203, 213, 225, 0.65)';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(-16 + swayX, zOffset);
            ctx.lineTo(-24, -380);
            ctx.moveTo(16 + swayX, zOffset);
            ctx.lineTo(24, -380);
            ctx.stroke();

            // Render authentic high-res rebar bundle / sling choker if available
            const sImg = spritesRef.current.slingChoker;
            const rImg = spritesRef.current.rebarBundle;

            ctx.save();
            ctx.translate(swayX, zOffset);

            if (sImg && sImg.complete && sImg.naturalWidth > 0) {
              const drawSize = (h.radius + 12) * 2;
              ctx.drawImage(sImg, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
            } else if (rImg && rImg.complete && rImg.naturalWidth > 0) {
              const drawSize = (h.radius + 12) * 2;
              ctx.drawImage(rImg, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
            } else {
              // Procedural Heavy Steel Rebar & Crane Block
              ctx.fillStyle = '#1e293b';
              ctx.fillRect(-h.radius + 6, -h.radius + 6, (h.radius - 6) * 2, (h.radius - 6) * 2);

              // Yellow/Black Crane Hazard Stripes
              ctx.fillStyle = '#eab308';
              ctx.fillRect(-h.radius + 10, -h.radius + 10, (h.radius - 10) * 2, 6);
              ctx.fillRect(-h.radius + 10, h.radius - 16, (h.radius - 10) * 2, 6);

              // Heavy Steel Hook
              ctx.strokeStyle = '#cbd5e1';
              ctx.lineWidth = 4;
              ctx.beginPath();
              ctx.moveTo(0, -h.radius);
              ctx.lineTo(0, h.radius - 6);
              ctx.arc(8, h.radius - 6, 8, Math.PI, 0, true);
              ctx.stroke();
            }
            ctx.restore();

            // Boss Hazard Title Tag
            ctx.font = 'bold 12px sans-serif';
            ctx.fillStyle = '#f87171';
            ctx.textAlign = 'center';
            ctx.fillText('🚨 타워크레인 슬링 와이어 붕괴 위험', 0, zOffset - h.radius - 14);
          }

          // Mini HP Bar with clear contrast
          const barW = Math.max(32, h.radius * 2.2);
          const barH = 5;
          const hpPercent = Math.max(0, h.hp / h.maxHp);
          const barY = h.type === 'CRANE_BOSS' ? -h.radius - 48 : h.type === 'UNHELMETED' ? -80 : h.type === 'RUNAWAY_CART' ? -Math.max(58, h.radius * 2.6) * .82 - 8 : -h.radius - 8;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
          ctx.fillRect(-barW / 2, barY, barW, barH);
          ctx.fillStyle = h.type === 'CRANE_BOSS' ? '#dc2626' : '#f59e0b';
          ctx.fillRect(-barW / 2, barY, barW * hpPercent, barH);
          ctx.restore();
        } else if (item.kind === 'player') {
          // 7. RENDER PLAYER (2.5D Standing Billboard + Realistic Ground Shadow + Equipment)
          ctx.save();
          ctx.translate(player.x, player.y);

          // 2.5D Ground Contact Ellipse Shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.52)';
          ctx.beginPath();
          ctx.ellipse(0, 2, 22, 9.5, 0, 0, Math.PI * 2);
          ctx.fill();

          // 2.5D Safety Leadership Radius (Subtle Oval Leadership Ring)
          ctx.strokeStyle = 'rgba(250, 204, 21, 0.35)';
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 6]);
          ctx.beginPath();
          ctx.ellipse(0, 2, 34, 15, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);

          // Invincibility flashing feedback
          if (player.invincibleTime > 0 && Math.floor(time / 80) % 2 === 0) {
            ctx.globalAlpha = 0.45;
          }

          // Movement Walk Bob & Tilt
          const isMoving = inputMag > 0.05;
          const bobY = isMoving ? Math.abs(Math.sin(time / 85)) * 4.5 : Math.sin(time / 400) * 1.5;
          const isFacingLeft = Math.cos(facingAngle) < -0.05;

          ctx.save();
          if (isFacingLeft) {
            ctx.scale(-1, 1);
          }

          const charProfile = CHARACTER_PROFILES[engine.state.characterId];
          const charMapSpr = spritesRef.current.characterMaps[engine.state.characterId]
            || (engine.state.characterId === 'yoon'
              ? spritesRef.current.characterMaps['yoon_sungho']
              : engine.state.characterId === 'park'
              ? spritesRef.current.characterMaps['kang_taesik']
              : spritesRef.current.characterMaps['player']);

          if (charMapSpr && charMapSpr.complete && charMapSpr.naturalWidth > 0) {
            // High-Resolution 2.5D Quarter-View Standing Character Map Sprite
            const sprW = 48;
            const sprH = 74;
            // Draw grounded with feet touching ground contact shadow (0, 0)
            ctx.drawImage(charMapSpr, -sprW / 2, -sprH + 4 + bobY, sprW, sprH);

            // Ground Accent Indicator Ring under character's feet
            ctx.strokeStyle = charProfile?.color || '#84cc16';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.ellipse(0, 2, 16, 7, 0, 0, Math.PI * 2);
            ctx.stroke();
          } else {
            // High-Quality Procedural 2.5D Construction Safety Officer
            const charColor = charProfile?.color || '#84cc16';

            // Work Boots & Heavy Duty Cargo Pants
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(-9, -16 + bobY, 7, 16);
            ctx.fillRect(2, -16 - bobY + 4, 7, 16);

            // High-Visibility Safety Vest & Work Jacket
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(-12, -44 + bobY, 24, 28);
            ctx.fillStyle = charColor;
            ctx.fillRect(-10, -42 + bobY, 20, 20);

            // Silver 3M Reflective Safety Stripes
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(-10, -32 + bobY, 20, 3.5);
            ctx.fillRect(-6, -42 + bobY, 3, 10);
            ctx.fillRect(3, -42 + bobY, 3, 10);

            // White Safety Hard Hat & Green Cross (안전모 & 안전제일 십자)
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, -52 + bobY, 9.5, 0, Math.PI * 2);
            ctx.fill();
            // Green Cross Emblem
            ctx.fillStyle = '#16a34a';
            ctx.fillRect(-2, -55 + bobY, 4, 7);
            ctx.fillRect(-4.5, -53.5 + bobY, 9, 3);
          }

          // Handheld Megaphone / Tactical Safety Equipment (Mounted at waist level)
          ctx.fillStyle = '#eab308'; // Industrial yellow megaphone
          ctx.fillRect(10, -36 + bobY, 8, 6);
          ctx.beginPath();
          ctx.moveTo(18, -39 + bobY);
          ctx.lineTo(25, -43 + bobY);
          ctx.lineTo(25, -29 + bobY);
          ctx.lineTo(18, -33 + bobY);
          ctx.closePath();
          ctx.fill();

          ctx.restore(); // restore facing flip
          ctx.restore(); // restore player translate
        }
      }

      // 6. RENDER AIRBORNE PROJECTILES (Standard & Super Protocol Evolutions)
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
        } else if (p.kind === 'drone_laser') {
          ctx.save();
          ctx.fillStyle = '#06b6d4';
          ctx.shadowColor = '#22d3ee';
          ctx.shadowBlur = 14;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // 7. RENDER SAFETY DRONES (2.5D Oval Airborne Orbit)
      const hasHunter = activePerks.hunter_swarm > 0;
      const droneCount = hasHunter ? 3 : activePerks.safety_drone > 0 ? 1 : 0;
      if (droneCount > 0 && engine.state.droneAngle !== undefined) {
        for (let d = 0; d < droneCount; d++) {
          const a = (engine.state.droneAngle ?? 0) + (d * Math.PI * 2) / droneCount;
          const dist = hasHunter ? 85 : 65;
          // 2.5D compressed elliptical orbit
          const dX = player.x + Math.cos(a) * dist;
          const groundY = player.y + Math.sin(a) * (dist * 0.55);
          const flightY = groundY - 32; // Floating at 32px height

          // Ground shadow for floating drone
          ctx.save();
          ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
          ctx.beginPath();
          ctx.ellipse(dX, groundY + 4, 10, 4.5, 0, 0, Math.PI * 2);
          ctx.fill();

          // 2.5D Drone Body
          ctx.translate(dX, flightY);
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(0, 0, 9, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = hasHunter ? '#a855f7' : '#38bdf8';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // Propeller rotor glow
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(0, 0, 14, 0, Math.PI * 2);
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

      // 10. RENDER 2.5D HELMET SNAP-ON PARTICLES (Golden Hard Hat Drops onto Worker's Head)
      const aliveHelmets: HelmetSnap[] = [];
      for (const hs of helmetSnapsRef.current) {
        hs.life -= dt;
        if (hs.life > 0) {
          ctx.save();
          const progress = 1 - (hs.life / hs.maxLife); // 0 to 1
          // Fall from y - 48 to y - 22 with elastic snap
          const startY = hs.y - 48;
          const targetY = hs.y - 22;
          const currentY = startY + (targetY - startY) * Math.min(1.0, progress * 1.5);

          ctx.translate(hs.x, currentY);
          // Golden/White Hard Hat Icon
          ctx.fillStyle = '#facc15';
          ctx.shadowColor = '#eab308';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(0, 0, 9, Math.PI, 0);
          ctx.fill();
          // Green cross
          ctx.fillStyle = '#16a34a';
          ctx.fillRect(-1.5, -6, 3, 5);
          ctx.fillRect(-3.5, -4.5, 7, 2);

          // Impact star sparkle when helmet snaps (progress > 0.6)
          if (progress > 0.6) {
            const sparkleAlpha = (1 - progress) / 0.4;
            ctx.fillStyle = `rgba(254, 240, 138, ${sparkleAlpha})`;
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('✨', 12, -4);
            ctx.fillText('✨', -12, -4);
          }

          ctx.restore();
          aliveHelmets.push(hs);
        }
      }
      helmetSnapsRef.current = aliveHelmets;

      // 11. RENDER FLOATING TEXTS
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

      // 12. SCREEN-SPACE DAMAGE VIGNETTE FLASH (Tactile Pain Feedback)
      if (damageFlashRef.current > 0 && !reducedMotionRef.current) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0); // screen coordinates
        const cX = canvas.width / 2;
        const cY = canvas.height / 2;
        const rMax = Math.hypot(cX, cY);
        const grad = ctx.createRadialGradient(cX, cY, rMax * 0.45, cX, cY, rMax);
        grad.addColorStop(0, 'rgba(239, 68, 68, 0)');
        grad.addColorStop(1, `rgba(239, 68, 68, ${Math.min(0.65, damageFlashRef.current)})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
        damageFlashRef.current = Math.max(0, damageFlashRef.current - dt * 2.2);
      }

      ctx.restore();
      } catch (err) {
        console.error('Survivors render error:', err);
      }
    };

    requestRef.current = requestAnimationFrame(renderLoop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [playSfx, permanentUpgrades, psiCredits]);

  const exitSession = () => {
    interruptSession();
    audioRef.current.dispose();
    onExit();
  };

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
      onTouchCancel={interruptSession}
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
            <b>{kills} 통제</b>
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
                engine.setPaused(next === 'paused');
                setPhase(next);
              }
            }}
          >
            {phase === 'paused' ? '재개 (P)' : '일시정지 (P)'}
          </button>
          <button type="button" className="survivors-btn-icon" onClick={exitSession}>
            현장 복귀
          </button>
        </div>
      </header>

      {/* COMBO JUICE BANNER */}
      {combo >= 2 && phase === 'playing' && !bossAlert && !evolutionBanner && directorCutinPhase === 'none' && (
        <aside
          className="survivors-combo-banner"
          aria-label="연속 계도 콤보 알림"
          style={{
            position: 'absolute',
            top: 'var(--survivors-hud-bottom, 160px)',
            right: 24,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.95), rgba(217, 119, 6, 0.95))',
            color: '#ffffff',
            padding: '8px 16px',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(245, 158, 11, 0.5), 0 0 0 2px rgba(254, 240, 138, 0.8)',
            fontWeight: 900,
            fontSize: '15px',
            letterSpacing: '0.5px',
            pointerEvents: 'none',
            zIndex: 40,
          }}
        >
          <span style={{ fontSize: '20px' }}>🔥</span>
          <div>
            <div style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
              {combo} COMBO!
            </div>
            <div style={{ fontSize: '10px', opacity: 0.9, fontWeight: 700 }}>
              +{combo * 5}% SAFE POINT BONUS
            </div>
          </div>
        </aside>
      )}

      {/* BOSS ALERT BANNER */}
      {bossAlert && directorCutinPhase === 'none' && (
        <div className="survivors-boss-alert" role="alert">
          <span className="survivors-hazard-stripe" />
          <div className="survivors-boss-alert-text">
            <strong>⚠️ EMERGENCY: {bossAlert} 출현! ⚠️</strong>
            <small>작업반경을 통제하고 정지 지시를 전달하세요!</small>
          </div>
          <span className="survivors-hazard-stripe" />
        </div>
      )}

      {/* SUPER PROTOCOL EVOLUTION BANNER */}
      {evolutionBanner && !bossAlert && directorCutinPhase === 'none' && (
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
              src="/assets/survivors/director-yoon-shout-v2.webp"
              alt="현장소장 윤성호 작업중지권 사자후"
              className="survivors-cutin-portrait"
            />
            <div className="survivors-cutin-textbox">
              <span className="survivors-cutin-kicker">🚨 중대재해 차단 긴급 작업중지권 발동! 🚨</span>
              <h2 className="survivors-cutin-shout">작업중지 돌아버려 씨~!!!</h2>
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
            {/* DYNAMIC HERO KEY VISUAL BANNER (SELECTED PATROL AGENT) */}
            {(() => {
              const activeChar = CHARACTER_PROFILES[selectedChar] || CHARACTER_PROFILES['yoon'];
              return (
                <div className="survivors-monarch-hero-banner" style={{ borderColor: activeChar.color }}>
                  <img
                    src={activeChar.heroBannerUri || activeChar.portraitUri}
                    alt={activeChar.name}
                    className="survivors-monarch-hero-img"
                  />
                  <div className="survivors-monarch-hero-content">
                    <span className="survivors-monarch-badge" style={{ borderColor: activeChar.color, color: activeChar.color }}>
                      🛡️ {activeChar.title}
                    </span>
                    <h3>{activeChar.role} {activeChar.name}</h3>
                    <p>{activeChar.quote}</p>
                    <div className="survivors-monarch-perks">
                      {activeChar.traits.map(t => (
                        <span key={t}>{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

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
              <span className="survivors-section-label">순찰 요원 선택 (스토리 5대 핵심 인물)</span>
              <div className="survivors-char-cards">
                {CANONICAL_CHAR_IDS.map(id => CHARACTER_PROFILES[id]).filter(Boolean).map(char => (
                  <button
                    key={char.id}
                    type="button"
                    className={`survivors-char-card ${selectedChar === char.id ? 'is-selected' : ''}`}
                    onClick={() => {
                      setSelectedChar(char.id);
                      initGame(char.id, selectedStage);
                    }}
                  >
                    <div
                      className="survivors-char-portrait-frame"
                      style={{
                        borderColor: selectedChar === char.id ? char.color : 'rgba(255, 255, 255, 0.2)',
                        boxShadow: selectedChar === char.id ? `0 0 16px ${char.color}` : undefined,
                      }}
                    >
                      <img src={char.portraitUri} alt={char.name} className="survivors-char-portrait-thumb" />
                      <span className="survivors-char-avatar-badge">{char.avatar}</span>
                    </div>
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
                📖 대응 도구 진화 도감
              </button>
              <button type="button" className="survivors-btn-secondary" onClick={exitSession}>
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
              기본 대응 도구 Lv.5 + 지원 퍽을 습득하면 강화 통제 프로토콜이 열립니다!
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
                    engineRef.current.setPaused(false);
                    setPhase('playing');
                    lastTimeRef.current = performance.now();
                  }
                }}
              >
                순찰 재개
              </button>
              <button type="button" className="survivors-btn-secondary" onClick={exitSession}>
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
              <button type="button" className="survivors-btn-secondary" onClick={exitSession}>
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
              <button type="button" className="survivors-btn-secondary" onClick={exitSession}>
                현장 복귀
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

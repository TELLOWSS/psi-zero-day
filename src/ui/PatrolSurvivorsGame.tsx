import { CombatDirection } from './survivors-combat-direction';
import {warningLabelLayout} from './survivors-warning-layout';
import {droneEmissionOrigin} from '../domain/survivors-drone-origin';
import {BossEncounterDirection} from './survivors-boss-direction';
import {INDUSTRIAL_MATERIAL_BOSS_ART,industrialHazardPlacement,type MaterialBossImages} from './survivors-industrial-art';
import { Pause, Play, Package, Shield, ArrowUp, SkipForward } from 'lucide-react';
import { SurvivorsExtractionStatus } from './SurvivorsExtractionStatus';
import focusText from '../../content/localization/survivors-focus-ko.json';
import {CINEMATIC_VFX_ATLAS,cinematicLook,drawDroneEmission,drawPremiumProtocol} from './survivors-cinematic-vfx';
import {SurvivorsPremiumArt, PREMIUM_ATLAS} from './SurvivorsPremiumArt';
import {drawPremiumGear,PREMIUM_MOUNTED_ART} from './survivors-premium-render';
import {drawEquipmentMantle} from './survivors-equipment-identity';
import {ACTOR_RIGS} from './survivors-animation-rig';
import {drawCarriedEquipment} from './survivors-carried-equipment';
import {EquipmentGroundContact} from './survivors-equipment-ground-contact';
import {prepareShockAnimation,prepareBarrierAnimation,prepareDispatchAnimation,preparePremiumPresence,type PremiumPresenceImages} from './survivors-equipment-animation';
import {drawPremiumPresence} from './survivors-premium-presence';
import {applyActorTorsoTransform} from './survivors-rig-renderer';
import {cinematicFlightSelection} from './survivors-vfx-composition';
import {prepareMaterialFragments} from './survivors-material-fragments';
import {METAL_IMPACT_ART} from './survivors-authored-metal-impact';
import {INSPECTION_DRONE_LAUNCH_ART,HUNTER_DRONE_LAUNCH_ART} from './survivors-authored-drone-launch';
import {VOICE_LENS_RELEASE_ART} from './survivors-authored-radio-launch';
import {RadioEmissionProjection,radioToolOffset} from './survivors-tool-emission';
import {groundFacingAngle} from './survivors-ground-projection';
import type {ProjectileFeedback} from '../domain/survivors-projectile-feedback';
import {DEBRIS_IMPACT_ART} from './survivors-authored-debris-impact';
import {VAPOR_IMPACT_ART} from './survivors-authored-vapor-impact';
import {DispatchTrail} from './survivors-dispatch-trail';
import {RecoveryFlow,RECOVERY_CELL_FLOW_ART} from './survivors-recovery-flow';
import {recordPatrolClear,validGrowthRecords,type PatrolClearRecord} from '../domain/survivors-growth';
import {SurvivorsGrowthRecord} from './SurvivorsGrowthRecord';
import growthText from '../../content/localization/survivors-campaign50-ko.json';
import {SurvivorsEquipmentStore} from './SurvivorsEquipmentStore';
import {SurvivorsContainerShop} from './SurvivorsContainerShop';
import {CHARACTER_MAP_ART} from './survivors-character-art';
import {loadAuthoredCommand} from './survivors-authored-command';
import {loadDirectionalActor,isDirectionalActor} from './survivors-directional-art';
import {ultimateSourceObscured} from './survivors-ultimate-release';
import {drawWearableLayer,loadWearableImages,type WearableImages} from './survivors-wearable-art';
import {STORE_ITEMS, recommendedStoreItem, sanitizeInventory, buyStoreItem, equipStoreItem,repairStoreItem,buyAndEquipLoadout,wearStoreItems,itemDurability,STORE_CLEAR_WEAR, type StoreInventory} from '../domain/survivors-store';
import {applyPremiumLoadout} from '../engine/survivors-premium-gear';
import {persistStoreWallet,type StoreWallet} from '../app/survivors-store-wallet';
import storeText from '../../content/localization/survivors-store-ko.json';
import resultText from '../../content/localization/survivors-result-ko.json';
import preflightText from '../../content/localization/survivors-preflight-ko.json';
import challengeText from '../../content/localization/survivors-challenge-ko.json';
import {PATROL_DIFFICULTIES, type PatrolDifficulty} from '../domain/survivors-challenge';
import tacticsText from '../../content/localization/survivors-field-tactics-ko.json';
import operationText from '../../content/localization/survivors-operation-ko.json';
import bossText from '../../content/localization/survivors-boss-ko.json';
import { bossPattern, bossCoreStatus } from '../engine/survivors-boss-pattern';
import {bossCombatReadout,bossCombatHint} from './survivors-boss-readout';
import {drawGangformPattern} from './survivors-gangform-render';
import { operationPlan, operationProgress, operationTiming } from '../engine/survivors-operation';
import {waveDirector,type SurvivorsWave} from '../engine/survivors-difficulty';
import {signatureEventIdentity,signatureEventPlan,type SignatureEventId} from '../engine/survivors-signature-events';
import {signatureCounterplayProfile} from '../engine/survivors-signature-counterplay';
import { drawSceneLighting, drawEquipmentCastShadow } from './survivors-scene-lighting';
import { SurvivorsAccountabilityEvent } from './SurvivorsAccountabilityEvent';
import accountabilityText from '../../content/localization/survivors-accountability-ko.json';
import { ACCOUNTABILITY_CASES, ACCOUNTABILITY_SAVE_KEY, readAccountability, writeAccountability, accountabilityResult, accountabilityMemory } from '../app/survivors-accountability';
import { decideAccountability } from '../domain/survivors-accountability';
import { ProjectileFeedbackLayer } from './survivors-projectile-feedback';
import { drawProjectileVfx } from './survivors-projectile-vfx';
import { equipmentTuning } from '../engine/survivors-equipment-tuning';
import { survivorsCamera } from './survivors-camera';
import campaignText from '../../content/localization/survivors-campaign20-ko.json';
import { drawStageSpatialContext } from './survivors-spatial-context';
import { selectPatrolScore, type PatrolScoreState } from '../domain/survivors-score';
import { drawProp, drawEquipment, registerPropAtlas, registerEvolutionAtlas, registerTacticalEquipmentAtlas, equipmentAppearance, stageGroundUri, PICKUP_ART, EQUIPMENT_ART, EVOLUTION_ART, TACTICAL_EQUIPMENT_ART } from './survivors-equipment-art';
import { drawStageWorkface } from './survivors-stage-art';
import { SurvivorsEquipmentIcon } from './SurvivorsEquipmentIcon';
import { SurvivorsUpgradeStats } from './SurvivorsUpgradeStats';
import { SurvivorsEvolutionPreview } from './SurvivorsEvolutionPreview';
import { debrisElevation, suspendedLoadPose } from './survivors-animation-rig';
import { SpriteMotionTracker, registerSpriteBounds, drawGroundedSprite } from './survivors-sprite-motion';
import {projectileAttackMotion} from './survivors-attack-motion';
import { INDUSTRIAL_HAZARD_ART, INDUSTRIAL_CONTACT_ART, INDUSTRIAL_CRANE_ART, INDUSTRIAL_CRANE_BOSS_ART, INDUSTRIAL_CART_BOSS_ART, drawIndustrialHazard, drawIndustrialCrane, craneArtPose, craneAttackElevation } from './survivors-industrial-art';
import { cacheStageFloor } from './survivors-stage-art';
import { GameManual, gameManualText } from './GameManual';
import combatText from '../../content/localization/survivors-combat-ko.json';
import itemText from '../../content/localization/survivors-items-ko.json';
import { TACTICAL_ITEMS } from '../engine/survivors-items';
import { SurvivorsSupplyGuide } from './SurvivorsSupplyGuide';
import { DIRECTOR_SHOUT_VOICE, SURVIVORS_SCORE_CANDIDATES } from '../app/survivors-audio-manifest';
import { STAGE_IDS, LAST_PATROL_STAGE_KEY, resumePatrolStage, stagesFromSave, parseSave, safeNumber, validStars, validUpgrades } from '../app/survivors-save';
import { SurvivorsSessionAudio } from './survivors-session-audio';
import { SurvivorsAudioMixer } from './SurvivorsAudioMixer';
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import type {
  CharacterId,
  Perk,
  PerkId,
  PermanentUpgrades,
  PatrolStageId,
  SurvivorsGameState,
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
  isCrit?: boolean;
}

export interface ShockwaveRing {
  id: number;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  lineWidth: number;
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
  'safety_monitor',
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
  const shockwavesRef = useRef<ShockwaveRing[]>([]);

  // Keyboard input state
  const keysRef = useRef<{ [key: string]: boolean }>({});

  // Screen shake & Damage Flash
  const screenShakeRef = useRef<number>(0);
  const projectileFeedbackRef = useRef(new ProjectileFeedbackLayer());
  const radioProjectionRef=useRef(new RadioEmissionProjection());
  const impactFeedbackRef = useRef<Array<{x:number;y:number;life:number;duration:number;boss:boolean;critical:boolean;worker:boolean}>>([]);
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
    itemsAtlas?: HTMLImageElement;
    equipmentAtlas?: HTMLImageElement;
    premiumAtlas?: HTMLImageElement;
    premiumMountedAtlas?: HTMLImageElement;
    cinematicAtlas?: HTMLImageElement;
    groundContactAtlas?: HTMLImageElement;
    shockContactAtlas?: HTMLCanvasElement;
    barrierContactAtlas?: HTMLCanvasElement;
    dispatchTrailAtlas?: HTMLCanvasElement;
    premiumPresence?: PremiumPresenceImages;
    industrialHazards?: HTMLImageElement;
    carrierBoss?: HTMLImageElement;
    industrialContacts?: HTMLImageElement;
    metalImpact?: HTMLImageElement;
    debrisImpact?: HTMLImageElement;
    vaporImpact?: HTMLImageElement;
    droneLaunch?: HTMLImageElement;
    hunterLaunch?: HTMLImageElement;
    radioLaunch?: HTMLImageElement;
    recoveryFlow?: HTMLImageElement;
    industrialCrane?: HTMLImageElement;
    craneBoss?: HTMLImageElement;
    materialBosses?:MaterialBossImages;
    wearables?: WearableImages;
    flammableDrum?: HTMLImageElement;
    distributionCabinet?: HTMLImageElement;
    stageFloors: Record<string,HTMLImageElement>;
    workerV2?: HTMLImageElement;
    groundAtlasV2?: HTMLImageElement;
    excavationGround?: HTMLImageElement;
    directorShoutArt?: HTMLImageElement;
    slingChoker?: HTMLImageElement;
    rebarBundle?: HTMLImageElement;
    fanDuct?: HTMLImageElement;
  }>({
    characters: {},
    characterMaps: {},
    stageFloors: {},
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Cache the cut-in during selection so emergency activation never waits for art.
    const directorShoutArt = new Image();
    directorShoutArt.src = '/assets/survivors/director-yoon-shout-v3.webp';
    spritesRef.current.directorShoutArt = directorShoutArt;

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

    const drum = new Image();
    drum.onload = () => { registerPropAtlas(drum,1,1);spritesRef.current.flammableDrum=drum; };
    drum.src='/assets/survivors/flammable-drum-v1.webp';
    const cabinet = new Image();
    cabinet.onload = () => { registerPropAtlas(cabinet,1,1);spritesRef.current.distributionCabinet=cabinet; };
    cabinet.src='/assets/survivors/distribution-cabinet-v1.webp';

    const ground = new Image();
    ground.onload = () => { spritesRef.current.groundV2 = ground; };
    ground.src = '/assets/survivors/stage-01-ground-v2.webp';
    const workerV2 = new Image();
    workerV2.src = '/assets/survivors/worker-korean-v2.webp';
    workerV2.onload = () => { registerSpriteBounds(workerV2); spritesRef.current.workerV2 = workerV2; };
    const excavationGround = new Image();
    excavationGround.src = '/assets/survivors/excavation-ground-v3.webp';
    excavationGround.onload = () => { spritesRef.current.excavationGround = excavationGround; };
    const groundAtlasV2 = new Image();
    groundAtlasV2.src = '/assets/survivors/process-ground-atlas-v2.webp';
    groundAtlasV2.onload = () => { spritesRef.current.groundAtlasV2 = groundAtlasV2; };
    const atlas = new Image();
    atlas.onload = () => { spritesRef.current.riskAtlasV2 = atlas; };
    const items = new Image();
    items.onload = () => { registerPropAtlas(items,4,2); spritesRef.current.itemsAtlas = items; };
    items.src = PICKUP_ART;
    const equipment = new Image();
    const evolution = new Image();
    const tactical = new Image();
    tactical.onload = () => { if(equipment.naturalWidth) registerTacticalEquipmentAtlas(equipment,tactical); };
    evolution.onload = () => { if(equipment.naturalWidth) registerEvolutionAtlas(equipment,evolution); };
    equipment.onload = () => { registerPropAtlas(equipment,3,5); if(evolution.naturalWidth) registerEvolutionAtlas(equipment,evolution); if(tactical.naturalWidth) registerTacticalEquipmentAtlas(equipment,tactical); spritesRef.current.equipmentAtlas = equipment; };
    evolution.src = EVOLUTION_ART;
    tactical.src = TACTICAL_EQUIPMENT_ART;
    equipment.src = EQUIPMENT_ART;
    const premium = new Image();
    premium.onload = () => {spritesRef.current.premiumAtlas=premium;};
    premium.src = PREMIUM_ATLAS;
    const mountedPremium = new Image();
    mountedPremium.onload = () => { registerPropAtlas(mountedPremium,4,4); spritesRef.current.premiumMountedAtlas=mountedPremium; };
    mountedPremium.src=PREMIUM_MOUNTED_ART;
    const cinematic = new Image();
    cinematic.onload=()=>{spritesRef.current.cinematicAtlas=cinematic;};
    const groundContact = new Image();
    groundContact.onload=()=>{spritesRef.current.groundContactAtlas=groundContact;};
    groundContact.src='/assets/survivors/equipment-ground-contact-v1.png';
    const shockContact = new Image();
    shockContact.onload=()=>{spritesRef.current.shockContactAtlas=prepareShockAnimation(shockContact);};
    shockContact.src='/assets/survivors/shock-mantle-discharge-v1.png';
    const barrierContact = new Image();
    barrierContact.onload=()=>{spritesRef.current.barrierContactAtlas=prepareBarrierAnimation(barrierContact);};
    barrierContact.src='/assets/survivors/barrier-forge-deploy-v1.png';
    const dispatchTrail = new Image();
    dispatchTrail.onload=()=>{spritesRef.current.dispatchTrailAtlas=prepareDispatchAnimation(dispatchTrail);};
    dispatchTrail.src='/assets/survivors/dispatch-drive-wake-v1.png';
    const premiumPresence = new Image();
    premiumPresence.onload=()=>{spritesRef.current.premiumPresence=preparePremiumPresence(premiumPresence);};
    premiumPresence.src='/assets/survivors/premium-presence-v1.png';
    const industrialHazards = new Image(); industrialHazards.src = INDUSTRIAL_HAZARD_ART;
    industrialHazards.onload = () => { registerPropAtlas(industrialHazards,3,2); spritesRef.current.industrialHazards = industrialHazards; };
    const carrierBoss=new Image();carrierBoss.src=INDUSTRIAL_CART_BOSS_ART;
    carrierBoss.onload=()=>{registerPropAtlas(carrierBoss,1,1);spritesRef.current.carrierBoss=carrierBoss;};
    const industrialContacts = new Image(); industrialContacts.src = INDUSTRIAL_CONTACT_ART;
    industrialContacts.onload = () => { registerPropAtlas(industrialContacts,3,2);prepareMaterialFragments(industrialContacts); spritesRef.current.industrialContacts = industrialContacts; };
    const metalImpact=new Image();metalImpact.onload=()=>{spritesRef.current.metalImpact=metalImpact;};metalImpact.src=METAL_IMPACT_ART;
    const debrisImpact=new Image();debrisImpact.onload=()=>{spritesRef.current.debrisImpact=debrisImpact;};debrisImpact.src=DEBRIS_IMPACT_ART;
    const vaporImpact=new Image();vaporImpact.onload=()=>{spritesRef.current.vaporImpact=vaporImpact;};vaporImpact.src=VAPOR_IMPACT_ART;
    const droneLaunch=new Image();droneLaunch.onload=()=>{spritesRef.current.droneLaunch=droneLaunch;};droneLaunch.src=INSPECTION_DRONE_LAUNCH_ART;
    const hunterLaunch=new Image();hunterLaunch.onload=()=>{spritesRef.current.hunterLaunch=hunterLaunch;};hunterLaunch.src=HUNTER_DRONE_LAUNCH_ART;
    const radioLaunch=new Image();radioLaunch.onload=()=>{spritesRef.current.radioLaunch=radioLaunch;};radioLaunch.src=VOICE_LENS_RELEASE_ART;
    const recoveryFlow=new Image();recoveryFlow.onload=()=>{spritesRef.current.recoveryFlow=recoveryFlow;};recoveryFlow.src=RECOVERY_CELL_FLOW_ART;
    const industrialCrane = new Image(); industrialCrane.src = INDUSTRIAL_CRANE_ART;
    industrialCrane.onload = () => { registerPropAtlas(industrialCrane,1,1); spritesRef.current.industrialCrane = industrialCrane; };
    const craneBoss=new Image();craneBoss.src=INDUSTRIAL_CRANE_BOSS_ART;
    craneBoss.onload=()=>{registerPropAtlas(craneBoss,1,1);spritesRef.current.craneBoss=craneBoss;};
    for(const [type,url] of Object.entries(INDUSTRIAL_MATERIAL_BOSS_ART)){
      const image=new Image();image.src=url;
      image.onload=()=>{registerPropAtlas(image,1,1);(spritesRef.current.materialBosses??={})[type as keyof MaterialBossImages]=image;};
    }
    cinematic.src=CINEMATIC_VFX_ATLAS;
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
  useEffect(()=>{
    if(spritesRef.current.characterMaps[selectedChar])return;
    let cancelled=false;const actor=new Image();
    actor.onload=()=>{
      if(cancelled)return;
      void (async()=>{
        const directional=await loadDirectionalActor(actor);
        if(cancelled)return;
        if(!directional){registerSpriteBounds(actor);await loadAuthoredCommand(actor);}
        if(!cancelled)spritesRef.current.characterMaps[selectedChar]=actor;
      })();
    };
    actor.src=CHARACTER_MAP_ART[selectedChar];
    return ()=>{cancelled=true;};
  },[selectedChar]);
  useEffect(() => {
    let disposed = false;
    void loadWearableImages(selectedChar).then(images => { if (!disposed) spritesRef.current.wearables = images; });
    return () => { disposed = true; };
  }, [selectedChar]);
  const [accountability,setAccountability]=useState(()=>{try{return readAccountability(localStorage.getItem(ACCOUNTABILITY_SAVE_KEY));}catch{return readAccountability(null);}});
  const [accountabilityCase,setAccountabilityCase]=useState<typeof ACCOUNTABILITY_CASES[number]|null>(null);
  const accountabilityRef=useRef(accountability);accountabilityRef.current=accountability;
  const accountabilityCaseRef=useRef(accountabilityCase);accountabilityCaseRef.current=accountabilityCase;
  const [selectedDifficulty, setSelectedDifficulty] = useState<PatrolDifficulty>('standard');
  const [selectedStage, setSelectedStage] = useState<PatrolStageId>(() => {
    try {
      return resumePatrolStage(localStorage.getItem(LAST_PATROL_STAGE_KEY),
        parseSave(localStorage.getItem(STORAGE_KEY_UNLOCKED_STAGES)),
        parseSave(localStorage.getItem(STORAGE_KEY_STAGE_STARS)));
    } catch { return 'stage_01'; }
  });
  const [loadedGround, setLoadedGround] = useState<string | null>(null);
  const [failedGround, setFailedGround] = useState<string | null>(null);
  const [groundRetry, setGroundRetry] = useState(0);
  useEffect(() => {
    const uri=stageGroundUri(selectedStage);
    const cached = spritesRef.current.stageFloors[uri];
    const pinned=engineRef.current?stageGroundUri(engineRef.current.state.stageId):undefined;
    if (cached?.naturalWidth) {cacheStageFloor(spritesRef.current.stageFloors,uri,cached,pinned);setLoadedGround(uri); setFailedGround(null); return;}
    let active = true; const image = new Image();
    image.onload = () => {if (active) {setLoadedGround(uri); setFailedGround(null);}};
    image.onerror = () => {if (active) setFailedGround(uri);};
    cacheStageFloor(spritesRef.current.stageFloors,uri,image,pinned); image.src = uri;
    return () => {active = false;};
  },[selectedStage, groundRetry]);
  useEffect(() => {
    const scrollY=window.scrollY,overflow=document.body.style.overflow;
    document.body.style.overflow='hidden';window.scrollTo?.(0,0);
    return ()=>{document.body.style.overflow=overflow;window.scrollTo?.(0,scrollY);};
  },[]);

  const [unlockedStages, setUnlockedStages] = useState<PatrolStageId[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_UNLOCKED_STAGES);
      return stagesFromSave(parseSave(saved), parseSave(localStorage.getItem(STORAGE_KEY_STAGE_STARS)));
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
  const [growthRecords,setGrowthRecords]=useState<PatrolClearRecord[]>(()=>{
    try{return validGrowthRecords(parseSave(localStorage.getItem('psi.survivors.growth_v1')));}catch{return [];}
  });
  const growthRef=useRef(growthRecords);growthRef.current=growthRecords;
  const stageReplayRef=useRef(stageStars);stageReplayRef.current=stageStars;
  const [growthSaveFailed,setGrowthSaveFailed]=useState(false);
  const [stageChapter,setStageChapter]=useState(() => Math.floor(STAGE_IDS.indexOf(selectedStage) / 10));
  const chapterTabsRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const node=chapterTabsRef.current;if(!node)return;
    const reveal=()=>node.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView?.({block:'nearest',inline:'nearest'});
    reveal();
    if(typeof ResizeObserver==='undefined')return;
    const observer=new ResizeObserver(reveal);observer.observe(node);
    return ()=>observer.disconnect();
  },[stageChapter]);
  const persistGrowth=(records:PatrolClearRecord[])=>{
    try{localStorage.setItem('psi.survivors.growth_v1',JSON.stringify(records));setGrowthSaveFailed(false);}
    catch{setGrowthSaveFailed(true);}
  };
  const [permanentUpgrades, setPermanentUpgrades] = useState<PermanentUpgrades>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_UPGRADES);
      return validUpgrades(parseSave(saved));
    } catch {
      return DEFAULT_PERMANENT_UPGRADES;
    }
  });
  const [storeInventory, setStoreInventory] = useState<StoreInventory>(() => {
    try { return sanitizeInventory(JSON.parse(localStorage.getItem('psi.survivors.store_wallet') || 'null')?.inventory); } catch { return {owned:[],equipped:[]}; }
  });
  const inventoryRef = useRef(storeInventory);
  const [storeMessage, setStoreMessage] = useState('');
  const [psiCredits, setPsiCredits] = useState<number>(() => {
    try {
      const wallet = JSON.parse(localStorage.getItem('psi.survivors.store_wallet') || 'null');
      const saved = wallet && Number.isFinite(wallet.credits) ? String(Math.max(0,wallet.credits)) : localStorage.getItem(STORAGE_KEY_CREDITS);
      return safeNumber(saved);
    } catch {
      return 0;
    }
  });

  const creditsRef = useRef(psiCredits);

  // Modal Views in Ready screen
  const [showManual, setShowManual] = useState(false);
  const [showRdModal, setShowRdModal] = useState(false);
  const [showArsenalModal, setShowArsenalModal] = useState(false);
  const arsenalDialogRef = useRef<HTMLDivElement>(null);
  const upgradeDialogRef = useRef<HTMLDivElement>(null);
  const resultDialogRef = useRef<HTMLDivElement>(null);
  const groundContactRef = useRef(new EquipmentGroundContact());
  const dispatchTrailRef = useRef(new DispatchTrail());
  const recoveryFlowRef = useRef(new RecoveryFlow());
  const [phase, setPhase] = useState<'ready' | 'playing' | 'paused' | 'levelup' | 'victory' | 'defeat'>('ready');
  const storeOpenRef=useRef(false);storeOpenRef.current=showRdModal || showArsenalModal;
  const pendingStoreConfirmationRef=useRef(false);
  const [clearGearWear,setClearGearWear]=useState<string[]>([]);
  const storeDialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!showRdModal && !showArsenalModal) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = showRdModal ? storeDialogRef.current : arsenalDialogRef.current; if (!dialog) return;
    dialog.querySelector<HTMLButtonElement>('button')?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {event.preventDefault(); setShowRdModal(false); setShowArsenalModal(false); return;}
      if (event.key !== 'Tab') return;
      const elements = [...dialog.querySelectorAll<HTMLElement>('button:not(:disabled), select, input, summary, [tabindex="0"]')].filter(element => element.getClientRects().length > 0);
      const first = elements[0], last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {event.preventDefault(); last?.focus();}
      else if (!event.shiftKey && document.activeElement === last) {event.preventDefault(); first?.focus();}
    };
    document.addEventListener('keydown', onKey);
    return () => {document.removeEventListener('keydown', onKey); previous?.focus();};
  }, [showRdModal, showArsenalModal]);
  useEffect(() => {
    if (phase !== 'levelup') return;
    const dialog = upgradeDialogRef.current;
    if (!dialog) return;
    dialog.querySelector<HTMLButtonElement>('button')?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const buttons = [...dialog.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [phase]);

  // Virtual Touch Joystick state
  useEffect(() => {
    if (phase !== 'victory' && phase !== 'defeat') return;
    const dialog = resultDialogRef.current;
    if (!dialog) return;
    const previous = document.activeElement as HTMLElement | null;
    dialog.querySelector<HTMLButtonElement>('.survivors-result-actions button')?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const buttons = [...dialog.querySelectorAll<HTMLElement>('button:not(:disabled), [tabindex="0"]')];
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (!dialog.contains(document.activeElement)) {
        event.preventDefault(); (event.shiftKey ? last : first)?.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); if (previous?.isConnected) previous.focus(); };
  }, [phase]);

  const touchIdRef = useRef<number | null>(null);
  const touchCenterRef = useRef<{ x: number; y: number } | null>(null);
  const touchVectorRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const joystickKnobRef = useRef<HTMLDivElement>(null);
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
  const [preflightTab, setPreflightTab] = useState<'brief'|'stage'|'agent'|'settings'>('brief');
  const [readyMusic, setReadyMusic] = useState(true);
  const [lastDamage, setLastDamage] = useState<SurvivorsGameState['lastDamage']>();
  const [missionProgress, setMissionProgress] = useState(PATROL_STAGES[selectedStage].starChallenges.map(goal => ({ ...goal })));
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
    grouting_gun: 0,
    emp_generator: 0,
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
    hydraulic_ram: 0,
    plasma_grid: 0,
  });

  // Ultimate Director Roar & Boss Alert Mirrors
  const [ultimateCharge, setUltimateCharge] = useState(0);
  const [directorCutinPhase, setDirectorCutinPhase] = useState<'none' | 'cutin' | 'shout' | 'invert' | 'recovering'>('none');
  const [evolutionBanner, setEvolutionBanner] = useState<{ title: string; subtitle: string; icon: string; equipmentId?: PerkId } | null>(null);
  const [bossAlert, setBossAlert] = useState<string | null>(null);
  const [bossRisk, setBossRisk] = useState<number | null>(null);
  const [bossBeat, setBossBeat] = useState('');
  const [bossSecured,setBossSecured]=useState(false);
  const [encounterRemaining,setEncounterRemaining]=useState(0);

  // Wave Progression & Container Shop
  const [showContainerShop, setShowContainerShop] = useState(false);
  const [containerShopWave, setContainerShopWave] = useState(1);
  const [availableContainerShopWave, setAvailableContainerShopWave] = useState<number | null>(null);
  const [waveSupplyNotice, setWaveSupplyNotice] = useState<{ wave: number; credits: number } | null>(null);
  const [waveDirectorNotice,setWaveDirectorNotice]=useState<{wave:SurvivorsWave;title:string;detail:string}|null>(null);
  const [signatureEvent,setSignatureEvent]=useState<SurvivorsGameState['signatureEvent']>();
  const [signatureCounterplay,setSignatureCounterplay]=useState<SurvivorsGameState['signatureCounterplay']>();
  const [signatureCounterplayBuffs,setSignatureCounterplayBuffs]=useState<SurvivorsGameState['signatureCounterplayBuffs']>();
  const [signatureMastery,setSignatureMastery]=useState<SurvivorsGameState['signatureMastery']>();
  const signatureCinematicRef=useRef('');
  const masteryCinematicRef=useRef('');
  const signaturePressureRef=useRef(0);
  const [currentWave, setCurrentWave] = useState<SurvivorsWave>(1);
  const currentWaveRef=useRef<SurvivorsWave>(1);
  const wave1ShopTriggeredRef = useRef(false);
  const wave2ShopTriggeredRef = useRef(false);

  // Extraction Climax (긴급 탈출 · 인계 클라이맥스) State & Refs
  const [extractionState, setExtractionState] = useState<{
    active: boolean;
    countdown: number;
    playerInside: boolean;
    status: 'inbound' | 'active' | 'secured';
  }>({ active: false, countdown: 15, playerInside: false, status: 'inbound' });
  const extractionTimerRef = useRef(15);
  const extractionTriggeredRef = useRef(false);
  const extractionCompletedRef = useRef(false);

  // Save Meta Progress to LocalStorage
  const saveMetaProgress = (newUpgrades: PermanentUpgrades, newCredits: number, inventory:StoreInventory=inventoryRef.current) => {
    try {persistStoreWallet({credits:newCredits,inventory});}catch{setStoreMessage(storeText.failure);return false;}
    setPermanentUpgrades(newUpgrades);
    setPsiCredits(newCredits);
    creditsRef.current = newCredits;
    inventoryRef.current=inventory;setStoreInventory(inventory);
    try {
      localStorage.setItem(STORAGE_KEY_UPGRADES, JSON.stringify(newUpgrades));
    } catch {
      // LocalStorage unavailable
    }
    return true;
  };

  const commitStoreChange=(result:StoreWallet|null,message:string)=>{
    if(!result){setStoreMessage(storeText.repairFirst);audioRef.current.playRecordedEffect('ui_denied');return;}
    const engine=engineRef.current;
    if(engine&&engine.state.phase!=='ready'&&engine.state.phase!=='paused'){setStoreMessage(storeText.failure);return;}
    try {
      persistStoreWallet(result);
    } catch { setStoreMessage(storeText.failure);audioRef.current.playRecordedEffect('ui_denied'); return; }
    inventoryRef.current = result.inventory;
    setStoreInventory(result.inventory);
    creditsRef.current = result.credits;
    setPsiCredits(result.credits);
    if(engine?.state.phase==='paused'){
      applyPremiumLoadout(engine.state,result.inventory);
      setHp(engine.state.player.hp);setMaxHp(engine.state.player.maxHp);
    }
    setStoreMessage(engine?.state.phase==='paused'?`${message} · ${storeText.liveApplied}`:message);
    if(engine?.state.phase==='ready')pendingStoreConfirmationRef.current=true;
    else audioRef.current.playRecordedEffect('ui_equip');
  };
  const changeStore = (id: string, purchase: boolean) => {
    const result=purchase?buyStoreItem(inventoryRef.current,creditsRef.current,id):{inventory:equipStoreItem(inventoryRef.current,id),credits:creditsRef.current};
    commitStoreChange(result,purchase?storeText.purchased:result?.inventory.equipped.includes(id)?storeText.equipSuccess:storeText.removeSuccess);
  };
  const repairStore=(id:string)=>commitStoreChange(repairStoreItem(inventoryRef.current,creditsRef.current,id),storeText.repaired);
  const applyStore=(ids:string[])=>commitStoreChange(buyAndEquipLoadout(inventoryRef.current,creditsRef.current,ids),storeText.appliedLoadout);
  const openStore=()=>{
    void audioRef.current.preloadEquipmentRecordings();
    const engine=engineRef.current;
    if(engine?.state.bossEncounter&&engine.state.bossEncounter.phase!=='combat')return;
    if(engine?.state.phase==='playing'){engine.setPaused(true);setPhase('paused');}
    if(engine&&engine.state.phase!=='ready'&&engine.state.phase!=='paused')return;
    keysRef.current={};touchVectorRef.current={x:0,y:0};setStoreMessage('');setShowRdModal(true);
  };
  const openContainerShop=()=>{
    const engine=engineRef.current;
    if(!engine || availableContainerShopWave===null || showRdModal || showArsenalModal || accountabilityCase)return;
    if(engine.state.phase==='playing'){engine.setPaused(true);setPhase('paused');}
    if(engine.state.phase!=='paused')return;
    keysRef.current={};touchVectorRef.current={x:0,y:0};
    setContainerShopWave(availableContainerShopWave);
    setAvailableContainerShopWave(null);
    setShowContainerShop(true);
  };
  const openArsenal=()=>{
    const engine=engineRef.current;
    if(engine?.state.bossEncounter&&engine.state.bossEncounter.phase!=='combat')return;
    if (showRdModal || accountabilityCase) return;
    if(engine?.state.phase==='playing'){engine.setPaused(true);setPhase('paused');}
    if(engine&&engine.state.phase!=='ready'&&engine.state.phase!=='paused')return;
    if(engine)setActivePerks({...engine.state.activePerks});
    keysRef.current={};touchVectorRef.current={x:0,y:0};
    setShowArsenalModal(true);
  };

  const audioRef = useRef(new SurvivorsSessionAudio());
  const scoreStateRef = useRef<PatrolScoreState>('foundation');
  const scoreEncounterRef = useRef<string | undefined>(undefined);
  const scoreCheckRef = useRef(0);
  const storyRadioRef=useRef(new WeakSet<SurvivorsEngine>());
  const playScore = (name: string, seconds?: number) => {
    const asset = SURVIVORS_SCORE_CANDIDATES.find(a => a.id === `patrol.${name}`);
    if (asset) void audioRef.current.auditionScore(asset, seconds);
  };
  const sfxTimesRef = useRef(new Map<string, number>());
  const rewardedRef = useRef(new WeakSet<SurvivorsEngine>());
  useEffect(() => () => audioRef.current.dispose(), []);
  useEffect(() => {
    // Scheduled music waits silently for browser permission, then resumes on ordinary interaction.
    const unlock = () => { audioRef.current.getContext(); };
    window.addEventListener('pointerdown', unlock, true);
    return () => {
      window.removeEventListener('pointerdown', unlock, true);
    };
  }, []);
  useEffect(() => { audioRef.current.setMuted(audioMuted); if ((phase === 'paused'&&!accountabilityCase)||phase === 'ready') audioRef.current.silence(); }, [audioMuted, phase, accountabilityCase]);

  // Supplied event recordings replace their synth cues; remaining equipment effects are procedural.
  const playSfx = useCallback((type: 'impact' | 'control' | 'control_heavy' | 'shoot' | 'spray' | 'hit' | 'pickup' | 'levelup' | 'defeat' | 'win' | 'laser' | 'boss_alarm' | 'shout' | 'evolution' | 'mastery', position?: { x: number; y: number }) => {
    if (audioMuted) return;
    try {
      const ctx = audioRef.current.getContext();
      if (!ctx) return;
      if (type === 'evolution') {
        const cue=SURVIVORS_SCORE_CANDIDATES.find(a=>a.id==='patrol.evolution');
        if(cue)void audioRef.current.auditionCue(cue,3);
        return;
      }
      if(type==='mastery'){
        const now=ctx.currentTime;
        audioRef.current.duckMusic(1.1);
        [261.63,392,523.25,783.99].forEach((freq,idx)=>{
          const osc=ctx.createOscillator(),gain=ctx.createGain(),t=now+idx*.055;
          osc.type=idx<2?'triangle':'sine';
          osc.frequency.setValueAtTime(freq,t);
          gain.gain.setValueAtTime(.001,t);
          gain.gain.linearRampToValueAtTime(idx===3?.34:.24,t+.018);
          gain.gain.exponentialRampToValueAtTime(.001,t+.34);
          if(!audioRef.current.track(osc,gain,4))return;
          osc.connect(gain);audioRef.current.connectSfx(osc,gain,position,engineRef.current?.state.player);
          osc.start(t);osc.stop(t+.35);
        });
        return;
      }
      if(type==='win'||type==='defeat')return;
      if(type==='boss_alarm'&&audioRef.current.playRecordedEffect('boss_alert',position,engineRef.current?.state.player)){audioRef.current.duckMusic(1.5);return;}
      if(type==='shout'||type==='boss_alarm'){
        const cue=SURVIVORS_SCORE_CANDIDATES.find(a=>a.id===`patrol.${type==='shout'?'intervention':'boss_alert'}`);
        if(cue)void audioRef.current.auditionCue(cue);
        if(type==='shout')void audioRef.current.playApproved([DIRECTOR_SHOUT_VOICE]);
        return;
      }
      const now = ctx.currentTime;
      const interval = type === 'impact' ? .06 : type === 'control_heavy' ? .5 : type === 'pickup' || type === 'control' ? 0.12 : type === 'shoot' || type === 'spray' || type === 'laser' ? 0.08 : 0;
      const previous = sfxTimesRef.current.get(type);
      if (interval && previous !== undefined && now >= previous && now - previous < interval) return;
      sfxTimesRef.current.set(type, now);
      const priority = type === 'control_heavy' || type === 'hit' ? 3 : type === 'pickup' || type === 'levelup' ? 2 : 1;
      const listener = engineRef.current?.state.player;
      if(type==='pickup'&&audioRef.current.playRecordedEffect('pickup',position,listener))return;
      if(type==='hit'&&audioRef.current.playRecordedEffect('player_hit',position,listener))return;

      if (type === 'impact') {
        const osc=ctx.createOscillator(), gain=ctx.createGain();osc.type='triangle';osc.frequency.setValueAtTime(260,now);osc.frequency.exponentialRampToValueAtTime(70,now+.085);gain.gain.setValueAtTime(.12,now);gain.gain.exponentialRampToValueAtTime(.005,now+.1);
        if(!audioRef.current.track(osc,gain,priority))return;osc.connect(gain);audioRef.current.connectSfx(osc,gain,position,listener);osc.start(now);osc.stop(now+.1);
      } else if (type === 'shoot') {
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
      } else if (type === 'pickup' || type === 'control') {
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
      } else if (type === 'control_heavy' || type === 'levelup') {
        const notes = type === 'control_heavy' ? [220,330,440] : [440, 554.37, 659.25, 880, 1108.73];
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
      } else if (type === 'hit') {
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
      }
    } catch (err) {
      audioRef.current.reportFailure(String(err));
    }
  }, [audioMuted]);

  // Floating text & particle helpers
  const spawnFloating = (x: number, y: number, text: string, color = '#fbbf24', isCrit = false) => {
    floatingTextsRef.current = floatingTextsRef.current.slice(-12);
    floatingTextsRef.current.push({
      id: floatingIdRef.current++,
      x,
      y,
      text,
      color,
      life: isCrit ? 1.0 : 0.75,
      maxLife: isCrit ? 1.0 : 0.75,
      isCrit,
    });
  };

  const spawnShockwave = (x: number, y: number, color = '#38bdf8', maxRadius = 60, lineWidth = 3.5, life = 0.35) => {
    shockwavesRef.current.push({
      id: Date.now() + Math.random(),
      x,
      y,
      radius: 8,
      maxRadius,
      color,
      lineWidth,
      life,
      maxLife: life,
    });
    if (shockwavesRef.current.length > 25) shockwavesRef.current.shift();
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
    const replay=Boolean(stageReplayRef.current[stageId]?.[0])||growthRef.current.some(record=>record.stageId===stageId);
    const engine = new SurvivorsEngine(createInitialSurvivorsState(charId, permanentUpgrades, stageId, selectedDifficulty, storeInventory), crypto.getRandomValues(new Uint32Array(1))[0],replay);
    audioRef.current.silence();
    floatingTextsRef.current = [];
    particlesRef.current = [];
    shockwavesRef.current = [];
    extractionTriggeredRef.current = false;
    extractionCompletedRef.current = false;
    extractionTimerRef.current = 15;
    setExtractionState({ active: false, countdown: 15, playerInside: false, status: 'inbound' });
    helmetSnapsRef.current = [];
    approvedStampsRef.current = [];
    setCombo(0);
    setClearGearWear([]);
    setLastDamage(undefined);
    setMissionProgress(engine.state.stage.starChallenges.map(goal => ({ ...goal })));
    setEvolutionBanner(null);
    setBossAlert(null);
    setBossSecured(false);
    impactFeedbackRef.current=[];
    projectileFeedbackRef.current.clear();
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
    wave1ShopTriggeredRef.current = false;
    wave2ShopTriggeredRef.current = false;
    setShowContainerShop(false);
    setAvailableContainerShopWave(null);
    setWaveSupplyNotice(null);
    setWaveDirectorNotice(null);
    setSignatureEvent(undefined);
    setSignatureCounterplay(undefined);
    setSignatureCounterplayBuffs(undefined);
    setSignatureMastery(undefined);
    signatureCinematicRef.current='';
    masteryCinematicRef.current='';
    signaturePressureRef.current=0;
    currentWaveRef.current=1;
    setCurrentWave(1);
    setContainerShopWave(1);
  }, [selectedChar, selectedStage, permanentUpgrades, selectedDifficulty, storeInventory]);

  useEffect(() => {
    if (!engineRef.current || engineRef.current.state.phase === 'ready') initGame(selectedChar, selectedStage);
    if(pendingStoreConfirmationRef.current){pendingStoreConfirmationRef.current=false;audioRef.current.playRecordedEffect('ui_equip');}
  }, [initGame, selectedChar, selectedStage]);

  useEffect(() => {
    if (!waveSupplyNotice) return;
    const timer = window.setTimeout(() => setWaveSupplyNotice(null), 4200);
    return () => window.clearTimeout(timer);
  }, [waveSupplyNotice]);

  useEffect(() => {
    if (!waveDirectorNotice) return;
    const timer=window.setTimeout(()=>setWaveDirectorNotice(null),3000);
    return ()=>window.clearTimeout(timer);
  },[waveDirectorNotice]);

  // Initialization cancels the old session's audio; schedule its replacement afterwards.
  useEffect(() => {
    if(accountabilityCase&&!audioMuted){playScore('pressure');audioRef.current.setDialogueFocus(true);return;}
    if (audioMuted || phase === 'paused' || phase === 'levelup' || (phase === 'ready'&&!readyMusic)) { audioRef.current.stopScore(); return; }
    if (phase === 'ready') playScore('ready');
    if (phase === 'playing') playScore(scoreStateRef.current);
    if (phase === 'victory') playScore('success', 12);
    if (phase === 'defeat') playScore('failure', 10);
  }, [phase, audioMuted, accountabilityCase, readyMusic, initGame]);

  const beginPatrol = () => {
    if (!engineRef.current) return;
    // Browsing another map must not replace the last actually played operation.
    try { localStorage.setItem(LAST_PATROL_STAGE_KEY, engineRef.current.state.stageId); } catch { /* Play remains available without storage. */ }
    void audioRef.current.preloadApproved([DIRECTOR_SHOUT_VOICE]);
    void audioRef.current.preloadCandidates(SURVIVORS_SCORE_CANDIDATES.filter(asset=>!asset.loop));
    void audioRef.current.preloadEquipmentRecordings();
    scoreStateRef.current = 'foundation'; scoreCheckRef.current = 0;scoreEncounterRef.current=undefined;
    const opening=waveDirector(0,engineRef.current.state.maxTime);
    currentWaveRef.current=1;setCurrentWave(1);
    setWaveDirectorNotice({wave:1,title:opening.title,detail:opening.detail});
    engineRef.current.start();
    setPhase('playing');
    lastTimeRef.current = performance.now();
  };

  const startGame = () => beginPatrol();

  // Trigger Director Roaring Shout Ultimate
  const handleTriggerDirectorShout = () => {
    const engine = engineRef.current;
    if (!engine) return;
    if (engine.state.ultimateCharge < engine.state.maxUltimateCharge) return;

    const ok = engine.triggerDirectorShout();
    if (ok) {

      screenShakeRef.current = 24;
      spawnParticles(engine.state.player.x, engine.state.player.y, '#f59e0b', 40, 160, 5);
      spawnFloating(engine.state.player.x, engine.state.player.y - 40, combatText.shout_activated, '#f59e0b', true);
    }
  };

  // Perk Selection handler
  const handleSelectPerk = (perkId: PerkId) => {
    const engine = engineRef.current;
    if (!engine) return;
    keysRef.current = {};
    touchVectorRef.current = { x: 0, y: 0 };

    const meta = PERK_CATALOG[perkId];
    engine.applyPerk(perkId);
    setLevel(engine.state.level);
    setExp(engine.state.currentExp);
    setNextExp(engine.state.nextLevelExp);
    if (engine.state.phase === 'levelup') setPerkOptions([...engine.state.perkOptions]);

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

  const inputActionsRef = useRef({shout: handleTriggerDirectorShout, reroll: handleRerollPerks, select: handleSelectPerk});
  useEffect(() => {
    inputActionsRef.current = {shout: handleTriggerDirectorShout, reroll: handleRerollPerks, select: handleSelectPerk};
  });

  // Install once; actions read current engine state instead of render snapshots.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      audioRef.current.getContext();
      if(storeOpenRef.current)return;
      if (e.defaultPrevented || (e.target instanceof HTMLElement && e.target.closest('input, textarea, select, [role="dialog"]'))) return;
      if (e.target instanceof HTMLElement && e.target.closest('button, summary') && (e.code === 'Space' || e.code === 'Enter')) return;
      const engine = engineRef.current;
      if (engine?.state.phase === 'levelup' && !e.repeat) {
        const match = /^(?:Digit|Numpad)([123])$/.exec(e.code);
        const option = match ? engine.state.perkOptions[Number(match[1]) - 1] : undefined;
        if (option) { e.preventDefault(); inputActionsRef.current.select(option.id); return; }
        if (e.code === 'KeyR') { e.preventDefault(); inputActionsRef.current.reroll(); return; }
      }
      if(accountabilityCaseRef.current)return;
      if(engine?.state.phase==='playing'&&!e.repeat) {
        if(e.code==='KeyQ'){e.preventDefault();engine.requestSupport();return;}
        if(e.code==='KeyE'){e.preventDefault();engine.deployControlLine();return;}
        if(e.code==='KeyX'){e.preventDefault();if(engine.state.fieldTactics?.handoff)engine.cancelHandoff();else engine.requestHandoff();return;}
        if(e.code==='ShiftLeft'||e.code==='ShiftRight'||e.code==='KeyC'){e.preventDefault();engine.triggerPlayerDash();return;}
      }
      keysRef.current[e.code] = true;
      if (engine?.state.phase === 'playing' && ['Space', 'ShiftLeft', 'ShiftRight', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
      if ((e.code === 'Escape' || e.code === 'KeyP') && !e.repeat) {
        const engine = engineRef.current;
        if (engine && (engine.state.phase === 'playing' || engine.state.phase === 'paused')) {
          const next = engine.state.phase === 'playing' ? 'paused' : 'playing';
          engine.setPaused(next === 'paused');
          setPhase(next);
        }
      }
      if ((e.code === 'Space' || e.code === 'KeyF') && !e.repeat) {
        const engine = engineRef.current;
        if (engine && engine.state.phase === 'playing') {
          if (engine.state.ultimateCharge >= engine.state.maxUltimateCharge) {
            inputActionsRef.current.shout();
          } else if (e.code === 'Space') {
            engine.triggerPlayerDash();
          }
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
        const deadzone = 4;

        let knobX = touch.clientX;
        let knobY = touch.clientY;
        if (dist > maxRadius) {
          const angle = Math.atan2(dy, dx);
          knobX = touchCenterRef.current.x + Math.cos(angle) * maxRadius;
          knobY = touchCenterRef.current.y + Math.sin(angle) * maxRadius;
        }

        // Touch input stays synchronous; moving the knob must not rerender the full game UI.
        if(joystickKnobRef.current)joystickKnobRef.current.style.transform=`translate3d(${knobX-touchCenterRef.current.x}px,${knobY-touchCenterRef.current.y}px,0)`;

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

    let motions = new SpriteMotionTracker();
    let direction = new CombatDirection();
    let bossDirection=new BossEncounterDirection();
    let lastHudTime = -Infinity;
    let previousEngine: SurvivorsEngine | null = null;
    let prevNeutralized = 0;
    let prevHp = 100;
    let prevLevel = 1;
    let facingAngle = 0;
    let directorWasObscured=false;

    const renderLoop = (time: number) => {
      requestRef.current = requestAnimationFrame(renderLoop);

      const dt = Math.max(0, (time - lastTimeRef.current) / 1000);
      lastTimeRef.current = time;

      const engine = engineRef.current;
      if (!engine) return;
      let projectileEvents:ProjectileFeedback[]=[];
      if (previousEngine !== engine) {
        previousEngine = engine;
        directorWasObscured=false;
        motions = new SpriteMotionTracker();
        direction = new CombatDirection();
        bossDirection=new BossEncounterDirection();
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
        direction.advance(dt);
        bossDirection.observe(engine.state);
        engine.update(dt, { moveX, moveY });

        const liveSignature=engine.state.signatureEvent;
        const signatureToken=liveSignature?`${liveSignature.id}:${liveSignature.phase}`:'';
        if(signatureToken&&signatureCinematicRef.current!==signatureToken){
          signatureCinematicRef.current=signatureToken;
          const positions=liveSignature!.positions;
          const identity=signatureEventIdentity(liveSignature!.id as SignatureEventId);
          const center=positions.reduce((acc,p)=>({x:acc.x+p.x,y:acc.y+p.y}),{x:0,y:0});
          center.x/=Math.max(1,positions.length);center.y/=Math.max(1,positions.length);
          if(liveSignature!.phase==='warning'){
            signaturePressureRef.current=Math.max(signaturePressureRef.current,identity.cameraPressure*.72);
            screenShakeRef.current=Math.max(screenShakeRef.current,2+identity.cameraPressure*7);
            audioRef.current.duckMusic(.45+identity.cameraPressure*.55);
            spawnFloating(center.x,center.y-42,`⚠ ${identity.mechanic} · ${liveSignature!.title}`,identity.accent,true);
          } else if(liveSignature!.phase==='impact'){
            signaturePressureRef.current=Math.max(signaturePressureRef.current,identity.cameraPressure);
            screenShakeRef.current=Math.max(screenShakeRef.current,7+identity.cameraPressure*13);
            if(liveSignature!.materialCue==='electric'){
              audioRef.current.playRecordedEffect('tesla_control',center,engine.state.player);
            } else if(liveSignature!.materialCue==='metal'){
              audioRef.current.playRecordedEffect('impact_steel',center,engine.state.player);
            } else if(liveSignature!.materialCue==='concrete'){
              audioRef.current.playRecordedEffect('impact_concrete',center,engine.state.player);
            } else {
              playSfx('spray',center);
            }
            for(const point of positions){
              const debris=point.type==='FALLING_DEBRIS';
              const gas=point.type==='GAS_LEAK';
              const color=gas?'#22c55e':debris?'#d6d3d1':identity.accent;
              spawnParticles(point.x,point.y,color,liveSignature!.severity==='red'?16:10,115,debris?3.4:gas?2.2:2.8);
              spawnShockwave(point.x,point.y,identity.accent,liveSignature!.severity==='red'?72:50,3.5,.34);
            }
          } else {
            signaturePressureRef.current=Math.max(signaturePressureRef.current,.2);
            screenShakeRef.current=Math.max(screenShakeRef.current,4);
            audioRef.current.playRecordedEffect('target_controlled',center,engine.state.player);
            spawnParticles(center.x,center.y,'#34d399',30,140,4);
            spawnShockwave(center.x,center.y,'#10b981',96,4,.52);
            spawnFloating(center.x,center.y-46,`✓ ${identity.mechanic} CLEAR · +${liveSignature!.reward??0} PSI`,'#34d399',true);
          }
        }

        const masteryNotice=engine.state.signatureMastery?.notice;
        const masteryToken=masteryNotice?`${masteryNotice.kind}:${masteryNotice.chain}`:'';
        if(masteryToken&&masteryCinematicRef.current!==masteryToken){
          masteryCinematicRef.current=masteryToken;
          const finisher=engine.state.lastKilledEvents?.find(event=>event.mastery);
          const fxX=finisher?.x??engine.state.player.x;
          const fxY=finisher?.y??engine.state.player.y;
          if(masteryNotice!.kind==='perfect'){
            spawnParticles(fxX,fxY,'#67e8f9',18,105,3.2);
            spawnShockwave(fxX,fxY,'#22d3ee',72,3.5,.38);
            spawnFloating(fxX,fxY-44,'PERFECT · CHAIN START','#67e8f9',true);
          }else if(masteryNotice!.kind==='armed'){
            screenShakeRef.current=Math.max(screenShakeRef.current,11);
            audioRef.current.duckMusic(.9);
            playSfx('mastery',{x:fxX,y:fxY});
            spawnParticles(fxX,fxY,'#fbbf24',34,155,4.2);
            spawnParticles(fxX,fxY,'#ffffff',14,185,2.8);
            spawnShockwave(fxX,fxY,'#f59e0b',118,5,.58);
            spawnFloating(fxX,fxY-54,'PERFECT ×2 · FINISHER ARMED','#fde68a',true);
          }else if(masteryNotice!.kind==='broken'){
            spawnShockwave(fxX,fxY,'#ef4444',62,2.5,.28);
            spawnFloating(fxX,fxY-40,'CHAIN BROKEN','#fca5a5',true);
          }else if(masteryNotice!.kind==='zero_day'){
            screenShakeRef.current=Math.max(screenShakeRef.current,38);
            signaturePressureRef.current=Math.max(signaturePressureRef.current,1);
            audioRef.current.duckMusic(1.6);
            playSfx('mastery',{x:fxX,y:fxY});
            audioRef.current.playRecordedEffect('target_controlled',{x:fxX,y:fxY},engine.state.player);
            spawnParticles(fxX,fxY,'#fbbf24',72,250,5.5);
            spawnParticles(fxX,fxY,'#67e8f9',48,220,4.5);
            spawnParticles(fxX,fxY,'#ffffff',32,280,3.2);
            spawnShockwave(fxX,fxY,'#fbbf24',190,7,.85);
            spawnShockwave(fxX,fxY,'#22d3ee',245,4.5,1.05);
            spawnFloating(fxX,fxY-66,'ZERO DAY CHAIN · PERFECT ×3','#fef3c7',true);
          }
        }
        if(!masteryNotice)masteryCinematicRef.current='';

        // Wave progression stays continuous. Supply access is opt-in from the pause menu:
        // never interrupt active combat with a shop-style modal.
        const maxSurvivalTime = engine.state.maxTime || 180;
        const flowTiming = operationTiming(maxSurvivalTime);
        const director=waveDirector(engine.state.gameTime,maxSurvivalTime);
        const nextWave=director.wave;

        if(currentWaveRef.current!==nextWave){
          currentWaveRef.current=nextWave;
          setCurrentWave(nextWave);
          setWaveDirectorNotice({wave:nextWave,title:director.title,detail:director.detail});
          screenShakeRef.current=Math.max(screenShakeRef.current,nextWave===3?8:4);
          audioRef.current.duckMusic(nextWave===3?1.0:.55);
          scoreStateRef.current=nextWave===3?'heavy_risk':'pressure';
          playScore(scoreStateRef.current);
        }

        if (nextWave >= 3) {
          if (!wave2ShopTriggeredRef.current && engine.state.phase === 'playing') {
            wave2ShopTriggeredRef.current = true;
            engine.state.psiCredits += 180;
            setPsiCredits(engine.state.psiCredits);
            creditsRef.current = engine.state.psiCredits;
            setAvailableContainerShopWave(2);
            setWaveSupplyNotice({ wave: 2, credits: 180 });
            audioRef.current.playRecordedEffect('ui_equip');
          }
        } else if (nextWave >= 2) {
          if (!wave1ShopTriggeredRef.current && engine.state.phase === 'playing') {
            wave1ShopTriggeredRef.current = true;
            engine.state.psiCredits += 120;
            setPsiCredits(engine.state.psiCredits);
            creditsRef.current = engine.state.psiCredits;
            setAvailableContainerShopWave(1);
            setWaveSupplyNotice({ wave: 1, credits: 120 });
            audioRef.current.playRecordedEffect('ui_equip');
          }
        }

        // The final boss belongs to Wave 3. Extraction begins only after that boss is
        // actually neutralized, so a high-damage build cannot skip the three-wave arc.
        if (engine.state.phase === 'playing' && engine.state.stageBossNeutralized && engine.state.gameTime >= flowTiming.wave3At && !extractionTriggeredRef.current && !extractionCompletedRef.current) {
          if (engine.beginExtraction(flowTiming.extractionHold)) {
            extractionTriggeredRef.current = true;
            const extraction = engine.state.extractionPhase!;
            extractionTimerRef.current = extraction.countdown;
            setExtractionState({ active: true, countdown: Math.ceil(extraction.countdown), playerInside: false, status: 'inbound' });
            screenShakeRef.current = 14;
            spawnShockwave(extraction.x, extraction.y, '#10b981', 140, 5, 0.7);
            spawnFloating(extraction.x, extraction.y - 40, '🚨 긴급 탈출 호송반 출동! 랑데부 구역을 사수하십시오!', '#10b981', true);
            playSfx('boss_alarm');
          }
        }

        // Extraction is an active final objective: the hold timer advances only while
        // the player is physically inside the rendezvous zone.
        if (extractionTriggeredRef.current && !extractionCompletedRef.current && engine.state.extractionPhase) {
          const completed = engine.tickExtraction(dt);
          const extraction = engine.state.extractionPhase;
          extractionTimerRef.current = extraction.countdown;
          setExtractionState({
            active: !completed && extraction.status !== 'secured',
            countdown: Math.ceil(extraction.countdown),
            playerInside: extraction.playerInside,
            status: extraction.status,
          });

          if (completed) {
            extractionCompletedRef.current = true;
            const lzX = extraction.x;
            const lzY = extraction.y;
            // Green flare burst & victory transition
            spawnParticles(lzX, lzY, '#10b981', 70, 200, 5.5);
            spawnParticles(lzX, lzY, '#ffffff', 25, 240, 3.5);
            spawnShockwave(lzX, lzY, '#34d399', 180, 6, 0.9);
            spawnFloating(lzX, lzY - 50, '🚁 탈출 호송 성공! 현장 전원 인계 완료!', '#10b981', true);
            audioRef.current.playRecordedEffect('target_controlled', { x: lzX, y: lzY });
          }
        }

        const incidentSecured=audioRef.current.playEncounterPhase(engine.state.bossEncounter,engine.state.phase==='playing',engine);
        const directorObscured=ultimateSourceObscured(engine.state.directorCutinPhase);
        projectileFeedbackRef.current.advance(dt,directorObscured);
        if(directorWasObscured&&!directorObscured&&engine.state.directorCutinPhase==='invert')motions.act(engine.state.player,engine.state.playerMotionTime??engine.state.gameTime,'ultimate');
        directorWasObscured=directorObscured;
        bossDirection.observe(engine.state);
        const encounter=ACCOUNTABILITY_CASES.find(row=>row.stage===engine.state.stageId);
        const ledger=accountabilityRef.current;
        if(encounter&&engine.state.gameTime>=2&&!storyRadioRef.current.has(engine)){storyRadioRef.current.add(engine);audioRef.current.playDecisionCue('evidence');audioRef.current.duckMusic(.8);}
        if(encounter&&engine.state.phase==='playing'&&engine.state.gameTime>=8&&ledger.access==='active'&&!ledger.decisions.some(d=>d.caseId===encounter.id)) {
          engine.setPaused(true);keysRef.current={};touchVectorRef.current={x:0,y:0};
          setAccountabilityCase(encounter);setPhase('paused');
        }
        projectileEvents=engine.drainProjectileFeedback();
        const equippedNow=engine.state.premiumGear?.equipped??[];
        groundContactRef.current.observe(engine.state,projectileEvents,engine.state.projectiles.length>90);
        dispatchTrailRef.current.observe(engine.state,engine.state.projectiles.length>90);
        recoveryFlowRef.current.observe(engine.state);
        direction.ingest(projectileEvents,equippedNow,engine.state.player,engine.state.projectiles.length>90);
        for(const event of projectileEvents){
          const attackMotion=projectileAttackMotion(event.kind);
          if(event.phase==='launch'&&attackMotion&&Math.hypot(event.x-engine.state.player.x,event.y-engine.state.player.y)<60)motions.act(engine.state.player,engine.state.playerMotionTime??engine.state.gameTime,attackMotion);
          audioRef.current.playEquipmentFeedback(event,engine.state.player,engine.state.projectiles.length>90,equippedNow);

          // Visual Juice: preserve each tactical weapon's material identity even on a
          // critical hit, then layer the golden critical confirmation on top.
          if (event.phase === 'impact') {
            if (event.kind === 'hydraulic_wave') {
              screenShakeRef.current = Math.max(screenShakeRef.current, 10.0);
              spawnParticles(event.x, event.y, '#38bdf8', 14, 130, 4.0); // High-pressure hydraulic spray
              spawnShockwave(event.x, event.y, '#0284c7', 75, 4.5, 0.35);
            } else if (event.kind === 'emp_pulse' || event.kind === 'plasma_arc') {
              screenShakeRef.current = Math.max(screenShakeRef.current, 7.5);
              spawnParticles(event.x, event.y, '#a78bfa', 12, 115, 3.2); // Electric plasma sparks
              spawnShockwave(event.x, event.y, '#c084fc', 65, 3.8, 0.32);
            } else if (event.kind === 'grout_slug') {
              screenShakeRef.current = Math.max(screenShakeRef.current, 4.5);
              spawnParticles(event.x, event.y, '#cbd5e1', 8, 82, 3.0); // Mortar chip burst
              spawnParticles(event.x, event.y, '#64748b', 5, 58, 2.2);
            } else if (event.actorKind === 'RUNAWAY_CART' || event.actorKind === 'FALLING_DEBRIS') {
              screenShakeRef.current = Math.max(screenShakeRef.current, 5.0);
              spawnParticles(event.x, event.y, '#f97316', 7, 95, 2.6); // Industrial fragments
              spawnShockwave(event.x, event.y, '#ea580c', 42, 2.5, 0.22);
            } else {
              spawnParticles(event.x, event.y, '#94a3b8', 4, 60, 2.0); // Steel/concrete contact dust
            }
            if (event.critical) {
              screenShakeRef.current = Math.max(screenShakeRef.current, 8.5);
              spawnParticles(event.x, event.y, '#f59e0b', 12, 120, 3.5); // Golden welding sparks
              spawnParticles(event.x, event.y, '#ffffff', 5, 140, 2.2); // Bright white core
              spawnShockwave(event.x, event.y, '#fbbf24', 55, 3.5, 0.28);
            }
          }
        }
        const scoreEncounter=engine.state.bossEncounter?.phase;
        if (engine.state.phase==='playing' && (time >= scoreCheckRef.current || scoreEncounter!==scoreEncounterRef.current)) {
          scoreEncounterRef.current=scoreEncounter;
          scoreCheckRef.current = time + 1000;
          const live = engine.state.hazards.filter(h => h.hp > 0);
          const next = selectPatrolScore(engine.state.player.hp / engine.state.player.maxHp, live.length, live.some(h => h.isStageBoss), scoreStateRef.current,scoreEncounter);
          scoreStateRef.current = next;
          playScore(next);
        }
        const events = engine.drainAudioEvents();
        const audible = new Set<string>();
        for (const event of events) {
          if (event.type === 'shoot' || event.type === 'spray' || event.type === 'shout') motions.act(engine.state.player, engine.state.playerMotionTime??engine.state.gameTime,event.type==='shout'?'ultimate':event.type==='spray'?'spray':'shot');
          const cue = event.type === 'control' ? event.outcome === 'boss' ? 'control_heavy' : 'control' : event.type;
          if (event.type === 'control' && event.x !== undefined && event.y !== undefined) {
            const boss=event.outcome==='boss',critical=event.outcome==='critical',duration=boss?.45:critical?.22:.12;
            impactFeedbackRef.current.push({x:event.x,y:event.y,life:duration,duration,boss,critical,worker:event.actorKind==='UNHELMETED'});
            if(impactFeedbackRef.current.length>24)impactFeedbackRef.current.shift();
            if(boss){screenShakeRef.current=18;audioRef.current.duckMusic();}
          }
          // Equipment facts own their synchronized sound; retain other gameplay cues.
          if ((event.type==='shoot'||event.type==='spray'||event.type==='laser')&&projectileEvents.some(e=>e.phase==='launch'))continue;
          if (event.type==='impact'&&projectileEvents.some(e=>e.phase==='impact'))continue;
          // Coalesce dense events per rendered batch. Engine event IDs remain unique.
          if (!audible.has(cue)) {
            audible.add(cue);
            const position=event.x===undefined||event.y===undefined?undefined:{x:event.x,y:event.y};
            const controlled=cue==='control'&&event.actorKind!=='UNHELMETED'&&audioRef.current.playRecordedEffect('target_controlled',position,engine.state.player);
            if(!controlled&&!(cue==='control_heavy'&&incidentSecured))playSfx(cue,position);
          }
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
              spawnFloating(ev.x, ev.y - 35, combatText.worker_resolved, '#10b981');
            } else if (ev.type === 'CRANE_BOSS') {
              screenShakeRef.current = 32;
              spawnParticles(ev.x, ev.y, '#f59e0b', 50, 180, 5.5);
              spawnShockwave(ev.x, ev.y, '#fbbf24', 120, 6, 0.6);
              spawnFloating(ev.x, ev.y - 50, combatText.lifting_resolved, '#fbbf24', true);
            }
          }

          // Combo Juice Feedback
          const currentCombo = engine.state.comboCount;
          setCombo(currentCombo);
          if (currentCombo >= 2) {
            if (currentCombo % 5 === 0) {
              screenShakeRef.current = 3;
            }
          }

          spawnParticles(engine.state.player.x, engine.state.player.y, '#38bdf8', Math.min(16,diff * 5), 80);
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
        const damage = engine.state.lastDamage;
        setLastDamage(previous => previous?.source === damage?.source && previous?.amount === damage?.amount && Boolean(previous && previous.remaining > 0) === Boolean(damage && damage.remaining > 0) ? previous : damage ? { ...damage } : undefined);
        setMissionProgress(previous => previous.every((goal, i) => goal.currentValue === engine.state.stage.starChallenges[i]!.currentValue && goal.isCompleted === engine.state.stage.starChallenges[i]!.isCompleted) ? previous : engine.state.stage.starChallenges.map(goal => ({ ...goal })));
        setMaxHp(engine.state.player.maxHp);
        setExp(engine.state.currentExp);
        setNextExp(engine.state.nextLevelExp);
        setLevel(engine.state.level);
        setGameTime(Math.floor(engine.state.gameTime));
        setUltimateCharge(Math.floor(engine.state.ultimateCharge));
        setDirectorCutinPhase(engine.state.directorCutinPhase);
        setEvolutionBanner(engine.state.evolutionBanner ?? null);
        setBossAlert(engine.state.bossName);
        setSignatureEvent(previous => previous?.id===engine.state.signatureEvent?.id && previous?.phase===engine.state.signatureEvent?.phase && previous?.remaining===engine.state.signatureEvent?.remaining
          ? previous : engine.state.signatureEvent ? {...engine.state.signatureEvent,positions:engine.state.signatureEvent.positions.map(point=>({...point}))} : undefined);
        setSignatureCounterplay(previous => previous?.eventId===engine.state.signatureCounterplay?.eventId && previous?.kind===engine.state.signatureCounterplay?.kind && previous?.remaining===engine.state.signatureCounterplay?.remaining
          ? previous : engine.state.signatureCounterplay ? {...engine.state.signatureCounterplay} : undefined);
        setSignatureCounterplayBuffs(engine.state.signatureCounterplayBuffs?{...engine.state.signatureCounterplayBuffs}:undefined);
        setSignatureMastery(engine.state.signatureMastery?{
          ...engine.state.signatureMastery,
          perfectEvents:[...engine.state.signatureMastery.perfectEvents],
          notice:engine.state.signatureMastery.notice?{...engine.state.signatureMastery.notice}:undefined,
        }:undefined);
        setBossSecured(engine.state.bossEncounter?.phase==='secured');
        setEncounterRemaining(Math.ceil((engine.state.bossEncounter?.remaining??0)*10)/10);
        const designatedBoss = engine.state.hazards.find(h => h.isStageBoss && h.hp > 0);
        setBossBeat(designatedBoss?`${designatedBoss.id}:${designatedBoss.bossPhase??1}:${designatedBoss.motion?.phase??'approach'}:${bossCoreStatus(designatedBoss)}:${bossCombatReadout(designatedBoss)}`:'');
        setBossRisk(designatedBoss ? Math.max(0, Math.ceil(designatedBoss.hp / designatedBoss.maxHp * 100)) : null);
        }

        const currentPhase = engine.state.phase as SurvivorsGameState['phase'];
        if (currentPhase !== 'playing') {
          setPhase(currentPhase);
          if (currentPhase === 'levelup') {
            setPerkOptions(engine.state.perkOptions);
            setRerollsLeft(engine.state.rerollsLeft);
          }
          if ((currentPhase === 'victory' || currentPhase === 'defeat') && !rewardedRef.current.has(engine)) {
            rewardedRef.current.add(engine);
            // Save earned credits & Field Guide Points
            const used=engine.state.premiumGear?.used??engine.state.premiumGear?.equipped??[];
            const settled=currentPhase==='victory'?wearStoreItems(inventoryRef.current,used):inventoryRef.current;
            if(saveMetaProgress(permanentUpgrades,creditsRef.current+engine.state.psiCredits,settled)&&currentPhase==='victory')setClearGearWear([...new Set(used)]);
            try {
              const earnedFg = Math.max(1, Math.floor(engine.state.hazardsNeutralized / 8)) + (currentPhase === 'victory' ? 5 : 0);
              const currentFg = safeNumber(localStorage.getItem(STORAGE_KEY_FG_POINTS));
              localStorage.setItem(STORAGE_KEY_FG_POINTS, String(currentFg + earnedFg));
            } catch {
              // ignore
            }

            if (currentPhase === 'victory') {
              const nextGrowth=recordPatrolClear(growthRef.current,engine.state);
              growthRef.current=nextGrowth;setGrowthRecords(nextGrowth);persistGrowth(nextGrowth);
              // Unlock next stage in order
              const stageOrder = STAGE_IDS;
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
      const displayW = containerRef.current?.clientWidth || window.innerWidth;
      const displayH = containerRef.current?.clientHeight || window.innerHeight;
      const targetCanvasW = Math.floor(displayW * dpr);
      const targetCanvasH = Math.floor(displayH * dpr);

      if (canvas.width !== targetCanvasW || canvas.height !== targetCanvasH) {
        canvas.width = targetCanvasW;
        canvas.height = targetCanvasH;
      }

      const { player, hazards, projectiles, drops, activePerks } = engine.state;
      const trackedPose = motions.sample(player, player.x, player.y, engine.state.playerMotionTime??engine.state.gameTime, player.hp);
      const actor=spritesRef.current.characterMaps[engine.state.characterId];
      const playerPose = {...trackedPose,directional:actor?isDirectionalActor(actor):false,...(reducedMotionRef.current?{action:0,actionProgress:0}: {})};
      radioProjectionRef.current.observe(engine.state,projectileEvents,radioToolOffset(engine.state,actor,74,playerPose));
      projectileFeedbackRef.current.ingest(projectileEvents.map(event=>radioProjectionRef.current.feedback(event)),
        projectiles.length>90,engine.state.premiumGear?.equipped??[]);

      if(engine.state.phase==='playing'&&direction.footstep(playerPose.travel,playerPose.moving))audioRef.current.playFootstep(playerPose.speed>145);

      // Screen Shake: Controlled, tactile feedback without visual dizziness
      let shakeX = 0;
      let shakeY = 0;
      if (screenShakeRef.current > 0 && !reducedMotionRef.current) {
        const clampedShake = Math.min(8.0, screenShakeRef.current * 0.35);
        shakeX = Math.round((Math.sin(engine.state.gameTime * 71) * 0.5) * clampedShake * 2);
        shakeY = Math.round((Math.sin(engine.state.gameTime * 93 + 1.4) * 0.5) * clampedShake * 2);
        screenShakeRef.current = Math.max(0, screenShakeRef.current - dt * 35);
      }

      // Responsive Portrait / Landscape Zoom Factor
      const isPortrait = displayH > displayW;
      const preferredZoom = isPortrait ? Math.max(0.72, Math.min(1.0, displayW / 560)) : 1.0;
      // Signature events apply a brief, controlled push-in instead of a disorienting hard cut.
      const baseZoom = Math.max(preferredZoom, displayW / WORLD_WIDTH, displayH / WORLD_HEIGHT);
      const pressure=signaturePressureRef.current;
      signaturePressureRef.current=Math.max(0,pressure-dt*1.55);
      const renderZoom=baseZoom*(1+(reducedMotionRef.current?0:pressure*.018));
      const viewW = displayW / renderZoom;
      const viewH = displayH / renderZoom;

      // CAMERA FOLLOW (Pixel-snapped integer positioning to eliminate fractional jitter/shimmer)
      const camera=survivorsCamera(player,viewW,viewH,WORLD_WIDTH,WORLD_HEIGHT,baseZoom);
      const kick=direction.camera(reducedMotionRef.current);
      const camX = camera.x + shakeX + kick.x;
      const camY = camera.y + shakeY + kick.y;

      // Reset transform to identity and clear screen to guarantee zero cumulative matrix drift
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.scale(dpr * renderZoom, dpr * renderZoom);

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
      ctx.fillRect(-camera.marginX-4, -camera.marginY-4, WORLD_WIDTH+camera.marginX*2+8, WORLD_HEIGHT+camera.marginY*2+8);

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      const groundV2 = spritesRef.current.groundV2;
      const processGround = spritesRef.current.groundAtlasV2;
      const useGroundArt = stage.id === 'stage_01' ? Boolean(groundV2?.naturalWidth) : Boolean(processGround?.naturalWidth);
      const excavationGround = spritesRef.current.excavationGround;
      const fullGround=spritesRef.current.stageFloors[stageGroundUri(stage.id)];
      // Scenic surround only: the original floor and boundary paint stay at exact world coordinates.
      const surround=fullGround?.naturalWidth?fullGround:excavationGround?.naturalWidth?excavationGround:groundV2;
      if(surround?.naturalWidth)ctx.drawImage(surround,-camera.marginX-4,-camera.marginY-4,WORLD_WIDTH+camera.marginX*2+8,WORLD_HEIGHT+camera.marginY*2+8);
      if(fullGround?.naturalWidth) {
        ctx.drawImage(fullGround,0,0,WORLD_WIDTH,WORLD_HEIGHT);
        ctx.fillStyle=stage.ambientColor;ctx.fillRect(0,0,WORLD_WIDTH,WORLD_HEIGHT);
      } else if (['stage_02', 'stage_06'].includes(stage.id) && excavationGround?.naturalWidth) {
        ctx.drawImage(excavationGround, 0, 0, WORLD_WIDTH, WORLD_HEIGHT);
      } else if (stage.id !== 'stage_01' && processGround?.naturalWidth) {
        const tile = ['stage_02', 'stage_06'].includes(stage.id) ? 0
          : ['stage_03', 'stage_04', 'stage_08'].includes(stage.id) ? 1
          : stage.id === 'stage_07' ? 2 : 3;
        const tileW = processGround.naturalWidth / 2;
        const tileH = processGround.naturalHeight / 2;
        ctx.drawImage(processGround, (tile % 2) * tileW, Math.floor(tile / 2) * tileH, tileW, tileH, 0, 0, WORLD_WIDTH, WORLD_HEIGHT);
        ctx.fillStyle = stage.ambientColor;
        ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
      } else if (useGroundArt && groundV2) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(groundV2, 0, 0, WORLD_WIDTH, WORLD_HEIGHT);
      }
      if (!fullGround?.naturalWidth && !useGroundArt && !excavationGround?.naturalWidth) {
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

      drawSceneLighting(ctx, stage, engine.state.interactiveHazards);
      groundContactRef.current.draw(ctx,engine.state,spritesRef.current.groundContactAtlas,reducedMotionRef.current,projectiles.length>90,spritesRef.current.shockContactAtlas,spritesRef.current.barrierContactAtlas);
      dispatchTrailRef.current.draw(ctx,engine.state,spritesRef.current.dispatchTrailAtlas,reducedMotionRef.current,projectiles.length>90);
      bossDirection.draw(ctx,engine.state,spritesRef.current.cinematicAtlas,{RUNAWAY_CART:spritesRef.current.carrierBoss,CRANE_BOSS:spritesRef.current.craneBoss,...spritesRef.current.materialBosses},reducedMotionRef.current,projectiles.length>60||hazards.length>45);
      for (const object of engine.state.interactiveHazards) drawEquipmentCastShadow(ctx, object);

      const tactics=engine.state.fieldTactics;
      for(const line of tactics?.lines ?? []) {
        ctx.save();ctx.strokeStyle='#8dd8cb';ctx.lineWidth=2;ctx.setLineDash([9,6]);
        ctx.beginPath();ctx.arc(line.x,line.y,line.radius,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
        drawProp(ctx,spritesRef.current.itemsAtlas,4,line.x-75,line.y+20,34);
        drawProp(ctx,spritesRef.current.itemsAtlas,4,line.x+75,line.y+20,34);ctx.restore();
      }
      for(const marker of [tactics?.pendingSupport,tactics?.handoff])if(marker) {
        ctx.save();ctx.strokeStyle=marker===tactics?.handoff?'#86efac':'#7dd3fc';ctx.lineWidth=2;
        ctx.beginPath();ctx.ellipse(marker.x,marker.y,marker===tactics?.handoff?72:38,marker===tactics?.handoff?72:18,0,0,Math.PI*2);ctx.stroke();
        ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillStyle='#e2edf4';
        ctx.fillText(`${marker===tactics?.handoff?tacticsText.hold:tacticsText.support_wait} ${Math.ceil(marker.remaining)}s`,marker.x,marker.y-45);ctx.restore();
      }

      // Designated Green/Yellow Safety Walkway (안전통로: 45도 투시감 강화)
      ctx.save();
      const walkW = 180;
      const walkX = WORLD_WIDTH / 2 - walkW / 2;
      ctx.fillStyle = 'rgba(34, 197, 94, 0.06)';
      ctx.fillRect(walkX, 0, walkW, WORLD_HEIGHT);

      // Walkway 45-degree hazard stripe markings inside
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.06)';
      ctx.lineWidth = 4;
      for (let sy = -walkW; sy < WORLD_HEIGHT + walkW; sy += 48) {
        ctx.beginPath();
        ctx.moveTo(walkX, sy);
        ctx.lineTo(walkX + walkW, sy + walkW * 0.7);
        ctx.stroke();
      }

      // Walkway borders
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.18)';
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
      ctx.fillStyle = 'rgba(34, 197, 94, 0.16)';
      ctx.textAlign = 'center';
      for (let y = 180; y < WORLD_HEIGHT; y += 320) {
        if (y === 180) ctx.fillText('안전통로', WORLD_WIDTH / 2, y);
      }
      ctx.restore();

      if (stage.id === 'stage_01') drawStageSpatialContext(ctx, engine.state.interactiveHazards);
      drawStageWorkface(ctx, stage.id, engine.state.interactiveHazards);

      const signature=engine.state.signatureEvent;
      if(signature?.phase==='warning'){
        const identity=signatureEventIdentity(signature.id as SignatureEventId);
        const pulse=.55+.35*Math.sin(engine.state.gameTime*(signature.id==='precollapse_signal'?8:13));
        ctx.save();
        ctx.globalAlpha=pulse;
        ctx.lineWidth=signature.severity==='red'?4:3;
        ctx.strokeStyle=identity.accent;
        ctx.fillStyle=signature.id==='gas_bloom'?'rgba(34,197,94,.11)':signature.severity==='red'?'rgba(239,68,68,.09)':'rgba(245,158,11,.08)';
        ctx.setLineDash([12,8]);
        const falling=signature.positions.filter(point=>point.type==='FALLING_DEBRIS');
        if(falling.length>1){
          ctx.beginPath();ctx.moveTo(falling[0]!.x,falling[0]!.y);
          for(const point of falling.slice(1))ctx.lineTo(point.x,point.y);
          ctx.stroke();
        }
        for(const point of signature.positions){
          if(point.type==='RUNAWAY_CART'){
            const fromLeft=point.x<WORLD_WIDTH/2;
            const x=fromLeft?0:WORLD_WIDTH;
            const laneWidth=signature.id==='cart_convoy'?72:56;
            ctx.fillRect(fromLeft?0:WORLD_WIDTH*.58,point.y-laneWidth/2,WORLD_WIDTH*.42,laneWidth);
            ctx.beginPath();ctx.moveTo(x,point.y);ctx.lineTo(WORLD_WIDTH/2,point.y);ctx.stroke();
            if(signature.id==='cart_convoy'||signature.id==='equipment_pincer'){
              for(let streak=0;streak<4;streak++){
                const offset=(streak-1.5)*11;
                ctx.beginPath();ctx.moveTo(fromLeft?20:WORLD_WIDTH-20,point.y+offset);
                ctx.lineTo(fromLeft?WORLD_WIDTH*.38:WORLD_WIDTH*.62,point.y+offset);ctx.stroke();
              }
            }
          } else {
            const radius=point.type==='GAS_LEAK'?(signature.id==='gas_bloom'||signature.id==='precollapse_signal'?108:78):54;
            ctx.beginPath();ctx.arc(point.x,point.y,radius,0,Math.PI*2);ctx.fill();ctx.stroke();
            if(point.type==='FALLING_DEBRIS'){
              ctx.beginPath();ctx.moveTo(point.x-radius-16,point.y);ctx.lineTo(point.x+radius+16,point.y);
              ctx.moveTo(point.x,point.y-radius-16);ctx.lineTo(point.x,point.y+radius+16);ctx.stroke();
            }
          }
        }
        if(signature.id==='lifting_cross'){
          ctx.setLineDash([18,10]);
          ctx.beginPath();ctx.moveTo(310,180);ctx.lineTo(1090,720);ctx.moveTo(1090,180);ctx.lineTo(310,720);ctx.stroke();
        }
        if(signature.id==='debris_corridor'&&falling.length>1){
          ctx.lineWidth=18;ctx.globalAlpha*=.28;ctx.setLineDash([]);
          ctx.beginPath();ctx.moveTo(falling[0]!.x,falling[0]!.y);
          for(const point of falling.slice(1))ctx.lineTo(point.x,point.y);ctx.stroke();
        }
        if(signature.id==='precollapse_signal'){
          ctx.setLineDash([]);
          ctx.globalAlpha=.16+.08*Math.sin(engine.state.gameTime*9);
          ctx.fillStyle='#450a0a';ctx.fillRect(0,0,WORLD_WIDTH,WORLD_HEIGHT);
          ctx.strokeStyle='#fca5a5';ctx.lineWidth=2;
          for(const point of falling){
            ctx.beginPath();ctx.moveTo(point.x,point.y);ctx.lineTo(WORLD_WIDTH/2,WORLD_HEIGHT/2);ctx.stroke();
          }
        }
        ctx.setLineDash([]);
        ctx.restore();
      } else if(signature?.phase==='impact'&&(signature.id==='gas_bloom'||signature.id==='precollapse_signal')){
        ctx.save();
        if(signature.id==='gas_bloom'){
          for(const point of signature.positions.filter(point=>point.type==='GAS_LEAK')){
            const fog=ctx.createRadialGradient(point.x,point.y,18,point.x,point.y,150);
            fog.addColorStop(0,'rgba(34,197,94,.18)');fog.addColorStop(1,'rgba(34,197,94,0)');
            ctx.fillStyle=fog;ctx.beginPath();ctx.arc(point.x,point.y,150,0,Math.PI*2);ctx.fill();
          }
        } else {
          const vignette=ctx.createRadialGradient(WORLD_WIDTH/2,WORLD_HEIGHT/2,220,WORLD_WIDTH/2,WORLD_HEIGHT/2,760);
          vignette.addColorStop(0,'rgba(0,0,0,0)');vignette.addColorStop(1,'rgba(69,10,10,.32)');
          ctx.fillStyle=vignette;ctx.fillRect(0,0,WORLD_WIDTH,WORLD_HEIGHT);
        }
        ctx.restore();
      }

      // Short ground-contact strokes at actual impact positions, never fullscreen flashes.
      impactFeedbackRef.current=impactFeedbackRef.current.filter(effect=>{effect.life-=dt;return effect.life>0;});
      if(!reducedMotionRef.current) for(const effect of impactFeedbackRef.current){
        const progress=1-effect.life/effect.duration,radius=(effect.boss?78:effect.critical?26:12)*progress+4;
        ctx.save();ctx.globalAlpha=(1-progress)*.65;ctx.strokeStyle=effect.worker?'#34d399':effect.boss?'#fbbf24':'#7dd3fc';ctx.lineWidth=effect.boss?3:2;
        ctx.beginPath();ctx.ellipse(effect.x,effect.y,radius,radius*.42,0,0,Math.PI*2);ctx.stroke();
        if(effect.critical||effect.boss)for(let i=0;i<4;i++){const a=i*Math.PI/2;ctx.beginPath();ctx.moveTo(effect.x+Math.cos(a)*radius,effect.y+Math.sin(a)*radius*.42);ctx.lineTo(effect.x+Math.cos(a)*(radius+6),effect.y+Math.sin(a)*(radius+6)*.42);ctx.stroke();}
        ctx.restore();
      }

      // Narrative crew marker is a protected reporting location, never a target.
      const fieldCase=ACCOUNTABILITY_CASES.find(row=>row.stage===engine.state.stageId);
      if(fieldCase&&accountabilityRef.current.access==='active'&&!accountabilityRef.current.decisions.some(d=>d.caseId===fieldCase.id)) {
        const marker=engine.state.interactiveHazards.find(h=>h.type==='floodlight_tower');
        if(marker){
          const crewArt=spritesRef.current.workerV2;
          if(crewArt?.naturalWidth){ctx.save();ctx.translate(marker.x+42,marker.y+28);drawGroundedSprite(ctx,crewArt,72,motions.sample(fieldCase,marker.x+42,marker.y+28,engine.state.gameTime));ctx.restore();}
          ctx.save();ctx.strokeStyle='#f3c778';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(marker.x+42,marker.y+28,14,6,0,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#f3c778';ctx.font='13px sans-serif';ctx.textAlign='center';ctx.fillText(accountabilityText.worker,marker.x+42,marker.y-55);ctx.restore();}
      }
      // Resolved workers leave the risk area along the safety corridor.
      for (const worker of engine.state.resolvedWorkers ?? []) {
        const sprite = spritesRef.current.mobWorker;
        if (!sprite?.complete || !sprite.naturalWidth) continue;
        ctx.save(); ctx.globalAlpha = Math.min(1, worker.remaining);
        const workerArt = spritesRef.current.workerV2;
        if (workerArt?.naturalWidth) {
          ctx.save(); ctx.translate(worker.x, worker.y);
          drawGroundedSprite(ctx, workerArt, 72, motions.sample(worker, worker.x, worker.y, engine.state.gameTime));
          ctx.restore();
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

      // RENDER SHOCKWAVE EXPANDING IMPACT RINGS
      const aliveShockwaves: ShockwaveRing[] = [];
      for (const sw of shockwavesRef.current) {
        sw.life -= dt;
        const progress = 1 - (sw.life / sw.maxLife);
        sw.radius = 8 + (sw.maxRadius - 8) * Math.sin(progress * Math.PI / 2);
        if (sw.life > 0) {
          ctx.save();
          ctx.translate(sw.x, sw.y);
          ctx.scale(1, 0.58); // 2.5D ground contact oval
          ctx.strokeStyle = sw.color;
          ctx.lineWidth = Math.max(1, sw.lineWidth * (1 - progress * 0.7));
          ctx.globalAlpha = Math.max(0, (1 - progress) * 0.85);
          ctx.beginPath();
          ctx.arc(0, 0, sw.radius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          aliveShockwaves.push(sw);
        }
      }
      shockwavesRef.current = aliveShockwaves;

      // RENDER EXTRACTION LANDING ZONE (LZ) CLIMAX
      if (extractionTriggeredRef.current && !extractionCompletedRef.current) {
        const lzX = WORLD_WIDTH / 2;
        const lzY = WORLD_HEIGHT / 2;
        const lzRadius = 155;
        const playerDist = Math.hypot(player.x - lzX, player.y - lzY);
        const inside = playerDist <= lzRadius;
        const pulse = 1 + Math.sin(time / 200) * 0.06;

        ctx.save();
        ctx.translate(lzX, lzY);
        ctx.scale(1, 0.58); // 2.5D isometric ground projection

        // 1. Glowing ground wash
        const grad = ctx.createRadialGradient(0, 0, 20, 0, 0, lzRadius * pulse);
        grad.addColorStop(0, inside ? 'rgba(16, 185, 129, 0.35)' : 'rgba(245, 158, 11, 0.22)');
        grad.addColorStop(0.65, inside ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.08)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, lzRadius * pulse, 0, Math.PI * 2);
        ctx.fill();

        // 2. Rotating radar beacon ring
        ctx.strokeStyle = inside ? '#10b981' : '#f59e0b';
        ctx.lineWidth = 4;
        ctx.setLineDash([16, 12]);
        ctx.beginPath();
        ctx.arc(0, 0, lzRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // 3. Rotating crosshair landing beacon
        const beaconAngle = (time / 800) * Math.PI;
        ctx.save();
        ctx.rotate(beaconAngle);
        ctx.strokeStyle = inside ? 'rgba(52, 211, 153, 0.6)' : 'rgba(251, 191, 36, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-lzRadius * 0.9, 0); ctx.lineTo(lzRadius * 0.9, 0);
        ctx.moveTo(0, -lzRadius * 0.9); ctx.lineTo(0, lzRadius * 0.9);
        ctx.stroke();
        ctx.restore();

        // 4. Central Helipad / Landing Pad Markings
        ctx.strokeStyle = inside ? '#34d399' : '#fbbf24';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 48, 0, Math.PI * 2);
        ctx.stroke();
        // Big "H" (Helicopter / Evacuation mark)
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = inside ? '#10b981' : '#f59e0b';
        ctx.fillText('H', 0, 0);

        // 5. Ground text status
        ctx.font = 'bold 16px sans-serif';
        ctx.fillStyle = inside ? '#6ee7b7' : '#fde047';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 6;
        const statusText = inside
          ? `[랑데부 구역 사수 중: ${Math.ceil(extractionTimerRef.current)}초]`
          : `[랑데부 구역 진입 필요 · 사수 타이머 정지: ${Math.ceil(extractionTimerRef.current)}초]`;
        ctx.fillText(statusText, 0, lzRadius + 28);
        ctx.restore();

        // 6. Directional navigation pointer if player is outside LZ
        if (!inside) {
          const dirAngle = Math.atan2(lzY - player.y, lzX - player.x);
          ctx.save();
          ctx.translate(player.x, player.y - 20);
          ctx.rotate(dirAngle);
          ctx.fillStyle = '#f59e0b';
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.moveTo(55, 0);
          ctx.lineTo(38, -10);
          ctx.lineTo(42, 0);
          ctx.lineTo(38, 10);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      }

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
      ctx.lineWidth = 4;
      ctx.globalAlpha = .65;
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
            grad.addColorStop(0, 'rgba(251, 191, 36, 0.18)');
            grad.addColorStop(0.6, 'rgba(245, 158, 11, 0.07)');
            grad.addColorStop(1, 'rgba(245, 158, 11, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
            ctx.fill();

            // Light perimeter dashed circle
            ctx.strokeStyle = 'rgba(251, 191, 36, 0.25)';
            ctx.lineWidth = 2;
            ctx.setLineDash([8, 6]);
            ctx.beginPath();
            ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
            ctx.stroke();

            drawProp(ctx,spritesRef.current.itemsAtlas,7,h.x,h.y,48);

            // Zone tag
            ctx.font = 'bold 10px sans-serif';
            ctx.fillStyle = '#fbbf24';
            ctx.textAlign = 'center';
            ctx.fillText(combatText.light_zone, h.x, h.y - 56);
            ctx.restore();
          }

          // B. Slurry Puddle (Mud Drag)
          if (h.type === 'slurry_puddle') {
            ctx.save();
            ctx.fillStyle = 'rgba(68, 50, 32, 0.22)';
            ctx.beginPath();
            ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = 'rgba(160, 110, 60, 0.35)';
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.font = 'bold 10px sans-serif';
            ctx.fillStyle = '#d97706';
            ctx.textAlign = 'center';
            ctx.fillText(combatText.mud_zone, h.x, h.y);
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
            drawProp(ctx,spritesRef.current.flammableDrum,0,h.x,h.y+8,64);
            if (h.state === 'active') {
              ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 3; ctx.setLineDash([8, 6]);
              ctx.beginPath(); ctx.arc(h.x, h.y, 50, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
              ctx.font = 'bold 11px sans-serif'; ctx.fillStyle = '#86efac'; ctx.textAlign = 'center';
              ctx.fillText('위험원 격리 완료', h.x, h.y - 58);
            } else if (h.state === 'warning') {
              const pulse = (Math.sin(time / 50) + 1) * 0.5;
              ctx.strokeStyle = '#fbbf24';ctx.lineWidth=2;
              ctx.beginPath();
              ctx.arc(h.x, h.y, h.radius + pulse * 4, 0, Math.PI * 2);
              ctx.stroke();

              ctx.font = 'bold 11px sans-serif';
              ctx.fillStyle = '#ffffff';
              ctx.textAlign = 'center';
              ctx.fillText('격리·대피 진행', h.x, h.y - h.radius - 8);
            } else if (h.state === 'idle') {
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
            drawProp(ctx,spritesRef.current.distributionCabinet,0,h.x,h.y+8,68);
            if (h.state === 'active') {
              ctx.strokeStyle = '#86efac'; ctx.lineWidth = 2; ctx.setLineDash([8, 6]);
              ctx.beginPath(); ctx.arc(h.x, h.y, 200, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
              ctx.font = 'bold 11px sans-serif'; ctx.fillStyle = '#86efac';
              ctx.fillText('전원 차단 · 구역 격리', h.x, h.y - 36);
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
      ctx.rotate(groundFacingAngle(facingAngle,.58));
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
        const auraRadius = equipmentTuning('tesla_dome',1)!.radius;
        const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, auraRadius);
        grad.addColorStop(0, 'rgba(168, 237, 134, 0.20)');
        grad.addColorStop(0.6, 'rgba(98, 210, 153, 0.08)');
        grad.addColorStop(1, 'rgba(98, 210, 153, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, auraRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(168,237,134,.55)';
        ctx.lineWidth = 1.3;
        for(let i=0;i<6;i++){
          const angle=i*Math.PI/3;
          ctx.beginPath();ctx.arc(0,0,auraRadius,angle+.12,angle+.62);ctx.stroke();
          const pulse=reducedMotionRef.current?0:Math.sin(engine.state.gameTime*3+i)*3;
          const r=auraRadius-8;
          ctx.beginPath();ctx.moveTo(Math.cos(angle)*(r-8),Math.sin(angle)*(r-8));
          ctx.lineTo(Math.cos(angle+.035)*(r+pulse),Math.sin(angle+.035)*(r+pulse));
          ctx.lineTo(Math.cos(angle)*(r+8),Math.sin(angle)*(r+8));ctx.stroke();
        }
        ctx.restore();
      } else if (activePerks.floodlight > 0) {
        ctx.save();
        ctx.translate(player.x, player.y);
        ctx.scale(1, 0.58);
        const auraRadius = equipmentTuning('floodlight',activePerks.floodlight)!.radius;
        const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, auraRadius);
        grad.addColorStop(0, `rgba(251,191,36,${.16+activePerks.floodlight*.025})`);
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
          drawProjectileVfx(ctx,p,activePerks.extinguisher,engine.state.gameTime,reducedMotionRef.current,projectiles.length>90);
        } else if (p.kind === 'cone_trap') {
          ctx.save();
          ctx.translate(p.x, p.y);
          // Ground shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
          ctx.beginPath();
          ctx.ellipse(0, 5, 12, 5, 0, 0, Math.PI * 2);
          ctx.fill();
          drawEquipment(ctx,spritesRef.current.equipmentAtlas,'cone_trap',activePerks.cone_trap,0,4,32,spritesRef.current.itemsAtlas);
          ctx.restore();
        }
      }

      // 5. Y-SORTED ENTITY RENDER PIPELINE (Depth Ordering for Drops, Hazards, and Player)
      type EntityItem =
        | { kind: 'drop'; y: number; data: typeof drops[0] }
        | { kind: 'hazard'; y: number; data: typeof hazards[0] }
        | { kind: 'player'; y: number };

      const entityList: EntityItem[] = [];
      for(const h of hazards)drawGangformPattern(ctx,h,spritesRef.current.industrialHazards);
      for (const d of drops) {
        if(d.x<camX-100||d.x>camX+viewW+100||d.y<camY-100||d.y>camY+viewH+100)continue;
        entityList.push({ kind: 'drop', y: d.y, data: d });
      }
      for (const h of hazards) {
        // Keep warning trajectories even when their source is outside the view.
        if(!h.isStageBoss&&h.type!=='CRANE_BOSS'&&h.motion?.phase!=='warning'&&(h.x<camX-180||h.x>camX+viewW+180||h.y<camY-180||h.y>camY+viewH+180))continue;
        entityList.push({ kind: 'hazard', y: h.y, data: h });
      }
      entityList.push({ kind: 'player', y: player.y });

      // Sort strictly by ground contact feet y-coordinate (ascending)
      entityList.sort((a, b) => a.y - b.y);

      const closestWarning = engine.state.hazards.filter(h => h.motion?.phase === 'warning')
        .reduce<typeof engine.state.hazards[number] | undefined>((closest, h) => {
          const distance = (hazard: typeof h) => (hazard.x - engine.state.player.x) ** 2 + (hazard.y - engine.state.player.y) ** 2;
          return !closest || distance(h) < distance(closest) ? h : closest;
        }, undefined);
      const closestCrane = hazards.filter(h => h.type === 'CRANE_BOSS')
        .sort((a,b) => Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y))[0];
      for (const item of entityList) {
        if (item.kind === 'drop') {
          const drop = item.data;
          ctx.save();ctx.translate(drop.x,drop.y);
          const meta=drop.itemKind?TACTICAL_ITEMS[drop.itemKind]:null;
          const size=drop.itemKind?42:drop.isHeal?34:drop.exp>=8?30:27;
          ctx.fillStyle='rgba(0,0,0,.34)';ctx.beginPath();ctx.ellipse(0,2,size*.32,size*.13,0,0,Math.PI*2);ctx.fill();
          ctx.fillStyle='rgba(8,16,28,.7)';ctx.beginPath();ctx.ellipse(0,3,size*.55,size*.22,0,0,Math.PI*2);ctx.fill();
          ctx.strokeStyle=meta?.color ?? (drop.isHeal?'#34d399':'#7dd3fc');ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,3,size*.55,size*.22,0,0,Math.PI*2);ctx.stroke();
          drawProp(ctx,spritesRef.current.itemsAtlas,meta?.atlasCell ?? (drop.isHeal?1:0),0,1,size);
          if(drop.itemKind){ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.fillStyle=meta!.color;ctx.strokeStyle='#111827';ctx.lineWidth=3;ctx.strokeText(itemText[drop.itemKind].name,0,23);ctx.fillText(itemText[drop.itemKind].name,0,23);}
          ctx.restore();
        } else if (item.kind === 'hazard') {
          const h = item.data;
          const hazardPose = motions.sample(h, h.x, h.y, engine.state.gameTime, h.hp);
          ctx.save();
          ctx.translate(h.x, h.y);
          if (h.hitFlashTimer && h.hitFlashTimer > 0) {
            ctx.filter = 'brightness(3.2) contrast(1.6)';
          }

          // Telegraphs share the engine's locked trajectory and contact window.
          if (h.type === 'RUNAWAY_CART' && h.motion?.phase === 'warning') {
            ctx.save();
            ctx.rotate(Math.atan2(h.motion.directionY, h.motion.directionX));
            ctx.fillStyle = 'rgba(245,158,11,.20)';
            ctx.fillRect(0, -h.radius - 14, h.speed * 2.1 * 1.05 * (h.isStageBoss?bossPattern(h).burst:1), (h.radius + 14) * 2);
            ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 3;
            ctx.setLineDash([12, 8]);
            ctx.strokeRect(0, -h.radius - 14, h.speed * 2.1 * 1.05 * (h.isStageBoss?bossPattern(h).burst:1), (h.radius + 14) * 2);
            ctx.restore();
          }
          if ((h.type === 'FALLING_DEBRIS'||h.type==='CRANE_BOSS'&&h.isStageBoss) && h.motion && (h.motion.phase==='warning'||h.motion.phase==='fall')) {
            ctx.fillStyle = h.motion.phase === 'fall' ? 'rgba(239,68,68,.35)' : 'rgba(245,158,11,.16)';
            ctx.strokeStyle = h.motion.phase === 'fall' ? '#ef4444' : '#fbbf24';
            ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(0, 0, h.radius + 14, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            if (h.motion.phase === 'warning') {
              ctx.beginPath(); ctx.arc(0, 0, h.radius + 20, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - h.motion.timer / bossPattern(h).warning)); ctx.stroke();
            }
          }
          if (h.motion?.phase === 'warning' && h === closestWarning) {
            ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
            ctx.lineWidth = 4; ctx.strokeStyle = '#111827'; ctx.fillStyle = '#fef3c7';
            const warning = h.isStageBoss?bossText.warning[h.type]:h.type === 'FALLING_DEBRIS' ? combatText.fall_warning : combatText.cart_warning;
            const label=warningLabelLayout({x:h.x,y:h.y+h.radius+40},ctx.measureText(warning).width,
              {x:camX,y:camY,width:viewW,height:viewH,zoom:baseZoom});
            ctx.font=`bold ${12*label.fontScale}px sans-serif`;
            ctx.strokeText(warning,label.x-h.x,label.y-h.y);ctx.fillText(warning,label.x-h.x,label.y-h.y);
          }
          if (h.type === 'FALLING_DEBRIS' && h.motion?.phase === 'warning' && h.motion.timer > .3) {
            ctx.restore();
            continue;
          }
          if (h.motion?.phase === 'spent') ctx.globalAlpha = h.isStageBoss ? .82 : .35;

          if (drawIndustrialHazard(ctx, spritesRef.current.industrialHazards, h, hazardPose, stageGroundUri(stage.id), stage.theme, engine.state.gameTime, reducedMotionRef.current, h.type === 'FALLING_DEBRIS' ? debrisElevation(h.motion?.phase ?? 'fall',h.motion?.timer ?? 0) : 0,spritesRef.current.carrierBoss,spritesRef.current.materialBosses)) {
            // Actual raster materials replace the legacy shape renderer below.
          } else if (h.type === 'UNHELMETED') {
            // 2.5D Ground Ellipse Contact Shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
            ctx.beginPath();
            ctx.ellipse(0, 1, 12, 4.5, 0, 0, Math.PI * 2);
            ctx.fill();

            // 2.5D Standing Worker Billboard
            const mSpr = spritesRef.current.mobWorker;
            const bob = 0;

            const workerArt = spritesRef.current.workerV2;
            if (workerArt?.naturalWidth) {
              ctx.save();
              drawGroundedSprite(ctx, workerArt, 72, hazardPose);
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
            ctx.ellipse(0, 1, h.radius * 1.15, h.radius * 0.42, 0, 0, Math.PI * 2);
            ctx.fill();

            // Dual halogen headlights on concrete floor (2.5D Ground Ellipse Cone)
            const angle = h.motion?.phase === 'warning' || h.motion?.phase === 'charge'
              ? Math.atan2(h.motion.directionY,h.motion.directionX)
              : Math.atan2(hazardPose.directionY,hazardPose.facing*Math.sqrt(Math.max(0,1-hazardPose.directionY**2)));
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
              ctx.save();
              ctx.scale(hazardPose.facing, 1);
              ctx.transform(1, 0, hazardPose.lean * .5, 1 - hazardPose.reaction * .02, 0, 0);
              ctx.drawImage(cartAtlas, 650, 90, 620, 580, -width / 2, -width * .94, width, width * .94);
              const tyreScale = width / 620;
              for (const wheel of [{x:700,y:460,rx:24,ry:32},{x:945,y:595,rx:27,ry:38}]) {
                ctx.save();
                ctx.translate(-width/2+(wheel.x-650)*tyreScale,-width*.94+(wheel.y-90)*tyreScale);
                ctx.scale(wheel.rx*tyreScale,wheel.ry*tyreScale);
                ctx.beginPath();ctx.arc(0,0,1,0,Math.PI*2);ctx.clip();
                ctx.rotate(hazardPose.travel / (45*tyreScale));
                ctx.drawImage(cartAtlas,wheel.x-wheel.rx,wheel.y-wheel.ry,wheel.rx*2,wheel.ry*2,-1,-1,2,2);
                ctx.restore();
              }
              ctx.restore();
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
            const elevation=debrisElevation(h.motion?.phase ?? 'fall',h.motion?.timer ?? 0);
            ctx.fillStyle = `rgba(0,0,0,${.18+(1-elevation/120)*.22})`;
            ctx.beginPath();
            ctx.ellipse(0, 1, width * .40, width * .14, 0, 0, Math.PI * 2);
            ctx.fill();
            if (atlas?.naturalWidth) ctx.drawImage(atlas, 61, 719, 536, 441, -width / 2, -width * 441/536-elevation, width, width * 441/536);
            else { ctx.fillStyle = '#94a3b8'; ctx.fillRect(-h.radius, -h.radius-elevation, h.radius * 2, h.radius * 2); }
            if(h.motion?.phase==='fall' && h.motion.timer>.42){
              const progress=(.65-h.motion.timer)/.23;ctx.strokeStyle=`rgba(203,213,225,${Math.max(0,.35*(1-progress))})`;ctx.lineWidth=2;
              ctx.beginPath();ctx.ellipse(0,1,width*(.4+progress*.2),width*(.14+progress*.08),0,0,Math.PI*2);ctx.stroke();
            }
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
            ctx.fillText(combatText.gas_warning, 0, -h.radius * 0.5);
            ctx.font = '9px sans-serif';
            ctx.fillStyle = '#86efac';

          } else if (h.type === 'CRANE_BOSS') {
            // Giant Tower Crane Rigging Failure Hazard (Boss)
            // 1. 2.5D Ground Drop Hazard Warning Ring (Oval)
            if(!h.isStageBoss) {
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.75)';
            ctx.lineWidth = 3;
            ctx.setLineDash([12, 8]);
            ctx.beginPath();
            ctx.ellipse(0, 0, h.radius + 16, (h.radius + 16) * 0.52, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);

            }

            const loadPose = suspendedLoadPose(reducedMotionRef.current?0:engine.state.gameTime);
            const swayX = loadPose.x;
            const zOffset = loadPose.y;
            const craneImage=h.isStageBoss&&spritesRef.current.craneBoss?.naturalWidth?spritesRef.current.craneBoss:spritesRef.current.industrialCrane;
            const paintedCrane=drawIndustrialCrane(ctx,craneImage,h.radius,engine.state.gameTime,reducedMotionRef.current,hazardPose.reaction,h.isStageBoss?craneAttackElevation(h,reducedMotionRef.current):undefined);
            if(!paintedCrane){
            // 2. Ground shadow follows the suspended load, inside its warned radius.
            ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
            ctx.beginPath();
            ctx.ellipse(loadPose.x, 0, h.radius * 1.35, h.radius * 0.6, 0, 0, Math.PI * 2);
            ctx.fill();

            // 3. Overhead 3D Suspended Load (Z-axis offset + sway)

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

            }

            // Boss Hazard Title Tag
            ctx.font = 'bold 12px sans-serif';
            ctx.fillStyle = '#f87171';
            ctx.textAlign = 'center';
            if (h === closestCrane && (!h.isStageBoss || displayW > 900)) {
              ctx.lineWidth = 4; ctx.strokeStyle = '#111827';
              const titleY=paintedCrane?craneArtPose(h.radius,engine.state.gameTime,reducedMotionRef.current,h.isStageBoss?craneAttackElevation(h,reducedMotionRef.current):undefined).top-24:zOffset-h.radius-14;
              ctx.strokeText(combatText.crane_warning, swayX, titleY);
              ctx.fillText(combatText.crane_warning, swayX, titleY);
            }
          }

          const materialBoss=!!(h.isStageBoss&&spritesRef.current.materialBosses?.[h.type as keyof MaterialBossImages]?.naturalWidth);
          const hazardPlacement=industrialHazardPlacement(h,h.type==='FALLING_DEBRIS'?debrisElevation(h.motion?.phase??'fall',h.motion?.timer??0):0,materialBoss);
          if(h.variant){
            ctx.save();ctx.textAlign='center';ctx.font='700 11px sans-serif';ctx.fillStyle=h.variant==='pulse_gas'?'#a7f3d0':'#f8d477';ctx.strokeStyle='#111827';ctx.lineWidth=3;
            if(!h.isStageBoss||displayW>900){
              const labelY=hazardPlacement.y-hazardPlacement.size*.82-24;
              ctx.strokeText(challengeText.variants[h.variant],0,labelY);ctx.fillText(challengeText.variants[h.variant],0,labelY);
            }
            if(h.variant==='pulse_gas'){ctx.globalAlpha=.65;ctx.strokeStyle=h.motion?.phase==='charge'?'#fb7185':'#a7f3d0';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,h.radius,0,Math.PI*2);ctx.stroke();}
            else if(h.variant==='reinforced_cart'){ctx.strokeStyle=h.hp<h.maxHp*.5?'#fb923c':'#7dd3fc';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,2,h.radius*1.25,h.radius*.45,0,0,Math.PI*2);ctx.stroke();}
            ctx.restore();
          }
          // Mini HP Bar with clear contrast
          const barW = Math.max(32, h.radius * 2.2);
          const barH = 5;
          const hpPercent = Math.max(0, h.hp / h.maxHp);
          const barY = h.type === 'CRANE_BOSS' ? spritesRef.current.industrialCrane?.naturalWidth ? craneArtPose(h.radius,engine.state.gameTime,reducedMotionRef.current,h.isStageBoss?craneAttackElevation(h,reducedMotionRef.current):undefined).top-12 : -h.radius - 48 : h.type === 'UNHELMETED' ? -80 : hazardPlacement.y-hazardPlacement.size*.82-8;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
          ctx.fillRect(-barW / 2, barY, barW, barH);
          ctx.fillStyle = h.type === 'CRANE_BOSS' ? '#dc2626' : '#f59e0b';
          ctx.fillRect(-barW / 2, barY, barW * hpPercent, barH);

          // Glowing Weak Point Reticle & Burst Indicator
          const isWeakPoint = Boolean(
            h.weakPointExposed ||
            (h.bossGameplay && (h.bossGameplay.combatPhase === 'burst' || h.bossGameplay.combatPhase === 'weak_point')) ||
            (h.isStageBoss && bossCoreStatus(h) === 'exposed')
          );
          if (isWeakPoint) {
            ctx.save();
            const pulse = 1 + Math.sin(engine.state.gameTime * 10) * 0.15;
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#fbbf24';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(0, 0, Math.max(22, h.radius * 0.75) * pulse, 0, Math.PI * 2);
            ctx.stroke();
            const rLen = 8;
            ctx.beginPath();
            ctx.moveTo(-rLen, 0); ctx.lineTo(rLen, 0);
            ctx.moveTo(0, -rLen); ctx.lineTo(0, rLen);
            ctx.stroke();
            ctx.font = '900 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#fde047';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            const wpText = 'WEAK POINT [2.5x]';
            ctx.strokeText(wpText, 0, barY - 14);
            ctx.fillText(wpText, 0, barY - 14);
            ctx.restore();
          }
          ctx.restore();
        } else if (item.kind === 'player') {
          // 7. RENDER PLAYER (2.5D Standing Billboard + Realistic Ground Shadow + Equipment)
          ctx.save();
          ctx.translate(player.x, player.y);

          // Cyan Motion Blur & Trail on Emergency Dash
          if (player.isDashing) {
            ctx.save();
            ctx.strokeStyle = '#06b6d4';
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.65;
            ctx.shadowColor = '#22d3ee';
            ctx.shadowBlur = 14;
            ctx.beginPath();
            ctx.ellipse(0, 4, 38, 14, Math.atan2(player.dashVy ?? 0, player.dashVx ?? 0), 0, Math.PI * 2);
            ctx.stroke();
            const tAngle = Math.atan2(player.dashVy ?? 0, player.dashVx ?? 0) + Math.PI;
            ctx.beginPath();
            ctx.moveTo(0, -10);
            ctx.lineTo(Math.cos(tAngle) * 32, -10 + Math.sin(tAngle) * 32);
            ctx.moveTo(0, -32);
            ctx.lineTo(Math.cos(tAngle) * 40, -32 + Math.sin(tAngle) * 40);
            ctx.stroke();
            ctx.restore();
          }
          const kit = engine.state.controlKit;
          if (kit && kit.remaining > 0 && kit.charges > 0) {
            ctx.strokeStyle='#4ade80';ctx.lineWidth=3;ctx.setLineDash([8,5]);
            ctx.beginPath();ctx.ellipse(0,4,36,16,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
            ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillStyle='#86efac';
            ctx.fillText(`${itemText.kit_status} ${kit.charges} · ${Math.ceil(kit.remaining)}s`,0,38);
          }
          const buffs=[engine.state.fieldRecovery?`${itemText.recovery_status} · ${Math.ceil(engine.state.fieldRecovery.remaining)}s`:null,engine.state.routeLantern?`${itemText.route_status} · ${Math.ceil(engine.state.routeLantern.remaining)}s`:null].filter(Boolean);
          if(buffs.length){ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.fillStyle='#e2e8f0';ctx.strokeStyle='#111827';ctx.lineWidth=3;const text=buffs.join(' / ');ctx.strokeText(text,0,kit?54:38);ctx.fillText(text,0,kit?54:38);}
          const notice = engine.state.itemNotice;
          if (notice) {
            ctx.font='bold 12px sans-serif';ctx.textAlign='center';ctx.fillStyle=TACTICAL_ITEMS[notice.kind].color;
            ctx.strokeStyle='#111827';ctx.lineWidth=4;
            ctx.strokeText(itemText[notice.kind].name,0,-100);ctx.fillText(itemText[notice.kind].name,0,-100);
          }

          // 2.5D Ground Contact Ellipse Shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.52)';
          ctx.beginPath();
          ctx.ellipse(0, 1, 12, 4.5, 0, 0, Math.PI * 2);
          ctx.fill();

          // Invincibility flashing feedback
          if (player.invincibleTime > 0 && Math.floor(time / 80) % 2 === 0) {
            ctx.globalAlpha = 0.45;
          }

          // Movement Walk Bob & Tilt
          const bobY = 0;
          ctx.save();

          const charProfile = CHARACTER_PROFILES[engine.state.characterId];
          const charMapSpr = spritesRef.current.characterMaps[engine.state.characterId]
            || (engine.state.characterId === 'yoon'
              ? spritesRef.current.characterMaps['yoon_sungho']
              : engine.state.characterId === 'park'
              ? spritesRef.current.characterMaps['kang_taesik']
              : spritesRef.current.characterMaps['player']);

          if (charMapSpr && charMapSpr.complete && charMapSpr.naturalWidth > 0) {
            // High-Resolution 2.5D Quarter-View Standing Character Map Sprite
            const sprH = 74;
            ctx.save();
            applyActorTorsoTransform(ctx,playerPose,sprH,Boolean(ACTOR_RIGS[charMapSpr.src.split('/').pop()??'']));
            drawPremiumPresence(ctx,spritesRef.current.premiumPresence,engine.state.premiumGear?.equipped??[],engine.state.gameTime,reducedMotionRef.current,projectiles.length>60||hazards.length>45,direction.auraStrength);
            ctx.restore();
            // Draw grounded with feet touching ground contact shadow (0, 0)
            drawWearableLayer(ctx,engine.state,charMapSpr,sprH,playerPose,spritesRef.current.wearables??{},'back');
            drawGroundedSprite(ctx, charMapSpr, sprH, playerPose);
            drawWearableLayer(ctx,engine.state,charMapSpr,sprH,playerPose,spritesRef.current.wearables??{},'front');
            drawCarriedEquipment(ctx,engine.state,charMapSpr,sprH,playerPose,spritesRef.current.equipmentAtlas,spritesRef.current.itemsAtlas,reducedMotionRef.current);

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

          ctx.restore(); // restore facing flip
          ctx.restore(); // restore player translate
        }
      }

      const inspectionActor=spritesRef.current.characterMaps[engine.state.characterId];
      const inspectionPhase=drawPremiumGear(ctx,engine.state,spritesRef.current.equipmentAtlas,reducedMotionRef.current,facingAngle,spritesRef.current.itemsAtlas,spritesRef.current.wearables,inspectionActor?.naturalWidth?{actor:inspectionActor,height:74,pose:playerPose,vfxAtlas:spritesRef.current.cinematicAtlas,premiumAtlas:spritesRef.current.premiumMountedAtlas}:undefined);
      audioRef.current.playInspectionPhase(inspectionPhase,engine.state.phase==='playing',engine.state);
      const projectileBusy=projectiles.length>60;
      const auraMovingAngle=engine.state.phase==='playing'&&playerPose.moving?facingAngle:undefined;
      const recoveryCellAuthored=recoveryFlowRef.current.draw(ctx,engine.state,spritesRef.current.recoveryFlow,reducedMotionRef.current,projectileBusy||hazards.length>45,inspectionActor?.naturalWidth?{image:inspectionActor,height:74,pose:playerPose}:undefined);
      drawPremiumProtocol(ctx,engine.state,spritesRef.current.cinematicAtlas,reducedMotionRef.current,auraMovingAngle,projectileBusy||hazards.length>45,recoveryCellAuthored);
      drawEquipmentMantle(ctx,engine.state,spritesRef.current.cinematicAtlas,reducedMotionRef.current,projectileBusy||hazards.length>45,auraMovingAngle,direction.auraStrength,inspectionActor?.naturalWidth?{pose:playerPose,height:74,rigged:Boolean(ACTOR_RIGS[inspectionActor.src.split('/').pop()??''])}:undefined);
      const equipped=engine.state.premiumGear?.equipped??[];
      const vfxLevels={radio:activePerks.radio_boost,satellite_wave:5,drone_laser:activePerks.safety_drone,hunter_beam:5};
      const cinematicFlightBudget=projectileBusy?18:projectiles.length>35?28:42;
      const cinematicFlights=cinematicFlightSelection(projectiles,equipped,cinematicFlightBudget,player);

      // 6. RENDER AIRBORNE PROJECTILES (Standard & Super Protocol Evolutions)
      for (const p of projectiles) {
        if(p.kind==='extinguisher'||p.kind==='cone_trap')continue;
        const lv=p.kind==='radio'?activePerks.radio_boost:p.kind==='drone_laser'?activePerks.safety_drone:5;
        const cinematic=cinematicFlights.has(p)?{atlas:spritesRef.current.cinematicAtlas,look:cinematicLook(p.kind,lv,equipped)}:undefined;
        const projection=radioProjectionRef.current.flightOffset(p);
        if(projection){ctx.save();ctx.translate(projection.x,projection.y);}
        drawProjectileVfx(ctx,p,lv,engine.state.gameTime,reducedMotionRef.current,projectileBusy,cinematic);
        if(projection)ctx.restore();
      }

      projectileFeedbackRef.current.draw(ctx,reducedMotionRef.current,projectileBusy,{atlas:spritesRef.current.cinematicAtlas,materialAtlas:spritesRef.current.industrialContacts,metalAtlas:spritesRef.current.metalImpact,debrisAtlas:spritesRef.current.debrisImpact,vaporAtlas:spritesRef.current.vaporImpact,droneLaunchAtlas:spritesRef.current.droneLaunch,hunterLaunchAtlas:spritesRef.current.hunterLaunch,radioLaunchAtlas:spritesRef.current.radioLaunch,equipped,levels:vfxLevels});

      // 7. RENDER SAFETY DRONES AT THE AUTHORITATIVE EMISSION ORIGIN
      const hasHunter = activePerks.hunter_swarm > 0;
      const droneCount = hasHunter ? 3 : activePerks.safety_drone > 0 ? 1 : 0;
      if (droneCount > 0 && engine.state.droneAngle !== undefined) {
        for (let d = 0; d < droneCount; d++) {
          const {x:dX,y:flightY}=droneEmissionOrigin(player,engine.state.droneAngle,hasHunter,d);
          const groundY=flightY+32;

          // Ground shadow for floating drone
          ctx.save();
          ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
          ctx.beginPath();
          ctx.ellipse(dX, groundY + 4, 10, 4.5, 0, 0, Math.PI * 2);
          ctx.fill();

          drawDroneEmission(ctx,spritesRef.current.cinematicAtlas,dX,flightY,hasHunter,engine.state.gameTime,reducedMotionRef.current);
          ctx.translate(dX,flightY);
          drawEquipment(ctx,spritesRef.current.equipmentAtlas,hasHunter?'hunter_swarm':'safety_drone',hasHunter?1:activePerks.safety_drone,0,12,hasHunter?42:30,spritesRef.current.itemsAtlas);
          ctx.strokeStyle='rgba(226,232,240,.22)';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(0,-5,13,4,engine.state.gameTime*12,0,Math.PI*2);ctx.stroke();
          ctx.restore();
        }
      }

      // 9. RENDER PARTICLES
      const aliveParticles: Particle[] = [];
      for (const p of particlesRef.current) {
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.94; // air friction deceleration
        p.vy = p.vy * 0.94 + 75 * dt; // gravity
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

      // 11. RENDER FLOATING TEXTS (With Critical Impact Pop & Golden Glow)
      const aliveTexts: FloatingText[] = [];
      for (const ft of floatingTextsRef.current) {
        ft.life -= dt;
        ft.y -= (ft.isCrit ? 46 : 38) * dt;
        if (ft.life > 0) {
          ctx.save();
          const progress = 1 - (ft.life / ft.maxLife);
          const scale = ft.isCrit ? (progress < 0.22 ? 1 + progress * 2.5 : Math.max(1, 1.55 - (progress - 0.22) * 0.55)) : 1;
          ctx.translate(ft.x, ft.y);
          ctx.scale(scale, scale);
          ctx.font = ft.isCrit ? '900 15px sans-serif' : 'bold 11px sans-serif';
          ctx.fillStyle = ft.color;
          ctx.shadowColor = ft.isCrit ? '#f59e0b' : '#000000';
          ctx.shadowBlur = ft.isCrit ? 10 : 5;
          ctx.textAlign = 'center';
          ctx.globalAlpha = Math.min(1, ft.life / (ft.maxLife * 0.55));
          ctx.fillText(ft.text, 0, 0);
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
  const fieldIncident=ACCOUNTABILITY_CASES.find(row=>row.stage===selectedStage);
  const incidentPending=fieldIncident&&accountability.access==='active'&&!accountability.decisions.some(d=>d.caseId===fieldIncident.id);
  const fieldRadio=incidentPending?fieldIncident.line:accountability.decisions.at(-1)?accountabilityText.radioAfter[accountability.decisions.at(-1)!.outcome]:'';
  const recommendedGear = recommendedStoreItem(storeInventory,selectedDifficulty);
  const recommendedCopy = storeText.items[recommendedGear.id as keyof typeof storeText.items];
  const liveGear = engineRef.current?.state.premiumGear;
  const activeMission = missionProgress.find(goal => goal.metric !== 'victory' && !goal.isCompleted);

  const encounterLocked=!!engineRef.current?.state.bossEncounter&&engineRef.current.state.bossEncounter.phase!=='combat';
  return (
    <div
      ref={containerRef}
      className={`survivors-container${phase === 'playing' ? ' is-combat' : ''}`}
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
            {liveGear && liveGear.equipped.length>0 && <span className="survivors-premium-hp-badge" aria-label={storeText.status} title={liveGear.equipped.map(id=>storeText.items[id as keyof typeof storeText.items].name).join(' · ')}><SurvivorsPremiumArt item={STORE_ITEMS.find(item=>item.id===liveGear.equipped[0])!}/>{liveGear.equipped.length>1&&<small>+{liveGear.equipped.length-1}</small>}</span>}
            <div className="survivors-hp-bar-bg">
              <div
                className="survivors-hp-bar-fill"
                style={{ width: `${Math.max(0, (hp / maxHp) * 100)}%` }}
              />
            </div>
            <span className="survivors-hp-text">{hp}/{maxHp}</span>
          </div>
          <span className="survivors-campaign-position" data-advanced={PATROL_STAGES[selectedStage].stageNumber>20} title={PATROL_STAGES[selectedStage].name}>STAGE {String(PATROL_STAGES[selectedStage].stageNumber).padStart(2,'0')}/50</span>
          {liveGear && liveGear.effects.shield>0 && <div className="survivors-premium-live" aria-label={storeText.status}>
            {liveGear.effects.shield>0 && <span>{storeText.shield} {Math.ceil(liveGear.shield)}/{liveGear.effects.shield}{liveGear.shieldCooldown>0?` · ${storeText.recharge} ${Math.ceil(liveGear.shieldCooldown)}s`:''}</span>}
          </div>}
        </div>

        <div className="survivors-hud-center">
          <div className="survivors-timer">
            <strong>{formatTime(gameTime)}</strong>
            <small>{operationText.time}</small>
          </div>
          <div className="survivors-wave-badge" title="현재 방호 웨이브 진행도">
            <span>WAVE {currentWave}/3</span>
            <small>{currentWave === 1 ? '탐색 · 빌드업' : currentWave === 2 ? '압박 · 변칙' : 'RED ZONE'}</small>
          </div>
          <div className="survivors-score-badge">
            <span>SAFE SCORE</span>
            <strong>{score.toLocaleString()}</strong>
          </div>
          <div className="survivors-kills-badge">
            {bossRisk === null ? <>
            <span>🛡️</span>
            <b>{kills} 통제</b>
            </> : (
            <div className="survivors-boss-risk" title={combatText.boss_guidance}>
              <span>{combatText.boss_risk} {bossRisk}%</span>
              <progress aria-label={combatText.boss_risk} value={bossRisk} max={100} />
            </div>
          )}
          </div>
        </div>

        <div className="survivors-top-actions">
          {phase==='paused'&&!accountabilityCase&&availableContainerShopWave!==null&&<button type="button" className="survivors-btn-icon survivors-live-shop" disabled={encounterLocked || showRdModal || showArsenalModal || showContainerShop} onClick={openContainerShop}>정비 보급</button>}
          {phase==='paused'&&!accountabilityCase&&<button type="button" className="survivors-btn-icon survivors-live-shop" disabled={encounterLocked || showRdModal || showArsenalModal || showContainerShop} onClick={openStore}>{storeText.shopShort}</button>}
          <button
            type="button"
            className="survivors-btn-icon survivors-pause-command"
            aria-label={phase === 'paused' ? focusText.resume : focusText.pause}
            title={phase === 'paused' ? focusText.resume : focusText.pause}
            disabled={showRdModal || showArsenalModal}
            onClick={() => {
              const engine = engineRef.current;
              if (engine && (phase === 'playing' || phase === 'paused')) {
                const next = phase === 'playing' ? 'paused' : 'playing';
                engine.setPaused(next === 'paused');
                setPhase(next);
              }
            }}
          >
            {phase === 'paused' ? <Play size={20}/> : <Pause size={20}/>}<span>{phase === 'paused' ? '재개 (P)' : '일시정지 (P)'}</span>
          </button>
          <button type="button" className="survivors-btn-icon" onClick={exitSession}>
            현장 복귀
          </button>
        </div>
      </header>

      {waveDirectorNotice && phase === 'playing' && !extractionState.active && (
        <aside className={`survivors-wave-director-notice is-wave-${waveDirectorNotice.wave}`} role="status" aria-live="assertive">
          <span>WAVE {waveDirectorNotice.wave}/3 · DIRECTOR SHIFT</span>
          <strong>{waveDirectorNotice.title}</strong>
          <small>{waveDirectorNotice.detail}</small>
        </aside>
      )}

      {signatureEvent && phase === 'playing' && !bossAlert && (
        <aside className={`survivors-signature-event event-${signatureEvent.id} theme-${signatureEvent.stageSkin} is-${signatureEvent.severity} is-${signatureEvent.phase}`} role="alert" aria-live="assertive" style={{'--signature-stage-accent':signatureEvent.stageAccent} as CSSProperties}>
          <span>WAVE {signatureEvent.wave} · {signatureEvent.phase==='warning'?'SIGNATURE WARNING':signatureEvent.phase==='impact'?'SIGNATURE EVENT':'SIGNATURE CONTROLLED'}</span>
          <em>{signatureEvent.mechanic}</em>
          <b>{signatureEvent.workface}</b>
          <strong>{signatureEvent.title}</strong>
          <small>{signatureEvent.phase==='resolved'?`${signatureEvent.detail} · +${signatureEvent.reward??0} PSI`:signatureEvent.detail}</small>
          {signatureEvent.phase!=='resolved' && <i>COUNTERPLAY · {signatureCounterplayProfile(signatureEvent.id as SignatureEventId).condition}</i>}
        </aside>
      )}

      {signatureCounterplay && phase === 'playing' && (
        <aside className={`survivors-counterplay-banner kind-${signatureCounterplay.kind}`} role="status" aria-live="assertive" style={{'--counterplay-accent':signatureCounterplay.accent} as CSSProperties}>
          <span>SKILL COUNTERPLAY · PERFECT RESPONSE</span>
          <strong>{signatureCounterplay.title}</strong>
          <small>{signatureCounterplay.detail}</small>
        </aside>
      )}

      {phase === 'playing' && signatureMastery && signatureMastery.chain>0 && (
        <aside className={`survivors-mastery-meter${signatureMastery.finisherArmed?' is-armed':''}${signatureMastery.zeroDay?' is-zero-day':''}`} aria-label="Signature Mastery 연쇄 상태">
          <span>SIGNATURE MASTERY</span>
          <strong>{signatureMastery.zeroDay?'ZERO DAY CHAIN':`PERFECT ×${signatureMastery.chain}`}</strong>
          <small>{signatureMastery.finisherArmed?'BOSS FINISHER ARMED':signatureMastery.zeroDay?'PERFECT ×3 COMPLETE':'다음 Signature 완벽 대응으로 연쇄 강화'}</small>
        </aside>
      )}

      {phase === 'playing' && signatureMastery?.notice && (
        <aside className={`survivors-mastery-notice is-${signatureMastery.notice.kind}`} role="status" aria-live="assertive">
          <span>{signatureMastery.notice.kind==='zero_day'?'MASTER CLEAR':'SIGNATURE MASTERY'}</span>
          <strong>{signatureMastery.notice.title}</strong>
          <small>{signatureMastery.notice.detail}</small>
        </aside>
      )}

      {phase === 'playing' && signatureCounterplayBuffs && ((signatureCounterplayBuffs.cooldownRush??0)>0 || (signatureCounterplayBuffs.bossWeakPointSeconds??0)>0) && (
        <aside className="survivors-counterplay-active" aria-live="polite">
          {(signatureCounterplayBuffs.cooldownRush??0)>0 && <span>⚡ 대응속도 가속 <b>{signatureCounterplayBuffs.cooldownRush!.toFixed(1)}s</b></span>}
          {(signatureCounterplayBuffs.bossWeakPointSeconds??0)>0 && <span>◎ 보스 약점 선공개 <b>{signatureCounterplayBuffs.bossWeakPointSeconds!.toFixed(1)}s</b></span>}
        </aside>
      )}

      {waveSupplyNotice && phase === 'playing' && !extractionState.active && (
        <aside className={`survivors-wave-supply-notice${waveDirectorNotice?' has-director':''}`} aria-live="polite">
          <strong>WAVE {waveSupplyNotice.wave} 완료 · 현장 보급 +{waveSupplyNotice.credits} PSI</strong>
          <span>플레이는 계속됩니다. 정비 보급은 일시정지 메뉴에서 직접 선택할 수 있습니다.</span>
        </aside>
      )}

      {phase === 'playing' && engineRef.current && (() => {
        const state = engineRef.current.state;
        const boss = state.hazards.find(h => h.isStageBoss && h.hp > 0);
        const deadline = Math.max(0, operationPlan(state.stage,state.maxTime).bossAt - gameTime);
        const bearing = boss ? Math.atan2(boss.y-state.player.y,boss.x-state.player.x)*180/Math.PI+90 : 0;
        return <aside className="survivors-focus-status" data-core={bossSecured?'secured':boss?bossCoreStatus(boss):undefined} aria-label={bossSecured ? bossText.secured : boss ? state.stage.bossName : focusText.bossIncoming}>
          {bossSecured ? <span>{bossText.secured}</span> : boss ? <>
            <ArrowUp size={18} aria-label={focusText.bossDirection} style={{transform:`rotate(${bearing}deg)`}}/>
            <strong>{state.stage.bossName}</strong>
            <progress aria-label={operationText.boss} value={boss.hp} max={boss.maxHp}/>
            <span>{bossCombatReadout(boss)} · {bossRisk}%</span>
          </> : <span>{focusText.bossDeadline} {deadline}s</span>}
        </aside>;
      })()}

      {/* EXTRACTION CLIMAX (긴급 탈출 · 인계 클라이맥스) HUD BANNER */}
      {phase === 'playing' && extractionState.active && (
        <SurvivorsExtractionStatus remaining={extractionState.countdown} inside={extractionState.playerInside} total={engineRef.current?.state.extractionPhase?.totalTime} />
      )}

      {phase === 'playing' && (!bossSecured || extractionState.active) && lastDamage && lastDamage.amount > 0 && lastDamage.remaining > 0 && !bossAlert && !evolutionBanner && directorCutinPhase === 'none' && <aside className="survivors-damage-notice" aria-live="polite">{combatText.damage_sources[lastDamage.source]} · −{lastDamage.amount} HP</aside>}

      {/* COMBO JUICE BANNER */}
      {phase === 'playing' && (!bossSecured || extractionState.active) && !bossAlert && !evolutionBanner && !(lastDamage && lastDamage.remaining > 0) && directorCutinPhase === 'none' && (
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
          <span style={{ fontSize: '20px' }}>{combo >= 2 ? '🔥' : '☆'}</span>
          <div>
            {combo >= 2 && <div style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
              {combo} {combatText.combo}
            </div>}
            {combo >= 2 && <div style={{ fontSize: '10px', opacity: 0.9, fontWeight: 700 }}>
              +{combo * 5}% {combatText.bonus}
            </div>}
            {engineRef.current && (() => {
              const progress=operationProgress(engineRef.current.state);
              const boss=engineRef.current.state.hazards.find(h=>h.isStageBoss&&h.hp>0);
              const next=boss ? bossText.phase[(boss.bossPhase??1)-1] : progress.zonesSecured<progress.zones ? `${operationText.zones} ${progress.zonesSecured}/${progress.zones}` : progress.controlsDone<progress.controls ? `${operationText.controls} ${progress.controlsDone}/${progress.controls}` : !progress.boss ? `${operationText.boss} · ${engineRef.current.state.stage.bossName}` : tacticsText.continue;
              const cadence=PATROL_DIFFICULTIES[engineRef.current.state.difficulty ?? 'standard'].supplyEvery;
              const gate=engineRef.current.state.supplyGate;
              const remaining=Math.max(0,(gate?.nextControl??cadence)-engineRef.current.state.hazardsNeutralized);
              const wait=Math.max(0,Math.ceil((gate?.availableAt??0)-engineRef.current.state.gameTime));
              return <div className="survivors-live-objective" title={activeMission?.description}><small className="survivors-current-workface">{PATROL_STAGES[selectedStage].name}</small>{operationText.modes[progress.mode]} · {next}{boss&&<div className="survivors-boss-readout" data-state={bossBeat} data-core={bossCoreStatus(boss)}><strong>{engineRef.current.state.stage.bossName}</strong><progress aria-label={bossText.health} value={Math.max(0,boss.hp)} max={boss.maxHp}/><span>{bossCombatReadout(boss)} · {Math.ceil(Math.max(0,boss.hp)/boss.maxHp*100)}%</span><small>{bossCombatHint(boss)}</small></div>}<small className="survivors-supply-countdown">{challengeText[selectedDifficulty]} · {challengeText.next} {remaining}{challengeText.controls}{wait>0?` · ${challengeText.wait} ${wait}s`: ''}{selectedDifficulty==='extreme'?` · ${challengeText.elite}`:selectedDifficulty==='hard'?` · ${challengeText.enhanced}`:''}</small></div>;
            })()}
          </div>
        </aside>
      )}

      {/* BOSS ALERT BANNER */}
      {phase==='playing'&&bossSecured&&!extractionState.active&&<div className="survivors-boss-alert survivors-encounter-notice" role="status"><div className="survivors-boss-alert-text"><strong>{bossText.secured}</strong><small>{bossText.clearConfirm}</small><progress aria-label={bossText.confirmationProgress} max={2.4} value={Math.max(0,2.4-encounterRemaining)}/></div></div>}
      {phase === 'playing' && bossAlert && directorCutinPhase === 'none' && (
        <div className={`survivors-boss-alert ${engineRef.current?.state.bossEncounter?.phase==='arrival'?'survivors-encounter-notice':''}`} role="alert">
          <div className="survivors-boss-alert-text">
            <strong>{engineRef.current?.state.bossEncounter?.phase==='arrival'?bossText.arrival:combatText.boss_alert_title} · {bossAlert}</strong>
            {engineRef.current?.state.bossEncounter?.phase==='arrival'&&<small>{bossText.interlock}</small>}
            {engineRef.current?.state.bossEncounter?.phase==='arrival'&&engineRef.current.state.bossEncounter.replay&&<button type="button" className="survivors-boss-skip" title={bossText.skipIntro} aria-label={bossText.skipIntro} disabled={!engineRef.current.canSkipBossIntro()} onClick={()=>{
              if(engineRef.current?.skipBossIntro()){keysRef.current={};touchVectorRef.current={x:0,y:0};setBossAlert(null);}
            }}><SkipForward size={18}/></button>}
            <small>{PATROL_STAGES[selectedStage].bossType === 'RUNAWAY_CART' ? combatText.boss_cart_guidance : PATROL_STAGES[selectedStage].bossType === 'CRANE_BOSS' ? combatText.boss_crane_guidance : PATROL_STAGES[selectedStage].bossType === 'FALLING_DEBRIS' ? combatText.boss_fall_guidance : combatText.boss_gas_guidance}</small>
          </div>
        </div>
      )}

      {/* SUPER PROTOCOL EVOLUTION BANNER */}
      {evolutionBanner && !bossAlert && directorCutinPhase === 'none' && (
        <div className="survivors-evo-banner" role="status">
          <div className="survivors-evo-banner-icon">{evolutionBanner.equipmentId ? <SurvivorsEquipmentIcon id={evolutionBanner.equipmentId} level={5} /> : evolutionBanner.icon}</div>
          <div className="survivors-evo-banner-content">
            <h4>{evolutionBanner.title}</h4>
            <p>{evolutionBanner.subtitle}</p>
          </div>
        </div>
      )}

      {/* ACTIVE PERKS TRAY */}
      <div className="survivors-perks-tray">
        {(Object.entries(activePerks) as [PerkId, number][])
          .filter(([id, lvl]) => lvl > 0 && !Object.entries(EVOLUTION_RECIPES).some(([evoId, recipe]) => recipe.weapon === id && (activePerks[evoId as PerkId] ?? 0)>0))
          .map(([id, lvl]) => (
            <button type="button" key={id} className="survivors-perk-badge" disabled={encounterLocked || showRdModal || showArsenalModal || !!accountabilityCase} onClick={openArsenal} aria-label={`${PERK_CATALOG[id].name} (Lv.${lvl}) · ${itemText.evolution_progress}`} title={`${PERK_CATALOG[id].name} (Lv.${lvl})`}>
              <SurvivorsEquipmentIcon id={id} level={lvl} />
              <small>{lvl}</small>
            </button>
          ))}
      </div>

      {phase==='playing'&&fieldIncident&&gameTime>=2&&gameTime<=14&&fieldRadio&&<aside className="survivors-field-radio" aria-live="polite"><strong>{accountabilityText.worker} · {accountabilityText.warning} {accountability.warnings}/3</strong><p>{fieldRadio}</p></aside>}
      {phase==='playing' && (()=>{
        const engine=engineRef.current;
        if (!engine) return null;
        const t=engine.state.fieldTactics;
        const p=engine.state.player;
        const dashCd=p.dashCooldown ?? 0;
        return <div className="survivors-tactical-actions" aria-label={tacticsText.support}>
          <button type="button" aria-label={tacticsText.dash ?? '긴급 회피'} title={tacticsText.dash_description ?? '0.25초 무적 회피'} disabled={encounterLocked||dashCd>0} onClick={()=>engine.triggerPlayerDash()}><ArrowUp size={20}/><span>{tacticsText.dash ?? '긴급 회피'}</span><b>{dashCd>0?Math.ceil(dashCd)+'s':'READY'}</b><small>Space/Shift</small></button>
          {t && <button type="button" aria-label={tacticsText.supply} title={tacticsText.support_description} disabled={encounterLocked||t.supportCharges<=0||t.supportCooldown>0} onClick={()=>engine.requestSupport()}><Package size={20}/><span>{tacticsText.supply}</span><b>{t.supportCooldown>0?Math.ceil(t.supportCooldown)+'s':t.supportCharges}</b><small>Q</small></button>}
          {t && <button type="button" aria-label={tacticsText.line} title={tacticsText.line_description} disabled={encounterLocked||t.lineCharges<=0||t.lineCooldown>0} onClick={()=>engine.deployControlLine()}><Shield size={20}/><span>{tacticsText.line}</span><b>{t.lineCooldown>0?Math.ceil(t.lineCooldown)+'s':t.lineCharges}</b><small>E</small></button>}
        </div>;
      })()}
      {/* DIRECTOR SHOUT ULTIMATE BUTTON (HUD) */}
      {phase === 'playing' && (
        <div className="survivors-ultimate-control">
          <button
            type="button"
            className={`survivors-ultimate-btn ${!encounterLocked && ultimateCharge >= 100 ? 'is-ready' : ''}`}
            onClick={handleTriggerDirectorShout}
            disabled={encounterLocked || ultimateCharge < 100 || directorCutinPhase !== 'none'}
            aria-label="현장소장 사자후 궁극기 발동"
          >
            <div className="survivors-ultimate-ring" style={{ '--charge': `${ultimateCharge}%` } as CSSProperties} />
            <span className="survivors-ultimate-icon">📢</span>
            <div className="survivors-ultimate-info">
              <strong>소장 샤우팅</strong>
              <small>{!encounterLocked && ultimateCharge >= 100 ? <><span>READY</span><kbd className="survivors-ultimate-key">F/Space</kbd></> : `${ultimateCharge}%`}</small>
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
              src="/assets/survivors/director-yoon-shout-v3.webp"
              alt={combatText.shout_alt}
              className="survivors-cutin-portrait"
            />
            <div className="survivors-cutin-textbox">
              <span className="survivors-cutin-kicker">{combatText.shout_kicker}</span>
              <h2 className="survivors-cutin-shout">{combatText.shout_line}</h2>
              <p className="survivors-cutin-sub">{combatText.shout_sub}</p>
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
            ref={joystickKnobRef}
            style={{
              left: `${joystickVisual.knobX - joystickVisual.baseX + 60}px`,
              top: `${joystickVisual.knobY - joystickVisual.baseY + 60}px`,
            }}
          />
        </div>
      )}

      {showManual && <GameManual initialSection="survivors" onClose={() => setShowManual(false)} />}
      {/* READY / START SCREEN WITH CHARACTER SELECT */}
      {phase === 'ready' && !showRdModal && !showArsenalModal && (
        <div className="survivors-modal-backdrop">
          <div className="survivors-modal-content survivors-ready-dialog" data-preflight={preflightTab}>
            <div className="survivors-preflight-top"><h2>{preflightText.title}</h2><div><button type="button" aria-pressed={readyMusic} disabled={audioMuted} onClick={()=>{audioRef.current.getContext();setReadyMusic(value=>!value);}}>{preflightText.music}</button><button type="button" onClick={exitSession}>{preflightText.exit}</button></div></div>
            <header className="survivors-ready-launch">
              <div><strong>STAGE {String(PATROL_STAGES[selectedStage].stageNumber).padStart(2, '0')}/50 · {CHARACTER_PROFILES[selectedChar].name}</strong><p>{PATROL_STAGES[selectedStage].name}</p></div>
              <button type="button" className="survivors-btn-primary" disabled={stageGroundUri(selectedStage).includes('/maps/') && loadedGround !== stageGroundUri(selectedStage)} onClick={startGame}>{preflightText.launch}</button>
            </header>
            <nav className="survivors-preflight-tabs" aria-label={preflightText.navigation}>{(['brief','stage','agent','settings'] as const).map(tab=><button key={tab} type="button" aria-pressed={preflightTab===tab} onClick={()=>setPreflightTab(tab)}>{preflightText[tab]}</button>)}</nav>
            <div className="survivors-preflight-panel" hidden={preflightTab!=='brief'}>
            <img className="survivors-stage-preview" src={stageGroundUri(selectedStage)} alt={PATROL_STAGES[selectedStage].name}/>
            <aside className="survivors-signature-brief" aria-label="Signature Event 예고">
              <strong>SIGNATURE EVENTS · {signatureEventPlan(PATROL_STAGES[selectedStage])[0]?.workface}</strong>
              {signatureEventPlan(PATROL_STAGES[selectedStage]).map(event=><span key={event.id} style={{'--brief-accent':event.stageAccent} as CSSProperties}><b>W{event.wave}</b><em>{event.mechanic}</em><small>{event.title}<u>{signatureCounterplayProfile(event.id).condition}</u></small></span>)}
            </aside>
            {failedGround === stageGroundUri(selectedStage) ? <p role="alert">{storeText.mapFailure} <button type="button" onClick={() => setGroundRetry(value => value + 1)}>{storeText.mapRetry}</button></p> : stageGroundUri(selectedStage).includes('/maps/') && loadedGround !== stageGroundUri(selectedStage) && <p role="status">{storeText.mapLoading}</p>}
            <fieldset className="survivors-challenge-select"><legend>{challengeText.title}</legend>
              {(Object.keys(PATROL_DIFFICULTIES) as PatrolDifficulty[]).map(id=><button key={id} type="button" aria-pressed={selectedDifficulty===id} onClick={()=>setSelectedDifficulty(id)}><strong>{challengeText[id]}</strong><small>{challengeText.reward} ×{PATROL_DIFFICULTIES[id].reward}</small><small>{PATROL_DIFFICULTIES[id].supplyEvery} {challengeText.supply} · {PATROL_DIFFICULTIES[id].supplyCooldown}s</small></button>)}
              <p>{challengeText.description}</p>
            </fieldset>
            <aside className="survivors-preflight-gear" aria-label={storeText.briefTitle}>
              <SurvivorsPremiumArt item={recommendedGear}/>
              <div><strong>{storeText.briefTitle}</strong><p>{selectedDifficulty==='hard'||selectedDifficulty==='extreme'?storeText.briefHard:storeText.briefStandard}</p><b>{recommendedCopy.name}</b><p>{recommendedCopy.use} · {recommendedCopy.description}</p>
                <small>{storeInventory.equipped.includes(recommendedGear.id)?storeText.briefEquipped:storeInventory.owned.includes(recommendedGear.id)?storeText.briefOwned:`${recommendedGear.price.toLocaleString()} PSI · ${storeText.briefCredits}`}</small>
                {storeInventory.owned.includes(recommendedGear.id)&&<small>{storeText.durability} {itemDurability(storeInventory,recommendedGear.id)}/100 {itemDurability(storeInventory,recommendedGear.id)===0?storeText.broken:''}</small>}
              </div>
              {storeInventory.owned.includes(recommendedGear.id)&&!storeInventory.equipped.includes(recommendedGear.id)&&itemDurability(storeInventory,recommendedGear.id)>0
                ? <button type="button" onClick={()=>changeStore(recommendedGear.id,false)}>{storeText.equip}</button>
                : <button type="button" onClick={openStore}>{storeText.briefBrowse}</button>}
            </aside>
            {PATROL_STAGES[selectedStage].narrative && <aside className="survivors-story-brief">
              <strong>{CHARACTER_PROFILES[PATROL_STAGES[selectedStage].narrative!.speaker].name} · {PATROL_STAGES[selectedStage].subtitle}</strong>
              <p>{PATROL_STAGES[selectedStage].narrative!.brief}</p>
              {(() => { const previous=STAGE_IDS[STAGE_IDS.indexOf(selectedStage)-1];const record=previous && stageStars[previous];const narrative=previous && PATROL_STAGES[previous].narrative;
                return record?.[0] && narrative ? <small>{campaignText.memory_label}: {record[1]?narrative.success:narrative.residual}</small> : null; })()}
            </aside>}
            {accountabilityMemory(accountability)&&<aside className="survivors-story-brief"><strong>{accountabilityText.memory}</strong><p>{accountabilityMemory(accountability)}</p></aside>}
            <SurvivorsGrowthRecord records={growthRecords} characterId={selectedChar} legacy={Object.values(stageStars).some(stars=>stars[0])}/>
            <section className="survivors-mission-brief" aria-label={combatText.mission_title}>
              <h3>{combatText.mission_title}</h3>
              <p>{PATROL_STAGES[selectedStage].description}</p>
              <ol>{PATROL_STAGES[selectedStage].starChallenges.map(goal => <li key={goal.starIndex}><strong>{goal.title}</strong><span>{goal.description}</span></li>)}</ol>
              <p>{combatText.first_patrol}</p>
            </section>
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

            <button type="button" className="survivors-btn-secondary" onClick={() => setShowManual(true)}>{gameManualText('open')}</button>
            <details className="survivors-ready-details"><summary>{combatText.supply_help}</summary><SurvivorsSupplyGuide /></details>
            </div>

            {/* STAGE SELECTOR (5 INDUSTRIAL ZONES) */}
            <details open className="survivors-stage-select-section survivors-ready-details" hidden={preflightTab!=='stage'}>
              <summary>{combatText.stage_select}</summary>
              <span className="survivors-section-label">{growthText.stage_select}</span>
              <div ref={chapterTabsRef} className="survivors-chapter-tabs" role="tablist" aria-label={growthText.stage_select}>
                {growthText.chapters.map((name,index)=><button type="button" role="tab" tabIndex={stageChapter===index?0:-1} aria-selected={stageChapter===index} aria-controls="survivors-chapter-stages" id={`survivors-chapter-${index}`} key={name} onClick={()=>setStageChapter(index)} onKeyDown={event=>{
                  const next=event.key==='ArrowRight'?(index+1)%5:event.key==='ArrowLeft'?(index+4)%5:event.key==='Home'?0:event.key==='End'?4:null;
                  if(next!==null){event.preventDefault();setStageChapter(next);event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('button')[next]?.focus();}
                }}>{name}</button>)}
              </div>
              <p className="survivors-chapter-story">{growthText.chapter_stories[stageChapter]}</p>
              <div id="survivors-chapter-stages" role="tabpanel" aria-labelledby={`survivors-chapter-${stageChapter}`}>
              <div className="survivors-stage-cards">
                {STAGE_IDS.slice(stageChapter*10,stageChapter*10+10).map(id => PATROL_STAGES[id]).map(stg => {
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
                      <img className="survivors-stage-thumbnail" src={stageGroundUri(stg.id)} alt="" loading="lazy" decoding="async"/>
                      <div className="survivors-stage-badge">
                        <span>{isUnlocked ? stg.icon : '🔒'}</span>
                        <strong>STAGE {String(stg.stageNumber).padStart(2, '0')}</strong>
                        {isUnlocked && (
                          <span className="survivors-stage-stars-tag">
                            {stars.map(s => (s ? '⭐' : '⚪')).join('')}
                          </span>
                        )}
                      </div>
                      <h4>{stg.name}</h4>
                      {stg.stageNumber>20&&<small className="survivors-stage-tier">{stg.stageNumber===50?growthText.final_stage:growthText.high_stage} · {String(stg.stageNumber).padStart(2,'0')}/50</small>}
                      <span className="survivors-stage-sub">{stg.subtitle}</span>
                      {isUnlocked && <small className="survivors-operation-preview">{operationText.modes[operationPlan(stg).mode]} · {operationText.victory_goal}</small>}
                      <p>{isUnlocked ? stg.description : `🔒 이전 구역 (STAGE ${String(stg.stageNumber - 1).padStart(2, '0')}) 완수 시 해금`}</p>
                      <div className="survivors-stage-meta">
                        <span>{isUnlocked ? `👹 ${stg.bossName}` : '보안 인가 필요'}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
              </div>
            </details>

            {/* CHARACTER SELECTOR */}
            <details open className="survivors-char-select-section survivors-ready-details" hidden={preflightTab!=='agent'}>
              <summary>{combatText.agent_select}</summary>
              <span className="survivors-section-label">순찰 요원 선택 (한국 현장팀 · 안전감시단)</span>
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
                      <img src={char.portraitUri} alt={char.name} className={`survivors-char-portrait-thumb ${char.id === 'safety_monitor' ? 'is-fullbody' : ''}`} />
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
            </details>

            <div className="survivors-controls-guide" hidden={preflightTab!=='settings'}>
              <div><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> / <kbd>터치 드래그</kbd> : 이동 | 📢 <strong>자동 요격</strong></div>
              <div>⚡ <strong>소장 샤우팅</strong>: <kbd>Space</kbd> / <kbd>F</kbd> (전화면 1.5초 시공간 정지 & 전리품 흡수)</div>
              <div>💼 <strong>보유 안전 크레딧</strong>: <strong>{psiCredits.toLocaleString()} PSI</strong></div>
              <div className="survivors-store-loadout" aria-label={storeText.status}>{storeInventory.equipped.length ? storeInventory.equipped.map(id => <span key={id}><SurvivorsPremiumArt item={STORE_ITEMS.find(item=>item.id===id)!}/>{storeText.items[id as keyof typeof storeText.items].name}</span>) : storeText.empty}</div>
            </div>

            <div hidden={preflightTab!=='settings'}><SurvivorsAudioMixer audio={audioRef.current}/><button type="button" className="survivors-btn-secondary" onClick={()=>setShowManual(true)}>{gameManualText('open')}</button></div>

            <div className="survivors-actions-row">
              <button type="button" className="survivors-btn-secondary" onClick={openStore}>
                {storeText.shopEntry}
              </button>
              <button type="button" className="survivors-btn-secondary" onClick={() => setShowArsenalModal(true)}>
                📖 대응 도구 진화 도감
              </button>
            </div>
          </div>
        </div>
      )}

      {/* R&D RESEARCH LAB MODAL */}
      {showRdModal && (
        <div className="survivors-modal-backdrop">
          <div ref={storeDialogRef} className="survivors-modal-content survivors-equipment-workspace" role="dialog" aria-modal="true" aria-label={storeText.title}>
            <div className="survivors-equipment-toolbar"><h2>{storeText.title}</h2><button type="button" title={storeText.close} aria-label={storeText.close} onClick={() => setShowRdModal(false)}>×</button></div>

            <SurvivorsEquipmentStore inventory={storeInventory} credits={psiCredits} message={storeMessage} onChange={changeStore} onRepair={repairStore} onApply={applyStore} live={phase==='paused'} characterId={selectedChar} upgrades={permanentUpgrades}/>
            {phase==='paused'&&<p className="survivors-durability-rule">{storeText.healthRule}</p>}

            <details hidden={phase==='paused'} className="survivors-store-upgrades"><summary>{storeText.upgrades}</summary><div className="survivors-rd-grid">
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

            </details><div className="survivors-actions-row">
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
          <div ref={arsenalDialogRef} role="dialog" aria-modal="true" aria-labelledby="survivors-arsenal-title" className="survivors-modal-content survivors-arsenal-dialog">
            <h2 id="survivors-arsenal-title" className="survivors-modal-title is-gold">{itemText.loadout_title}</h2>
            <p className="survivors-modal-sub">
              {itemText.evolution_rule}
            </p>

            <div className="survivors-recipes-grid">
              {(Object.entries(EVOLUTION_RECIPES)).map(([evoId, recipe]) => {
                const evo = PERK_CATALOG[evoId as PerkId];
                const weapon = PERK_CATALOG[recipe.weapon];
                const support = PERK_CATALOG[recipe.support];
                return (
                  <div key={evoId} className="survivors-recipe-card">
                    <div className="survivors-recipe-head">
                      <SurvivorsEquipmentIcon id={evoId as PerkId} level={1} />
                      <h4>{evo.name}</h4>
                    </div>
                    <div className="survivors-recipe-parts">
                      <span className="survivors-recipe-part">{weapon.name} ({activePerks[recipe.weapon] ?? 0}/5)</span>
                      <b>+</b>
                      <span className="survivors-recipe-part">{support.name} ({Math.min(1, activePerks[recipe.support] ?? 0)}/1)</span>
                    </div>
                    <progress aria-label={`${weapon.name} · ${itemText.equipment_progress}`} max={5} value={Math.min(5, activePerks[recipe.weapon] ?? 0)} />
                    <strong className="survivors-evolution-status">{(activePerks[evoId as PerkId] ?? 0)>0 ? itemText.evolution_complete : (activePerks[recipe.weapon] ?? 0)>=5 && (activePerks[recipe.support] ?? 0)>=1 ? itemText.evolution_ready : itemText.evolution_progress}</strong>
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
          <div ref={upgradeDialogRef} className="survivors-modal-content survivors-upgrade-dialog" role="dialog" aria-modal="true" aria-labelledby="survivors-upgrade-title">
            <h2 id="survivors-upgrade-title" className="survivors-modal-title is-gold">⚡ 안전 장비 & 역량 강화</h2>
            <p className="survivors-modal-sub">
              현장 안전 데이터 확보! 보급받을 안전 장비 또는 슈퍼 프로토콜을 선택하세요.
            </p>

            <div className="survivors-perk-cards">
              {perkOptions.map((perk, index) => {
                const isEvo = perk.category === 'evolution';
                const previousId=isEvo ? equipmentAppearance(perk.id,1)?.base ?? perk.id : perk.id;
                const previousLevel=activePerks[previousId];
                return (
                  <button
                    type="button"
                    aria-keyshortcuts={String(index + 1)}
                    key={perk.id}
                    className={`survivors-perk-card ${isEvo ? 'is-evolution' : ''}`}
                    onClick={() => handleSelectPerk(perk.id)}
                  >
                    <div className="survivors-perk-card-icon"><SurvivorsEquipmentIcon id={perk.id} level={perk.level} /></div>
                    <div className="survivors-perk-card-info">
                      <h4>
                        {index + 1}. {perk.name}
                        <span>{isEvo ? '★ SUPER EVOLUTION' : `LV ${perk.level}`}</span>
                      </h4>
                      <p>{perk.description}</p>
                      <SurvivorsEvolutionPreview id={perk.id} level={perk.level} active={activePerks} />
                      {engineRef.current && <SurvivorsUpgradeStats id={perk.id} level={perk.level} previousId={previousId} previousLevel={previousLevel ?? 0} player={engineRef.current.state.player} inFloodlight={Boolean(engineRef.current.state.inFloodlight)} />}
                      {perk.category !== 'support' && <div className="survivors-upgrade-preview">{previousLevel>0&&<SurvivorsEquipmentIcon id={previousId} level={previousLevel} />}<span>{itemText.upgrade_preview} →</span><SurvivorsEquipmentIcon id={perk.id} level={perk.level} /></div>}
                    </div>
                  </button>
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
      {phase === 'paused' && !accountabilityCase && !showRdModal && !showArsenalModal && (
        <div className="survivors-modal-backdrop">
          <div className="survivors-modal-content">
            <h2 className="survivors-modal-title">일시 정지</h2>
            <p className="survivors-modal-sub">현장 순찰이 일시 중단되었습니다.</p>
            <SurvivorsAudioMixer audio={audioRef.current}/>
            <section className="survivors-mission-brief" aria-label={combatText.objective_progress}><h3>{combatText.objective_progress}</h3><p>{operationText.brief}</p><p>{tacticsText.brief}</p>{engineRef.current && (() => {const p=operationProgress(engineRef.current.state);return <p>{operationText.modes[p.mode]} · {operationText.boss} {p.boss?'✓':'—'} · {operationText.zones} {p.zonesSecured}/{p.zones} · {operationText.controls} {p.controlsDone}/{p.controls}</p>;})()}<ol>{missionProgress.map(goal => <li key={goal.starIndex}><strong>{goal.title} · {goal.isCompleted ? combatText.objective_done : `${goal.currentValue}/${goal.targetValue}`}</strong><span>{goal.description}</span></li>)}</ol></section>
            <SurvivorsSupplyGuide activePerks={activePerks} />
            <div className="survivors-actions-row">
              {availableContainerShopWave!==null&&<button type="button" className="survivors-btn-primary" onClick={openContainerShop}>WAVE {availableContainerShopWave} 정비 보급 열기</button>}
              <button type="button" className="survivors-btn-secondary" onClick={openStore}>{storeText.shopEntry}</button>
              <button type="button" className="survivors-btn-secondary" onClick={openArsenal}>{focusText.equipment}</button>
              <button type="button" className="survivors-btn-secondary" onClick={() => setShowManual(true)}>{gameManualText('open')}</button>
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
          <div ref={resultDialogRef} className="survivors-modal-content survivors-result-dialog" role="dialog" aria-modal="true" aria-labelledby="survivors-result-title">
            <div className="survivors-result-body" tabIndex={0}>
            <h2 id="survivors-result-title" className="survivors-modal-title is-red">🚨 현장 중대위험 발생</h2>
            <p className="survivors-modal-sub">
              안전관리자의 방호 한계 초과로 현장에 사고가 발생했습니다.
            </p>
            {lastDamage && <p className="survivors-modal-sub">{combatText.damage_prefix}: {combatText.damage_sources[lastDamage.source]} · −{lastDamage.amount} HP</p>}
            <p className="survivors-modal-sub">{combatText.retry_hint}</p>

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
                <strong style={{ color: '#fbbf24' }}>+{engineRef.current?.state.psiCredits ?? 0} PSI</strong>
              </div>
            </div>

            </div>
            <div className="survivors-actions-row survivors-result-actions">
              <button
                type="button"
                className="survivors-btn-primary"
                onClick={() => {
                  initGame(selectedChar, selectedStage);
                }}
              >
                {resultText.retry_ready}
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
          <div ref={resultDialogRef} className="survivors-modal-content survivors-result-dialog" role="dialog" aria-modal="true" aria-labelledby="survivors-result-title">
            <div className="survivors-result-body" tabIndex={0}>
            <h2 id="survivors-result-title" className="survivors-modal-title is-green">
              🏆 {engineRef.current?.state.stage ? `${engineRef.current.state.stage.icon} STAGE ${String(engineRef.current.state.stage.stageNumber).padStart(2, '0')} 클리어!` : '야간 무사고 달성 완료!'}
            </h2>
            <p className="survivors-modal-sub">
              {engineRef.current?.state.stage ? `${engineRef.current.state.stage.name} (${engineRef.current.state.stage.subtitle}) 구역을 안전하게 사수했습니다!` : '3분간의 극한 야간 타설 현장을 단 한 건의 사고 없이 안전하게 사수했습니다!'}
            </p>

            <p className="survivors-story-result">{operationText.handoff}</p>
            {clearGearWear.length>0&&<section className="survivors-clear-maintenance"><h3>{storeText.clearWear} · −{STORE_CLEAR_WEAR}</h3>{clearGearWear.map(id=><p key={id}>{storeText.items[id as keyof typeof storeText.items].name} · {storeText.durability} {itemDurability(storeInventory,id)}/100 {itemDurability(storeInventory,id)===0?storeText.broken:''}</p>)}</section>}
            {storeMessage===storeText.failure&&<p role="alert">{storeMessage}</p>}
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
                <strong style={{ color: '#10b981' }}>{operationText.grades[engineRef.current?.state.starsEarned.filter(Boolean).length ?? 0]}</strong>
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
                <strong style={{ color: '#fbbf24' }}>+{engineRef.current?.state.psiCredits ?? 0} PSI</strong>
              </div>
              <div className="survivors-stat-box">
                <span>Signature Mastery</span>
                <strong className={engineRef.current?.state.signatureMastery?.zeroDay?'is-zero-day-mastery':''}>
                  {engineRef.current?.state.signatureMastery?.zeroDay?'ZERO DAY ×3':`BEST ×${engineRef.current?.state.signatureMastery?.best??0}`}
                </strong>
              </div>
            </div>

            {PATROL_STAGES[selectedStage].narrative && <p className="survivors-story-result">{engineRef.current?.state.starsEarned[1] ? PATROL_STAGES[selectedStage].narrative!.success : PATROL_STAGES[selectedStage].narrative!.residual}</p>}
            <SurvivorsGrowthRecord records={growthRecords} characterId={selectedChar}/>
            <p role={growthSaveFailed?'alert':'status'}>{growthSaveFailed?growthText.growth_unsaved:growthText.growth_saved}</p>
            {growthSaveFailed&&<button type="button" onClick={()=>persistGrowth(growthRecords)}>{growthText.growth_retry}</button>}
            {accountabilityMemory(accountability)&&<p className="survivors-story-result">{accountabilityMemory(accountability)}</p>}
            </div>
            <div className="survivors-actions-row survivors-result-actions">
              {(() => {
                const stageList = STAGE_IDS;
                const currentIdx = stageList.indexOf(selectedStage);
                const nextStage = currentIdx >= 0 && currentIdx < stageList.length - 1 ? stageList[currentIdx + 1] : null;

                if (nextStage) {
                  return (
                    <button
                      type="button"
                      className="survivors-btn-primary"
                      onClick={() => {
                        setSelectedStage(nextStage);
                        setStageChapter(Math.floor(STAGE_IDS.indexOf(nextStage)/10));
                        initGame(selectedChar, nextStage);
                      }}
                    >
                      {resultText.next_ready}
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
                }}
              >
                {resultText.retry_ready}
              </button>
              <button type="button" className="survivors-btn-secondary" onClick={exitSession}>
                현장 복귀
              </button>
            </div>
          </div>
        </div>
      )}
      {accountabilityCase&&<SurvivorsAccountabilityEvent key={accountabilityCase.id} incident={accountabilityCase} state={accountability} portraitUri={CHARACTER_PROFILES.kang_taesik.portraitUri}
        onEvidence={()=>audioRef.current.playDecisionCue('evidence')}
        onDecide={(action,evidence)=>{
          const next=decideAccountability(accountability,accountabilityCase,action,evidence);
          setAccountability(next);
          try{localStorage.setItem(ACCOUNTABILITY_SAVE_KEY,writeAccountability(next));}catch{/* Session memory remains available. */}
          const outcome=next.decisions.at(-1)!.outcome;
          audioRef.current.playDecisionCue(outcome==='site_excluded'?'exclude':outcome==='review_hold'?'hold':'record');
          return accountabilityResult(outcome);
        }}
        onContinue={()=>{setAccountabilityCase(null);audioRef.current.setDialogueFocus(false);audioRef.current.stopScore();engineRef.current?.setPaused(false);setPhase('playing');lastTimeRef.current=performance.now();}}
        onLeave={()=>{setAccountabilityCase(null);audioRef.current.setDialogueFocus(false);exitSession();}}
      />}
      {showContainerShop && engineRef.current && (
        <SurvivorsContainerShop
          completedWave={containerShopWave}
          gameState={engineRef.current.state}
          onContinue={() => {
            setShowContainerShop(false);
            setWaveSupplyNotice(null);
            if (engineRef.current) {
              engineRef.current.setPaused(false);
              setPhase('playing');
              lastTimeRef.current = performance.now();
            }
          }}
          playSfx={playSfx}
        />
      )}
    </div>
  );
}

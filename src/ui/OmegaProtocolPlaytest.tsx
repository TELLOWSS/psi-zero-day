import {OMEGA_PROTECTED_REVIEW} from './omega-protected-review';
import {useCallback,useEffect,useRef,useState} from 'react';
import {readOmegaProtocolAccess} from '../app/omega-protocol-access';
import {OmegaProtocolCombatSession,type OmegaCombatSnapshot} from '../engine/omega-protocol-combat';
import {OMEGA_UPGRADES,OMEGA_PROTOCOL_TOTAL_WAVES,type OmegaUpgradeId} from '../domain/omega-protocol-run';
import {omegaStoryNode,OMEGA_STORY_ACTS} from '../domain/omega-protocol-story';
import {WORLD_WIDTH,WORLD_HEIGHT} from '../engine/patrol-survivors-engine';
import {omegaFieldTargetGuide,OMEGA_QUARTER_VIEW,type OmegaFieldPlan,type OmegaFieldObstacle} from '../domain/omega-protocol-field';
import {omegaActBoundaryDock,OMEGA_CONNECTED_MAX_ELEVATION,OMEGA_DECK_BOARDING_SECONDS,omegaConnectedDeckElevation,omegaConnectedVerticalTravelSeconds} from '../domain/omega-protocol-field-transit';
import {drawOmegaUpperDeckEdge,drawOmegaUpperDeckProp} from './omega-protocol-upper-deck';
import {drawOmegaActBoundaryDock,drawOmegaConnectedBoardingPad,drawOmegaConnectedLift,drawOmegaConnectedLiftFrontRail,drawOmegaConnectedServiceTunnel,drawOmegaConnectedAirlock} from './omega-protocol-act-lift';
import {OmegaSupplyUpgradeIcon,omegaSupplyUpgradeMeta} from './omega-protocol-supply-ui';
import {drawOmegaFieldGround,drawOmegaFieldProp,drawOmegaFieldMission,drawOmegaBossTelegraph} from './omega-protocol-field-render';
import {omegaFieldDepthOrder} from './omega-protocol-depth-scene';
import {drawOmegaMissionDevice,drawOmegaExtractionUnit} from './omega-protocol-mission-visuals';
import {omegaPrepareAuthoredScene} from './omega-protocol-authored-scene';
import {omegaQuarterViewCamera,applyOmegaQuarterView,omegaCameraTargetZoom,type OmegaCameraFocus,type OmegaCameraState} from './omega-protocol-camera';
import {drawOmegaProtocolEnemy} from './omega-protocol-enemy-render';
import {omegaInfectedCandidateReview,omegaInfectedLabRequested,omegaInfectedSoloKind} from './omega-infected-candidate-review';
import {omegaCounterplayCues,omegaNearestCounterplayCue,omegaDashAvailability,drawOmegaCounterplayCues} from './omega-protocol-counterplay';
import {omegaCombatProbeMode,omegaSetupCombatProbe,type OmegaCombatProbeFixture} from './omega-combat-browser-probe';
import {drawOmegaProtocolActor,omegaFieldHeading} from './omega-protocol-actor-render';
import {OmegaAiraV2CandidateImages,drawOmegaAiraV2Candidate} from './omega-aira-v2-candidate';
import {omegaLoadSilverPreview,omegaLoadSilverRepoReview,omegaSilverPreviewEnabled,type OmegaSilverPreviewSession} from './omega-canonical-local-preview';
import {omegaSceneBudget,drawOmegaSectorOneActorLight,drawOmegaSectorOneAir,drawOmegaSectorOneGrade} from './omega-protocol-sector-one-scene';
import {omegaM12Budget,drawOmegaM12TerrainShadows,drawOmegaM12ActorFootShadow,drawOmegaM12StructureFacets,drawOmegaM12DistanceHaze,drawOmegaM12OcclusionBeacon} from './omega-protocol-m12-depth';
import {omegaG2Quality,drawOmegaG2EntrySurface,drawOmegaG2RearEnvironment,drawOmegaG2NativeFacade,drawOmegaG2BoundaryRail} from './omega-protocol-m12-authored-industrial';
import {omegaG3Budget,drawOmegaG3ParallaxArchitecture,drawOmegaG3NativeMesh} from './omega-protocol-m12-parallax';
import {omegaG4Budget,omegaG4SilverLabRequested,drawOmegaG4CenterStageMaterial,drawOmegaG4ActorGrounding} from './omega-protocol-m12-combat-fidelity';
import {omegaG5DevRequested,omegaG5VectorStudyRequested,omegaG5Art} from './omega-protocol-m12-g5-art';
import {omegaG5bLabRequested,OMEGA_G5B_ART_APPROVAL} from './omega-protocol-m12g5b-art-gate';
import {omegaG5cLabRequested,omegaG5cReview,OMEGA_G5C_ART_POLICY} from './omega-protocol-m12g5c-local-art-review';
import {omegaG5dLabRequested,omegaG5dImportRepoCandidates,OMEGA_G5D_ART_GATE} from './omega-protocol-m12g5d-actual-source';
import {omegaG5eLabRequested,OMEGA_G5E_ART_STATUS,omegaG5eFx} from './omega-protocol-m12g5e-silver-action-fx';
import {omegaG5gLabRequested,omegaG5hRealHitLabRequested,omegaG5hFourPoseNativeHitHold,OMEGA_G5H_ART_GATE,OMEGA_G5G_ART_APPROVAL,omegaG5gNativePoseStudy} from './omega-protocol-m12g5g-native-pose';
import {omegaG5iLabRequested,omegaG5iActionPreview,OMEGA_G5I_ART_GATE} from './omega-protocol-m12g5i-action-art';
import {OmegaCandidateArtAudit,omegaVerifiedG5dWalkCards,type OmegaVisualAuditFrame} from './omega-candidate-art-audit';
import {omegaG5nFetchQaSources} from './omega-m12g5n-recovered-sources';
import {OmegaGroundedGait,type OmegaWalkPose} from './omega-protocol-grounded-gait';
import {OmegaActorFacingController,type OmegaActorDirectionPose} from './omega-protocol-action-facing';
import {omegaResolveArtAction,OmegaTerminalMotionClock} from './omega-protocol-art-motion';
import {drawOmegaApprovedActor,OmegaApprovedImageCache,OMEGA_PROTOCOL_APPROVED_ART,OMEGA_PROTOCOL_BINARY_AUDIT_PASSED} from './omega-protocol-art-slot';
import {omegaAdvanceActorFireCue,OMEGA_EMPTY_FIRE_CUE,type OmegaActorFireCue} from './omega-protocol-actor-cues';
import {omegaAdvanceImpactFx,drawOmegaImpactFx,type OmegaImpactFx} from './omega-protocol-impact-vfx';
import {omegaAdvanceDashEchoes,drawOmegaDashEnergy,drawOmegaGroundedSplash,type OmegaDashEcho} from './omega-protocol-dash-visuals';
import {
 omega3DBudget,drawOmega3DBackdrop,drawOmega3DGroundSurface,drawOmega3DPropRelief,
 drawOmega3DActorLighting,drawOmega3DOcclusionGuide,
 drawOmega3DForegroundAtmosphere,
} from './omega-protocol-atmosphere-3d';
import {omegaPrepareEnvArt,drawOmegaPaintedVista,drawOmegaPaintedFloor} from './omega-protocol-env-art';
import {drawOmegaLivingBackdrop,drawOmegaLivingGround,drawOmegaLivingProp} from './omega-protocol-living-world';
import {
 OmegaMotionSmoother,omegaSilverLocalMuzzle,omegaWorldPointFromUprightOffset,
 OmegaBallisticTracerTracker,drawOmegaBallisticProjectile,type OmegaSmoothedVelocity,
} from './omega-protocol-silver-kinetics';
import {
 omegaPrepareVfxAndPropArt,drawOmegaAuthored3DProp,drawOmegaPaintedBladeSlash,
} from './omega-protocol-vfx-art';
import {omegaPrepareEntityArt} from './omega-protocol-entity-art';
import {
 OMEGA_LOADOUTS,OMEGA_STRIKERS,OMEGA_EVOLUTIONS,OMEGA_BLACKBOX_DOSSIERS,
 omegaDailySeed,omegaEvaluateBlackboxUnlocks,
 type OmegaLoadoutId,type OmegaStrikerId,
} from '../domain/omega-protocol-zero-signal';
import {
 OmegaZeroSignalDirector,type OmegaDirectorEvent,type OmegaZeroSignalHudSnapshot,
} from '../engine/omega-protocol-zero-signal-director';
import {OmegaProceduralAudio,type OmegaHitMaterial} from './omega-protocol-audio';
import {drawOmegaZeroSignalWorldFx,drawOmegaZeroSignalScreenFx} from './omega-protocol-zero-signal-fx';
import {OmegaAdaptiveFrameGovernor,readOmegaPerfPreset,resolveOmegaMobileProfile,saveOmegaPerfPreset,type OmegaMobileProfile,type OmegaPerfPreset} from './omega-protocol-mobile-perf';
import {drawOmegaEdgeNavigationIndicators,drawOmegaTacticalRadar} from './omega-protocol-navigation-hud';
import {OMEGA_BLADE_COOLDOWN} from '../domain/omega-protocol-blade';
import './omega-protocol-playtest.css';

const keys=['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','W','A','S','D'] as const;
const validKeys=new Set<string>(keys);
// Explicit fail-closed sprite slot: binaries from PR #234 are not yet approved
// or present in this branch. Cache allocates images only after a real approval.
const approvedHeroCache=new OmegaApprovedImageCache(36);
const userApprovedAiraV2=new OmegaAiraV2CandidateImages();
const buttonDirections=[{label:'↑',x:0,y:-1},{label:'←',x:-1,y:0},{label:'↓',x:0,y:1},{label:'→',x:1,y:0}];
// In-memory only, development QA provenance. Never available to production
// users, never writes a profile/save and never bypasses a real unlock CTA.
const omegaCombatBrowserFixtures=new WeakMap<OmegaProtocolCombatSession,OmegaCombatProbeFixture>();
const ZERO_SIGNAL_ARCHIVE_KEY='psi:omega-zero-signal:archive:v1';
function readZeroSignalArchive():readonly string[]{
 try{
  if(typeof window==='undefined')return [];
  const raw=window.localStorage.getItem(ZERO_SIGNAL_ARCHIVE_KEY);
  const parsed=raw?JSON.parse(raw):[];
  return Array.isArray(parsed)?parsed.filter((v):v is string=>typeof v==='string'):[];
 }catch{return [];}
}
function saveZeroSignalArchive(ids:readonly string[]):void{
 try{
  if(typeof window!=='undefined')window.localStorage.setItem(ZERO_SIGNAL_ARCHIVE_KEY,JSON.stringify(ids));
 }catch{void 0;}
}
const CLEAN_HUD_STORAGE_KEY='psi:omega-zero-signal:clean-hud:v1';
function readCleanHudPreference():boolean{
 try{
  return typeof window!=='undefined'&&window.localStorage.getItem(CLEAN_HUD_STORAGE_KEY)==='1';
 }catch{return false;}
}
function saveCleanHudPreference(value:boolean):void{
 try{
  if(typeof window!=='undefined')window.localStorage.setItem(CLEAN_HUD_STORAGE_KEY,value?'1':'0');
 }catch{void 0;}
}
function shouldBypassBriefingOnLaunch():boolean{
 if(typeof window==='undefined')return true;
 const params=new URLSearchParams(window.location.search);
 return ['omegaQaState','omegaView','omegaSilverPreview','omegaM12G4','omegaM12G5','omegaM12G5b','omegaM12G5c','omegaM12G5d','omegaM12G5e','omegaM12G5g','omegaM12G5h','omegaM12G5i','omegaInfected','omegaG5VectorStudy','omegaCombatProbe'].some(k=>params.has(k));
}
function playDirectorAudio(audio:OmegaProceduralAudio,events:readonly OmegaDirectorEvent[],session:OmegaProtocolCombatSession):void{
 for(const ev of events){
  if(ev.kind==='gunshot')audio.playGunshot(ev.detail==='overclock');
  else if(ev.kind==='hit_impact')audio.playHitImpact((ev.detail as OmegaHitMaterial|undefined)??'normal');
  else if(ev.kind==='detonation')audio.playDetonation(ev.numeric??1);
  else if(ev.kind==='phantom_dodge')audio.playPhantomDodge();
  else if(ev.kind==='striker'&&ev.detail)audio.playStriker(ev.detail as OmegaStrikerId);
  else if(ev.kind==='rank_up'&&ev.detail)audio.playRankUp(ev.detail as OmegaZeroSignalHudSnapshot['styleRank']);
  else if(ev.kind==='pickup'||ev.kind==='weave_bonus')audio.playPickup();
  else if(ev.kind==='shield_absorb')audio.playShieldAbsorb();
  else if(ev.kind==='player_hurt')audio.playPlayerHurt();
  else if(ev.kind==='shield_break')audio.playShieldBreak();
  else if(ev.kind==='evo_unlock')audio.playEvoUnlock();
  else if(ev.kind==='boss_entry')audio.playBossEntry();
  else if(ev.kind==='wave_clear')audio.playWaveClear();
  else if(ev.kind==='victory')audio.playVictory();
  else if(ev.kind==='defeat')audio.playDefeat();
  else if(ev.kind==='auto_interact')audio.playPickup();
  else if(ev.kind==='rail_burst')audio.playRailBurst(ev.detail==='focus');
  else if(ev.kind==='weapon_mode')audio.playWeaponSwitch(ev.detail==='focus'?'focus':'rapid');
 }
 void session;
}
function drawLab(ctx:CanvasRenderingContext2D,session:OmegaProtocolCombatSession,fireCue:OmegaActorFireCue,impacts:readonly OmegaImpactFx[],gait:OmegaWalkPose,pose:OmegaActorDirectionPose,terminalElapsed:number,cameraZoom=1.55,echoes:readonly OmegaDashEcho[]=[],g5hTrueHitReview=false,motion:OmegaSmoothedVelocity={vx:0,vy:0,speedRatio:0},tracerTracker?:OmegaBallisticTracerTracker,director?:OmegaZeroSignalDirector,mobileProfile?:OmegaMobileProfile,cleanHud=false){
 const state=session.engine.state;
 const effProfile=mobileProfile??resolveOmegaMobileProfile(ctx.canvas.width,ctx.canvas.height,1,'auto');
 ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
 ctx.fillStyle='#070e19';ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);
 ctx.save();
 // 3/4 field view is strictly visual: world XY hitboxes and Watch
 // movement are unchanged. Follow the projected hero and bound the map.
 const field=session.field;
 const passage=field&&session.connectedFields?.[field.plan.wave-1]?session.connectedFields:null;
 const offset=session.fieldWorldOffsetX;
 const fieldElevation=session.fieldElevation;
 const actorElevation=session.playerElevation;
 const skew=OMEGA_QUARTER_VIEW.skewX;
 const worldCamera=omegaQuarterViewCamera({
  x:state.player.x+offset+actorElevation*skew,y:state.player.y-actorElevation,
 },ctx.canvas.width,ctx.canvas.height,cameraZoom+(director?.zoomPunch??0),(passage?.length??1)*WORLD_WIDTH,
  passage?OMEGA_CONNECTED_MAX_ELEVATION:0);
 const camera=offset===0?worldCamera:{
  ...worldCamera,projectedOffsetX:worldCamera.projectedOffsetX+offset,
 };
 const atm3DBudget=omega3DBudget(ctx.canvas.width,ctx.canvas.height);
 if(field){
  const paintedVista=drawOmegaPaintedVista(ctx,field.plan,worldCamera,ctx.canvas.width,ctx.canvas.height,atm3DBudget);
  drawOmega3DBackdrop(ctx,field.plan,worldCamera,ctx.canvas.width,ctx.canvas.height,state.gameTime,atm3DBudget,paintedVista);
  if(!effProfile.skipSecondaryAtmosphere||!paintedVista){
   drawOmegaLivingBackdrop(ctx,field.plan,worldCamera,ctx.canvas.width,ctx.canvas.height,state.gameTime,atm3DBudget);
  }
 }
 applyOmegaQuarterView(ctx,camera);
 if(director&&director.cameraShake>0.1){
  const sx=Math.sin(state.gameTime*73)*director.cameraShake*0.5+director.shakeDirX*director.cameraShake*0.35;
  const sy=Math.cos(state.gameTime*61)*director.cameraShake*0.38+director.shakeDirY*director.cameraShake*0.35;
  ctx.translate(sx,sy);
 }
 ctx.translate(fieldElevation*skew,-fieldElevation);
 const m12Budget=omegaM12Budget(ctx.canvas.width,ctx.canvas.height);
 const m12G2Quality=omegaG2Quality(ctx.canvas.width,ctx.canvas.height);
 const m12G3Budget=omegaG3Budget(ctx.canvas.width,ctx.canvas.height);
 const m12G4Budget=omegaG4Budget(ctx.canvas.width,ctx.canvas.height);
 let anyPaintedFloor=false;
 const drawGround=(plan:OmegaFieldPlan)=>{
  const paintedFloor=drawOmegaPaintedFloor(ctx,plan);
  if(paintedFloor){
   anyPaintedFloor=true;
  }else{
   drawOmegaFieldGround(ctx,plan,false);
   drawOmegaG2EntrySurface(ctx,plan,state.gameTime,m12G2Quality);
   drawOmegaG4CenterStageMaterial(ctx,plan,m12G4Budget);
   drawOmegaG2RearEnvironment(ctx,plan,state.gameTime,m12G2Quality);
  }
  if(!effProfile.skipSecondaryAtmosphere){
   if(paintedFloor)drawOmegaG4CenterStageMaterial(ctx,plan,m12G4Budget);
   drawOmegaM12TerrainShadows(ctx,plan,m12Budget);
   drawOmegaM12DistanceHaze(ctx,plan,state.gameTime,m12Budget);
  }
  drawOmega3DGroundSurface(ctx,plan,state.gameTime,atm3DBudget);
  drawOmegaLivingGround(ctx,plan,state.gameTime,atm3DBudget);
  if(passage){
   ctx.strokeStyle=paintedFloor?'rgba(116,204,228,.22)':'#446377';
   ctx.lineWidth=paintedFloor?3:14;
   ctx.beginPath();
   ctx.moveTo(0,14);ctx.lineTo(WORLD_WIDTH,14);
   ctx.moveTo(0,WORLD_HEIGHT-14);ctx.lineTo(WORLD_WIDTH,WORLD_HEIGHT-14);
   if(plan.wave===1){ctx.moveTo(14,14);ctx.lineTo(14,WORLD_HEIGHT-14);}
   if(plan.wave===passage.length){
    ctx.moveTo(WORLD_WIDTH-14,14);ctx.lineTo(WORLD_WIDTH-14,WORLD_HEIGHT-14);
   }
   ctx.stroke();
  }
 };
 const drawProp=(plan:OmegaFieldPlan,obstacle:OmegaFieldObstacle)=>{
  const authoredProp=drawOmegaAuthored3DProp(ctx,plan,obstacle,camera,state.gameTime);
  if(!authoredProp){
   if(!drawOmegaUpperDeckProp(ctx,plan,obstacle)){
    drawOmegaFieldProp(ctx,plan,obstacle);
    drawOmegaM12StructureFacets(ctx,plan,obstacle,state.gameTime,m12Budget);
    drawOmegaG2NativeFacade(ctx,plan,obstacle,state.gameTime,m12G2Quality);
    drawOmegaG3NativeMesh(ctx,plan,obstacle,m12G3Budget);
   }
   drawOmega3DPropRelief(ctx,plan,obstacle,state.gameTime,atm3DBudget);
  }
  drawOmegaLivingProp(ctx,plan,obstacle,state.player,state.gameTime,atm3DBudget,authoredProp);
 };
 if(field){
  drawGround(field.plan);
  if(!passage&&omegaConnectedDeckElevation(field.plan.wave))
   drawOmegaUpperDeckEdge(ctx,([4,7,10].includes(field.plan.wave))?field.plan.entry.y:undefined);
  if(passage){
   const viewLeft=-worldCamera.projectedOffsetX;
   const viewRight=viewLeft+ctx.canvas.width/worldCamera.scale;
   const tileSkew=worldCamera.skewX*WORLD_HEIGHT;
   for(const [index,neighbor] of passage.entries()){
    const origin=index*WORLD_WIDTH;
    if(viewRight<origin+Math.min(0,tileSkew)-128||
       viewLeft>origin+WORLD_WIDTH+Math.max(0,tileSkew)+128)continue;
    const elevation=omegaConnectedDeckElevation(neighbor.wave);
    const raised=elevation-fieldElevation;
    ctx.save();ctx.translate(origin-offset+raised*skew,-raised);
    if(neighbor.wave!==field.plan.wave){
     drawGround(neighbor);
     const nDock=omegaActBoundaryDock(neighbor);
     if(nDock&&['scaffold_lift','crane_elevator','service_tunnel'].includes(nDock.kind))
      drawOmegaConnectedBoardingPad(ctx,nDock,state.gameTime);
     else drawOmegaActBoundaryDock(ctx,neighbor,state.gameTime);
     for(const obstacle of neighbor.obstacles)drawProp(neighbor,obstacle);
    }
    if(elevation)drawOmegaUpperDeckEdge(ctx,([4,7,10].includes(neighbor.wave))?neighbor.entry.y:undefined);
    ctx.restore();
   }

   ctx.save();ctx.translate(-offset-fieldElevation*skew,fieldElevation);
   const drawLane=(start:number,end:number,y:number)=>{
    ctx.save();
    ctx.fillStyle=anyPaintedFloor?'rgba(8,20,34,.62)':'rgba(18,34,48,.76)';
    ctx.fillRect(start,y-36,end-start,72);
    ctx.strokeStyle=anyPaintedFloor?'rgba(103,232,249,.38)':'rgba(124,233,255,.46)';
    ctx.lineWidth=1.8;
    ctx.beginPath();ctx.moveTo(start,y-36);ctx.lineTo(end,y-36);
    ctx.moveTo(start,y+36);ctx.lineTo(end,y+36);ctx.stroke();
    ctx.strokeStyle='rgba(251,191,36,.32)';
    ctx.lineWidth=1.5;
    for(let x=start+36;x<end-24;x+=68){
     ctx.beginPath();ctx.moveTo(x-8,y-10);ctx.lineTo(x+4,y);ctx.lineTo(x-8,y+10);ctx.stroke();
    }
    ctx.restore();
   };
   for(let index=0;index<passage.length-1;index++){
    const {exit}=passage[index]!;
    const start=index*WORLD_WIDTH+exit.x;
    const edge=(index+1)*WORLD_WIDTH;
    const end=edge+passage[index+1]!.entry.x;
    if(viewRight<start+Math.min(0,tileSkew)-128||viewLeft>end+Math.max(0,tileSkew)+128)continue;
    const fromElevation=omegaConnectedDeckElevation(index+1);
    const nextElevation=omegaConnectedDeckElevation(index+2);
    ctx.save();ctx.translate(fromElevation*skew,-fromElevation);
    drawLane(start,fromElevation===nextElevation?end:edge,exit.y);
    if(index===11){
     ctx.save();ctx.setLineDash([]);
     const transit=session.gateTransit;
     drawOmegaConnectedAirlock(ctx,edge,exit.y,skew,
      transit?.link.fromWave===12?transit:null,
      field.plan.wave===12&&session.run.phase==='reward',field.plan.wave>=13);
     ctx.restore();
    }
    ctx.restore();
    if(fromElevation===nextElevation)continue;
    ctx.save();ctx.translate(nextElevation*skew,-nextElevation);
    drawLane(edge,end,exit.y);
    ctx.restore();
    ctx.save();ctx.setLineDash([]);
    const rise=nextElevation-fromElevation;
    const distance=Math.abs(rise);
    const position=field.plan.wave<=index?0:field.plan.wave>=index+2?distance
     :Math.max(0,Math.min(distance,(actorElevation-fromElevation)*Math.sign(rise)));
    ctx.translate(fromElevation*skew,-fromElevation);
    if(rise<0)drawOmegaConnectedServiceTunnel(ctx,edge,exit.y,distance,position,skew);
    else drawOmegaConnectedLift(ctx,edge,exit.y,rise,position,skew,index===5);
    ctx.restore();
   }
   ctx.restore();
  }
  if(!anyPaintedFloor){
   drawOmegaG3ParallaxArchitecture(ctx,passage?.[0]??field.plan,worldCamera,
    ctx.canvas.width,ctx.canvas.height,cameraZoom,m12G3Budget);
  }
  const curDock=passage?omegaActBoundaryDock(field.plan):null;
  if(curDock&&['scaffold_lift','crane_elevator','service_tunnel'].includes(curDock.kind))
   drawOmegaConnectedBoardingPad(ctx,curDock,state.gameTime);
  else drawOmegaActBoundaryDock(ctx,field.plan,state.gameTime);
  drawOmegaSectorOneActorLight(ctx,field.plan,state.player,state.gameTime);
  // All original actor contact reflections sit on the floor BEFORE real
  // boss warnings, enemy AI indicators, walls, players and weapons.
  if(!effProfile.skipSecondaryAtmosphere){
   drawOmegaG4ActorGrounding(ctx,field.plan,state.player,'silver-aira',m12G4Budget);
   for(const enemy of state.hazards)if(enemy.hp>0){
    drawOmegaG4ActorGrounding(ctx,field.plan,enemy,enemy.isStageBoss?'boss':'infected',
     m12G4Budget,Math.max(18,Math.min(38,enemy.radius??24)));
   }
  }
  const latestSlash=session.lastBladeStrike;
  const bladeFlash=latestSlash&&state.gameTime-latestSlash.time>=0&&state.gameTime-latestSlash.time<.18
   ?1-(state.gameTime-latestSlash.time)/.18:0;
  const muzzleFlash=Number.isFinite(fireCue.until)&&fireCue.until>=state.gameTime?1:0;
  drawOmega3DActorLighting(ctx,field.plan,state.player,{x:pose.weaponX,y:pose.weaponY},
   state.hazards,state.gameTime,{muzzle:muzzleFlash,blade:bladeFlash},atm3DBudget);
 }
 else{
  ctx.fillStyle='#111a2b';ctx.fillRect(0,0,WORLD_WIDTH,WORLD_HEIGHT);
  ctx.strokeStyle='#243548';ctx.lineWidth=1;
  for(let x=0;x<=WORLD_WIDTH;x+=70){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,WORLD_HEIGHT);ctx.stroke();}
  for(let y=0;y<=WORLD_HEIGHT;y+=70){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(WORLD_WIDTH,y);ctx.stroke();}
 }
 if(!passage){
  ctx.strokeStyle='#446377';ctx.lineWidth=14;
  ctx.strokeRect(14,14,WORLD_WIDTH-28,WORLD_HEIGHT-28);
 }
 const telegraph=session.snapshot.bossTelegraph;
 if(telegraph)drawOmegaBossTelegraph(ctx,telegraph,state.gameTime);
 // Native-only locked headings; unchanged Watch hitboxes/timers.
 drawOmegaCounterplayCues(ctx,omegaCounterplayCues(state.hazards,id=>session.zombieBrain(id)),state.gameTime,field?.plan.obstacles??[]);
 // Genuine dash trail remains under all live Watch enemies and hero.
 drawOmegaDashEnergy(ctx,echoes,state.gameTime);
 const p=state.player;
 const renderHazard=(h:(typeof state.hazards)[number])=>{
  if(h.hp<=0)return;
  if(field)drawOmegaM12ActorFootShadow(ctx,h,Math.min(45,Math.max(19,h.radius??24)));
  ctx.save();ctx.translate(h.x,h.y);
  ctx.transform(1,0,-camera.skewX/camera.groundYScale,1/camera.groundYScale,0,0);
  drawOmegaProtocolEnemy(ctx,h,state.gameTime,
   {finalBoss:Boolean(h.isStageBoss)&&session.plan.wave===15,
    zombie:session.zombieBrain(h.id)??undefined,
    infectedReview:OMEGA_PROTECTED_REVIEW||(typeof window!=='undefined'&&omegaInfectedLabRequested(window.location.search,import.meta.env.DEV||import.meta.env.VITE_OMEGA_PROTOCOL_LAB==='1')),targetX:p.x});
  ctx.restore();
 };
 const renderHero=()=>{
 ctx.save();
 const lift=actorElevation-fieldElevation;
 ctx.translate(lift*skew,-lift);
 // Independent eight-heading tactical actor placeholder, not an AIRA skin.
 if(field)drawOmegaM12ActorFootShadow(ctx,p,27);
 ctx.save();ctx.translate(p.x,p.y);
 ctx.transform(1,0,-camera.skewX/camera.groundYScale,1/camera.groundYScale,0,0);
 // Torso turns with bounded speed while genuine launch feedback aims the
 // muzzle instantly. Gameplay fire/aim physics are never changed.
 const blade=session.lastBladeStrike;
 const bladeAge=blade&&state.gameTime-blade.time>=0&&state.gameTime-blade.time<=.28
  ?state.gameTime-blade.time:undefined;
 const actorView={
  facingX:pose.bodyX,facingY:pose.bodyY,
  weaponFacingX:pose.weaponX,weaponFacingY:pose.weaponY,
  moving:gait.active,gait,
  time:state.gameTime,dashing:Boolean(p.isDashing),
  shooting:pose.shooting,
  hurt:Boolean(state.lastDamage&&state.lastDamage.remaining>1.85),
  velocityX:motion.vx,velocityY:motion.vy,speedRatio:motion.speedRatio,
  ...(blade&&bladeAge!==undefined?{
   bladeAge,bladeCombo:blade.combo,
   bladeFacingX:blade.facingX,bladeFacingY:blade.facingY,
   bladeHits:blade.hits,
  }:{}),
 };
 // AIRA's final authored 8x20 pack has six action groups. Read real native
 // Watch states in priority order; never use the FIRE age for DASH/HIT or
 // fabricate an ultimate animation from an uncharged HUD button.
 const action=omegaResolveArtAction({
  gameTime:state.gameTime,runPhase:session.run.phase,
  enginePhase:state.phase,directorShoutTimer:state.directorShoutTimer,
  isDashing:Boolean(p.isDashing),dashRemaining:p.dashDuration??0,
  hurtRemaining:state.lastDamage?.remaining??0,fireUntil:fireCue.until,
  terminalElapsed,
 });
 // Native HP damage + actual infected brain strike is the ONLY G5h source.
 // This extends the optical HIT pose through four original source frames
 // without changing the real Watch damage clock, physics or invincibility.
 const nativeBrainHit=g5hTrueHitReview&&
  session.zombieTelemetry.some(z=>z.kind==='drifter'&&z.hits>0);
 const hitHold=g5hTrueHitReview?omegaG5hFourPoseNativeHitHold(
  state.lastDamage?.remaining??0,nativeBrainHit?1:0,
  session.run.phase==='battle'&&state.phase==='playing'):null;
 const renderAction=hitHold?{...action,...hitHold}:action;
 const artView={...actorView,...renderAction,
  // A muzzle flash is valid only while genuine Watch fire feedback remains.
  shooting:Boolean(renderAction.shooting&&pose.shooting)};
 // The fallback receives real ultimate/finish flags; its muzzle only uses
 // the native 90ms fire event, not the 75ms authored-sprite follow-through.
 if(!drawOmegaApprovedActor(ctx,OMEGA_PROTOCOL_APPROVED_ART,
     OMEGA_PROTOCOL_BINARY_AUDIT_PASSED,approvedHeroCache,artView)&&
    !drawOmegaAiraV2Candidate(ctx,artView,userApprovedAiraV2)){
  drawOmegaProtocolActor(ctx,{...actorView,
   shooting:action.shooting&&pose.shooting,
   dashing:action.dashing,hurt:action.hurt,
   ultimate:action.ultimate,finished:action.finished,
   actionAge:action.actionAge});
 }
 if(gait.active&&!p.isDashing)drawOmegaGroundedSplash(ctx,[gait.left,gait.right],state.gameTime);
 ctx.restore();
 ctx.restore();
 };
 if(field){
  // Stable painter's order: the player, enemies, and original collision
  // objects share one actual world-foot depth. No translucent fake cover.
  for(const item of omegaFieldDepthOrder(field.plan,state.hazards,p.y,field.progress)){
   if(item.kind==='prop'){
    drawProp(field.plan,field.plan.obstacles[item.index]!);
   }
   else if(item.kind==='console')drawOmegaMissionDevice(ctx,field.plan,field.progress,item.index,state.gameTime);
   else if(item.kind==='extraction'){
    if(!session.crossingConnectedPassage)drawOmegaExtractionUnit(ctx,field.plan.exit,field.progress.exitUnlocked,state.gameTime);
   }
   else if(item.kind==='hazard')renderHazard(state.hazards[item.index]!);
   else renderHero();
  }
  if(passage){
   const viewLeft=-worldCamera.projectedOffsetX;
   const viewRight=viewLeft+ctx.canvas.width/worldCamera.scale;
   const tileSkew=worldCamera.skewX*WORLD_HEIGHT;
   ctx.save();ctx.translate(-offset-fieldElevation*skew,fieldElevation);
   for(let index=0;index<passage.length-1;index++){
    const {exit}=passage[index]!;
    const start=index*WORLD_WIDTH+exit.x;
    const edge=(index+1)*WORLD_WIDTH;
    const end=edge+passage[index+1]!.entry.x;
    if(viewRight<start+Math.min(0,tileSkew)-128||viewLeft>end+Math.max(0,tileSkew)+128)continue;
    const fromElevation=omegaConnectedDeckElevation(index+1);
    const nextElevation=omegaConnectedDeckElevation(index+2);
    if(fromElevation===nextElevation)continue;
    const rise=nextElevation-fromElevation;
    const distance=Math.abs(rise);
    const position=field.plan.wave<=index?0:field.plan.wave>=index+2?distance
     :Math.max(0,Math.min(distance,(actorElevation-fromElevation)*Math.sign(rise)));
    ctx.save();
    ctx.translate(fromElevation*skew,-fromElevation);
    drawOmegaConnectedLiftFrontRail(ctx,edge,exit.y,rise<0?position:-position,skew,index===5,rise<0);
    ctx.restore();
   }
   ctx.restore();
  }
 }else{
  for(const h of state.hazards)renderHazard(h);
  renderHero();
 }
 // The native prop's depth can hide the hero: show only a subtle floor beacon.
 if(field){
  drawOmegaM12OcclusionBeacon(ctx,field.plan,p,state.gameTime);
  drawOmega3DOcclusionGuide(ctx,field.plan,p,state.gameTime);
 }
 // Visual-only elevated projectiles & muzzle-to-chest tracers (Watch XY physics untouched).
 const lift=actorElevation-fieldElevation;
 const heroHeading=omegaFieldHeading(pose.bodyX,pose.bodyY);
 const localMuzzle=omegaSilverLocalMuzzle(heroHeading,118);
 const heroMuzzleWorld=omegaWorldPointFromUprightOffset(
  {x:p.x+lift*skew,y:p.y-lift},
  localMuzzle.x,
  localMuzzle.y,
  camera,
 );
 if(tracerTracker){
  tracerTracker.sync(state.projectiles,heroMuzzleWorld,state.gameTime);
 }
 for(const projectile of state.projectiles){
  const visual=tracerTracker
   ?tracerTracker.resolveVisual(projectile,camera,state.gameTime)
   :{
     visualX:projectile.x,
     visualY:projectile.y-48/camera.groundYScale,
     groundX:projectile.x,
     groundY:projectile.y,
     spawnX:heroMuzzleWorld.x,
     spawnY:heroMuzzleWorld.y,
     age:0.1,
    };
  drawOmegaBallisticProjectile(
   ctx,visual,Math.max(2,Math.min(9,projectile.radius)),
   projectile.vx,projectile.vy,false,
  );
 }
 drawOmegaImpactFx(ctx,impacts,state.gameTime);
 drawOmegaPaintedBladeSlash(ctx,session.lastBladeStrike,state.gameTime,camera,lift);
 if(director){
  drawOmegaZeroSignalWorldFx(ctx,director,session,state.gameTime);
 }
 if(field){
  if(!effProfile.skipSecondaryAtmosphere){
   drawOmegaSectorOneAir(ctx,field.plan,state.gameTime,
    omegaSceneBudget(ctx.canvas.width,ctx.canvas.height));
  }
  drawOmegaFieldMission(ctx,field.plan,field.progress,p,state.gameTime,effProfile.allowShadowBlur);
  if(!anyPaintedFloor)drawOmegaG2BoundaryRail(ctx,field.plan,m12G2Quality);
 }
 // Modifier fog is presentation-only; crosswind and unstable ground also
 // affect the actual enemy motion or movement input in the run-scoped engine.
 if(session.plan.modifier==='low_visibility'){
  const radial=ctx.createRadialGradient(p.x,p.y,95,p.x,p.y,380);
  radial.addColorStop(0,'#070b1600');
  radial.addColorStop(.6,'#070b1666');
  radial.addColorStop(1,'#070b16e8');
  ctx.fillStyle=radial;ctx.fillRect(0,0,WORLD_WIDTH,WORLD_HEIGHT);
 }
 ctx.restore();
 if(field){
  if(!effProfile.skipSecondaryAtmosphere){
   drawOmegaSectorOneGrade(ctx,field.plan,ctx.canvas.width,ctx.canvas.height);
  }
  if(!effProfile.skipSecondaryAtmosphere||session.snapshot.bossHp!==null){
   drawOmega3DForegroundAtmosphere(ctx,field.plan,worldCamera,ctx.canvas.width,ctx.canvas.height,
    state.gameTime,session.snapshot.bossHp!==null,atm3DBudget);
  }
 }
 if(director){
  drawOmegaZeroSignalScreenFx(ctx,director,ctx.canvas.width,ctx.canvas.height);
 }
 // Screen-space off-screen tactical beacons (objective, exit, boss, off-screen threats).
 drawOmegaEdgeNavigationIndicators(ctx,{
  width:ctx.canvas.width,
  height:ctx.canvas.height,
  camera,
  field:field??null,
  hazards:state.hazards,
  player:p,
  fieldElevation,
  seconds:state.gameTime,
  cleanHud,
  compact:effProfile.radarCompact,
 });
 // Upgraded translucent tactical scanner radar in top-right safe perimeter.
 drawOmegaTacticalRadar(ctx,{
  width:ctx.canvas.width,
  height:ctx.canvas.height,
  field:field??null,
  hazards:state.hazards,
  player:p,
  facing:{x:pose.weaponX,y:pose.weaponY},
  seconds:state.gameTime,
  compact:effProfile.radarCompact,
  canvasScale:effProfile.canvasScale,
  cleanHud,
  worldWidth:WORLD_WIDTH,
  worldHeight:WORLD_HEIGHT,
 });
 return worldCamera;
}
function makeOmegaFieldSession(seed:number):OmegaProtocolCombatSession{
 const qaMode=import.meta.env.DEV&&typeof window!=='undefined'
  ?new URLSearchParams(window.location.search).get('omegaQaState'):null;
 const actBoundary=(qaMode==='actBoundary6'?6:qaMode==='actBoundary9'?9:
  qaMode==='actBoundary12'?12:null);
 const reviewView=OMEGA_PROTECTED_REVIEW&&typeof window!=='undefined'
  ?new URLSearchParams(window.location.search).get('omegaView'):null;
 const reviewDeparture=reviewView==='lift'?3:reviewView==='crane'?6:
  reviewView==='tunnel'?9:reviewView==='airlock'?12:null;
 const liftTour=reviewDeparture!==null;
 const liftWalk=qaMode==='connectedLift'||liftTour;
 const liftDeparture=reviewDeparture??3;
 const seamWalk=qaMode==='continuousLink'||liftWalk;
 const gateWalk=qaMode==='gateTravel'||actBoundary!==null||seamWalk;
 // Historical single-snapshot QA shortcuts expect synchronous stage jumps;
 // preserve them ONLY in those explicit DEV modes. Ordinary M04 play and
 // gateTravel use the actual timed physical airlock transfer.
 const legacyStageSnapshot=['reward','boss','finalBoss','objective','exit'].includes(qaMode??'');
 const session=new OmegaProtocolCombatSession(seed,50,false,{
  fieldTraversal:true,gateTransition:!legacyStageSnapshot,qaGateTravel:gateWalk,
  continuousOpening:!gateWalk||seamWalk,
  qaGateTravelUntilWave:liftWalk?liftDeparture+1:undefined,
  interactivePolish:!qaMode&&typeof window!=='undefined'&&!omegaCombatProbeMode(window.location.search),
 });
 if(!import.meta.env.DEV&&!liftTour)return session;
 if(actBoundary!==null||liftWalk){
  const targetWave=liftWalk?liftDeparture:actBoundary!;
  // Explicit QA tour preroll before the browser opens.
  // This deliberately pre-resolves all earlier combat/objective requirements.
  // The ACT-boundary exit itself is subsequently completed only by real
  // browser movement and E/touch; never by this initial test fixture.
  const idle={moveX:0,moveY:0,triggerAction:false};
  for(let wave=1;wave<targetWave;wave++){
   if(session.run.wave!==wave||session.field?.progress.phase!=='exit')
    throw new Error('M04-C initial QA expedition is not ready for preroll');
   const exit=session.field.plan.exit;
   session.engine.state.player.x=exit.x-45;
   session.engine.state.player.y=exit.y;
   if(!session.interact().success)throw new Error('M04-C QA setup cannot reach exit');
   for(let i=0;i<60&&session.run.wave===wave&&session.run.phase==='battle';i++)session.update(.05,idle);
   if(session.run.phase==='reward')session.selectUpgrade(session.run.offers[0]!);
   for(let i=0;i<30&&session.snapshot.gateTransit;i++)session.update(.05,idle);
  }
  if(session.run.wave!==targetWave||session.field?.progress.phase!=='exit')
   throw new Error('M04-C initial QA world did not reach target ACT seam');
  if(liftWalk){
   const exit=session.field.plan.exit;
   Object.assign(session.engine.state.player,{x:exit.x-190,y:exit.y});
  }
  return session;
 }
 const combatMode=omegaCombatProbeMode(window.location.search);
 if(combatMode){
  omegaCombatBrowserFixtures.set(session,omegaSetupCombatProbe(session,combatMode));
  return session;
 }
 const qa=new URLSearchParams(window.location.search).get('omegaQaState');
 if(qa==='zombieAI'){
  // Strictly DEV-only: four native zombies, no synthetic hit feedback, no
  // extra enemy or mock sprite; observe actual brain movement and attacks.
  const state=session.engine.state;
  const four=session.zombieTelemetry.slice(0,4);
  if(four.length!==4||new Set(four.map(z=>z.kind)).size!==4)
   throw new Error('M03 fixture requires all four native infected AI actors');
  state.hazards=state.hazards.filter(h=>four.some(z=>z.id===h.id));
  const starts=[{x:510,y:450},{x:910,y:450},{x:655,y:610},{x:820,y:265}];
  state.player.x=700;state.player.y=450;
  state.player.maxHp=800;state.player.hp=800;
  state.player.invincibleTime=0;
  state.activePerks.radio_boost=0;
  four.forEach((z,i)=>{
   const h=state.hazards.find(item=>item.id===z.id)!;
   h.x=starts[i]!.x;h.y=starts[i]!.y;
   h.hp=25000;h.maxHp=25000;h.isStunned=0;
  });
  const solo=omegaInfectedSoloKind(window.location.search,import.meta.env.DEV);
  if(solo){const id=four.find(z=>z.kind===solo)?.id;state.hazards=state.hazards.filter(h=>h.id===id);}
  return session;
 }
 if(qa==='cartWarning'){
  // DEV-only fixture positions actual native Watch actors before play.
  // The engine still creates its own warning/charge and HP damage.
  const state=session.engine.state;
  const cart=state.hazards.find(h=>h.type==='RUNAWAY_CART'&&h.hp>0);
  if(!cart||!cart.motion)throw new Error('M04-D6 native cart setup missing');
  state.hazards=[cart];state.projectiles=[];state.drops=[];
  state.player.x=700;state.player.y=450;
  state.player.maxHp=800;state.player.hp=800;state.player.invincibleTime=0;
  state.activePerks.radio_boost=0;
  cart.x=900;cart.y=400;
  return session;
 }
 if(!['reward','boss','finalBoss','objective','exit'].includes(qa||''))return session;
 const idle={moveX:0,moveY:0,triggerAction:false};
 const clearAndOperate=(finishExit:boolean)=>{
  session.engine.state.hazards=[];
  session.update(1/60,idle);
  const field=session.field;
  if(!field||field.progress.phase!=='objective')return;
  if(qa==='objective')return;
  for(const step of field.plan.event.steps){
   session.engine.state.player.x=step.target.x;
   session.engine.state.player.y=step.target.y;
   session.interact();
  }
  if(!finishExit)return;
  session.engine.state.player.x=field.plan.exit.x;
  session.engine.state.player.y=field.plan.exit.y;
  session.interact();
 };
 if(qa==='objective'||qa==='exit'){
  clearAndOperate(false);
  return session;
 }
 const targetWave=qa==='reward'?3:qa==='finalBoss'?15:9;
 for(let safety=0;safety<15&&session.run.wave<targetWave;safety++){
  clearAndOperate(true);
  if(session.run.phase==='reward'&&(qa==='boss'||qa==='finalBoss'||session.run.wave<targetWave))
   session.selectUpgrade(session.run.offers[0]!);
 }
 return session;
}
export function OmegaProtocolPlaytest({onExit}:{onExit:()=>void}){
 // The running game uses an explicit QA 50/50 FIXTURE, NOT the user's real
 // saved progress. Keep both facts visible and distinguishable for acceptance.
 const [realUnlockStatus]=useState(()=>{
  try{return readOmegaProtocolAccess(typeof window==='undefined'?undefined:window.localStorage);}
  catch{return readOmegaProtocolAccess(undefined);}
 });
 const [seedValue,setSeedValue]=useState('20261108');
 const [loadoutId,setLoadoutId]=useState<OmegaLoadoutId>('valkyrie');
 const [dailyMode,setDailyMode]=useState(false);
 const [sortieStarted,setSortieStarted]=useState(()=>shouldBypassBriefingOnLaunch());
 const sortieStartedRef=useRef(sortieStarted);
 sortieStartedRef.current=sortieStarted;
 const [muted,setMuted]=useState(false);
 const [perfPreset,setPerfPreset]=useState<OmegaPerfPreset>(()=>readOmegaPerfPreset());
 const perfPresetRef=useRef(perfPreset);
 perfPresetRef.current=perfPreset;
 const [mobileMenuOpen,setMobileMenuOpen]=useState(false);
 const [cleanHud,setCleanHud]=useState<boolean>(()=>readCleanHudPreference());
 const cleanHudRef=useRef(cleanHud);
 cleanHudRef.current=cleanHud;
 const toggleCleanHud=()=>{
  const next=!cleanHud;
  saveCleanHudPreference(next);
  cleanHudRef.current=next;
  setCleanHud(next);
 };
 const [viewport,setViewport]=useState(()=>({
  w:typeof window==='undefined'?1280:window.innerWidth,
  h:typeof window==='undefined'?720:window.innerHeight,
 }));
 const governorRef=useRef<OmegaAdaptiveFrameGovernor|null>(null);
 if(!governorRef.current)governorRef.current=new OmegaAdaptiveFrameGovernor();
 const mobileProfileRef=useRef<OmegaMobileProfile>(
  resolveOmegaMobileProfile(viewport.w,viewport.h,typeof window==='undefined'?1:window.devicePixelRatio||1,perfPreset),
 );
 const devLabReviewUrl=typeof window!=='undefined'&&['omegaM12G5','omegaM12G5b','omegaM12G5c','omegaM12G5d','omegaM12G5e','omegaM12G5g','omegaM12G5h','omegaM12G5i','omegaView'].some(k=>new URLSearchParams(window.location.search).has(k));
 const mobileImmersion=(Math.min(viewport.w,viewport.h)<=540||viewport.w<=900)&&!devLabReviewUrl;
 const [blackboxes,setBlackboxes]=useState<readonly string[]>(()=>readZeroSignalArchive());
 const [blackboxTab,setBlackboxTab]=useState(false);
 const audioRef=useRef<OmegaProceduralAudio|null>(null);
 if(!audioRef.current)audioRef.current=new OmegaProceduralAudio();
 const directorRef=useRef<OmegaZeroSignalDirector|null>(null);
 const [session,setSession]=useState(()=>{
  const s=makeOmegaFieldSession(20261108);
  const d=new OmegaZeroSignalDirector('valkyrie',false);
  d.applyLoadoutToSession(s);
  directorRef.current=d;
  return s;
 });
 if(!directorRef.current)directorRef.current=new OmegaZeroSignalDirector(loadoutId,dailyMode);
 const [zeroHud,setZeroHud]=useState<OmegaZeroSignalHudSnapshot>(()=>directorRef.current!.hudSnapshot(session));
 const zombieAiQa=import.meta.env.DEV&&typeof window!=='undefined'&&
  new URLSearchParams(window.location.search).get('omegaQaState')==='zombieAI';
 const cartWarningQa=import.meta.env.DEV&&typeof window!=='undefined'&&
  new URLSearchParams(window.location.search).get('omegaQaState')==='cartWarning';
 const combatProbe=import.meta.env.DEV?omegaCombatBrowserFixtures.get(session):undefined;
 const [snapshot,setSnapshot]=useState<OmegaCombatSnapshot>(()=>session.snapshot);
 const [paused,setPaused]=useState(false);
 const [classicPad,setClassicPad]=useState(false);
 const [fps,setFps]=useState(0);
 const [interactionMessage,setInteractionMessage]=useState('');
 // M12-G4 explicit lab-only selection of SHA-pinned SILVER originals:
 // never changes the artist-approved 160-frame gate or public game mode.
 const g4SilverLab=typeof window!=='undefined'&&
  omegaG4SilverLabRequested(window.location.search,
   import.meta.env.DEV||import.meta.env.VITE_OMEGA_PROTOCOL_LAB==='1');
 const g5ArtLab=typeof window!=='undefined'&&
  omegaG5DevRequested(window.location.search,
   import.meta.env.DEV||import.meta.env.VITE_OMEGA_PROTOCOL_LAB==='1');
 const g5VectorStudy=typeof window!=='undefined'&&omegaG5VectorStudyRequested(
  window.location.search,import.meta.env.DEV||import.meta.env.VITE_OMEGA_PROTOCOL_LAB==='1');
 const g5bPainterlyReview=typeof window!=='undefined'&&omegaG5bLabRequested(
  window.location.search,import.meta.env.DEV||import.meta.env.VITE_OMEGA_PROTOCOL_LAB==='1');
 const g5iArtLab=OMEGA_PROTECTED_REVIEW||(typeof window!=='undefined'&&omegaG5iLabRequested(
  window.location.search,import.meta.env.DEV||import.meta.env.VITE_OMEGA_PROTOCOL_LAB==='1'));
 const g5hRealHitLab=typeof window!=='undefined'&&omegaG5hRealHitLabRequested(
  window.location.search,import.meta.env.DEV||import.meta.env.VITE_OMEGA_PROTOCOL_LAB==='1');
 const g5gSourcePoseLab=g5hRealHitLab||(typeof window!=='undefined'&&omegaG5gLabRequested(
  window.location.search,import.meta.env.DEV||import.meta.env.VITE_OMEGA_PROTOCOL_LAB==='1'));
 const g5eNativeActionLab=g5gSourcePoseLab||(typeof window!=='undefined'&&omegaG5eLabRequested(
  window.location.search,import.meta.env.DEV||import.meta.env.VITE_OMEGA_PROTOCOL_LAB==='1'));
 const g5dActualReview=g5eNativeActionLab||(typeof window!=='undefined'&&omegaG5dLabRequested(
  window.location.search,import.meta.env.DEV||import.meta.env.VITE_OMEGA_PROTOCOL_LAB==='1'));
 const g5cArtReview=g5dActualReview||(typeof window!=='undefined'&&omegaG5cLabRequested(
  window.location.search,import.meta.env.DEV||import.meta.env.VITE_OMEGA_PROTOCOL_LAB==='1'));
 const [g5cStatus,setG5cStatus]=useState<'idle'|'loading'|'ready'|'failed'>('idle');
 const [g5cFeedback,setG5cFeedback]=useState('원본 4장 파일을 선택하면 해당 세션에서만 검수합니다.');
 const [g5cPreviewOn,setG5cPreviewOn]=useState(false);
 const [g5iStatus,setG5iStatus]=useState<'idle'|'loading'|'ready'|'failed'>('idle');
 const [g5iFeedback,setG5iFeedback]=useState('새로 그린 동쪽 사격·대시·피격 원화 WebP 12개를 선택하세요.');
 const [g5iPreviewOn,setG5iPreviewOn]=useState(false);
 const g5iImportEpoch=useRef(0);
 const infectedLab=OMEGA_PROTECTED_REVIEW||(typeof window!=='undefined'&&omegaInfectedLabRequested(window.location.search,import.meta.env.DEV||import.meta.env.VITE_OMEGA_PROTOCOL_LAB==='1'));
 const [infectedStatus,setInfectedStatus]=useState<'idle'|'loading'|'ready'|'failed'>('idle');
 const [infectedMessage,setInfectedMessage]=useState('감염체 후보 16장과 앵커 JSON을 선택하세요.');
 const [infectedOn,setInfectedOn]=useState(false);
 const [visualAudit,setVisualAudit]=useState<'aira'|'infected'|'walk'|null>(null);
 const visualAuditInputBlock=useRef(false);
 const closeVisualAudit=()=>{visualAuditInputBlock.current=false;setVisualAudit(null);};
 const infectedEpoch=useRef(0);
 const silverPreviewRequested=typeof window!=='undefined'&&
  (omegaSilverPreviewEnabled(window.location.search)||g4SilverLab||g5ArtLab||g5bPainterlyReview||g5cArtReview||g5iArtLab);
 const [silverPreviewStatus,setSilverPreviewStatus]=useState<'off'|'loading'|'ready'|'failed'>(
  silverPreviewRequested?'loading':'off');
 const canvasRef=useRef<HTMLCanvasElement>(null);
 const arenaRef=useRef<HTMLDivElement>(null);
 const keysRef=useRef(new Set<string>());
 const mobileDir=useRef({x:0,y:0});
 const stickRef=useRef<HTMLButtonElement>(null);
 const stickThumbRef=useRef<HTMLSpanElement>(null);
 const floatingRingRef=useRef<HTMLDivElement>(null);
 const floatingThumbRef=useRef<HTMLSpanElement>(null);
 const floatingHintRef=useRef<HTMLSpanElement>(null);
 const floatingOrigin=useRef<{pointerId:number;x:number;y:number}|null>(null);
 // Multiple finger presses keep their own direction until released.
 const pointerMoves=useRef(new Map<number,{x:number;y:number}>());
 const lastHudAt=useRef(0);
 const bladeBufferUntilRef=useRef(0);
 const lastCameraRef=useRef<OmegaCameraState|null>(null);
 const executeBlade=useCallback(()=>{
  audioRef.current?.unlock();
  const dir=directorRef.current;
  const probe=import.meta.env.DEV?omegaCombatBrowserFixtures.get(session):undefined;
  const strike=session.blade(probe?undefined:{
   smartAssist:true,
   preferredTargetId:dir?.resolveLockedTarget(session)?.id??null,
   markedIds:dir?.markedHazardIds(),
  });
  if(strike){
   audioRef.current?.playBladeSlash(strike.combo,strike.hits);
   dir?.onPlayerBlade(session,strike);
   if(dir&&dir.currentHitstopRemaining()>0)session.engine.state.hitStopTimer=0;
   if(dir)setZeroHud(dir.hudSnapshot(session));
  }
  setSnapshot(session.snapshot);
 },[session]);
 const requestBlade=useCallback(()=>{
  audioRef.current?.unlock();
  const cd=session.snapshot.bladeCooldownRemaining;
  if(cd<=0){
   bladeBufferUntilRef.current=0;
   executeBlade();
  }else if(cd<=0.22){
   bladeBufferUntilRef.current=performance.now()+230;
  }
 },[session,executeBlade]);
 const triggerRailBurst=useCallback((aimWorld?:Readonly<{x:number;y:number}>|null)=>{
  audioRef.current?.unlock();
  const dir=directorRef.current;
  if(dir?.fireRailBurst(session,aimWorld)){
   audioRef.current?.playRailBurst(dir.getWeaponMode()==='focus');
   setZeroHud(dir.hudSnapshot(session));
   setSnapshot(session.snapshot);
  }
 },[session]);
 const toggleWeaponMode=useCallback(()=>{
  audioRef.current?.unlock();
  const dir=directorRef.current;
  if(!dir||session.run.phase!=='battle')return;
  const next=dir.toggleWeaponMode(session);
  audioRef.current?.playWeaponSwitch(next);
  setZeroHud(dir.hudSnapshot(session));
 },[session]);
 const weaponActionsRef=useRef({executeBlade,requestBlade,triggerRailBurst,toggleWeaponMode});
 weaponActionsRef.current={executeBlade,requestBlade,triggerRailBurst,toggleWeaponMode};
 const clearMovementInputs=useCallback(()=>{
  floatingOrigin.current=null;
  arenaRef.current?.setAttribute('data-omega-stick-active','false');
  if(floatingRingRef.current)floatingRingRef.current.style.opacity='0';
  if(floatingThumbRef.current)floatingThumbRef.current.style.transform='translate3d(-50%,-50%,0)';
  keysRef.current.clear();pointerMoves.current.clear();mobileDir.current={x:0,y:0};
  if(stickThumbRef.current)stickThumbRef.current.style.transform='translate3d(0,0,0)';
 },[]);
 const launchSortie=useCallback((chosenLoadout:OmegaLoadoutId,useDaily:boolean,startImmediately=true)=>{
  const daily=omegaDailySeed();
  const rawSeed=useDaily?daily.seed:Number(seedValue);
  const finalSeed=Number.isFinite(rawSeed)?Math.trunc(rawSeed):20261108;
  const newSession=makeOmegaFieldSession(finalSeed);
  const newDirector=new OmegaZeroSignalDirector(chosenLoadout,useDaily);
  newDirector.applyLoadoutToSession(newSession);
  directorRef.current=newDirector;
  governorRef.current?.reset();
  setLoadoutId(chosenLoadout);
  setDailyMode(useDaily);
  if(useDaily)setSeedValue(String(daily.seed));
  setSortieStarted(startImmediately);
  setMobileMenuOpen(false);
  setSession(newSession);
  setSnapshot(newSession.snapshot);
  setZeroHud(newDirector.hudSnapshot(newSession));
  setPaused(false);
  bladeBufferUntilRef.current=0;
  clearMovementInputs();
  audioRef.current?.unlock();
  if(startImmediately)audioRef.current?.playSortieStart();
 },[seedValue,clearMovementInputs]);
 const restart=useCallback(()=>{
  launchSortie(loadoutId,dailyMode,true);
 },[launchSortie,loadoutId,dailyMode]);
 const toggleMute=useCallback(()=>{
  const next=!muted;
  setMuted(next);
  audioRef.current?.unlock();
  audioRef.current?.setMuted(next);
 },[muted]);
 useEffect(()=>{
  if(!silverPreviewRequested){
   userApprovedAiraV2.setSilverReviewSources(null);
   return;
  }
  let mounted=true;
  let lease:OmegaSilverPreviewSession|null=null;
  ((g4SilverLab||g5ArtLab||g5bPainterlyReview||g5cArtReview||g5iArtLab)?omegaLoadSilverRepoReview():omegaLoadSilverPreview()).then(async session=>{
   if(!mounted){session.revoke();return;}
   lease=session;
   userApprovedAiraV2.setSilverReviewSources(session.urls);
   if(g5VectorStudy)omegaG5Art.prepare();
   // All 8 real WebPs must decode before the game reports the imported
   // original art as visible, not just that IndexedDB returned eight hashes.
   for(let attempt=0;attempt<90&&mounted;attempt++){
    if(userApprovedAiraV2.hasAllDirections()){
     setSilverPreviewStatus('ready');
     return;
    }
    await new Promise<void>(resolve=>window.setTimeout(resolve,50));
   }
   if(mounted)throw Error('Silver AIRA original image decode incomplete');
  }).catch(error=>{
   if(mounted){
    userApprovedAiraV2.setSilverReviewSources(null);
    lease?.revoke();lease=null;
    setSilverPreviewStatus('failed');
    console.warn('Silver AIRA review unavailable; original gameplay unchanged',error);
   }
  });
  return ()=>{
   mounted=false;
   userApprovedAiraV2.setSilverReviewSources(null);
   lease?.revoke();
  };
 },[silverPreviewRequested,g4SilverLab,g5ArtLab,g5VectorStudy,g5bPainterlyReview,g5cArtReview,g5iArtLab]);
 useEffect(()=>()=>{g5iImportEpoch.current++;infectedEpoch.current++;omegaG5cReview.dispose();omegaG5iActionPreview.dispose();omegaInfectedCandidateReview.dispose();},[]);
 const importInfected=useCallback(async(files:FileList|readonly File[]|null)=>{
  if(!infectedLab||!files)return;const epoch=++infectedEpoch.current;setVisualAudit(null);omegaInfectedCandidateReview.dispose();setInfectedOn(false);setInfectedStatus('loading');
  try{
   const list=Array.from(files),docs=list.filter(f=>f.name==='infected-anchors.json');
   if(docs.length!==1||list.length!==17||docs[0]!.size>100_000)throw Error('WebP 16개와 infected-anchors.json을 함께 선택하세요');
   const manifest=JSON.parse(await docs[0]!.text());if(epoch!==infectedEpoch.current)return;
   await omegaInfectedCandidateReview.import(list.filter(f=>f!==docs[0]),manifest);if(epoch!==infectedEpoch.current)return;
   setInfectedStatus('ready');setInfectedMessage('16장 해시·경계·앵커 형식 확인 · 원화·발 위치는 미승인');
  }catch(e){if(epoch!==infectedEpoch.current)return;omegaInfectedCandidateReview.dispose();setInfectedStatus('failed');setInfectedMessage(e instanceof Error?e.message:'감염체 후보 오류');}
 },[infectedLab]);
 useEffect(()=>{omegaG5eFx.reset();},[g5eNativeActionLab]);
 useEffect(()=>{omegaG5gNativePoseStudy.reset();},[g5gSourcePoseLab]);
 const importG5iFiles=useCallback(async(files:FileList|null)=>{
  if(!g5iArtLab||!files)return;
  const epoch=++g5iImportEpoch.current;
  setVisualAudit(null);setG5iPreviewOn(false);setG5iStatus('loading');
  setG5iFeedback('12개 후보 파일 SHA·알파 범위·몸체 포즈 차이 검사 중… 발 접지는 별도 시각 검수');
  try{
   const proof=await omegaG5iActionPreview.import(Array.from(files));
   if(epoch!==g5iImportEpoch.current)return;
   setG5iStatus('ready');
   const score=Object.entries(proof.minCoreSilhouetteChange)
    .map(([action,value])=>action.toUpperCase()+' '+(value*100).toFixed(1)+'%').join(' / ');
   setG5iFeedback('12/12 후보 검증 · '+score+' · 독립 작화 여부는 사람 시각 승인 필요');
  }catch(error){
   if(epoch!==g5iImportEpoch.current)return;
   omegaG5iActionPreview.dispose();setG5iStatus('failed');
   setG5iFeedback(error instanceof Error?error.message:'원화 후보 검증 실패');
  }
 },[g5iArtLab]);
 const importG5iWide=useCallback(async(files:FileList|readonly File[]|null)=>{
  if(!g5iArtLab||!files)return;
  const epoch=++g5iImportEpoch.current;
  setVisualAudit(null);omegaG5iActionPreview.dispose();setG5iPreviewOn(false);setG5cPreviewOn(false);setG5iStatus('loading');
  try{
   const list=Array.from(files),docs=list.filter(f=>f.name==='g5j-anchors.json');
   if(docs.length!==1||list.length!==13||docs[0]!.size>100_000)throw Error('640×512 WebP 12개와 g5j-anchors.json을 함께 선택하세요');
   const manifest=JSON.parse(await docs[0]!.text());
   if(epoch!==g5iImportEpoch.current)return;
   await omegaG5iActionPreview.importWide(list.filter(f=>f!==docs[0]),manifest);
   if(epoch!==g5iImportEpoch.current)return;
   setG5iStatus('ready');setG5iFeedback('와이드 12장 및 앵커 형식 확인 · 좌표 정확성과 작화는 시각 승인 전');
  }catch(error){if(epoch!==g5iImportEpoch.current)return;omegaG5iActionPreview.dispose();setG5iStatus('failed');setG5iFeedback(error instanceof Error?error.message:'앵커 검사 실패');}
 },[g5iArtLab]);
 const [protectedArt,setProtectedArt]=useState<'loading'|'ready'|'failed'>('loading');
 const reviewFailed=protectedArt==='failed'||silverPreviewStatus==='failed';
 const reviewBlocked=OMEGA_PROTECTED_REVIEW&&(protectedArt!=='ready'||silverPreviewStatus!=='ready');
 useEffect(()=>{
  if(!OMEGA_PROTECTED_REVIEW)return;
  let active=true;
  void Promise.all([
   omegaG5nFetchQaSources('aira'),
   omegaG5nFetchQaSources('infected',fetch,true),
  ]).then(async ([aira,infected])=>{
   if(!active)return;
   await Promise.all([importG5iWide(aira),importInfected(infected),omegaG5dImportRepoCandidates()]);
   if(!active)return;
   const walk=omegaG5cReview.activate(true);
   const action=omegaG5iActionPreview.activate(true);
   const enemies=omegaInfectedCandidateReview.activate(true);
   if(!walk||!action||!enemies)throw Error('검수 원화 무결성 확인 실패');
   setProtectedArt('ready');
   setG5cStatus('ready');setG5cPreviewOn(true);
   setG5iPreviewOn(true);setInfectedOn(true);
  }).catch(()=>{if(active)setProtectedArt('failed');});
  return ()=>{active=false;};
 },[importG5iWide,importInfected]);
 useEffect(()=>{
  const holdPaused=(OMEGA_PROTECTED_REVIEW&&reviewBlocked)||!sortieStarted;
  if(holdPaused)session.pause();
  else session.resume();
  setPaused(holdPaused&&!(OMEGA_PROTECTED_REVIEW&&!reviewBlocked&&!sortieStarted));
  setSnapshot(session.snapshot);
 },[session,reviewBlocked,sortieStarted]);
 useEffect(()=>{
  if(snapshot.run.phase!=='battle'||paused||mobileMenuOpen)clearMovementInputs();
 },[snapshot.run.phase,paused,mobileMenuOpen,clearMovementInputs]);
 useEffect(()=>()=>{audioRef.current?.dispose();},[]);
 // Source recovery is a manually triggered DEV-only action; no cloud API at
 // gameplay runtime, no automatic artwork swap, no user save mutations.
 const importRecoveredQaAira=useCallback(async()=>{
  if(!import.meta.env.DEV||!g5iArtLab)return;
  setG5iStatus('loading');
  setG5iFeedback('GitHub 격리 저장소에서 실제 AIRA 원본 12장과 앵커를 SHA 검사 중…');
  try{const files=await omegaG5nFetchQaSources('aira');await importG5iWide(files);}
  catch(e){omegaG5iActionPreview.dispose();setG5iStatus('failed');
   setG5iFeedback(e instanceof Error?e.message:'복구 원화 읽기 실패');}
 },[g5iArtLab,importG5iWide]);
 const importRecoveredQaInfected=useCallback(async()=>{
  if(!import.meta.env.DEV||!infectedLab)return;
  setInfectedStatus('loading');
  const repaint=new URLSearchParams(window.location.search).get('omegaStrideArt')==='1';
  setInfectedMessage(repaint?'보폭 보정 시안 2장과 기존 프레임 14장 검증 중…':
   'GitHub 격리 저장소에서 실제 감염체 원본 16장과 앵커를 SHA 검사 중…');
  try{const files=await omegaG5nFetchQaSources('infected',fetch,repaint);await importInfected(files);}
  catch(e){omegaInfectedCandidateReview.dispose();setInfectedStatus('failed');
   setInfectedMessage(e instanceof Error?e.message:'복구 감염체 읽기 실패');}
 },[infectedLab,importInfected]);
 const importG5cFiles=useCallback(async (files:FileList|null)=>{
  if(!g5cArtReview||!files)return;
  setG5cPreviewOn(false);setG5cStatus('loading');
  setG5cFeedback('독립 원화 4장 SHA-256·투명도·발 접촉을 검증 중입니다.');
  try{
   const result=await omegaG5cReview.import(Array.from(files));
   setG5cStatus('ready');
   setG5cFeedback(`서로 다른 WebP 4장 확인 · 변화율 ${result.changedPixelFraction.map(x=>(x*100).toFixed(1)+'%').join(' / ')} · 최종 작화 승인 전 비교만 가능`);
  }catch(error){
   omegaG5cReview.dispose();setG5cStatus('failed');
   setG5cFeedback(error instanceof Error?error.message:'원화 파일 검증 실패');
  }
 },[g5cArtReview]);
 const importG5dActualSources=useCallback(async()=>{
  if(!g5dActualReview)return;
  setG5cPreviewOn(false);setG5cStatus('loading');
  setG5cFeedback('GitHub 실제 원화 4장 원본 SHA-256과 접지 위치 확인 중…');
  try{
   const proof=await omegaG5dImportRepoCandidates();
   setG5cStatus('ready');
   setG5cFeedback(`실제 저장소 WebP ${proof.assets.length}장 검증 · 앞/뒤 프레임 변화 ${proof.changedPixelFraction.map(x=>(x*100).toFixed(1)+'%').join(' / ')} · 미승인 원화 후보`);
  }catch(error){
   omegaG5cReview.dispose();setG5cStatus('failed');
   setG5cFeedback(error instanceof Error?error.message:'GitHub 원화 소스 검증 실패');
  }
 },[g5dActualReview]);
 useEffect(()=>{
  const onKeyDown=(e:KeyboardEvent)=>{
   if(visualAuditInputBlock.current||reviewBlocked||!sortieStartedRef.current)return;
   if(e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement)return;
   audioRef.current?.unlock();
   if(validKeys.has(e.key)){keysRef.current.add(e.key);e.preventDefault();}
   if((e.code==='Space'||e.key==='Shift')&&!e.repeat){
    e.preventDefault();
    if(session.dash()&&directorRef.current){
     const {phantomDodge}=directorRef.current.onPlayerDash(session);
     if(phantomDodge)audioRef.current?.playPhantomDodge();
     setZeroHud(directorRef.current.hudSnapshot(session));
    }
   }
   if(e.key.toLowerCase()==='q'&&!e.repeat){e.preventDefault();session.ultimate();}
   if(e.key.toLowerCase()==='f'&&!e.repeat){
    e.preventDefault();
    weaponActionsRef.current.requestBlade();
   }
   if(e.key.toLowerCase()==='r'&&!e.repeat){
    e.preventDefault();
    weaponActionsRef.current.triggerRailBurst();
   }
   if((e.key.toLowerCase()==='c'||e.key==='Tab')&&!e.repeat){
    e.preventDefault();
    weaponActionsRef.current.toggleWeaponMode();
   }
   if(['1','2','3','4'].includes(e.key)&&!e.repeat&&directorRef.current){
    e.preventDefault();
    const striker=OMEGA_STRIKERS[Number(e.key)-1];
    if(striker&&directorRef.current.triggerStriker(session,striker.id)){
     audioRef.current?.playStriker(striker.id);
     setZeroHud(directorRef.current.hudSnapshot(session));
     setSnapshot(session.snapshot);
    }
   }
   if(e.key.toLowerCase()==='e'&&!e.repeat){
    e.preventDefault();
    const outcome=session.interact();
    setInteractionMessage(outcome.success?(outcome.reason==='EXIT_OPENED'?'격리 통로 진입 · 구역 이동 중':outcome.reason==='STEP_COMPLETE'?'임무 단계 완료':'현장 이벤트 해결 완료'):(outcome.reason==='OUT_OF_RANGE'?'대상 지점에 더 가까이 이동하세요':'주변 위협을 먼저 제거하세요'));
    setSnapshot(session.snapshot);
   }
  };
  const onKeyUp=(e:KeyboardEvent)=>{
   if(visualAuditInputBlock.current||reviewBlocked)return;
   if(validKeys.has(e.key)){keysRef.current.delete(e.key);e.preventDefault();}
  };
  const pauseOnBackground=()=>{
   clearMovementInputs();
   if(session.run.phase==='battle'&&session.engine.state.phase==='playing'){
    session.pause();setPaused(true);setSnapshot(session.snapshot);
   }
  };
  const onVisibility=()=>{if(document.hidden)pauseOnBackground();};
  const scaleCanvas=()=>{
   const canvas=canvasRef.current,container=canvas?.parentElement;
   if(!canvas||!container)return;
   const cssWidth=container.clientWidth||1120;
   const cssHeight=container.clientHeight||720;
   setViewport(prev=>(prev.w===window.innerWidth&&prev.h===window.innerHeight?prev:{w:window.innerWidth,h:window.innerHeight}));
   const gov=governorRef.current;
   const preset=perfPresetRef.current;
   const profile=resolveOmegaMobileProfile(
    cssWidth,cssHeight,window.devicePixelRatio||1,preset,
    gov?gov.currentScale(preset):1,
    gov?gov.currentLowFx(preset):false,
   );
   mobileProfileRef.current=profile;
   if(canvas.width!==profile.pixelWidth||canvas.height!==profile.pixelHeight){
    canvas.width=profile.pixelWidth;canvas.height=profile.pixelHeight;
   }
  };
  scaleCanvas();
  window.addEventListener('keydown',onKeyDown);window.addEventListener('keyup',onKeyUp);
  window.addEventListener('blur',pauseOnBackground);
  window.addEventListener('resize',scaleCanvas);
  window.addEventListener('orientationchange',scaleCanvas);
  document.addEventListener('visibilitychange',onVisibility);
  let request=0,last=0,alive=true,fpsTotal=0,fpsCount=0,fpsAt=0;
  let cinematicZoom=1.55;
  // Visual-only gun pulse. Each new session owns its own timer and heading.
  let fireCue:OmegaActorFireCue=OMEGA_EMPTY_FIRE_CUE;
  let impacts:OmegaImpactFx[]=[];
  let qaRadioHits=0,qaRadioDamage=0,qaRadioBlocked=0;
  const fixture=import.meta.env.DEV?omegaCombatBrowserFixtures.get(session):undefined;
  let dashEchoes:readonly OmegaDashEcho[]=[];
  let priorPlayer={x:session.engine.state.player.x,y:session.engine.state.player.y};
  const gaitController=new OmegaGroundedGait();
  const motionSmoother=new OmegaMotionSmoother();
  const tracerTracker=new OmegaBallisticTracerTracker();
  const facingController=new OmegaActorFacingController();
  const finishClock=new OmegaTerminalMotionClock();
  omegaPrepareAuthoredScene();
  omegaPrepareEnvArt();
  omegaPrepareVfxAndPropArt();
  omegaPrepareEntityArt();
  userApprovedAiraV2.prepare();
  session.engine.drainProjectileFeedback();
  const frame=(now:number)=>{
   if(!alive)return;
   try{
    const dt=last?Math.min(.05,Math.max(0,(now-last)/1000)):0;last=now;
   const k=keysRef.current;
   const mx=(Number(k.has('d')||k.has('D')||k.has('ArrowRight'))-Number(k.has('a')||k.has('A')||k.has('ArrowLeft')))+mobileDir.current.x;
   const my=(Number(k.has('s')||k.has('S')||k.has('ArrowDown'))-Number(k.has('w')||k.has('W')||k.has('ArrowUp')))+mobileDir.current.y;
   const length=Math.hypot(mx,my)||1;
   const dir=directorRef.current;
   const inHitstop=Boolean(dir&&sortieStartedRef.current&&dir.tickHitstop(dt));
   const timeScale=dir&&dir.currentSlowMoRemaining()>0?0.24:1.0;
   const hpBeforeUpdate=session.engine.state.player.hp;
   if(dt>0&&sortieStartedRef.current&&!inHitstop)session.update(dt*timeScale,{moveX:mx/length,moveY:my/length,triggerAction:true});
   if(sortieStartedRef.current&&bladeBufferUntilRef.current>now&&session.snapshot.bladeCooldownRemaining<=0){
    bladeBufferUntilRef.current=0;
    weaponActionsRef.current.executeBlade();
   }
   const engineEvents=session.engine.drainProjectileFeedback();
   if(dir&&sortieStartedRef.current){
    dir.onProjectileFeedback(session,engineEvents);
    const stepResult=dir.step(session,inHitstop?0:dt,hpBeforeUpdate);
    if(dir.currentHitstopRemaining()>0)session.engine.state.hitStopTimer=0;
    if(audioRef.current){
     audioRef.current.setBulletTime(dir.currentSlowMoRemaining()>0);
     playDirectorAudio(audioRef.current,stepResult.events,session);
    }
   }
   const rankIdx=dir?['D','C','B','A','S','SS','OMEGA'].indexOf(dir.hudSnapshot(session).styleRank):0;
   const bgmIntensity=session.snapshot.bossHp!==null?'boss':session.engine.state.hazards.some(h=>h.hp>0)?(rankIdx>=4?'surge':'battle'):'calm';
   audioRef.current?.setBgmState(
    sortieStartedRef.current&&session.run.phase==='battle'&&session.engine.state.phase==='playing'&&!reviewBlocked,
    bgmIntensity,
   );
   if(cartWarningQa&&arenaRef.current){
    // Real engine state, observed once per animation frame; not injected.
    const realCart=session.engine.state.hazards.find(h=>h.type==='RUNAWAY_CART'&&h.hp>0);
    arenaRef.current.dataset.omegaCartPhase=realCart?.motion?.phase??'none';
    arenaRef.current.dataset.omegaCartHp=String(session.engine.state.player.hp);
    arenaRef.current.dataset.omegaCartTimer=String(realCart?.motion?.timer??-1);
    arenaRef.current.dataset.omegaCartClock=String(session.engine.state.gameTime);
   }
   if(zombieAiQa&&arenaRef.current){
    // Genuine live positions, brain state, attack warnings and native player
    // damage. No game-state changes or outcome fabrication in telemetry.
    arenaRef.current.dataset.omegaZombieTelemetry=JSON.stringify(session.zombieTelemetry);
    arenaRef.current.dataset.omegaZombiePlayerHp=String(session.engine.state.player.hp);
    arenaRef.current.dataset.omegaZombieClock=session.engine.state.gameTime.toFixed(3);
   }
   // QA read-only evidence of native projectile events and actual target HP.
   // No damage is synthesized, injected or applied from telemetry.
   if(fixture&&arenaRef.current){
    for(const e of engineEvents){
     if(e.kind!=='radio'||e.phase!=='impact')continue;
     if(e.targetId===fixture.zombieId&&(e.appliedDamage??0)>0){
      qaRadioHits++;
      qaRadioDamage+=e.appliedDamage??0;
     }
     if(e.blocked)qaRadioBlocked++;
    }
    const h=session.engine.state.hazards.find(item=>item.id===fixture.zombieId);
    const arena=arenaRef.current;
    arena.dataset.omegaQaZombieHp=h?String(h.hp):'MISSING';
    arena.dataset.omegaQaZombieX=h?String(h.x):'MISSING';
    arena.dataset.omegaQaZombieY=h?String(h.y):'MISSING';
    arena.dataset.omegaQaPlayerX=String(session.engine.state.player.x);
    arena.dataset.omegaQaPlayerY=String(session.engine.state.player.y);
    arena.dataset.omegaQaFacing=JSON.stringify(session.facing);
    arena.dataset.omegaQaBladeDamage=String(session.lastBladeStrike?.totalDamage??0);
    arena.dataset.omegaQaBladeTime=String(session.lastBladeStrike?.time??-1);
    arena.dataset.omegaQaGunHits=String(qaRadioHits);
    arena.dataset.omegaQaGunDamage=qaRadioDamage.toFixed(3);
    arena.dataset.omegaQaGunBlocked=String(qaRadioBlocked);
    arena.dataset.omegaQaGameTime=session.engine.state.gameTime.toFixed(3);
    if(fixture.mode==='combatHit'){
     // READ-ONLY telemetry of native OMEGA/WATCH drifter contact and HP.
     const brain=session.zombieBrain(fixture.zombieId);
     arena.dataset.omegaG5hPlayerHp=String(session.engine.state.player.hp);
     arena.dataset.omegaG5hInvincibleTime=String(session.engine.state.player.invincibleTime);
     arena.dataset.omegaG5hZombiePhase=brain?.phase??'none';
     arena.dataset.omegaG5hZombieWarnings=String(brain?.warnings??0);
     arena.dataset.omegaG5hZombieHits=String(brain?.hits??0);
     arena.dataset.omegaG5hZombieDamage=String(brain?.damageDone??0);
     arena.dataset.omegaG5hLastDamageRemaining=String(session.engine.state.lastDamage?.remaining??0);
    }
   }
   if(g5iArtLab&&arenaRef.current){
     const e=omegaG5iActionPreview.evidence();
     arenaRef.current.dataset.omegaG5iLiveActionFrames=JSON.stringify(e.frames);
     arenaRef.current.dataset.omegaG5iLiveActionCounts=JSON.stringify(e.counts);
    }
   if(infectedLab&&arenaRef.current)arenaRef.current.dataset.omegaInfectedEvidence=JSON.stringify(omegaInfectedCandidateReview.evidence());
    fireCue=omegaAdvanceActorFireCue(fireCue,engineEvents,session.engine.state.gameTime);
   impacts=omegaAdvanceImpactFx(impacts,engineEvents,session.engine.state.gameTime);
   const player=session.engine.state.player;
   dashEchoes=omegaAdvanceDashEchoes(dashEchoes,player,priorPlayer,session.facing,
    Boolean(player.isDashing),session.engine.state.gameTime,
    session.run.phase==='battle'&&session.engine.state.phase==='playing');
   priorPlayer={x:player.x,y:player.y};
   // Sample after Watch movement and physical cover collision correction.
   // No actual displacement => do not animate a run cycle.
   const liftKind=session.gateTransit?.phase==='depart'?session.gateTransit.link.kind:null;
   const ridingVerticalLift=Boolean(session.crossingConnectedPassage&&liftKind&&omegaConnectedVerticalTravelSeconds(liftKind)>0&&session.gateTransit!.elapsed>=OMEGA_DECK_BOARDING_SECONDS);
   const gait=gaitController.advance(
    {x:player.x+session.fieldWorldOffsetX,y:player.y},now/1000,
    session.connectedFields?.[session.plan.wave-1]?1:session.plan.wave,
    Boolean(player.isDashing)||session.run.phase!=='battle'||ridingVerticalLift);
   if((gait.left.landed||gait.right.landed)&&!player.isDashing&&session.run.phase==='battle'&&sortieStartedRef.current){
    audioRef.current?.playFootstep();
   }
   const motion=motionSmoother.advance(
    player.x+session.fieldWorldOffsetX,player.y,
    dt,session.connectedFields?.[session.plan.wave-1]?1:session.plan.wave);
   const pose=facingController.advance(
    session.engine.state.gameTime,session.facing,fireCue,{
     dashing:Boolean(player.isDashing),
     hurting:Boolean(session.engine.state.lastDamage&&session.engine.state.lastDamage.remaining>1.85),
     playing:session.engine.state.phase==='playing'&&session.run.phase==='battle',
    });
   const ctx=canvasRef.current?.getContext('2d');
   if(ctx){
    if(dt>0&&sortieStartedRef.current&&session.run.phase==='battle'&&session.engine.state.phase==='playing'){
     const adapted=governorRef.current?.recordFrame(dt,perfPresetRef.current,mobileProfileRef.current.isCompactViewport);
     if(adapted)scaleCanvas();
    }
    const bossLive=session.snapshot.bossHp!==null;
    const fieldPhase=session.field?.progress.phase;
    const focus:OmegaCameraFocus=bossLive?'boss':fieldPhase==='objective'||fieldPhase==='exit'
     ?'traversal':'battle';
    const cssW=arenaRef.current?.clientWidth||ctx.canvas.width;
    const cssH=arenaRef.current?.clientHeight||ctx.canvas.height;
    const target=omegaCameraTargetZoom(focus,cssW,cssH);
    // Continuous transition prevents a sudden snap when the last enemy dies.
    // Purely visual: Watch XY, movement and dash physics are unchanged.
    const easing=dt>0?1-Math.exp(-Math.min(dt,.05)*3.8):0;
    cinematicZoom+=(target-cinematicZoom)*easing;
    const passagePose=session.crossingConnectedPassage?{...pose,bodyX:1,bodyY:0,weaponX:1,weaponY:0,shooting:false}:pose;
    const renderedCamera=drawLab(ctx,session,fireCue,impacts,gait,passagePose,
     finishClock.advance(session.run.phase,now/1000),cinematicZoom,dashEchoes,g5hRealHitLab,motion,tracerTracker,directorRef.current??undefined,mobileProfileRef.current,cleanHudRef.current);
    lastCameraRef.current=renderedCamera;
    if(import.meta.env.DEV&&session.connectedFields&&arenaRef.current){
     const {dataset}=arenaRef.current;
     dataset.omegaSeamPlayerX=String(player.x+session.fieldWorldOffsetX);
     dataset.omegaSeamCameraX=String(-renderedCamera.projectedOffsetX);
     dataset.omegaSeamScreenX=String(renderedCamera.playerScreenX);
     dataset.omegaLiftElevation=String(session.playerElevation);
     dataset.omegaLiftCameraY=String(-renderedCamera.projectedOffsetY);
     dataset.omegaLiftScreenY=String(renderedCamera.playerScreenY);
    }
   }
   if(dt>0){fpsTotal+=dt;fpsCount++;}
   if(now-fpsAt>800&&fpsTotal>0){
    setFps(Math.round(fpsCount/fpsTotal));fpsTotal=0;fpsCount=0;fpsAt=now;
   }
   if(now-lastHudAt.current>mobileProfileRef.current.hudCommitIntervalMs){
    lastHudAt.current=now;
    setSnapshot(session.snapshot);
    if(directorRef.current){
     const hud=directorRef.current.hudSnapshot(session);
     setZeroHud(hud);
     const cleared=session.run.phase==='victory'?15:Math.max(0,session.run.victories);
     setBlackboxes(prev=>{
      const next=omegaEvaluateBlackboxUnlocks({
       clearedWaves:cleared,
       detonations:hud.detonations,
       strikersCalledById:hud.strikersCalledById,
       victory:session.run.phase==='victory',
       peakTier:hud.peakRank,
      },prev);
      if(next.length!==prev.length){saveZeroSignalArchive(next);return next;}
      return prev;
     });
    }
   }
   }catch(error){
    console.error('OMEGA frame loop error',error);
   }finally{
    if(alive)request=requestAnimationFrame(frame);
   }
  };
  request=requestAnimationFrame(frame);
  return ()=>{
   alive=false;cancelAnimationFrame(request);
   window.removeEventListener('keydown',onKeyDown);window.removeEventListener('keyup',onKeyUp);
   window.removeEventListener('blur',pauseOnBackground);
   window.removeEventListener('resize',scaleCanvas);
   window.removeEventListener('orientationchange',scaleCanvas);
   document.removeEventListener('visibilitychange',onVisibility);
  };
 },[session,reviewBlocked,clearMovementInputs]);
 // QA states are initialized synchronously in makeOmegaFieldSession().
 const setDirection=(pointerId:number,x:number,y:number)=>{
  pointerMoves.current.set(pointerId,{x,y});
  const all=[...pointerMoves.current.values()];
  mobileDir.current={x:all.reduce((sum,p)=>sum+p.x,0),y:all.reduce((sum,p)=>sum+p.y,0)};
 };
 const releaseDirection=(pointerId:number)=>{
  pointerMoves.current.delete(pointerId);
  const all=[...pointerMoves.current.values()];
  mobileDir.current={x:all.reduce((sum,p)=>sum+p.x,0),y:all.reduce((sum,p)=>sum+p.y,0)};
 };
 // Dragging the center pad provides proportional 360-degree analog control.
 // The four cardinal touch buttons remain accessible. DOM-only thumb movement
 // avoids a React state commit for every touch event.
 const moveStick=(pointerId:number,clientX:number,clientY:number)=>{
  const stick=stickRef.current;if(!stick)return;
  const rect=stick.getBoundingClientRect();
  const dx=clientX-(rect.left+rect.width/2);
  const dy=clientY-(rect.top+rect.height/2);
  const limit=Math.max(22,Math.min(54,rect.width*1.1));
  const length=Math.hypot(dx,dy);
  const factor=length>limit?limit/length:1;
  const x=dx*factor,y=dy*factor;
  if(stickThumbRef.current)stickThumbRef.current.style.transform=
   'translate3d('+x.toFixed(1)+'px,'+y.toFixed(1)+'px,0)';
  const strength=length<7?0:1/limit;
  setDirection(pointerId,x*strength,y*strength);
 };
 const releaseStick=(pointerId:number)=>{
  releaseDirection(pointerId);
  if(stickThumbRef.current)stickThumbRef.current.style.transform='translate3d(0,0,0)';
 };
 const startFloatingStick=(pointerId:number,clientX:number,clientY:number,target:HTMLDivElement)=>{
  const rect=target.getBoundingClientRect();
  const ox=clientX-rect.left;
  const oy=clientY-rect.top;
  floatingOrigin.current={pointerId,x:ox,y:oy};
  arenaRef.current?.setAttribute('data-omega-stick-active','true');
  if(floatingHintRef.current)floatingHintRef.current.style.display='none';
  if(floatingRingRef.current){
   floatingRingRef.current.style.left=ox.toFixed(1)+'px';
   floatingRingRef.current.style.top=oy.toFixed(1)+'px';
   floatingRingRef.current.style.opacity='0.92';
  }
  if(floatingThumbRef.current){
   floatingThumbRef.current.style.transform='translate3d(-50%,-50%,0)';
  }
  setDirection(pointerId,0,0);
 };
 const moveFloatingStick=(pointerId:number,clientX:number,clientY:number,target:HTMLDivElement)=>{
  const orig=floatingOrigin.current;
  if(!orig||orig.pointerId!==pointerId)return;
  const rect=target.getBoundingClientRect();
  const dx=clientX-rect.left-orig.x;
  const dy=clientY-rect.top-orig.y;
  const maxR=44;
  const dist=Math.hypot(dx,dy);
  const scale=dist>maxR?maxR/dist:1;
  const cx=dx*scale,cy=dy*scale;
  if(floatingThumbRef.current){
   floatingThumbRef.current.style.transform=`translate3d(calc(-50% + ${cx.toFixed(1)}px),calc(-50% + ${cy.toFixed(1)}px),0)`;
  }
  if(dist<7){setDirection(pointerId,0,0);return;}
  setDirection(pointerId,dx/Math.max(maxR,dist),dy/Math.max(maxR,dist));
 };
 const endFloatingStick=(pointerId:number)=>{
  if(floatingOrigin.current?.pointerId===pointerId)floatingOrigin.current=null;
  arenaRef.current?.setAttribute('data-omega-stick-active','false');
  releaseDirection(pointerId);
  if(floatingRingRef.current)floatingRingRef.current.style.opacity='0';
  if(floatingThumbRef.current)floatingThumbRef.current.style.transform='translate3d(-50%,-50%,0)';
 };
 const openMobileMenu=()=>{
  clearMovementInputs();
  if(session.run.phase==='battle'&&!paused){
   session.pause();setPaused(true);setSnapshot(session.snapshot);
  }
  setMobileMenuOpen(true);
 };
 const closeMobileMenu=()=>{
  setMobileMenuOpen(false);
  if(session.run.phase==='battle'&&paused){
   session.resume();setPaused(false);setSnapshot(session.snapshot);
  }
 };
 const selectPerfPreset=(next:OmegaPerfPreset)=>{
  saveOmegaPerfPreset(next);
  perfPresetRef.current=next;
  setPerfPreset(next);
  governorRef.current?.reset();
  if(typeof window!=='undefined')window.dispatchEvent(new Event('resize'));
 };
 const toggleFullscreen=()=>{
  if(typeof document==='undefined')return;
  if(document.fullscreenElement){
   void document.exitFullscreen?.().catch(()=>{});
  }else{
   void document.documentElement.requestFullscreen?.().catch(()=>{});
  }
 };
 const handleInteract=()=>{
  const outcome=session.interact();
  setInteractionMessage(outcome.success?(outcome.reason==='EXIT_OPENED'?'격리 통로 진입 · 구역 이동 중':outcome.reason==='STEP_COMPLETE'?'임무 단계 완료':'현장 이벤트 해결 완료'):(outcome.reason==='OUT_OF_RANGE'?'대상 지점에 더 가까이 이동하세요':'주변 위협을 먼저 제거하세요'));
  setSnapshot(session.snapshot);
 };
 const choose=(id:OmegaUpgradeId)=>{
  clearMovementInputs();
  try{setSnapshot(session.selectUpgrade(id));setPaused(false);}
  catch(error){console.error('OMEGA internal reward choice rejected',error);}
 };
 const togglePause=()=>{
  if(session.run.phase!=='battle')return;
  if(paused)session.resume();
  else{
   session.pause();
   clearMovementInputs();
  }
  setPaused(!paused);setSnapshot(session.snapshot);
 };
 const openVisualAudit=(mode:'aira'|'infected'|'walk')=>{
  // The artwork overlay is intentionally a paused-only visual session.
  // Never resume automatically; the player chooses when to resume.
  visualAuditInputBlock.current=true;
  if(session.run.phase==='battle'&&!paused){
   session.pause();setPaused(true);setSnapshot(session.snapshot);
  }
  clearMovementInputs();
  setVisualAudit(mode);
 };
 const visualFrames:readonly OmegaVisualAuditFrame[]=visualAudit==='aira'
  ?omegaG5iActionPreview.reviewCards().map(card=>({
    file:card.file,imageUrl:card.imageUrl,width:card.width,height:card.height,
    referenceHeight:512,foot:card.foot??{x:192,y:card.toeRow},
    ...(card.muzzle?{muzzle:card.muzzle}:{}),
    ...(card.alphaBounds?{alphaBounds:card.alphaBounds}:{}),
   }))
  :visualAudit==='infected'
  ?omegaInfectedCandidateReview.reviewCards().map(card=>({
    file:card.file,imageUrl:card.imageUrl,width:card.width,height:card.height,
    referenceHeight:card.referenceHeight,foot:card.foot,alphaBounds:card.alphaBounds,
   }))
  :visualAudit==='walk'&&g5dActualReview&&!g5eNativeActionLab&&g5cStatus==='ready'
  ?omegaVerifiedG5dWalkCards(omegaG5cReview.sessionProof):[];
 const dashFeedback=omegaDashAvailability(session.engine.state.player);
 const counterplay=omegaNearestCounterplayCue(
  omegaCounterplayCues(session.engine.state.hazards,id=>session.zombieBrain(id)),
  {x:snapshot.playerX,y:snapshot.playerY});
 const guide=snapshot.field?omegaFieldTargetGuide(
  snapshot.field.plan,snapshot.field.progress,{x:snapshot.playerX,y:snapshot.playerY},
 ):null;
 return <main className="omega-protocol-lab omega-protocol-v2"
  data-omega-protocol-internal="true"
  data-omega-mobile-immersion={mobileImmersion?'true':'false'}
  data-omega-mobile-active-battle={mobileImmersion&&sortieStarted?'true':'false'}
  data-omega-clean-hud={cleanHud?'true':'false'}
  data-omega-perf-preset={perfPreset}
  data-omega-aira-v2-ready={userApprovedAiraV2.hasAllDirections()?'true':'false'}
  data-omega-aira-v2-status="user-selected-8-direction-neutral-art"
  data-omega-protected-art={OMEGA_PROTECTED_REVIEW?(reviewFailed?'failed':reviewBlocked?'loading':'ready'):'off'}
  data-omega-silver-preview={silverPreviewStatus}
  data-omega-review-layout={silverPreviewRequested?'true':'false'}
  data-omega-infected-layout={infectedLab?'true':'false'}
  data-omega-m12g4-silver-review={g4SilverLab?'source-sha256-dev-only':'off'}
  data-omega-m12g5-lab={g5ArtLab?'source-verified-silver-originals':'off'}
  data-omega-m12g5-vector-study={g5VectorStudy?'isolated-unapproved':'off'}
  data-omega-m12g5b-art={g5bPainterlyReview?OMEGA_G5B_ART_APPROVAL.status:'off'}
  data-omega-m12g5c-art={g5cArtReview?OMEGA_G5C_ART_POLICY.status:'off'}
  data-omega-m12g5c-source-status={g5cArtReview?g5cStatus:'off'}
  data-omega-m12g5c-preview={g5cArtReview&&g5cPreviewOn?'session-only-not-approved':'off'}
  data-omega-m12g5d-source={g5dActualReview?'git-4-real-webp-candidates-not-approved':'off'}
  data-omega-m12g5m-source={g5dActualReview&&!g5eNativeActionLab?'sha-4-real-walk-review':'off'}
  data-omega-m12g5d-art-gate={g5dActualReview?(OMEGA_G5D_ART_GATE.humanArtDirectionApproved?'approved':'visual-review-required'):'off'}
  data-omega-m12g5d-preview={g5dActualReview&&g5cPreviewOn?'dev-candidate-not-approved':'off'}
  data-omega-m12g5e-source={g5eNativeActionLab?OMEGA_G5E_ART_STATUS.rendering:'off'}
  data-omega-m12g5e-production={g5eNativeActionLab?'unapproved-visual-study':'off'}
  data-omega-m12g5g-source={g5gSourcePoseLab?'sha-verified-4-walk-poses-reused-for-action':'off'}
  data-omega-m12g5g-art-gate={g5gSourcePoseLab?(OMEGA_G5G_ART_APPROVAL.artistSignedOff?'approved':'source-derived-unapproved'):'off'}
  data-omega-m12g5h-native-hit={g5hRealHitLab?'real-zombie-contact-hp-damage-required':'off'}
  data-omega-m12g5h-final-art={g5hRealHitLab?(OMEGA_G5H_ART_GATE.productionApproved?'approved':'zero-independent-painterly-art-approved'):'off'}
   data-omega-m12g5i-art-review={g5iArtLab?'12-file-session-only-no-human-signoff':'off'}
   data-omega-m12g5i-final-art={g5iArtLab?String(OMEGA_G5I_ART_GATE.independentlyPaintedActionFramesApproved):'off'}
  data-omega-real-extreme-clears={realUnlockStatus.extremeStagesCleared}
  data-omega-real-unlock-eligible={realUnlockStatus.canEnter?'yes':'no'}
  data-omega-session-unlock-source="dev-qa-fixture"
  data-omega-zombie-ai-qa={zombieAiQa?'native-watch-engine':'off'}
  data-omega-cart-qa={cartWarningQa?'real-native-watch-cart-dev-fixture':'off'}
  data-omega-gate-walk-qa={import.meta.env.DEV&&typeof window!=='undefined'&&
   ['gateTravel','continuousLink','connectedLift','actBoundary6','actBoundary9','actBoundary12'].includes(
    new URLSearchParams(window.location.search).get('omegaQaState')??''
   )?'precleared-dev-only':'off'}>
  <header className="omega-protocol-topbar">
   <div className="omega-protocol-brand">
    <div className="omega-protocol-hero-identity"
     title="사용자가 채택한 AIRA V2 · 8방향 후보 원화 적용">
     <img src="/assets/omega/aira-v2/portrait.webp"
      onError={event=>{event.currentTarget.onerror=null;event.currentTarget.src='/assets/reignition/veteran-return.webp';}}
      alt="AIRA V2 캐릭터 초상" width={56} height={56}
      decoding="async" draggable={false} />
     <span aria-hidden="true">Ω</span>
    </div>
    <div className="omega-protocol-heading">
    <span className="omega-protocol-tag">INTERNAL QA · SPECIAL EDITION · 실제 극한 {realUnlockStatus.extremeStagesCleared}/50</span>
    <h1>OMEGA <em>PROTOCOL</em></h1>
    <p>극한 50/50 이후 해금 · 오염 산업단지 좀비 총·검 로그라이트 · 승인 전 QA</p>
   </div>
   </div>
   <button type="button" className="omega-protocol-exit" onClick={onExit} aria-label="내부 시험 종료">나가기 <span aria-hidden="true">×</span></button>
  </header>
  {OMEGA_PROTECTED_REVIEW&&<aside className="omega-silver-review-bar" role="status">
   {reviewBlocked?<><strong>{reviewFailed?'검수 원화를 확인하지 못했습니다.':'최신 검수 원화 확인 중'}</strong>
    {reviewFailed&&<button type="button" onClick={()=>window.location.reload()}>다시 불러오기</button>}</>
   :<><strong>은백색 AIRA · 감염체 4종 · 1–15구역 연결 전장 검수</strong>
    <a href="?omegaLab=1&amp;omegaView=lift">3→4구역 리프트·상부 데크 확인</a>
    <a href="?omegaLab=1&amp;omegaView=crane">6→7구역 크레인 승강기 확인</a>
    <a href="?omegaLab=1&amp;omegaView=tunnel">9→10구역 지하 통로 확인</a>
    <a href="?omegaLab=1&amp;omegaView=airlock">12→13구역 통제 에어록 확인</a>
    <a href="?omegaLab=1">1구역부터 플레이</a></>}
  </aside>}
  {infectedLab&&!OMEGA_PROTECTED_REVIEW&&<aside className="omega-infected-review-bar" role="status">
    <strong>감염체 4종 후보 · 개발 검수 전용</strong>
    {import.meta.env.DEV&&<button type="button" data-omega-g5n-load="infected"
     onClick={()=>{void importRecoveredQaInfected();}}
     disabled={infectedStatus==='loading'}>복구된 실제 감염체 16장 불러오기 (QA)</button>}
    <label htmlFor="omega-infected-files">WebP 16장과 앵커 JSON 선택</label>
    <input id="omega-infected-files" type="file" accept=".webp,.json" multiple onChange={e=>{void importInfected(e.currentTarget.files);e.currentTarget.value='';}} />
    <button type="button" data-omega-infected-toggle="true" disabled={infectedStatus!=='ready'} onClick={()=>setInfectedOn(omegaInfectedCandidateReview.activate(!infectedOn))}>{infectedOn?'기존 적으로 복귀':'실제 AI 후보 비교'}</button>
    <span data-omega-infected-feedback={infectedStatus}>{infectedMessage}</span>
    <small>이동·공격은 실제 AI 상태이며, 이미지·앵커·동작은 승인 전입니다.</small>
    <button type="button" data-omega-g5k-open="infected" disabled={infectedStatus!=='ready'}
     onClick={()=>openVisualAudit('infected')}>16장 크기·접지 비교</button>
   </aside>}
  {silverPreviewRequested&&!OMEGA_PROTECTED_REVIEW&&<aside className="omega-silver-review-bar" role="status">
    <strong>{g5iArtLab?'AIRA E 사격·대시·피격 신규 원화 12장 로컬 실게임 대조 · 아트 승인 전':g5hRealHitLab?'AIRA E 감염체 실제 피격·원본 HIT 포즈 검수 · 신규 도색 아님':g5gSourcePoseLab?'AIRA E 액션 실제 몸체 4자세 원본 연결 검수 · 독립 도색 아님':g5eNativeActionLab?'AIRA E 사격·대시·피격 엔진 연출 검수 (신규 도색 원화 아님)':g5dActualReview?'은백색 AIRA · 실제 E 걷기 원화 4장 개발 검수':g5cArtReview?'은백색 AIRA · 독립 E 걷기 원화 4장 실게임 검수':g5bPainterlyReview?'은백색 AIRA 원본 유지 · 신규 4장 제작·승인 대기':g5VectorStudy?'AIRA E·감염체 원화 6장 비교 · 시각 품질 미합격':g5ArtLab?'은백색 AIRA 원본 유지 · 원화 비교 별도':g4SilverLab?'은백색 AIRA · 원본 8방향 게임 검수':'은백색 AIRA · 로컬 원화 시험'}</strong>
    <span>{silverPreviewStatus==='ready'
     ?(g5iArtLab?'로컬 후보 12장 검수 후 네이티브 동작에 임시 적용 · 와이드 앵커와 작화는 별도 육안 검증':g5hRealHitLab?'실제 감염체가 공격하여 플레이어 HP가 감소할 때만 HIT 표시 · 신규 상업 원화 승인 0':g5gSourcePoseLab?'SHA-256 고정 E 걷기 원본 4장 몸체 자세를 실제 전투 이벤트에 사용 · 신작 독립 원화 0':g5eNativeActionLab?'실제 엔진 이벤트의 원본 AIRA 사격·대시·피격 연출 · 160원화/320마스크 미승인':g5dActualReview?'실제 GitHub 4개 WebP 원화 후보 · 원본 8방향 기본 유지 · 아트 승인 미완':g5cArtReview?'원본 8방향 고정 · 외부 API 없음 · 160원화/320마스크 미승인':g5bPainterlyReview?'원본 8방향 검증 · 독립 페인터리 E 4장 미제작 · 기존 캐릭터 유지':g5VectorStudy?'비교용 별도 동작 6장 · 기존 AIRA 대비 그래픽 저하로 미승인 · 전체160/320 미완':g5ArtLab?'원본 8방향 검증·기존 주인공 원화 유지·독립 동작 원화 검수 별도':'원화 8개 SHA-256 확인 · 실제 Watch 엔진 화면에 표시 · 160프레임 및 마스크 미완')
     :silverPreviewStatus==='loading'?'로컬 원화 무결성 확인 중'
     :'연결 실패 · 기존 캐릭터 유지 · 검수실에서 원화 8개를 먼저 등록하세요'}</span>
    <a href="/omega-canonical-art-review/index.html">원화 검수실</a>
    {g5iArtLab&&<div className="omega-g5c-art-controls" data-omega-g5i-controls="true">
      <label htmlFor="omega-g5i-files">E FIRE/DASH/HIT 신규 원화 12장 선택</label>
      <input id="omega-g5i-files" type="file" accept="image/webp,.webp" multiple
       aria-label="사격 대시 피격 각각 4장씩 총 12개 투명 원화 WebP 선택"
       onChange={e=>{void importG5iFiles(e.currentTarget.files);e.currentTarget.value='';}} />
      {import.meta.env.DEV&&<button type="button" data-omega-g5n-load="aira"
       disabled={g5iStatus==='loading'}
       onClick={()=>{void importRecoveredQaAira();}}>복구된 실제 AIRA 전투 원화 12장 불러오기 (QA)</button>}
      <label htmlFor="omega-g5i-wide-files">와이드 후보 12장과 앵커 JSON 선택</label>
      <input id="omega-g5i-wide-files" type="file" accept=".webp,.json" multiple
       onChange={e=>{void importG5iWide(e.currentTarget.files);e.currentTarget.value='';}} />
      <button type="button" data-omega-g5i-toggle="true"
       disabled={g5iStatus!=='ready'||silverPreviewStatus!=='ready'}
       onClick={()=>{const enabled=omegaG5iActionPreview.activate(!g5iPreviewOn);setG5iPreviewOn(enabled);}}>
       {g5iPreviewOn?'원본 8방향 복귀':'실전 전투 원화 비교'}
      </button>
      <span data-omega-g5i-feedback={g5iStatus} title={g5iFeedback}>{g5iFeedback}</span>
      <small>원본 파일은 이 브라우저 세션에서만 사용됩니다. 160원화·320마스크·독립 작화 승인 0.</small>
      <button type="button" data-omega-g5k-open="aira" disabled={g5iStatus!=='ready'}
       onClick={()=>openVisualAudit('aira')}>12장 원본·앵커 비교</button>
     </div>}
     {g5cArtReview&&<div className="omega-g5c-art-controls" data-omega-g5c-controls="true">
     {g5dActualReview?<button type="button" data-omega-g5d-load="true"
      disabled={g5cStatus==='loading'||silverPreviewStatus!=='ready'}
      onClick={()=>{void importG5dActualSources();}}>저장소 실제 원화 4장 검사</button>:<>
      <label htmlFor="omega-g5c-files">E 걷기 원화 4장 선택</label>
      <input id="omega-g5c-files" type="file" accept="image/webp,.webp" multiple
       aria-label="동쪽 걷기 원화 WebP 4장 불러오기"
       onChange={e=>{void importG5cFiles(e.currentTarget.files);e.currentTarget.value='';}} />
     </>}
     {g5dActualReview&&!g5eNativeActionLab&&<button type="button"
      data-omega-g5m-walk-review="true"
      disabled={g5cStatus!=='ready'||silverPreviewStatus!=='ready'||
       omegaVerifiedG5dWalkCards(omegaG5cReview.sessionProof).length!==4}
      onClick={()=>openVisualAudit('walk')}>SHA 원본 E 걷기 4장 비교</button>}
     <button type="button" data-omega-g5c-toggle="true"
      disabled={g5cStatus!=='ready'||silverPreviewStatus!=='ready'}
      onClick={()=>{const enabled=omegaG5cReview.activate(!g5cPreviewOn);setG5cPreviewOn(enabled);}}
     >{g5cPreviewOn?'기존 원본 복귀':'실전 걷기 비교'}</button>
     <span data-omega-g5c-feedback={g5cStatus} title={g5cFeedback}>{g5cFeedback}</span>
    </div>}
   </aside>}
  {visualAudit&&visualFrames.length>0&&<OmegaCandidateArtAudit mode={visualAudit}
   cards={visualFrames} onClose={closeVisualAudit}/>}
  <section className="omega-protocol-stage" inert={reviewBlocked} aria-label="OMEGA PROTOCOL 내부 전투 시험">
   <div ref={arenaRef} className="omega-protocol-arena" data-omega-phase={snapshot.run.phase}
     data-omega-qa-mode={combatProbe?.mode}
     data-omega-qa-provenance={combatProbe?'dev-fixture-genuine-engine':undefined}
     data-omega-qa-gun-enabled={combatProbe?String(combatProbe.gunEnabled):undefined}
     data-omega-qa-cover-detour={combatProbe?String(combatProbe.coverDetour):undefined}
     data-omega-qa-zombie-id={combatProbe?.zombieId}
     data-omega-qa-start-hp={combatProbe?.initialHp}
     data-omega-boss-active={snapshot.bossHp!==null&&snapshot.run.phase==='battle'}
     data-omega-field-phase={snapshot.field?.progress.phase??'none'}
     data-omega-world-wave={snapshot.field?.plan.wave??0}
     data-omega-act-dock-role={snapshot.field?omegaActBoundaryDock(snapshot.field.plan)?.role??'none':'none'}
     data-omega-act-dock-kind={snapshot.field?omegaActBoundaryDock(snapshot.field.plan)?.kind??'none':'none'}
     data-omega-act-dock-height={snapshot.field?omegaActBoundaryDock(snapshot.field.plan)?.verticalMeters??0:0}
     data-omega-act-dock-id={snapshot.field?omegaActBoundaryDock(snapshot.field.plan)?.linkId??'none':'none'}
     data-omega-act-dock-x={snapshot.field?omegaActBoundaryDock(snapshot.field.plan)?.point.x??0:0}
     data-omega-act-dock-y={snapshot.field?omegaActBoundaryDock(snapshot.field.plan)?.point.y??0:0}
     data-omega-transit-link-id={snapshot.gateTransit?.link.linkId??'none'}
     data-omega-transit-kind={snapshot.gateTransit?.link.kind??'none'}
     data-omega-transit-depart-x={snapshot.gateTransit?.link.departure.x??0}
     data-omega-transit-arrive-x={snapshot.gateTransit?.link.arrival.x??0}
     data-omega-transit-phase={snapshot.gateTransit?.phase??'none'}
     data-omega-transit-to={snapshot.gateTransit?.link.toWave??0}
     data-omega-player-elevation={OMEGA_PROTECTED_REVIEW?session.playerElevation.toFixed(1):undefined}
     data-omega-transit-opacity={snapshot.gateTransit?.opacity.toFixed(3)??'0'}
     data-omega-blade-combo={snapshot.blade?.combo??0}
     data-omega-blade-hits={snapshot.blade?.hits??0}
     data-omega-player-x={snapshot.playerX.toFixed(1)}
     data-omega-player-y={snapshot.playerY.toFixed(1)}
     data-omega-counterplay-kind={counterplay?.kind??'none'}
     data-omega-counterplay-phase={counterplay?.phase??'none'}
     data-omega-counterplay-id={counterplay?.id??'none'}
     data-omega-dash-remaining={dashFeedback.remaining.toFixed(2)}
     data-omega-dash-ready={String(dashFeedback.ready)}
     data-omega-near-threats={session.engine.state.hazards.filter(h=>h.hp>0&&
      Math.hypot(h.x-snapshot.playerX,h.y-snapshot.playerY)<=340).length}>
    <canvas ref={canvasRef} width={1120} height={720}
     onContextMenu={e=>{
      if(!sortieStarted||snapshot.run.phase!=='battle'||paused)return;
      e.preventDefault();
      const canvas=canvasRef.current,cam=lastCameraRef.current;
      let aimWorld:{x:number;y:number}|null=null;
      if(canvas&&cam){
       const rect=canvas.getBoundingClientRect();
       if(rect.width>0&&rect.height>0){
        const cx=((e.clientX-rect.left)/rect.width)*canvas.width;
        const cy=((e.clientY-rect.top)/rect.height)*canvas.height;
        const wy=(cy/cam.scale-cam.projectedOffsetY)/cam.groundYScale+session.fieldElevation;
        const mx=cx/cam.scale-cam.projectedOffsetX;
        const wx=mx-cam.skewX*wy;
        if(Number.isFinite(wx)&&Number.isFinite(wy))aimWorld={x:wx,y:wy};
       }
      }
      triggerRailBurst(aimWorld);
     }}
     aria-label="실제 시그널 워치 전투 엔진을 사용하는 OMEGA PROTOCOL 내부 전장" />
    <div className="omega-protocol-stage-shade" aria-hidden="true"/>
    {mobileImmersion&&<div className="omega-zs-mobile-top-actions">
     <button type="button" className="omega-zs-mobile-icon-btn" onClick={toggleMute} aria-label={muted?'사운드 켜기':'사운드 끄기'}>{muted?'🔇':'🔊'}</button>
     <button type="button" className="omega-zs-mobile-icon-btn" onClick={openMobileMenu} aria-label="전술 메뉴 및 최적화 설정 열기">☰</button>
    </div>}
    {mobileImmersion&&!classicPad&&sortieStarted&&snapshot.run.phase==='battle'&&!paused&&!mobileMenuOpen&&(
     <div
      className="omega-zs-floating-stick-zone"
      aria-label="좌측 화면 플로팅 이동 스틱 영역"
      onPointerDown={e=>{
       e.preventDefault();
       audioRef.current?.unlock();
       e.currentTarget.setPointerCapture(e.pointerId);
       startFloatingStick(e.pointerId,e.clientX,e.clientY,e.currentTarget);
      }}
      onPointerMove={e=>{
       if(e.currentTarget.hasPointerCapture(e.pointerId))
        moveFloatingStick(e.pointerId,e.clientX,e.clientY,e.currentTarget);
      }}
      onPointerUp={e=>endFloatingStick(e.pointerId)}
      onPointerCancel={e=>endFloatingStick(e.pointerId)}
      onLostPointerCapture={e=>endFloatingStick(e.pointerId)}
     >
      <div ref={floatingRingRef} className="omega-zs-floating-stick-ring" aria-hidden="true">
       <span ref={floatingThumbRef} className="omega-zs-floating-stick-thumb" />
      </div>
      <span ref={floatingHintRef} className="omega-zs-floating-hint" aria-hidden="true">좌측 드래그 이동</span>
     </div>
    )}
    <div className="omega-protocol-stats" aria-label="전투 상태">
     <div className="omega-protocol-wave">
      <small>{OMEGA_STORY_ACTS[snapshot.plan.sector-1]?.title??'OMEGA'} · MAP {snapshot.plan.sector.toString().padStart(2,'0')} / 05</small>
      <strong>ROUTE {Math.min(OMEGA_PROTOCOL_TOTAL_WAVES,snapshot.run.wave).toString().padStart(2,'0')} <span>/ 15</span></strong>
     </div>
     <div className="omega-protocol-hp">
      <span><b>HP</b> {Math.ceil(snapshot.playerHp)} / {snapshot.playerMaxHp} {zeroHud.shield>0&&<em className="omega-zs-shield-text">+ 🛡 {zeroHud.shield}</em>}</span>
      <div role="meter" aria-label="남은 체력" aria-valuemin={0} aria-valuemax={snapshot.playerMaxHp} aria-valuenow={Math.max(0,Math.min(snapshot.playerMaxHp,Math.ceil(snapshot.playerHp)))}>
       <i style={{width:(Math.max(0,Math.min(1,snapshot.playerHp/Math.max(1,snapshot.playerMaxHp)))*100)+'%'}} />
       {zeroHud.maxShield>0&&zeroHud.shield>0&&<b className="omega-zs-shield-bar" style={{width:(Math.min(1,zeroHud.shield/Math.max(1,zeroHud.maxShield))*100)+'%'}} />}
      </div>
     </div>
     <div className="omega-protocol-threat"><small>THREATS</small><strong>{snapshot.enemiesAlive.toString().padStart(2,'0')}</strong></div>
     <div className="omega-protocol-modifier"><small>ENVIRONMENT</small><strong>{({standard:'표준',crosswind:'횡풍',low_visibility:'시야 제한',unstable_ground:'불안정 지반'} as const)[snapshot.plan.modifier]}</strong></div>
    </div>
    {sortieStarted&&<aside className="omega-zs-style-badge" aria-label="전투 스타일 랭크" style={{borderColor:zeroHud.styleColorHex}}>
     <div className="omega-zs-style-top">
      <strong style={{color:zeroHud.styleColorHex}}>{zeroHud.styleRank}</strong>
      <div>
       <span>{zeroHud.styleTitle}</span>
       <small>{zeroHud.comboCount>0?`${zeroHud.comboCount} COMBO · ` : ''}{zeroHud.score.toLocaleString()} PTS</small>
      </div>
     </div>
     <div className="omega-zs-style-meter"><i style={{width:(zeroHud.styleProgress*100).toFixed(1)+'%',background:zeroHud.styleColorHex}} /></div>
     <span className="omega-zs-style-bonus">{zeroHud.overclockRemaining>0?'⚡ OVERCLOCK '+zeroHud.overclockRemaining.toFixed(1)+'s':zeroHud.styleBonusSummary}</span>
     {zeroHud.activeEvos.length>0&&<div className="omega-zs-evo-chips">{zeroHud.activeEvos.map(id=>{
      const spec=OMEGA_EVOLUTIONS.find(e=>e.id===id);
      return spec?<span key={id} style={{borderColor:spec.accentHex,color:spec.accentHex}}>{spec.name}</span>:null;
     })}</div>}
    </aside>}
    {zeroHud.radioBanner&&<div className="omega-zs-radio-banner" role="status" style={{borderColor:zeroHud.radioBanner.accentHex}}>
     <small style={{color:zeroHud.radioBanner.accentHex}}>{zeroHud.radioBanner.seriesTag} · TACTICAL LINK</small>
     <strong>{zeroHud.radioBanner.text}</strong>
    </div>}
    {snapshot.field&&!snapshot.gateTransit&&<div className="omega-protocol-mission" role="status">
      <small>{snapshot.field.plan.sectorName} · {omegaStoryNode(snapshot.field.plan.wave).title}</small>
      <strong>{snapshot.field.progress.phase==='combat'?'주변 위협 제압':snapshot.field.progress.phase==='objective'?
       snapshot.field.plan.event.steps[snapshot.field.progress.completedSteps]?.label+' 조작':'다음 구역 출구 개방'}</strong>
      <span>{snapshot.field.progress.phase==='combat'?'적을 처치하면 현장 장치가 활성화됩니다.':
       snapshot.field.progress.phase==='objective'?(
       snapshot.field.plan.event.instructions+' · '+(snapshot.field.progress.completedSteps+1)+'/'+snapshot.field.plan.event.steps.length
      ):'녹색 출구까지 이동 후 상호작용하세요.'}</span>
      {guide&&<div className="omega-protocol-wayfinder" role="status"
       aria-label={guide.label+'까지 '+guide.distance+'월드 단위'}>
       <b className="omega-protocol-wayfinder-arrow" style={{transform:'rotate('+guide.degrees+'deg)'}} aria-hidden="true">➤</b>
       <span>{guide.label}</span>
       <strong>{guide.ready?'조작 가능':guide.distance+' 거리'}</strong>
      </div>}
      <span className="omega-protocol-story-radio" title={omegaStoryNode(snapshot.field.plan.wave).reveal}>{omegaStoryNode(snapshot.field.plan.wave).airaRadio}</span>
      {interactionMessage&&<em>{interactionMessage}</em>}
    </div>}
    {snapshot.plan.isBoss&&snapshot.run.phase==='battle'&&<div className="omega-protocol-boss-alert">
       {snapshot.plan.wave===15?'FINAL BOSS · 중앙 제어 코어':'BOSS 01 · 크레인 위협체'}
       {snapshot.bossHp!==null&&snapshot.bossMaxHp!==null&&<div className="omega-protocol-boss-hp"
        role="meter" aria-label="보스 남은 체력" aria-valuemin={0}
        aria-valuemax={snapshot.bossMaxHp} aria-valuenow={Math.ceil(snapshot.bossHp)}>
        <i style={{width:Math.max(0,Math.min(100,100*snapshot.bossHp/Math.max(1,snapshot.bossMaxHp)))+'%'}} />
       </div>}
      </div>}
    {snapshot.bossTelegraph&&snapshot.run.phase==='battle'&&<div className="omega-protocol-boss-phase" role="status">
      <strong>{snapshot.bossTelegraph.attack==='crane_drop'?'크레인 집중 낙하':'제어 코어 전력 방출'}</strong>
      <span>{snapshot.bossTelegraph.phase==='warning'
       ?'공격 예고 · 회피까지 '+snapshot.bossTelegraph.timer.toFixed(1)+'초'
       :snapshot.bossTelegraph.phase==='strike'?'공격 발동 · 위험구역 이탈'
       :'재정비 · 반격 기회'}</span>
      {snapshot.bossTelegraph.empowered&&<em>PHASE 2</em>}
    </div>}
    {counterplay&&snapshot.run.phase==='battle'&&<div className="omega-protocol-counterplay-hud"
     data-omega-counterplay-warning={counterplay.label} aria-live="off">
     <strong>{counterplay.phase==='charge'?'돌진 중 · 즉시 회피':counterplay.label+' · '+counterplay.seconds.toFixed(1)+'초'}</strong>
     <span>잠금 방향 확인 · {dashFeedback.label}</span>
    </div>}
    <div className="omega-protocol-controls">
     <div className="omega-protocol-pad" data-omega-pad-mode={classicPad?'arrows':'analog'}
      data-omega-floating-stick={mobileImmersion&&!classicPad?'true':'false'}
      aria-label={classicPad?'방향 버튼 이동':'360도 아날로그 스틱 이동'}>
      {buttonDirections.map(d=><button type="button" key={d.label} disabled={snapshot.run.phase!=='battle'||paused}
       onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);setDirection(e.pointerId,d.x,d.y);}}
       onPointerUp={e=>releaseDirection(e.pointerId)}
       onPointerCancel={e=>releaseDirection(e.pointerId)}
       onLostPointerCapture={e=>releaseDirection(e.pointerId)}
       aria-label={({ '↑':'위로 이동','←':'왼쪽 이동','↓':'아래로 이동','→':'오른쪽 이동'} as Record<string,string>)[d.label]}>{d.label}</button>)}
      <button type="button" ref={stickRef}
       className="omega-protocol-pad-center omega-protocol-stick"
       disabled={snapshot.run.phase!=='battle'||paused}
       aria-label="아날로그 이동 스틱 · 누른 채 방향 드래그"
       onPointerDown={e=>{
        e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);
        moveStick(e.pointerId,e.clientX,e.clientY);
       }}
       onPointerMove={e=>{
        if(e.currentTarget.hasPointerCapture(e.pointerId))
         moveStick(e.pointerId,e.clientX,e.clientY);
       }}
       onPointerUp={e=>releaseStick(e.pointerId)}
       onPointerCancel={e=>releaseStick(e.pointerId)}
       onLostPointerCapture={e=>releaseStick(e.pointerId)}
       onKeyDown={e=>{
        const dir=({'ArrowUp':[0,-1],'ArrowDown':[0,1],
         'ArrowLeft':[-1,0],'ArrowRight':[1,0]} as Record<string,number[]>)[e.key];
        if(dir){e.preventDefault();setDirection(-100,dir[0]!,dir[1]!);}
       }}
       onKeyUp={e=>{
        if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))
         releaseDirection(-100);
       }}
      >
       <span ref={stickThumbRef} className="omega-protocol-stick-thumb" aria-hidden="true"/>
      </button>
     </div>
     <div className="omega-protocol-action-pad">
      <button type="button" className="omega-protocol-action omega-protocol-blade"
       style={{['--ring-pct' as string]:`${Math.round(Math.max(0,Math.min(1,1-snapshot.bladeCooldownRemaining/OMEGA_BLADE_COOLDOWN))*100)}%`} as React.CSSProperties}
       data-detonate-ready={zeroHud.detonateReadyCount>0?'true':'false'}
       data-cooldown={snapshot.bladeCooldownRemaining>0?'true':'false'}
       data-combo={zeroHud.nextBladeCombo}
       onClick={requestBlade}
       disabled={snapshot.run.phase!=='battle'||snapshot.enginePhase!=='playing'}
       aria-label="공진 검격 · F 키 · 안전모 감염 좀비 및 기계형 적 3단 연속 공격">
       <span className="omega-protocol-action-glyph" aria-hidden="true">{zeroHud.detonateReadyCount>0?'💥':'⚔'}</span>
       <span>{zeroHud.detonateReadyCount>0?`폭파×${zeroHud.detonateReadyCount}`:`검격 ${zeroHud.nextBladeCombo}타`}</span>
       <small>{snapshot.bladeCooldownRemaining>0?snapshot.bladeCooldownRemaining.toFixed(1)+'s':zeroHud.detonateReadyCount>0?'폭파!':'READY'}</small>
      </button>
      <button type="button" className="omega-protocol-action omega-protocol-rail"
       style={{['--ring-pct' as string]:`${Math.min(100,zeroHud.railCharge)}%`} as React.CSSProperties}
       data-omega-rail-visible={snapshot.enemiesAlive>0?'true':'false'}
       data-ready={zeroHud.railChargesReady>0?'true':'false'}
       data-mode={zeroHud.weaponMode}
       onClick={()=>triggerRailBurst()}
       disabled={snapshot.run.phase!=='battle'||snapshot.enginePhase!=='playing'||zeroHud.railChargesReady<=0}
       aria-label="시그마 레일 버스트 · R 키 또는 우클릭 · 관통 전자기 사격">
       <span className="omega-protocol-action-glyph" aria-hidden="true">⌖</span><span>레일샷</span>
       <small>{zeroHud.railChargesReady>=2?'MAX ×2':zeroHud.railChargesReady===1?'READY':`${zeroHud.railCharge}%`}</small>
      </button>
      <button type="button" className="omega-protocol-action omega-protocol-interact" onClick={handleInteract}
       data-omega-interact-ready={snapshot.enemiesAlive===0?'true':'false'}
       disabled={snapshot.run.phase!=='battle'||paused||snapshot.enemiesAlive>0}
       aria-label="현장 상호작용 E">
       <span className="omega-protocol-action-glyph" aria-hidden="true">E</span><span>조작</span>
      </button>
      <button type="button" className="omega-protocol-action omega-protocol-dash"
       style={{['--ring-pct' as string]:`${Math.round((dashFeedback.ready?1:Math.max(0,Math.min(1,1-dashFeedback.remaining/Math.max(1,session.engine.state.player.dashMaxCooldown??3))))*100)}%`} as React.CSSProperties}
       onClick={()=>{
        audioRef.current?.unlock();
        if(session.dash()&&directorRef.current){
         const {phantomDodge}=directorRef.current.onPlayerDash(session);
         if(phantomDodge)audioRef.current?.playPhantomDodge();
         setZeroHud(directorRef.current.hudSnapshot(session));
        }
        setSnapshot(session.snapshot);
       }}
       disabled={snapshot.run.phase!=='battle'||snapshot.enginePhase!=='playing'||(session.engine.state.player.dashCooldown??0)>0}
       aria-label="회피 · 스페이스 또는 시프트">
       <span className="omega-protocol-action-glyph" aria-hidden="true">↗</span><span>회피</span><small>{dashFeedback.ready?"READY":dashFeedback.remaining>0?dashFeedback.remaining.toFixed(1)+"s":"ACTIVE"}</small>
      </button>
      <button type="button" className="omega-protocol-action omega-protocol-ultimate"
       style={{['--ring-pct' as string]:`${Math.floor(100*session.engine.state.ultimateCharge/Math.max(1,session.engine.state.maxUltimateCharge))}%`} as React.CSSProperties}
       onClick={()=>{audioRef.current?.unlock();session.ultimate();setSnapshot(session.snapshot);}}
       disabled={snapshot.run.phase!=='battle'||snapshot.enginePhase!=='playing'||session.engine.state.ultimateCharge<session.engine.state.maxUltimateCharge}
       aria-label={'궁극기 · 충전 '+Math.floor(100*session.engine.state.ultimateCharge/Math.max(1,session.engine.state.maxUltimateCharge))+'퍼센트'}>
       <span className="omega-protocol-action-glyph" aria-hidden="true">✦</span><span>궁극기</span>
       <small>{Math.floor(100*session.engine.state.ultimateCharge/Math.max(1,session.engine.state.maxUltimateCharge))}%</small>
      </button>
     </div>
    </div>
    {sortieStarted&&<div className="omega-zs-striker-dock" aria-label="시그널 올스타 전술 원호">
     <button type="button" className="omega-zs-mode-pill" data-mode={zeroHud.weaponMode} onClick={toggleWeaponMode} aria-label="총기 사격 모드 전환 · C 또는 Tab">
      {zeroHud.weaponMode==='focus'?'🎯 집중':'🔫 연사'}
     </button>
     <div className="omega-zs-charge-pill">⚡ LINK {zeroHud.strikerCharge}%</div>
     {OMEGA_STRIKERS.map(st=>{
      const unlocked=zeroHud.unlockedStrikers.includes(st.id);
      const cd=zeroHud.strikerCooldowns[st.id]??0;
      const ready=unlocked&&cd<=0&&zeroHud.strikerCharge>=st.costCharge&&snapshot.run.phase==='battle';
      return <button key={st.id} type="button" className="omega-zs-striker-btn" data-ready={ready?'true':'false'}
       data-unlocked={unlocked?'true':'false'}
       disabled={!ready} style={{borderColor:ready?st.accentHex:undefined}}
       onClick={()=>{
        audioRef.current?.unlock();
        if(directorRef.current?.triggerStriker(session,st.id)){
         audioRef.current?.playStriker(st.id);
         setZeroHud(directorRef.current.hudSnapshot(session));
         setSnapshot(session.snapshot);
        }
       }}>
       <kbd>{st.hotkey}</kbd>
       <strong>{st.name}</strong>
       <small>{!unlocked?`${st.unlockWave}구역 해금`:cd>0?`${cd.toFixed(0)}s`:`⚡${st.costCharge}`}</small>
      </button>;
     })}
    </div>}
    <div className="omega-protocol-stage-meta" aria-hidden="true"><span>WASD · 이동</span><span>SPACE · 저스트회피</span><span>F · 표식폭파</span><span>R/우클릭 · 레일샷</span><span>C · 사격모드</span><span>1~4 · 시그널원호</span><span>E · 조작</span><span>CPU · {fps||'—'} FPS</span></div>
    {snapshot.gateTransit&&!(session.connectedFields&&snapshot.gateTransit.link.fromWave<session.connectedFields.length)&&<div className="omega-protocol-gate-transit"
      role="status" aria-live="polite"
      aria-label={'실제 구역 연결 이동 · '+snapshot.gateTransit.link.passageLabel}
      data-omega-passage-kind={snapshot.gateTransit.link.kind}
      style={{opacity:snapshot.gateTransit.opacity}}>
      {snapshot.gateTransit.link.kind==='scaffold_lift'
       ?<div className="omega-protocol-lift-cross-section" aria-hidden="true">
         <div className="omega-protocol-lift-rail"><i/><i/><i/><i/></div>
         <div className="omega-protocol-lift-cage"
          style={{top:(snapshot.gateTransit.phase==='depart'
           ?68-43*snapshot.gateTransit.elapsed/snapshot.gateTransit.duration
           :25+43*snapshot.gateTransit.elapsed/snapshot.gateTransit.duration)+'%'}}>
          <span>SC-04</span><b>18M ↑</b>
         </div>
         <small>LEVEL 01 <b>→</b> LEVEL 02</small>
        </div>
       :snapshot.gateTransit.link.kind==='crane_elevator'
       ?<div className="omega-protocol-crane-cross-section" aria-hidden="true">
         <div className="omega-protocol-crane-boom"/>
         <div className="omega-protocol-crane-shaft"/>
         <div className="omega-protocol-crane-counterweight"/>
         <div className="omega-protocol-crane-car"
           style={{top:(snapshot.gateTransit.phase==='depart'
            ?75-55*snapshot.gateTransit.elapsed/snapshot.gateTransit.duration
            :20+55*snapshot.gateTransit.elapsed/snapshot.gateTransit.duration)+'%'}}>
            <b>CRANE CORE</b><small>24M ELEVATOR</small>
         </div>
        </div>
       :snapshot.gateTransit.link.kind==='service_tunnel'
       ?<div className="omega-protocol-tunnel-cross-section" aria-hidden="true">
          <div className="omega-protocol-tunnel-arch"/>
          <div className="omega-protocol-tunnel-pipes"/>
          <div className="omega-protocol-tunnel-bore"
            style={{transform:'translate(-50%,-50%) scale('+
             (snapshot.gateTransit.phase==='depart'
             ?1+.8*snapshot.gateTransit.elapsed/snapshot.gateTransit.duration
             :1.8-.8*snapshot.gateTransit.elapsed/snapshot.gateTransit.duration)+')'}}>
             <b>UNDERGROUND -12M</b>
          </div>
        </div>
       :snapshot.gateTransit.link.kind==='control_airlock'
       ?<div className="omega-protocol-airlock-cross-section" aria-hidden="true">
          <div className="omega-protocol-airlock-gauge"><b>O₂</b><span>PRESSURE NORMALIZING</span></div>
          <div className="omega-protocol-airlock-bulkheads">
            <i style={{transform:'translateX('+
             (snapshot.gateTransit.phase==='depart'
             ?-38+38*snapshot.gateTransit.elapsed/snapshot.gateTransit.duration
             :0-38*snapshot.gateTransit.elapsed/snapshot.gateTransit.duration)+'%)'}}/>
            <i style={{transform:'translateX('+
             (snapshot.gateTransit.phase==='depart'
             ?38-38*snapshot.gateTransit.elapsed/snapshot.gateTransit.duration
             :0+38*snapshot.gateTransit.elapsed/snapshot.gateTransit.duration)+'%)'}}/>
          </div>
          <span className="omega-protocol-airlock-seal">CONTAINMENT LOCK · 06M</span>
        </div>
       :<div className="omega-protocol-gate-doors" aria-hidden="true"><i/><i/></div>}
      <div className="omega-protocol-gate-sign">
       <span>OMEGA · QUARANTINE LINK</span>
       <strong>{snapshot.gateTransit.link.passageLabel}</strong>
       <p>{snapshot.gateTransit.link.fromName} → {snapshot.gateTransit.link.toName}</p>
       {snapshot.gateTransit.link.kind==='scaffold_lift'&&
        <p className="omega-protocol-lift-depth">비계 연결데크 · 18m 수직 이동 · 다음 구역 현장 진입</p>}
       {snapshot.gateTransit.link.kind==='crane_elevator'&&
        <p className="omega-protocol-lift-depth">크레인 유지보수 승강로 · 24m 상행 · 제어실 진입</p>}
       {snapshot.gateTransit.link.kind==='service_tunnel'&&
        <p className="omega-protocol-lift-depth">지하 배관 지대 · 12m 하강 · 오염 차단 밸브</p>}
       {snapshot.gateTransit.link.kind==='control_airlock'&&
        <p className="omega-protocol-lift-depth">압력 평형 · 6m 연결 구간 · 통제 핵심시설</p>}
       <small>{snapshot.gateTransit.phase==='depart'?'격리문 폐쇄 · 다음 구역 연결':'격리문 개방 · 현장 탐험 계속'}</small>
      </div>
     </div>}
    {paused&&sortieStarted&&!mobileMenuOpen&&snapshot.run.phase==='battle'&&<div className="omega-protocol-paused" role="status"><strong>작전 일시정지</strong><span>계속하기를 눌러 진행하세요.</span><button type="button" className="omega-protocol-resume-btn" onClick={togglePause}>▶ 계속하기</button></div>}
    {mobileMenuOpen&&<div className="omega-protocol-overlay omega-zs-mobile-drawer-overlay" role="presentation">
     <section className="omega-zs-mobile-drawer" role="dialog" aria-modal="true" aria-label="모바일 전술 및 최적화 설정">
      <div className="omega-zs-drawer-head">
       <div>
        <small>MOBILE COMMAND · {fps||'60'} FPS</small>
        <h3>전술 · 성능 설정</h3>
       </div>
       <button type="button" onClick={closeMobileMenu}>전투 재개 ▶</button>
      </div>
      <div className="omega-zs-drawer-section">
       <span>그래픽 최적화 모드</span>
       <div className="omega-zs-perf-pills">
        {([['auto','자동 (추천)'],['performance','60FPS 초고속'],['quality','최고 화질']] as const).map(([id,label])=>(
         <button key={id} type="button" className={perfPreset===id?'active':''} onClick={()=>selectPerfPreset(id)}>{label}</button>
        ))}
       </div>
      </div>
      <div className="omega-zs-drawer-actions">
       <button type="button" onClick={()=>{
        setClassicPad(m=>!m);
        floatingOrigin.current=null;
        if(floatingRingRef.current)floatingRingRef.current.style.opacity='0';
       }}>{classicPad?'🕹️ 플로팅 스틱으로 전환':'✚ 4방향 버튼으로 전환'}</button>
       <button type="button" className={cleanHud?'active':''} onClick={toggleCleanHud}>{cleanHud?'👁 집중 모드 ON (최소 HUD)':'👁 집중 모드 OFF (전체 HUD)'}</button>
       <button type="button" onClick={toggleMute}>{muted?'🔊 사운드 켜기':'🔇 사운드 끄기'}</button>
       <button type="button" onClick={toggleFullscreen}>⛶ 전체화면 전환</button>
       <button type="button" onClick={()=>{setMobileMenuOpen(false);launchSortie(loadoutId,dailyMode,false);}}>🎒 로드아웃 · 블랙박스</button>
       <button type="button" onClick={restart}>🔄 새 도전</button>
       <button type="button" className="danger" onClick={onExit}>✕ 시험 종료 (허브)</button>
      </div>
     </section>
    </div>}
    {!sortieStarted&&!reviewBlocked&&snapshot.run.phase==='battle'&&<div className="omega-protocol-overlay omega-zs-briefing-overlay" role="presentation">
      <section className="omega-zs-briefing" role="dialog" aria-modal="true" aria-label="ZERO SIGNAL 작전 브리핑">
       <div className="omega-zs-briefing-head">
        {mobileImmersion&&<button type="button" className="omega-zs-briefing-exit" onClick={onExit} aria-label="허브로 나가기">✕</button>}
        <span className="omega-protocol-modal-kicker">OMEGA PROTOCOL · SPECIAL EDITION // ZERO SIGNAL</span>
        <h2>시그널 올스타 전술 출격</h2>
        <p>총격(자동)으로 표식을 쌓고, 검격(F)으로 연쇄 폭파하라 · R/우클릭 레일 버스트 · C 사격모드(연사↔집중) · 위기 순간 회피(SPACE)로 불릿타임 &amp; 1~4 시그널 원호</p>
        <div className="omega-zs-briefing-tabs">
         <button type="button" className={!blackboxTab?'active':''} onClick={()=>setBlackboxTab(false)}>전술 로드아웃 (3종)</button>
         <button type="button" className={blackboxTab?'active':''} onClick={()=>setBlackboxTab(true)}>블랙박스 기록 ({blackboxes.length}/3)</button>
        </div>
       </div>
       {!blackboxTab?<>
        <div className="omega-zs-loadout-grid">
         {OMEGA_LOADOUTS.map(l=><button key={l.id} type="button" className={`omega-zs-loadout-card ${loadoutId===l.id?'selected':''}`}
          style={{borderColor:loadoutId===l.id?l.accentHex:undefined}} onClick={()=>setLoadoutId(l.id)}>
           <small style={{color:l.accentHex}}>{l.callsign}</small>
           <strong>{l.name}</strong>
           <em>{l.roleTag}</em>
           <span>{l.summary}</span>
          </button>)}
        </div>
        <div className="omega-zs-briefing-actions">
         <button type="button" className={`omega-zs-daily-toggle ${dailyMode?'active':''}`} onClick={()=>setDailyMode(d=>!d)}>
          📅 {dailyMode?`일일 작전 활성 (${omegaDailySeed().label})`:'일반 시드 → 일일 도전 전환'}
         </button>
         <button type="button" className="omega-zs-sortie-cta" onClick={()=>launchSortie(loadoutId,dailyMode,true)}>
          ⚡ 작전 개시 · SORTIE START
         </button>
        </div>
       </>:<div className="omega-zs-blackbox-list">
        {OMEGA_BLACKBOX_DOSSIERS.map(doc=>{
         const open=blackboxes.includes(doc.id);
         return <article key={doc.id} className={`omega-zs-blackbox-card ${open?'open':''}`}>
          <small>{doc.code} · {open?'해금됨':'미해금'}</small>
          <strong>{doc.title}</strong>
          <p>{open?doc.excerpt:doc.unlockHint}</p>
         </article>;
        })}
        <button type="button" className="omega-zs-sortie-cta" onClick={()=>launchSortie(loadoutId,dailyMode,true)}>전장 복귀 · 작전 개시</button>
       </div>}
      </section>
     </div>}
    {snapshot.run.phase==='reward'&&<div
      className="omega-protocol-overlay omega-protocol-reward-overlay omega-protocol-safe-room"
      role="presentation" data-omega-reward-context="in-world-safe-room"
      data-omega-reward-next-wave={snapshot.run.wave}>
      <section className="omega-protocol-rewards" role="dialog" aria-modal="true"
       aria-label="연결 통로 전술 보급 · 다음 구역 탐험 준비">
       <div className="omega-protocol-safe-room-head">
        <div className="omega-supply-top-row">
         <span className="omega-protocol-modal-kicker">OMEGA · TACTICAL ARMORY TERMINAL</span>
         <div className="omega-supply-vitals" aria-label="현재 작전 상태">
          <span>WAVE <b>{String(snapshot.run.wave).padStart(2,'0')}</b></span>
          <span className="hp">HP <b>{Math.ceil(snapshot.playerHp)}/{Math.ceil(snapshot.playerMaxHp)}</b></span>
          <span className="sh">🛡 <b>{zeroHud.shield}</b></span>
          <span className="rk" style={{color:zeroHud.styleColorHex}}>RANK <b>{zeroHud.styleRank}</b></span>
         </div>
        </div>
        <h2>전술 보급 터미널</h2>
        <p>다음 교전 구역: <strong>{omegaStoryNode(snapshot.run.wave).district}</strong> · {omegaStoryNode(snapshot.run.wave).title}</p>
        <span className="omega-protocol-safe-room-live">전투 일시 정지 · 카드 1장 선택 시 시너지가 즉시 반영되며 탐험이 재개됩니다</span>
       </div>
       <div className="omega-protocol-reward-cards">{snapshot.run.offers.map((id,i)=>{
        const u=OMEGA_UPGRADES.find(e=>e.id===id)!;
        const ownedStacks=snapshot.run.owned[id]??0;
        const nextStacks=ownedStacks+1;
        const meta=omegaSupplyUpgradeMeta(id,snapshot.run.owned);
        return <button key={id} type="button" onClick={()=>choose(id)}
          data-theme={meta.theme}
          data-awakens={meta.synergyStatus==='awakens_now'?'true':'false'}
          aria-label={'전술 보급 '+(i+1)+'번 · '+u.label+' · '+u.description}>
          <div className="omega-supply-card-head">
           <small className="omega-protocol-card-index">0{i+1} · {meta.categoryLabel}</small>
           <small className="omega-protocol-card-rank">LV {nextStacks}/{u.maxStacks}</small>
          </div>
          <div className="omega-supply-card-body">
           <OmegaSupplyUpgradeIcon id={id} theme={meta.theme}/>
           <div className="omega-supply-card-copy">
            <strong>{u.label}</strong>
            <span>{u.description}</span>
           </div>
          </div>
          <div className="omega-supply-card-foot">
           <div className="omega-supply-pips" aria-hidden="true">
            {Array.from({length:u.maxStacks},(_,idx)=>(
             <i key={idx} className={idx<ownedStacks?'filled':idx===ownedStacks?'next':'empty'}/>
            ))}
           </div>
           <em className={`omega-zs-card-synergy ${meta.synergyStatus}`}>{meta.synergyLabel}</em>
          </div>
         </button>;
       })}</div>
      </section>
     </div>}
    {(snapshot.run.phase==='defeat'||snapshot.run.phase==='victory')&&<div className="omega-protocol-overlay">
      <section className="omega-protocol-end omega-zs-scorecard" role="status">
       <span className="omega-protocol-modal-kicker">{snapshot.run.phase==='victory'?'MISSION COMPLETED // ZERO SIGNAL':'OPERATION TERMINATED'}</span>
       <div className="omega-zs-grade-banner">
        <strong>{zeroHud.finalGrade}</strong>
        <div>
         <h2>{snapshot.run.phase==='victory'?'작전 완전 성공':'작전 중지 · 전술 복귀'}</h2>
         <p>{zeroHud.score.toLocaleString()} PTS · {zeroHud.dailyMode?'일일 도전':'정규 작전'} · 최고 랭크 {zeroHud.peakRank}</p>
        </div>
       </div>
       <div className="omega-zs-stat-grid">
        <div><small>돌파 구역</small><b>{snapshot.run.victories} / 15</b></div>
        <div><small>최대 콤보</small><b>{zeroHud.maxCombo}</b></div>
        <div><small>표식 폭파</small><b>{zeroHud.detonations}회</b></div>
        <div><small>저스트 회피</small><b>{zeroHud.phantomDodges}회</b></div>
        <div><small>시그널 원호</small><b>{zeroHud.strikersCalled}회</b></div>
        <div><small>해금 기밀</small><b>{blackboxes.length} / 3</b></div>
       </div>
       <div className="omega-zs-end-actions">
        <button type="button" onClick={restart}>다시 출격</button>
        <button type="button" className="secondary" onClick={()=>launchSortie(loadoutId,dailyMode,false)}>로드아웃 · 블랙박스</button>
       </div>
      </section>
    </div>}
   </div>
  </section>
  <footer className="omega-protocol-bottom-toolbar" inert={reviewBlocked}>
   <div className="omega-protocol-run-tools">
    <button type="button" className="omega-protocol-control-switch"
     aria-pressed={classicPad}
     aria-label={classicPad?'아날로그 스틱으로 전환':'방향키 모드로 전환'}
     onClick={()=>{
      setClassicPad(mode=>!mode);
      pointerMoves.current.clear();mobileDir.current={x:0,y:0};
      if(stickThumbRef.current)stickThumbRef.current.style.transform='translate3d(0,0,0)';
     }}>{classicPad?'스틱':'방향키'}</button>
    <button type="button" onClick={toggleMute} aria-pressed={muted}>{muted?'🔇 음소거':'🔊 사운드 ON'}</button>
    <label>SEED <input inputMode="numeric" aria-label="재현용 시드" value={seedValue} onChange={e=>setSeedValue(e.target.value)} /></label>
    <button type="button" onClick={togglePause} disabled={snapshot.run.phase!=='battle'||!sortieStarted}>{paused?'계속하기':'일시정지'}</button>
    <button type="button" onClick={()=>launchSortie(loadoutId,dailyMode,false)}>로드아웃</button>
    <button type="button" onClick={restart}>새 도전</button>
    <button type="button" onClick={()=>{session.abandon();setSnapshot(session.snapshot);}} disabled={snapshot.run.phase==='defeat'||snapshot.run.phase==='victory'}>도전 포기</button>
   </div>
   <p className="omega-protocol-warning">미출시 내부 시험 · 시험용 50/50 진입 · 실제 해금 {realUnlockStatus.canEnter?'달성':'미달성'} ({realUnlockStatus.extremeStagesCleared}/50) · 원화 미승인</p>
  </footer>
 </main>;
}

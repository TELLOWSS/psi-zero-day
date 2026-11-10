import {useCallback,useEffect,useRef,useState} from 'react';
import {readOmegaProtocolAccess} from '../app/omega-protocol-access';
import {OmegaProtocolCombatSession,type OmegaCombatSnapshot} from '../engine/omega-protocol-combat';
import {OMEGA_UPGRADES,OMEGA_PROTOCOL_TOTAL_WAVES,type OmegaUpgradeId} from '../domain/omega-protocol-run';
import {omegaStoryNode,OMEGA_STORY_ACTS} from '../domain/omega-protocol-story';
import {WORLD_WIDTH,WORLD_HEIGHT} from '../engine/patrol-survivors-engine';
import {omegaFieldTargetGuide} from '../domain/omega-protocol-field';
import {omegaActBoundaryDock} from '../domain/omega-protocol-field-transit';
import {drawOmegaActBoundaryDock} from './omega-protocol-act-lift';
import {drawOmegaFieldGround,drawOmegaFieldProp,drawOmegaFieldMission,drawOmegaBossTelegraph} from './omega-protocol-field-render';
import {omegaFieldDepthOrder} from './omega-protocol-depth-scene';
import {drawOmegaMissionDevice,drawOmegaExtractionUnit} from './omega-protocol-mission-visuals';
import {omegaPrepareAuthoredScene} from './omega-protocol-authored-scene';
import {omegaQuarterViewCamera,applyOmegaQuarterView,omegaCameraTargetZoom,type OmegaCameraFocus} from './omega-protocol-camera';
import {drawOmegaProtocolEnemy} from './omega-protocol-enemy-render';
import {omegaCounterplayCues,omegaNearestCounterplayCue,omegaDashAvailability,drawOmegaCounterplayCues} from './omega-protocol-counterplay';
import {omegaCombatProbeMode,omegaSetupCombatProbe,type OmegaCombatProbeFixture} from './omega-combat-browser-probe';
import {drawOmegaProtocolActor} from './omega-protocol-actor-render';
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
import {OmegaGroundedGait,type OmegaWalkPose} from './omega-protocol-grounded-gait';
import {OmegaActorFacingController,type OmegaActorDirectionPose} from './omega-protocol-action-facing';
import {omegaResolveArtAction,OmegaTerminalMotionClock} from './omega-protocol-art-motion';
import {drawOmegaApprovedActor,OmegaApprovedImageCache,OMEGA_PROTOCOL_APPROVED_ART,OMEGA_PROTOCOL_BINARY_AUDIT_PASSED} from './omega-protocol-art-slot';
import {omegaAdvanceActorFireCue,OMEGA_EMPTY_FIRE_CUE,type OmegaActorFireCue} from './omega-protocol-actor-cues';
import {omegaAdvanceImpactFx,drawOmegaImpactFx,type OmegaImpactFx} from './omega-protocol-impact-vfx';
import {omegaAdvanceDashEchoes,drawOmegaDashEnergy,drawOmegaGroundedSplash,type OmegaDashEcho} from './omega-protocol-dash-visuals';
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
function drawLab(ctx:CanvasRenderingContext2D,session:OmegaProtocolCombatSession,fireCue:OmegaActorFireCue,impacts:readonly OmegaImpactFx[],gait:OmegaWalkPose,pose:OmegaActorDirectionPose,terminalElapsed:number,cameraZoom=1.55,echoes:readonly OmegaDashEcho[]=[]){
 const state=session.engine.state;
 ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
 ctx.fillStyle='#070e19';ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);
 ctx.save();
 // 3/4 field view is strictly visual: world XY hitboxes and Watch
 // movement are unchanged. Follow the projected hero and bound the map.
 const camera=omegaQuarterViewCamera(state.player,ctx.canvas.width,ctx.canvas.height,cameraZoom);
 applyOmegaQuarterView(ctx,camera);
 const field=session.field;
 const m12Budget=omegaM12Budget(ctx.canvas.width,ctx.canvas.height);
 const m12G2Quality=omegaG2Quality(ctx.canvas.width,ctx.canvas.height);
 const m12G3Budget=omegaG3Budget(ctx.canvas.width,ctx.canvas.height);
 const m12G4Budget=omegaG4Budget(ctx.canvas.width,ctx.canvas.height);
 if(field){
  drawOmegaFieldGround(ctx,field.plan,false);
  drawOmegaG2EntrySurface(ctx,field.plan,state.gameTime,m12G2Quality);
  drawOmegaG4CenterStageMaterial(ctx,field.plan,m12G4Budget);
  drawOmegaG2RearEnvironment(ctx,field.plan,state.gameTime,m12G2Quality);
  // Three independent screen-space atmospheric planes sample the REAL
  // hero-following quarter-view camera; restore leaves native physics intact.
  drawOmegaG3ParallaxArchitecture(ctx,field.plan,camera,
   ctx.canvas.width,ctx.canvas.height,cameraZoom,m12G3Budget);
  drawOmegaM12TerrainShadows(ctx,field.plan,m12Budget);
  drawOmegaM12DistanceHaze(ctx,field.plan,state.gameTime,m12Budget);
  drawOmegaActBoundaryDock(ctx,field.plan,state.gameTime);
  drawOmegaSectorOneActorLight(ctx,field.plan,state.player,state.gameTime);
  // All original actor contact reflections sit on the floor BEFORE real
  // boss warnings, enemy AI indicators, walls, players and weapons.
  drawOmegaG4ActorGrounding(ctx,field.plan,state.player,'silver-aira',m12G4Budget);
  for(const enemy of state.hazards)if(enemy.hp>0){
   drawOmegaG4ActorGrounding(ctx,field.plan,enemy,enemy.isStageBoss?'boss':'infected',
    m12G4Budget,Math.max(18,Math.min(38,enemy.radius??24)));
  }
 }
 else{
  ctx.fillStyle='#111a2b';ctx.fillRect(0,0,WORLD_WIDTH,WORLD_HEIGHT);
  ctx.strokeStyle='#243548';ctx.lineWidth=1;
  for(let x=0;x<=WORLD_WIDTH;x+=70){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,WORLD_HEIGHT);ctx.stroke();}
  for(let y=0;y<=WORLD_HEIGHT;y+=70){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(WORLD_WIDTH,y);ctx.stroke();}
 }
 ctx.strokeStyle='#446377';ctx.lineWidth=14;ctx.strokeRect(14,14,WORLD_WIDTH-28,WORLD_HEIGHT-28);
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
    zombie:session.zombieBrain(h.id)??undefined});
  ctx.restore();
 };
 const renderHero=()=>{
 // Independent eight-heading tactical actor placeholder, not an AIRA skin.
 if(field)drawOmegaM12ActorFootShadow(ctx,p,27);
 ctx.save();ctx.translate(p.x,p.y);
 ctx.transform(1,0,-camera.skewX/camera.groundYScale,1/camera.groundYScale,0,0);
 // Torso turns with bounded speed while genuine launch feedback aims the
 // muzzle instantly. Gameplay fire/aim physics are never changed.
 const actorView={
  facingX:pose.bodyX,facingY:pose.bodyY,
  weaponFacingX:pose.weaponX,weaponFacingY:pose.weaponY,
  moving:gait.active,gait,
  time:state.gameTime,dashing:Boolean(p.isDashing),
  shooting:pose.shooting,
  hurt:Boolean(state.lastDamage&&state.lastDamage.remaining>1.85),
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
 const artView={...actorView,...action,
  // A muzzle flash is valid only while genuine Watch fire feedback remains.
  shooting:Boolean(action.shooting&&pose.shooting)};
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
 };
 if(field){
  // Stable painter's order: the player, enemies, and original collision
  // objects share one actual world-foot depth. No translucent fake cover.
  for(const item of omegaFieldDepthOrder(field.plan,state.hazards,p.y,field.progress)){
   if(item.kind==='prop'){
    const obstacle=field.plan.obstacles[item.index]!;
    drawOmegaFieldProp(ctx,field.plan,obstacle);
    drawOmegaM12StructureFacets(ctx,field.plan,obstacle,state.gameTime,m12Budget);
    drawOmegaG2NativeFacade(ctx,field.plan,obstacle,state.gameTime,m12G2Quality);
    drawOmegaG3NativeMesh(ctx,field.plan,obstacle,m12G3Budget);
   }
   else if(item.kind==='console')drawOmegaMissionDevice(ctx,field.plan,field.progress,item.index,state.gameTime);
   else if(item.kind==='extraction')drawOmegaExtractionUnit(ctx,field.plan.exit,field.progress.exitUnlocked,state.gameTime);
   else if(item.kind==='hazard')renderHazard(state.hazards[item.index]!);
   else renderHero();
  }
 }else{
  for(const h of state.hazards)renderHazard(h);
  renderHero();
 }
 // The native prop's depth can hide the hero: show only a subtle floor beacon.
 if(field)drawOmegaM12OcclusionBeacon(ctx,field.plan,p,state.gameTime);
 // Native projectiles and impacts always render above solid geometry.
 for(const projectile of state.projectiles){
  ctx.fillStyle='#7df3fa';ctx.beginPath();
  ctx.arc(projectile.x,projectile.y,Math.max(2,Math.min(9,projectile.radius)),0,Math.PI*2);
  ctx.fill();
 }
 drawOmegaImpactFx(ctx,impacts,state.gameTime);
 const slash=session.lastBladeStrike;
 if(slash && state.gameTime-slash.time>=0 && state.gameTime-slash.time<.22){
  // World-space hit confirmation on real blade timing. It is a technical
  // combat FX, NOT approved sword character animation artwork.
  const fade=1-(state.gameTime-slash.time)/.22;
  const angle=Math.atan2(slash.facingY,slash.facingX);
  ctx.save();ctx.translate(slash.x,slash.y);ctx.rotate(angle);
  ctx.strokeStyle=slash.hits>0?'rgba(255,222,255,.96)':'rgba(151,205,255,.65)';
  ctx.lineWidth=2+4*fade;ctx.shadowColor='#b86bff';
  ctx.shadowBlur=slash.hits>0?18:6;
  ctx.beginPath();ctx.arc(0,0,95,-.95,.95);ctx.stroke();
  ctx.strokeStyle='rgba(121,94,234,.68)';ctx.lineWidth=9*fade;
  ctx.beginPath();ctx.arc(0,0,81,-.92,.92);ctx.stroke();ctx.restore();
 }
 if(field){
  drawOmegaSectorOneAir(ctx,field.plan,state.gameTime,
   omegaSceneBudget(ctx.canvas.width,ctx.canvas.height));
  drawOmegaFieldMission(ctx,field.plan,field.progress,p,state.gameTime);
  drawOmegaG2BoundaryRail(ctx,field.plan,m12G2Quality);
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
 if(field)drawOmegaSectorOneGrade(ctx,field.plan,ctx.canvas.width,ctx.canvas.height);
 // Portrait camera follows the player: preserve off-screen enemy awareness
 // with a cheap, always-visible whole-arena radar in screen coordinates.
 const mw=Math.max(70,Math.min(118,ctx.canvas.width*.155));
 const mh=mw*WORLD_HEIGHT/WORLD_WIDTH;
 const pad=ctx.canvas.width<600?10:16;
 const mx=ctx.canvas.width-mw-pad;
 const my=ctx.canvas.height<400?58:90;
 ctx.save();
 ctx.fillStyle='rgba(10,20,35,.83)';
 ctx.fillRect(mx-5,my-20,mw+10,mh+25);
 ctx.strokeStyle='rgba(126,205,227,.6)';
 ctx.lineWidth=1;ctx.strokeRect(mx,my,mw,mh);
 ctx.font='bold 10px system-ui,sans-serif';
 ctx.fillStyle='#92dbe8';ctx.fillText('RADAR',mx,my-7);
 if(field){
  for(const [loc,shade] of [
   ...field.plan.event.steps.map((step,i)=>[step.target,
    i<field.progress.completedSteps?'#6bfaac':i===field.progress.completedSteps?'#87edff':'#578dae'] as const),
   [field.plan.exit,field.progress.exitUnlocked?'#90ffd4':'#ffb779'] as const,
  ]){
   ctx.fillStyle=shade;ctx.fillRect(mx+loc.x/WORLD_WIDTH*mw-2,my+loc.y/WORLD_HEIGHT*mh-2,5,5);
  }
 }
 for(const h of state.hazards.slice(0,32)){
  if(h.hp<=0)continue;
  const dotX=mx+Math.max(0,Math.min(1,h.x/WORLD_WIDTH))*mw;
  const dotY=my+Math.max(0,Math.min(1,h.y/WORLD_HEIGHT))*mh;
  ctx.beginPath();ctx.arc(dotX,dotY,h.isStageBoss?4:2.2,0,Math.PI*2);
  ctx.fillStyle=h.isStageBoss?'#ffe18e':'#fb94c6';ctx.fill();
 }
 ctx.beginPath();
 ctx.arc(mx+Math.max(0,Math.min(1,p.x/WORLD_WIDTH))*mw,
         my+Math.max(0,Math.min(1,p.y/WORLD_HEIGHT))*mh,3.2,0,Math.PI*2);
 ctx.fillStyle='#91fff0';ctx.fill();
 ctx.restore();
}
function makeOmegaFieldSession(seed:number):OmegaProtocolCombatSession{
 const qaMode=import.meta.env.DEV&&typeof window!=='undefined'
  ?new URLSearchParams(window.location.search).get('omegaQaState'):null;
 const actBoundary=(qaMode==='actBoundary6'?6:qaMode==='actBoundary9'?9:
  qaMode==='actBoundary12'?12:null);
 const gateWalk=qaMode==='gateTravel'||actBoundary!==null;
 // Historical single-snapshot QA shortcuts expect synchronous stage jumps;
 // preserve them ONLY in those explicit DEV modes. Ordinary M04 play and
 // gateTravel use the actual timed physical airlock transfer.
 const legacyStageSnapshot=['reward','boss','finalBoss','objective','exit'].includes(qaMode??'');
 const session=new OmegaProtocolCombatSession(seed,50,false,{
  fieldTraversal:true,gateTransition:!legacyStageSnapshot,qaGateTravel:gateWalk,
 });
 if(!import.meta.env.DEV)return session;
 if(actBoundary!==null){
  // M04-C: DEV-only preroll BEFORE the interactive browser opens.
  // This deliberately pre-resolves all earlier combat/objective requirements.
  // The ACT-boundary exit itself is subsequently completed only by real
  // browser movement and E/touch; never by this initial test fixture.
  const idle={moveX:0,moveY:0,triggerAction:false};
  for(let wave=1;wave<actBoundary;wave++){
   if(session.run.wave!==wave||session.field?.progress.phase!=='exit')
    throw new Error('M04-C initial QA expedition is not ready for preroll');
   const exit=session.field.plan.exit;
   session.engine.state.player.x=exit.x-45;
   session.engine.state.player.y=exit.y;
   if(!session.interact().success)throw new Error('M04-C QA setup cannot reach exit');
   for(let i=0;i<15;i++)session.update(.05,idle);
   if(session.run.phase==='reward')session.selectUpgrade(session.run.offers[0]!);
   for(let i=0;i<14;i++)session.update(.05,idle);
  }
  if(session.run.wave!==actBoundary||session.field?.progress.phase!=='exit')
   throw new Error('M04-C initial QA world did not reach target ACT seam');
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
 const [session,setSession]=useState(()=>makeOmegaFieldSession(20261108));
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
 const g5cArtReview=typeof window!=='undefined'&&omegaG5cLabRequested(
  window.location.search,import.meta.env.DEV||import.meta.env.VITE_OMEGA_PROTOCOL_LAB==='1');
 const [g5cStatus,setG5cStatus]=useState<'idle'|'loading'|'ready'|'failed'>('idle');
 const [g5cFeedback,setG5cFeedback]=useState('원본 4장 파일을 선택하면 해당 세션에서만 검수합니다.');
 const [g5cPreviewOn,setG5cPreviewOn]=useState(false);
 const silverPreviewRequested=typeof window!=='undefined'&&
  (omegaSilverPreviewEnabled(window.location.search)||g4SilverLab||g5ArtLab||g5bPainterlyReview||g5cArtReview);
 const [silverPreviewStatus,setSilverPreviewStatus]=useState<'off'|'loading'|'ready'|'failed'>(
  silverPreviewRequested?'loading':'off');
 const canvasRef=useRef<HTMLCanvasElement>(null);
 const arenaRef=useRef<HTMLDivElement>(null);
 const keysRef=useRef(new Set<string>());
 const mobileDir=useRef({x:0,y:0});
 const stickRef=useRef<HTMLButtonElement>(null);
 const stickThumbRef=useRef<HTMLSpanElement>(null);
 // Multiple finger presses keep their own direction until released.
 const pointerMoves=useRef(new Map<number,{x:number;y:number}>());
 const lastHudAt=useRef(0);
 const restart=useCallback(()=>{
  const n=Number(seedValue);
  const newSession=new OmegaProtocolCombatSession(Number.isFinite(n)?Math.trunc(n):0,50,false,{fieldTraversal:true});
  setSession(newSession);setSnapshot(newSession.snapshot);setPaused(false);
  keysRef.current.clear();pointerMoves.current.clear();mobileDir.current={x:0,y:0};
  if(stickThumbRef.current)stickThumbRef.current.style.transform='translate3d(0,0,0)';
 },[seedValue]);
 useEffect(()=>{
  if(!silverPreviewRequested){
   userApprovedAiraV2.setSilverReviewSources(null);
   return;
  }
  let mounted=true;
  let lease:OmegaSilverPreviewSession|null=null;
  ((g4SilverLab||g5ArtLab||g5bPainterlyReview||g5cArtReview)?omegaLoadSilverRepoReview():omegaLoadSilverPreview()).then(async session=>{
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
 },[silverPreviewRequested,g4SilverLab,g5ArtLab,g5VectorStudy,g5bPainterlyReview,g5cArtReview]);
 useEffect(()=>()=>{omegaG5cReview.dispose();},[]);
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
 useEffect(()=>{
  const onKeyDown=(e:KeyboardEvent)=>{
   if(e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement)return;
   if(validKeys.has(e.key)){keysRef.current.add(e.key);e.preventDefault();}
   if((e.code==='Space'||e.key==='Shift')&&!e.repeat){e.preventDefault();session.dash();}
   if(e.key.toLowerCase()==='q'&&!e.repeat){e.preventDefault();session.ultimate();}
   if(e.key.toLowerCase()==='f'&&!e.repeat){e.preventDefault();session.blade();setSnapshot(session.snapshot);}
   if(e.key.toLowerCase()==='e'&&!e.repeat){
    e.preventDefault();
    const outcome=session.interact();
    setInteractionMessage(outcome.success?(outcome.reason==='EXIT_OPENED'?'격리 통로 진입 · 구역 이동 중':outcome.reason==='STEP_COMPLETE'?'임무 단계 완료':'현장 이벤트 해결 완료'):(outcome.reason==='OUT_OF_RANGE'?'대상 지점에 더 가까이 이동하세요':'주변 위협을 먼저 제거하세요'));
    setSnapshot(session.snapshot);
   }
  };
  const onKeyUp=(e:KeyboardEvent)=>{
   if(validKeys.has(e.key)){keysRef.current.delete(e.key);e.preventDefault();}
  };
  const pauseOnBackground=()=>{
   keysRef.current.clear();pointerMoves.current.clear();mobileDir.current={x:0,y:0};
   if(stickThumbRef.current)stickThumbRef.current.style.transform='translate3d(0,0,0)';
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
   // A single scale on BOTH axes: avoids distorted characters when
   // the 1120px desktop GPU budget clamps only the horizontal dimension.
   const scale=Math.max(.1,Math.min(1.25,window.devicePixelRatio||1,1120/cssWidth,1200/cssHeight));
   const pixelWidth=Math.max(1,Math.round(cssWidth*scale));
   const pixelHeight=Math.max(1,Math.round(cssHeight*scale));
   if(canvas.width!==pixelWidth||canvas.height!==pixelHeight){
    canvas.width=pixelWidth;canvas.height=pixelHeight;
   }
  };
  scaleCanvas();
  window.addEventListener('keydown',onKeyDown);window.addEventListener('keyup',onKeyUp);
  window.addEventListener('blur',pauseOnBackground);
  window.addEventListener('resize',scaleCanvas);
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
  const facingController=new OmegaActorFacingController();
  const finishClock=new OmegaTerminalMotionClock();
  omegaPrepareAuthoredScene();
  userApprovedAiraV2.prepare();
  session.engine.drainProjectileFeedback();
  const frame=(now:number)=>{
   if(!alive)return;
   const dt=last?Math.min(.05,Math.max(0,(now-last)/1000)):0;last=now;
   const k=keysRef.current;
   const mx=(Number(k.has('d')||k.has('D')||k.has('ArrowRight'))-Number(k.has('a')||k.has('A')||k.has('ArrowLeft')))+mobileDir.current.x;
   const my=(Number(k.has('s')||k.has('S')||k.has('ArrowDown'))-Number(k.has('w')||k.has('W')||k.has('ArrowUp')))+mobileDir.current.y;
   const length=Math.hypot(mx,my)||1;
   if(dt>0)session.update(dt,{moveX:mx/length,moveY:my/length,triggerAction:true});
   const engineEvents=session.engine.drainProjectileFeedback();
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
   }
   fireCue=omegaAdvanceActorFireCue(fireCue,engineEvents,session.engine.state.gameTime);
   impacts=omegaAdvanceImpactFx(impacts,engineEvents,session.engine.state.gameTime);
   const player=session.engine.state.player;
   dashEchoes=omegaAdvanceDashEchoes(dashEchoes,player,priorPlayer,session.facing,
    Boolean(player.isDashing),session.engine.state.gameTime,
    session.run.phase==='battle'&&session.engine.state.phase==='playing');
   priorPlayer={x:player.x,y:player.y};
   // Sample after Watch movement and physical cover collision correction.
   // No actual displacement => do not animate a run cycle.
   const gait=gaitController.advance(
    player,session.engine.state.gameTime,session.plan.wave,
    Boolean(player.isDashing)||session.run.phase!=='battle');
   const pose=facingController.advance(
    session.engine.state.gameTime,session.facing,fireCue,{
     dashing:Boolean(player.isDashing),
     hurting:Boolean(session.engine.state.lastDamage&&session.engine.state.lastDamage.remaining>1.85),
     playing:session.engine.state.phase==='playing'&&session.run.phase==='battle',
    });
   const ctx=canvasRef.current?.getContext('2d');
   if(ctx){
    const bossLive=session.snapshot.bossHp!==null;
    const fieldPhase=session.field?.progress.phase;
    const focus:OmegaCameraFocus=bossLive?'boss':fieldPhase==='objective'||fieldPhase==='exit'
     ?'traversal':'battle';
    const target=omegaCameraTargetZoom(focus,ctx.canvas.width,ctx.canvas.height);
    // Continuous transition prevents a sudden snap when the last enemy dies.
    // Purely visual: Watch XY, movement and dash physics are unchanged.
    const easing=dt>0?1-Math.exp(-Math.min(dt,.05)*3.8):0;
    cinematicZoom+=(target-cinematicZoom)*easing;
    drawLab(ctx,session,fireCue,impacts,gait,pose,
     finishClock.advance(session.run.phase,now/1000),cinematicZoom,dashEchoes);
   }
   if(dt>0){fpsTotal+=dt;fpsCount++;}
   if(now-fpsAt>800&&fpsTotal>0){
    setFps(Math.round(fpsCount/fpsTotal));fpsTotal=0;fpsCount=0;fpsAt=now;
   }
   if(now-lastHudAt.current>130){lastHudAt.current=now;setSnapshot(session.snapshot);}
   request=requestAnimationFrame(frame);
  };
  request=requestAnimationFrame(frame);
  return ()=>{
   alive=false;cancelAnimationFrame(request);
   window.removeEventListener('keydown',onKeyDown);window.removeEventListener('keyup',onKeyUp);
   window.removeEventListener('blur',pauseOnBackground);
   window.removeEventListener('resize',scaleCanvas);
   document.removeEventListener('visibilitychange',onVisibility);
  };
 },[session]);
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
 const handleInteract=()=>{
  const outcome=session.interact();
  setInteractionMessage(outcome.success?(outcome.reason==='EXIT_OPENED'?'격리 통로 진입 · 구역 이동 중':outcome.reason==='STEP_COMPLETE'?'임무 단계 완료':'현장 이벤트 해결 완료'):(outcome.reason==='OUT_OF_RANGE'?'대상 지점에 더 가까이 이동하세요':'주변 위협을 먼저 제거하세요'));
  setSnapshot(session.snapshot);
 };
 const choose=(id:OmegaUpgradeId)=>{
  try{setSnapshot(session.selectUpgrade(id));setPaused(false);}
  catch(error){console.error('OMEGA internal reward choice rejected',error);}
 };
 const togglePause=()=>{
  if(session.run.phase!=='battle')return;
  if(paused)session.resume();
  else{
   session.pause();
   keysRef.current.clear();pointerMoves.current.clear();mobileDir.current={x:0,y:0};
   if(stickThumbRef.current)stickThumbRef.current.style.transform='translate3d(0,0,0)';
  }
  setPaused(!paused);setSnapshot(session.snapshot);
 };
 const dashFeedback=omegaDashAvailability(session.engine.state.player);
 const counterplay=omegaNearestCounterplayCue(
  omegaCounterplayCues(session.engine.state.hazards,id=>session.zombieBrain(id)),
  {x:snapshot.playerX,y:snapshot.playerY});
 const guide=snapshot.field?omegaFieldTargetGuide(
  snapshot.field.plan,snapshot.field.progress,{x:snapshot.playerX,y:snapshot.playerY},
 ):null;
 return <main className="omega-protocol-lab omega-protocol-v2"
  data-omega-protocol-internal="true"
  data-omega-aira-v2-ready={userApprovedAiraV2.hasAllDirections()?'true':'false'}
  data-omega-aira-v2-status="user-selected-8-direction-neutral-art"
  data-omega-silver-preview={silverPreviewStatus}
  data-omega-review-layout={silverPreviewRequested?'true':'false'}
  data-omega-m12g4-silver-review={g4SilverLab?'source-sha256-dev-only':'off'}
  data-omega-m12g5-lab={g5ArtLab?'source-verified-silver-originals':'off'}
  data-omega-m12g5-vector-study={g5VectorStudy?'isolated-unapproved':'off'}
  data-omega-m12g5b-art={g5bPainterlyReview?OMEGA_G5B_ART_APPROVAL.status:'off'}
  data-omega-m12g5c-art={g5cArtReview?OMEGA_G5C_ART_POLICY.status:'off'}
  data-omega-m12g5c-source-status={g5cArtReview?g5cStatus:'off'}
  data-omega-m12g5c-preview={g5cArtReview&&g5cPreviewOn?'session-only-not-approved':'off'}
  data-omega-real-extreme-clears={realUnlockStatus.extremeStagesCleared}
  data-omega-real-unlock-eligible={realUnlockStatus.canEnter?'yes':'no'}
  data-omega-session-unlock-source="dev-qa-fixture"
  data-omega-zombie-ai-qa={zombieAiQa?'native-watch-engine':'off'}
  data-omega-cart-qa={cartWarningQa?'real-native-watch-cart-dev-fixture':'off'}
  data-omega-gate-walk-qa={import.meta.env.DEV&&typeof window!=='undefined'&&
   ['gateTravel','actBoundary6','actBoundary9','actBoundary12'].includes(
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
  {silverPreviewRequested&&<aside className="omega-silver-review-bar" role="status">
    <strong>{g5cArtReview?'은백색 AIRA · 독립 E 걷기 원화 4장 실게임 검수':g5bPainterlyReview?'은백색 AIRA 원본 유지 · 신규 4장 제작·승인 대기':g5VectorStudy?'AIRA E·감염체 원화 6장 비교 · 시각 품질 미합격':g5ArtLab?'은백색 AIRA 원본 유지 · 원화 비교 별도':g4SilverLab?'은백색 AIRA · 원본 8방향 게임 검수':'은백색 AIRA · 로컬 원화 시험'}</strong>
    <span>{silverPreviewStatus==='ready'
     ?(g5cArtReview?'원본 8방향 고정 · 외부 API 없음 · 160원화/320마스크 미승인':g5bPainterlyReview?'원본 8방향 검증 · 독립 페인터리 E 4장 미제작 · 기존 캐릭터 유지':g5VectorStudy?'비교용 별도 동작 6장 · 기존 AIRA 대비 그래픽 저하로 미승인 · 전체160/320 미완':g5ArtLab?'원본 8방향 검증·기존 주인공 원화 유지·독립 동작 원화 검수 별도':'원화 8개 SHA-256 확인 · 실제 Watch 엔진 화면에 표시 · 160프레임 및 마스크 미완')
     :silverPreviewStatus==='loading'?'로컬 원화 무결성 확인 중'
     :'연결 실패 · 기존 캐릭터 유지 · 검수실에서 원화 8개를 먼저 등록하세요'}</span>
    <a href="/omega-canonical-art-review/index.html">원화 검수실</a>
    {g5cArtReview&&<div className="omega-g5c-art-controls" data-omega-g5c-controls="true">
     <label htmlFor="omega-g5c-files">E 걷기 원화 4장 선택</label>
     <input id="omega-g5c-files" type="file" accept="image/webp,.webp" multiple
      aria-label="동쪽 걷기 원화 WebP 4장 불러오기"
      onChange={e=>{void importG5cFiles(e.currentTarget.files);e.currentTarget.value='';}} />
     <button type="button" data-omega-g5c-toggle="true"
      disabled={g5cStatus!=='ready'||silverPreviewStatus!=='ready'}
      onClick={()=>{const enabled=omegaG5cReview.activate(!g5cPreviewOn);setG5cPreviewOn(enabled);}}
     >{g5cPreviewOn?'기존 원본 복귀':'실전 걷기 비교'}</button>
     <span data-omega-g5c-feedback={g5cStatus} title={g5cFeedback}>{g5cFeedback}</span>
    </div>}
   </aside>}
  <section className="omega-protocol-stage" aria-label="OMEGA PROTOCOL 내부 전투 시험">
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
    <canvas ref={canvasRef} width={1120} height={720} aria-label="실제 시그널 워치 전투 엔진을 사용하는 OMEGA PROTOCOL 내부 전장" />
    <div className="omega-protocol-stage-shade" aria-hidden="true"/>
    <div className="omega-protocol-stats" aria-label="전투 상태">
     <div className="omega-protocol-wave">
      <small>{OMEGA_STORY_ACTS[snapshot.plan.sector-1]?.title??'OMEGA'} · MAP {snapshot.plan.sector.toString().padStart(2,'0')} / 05</small>
      <strong>ROUTE {Math.min(OMEGA_PROTOCOL_TOTAL_WAVES,snapshot.run.wave).toString().padStart(2,'0')} <span>/ 15</span></strong>
     </div>
     <div className="omega-protocol-hp">
      <span><b>HP</b> {Math.ceil(snapshot.playerHp)} / {snapshot.run.maxHp}</span>
      <div role="meter" aria-label="남은 체력" aria-valuemin={0} aria-valuemax={snapshot.run.maxHp} aria-valuenow={Math.max(0,Math.ceil(snapshot.playerHp))}>
       <i style={{width:(Math.max(0,Math.min(1,snapshot.playerHp/Math.max(1,snapshot.run.maxHp)))*100)+'%'}} />
      </div>
     </div>
     <div className="omega-protocol-threat"><small>THREATS</small><strong>{snapshot.enemiesAlive.toString().padStart(2,'0')}</strong></div>
     <div className="omega-protocol-modifier"><small>ENVIRONMENT</small><strong>{({standard:'표준',crosswind:'횡풍',low_visibility:'시야 제한',unstable_ground:'불안정 지반'} as const)[snapshot.plan.modifier]}</strong></div>
    </div>
    {snapshot.field&&<div className="omega-protocol-mission" role="status">
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
       onClick={()=>{session.blade();setSnapshot(session.snapshot);}}
       disabled={snapshot.run.phase!=='battle'||snapshot.enginePhase!=='playing'||snapshot.bladeCooldownRemaining>0}
       aria-label="공진 검격 · F 키 · 안전모 감염 좀비 및 기계형 적 3단 연속 공격">
       <span className="omega-protocol-action-glyph" aria-hidden="true">⚔</span><span>검격</span>
       <small>{snapshot.bladeCooldownRemaining>0?snapshot.bladeCooldownRemaining.toFixed(1)+'s': 'READY'}</small>
      </button>
      <button type="button" className="omega-protocol-action omega-protocol-interact" onClick={handleInteract}
       disabled={snapshot.run.phase!=='battle'||paused||snapshot.enemiesAlive>0}
       aria-label="현장 상호작용 E">
       <span className="omega-protocol-action-glyph" aria-hidden="true">E</span><span>조작</span>
      </button>
      <button type="button" className="omega-protocol-action omega-protocol-dash" onClick={()=>{session.dash();setSnapshot(session.snapshot);}}
       disabled={snapshot.run.phase!=='battle'||snapshot.enginePhase!=='playing'||(session.engine.state.player.dashCooldown??0)>0}
       aria-label="회피 · 스페이스 또는 시프트">
       <span className="omega-protocol-action-glyph" aria-hidden="true">↗</span><span>회피</span><small>{dashFeedback.ready?"READY":dashFeedback.remaining>0?dashFeedback.remaining.toFixed(1)+"s":"ACTIVE"}</small>
      </button>
      <button type="button" className="omega-protocol-action omega-protocol-ultimate" onClick={()=>{session.ultimate();setSnapshot(session.snapshot);}}
       disabled={snapshot.run.phase!=='battle'||snapshot.enginePhase!=='playing'||session.engine.state.ultimateCharge<session.engine.state.maxUltimateCharge}
       aria-label={'궁극기 · 충전 '+Math.floor(100*session.engine.state.ultimateCharge/Math.max(1,session.engine.state.maxUltimateCharge))+'퍼센트'}>
       <span className="omega-protocol-action-glyph" aria-hidden="true">✦</span><span>궁극기</span>
       <small>{Math.floor(100*session.engine.state.ultimateCharge/Math.max(1,session.engine.state.maxUltimateCharge))}%</small>
      </button>
     </div>
    </div>
    <div className="omega-protocol-stage-meta" aria-hidden="true"><span>WASD · 이동</span><span>SPACE · 회피</span><span>F · 검격</span><span>Q · 궁극기</span><span>E · 조작</span><span>CPU QA · {fps||'—'} FPS</span></div>
    {snapshot.gateTransit&&<div className="omega-protocol-gate-transit"
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
    {paused&&snapshot.run.phase==='battle'&&<div className="omega-protocol-paused" role="status"><strong>작전 일시정지</strong><span>아래 계속하기를 눌러 진행하세요.</span></div>}
    {snapshot.run.phase==='reward'&&<div
      className="omega-protocol-overlay omega-protocol-reward-overlay omega-protocol-safe-room"
      role="presentation" data-omega-reward-context="in-world-safe-room"
      data-omega-reward-next-wave={snapshot.run.wave}>
      <section className="omega-protocol-rewards" role="dialog" aria-modal="true"
       aria-label="연결 통로 전술 보급 · 다음 구역 탐험 준비">
       <div className="omega-protocol-safe-room-head">
        <span className="omega-protocol-modal-kicker">OMEGA · FIELD SUPPLY / SAFE PASSAGE</span>
        <small>현재 {snapshot.field?.plan.sectorName??'격리 통로'} · 통로는 유지됩니다</small>
        <h2>전술 보급 지점</h2>
        <p>다음 목적지: {omegaStoryNode(snapshot.run.wave).district} · {omegaStoryNode(snapshot.run.wave).title}</p>
        <span className="omega-protocol-safe-room-live">전투 일시 중지 · 강화 선택 후 바로 탐험 재개</span>
       </div>
       <div className="omega-protocol-reward-cards">{snapshot.run.offers.map((id,i)=>{const u=OMEGA_UPGRADES.find(e=>e.id===id)!;return <button key={id} type="button" onClick={()=>choose(id)}
         aria-label={'전술 보급 '+(i+1)+'번 · '+u.label+' · '+u.description}>
         <small className="omega-protocol-card-index">0{i+1} · {u.role.toUpperCase()}</small>
         <strong>{u.label}</strong><span>{u.description}</span>
         <small className="omega-protocol-card-rank">LV {(snapshot.run.owned[id]??0)+1} / {u.maxStacks}</small>
       </button>;})}</div>
      </section>
    </div>}
    {(snapshot.run.phase==='defeat'||snapshot.run.phase==='victory')&&<div className="omega-protocol-overlay">
      <section className="omega-protocol-end" role="status">
       <span className="omega-protocol-modal-kicker">{snapshot.run.phase==='victory'?'MISSION COMPLETED':'OPERATION TERMINATED'}</span>
       <h2>{snapshot.run.phase==='victory'?'작전 완료':'작전 실패'}</h2>
       <p>통과한 작전 구역 {snapshot.run.victories}/15 · 임시 강화는 재도전 시 초기화됩니다.</p>
       <button type="button" onClick={restart}>다시 출격</button>
      </section>
    </div>}
   </div>
  </section>
  <footer className="omega-protocol-bottom-toolbar">
   <div className="omega-protocol-run-tools">
    <button type="button" className="omega-protocol-control-switch"
     aria-pressed={classicPad}
     aria-label={classicPad?'아날로그 스틱으로 전환':'방향키 모드로 전환'}
     onClick={()=>{
      setClassicPad(mode=>!mode);
      pointerMoves.current.clear();mobileDir.current={x:0,y:0};
      if(stickThumbRef.current)stickThumbRef.current.style.transform='translate3d(0,0,0)';
     }}>{classicPad?'스틱':'방향키'}</button>
    <label>SEED <input inputMode="numeric" aria-label="재현용 시드" value={seedValue} onChange={e=>setSeedValue(e.target.value)} /></label>
    <button type="button" onClick={togglePause} disabled={snapshot.run.phase!=='battle'}>{paused?'계속하기':'일시정지'}</button>
    <button type="button" onClick={restart}>새 도전</button>
    <button type="button" onClick={()=>{session.abandon();setSnapshot(session.snapshot);}} disabled={snapshot.run.phase==='defeat'||snapshot.run.phase==='victory'}>도전 포기</button>
   </div>
   <p className="omega-protocol-warning">미출시 내부 시험 · 시험용 50/50 진입 · 실제 해금 {realUnlockStatus.canEnter?'달성':'미달성'} ({realUnlockStatus.extremeStagesCleared}/50) · 원화 미승인</p>
  </footer>
 </main>;
}

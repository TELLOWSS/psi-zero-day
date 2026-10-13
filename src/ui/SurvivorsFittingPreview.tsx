import labCopy from '../../content/localization/survivors-equipment-lab-ko.json';
import {drawSafetyDrones} from './survivors-drone-render';
import {drawEquipmentAura} from './survivors-equipment-aura';
import {SurvivorsEngine} from '../engine/patrol-survivors-engine';
import type {PerkId} from '../domain/patrol-survivors';
import {drawProjectileVfx} from './survivors-projectile-vfx';
import {ProjectileFeedbackLayer} from './survivors-projectile-feedback';
import {drawIndustrialHazard,INDUSTRIAL_HAZARD_ART} from './survivors-industrial-art';
import {cinematicLook} from './survivors-cinematic-vfx';
import { useEffect, useRef, useState, useMemo } from 'react';
import type { SurvivorsGameState } from '../domain/patrol-survivors';
import { CHARACTER_PROFILES } from '../engine/patrol-survivors-engine';
import { drawPremiumGear, PREMIUM_MOUNTED_ART } from './survivors-premium-render';
import { CHARACTER_MAP_ART } from './survivors-character-art';
import {loadAuthoredCommand} from './survivors-authored-command';
import { EQUIPMENT_ART, EVOLUTION_ART, TACTICAL_EQUIPMENT_ART, PICKUP_ART, registerPropAtlas, registerEvolutionAtlas, registerTacticalEquipmentAtlas } from './survivors-equipment-art';
import { drawGroundedSprite, registerSpriteBounds } from './survivors-sprite-motion';
import copy from '../../content/localization/survivors-store-ko.json';
import { drawWearableLayer, loadWearableImages,type WearableImages } from './survivors-wearable-art';
import {CINEMATIC_VFX_ATLAS} from './survivors-cinematic-vfx';
import {drawEquipmentMantle} from './survivors-equipment-identity';
import {loadDirectionalActor,isDirectionalActor} from './survivors-directional-art';
import {preparePremiumPresence,type PremiumPresenceImages} from './survivors-equipment-animation';
import {drawPremiumPresence} from './survivors-premium-presence';
import {applyActorTorsoTransform} from './survivors-rig-renderer';
import {drawCarriedEquipment} from './survivors-carried-equipment';
import {ACTOR_RIGS} from './survivors-animation-rig';
import {fittingPose,type FittingMotion} from './survivors-fitting-pose';
import {attackEnvelope,attackProgress,projectileAttackMotion,type AttackMotion} from './survivors-attack-motion';

export function SurvivorsFittingPreview({ state, facing = 1, zoom = 1,motion='idle',playing=true,active=true,attackKind='shot',equipment,stepToken=0,defenseToken=0 }: { state: SurvivorsGameState; facing?:1|-1; zoom?:number;motion?:FittingMotion;playing?:boolean;active?:boolean;attackKind?:AttackMotion;equipment?:{id:PerkId;level:number};stepToken?:number;defenseToken?:number }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [assets,setAssets]=useState<{characterId:SurvivorsGameState['characterId'];actor:HTMLImageElement;directionalActor:HTMLImageElement;gear:HTMLImageElement;pickups:HTMLImageElement;wearables:WearableImages;cinematic:HTMLImageElement;premium:HTMLImageElement;ground:HTMLImageElement;industrial:HTMLImageElement;presence?:PremiumPresenceImages}>();
  const [reduced,setReduced]=useState(false);
  const clock=useRef(0);const lastStep=useRef(0);const lastDefense=useRef(0);const cue=useRef<{at:number;kind:AttackMotion}>({at:-Infinity,kind:'shot'});
  const simulation=useMemo(()=>equipment?SurvivorsEngine.equipmentPreview(state,equipment.id,equipment.level):undefined,[state,equipment?.id,equipment?.level]);
  const feedback=useMemo(()=>new ProjectileFeedbackLayer(),[simulation]);
  const seenKinds=useMemo(()=>new Set<string>(),[simulation]);
  useEffect(()=>{clock.current=0;cue.current={at:-Infinity,kind:'shot'};if(canvas.current)canvas.current.dataset.projectileKinds='';},[simulation]);
  useEffect(()=>{if(motion==='action'||motion==='check')clock.current=0;},[motion,attackKind]);
  useEffect(()=>{
    const media=window.matchMedia?.('(prefers-reduced-motion: reduce)');if(!media)return;
    const change=()=>setReduced(media.matches);change();media.addEventListener('change',change);
    return ()=>media.removeEventListener('change',change);
  },[]);
  useEffect(() => {
    let disposed = false;
    setFailed(false); setLoaded(false);
    setAssets(undefined);clock.current=0;
    const load = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = src;
    });
    Promise.all([load(CHARACTER_MAP_ART[state.characterId]), load(EQUIPMENT_ART), load(PICKUP_ART), loadWearableImages(state.characterId),load(CINEMATIC_VFX_ATLAS),load('/assets/survivors/premium-presence-v1.png').catch(()=>undefined),load(EVOLUTION_ART),load(PREMIUM_MOUNTED_ART),load(TACTICAL_EQUIPMENT_ART),load('/assets/survivors/industrial-ground-v3.webp'),load(INDUSTRIAL_HAZARD_ART)])
      .then(async ([actor, gear, pickups, wearables, cinematic, presenceImage, evolution, premium, tactical,ground,industrial]) => {
        if (disposed) return;
        registerPropAtlas(gear, 3, 5); registerPropAtlas(pickups, 4, 2);
        registerEvolutionAtlas(gear,evolution);
        registerTacticalEquipmentAtlas(gear,tactical);
        registerPropAtlas(premium,4,4);registerPropAtlas(industrial,3,2);
        // Prepare one authored body before any pose switch; idle and combat share its joints.
        registerSpriteBounds(actor);
        const directionalActor=await load(CHARACTER_MAP_ART[state.characterId]);
        if(disposed)return;
        if(!await loadDirectionalActor(directionalActor)){registerSpriteBounds(directionalActor);await loadAuthoredCommand(directionalActor);}if(disposed)return;
        const presence=presenceImage?preparePremiumPresence(presenceImage):undefined;
        setAssets({characterId:state.characterId,actor,directionalActor,gear,pickups,wearables,cinematic,presence,premium,ground,industrial});
      }).catch(() => { if (!disposed) setFailed(true); });
    return () => { disposed = true; };
  }, [state.characterId]);
  useEffect(()=>{
    const ctx=canvas.current?.getContext('2d');if(!ctx||!assets||assets.characterId!==state.characterId)return;
    const {gear,pickups,wearables,cinematic,presence,premium,ground,industrial}=assets;
    const actor=assets.directionalActor;

    const simulated=simulation?.state??state;
    const previewState={...simulated,player:{...simulated.player,x:0,y:0}};
    let request=0,last:number|undefined,paintAt=-Infinity;
    const draw=()=>{
        if(canvas.current){canvas.current.dataset.previewClock=String(clock.current);canvas.current.dataset.previewMotion=motion;canvas.current.dataset.previewActionEffects='false';}
        previewState.gameTime=reduced?0:clock.current;
        previewState.playerMotionTime=previewState.gameTime;
        const width=equipment?600:360;ctx.setTransform(2,0,0,2,0,0);ctx.clearRect(0,0,width,360);
        ctx.drawImage(ground,0,0,width,360);ctx.fillStyle='rgba(5,17,21,.38)';ctx.fillRect(0,0,width,360);
        if(simulation){ctx.save();ctx.translate(170,260);ctx.scale(1.25,1.25);ctx.translate(-700,-450);
          drawEquipmentAura(ctx,simulation.state,reduced);drawSafetyDrones(ctx,simulation.state,gear,pickups,cinematic,reduced);for(const h of simulation.state.hazards){ctx.save();ctx.translate(h.x,h.y);drawIndustrialHazard(ctx,industrial,h,fittingPose(0,'idle',-1,true),'site',simulation.state.stage.theme,clock.current,reduced,0);ctx.fillStyle='#152929';ctx.fillRect(-22,7,44,3);ctx.fillStyle='#84dcb5';ctx.fillRect(-22,7,44*Math.max(0,h.hp/h.maxHp),3);ctx.restore();}
          for(const p of simulation.state.projectiles)drawProjectileVfx(ctx,p,equipment!.level,clock.current,reduced,false,{atlas:cinematic,look:cinematicLook(p.kind,equipment!.level,state.premiumGear?.equipped??[])});
          feedback.draw(ctx,reduced,false,{atlas:cinematic,equipped:state.premiumGear?.equipped??[]});ctx.restore();}
        if(!isDirectionalActor(actor)){ctx.fillStyle='rgba(2,7,10,.32)';ctx.beginPath();ctx.ellipse(equipment?170:180,equipment?264:334,equipment?42:75,equipment?10:16,0,0,Math.PI*2);ctx.fill();}
        const scale=equipment?2.35:Math.min(4,3.65*Math.max(.8,Math.min(1.25,zoom)));
        ctx.save(); ctx.translate(equipment?170:180,equipment?260:330); ctx.scale(scale, scale);
        const elapsed=clock.current-cue.current.at;
        const basePose=fittingPose(clock.current,motion,facing,reduced,attackKind);
        const pose={...basePose,...(equipment?{actionKind:cue.current.kind,action:reduced?0:attackEnvelope(elapsed,cue.current.kind),actionProgress:reduced?0:attackProgress(elapsed,cue.current.kind)}:{}),directional:isDirectionalActor(actor),entity:previewState.player,worldX:basePose.moving?clock.current*120*facing:0,worldY:0,clock:clock.current};
        ctx.save();applyActorTorsoTransform(ctx,pose,74,Boolean(ACTOR_RIGS[actor.src.split('/').pop()??'']));
        if(pose.action>.05)drawPremiumPresence(ctx,presence,previewState.premiumGear?.equipped??[],previewState.gameTime,reduced,false,pose.action);ctx.restore();
        drawWearableLayer(ctx, previewState, actor, 74, pose, wearables, 'back',reduced);
        drawGroundedSprite(ctx,actor,74,pose);
        drawWearableLayer(ctx, previewState, actor, 74, pose, wearables, 'front',reduced);
        drawCarriedEquipment(ctx,previewState,actor,74,pose,gear,pickups,reduced,Boolean(wearables.communication),Boolean(wearables.normalWorn));
        drawPremiumGear(ctx,previewState,gear,reduced,0,pickups,wearables,{actor,height:74,pose,vfxAtlas:cinematic,premiumAtlas:premium,quiet:true});
        const angle=pose.moving?(facing===1?0:Math.PI):undefined;
        if(pose.action>.05){drawEquipmentMantle(ctx,previewState,cinematic,reduced,false,angle,pose.action,{pose,height:74,rigged:Boolean(ACTOR_RIGS[actor.src.split('/').pop()??''])});if(canvas.current)canvas.current.dataset.previewActionEffects=String(!reduced&&Boolean(previewState.premiumGear?.equipped.length));}
        ctx.restore();
        if(simulation){ctx.fillStyle='rgba(6,20,24,.8)';ctx.fillRect(0,0,width,26);ctx.fillStyle='#d1f1e7';ctx.font='12px sans-serif';ctx.fillText(`${labCopy.hp} ${Math.ceil(simulation.state.player.hp)}/${simulation.state.player.maxHp} · ${labCopy.shield} ${Math.ceil(simulation.state.premiumGear?.shield??0)}`,12,18);}
    };
    const advance=(dt:number)=>{clock.current+=dt;simulation?.advanceEquipmentPreview(dt);feedback.advance(dt);const events=simulation?.drainProjectileFeedback()??[];feedback.ingest(events,false,state.premiumGear?.equipped??[]);const launch=events.find(e=>e.phase==='launch'&&projectileAttackMotion(e.kind));if(launch)cue.current={at:clock.current,kind:projectileAttackMotion(launch.kind)!};for(const e of events)seenKinds.add(e.kind);if(canvas.current){canvas.current.dataset.projectileKinds=[...seenKinds].join(',');canvas.current.dataset.targetDamaged=String(simulation?.state.hazards.some(h=>h.hp<h.maxHp)||Boolean(simulation?.state.hazardsNeutralized));}};
    if(simulation&&defenseToken!==lastDefense.current){simulation.previewEquipmentDefense();lastDefense.current=defenseToken;}
    if(simulation&&(stepToken!==lastStep.current||reduced&&simulation.state.gameTime===0)){for(let i=0;i<12;i++)advance(1/60);lastStep.current=stepToken;}
    const tick=(now:number)=>{
      if(last!==undefined){const dt=Math.min(.05,Math.max(0,(now-last)/1000));advance(dt);}last=now;
      if(now-paintAt>=1000/30){draw();paintAt=now;}
      request=requestAnimationFrame(tick);
    };
    const visibility=()=>{cancelAnimationFrame(request);last=undefined;if(active&&playing&&!reduced&&!document.hidden)request=requestAnimationFrame(tick);};
    draw();setLoaded(true);visibility();document.addEventListener('visibilitychange',visibility);
    return ()=>{cancelAnimationFrame(request);document.removeEventListener('visibilitychange',visibility);};
  },[assets,state,facing,zoom,motion,playing,active,reduced,attackKind,equipment?.id,equipment?.level,simulation,feedback,seenKinds,stepToken,defenseToken]);
  return <figure className={`survivors-fitting-art ${equipment?'is-effect-test':''}`}>
    <canvas ref={canvas} data-character-id={state.characterId} data-equipment-id={equipment?.id} width={equipment?1200:720} height={720} role="img" aria-label={`${CHARACTER_PROFILES[state.characterId].name} ${copy.fitting}`}/>
    {!loaded && <figcaption role="status">{failed ? copy.fittingFailure : copy.fittingLoading}</figcaption>}
  </figure>;
}

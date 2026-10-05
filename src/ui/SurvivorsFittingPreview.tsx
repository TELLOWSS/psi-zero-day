import { useEffect, useRef, useState } from 'react';
import type { SurvivorsGameState } from '../domain/patrol-survivors';
import { CHARACTER_PROFILES } from '../engine/patrol-survivors-engine';
import { drawPremiumGear } from './survivors-premium-render';
import { CHARACTER_MAP_ART } from './survivors-character-art';
import { EQUIPMENT_ART, PICKUP_ART, registerPropAtlas } from './survivors-equipment-art';
import { drawGroundedSprite, registerSpriteBounds } from './survivors-sprite-motion';
import copy from '../../content/localization/survivors-store-ko.json';
import { drawWearableLayer, loadWearableImages,type WearableImages } from './survivors-wearable-art';
import {CINEMATIC_VFX_ATLAS} from './survivors-cinematic-vfx';
import {drawEquipmentIdentity,drawEvolutionIdentity,drawEquipmentMantle} from './survivors-equipment-identity';
import {drawCarriedEquipment} from './survivors-carried-equipment';
import {ACTOR_RIGS} from './survivors-animation-rig';
import {fittingPose,type FittingMotion} from './survivors-fitting-pose';

export function SurvivorsFittingPreview({ state, facing = 1, zoom = 1,motion='idle',playing=true,active=true }: { state: SurvivorsGameState; facing?:1|-1; zoom?:number;motion?:FittingMotion;playing?:boolean;active?:boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [assets,setAssets]=useState<{actor:HTMLImageElement;gear:HTMLImageElement;pickups:HTMLImageElement;wearables:WearableImages;cinematic:HTMLImageElement}>();
  const [reduced,setReduced]=useState(false);
  const clock=useRef(0);
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
    Promise.all([load(CHARACTER_MAP_ART[state.characterId]), load(EQUIPMENT_ART), load(PICKUP_ART), loadWearableImages(state.characterId),load(CINEMATIC_VFX_ATLAS)])
      .then(([actor, gear, pickups, wearables, cinematic]) => {
        if (disposed) return;
        registerSpriteBounds(actor); registerPropAtlas(gear, 3, 5); registerPropAtlas(pickups, 4, 2);
        setAssets({actor,gear,pickups,wearables,cinematic});
      }).catch(() => { if (!disposed) setFailed(true); });
    return () => { disposed = true; };
  }, [state.characterId]);
  useEffect(()=>{
    const ctx=canvas.current?.getContext('2d');if(!ctx||!assets)return;
    const {actor,gear,pickups,wearables,cinematic}=assets;
    const previewState={...state,player:{...state.player,x:0,y:0}};
    let request=0,last:number|undefined,paintAt=-Infinity;
    const draw=()=>{
        previewState.gameTime=reduced?0:clock.current;
        ctx.clearRect(0, 0, 360, 360);
        const scale=Math.min(3.4,3*Math.max(.8,Math.min(1.25,zoom)));
        ctx.save(); ctx.translate(180, 360-28*scale); ctx.scale(scale, scale);
        const pose=fittingPose(clock.current,motion,facing,reduced);
        drawWearableLayer(ctx, previewState, actor, 74, pose, wearables, 'back');
        drawGroundedSprite(ctx, actor, 74, pose);
        drawWearableLayer(ctx, previewState, actor, 74, pose, wearables, 'front');
        drawCarriedEquipment(ctx,previewState,actor,74,pose,gear,pickups,reduced);
        drawPremiumGear(ctx,previewState,gear,reduced,0,pickups,wearables,{actor,height:74,pose,vfxAtlas:cinematic});
        const angle=pose.moving?(facing===1?0:Math.PI):undefined;
        drawEquipmentIdentity(ctx,previewState,cinematic,reduced,false,angle);drawEvolutionIdentity(ctx,previewState,cinematic,reduced);
        drawEquipmentMantle(ctx,previewState,cinematic,reduced,false,angle,pose.action,{pose,height:74,rigged:Boolean(ACTOR_RIGS[actor.src.split('/').pop()??''])});
        ctx.restore();
    };
    const tick=(now:number)=>{
      if(last!==undefined)clock.current+=Math.min(.1,Math.max(0,(now-last)/1000));last=now;
      if(now-paintAt>=1000/30){draw();paintAt=now;}
      request=requestAnimationFrame(tick);
    };
    const visibility=()=>{cancelAnimationFrame(request);last=undefined;if(active&&playing&&!reduced&&!document.hidden)request=requestAnimationFrame(tick);};
    draw();setLoaded(true);visibility();document.addEventListener('visibilitychange',visibility);
    return ()=>{cancelAnimationFrame(request);document.removeEventListener('visibilitychange',visibility);};
  },[assets,state,facing,zoom,motion,playing,active,reduced]);
  return <figure className="survivors-fitting-art">
    <canvas ref={canvas} width={360} height={360} role="img" aria-label={`${CHARACTER_PROFILES[state.characterId].name} ${copy.fitting}`}/>
    {!loaded && <figcaption role="status">{failed ? copy.fittingFailure : copy.fittingLoading}</figcaption>}
  </figure>;
}

import type {SurvivorsGameState} from '../domain/patrol-survivors';
import {STORE_ITEMS} from '../domain/survivors-store';
import {drawEquipment,drawProp} from './survivors-equipment-art';
import {hasWearable,inspectionDockAnchor,premiumBodySocket,drawActorEquipmentOcclusion,type WearableImages} from './survivors-wearable-art';
import {applyActorTorsoTransform} from './survivors-rig-renderer';
import {ACTOR_RIGS} from './survivors-animation-rig';
import {EQUIPMENT_AURAS} from './survivors-equipment-identity';
import {drawVfxCell} from './survivors-cinematic-vfx';
import {InspectionFlightTracker,type InspectionPhase} from './survivors-inspection-flight';
import type {SpritePose} from './survivors-sprite-motion';
import {premiumHazardSpeed} from '../engine/survivors-premium-gear';
const inspectionFlights=new InspectionFlightTracker();
/** Raster art stays in presentation; status is read exclusively from the engine. */
export function drawPremiumGear(ctx:CanvasRenderingContext2D,state:SurvivorsGameState,atlas:HTMLImageElement|undefined,reducedMotion:boolean,_facing=0,itemsAtlas?:HTMLImageElement,wearables:WearableImages={},actorPose?:{actor:HTMLImageElement;height:number;pose:SpritePose;vfxAtlas?:HTMLImageElement}):InspectionPhase|undefined {
  const gear=state.premiumGear;if(!gear||!gear.equipped.length)return;
  const {x,y}=state.player;
  const fittedInspection=gear.equipped.includes('inspection_wing')&&hasWearable(state,'inspection_wing',wearables);
  const dock=actorPose?inspectionDockAnchor(state.characterId,actorPose.actor,actorPose.height,actorPose.pose):undefined;
  const flight=fittedInspection&&dock?inspectionFlights.sample(state,dock,reducedMotion):undefined;
  if(gear.effects.shield>0) {
    ctx.save();ctx.translate(x,y-37);ctx.strokeStyle=gear.shield>0?'#7fe7ff':'#637e89';
    ctx.globalAlpha=gear.shield>0?.55:.22;ctx.lineWidth=gear.feedback>0?4:1.5;
    ctx.beginPath();ctx.ellipse(0,0,22,38,0,-Math.PI/2,-Math.PI/2+Math.PI*2*(gear.shield/gear.effects.shield));ctx.stroke();
    if(gear.feedback>0){ctx.globalAlpha=gear.feedback*.35;ctx.fillStyle='#82eaff';ctx.beginPath();ctx.ellipse(0,0,24,39,0,0,Math.PI*2);ctx.fill();}
    ctx.restore();
  }
  const suppressed=state.hazards.filter(h=>h.hp>0&&premiumHazardSpeed(state,h)<1);
  if(suppressed.length) {
    ctx.save();ctx.strokeStyle='#66dcd4';ctx.globalAlpha=.16;ctx.lineWidth=1;ctx.setLineDash([6,10]);
    ctx.beginPath();ctx.arc(x,y,180,0,Math.PI*2);ctx.stroke();ctx.restore();
    for(const hazard of suppressed){
      ctx.save();ctx.strokeStyle='#66dcd4';ctx.globalAlpha=.45;ctx.lineWidth=1.2;
      ctx.beginPath();ctx.moveTo(x+(flight?.x??0),y+(flight?.y??-24));ctx.lineTo(hazard.x,hazard.y-10);ctx.stroke();
      ctx.beginPath();ctx.ellipse(hazard.x,hazard.y,hazard.radius+5,(hazard.radius+5)*.58,0,0,Math.PI*2);ctx.stroke();ctx.restore();
    }
  }
  if(gear.effects.pickup>0){
    ctx.save();ctx.strokeStyle='#b7ebae';ctx.globalAlpha=.4;ctx.lineWidth=1;
    for(const drop of state.drops.slice(0,48)){
      if(Math.hypot(drop.x-x,drop.y-y)>state.player.pickupRadius)continue;
      ctx.beginPath();ctx.moveTo(drop.x,drop.y);ctx.lineTo(x,y-14);ctx.stroke();
    }ctx.restore();
  }
  if(!atlas?.naturalWidth)return;
  const draw=(id:string,px:number,py:number,size:number)=>{
    const item=STORE_ITEMS.find(item=>item.id===id);if(!item)return;
    const level=item.rarity==='legendary'?5:item.rarity==='elite'?3:1;
    if(item.category==='communication')drawEquipment(ctx,atlas,'radio_boost',level,px,py+size/2,size,itemsAtlas);
    else if(item.category==='companion')drawEquipment(ctx,atlas,'safety_drone',level,px,py+size/2,size,itemsAtlas);
    else if(item.category==='protection'){
      ctx.save();ctx.strokeStyle='#9ef5d0';ctx.lineWidth=1.5;ctx.globalAlpha=.6;
      ctx.beginPath();ctx.ellipse(px,py,8,13,0,0,Math.PI*2);ctx.stroke();ctx.restore();
    } else drawProp(ctx,itemsAtlas,item.category==='tempo'?3:item.category==='logistics'?2:4,px,py+size/2,size);
  };
  const companion=gear.equipped.find(id=>STORE_ITEMS.find(item=>item.id===id)?.category==='companion');
  if(companion) {
    const fitted=hasWearable(state,companion,wearables);
    // Idle companions stay on the body dock; only a real inspection deploys.
    const px=x+(flight?.x??dock?.x??0),py=y+(flight?.y??dock?.y??-48);
    const docked=!flight||flight.phase==='docked';
    const deployment=flight&&dock?Math.min(1,Math.hypot(flight.x-dock.x,flight.y-dock.y)/40):1;
    const size=flight?12+12*(flight.phase==='inspecting'?1:deployment):fitted?12:14;
    if(!docked){ctx.save();ctx.fillStyle='#061017';ctx.globalAlpha=.3;ctx.beginPath();ctx.ellipse(px,y+(flight?.y??0)+28,9,3.5,0,0,Math.PI*2);ctx.fill();ctx.restore();}
    draw(companion,px,py,size);
    if(flight){ctx.save();ctx.fillStyle=docked?'#b7ebae':flight.phase==='inspecting'?'#66dcd4':'#e8c578';ctx.fillRect(px-1,py+size*.22,2,1.5);ctx.restore();}
  }
  // All other purchases use the same character-specific torso frame as raster wearables.
  if(!actorPose)return flight?.phase;
  ctx.save();ctx.translate(x,y);
  applyActorTorsoTransform(ctx,actorPose.pose,actorPose.height,Boolean(ACTOR_RIGS[actorPose.actor.src.split('/').pop()??'']));
  let attached=false;
  for(const id of gear.equipped){
    const item=STORE_ITEMS.find(item=>item.id===id);if(!item||item.category==='companion')continue;
    const socket=premiumBodySocket(state.characterId,actorPose.actor,actorPose.height,item.category);
    if(socket){
      if(!hasWearable(state,id,wearables))draw(id,socket.x,socket.y,socket.size);
      const aura=EQUIPMENT_AURAS[id as keyof typeof EQUIPMENT_AURAS];
      if(aura&&!reducedMotion){ctx.save();ctx.globalCompositeOperation='screen';drawVfxCell(ctx,actorPose.vfxAtlas,aura.cell,socket.x,socket.y,13,11,.18);ctx.restore();}
      attached=true;
    }
  }
  if(attached)drawActorEquipmentOcclusion(ctx,state.characterId,actorPose.actor,actorPose.height);
  ctx.restore();
  return flight?.phase;
}

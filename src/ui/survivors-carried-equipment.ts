import type {SurvivorsGameState,PerkId} from '../domain/patrol-survivors';
import {ACTOR_RIGS} from './survivors-animation-rig';
import {applyActorTorsoTransform} from './survivors-rig-renderer';
import type {SpritePose} from './survivors-sprite-motion';
import {baseToolSocket} from './survivors-wearable-art';
import {drawEquipment,equipmentAppearance} from './survivors-equipment-art';

export function carriedTool(state:Readonly<SurvivorsGameState>):{id:PerkId;level:number;left:boolean}|undefined {
 const perks=state.activePerks;
 const left=perks.cryo_blizzard>0||perks.extinguisher>perks.radio_boost&&!(perks.satellite_broadcast>0);
 const id:PerkId=left?(perks.cryo_blizzard>0?'cryo_blizzard':'extinguisher'):(perks.satellite_broadcast>0?'satellite_broadcast':'radio_boost');
 const level=perks[id];if(!(level>0))return;
 return {id,level:id==='cryo_blizzard'||id==='satellite_broadcast'?5:level,left};
}

/** One body-mounted tool uses the exact torso frame shared by wearables. */
export function drawCarriedEquipment(ctx:CanvasRenderingContext2D,state:Readonly<SurvivorsGameState>,actor:HTMLImageElement,height:number,pose:SpritePose,atlas:HTMLImageElement|undefined,pickups:HTMLImageElement|undefined):void {
 const tool=carriedTool(state);if(!tool)return;
 const socket=baseToolSocket(state.characterId,actor,height,tool.left);if(!socket)return;
 const appearance=equipmentAppearance(tool.id,tool.level)!;
 ctx.save();applyActorTorsoTransform(ctx,pose,height,Boolean(ACTOR_RIGS[actor.src.split('/').pop()??'']));
 drawEquipment(ctx,atlas,tool.id,tool.level,socket.x,socket.y+socket.size*appearance.scale*.5,socket.size,pickups);
 ctx.restore();
}

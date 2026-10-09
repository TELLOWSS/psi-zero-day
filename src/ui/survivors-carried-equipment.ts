import type {SurvivorsGameState,PerkId} from '../domain/patrol-survivors';
import {ACTOR_RIGS} from './survivors-animation-rig';
import {applyActorTorsoTransform} from './survivors-rig-renderer';
import type {SpritePose} from './survivors-sprite-motion';
import {baseToolSocket,premiumBodySocket} from './survivors-wearable-art';
import type {StoreCategory} from '../domain/survivors-store';
import {drawEquipment,equipmentAppearance} from './survivors-equipment-art';
import {EquipmentMotion} from './survivors-equipment-motion';
import {equipmentAnimationTime} from './survivors-equipment-clock';
const equipmentMotion=new EquipmentMotion();
const modules = [
 {base:'floodlight',evolution:'tesla_dome',category:'tempo',joint:'armor',offset:-.45},
 {base:'cone_trap',evolution:'emf_barricade',category:'tactics',joint:'belt',offset:.55},
 {base:'emp_generator',evolution:'plasma_grid',category:'logistics',joint:'pack',offset:-.45},
] as const;
export function mountedNormalEquipment(state:Readonly<SurvivorsGameState>) {
 return modules.flatMap(module=>{
  const id:PerkId=state.activePerks[module.evolution]>0?module.evolution:module.base;
  const level=state.activePerks[id];return level>0?[{...module,id,level}]:[];
 });
}

export function carriedTool(state:Readonly<SurvivorsGameState>):{id:PerkId;level:number;left:boolean}|undefined {
 const perks=state.activePerks;
 const left=perks.cryo_blizzard>0||perks.extinguisher>perks.radio_boost&&!(perks.satellite_broadcast>0);
 const id:PerkId=left?(perks.cryo_blizzard>0?'cryo_blizzard':'extinguisher'):(perks.satellite_broadcast>0?'satellite_broadcast':'radio_boost');
 const level=perks[id];if(!(level>0))return;
 return {id,level:id==='cryo_blizzard'||id==='satellite_broadcast'?5:level,left};
}

/** Carried tools and modules share the character's torso frame and bounded motion. */
export function drawCarriedEquipment(ctx:CanvasRenderingContext2D,state:Readonly<SurvivorsGameState>,actor:HTMLImageElement,height:number,pose:SpritePose,atlas:HTMLImageElement|undefined,pickups:HTMLImageElement|undefined,reduced=false,communicationWorn=false,normalWorn=false):void {
 for(const module of mountedNormalEquipment(state)) {
  if(normalWorn)continue;
  const socket=premiumBodySocket(state.characterId,actor,height,module.category as StoreCategory,pose);if(!socket)continue;
  ctx.save();applyActorTorsoTransform(ctx,pose,height,Boolean(ACTOR_RIGS[actor.src.split('/').pop()??'']));
  ctx.translate(socket.x+socket.size*module.offset,socket.y);
  ctx.rotate(equipmentMotion.sample(state.player,equipmentAnimationTime(state),pose,reduced,module.id,module.joint));
  drawEquipment(ctx,atlas,module.id,module.level,0,socket.size*.35,socket.size*.72,pickups);ctx.restore();
 }
 const grout=state.activePerks.hydraulic_ram>0?'hydraulic_ram':state.activePerks.grouting_gun>0?'grouting_gun':undefined;
 const primary=carriedTool(state);
 const tools=[...(primary?[primary]:[]),...(grout?[{id:grout as PerkId,level:state.activePerks[grout],left:!primary?.left}]:[])];
 for(const tool of tools){
 if(normalWorn&&tool.id!=='radio_boost'&&tool.id!=='satellite_broadcast')continue;
 if(communicationWorn&&(tool.id==='radio_boost'||tool.id==='satellite_broadcast'))continue;
 const socket=baseToolSocket(state.characterId,actor,height,tool.left,pose);if(!socket)return;
 const appearance=equipmentAppearance(tool.id,tool.level)!;
 ctx.save();applyActorTorsoTransform(ctx,pose,height,Boolean(ACTOR_RIGS[actor.src.split('/').pop()??'']));
 ctx.translate(socket.x,socket.y);
 ctx.rotate(equipmentMotion.sample(state.player,equipmentAnimationTime(state),pose,reduced,tool.id,tool.left?'spray':'radio'));
 drawEquipment(ctx,atlas,tool.id,tool.level,0,socket.size*appearance.scale*.5,socket.size,pickups);
 ctx.restore();
 }
}

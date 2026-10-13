import type {SurvivorsGameState} from '../domain/patrol-survivors';
import {droneEmissionOrigin} from '../domain/survivors-drone-origin';
import {drawEquipment} from './survivors-equipment-art';
import {drawDroneEmission} from './survivors-cinematic-vfx';
export function drawSafetyDrones(ctx:CanvasRenderingContext2D,state:SurvivorsGameState,gear:HTMLImageElement|undefined,pickups:HTMLImageElement|undefined,cinematic:HTMLImageElement|undefined,reduced:boolean) {
 const hunter=state.activePerks.hunter_swarm>0;
 const count=hunter?3:state.activePerks.safety_drone>0?1:0;
 if(state.droneAngle===undefined)return;
 for(let i=0;i<count;i++) {
  const {x,y}=droneEmissionOrigin(state.player,state.droneAngle,hunter,i);
  ctx.save();ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.ellipse(x,y+36,10,4.5,0,0,Math.PI*2);ctx.fill();
  drawDroneEmission(ctx,cinematic,x,y,hunter,state.gameTime,reduced);
  ctx.translate(x,y);drawEquipment(ctx,gear,hunter?'hunter_swarm':'safety_drone',hunter?1:state.activePerks.safety_drone,0,12,hunter?42:30,pickups);
  ctx.strokeStyle='rgba(226,232,240,.22)';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(0,-5,13,4,reduced?0:state.gameTime*12,0,Math.PI*2);ctx.stroke();ctx.restore();
 }
}

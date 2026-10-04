import type {SurvivorsGameState} from '../domain/patrol-survivors';
import {STORE_ITEMS} from '../domain/survivors-store';
import {drawEquipment,drawProp} from './survivors-equipment-art';
/** Raster art stays in presentation; status is read exclusively from the engine. */
export function drawPremiumGear(ctx:CanvasRenderingContext2D,state:SurvivorsGameState,atlas:HTMLImageElement|undefined,reducedMotion:boolean,facing=0,itemsAtlas?:HTMLImageElement):void {
  const gear=state.premiumGear;if(!gear||!gear.equipped.length)return;
  const {x,y}=state.player;
  if(gear.effects.shield>0) {
    ctx.save();ctx.translate(x,y-20);ctx.strokeStyle=gear.shield>0?'#7fe7ff':'#637e89';
    ctx.globalAlpha=gear.shield>0?.55:.22;ctx.lineWidth=gear.feedback>0?4:1.5;
    ctx.beginPath();ctx.ellipse(0,0,27,43,0,-Math.PI/2,-Math.PI/2+Math.PI*2*(gear.shield/gear.effects.shield));ctx.stroke();
    if(gear.feedback>0){ctx.globalAlpha=gear.feedback*.35;ctx.fillStyle='#82eaff';ctx.beginPath();ctx.ellipse(0,0,29,44,0,0,Math.PI*2);ctx.fill();}
    ctx.restore();
  }
  if(gear.effects.suppression>0) {
    ctx.save();ctx.strokeStyle='#66dcd4';ctx.globalAlpha=.16;ctx.lineWidth=1;ctx.setLineDash([6,10]);
    ctx.beginPath();ctx.ellipse(x,y,180,105,0,0,Math.PI*2);ctx.stroke();ctx.restore();
    for(const hazard of state.hazards){
      if(hazard.hp<=0 || !['GAS_LEAK','RUNAWAY_CART'].includes(hazard.type) || Math.hypot(hazard.x-x,hazard.y-y)>180)continue;
      ctx.save();ctx.strokeStyle='#66dcd4';ctx.globalAlpha=.45;ctx.lineWidth=1.2;
      ctx.beginPath();ctx.moveTo(x,y-24);ctx.lineTo(hazard.x,hazard.y-10);ctx.stroke();
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
    const angle=reducedMotion?.5:state.gameTime*.9;
    const px=x+Math.cos(angle)*48,py=y-22+Math.sin(angle)*20;
    ctx.save();ctx.fillStyle='#061017';ctx.globalAlpha=.4;ctx.beginPath();ctx.ellipse(px,py+25,13,5,0,0,Math.PI*2);ctx.fill();ctx.restore();
    draw(companion,px,py,36);
  }
  // Body sockets follow the same facing as the character, rather than floating badges.
  const direction=Math.cos(facing)<0?-1:1;
  const sockets={communication:[15,-32,13],tempo:[18,-20,11],logistics:[-9,-28,16],protection:[0,-26,17],tactics:[12,-17,10]} as const;
  for(const id of gear.equipped){
    const item=STORE_ITEMS.find(item=>item.id===id);if(!item||item.category==='companion')continue;
    const [sx,sy,size]=sockets[item.category];draw(id,x+sx*direction,y+sy,size);
  }
}

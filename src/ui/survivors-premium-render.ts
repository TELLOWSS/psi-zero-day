import type {SurvivorsGameState} from '../domain/patrol-survivors';
import {STORE_ITEMS} from '../domain/survivors-store';
/** Raster art stays in presentation; status is read exclusively from the engine. */
export function drawPremiumGear(ctx:CanvasRenderingContext2D,state:SurvivorsGameState,atlas:HTMLImageElement|undefined,reducedMotion:boolean):void {
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
  }
  if(!atlas?.naturalWidth)return;
  const cellW=atlas.naturalWidth/4,cellH=atlas.naturalHeight/4;
  const draw=(id:string,px:number,py:number,size:number)=>{
    const item=STORE_ITEMS.find(item=>item.id===id);if(!item)return;
    ctx.save();ctx.beginPath();ctx.arc(px,py,size/2,0,Math.PI*2);ctx.clip();
    ctx.drawImage(atlas,item.art%4*cellW,Math.floor(item.art/4)*cellH,cellW,cellH,px-size/2,py-size/2,size,size);ctx.restore();
  };
  const companion=gear.equipped.find(id=>STORE_ITEMS.find(item=>item.id===id)?.category==='companion');
  if(companion) {
    const angle=reducedMotion?.5:state.gameTime*.9;
    const px=x+Math.cos(angle)*48,py=y-22+Math.sin(angle)*20;
    ctx.save();ctx.fillStyle='#061017';ctx.globalAlpha=.4;ctx.beginPath();ctx.ellipse(px,py+25,13,5,0,0,Math.PI*2);ctx.fill();ctx.restore();
    draw(companion,px,py,36);
  }
  const wearable=gear.equipped.find(id=>STORE_ITEMS.find(item=>item.id===id)?.category==='protection') ?? gear.equipped[0];
  if(wearable)draw(wearable,x-17,y-35,20);
}

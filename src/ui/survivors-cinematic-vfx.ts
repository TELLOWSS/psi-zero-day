import type {Projectile,ProjectileKind,SurvivorsGameState} from '../domain/patrol-survivors';
import type {ProjectileFeedback} from '../domain/survivors-projectile-feedback';
export const CINEMATIC_VFX_ATLAS='/assets/survivors/cinematic-vfx-v1.webp';
export interface CinematicLook {palette:'gold'|'cyan'|'violet';premium:boolean;tier:number;color:string;flightCell:number;launchCell:number;impactCell:number}
export function cinematicLook(kind:ProjectileKind,level:number,equipped:readonly string[]=[]):CinematicLook {
  const tier=Math.min(3,Math.max(1,Math.ceil(level/2)));
  const communication=equipped.some(id=>['voice_lens','command_array','broadcast_crown'].includes(id));
  const tempo=equipped.some(id=>['relay_core','precision_link','sync_gauntlet'].includes(id));
  const premium=communication||tempo;
  const palette=communication ? (equipped.includes('command_array')?'cyan':'gold') : tempo?'violet':kind==='hunter_beam'?'violet':kind==='radio'?'gold':'cyan';
  const index=palette==='gold'?0:palette==='cyan'?1:2;
  return {palette,premium,tier,color:['#ffd181','#75e8ff','#d1a3ff'][index]!,flightCell:4+index,launchCell:index,impactCell:8+index};
}
/** One shared raster atlas, no per-frame allocation, blur or full-screen flash. */
export function drawVfxCell(ctx:CanvasRenderingContext2D,atlas:HTMLImageElement|undefined,cell:number,x:number,y:number,w:number,h:number,alpha:number,angle=0):boolean {
  if(!atlas?.naturalWidth||cell<0||cell>11)return false;
  ctx.save();ctx.translate(x,y);if(angle)ctx.rotate(angle);ctx.globalAlpha=Math.max(0,Math.min(1,alpha));
  const cw=atlas.naturalWidth/4,ch=atlas.naturalHeight/3;
  ctx.drawImage(atlas,cell%4*cw,Math.floor(cell/4)*ch,cw,ch,-w/2,-h/2,w,h);
  ctx.restore();return true;
}
export function drawCinematicFlight(ctx:CanvasRenderingContext2D,p:Readonly<Projectile>,look:CinematicLook,atlas:HTMLImageElement|undefined,reduced:boolean,busy:boolean):boolean {
  if(!['radio','satellite_wave','drone_laser','hunter_beam'].includes(p.kind)||!atlas?.naturalWidth)return false;
  const alpha=Math.min(1,Math.max(0,p.duration/.12));
  const angle=Math.atan2(p.vy,p.vx);
  const length=reduced?26:36+look.tier*15+(look.premium?20:0);
  const width=(reduced?10:11+look.tier*4+(look.premium?6:0))*(busy?.8:1);
  // Screen blending keeps the colored envelope rather than adding it to white.
  ctx.save();ctx.globalCompositeOperation='screen';
  drawVfxCell(ctx,atlas,look.flightCell,p.x-Math.cos(angle)*length*.20,p.y-Math.sin(angle)*length*.20,length,width,alpha*(look.premium?.92:.76),angle);
  ctx.restore();return true;
}
export function drawCinematicContact(ctx:CanvasRenderingContext2D,event:Readonly<ProjectileFeedback>,age:number,duration:number,look:CinematicLook,atlas:HTMLImageElement|undefined,reduced:boolean,busy:boolean):void {
  if(event.worker||reduced||!atlas?.naturalWidth||event.kind==='cone_trap')return;
  const t=Math.min(1,age/duration),fade=(1-t)*(1-t);
  const extent=(event.phase==='launch'?22:event.phase==='impact'?30:16)+look.tier*5+(look.premium?12:0);
  const scale=event.phase==='impact'?1+t*.45:1-t*.3;
  const cell=event.phase==='launch'?look.launchCell:look.impactCell;
  ctx.save();ctx.globalCompositeOperation='screen';
  drawVfxCell(ctx,atlas,cell,0,0,extent*scale,extent*scale*(event.phase==='launch'?.60:1),fade*(busy?.35:.8),event.phase==='launch'?event.angle:0);
  ctx.restore();
}
export function drawDroneEmission(ctx:CanvasRenderingContext2D,atlas:HTMLImageElement|undefined,x:number,y:number,evolved:boolean,time:number,reduced:boolean):void {
  const breath=reduced?1:1+Math.sin(time*9)*.08;
  ctx.save();ctx.globalCompositeOperation='screen';
  drawVfxCell(ctx,atlas,evolved?2:1,x,y+10,(evolved?19:12)*breath,evolved?30:20,evolved?.60:.38,Math.PI/2);
  ctx.restore();
}
export function drawPremiumProtocol(ctx:CanvasRenderingContext2D,state:SurvivorsGameState,atlas:HTMLImageElement|undefined,reduced:boolean,movingAngle?:number):void {
  const gear=state.premiumGear;if(!gear?.equipped.length||!atlas?.naturalWidth)return;
  const x=state.player.x,y=state.player.y,time=state.gameTime;
  const has=(ids:string[])=>gear.equipped.some(id=>ids.includes(id));
  const hasId=(id:string)=>gear.equipped.includes(id);
  const pulse=reduced?1:1+Math.sin(time*2.8)*.055;
  const sweep=reduced?0:time*.72;
  ctx.save();ctx.globalCompositeOperation='screen';

  // Communication: tactical signal identity. Legendary crown keeps a quiet aura at rest,
  // then expands into a multi-band battlefield broadcast rather than merely recoloring shots.
  if(has(['voice_lens','command_array','broadcast_crown'])) {
    const crown=hasId('broadcast_crown'),array=hasId('command_array');
    const color=array?'#75e8ff':'#ffd181';
    ctx.strokeStyle=color;ctx.lineWidth=crown?2.4:2;ctx.globalAlpha=crown?.68:.55;
    const bands=crown?(reduced?2:4):1;
    for(let i=0;i<bands;i++){
      const phase=crown?sweep+i*.62:.2;
      const radius=(24+i*9)*pulse;
      ctx.beginPath();ctx.ellipse(x,y+2,radius,10+i*3.2,0,phase,phase+Math.PI*(crown?1.38:1.6));ctx.stroke();
    }
    drawVfxCell(ctx,atlas,array?1:0,x-19,y-30,crown?34:26,crown?26:20,crown?.58:.38);
    if(crown&&!reduced){
      const broadcast=(Math.sin(time*3.2)+1)/2;
      ctx.globalAlpha=.10+broadcast*.16;ctx.lineWidth=1.2;
      ctx.beginPath();ctx.ellipse(x,y+5,74+broadcast*26,30+broadcast*10,0,0,Math.PI*2);ctx.stroke();
    }
  }

  // Tempo: timing and critical-read identity. Legendary gauntlet adds paired hand/weapon
  // synchronisation trails so movement and attacks read as one accelerated rhythm.
  if(has(['relay_core','precision_link','sync_gauntlet'])) {
    const sync=hasId('sync_gauntlet');
    ctx.strokeStyle=sync?'#e1b6ff':'#cea3ff';ctx.lineWidth=sync?2.1:1.5;ctx.globalAlpha=sync?.62:.48;
    ctx.beginPath();ctx.ellipse(x,y+3,sync?36:30,sync?15:12,0,sweep,sweep+Math.PI*(sync?1.7:1.4));ctx.stroke();
    if(sync){
      const angle=movingAngle??-Math.PI/2;
      const px=-Math.sin(angle)*10,py=Math.cos(angle)*6;
      drawVfxCell(ctx,atlas,6,x+px-Math.cos(angle)*18,y-22+py-Math.sin(angle)*18,58,15,reduced?.24:.42,angle);
      drawVfxCell(ctx,atlas,6,x-px-Math.cos(angle)*12,y-11-py-Math.sin(angle)*12,44,11,reduced?.18:.32,angle);
      drawVfxCell(ctx,atlas,2,x+Math.cos(sweep)*13,y-21+Math.sin(sweep)*7,20,20,.34);
    }
  }

  // Logistics: pickup field remains mechanically truthful. Legendary extraction pack turns
  // that radius into visibly converging recovery traffic without spawning gameplay objects.
  if(gear.effects.pickup>0){
    const extraction=hasId('extraction_pack');
    const radius=Math.min(state.player.pickupRadius,extraction?220:180);
    ctx.strokeStyle=extraction?'#ffd181':'#8ae9d1';ctx.lineWidth=extraction?1.6:1;ctx.globalAlpha=extraction?.28:.15;
    ctx.beginPath();ctx.ellipse(x,y+4,radius,radius*.58,0,0,Math.PI*2);ctx.stroke();
    if(extraction){
      const nodes=reduced?3:6;
      for(let i=0;i<nodes;i++){
        const a=sweep+i*Math.PI*2/nodes;
        const travel=reduced?.78:.58+.18*Math.sin(time*2+i);
        const nx=x+Math.cos(a)*radius*travel,ny=y+4+Math.sin(a)*radius*.58*travel;
        drawVfxCell(ctx,atlas,4,nx,ny,24,9,reduced?.16:.24,a+Math.PI);
      }
    }
  }
  if(gear.effects.speed>0&&movingAngle!==undefined&&!reduced){
    const extraction=hasId('extraction_pack');
    drawVfxCell(ctx,atlas,extraction?4:5,x-Math.cos(movingAngle)*28,y-Math.sin(movingAngle)*28,extraction?76:52,extraction?18:14,extraction?.42:.25,movingAngle);
  }

  // Protection: the legendary mantle is a persistent energy dome with shield-ratio arcs.
  // Impact feedback brightens the shell, while reduced-motion mode keeps the same identity static.
  if(gear.effects.shield>0&&gear.shield>0){
    const mantle=hasId('shock_mantle');
    const feedback=gear.feedback>0;
    drawVfxCell(ctx,atlas,3,x,y-22,mantle?82:62,mantle?104:82,(feedback?(mantle?.58:.38):(mantle?.22:.12))*pulse);
    if(mantle){
      const ratio=Math.max(0,Math.min(1,gear.shield/Math.max(1,gear.effects.shield)));
      ctx.strokeStyle=feedback?'#d5f7ff':'#7fe7ff';ctx.globalAlpha=feedback?.72:.34;ctx.lineWidth=feedback?3.4:2.1;
      ctx.beginPath();ctx.ellipse(x,y-20,35,49,0,-Math.PI/2,-Math.PI/2+Math.PI*2*ratio);ctx.stroke();
      ctx.globalAlpha=.18;ctx.lineWidth=1;
      for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(x,y-20,41+i*6,53+i*7,0,sweep+i*.7,sweep+i*.7+Math.PI*.62);ctx.stroke();}
    }
  }
  if(gear.effects.regen>0&&state.player.hp<state.player.maxHp)drawVfxCell(ctx,atlas,11,x,y-15,58,65,.28*pulse);
  if(gear.effects.lines>0||gear.effects.support>0){ctx.strokeStyle='#f3c674';ctx.globalAlpha=.24;ctx.lineWidth=1;for(let i=0;i<4;i++){const a=i*Math.PI/2;ctx.beginPath();ctx.arc(x,y+4,36,a+.1,a+.45);ctx.stroke();}}
  ctx.restore();
}

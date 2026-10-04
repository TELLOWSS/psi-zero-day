import type {Projectile,ProjectileKind,SurvivorsGameState} from '../domain/patrol-survivors';
import type {ProjectileFeedback} from '../domain/survivors-projectile-feedback';
export const CINEMATIC_VFX_ATLAS='/assets/survivors/cinematic-vfx-v1.webp';
export interface CinematicLook {palette:'gold'|'cyan'|'violet';premium:boolean;tier:number;color:string;flightCell:number;launchCell:number;impactCell:number;signature:'default'|'sync_gauntlet'}
export function cinematicLook(kind:ProjectileKind,level:number,equipped:readonly string[]=[]):CinematicLook {
  const tier=Math.min(3,Math.max(1,Math.ceil(level/2)));
  const communication=equipped.some(id=>['voice_lens','command_array','broadcast_crown'].includes(id));
  const tempo=equipped.some(id=>['relay_core','precision_link','sync_gauntlet'].includes(id));
  const premium=communication||tempo;
  const palette=communication ? (equipped.includes('command_array')?'cyan':'gold') : tempo?'violet':kind==='hunter_beam'?'violet':kind==='radio'?'gold':'cyan';
  const index=palette==='gold'?0:palette==='cyan'?1:2;
  return {palette,premium,tier,color:['#ffd181','#75e8ff','#d1a3ff'][index]!,flightCell:4+index,launchCell:index,impactCell:8+index,signature:equipped.includes('sync_gauntlet')?'sync_gauntlet':'default'};
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
  if(look.signature==='sync_gauntlet'&&!reduced) {
    // Legendary tempo gear gets a recognisable three-layer violet ribbon without
    // creating extra projectiles or changing collision/damage.
    const nx=-Math.sin(angle),ny=Math.cos(angle);
    const sx=p.x-Math.cos(angle)*length*.25,sy=p.y-Math.sin(angle)*length*.25;
    drawVfxCell(ctx,atlas,look.flightCell,sx,sy,length*1.34,width*1.72,alpha*(busy?.54:.74),angle);
    drawVfxCell(ctx,atlas,look.flightCell,sx+nx*4.5,sy+ny*4.5,length*1.18,width*.78,alpha*(busy?.48:.82),angle);
    drawVfxCell(ctx,atlas,look.flightCell,sx-nx*4.5,sy-ny*4.5,length*1.18,width*.78,alpha*(busy?.48:.82),angle);
    drawVfxCell(ctx,atlas,look.flightCell,p.x,p.y,Math.max(18,width*1.2),Math.max(11,width*.82),alpha*.96,angle);
  } else {
    drawVfxCell(ctx,atlas,look.flightCell,p.x-Math.cos(angle)*length*.20,p.y-Math.sin(angle)*length*.20,length,width,alpha*(look.premium?.92:.76),angle);
  }
  ctx.restore();return true;
}
export function drawCinematicContact(ctx:CanvasRenderingContext2D,event:Readonly<ProjectileFeedback>,age:number,duration:number,look:CinematicLook,atlas:HTMLImageElement|undefined,reduced:boolean,busy:boolean):void {
  if(event.worker||reduced||!atlas?.naturalWidth||event.kind==='cone_trap')return;
  const t=Math.min(1,age/duration),fade=(1-t)*(1-t);
  const extent=(event.phase==='launch'?22:event.phase==='impact'?30:16)+look.tier*5+(look.premium?12:0);
  const scale=event.phase==='impact'?1+t*.45:1-t*.3;
  const cell=event.phase==='launch'?look.launchCell:look.impactCell;
  ctx.save();ctx.globalCompositeOperation='screen';
  if(look.signature==='sync_gauntlet'&&event.phase==='impact') {
    const base=extent*scale;
    drawVfxCell(ctx,atlas,cell,0,0,base*1.75,base*1.32,fade*(busy?.30:.76),0);
    drawVfxCell(ctx,atlas,cell,0,0,base*.92,base*.92,fade*(busy?.34:.94),0);
    if(!busy) {
      for(let i=0;i<6;i++) {
        const a=i*Math.PI/3;
        drawVfxCell(ctx,atlas,look.flightCell,Math.cos(a)*base*.72,Math.sin(a)*base*.46,base*.48,base*.18,fade*.48,a);
      }
    }
  } else {
    drawVfxCell(ctx,atlas,cell,0,0,extent*scale,extent*scale*(event.phase==='launch'?.60:1),fade*(busy?.35:.8),event.phase==='launch'?event.angle:0);
  }
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
  const x=state.player.x,y=state.player.y;
  const has=(ids:string[])=>gear.equipped.some(id=>ids.includes(id));
  const pulse=reduced?1:1+Math.sin(state.gameTime*2.8)*.055;
  ctx.save();ctx.globalCompositeOperation='screen';
  if(has(['voice_lens','command_array','broadcast_crown'])) {
    const color=gear.equipped.includes('command_array')?'#75e8ff':'#ffd181';
    ctx.strokeStyle=color;ctx.lineWidth=2;ctx.globalAlpha=.55;
    ctx.beginPath();ctx.ellipse(x,y+2,24*pulse,10*pulse,0,.2,Math.PI*1.8);ctx.stroke();
    // A quiet emitter lens near the actual held equipment, not a new attack.
    drawVfxCell(ctx,atlas,gear.equipped.includes('command_array')?1:0,x-19,y-30,26,20,.38);
  }
  if(has(['relay_core','precision_link','sync_gauntlet'])) {
    const sync=gear.equipped.includes('sync_gauntlet');
    ctx.strokeStyle=sync?'#e2b7ff':'#cea3ff';ctx.lineWidth=sync?2.4:1.5;ctx.globalAlpha=sync?.72:.48;
    ctx.beginPath();ctx.ellipse(x,y+3,(sync?37:30)*pulse,(sync?15:12)*pulse,0,reduced?0:state.gameTime,(reduced?0:state.gameTime)+Math.PI*(sync?1.65:1.4));ctx.stroke();
    if(sync) {
      ctx.globalAlpha=.34;ctx.lineWidth=1.2;
      ctx.beginPath();ctx.ellipse(x,y+3,48*pulse,19*pulse,0,reduced?Math.PI:state.gameTime+Math.PI,(reduced?Math.PI:state.gameTime+Math.PI)+Math.PI*1.2);ctx.stroke();
      drawVfxCell(ctx,atlas,6,x-18,y-29,38,24,.46*pulse);
    }
  }
  if(gear.effects.pickup>0){ctx.strokeStyle='#8ae9d1';ctx.lineWidth=1;ctx.globalAlpha=.15;ctx.beginPath();ctx.ellipse(x,y+4,state.player.pickupRadius,state.player.pickupRadius*.58,0,0,Math.PI*2);ctx.stroke();}
  if(gear.effects.speed>0&&movingAngle!==undefined&&!reduced)drawVfxCell(ctx,atlas,5,x-Math.cos(movingAngle)*24,y-Math.sin(movingAngle)*24,52,14,.25,movingAngle);
  if(gear.effects.shield>0&&gear.shield>0)drawVfxCell(ctx,atlas,3,x,y-22,62,82,(gear.feedback>0?.38:.12)*pulse);
  if(gear.effects.regen>0&&state.player.hp<state.player.maxHp)drawVfxCell(ctx,atlas,11,x,y-15,58,65,.28*pulse);
  if(gear.effects.lines>0||gear.effects.support>0){ctx.strokeStyle='#f3c674';ctx.globalAlpha=.24;ctx.lineWidth=1;for(let i=0;i<4;i++){const a=i*Math.PI/2;ctx.beginPath();ctx.arc(x,y+4,36,a+.1,a+.45);ctx.stroke();}}
  ctx.restore();
}

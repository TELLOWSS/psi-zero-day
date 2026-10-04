import type {Projectile,ProjectileKind,SurvivorsGameState} from '../domain/patrol-survivors';
import type {ProjectileFeedback} from '../domain/survivors-projectile-feedback';
export const CINEMATIC_VFX_ATLAS='/assets/survivors/cinematic-vfx-v1.webp';
export interface CinematicLook {palette:'gold'|'cyan'|'violet';premium:boolean;tier:number;color:string;flightCell:number;launchCell:number;impactCell:number}
export function cinematicLook(kind:ProjectileKind,level:number,equipped:readonly string[]=[]):CinematicLook {
  const tier=Math.min(5,Math.max(1,level));
  const communication=equipped.some(id=>['voice_lens','command_array','broadcast_crown'].includes(id));
  const tempo=equipped.some(id=>['relay_core','precision_link','sync_gauntlet'].includes(id));
  const communicationShot=communication&&(kind==='radio'||kind==='satellite_wave');
  const tempoShot=tempo&&(kind==='drone_laser'||kind==='hunter_beam');
  const premium=communicationShot||tempoShot;
  const palette=communicationShot
    ? (equipped.includes('command_array')?'cyan':'gold')
    : tempoShot?'violet'
    : kind==='hunter_beam'?'violet'
    : kind==='radio'?'gold':'cyan';
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
  const length=reduced?26:32+look.tier*9+(look.premium?8:0);
  const width=(reduced?10:10+look.tier*2+(look.premium?3:0))*(busy?.72:1);
  // Screen blending keeps the colored envelope rather than adding it to white.
  ctx.save();ctx.globalCompositeOperation='screen';
  drawVfxCell(ctx,atlas,look.flightCell,p.x-Math.cos(angle)*length*.20,p.y-Math.sin(angle)*length*.20,length,width,alpha*(look.premium?.92:.76),angle);
  // Static pulse count remains legible even with reduced motion enabled.
  ctx.translate(p.x,p.y);ctx.rotate(angle);ctx.strokeStyle=look.color;ctx.lineWidth=1.2;ctx.globalAlpha=alpha*.75;
  for(let i=0;i<look.tier;i++){ctx.beginPath();ctx.moveTo(-8-i*7,-width*.3);ctx.lineTo(-8-i*7,width*.3);ctx.stroke();}
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
export function premiumVfxDetailLevel(equippedCount:number,busy:boolean,reduced:boolean):0|1|2 {
  if(reduced)return 0;
  if(busy||equippedCount>=5)return 1;
  return 2;
}

export const PREMIUM_VFX_SIGNATURES={
  voice_lens:'communication:advanced:voice-scan',
  command_array:'communication:elite:network-array',
  broadcast_crown:'communication:legendary:broadcast-crown',
  relay_core:'tempo:advanced:relay-clock',
  precision_link:'tempo:elite:precision-reticle',
  sync_gauntlet:'tempo:legendary:sync-trails',
  recovery_mesh:'logistics:advanced:magnet-mesh',
  dispatch_drive:'logistics:elite:drive-trails',
  extraction_pack:'logistics:legendary:extraction-field',
  rescue_shell:'protection:advanced:armor-shell',
  recovery_cell:'protection:elite:recovery-pulse',
  shock_mantle:'protection:legendary:energy-dome',
  inspection_wing:'companion:elite:scan-wing',
  barrier_forge:'tactics:elite:barrier-lines',
  rescue_wing:'companion:elite:rescue-field',
  predictive_watch:'tactics:elite:future-watch',
} as const;

export function drawPremiumProtocol(ctx:CanvasRenderingContext2D,state:SurvivorsGameState,atlas:HTMLImageElement|undefined,reduced:boolean,movingAngle?:number,busy=false):void {
  const gear=state.premiumGear;if(!gear?.equipped.length||!atlas?.naturalWidth)return;
  const x=state.player.x,y=state.player.y,time=state.gameTime;
  const hasId=(id:string)=>gear.equipped.includes(id);
  const detail=premiumVfxDetailLevel(gear.equipped.length,busy,reduced);
  const constrained=detail<2;
  const pulse=reduced?1:1+Math.sin(time*2.8)*.055;
  const sweep=reduced?0:time*.72;
  const facing=movingAngle??-Math.PI/2;
  ctx.save();ctx.globalCompositeOperation='screen';

  // COMMUNICATION — each paid tier has its own signal grammar.
  if(hasId('broadcast_crown')){
    ctx.strokeStyle='#ffd181';ctx.lineWidth=2.4;ctx.globalAlpha=.68;
    const bands=detail===2?4:2;
    for(let i=0;i<bands;i++){const phase=sweep+i*.62,r=(24+i*9)*pulse;ctx.beginPath();ctx.ellipse(x,y+2,r,10+i*3.2,0,phase,phase+Math.PI*1.38);ctx.stroke();}
    drawVfxCell(ctx,atlas,0,x-19,y-30,34,26,.58);
    if(detail===2){const broadcast=(Math.sin(time*3.2)+1)/2;ctx.globalAlpha=.10+broadcast*.16;ctx.lineWidth=1.2;ctx.beginPath();ctx.ellipse(x,y+5,74+broadcast*26,30+broadcast*10,0,0,Math.PI*2);ctx.stroke();}
  } else if(hasId('command_array')){
    ctx.strokeStyle='#75e8ff';ctx.lineWidth=1.8;ctx.globalAlpha=.50;
    for(let i=0;i<(detail===2?3:2);i++){const a=sweep+i*Math.PI*2/3;ctx.beginPath();ctx.ellipse(x,y+1,31+i*7,12+i*3,0,a,a+Math.PI*.82);ctx.stroke();}
    for(let i=0;i<(detail===2?3:2);i++){const a=sweep+i*Math.PI*2/3;drawVfxCell(ctx,atlas,1,x+Math.cos(a)*32,y-18+Math.sin(a)*12,16,16,.30);}
    drawVfxCell(ctx,atlas,1,x-18,y-30,28,22,.42);
  } else if(hasId('voice_lens')){
    ctx.strokeStyle='#ff9d66';ctx.lineWidth=1.6;ctx.globalAlpha=.48;
    ctx.beginPath();ctx.ellipse(x,y+2,23*pulse,9*pulse,0,.2,Math.PI*1.72);ctx.stroke();
    if(!reduced){ctx.globalAlpha=.22;ctx.beginPath();ctx.ellipse(x+Math.cos(facing)*18,y-20+Math.sin(facing)*10,15+Math.sin(time*5)*3,6,0,facing-.45,facing+.45);ctx.stroke();}
    drawVfxCell(ctx,atlas,0,x-18,y-30,23,18,.34);
  }

  // TEMPO — relay pulse, elite weak-point lock, then legendary dual synchronisation.
  if(hasId('sync_gauntlet')){
    ctx.strokeStyle='#e1b6ff';ctx.lineWidth=2.1;ctx.globalAlpha=.62;
    ctx.beginPath();ctx.ellipse(x,y+3,36,15,0,sweep,sweep+Math.PI*1.7);ctx.stroke();
    const px=-Math.sin(facing)*10,py=Math.cos(facing)*6;
    drawVfxCell(ctx,atlas,6,x+px-Math.cos(facing)*18,y-22+py-Math.sin(facing)*18,58,15,reduced?.24:.42,facing);
    drawVfxCell(ctx,atlas,6,x-px-Math.cos(facing)*12,y-11-py-Math.sin(facing)*12,44,11,reduced?.18:.32,facing);
    drawVfxCell(ctx,atlas,2,x+Math.cos(sweep)*13,y-21+Math.sin(sweep)*7,20,20,.34);
  } else if(hasId('precision_link')){
    ctx.strokeStyle='#d1a3ff';ctx.lineWidth=1.7;ctx.globalAlpha=.54;
    const tx=x+Math.cos(facing)*44,ty=y-20+Math.sin(facing)*28;
    ctx.beginPath();ctx.ellipse(tx,ty,18*pulse,18*pulse,0,sweep,sweep+Math.PI*1.55);ctx.stroke();
    ctx.globalAlpha=.28;ctx.beginPath();ctx.ellipse(tx,ty,28,10,0,facing-.72,facing+.72);ctx.stroke();
    drawVfxCell(ctx,atlas,2,tx,ty,25,25,.38);
  } else if(hasId('relay_core')){
    ctx.strokeStyle='#75e8ff';ctx.lineWidth=1.4;ctx.globalAlpha=.42;
    ctx.beginPath();ctx.ellipse(x,y+1,27,11,0,sweep,sweep+Math.PI*1.25);ctx.stroke();
    ctx.globalAlpha=.20;ctx.beginPath();ctx.ellipse(x,y-20,15*pulse,15*pulse,0,0,Math.PI*2);ctx.stroke();
    drawVfxCell(ctx,atlas,1,x+15,y-19,18,18,.26);
  }

  // LOGISTICS — actual pickup/speed stats remain the source of truth; VFX only exposes them.
  if(hasId('extraction_pack')){
    const radius=Math.min(state.player.pickupRadius,220);
    ctx.strokeStyle='#ffd181';ctx.lineWidth=1.6;ctx.globalAlpha=.28;ctx.beginPath();ctx.ellipse(x,y+4,radius,radius*.58,0,0,Math.PI*2);ctx.stroke();
    for(let i=0;i<(detail===2?6:3);i++){const a=sweep+i*Math.PI*2/(detail===2?6:3),travel=reduced?.78:.58+.18*Math.sin(time*2+i);drawVfxCell(ctx,atlas,4,x+Math.cos(a)*radius*travel,y+4+Math.sin(a)*radius*.58*travel,24,9,reduced?.16:.24,a+Math.PI);}
    if(movingAngle!==undefined&&!reduced)drawVfxCell(ctx,atlas,4,x-Math.cos(facing)*28,y-Math.sin(facing)*28,constrained?60:76,constrained?14:18,constrained?.28:.42,facing);
  } else if(hasId('dispatch_drive')){
    const radius=Math.min(state.player.pickupRadius,150);
    ctx.strokeStyle='#ffb45c';ctx.lineWidth=1.2;ctx.globalAlpha=.22;ctx.beginPath();ctx.ellipse(x,y+4,radius,radius*.55,0,0,Math.PI*2);ctx.stroke();
    if(movingAngle!==undefined&&!reduced){
      drawVfxCell(ctx,atlas,5,x-Math.cos(facing)*25-Math.sin(facing)*9,y-Math.sin(facing)*25+Math.cos(facing)*5,constrained?48:58,constrained?10:12,constrained?.24:.34,facing);
      drawVfxCell(ctx,atlas,5,x-Math.cos(facing)*20+Math.sin(facing)*9,y-Math.sin(facing)*20-Math.cos(facing)*5,46,10,.25,facing);
    }
  } else if(hasId('recovery_mesh')){
    const radius=Math.min(state.player.pickupRadius,135);
    ctx.strokeStyle='#8ae9d1';ctx.lineWidth=1;ctx.globalAlpha=.20;ctx.beginPath();ctx.ellipse(x,y+4,radius,radius*.58,0,0,Math.PI*2);ctx.stroke();
    for(let i=0;i<(detail===2?4:2);i++){const a=sweep+i*Math.PI/2,travel=.66+.08*Math.sin(time*2.4+i);drawVfxCell(ctx,atlas,4,x+Math.cos(a)*radius*travel,y+4+Math.sin(a)*radius*.58*travel,15,7,.18,a+Math.PI);}
  }

  // PROTECTION — silhouette, healing cadence and shield all have different paid identities.
  if(hasId('shock_mantle')&&gear.shield>0){
    const feedback=gear.feedback>0,ratio=Math.max(0,Math.min(1,gear.shield/Math.max(1,gear.effects.shield)));
    drawVfxCell(ctx,atlas,3,x,y-22,82,104,(feedback?.58:.22)*pulse);
    ctx.strokeStyle=feedback?'#d5f7ff':'#7fe7ff';ctx.globalAlpha=feedback?.72:.34;ctx.lineWidth=feedback?3.4:2.1;ctx.beginPath();ctx.ellipse(x,y-20,35,49,0,-Math.PI/2,-Math.PI/2+Math.PI*2*ratio);ctx.stroke();
    ctx.globalAlpha=.18;ctx.lineWidth=1;for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(x,y-20,41+i*6,53+i*7,0,sweep+i*.7,sweep+i*.7+Math.PI*.62);ctx.stroke();}
  } else if(hasId('recovery_cell')){
    const healing=state.player.hp<state.player.maxHp;
    ctx.strokeStyle='#77f2b0';ctx.lineWidth=1.6;ctx.globalAlpha=healing?.48:.20;
    for(let i=0;i<(reduced?1:2);i++){const r=29+i*8;ctx.beginPath();ctx.ellipse(x,y-15,r,r*1.25,0,sweep+i, sweep+i+Math.PI*1.25);ctx.stroke();}
    drawVfxCell(ctx,atlas,11,x,y-15,healing?66:48,healing?72:54,healing?.38:.16);
  } else if(hasId('rescue_shell')){
    ctx.strokeStyle='#9ef5d0';ctx.lineWidth=2;ctx.globalAlpha=.34;
    for(let i=0;i<3;i++){const a=-Math.PI*.85+i*Math.PI*.62;ctx.beginPath();ctx.ellipse(x,y-21,29+i*2,39+i*2,0,a,a+Math.PI*.32);ctx.stroke();}
    drawVfxCell(ctx,atlas,3,x,y-22,48,62,.12*pulse);
  }

  // COMPANION — the companion sprite is rendered elsewhere; this layer supplies its tactical field.
  if(hasId('inspection_wing')){
    ctx.strokeStyle='#75e8ff';ctx.lineWidth=1.1;ctx.globalAlpha=.22;
    const radius=180;ctx.beginPath();ctx.ellipse(x,y,radius,radius*.58,0,sweep,sweep+Math.PI*.62);ctx.stroke();
    for(let i=0;i<(detail===2?4:2);i++){const a=sweep+i*Math.PI/2;drawVfxCell(ctx,atlas,1,x+Math.cos(a)*52,y-22+Math.sin(a)*24,14,14,.20);}
  } else if(hasId('rescue_wing')){
    const healing=state.player.hp<state.player.maxHp;
    ctx.strokeStyle='#74f4c4';ctx.lineWidth=1.5;ctx.globalAlpha=healing?.38:.20;
    ctx.beginPath();ctx.ellipse(x,y+2,48*pulse,22*pulse,0,0,Math.PI*2);ctx.stroke();
    drawVfxCell(ctx,atlas,11,x,y-16,healing?62:44,healing?66:48,healing?.30:.14);
    if(gear.shield>0)drawVfxCell(ctx,atlas,3,x,y-22,58,76,.12);
  }

  // TACTICS — barrier stock is spatial; predictive watch is future-reading/ultimate cadence.
  if(hasId('barrier_forge')){
    ctx.strokeStyle='#ffb45c';ctx.lineWidth=2;ctx.globalAlpha=.34;
    const count=Math.min(3,Math.max(1,gear.effects.lines));
    for(let i=0;i<count;i++){const offset=(i-(count-1)/2)*26;ctx.beginPath();ctx.ellipse(x+offset,y+17,20,7,0,Math.PI*1.08,Math.PI*1.92);ctx.stroke();drawVfxCell(ctx,atlas,8,x+offset,y+12,30,12,.15);}
  } else if(hasId('predictive_watch')){
    const charge=Math.max(0,Math.min(1,state.ultimateCharge/Math.max(1,state.maxUltimateCharge)));
    ctx.strokeStyle='#f3c674';ctx.lineWidth=1.3;ctx.globalAlpha=.30;
    ctx.beginPath();ctx.ellipse(x,y+4,38,16,0,-Math.PI/2,-Math.PI/2+Math.PI*2*charge);ctx.stroke();
    for(let i=0;i<(detail===2?4:2);i++){const a=sweep+i*Math.PI/2,r=42+i%2*9;drawVfxCell(ctx,atlas,0,x+Math.cos(a)*r,y-18+Math.sin(a)*r*.45,13,13,.19);}
    if(detail===2){ctx.globalAlpha=.16;ctx.beginPath();ctx.ellipse(x+Math.cos(facing)*62,y+Math.sin(facing)*34,25,9,0,facing-.6,facing+.6);ctx.stroke();}
  }

  ctx.restore();
}

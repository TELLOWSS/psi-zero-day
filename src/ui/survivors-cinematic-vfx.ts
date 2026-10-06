import type {Projectile,ProjectileKind,SurvivorsGameState} from '../domain/patrol-survivors';
import type {ProjectileFeedback} from '../domain/survivors-projectile-feedback';
import {weaponContactEnvelope} from './survivors-vfx-timing';
export const CINEMATIC_VFX_ATLAS='/assets/survivors/cinematic-vfx-v3.png';
export interface CinematicLook {palette:'gold'|'cyan'|'violet';premium:boolean;evolved:boolean;tier:number;color:string;flightCell:number;launchCell:number;impactCell:number}
export function cinematicLook(kind:ProjectileKind,level:number,equipped:readonly string[]=[]):CinematicLook {
  const tier=Math.min(5,Math.max(1,level));
  const communication=equipped.some(id=>['voice_lens','command_array','broadcast_crown'].includes(id));
  const tempo=equipped.some(id=>['relay_core','precision_link','sync_gauntlet'].includes(id));
  const communicationShot=communication&&(kind==='radio'||kind==='satellite_wave');
  const tempoShot=tempo&&(kind==='drone_laser'||kind==='hunter_beam');
  const premium=communicationShot||tempoShot;
  const evolved=['satellite_wave','cryo_blast','tesla_bolt','emf_beam','hunter_beam','hydraulic_wave','plasma_arc'].includes(kind);
  const palette=communicationShot
    ? (equipped.includes('command_array')?'cyan':'gold')
    : tempoShot?'violet'
    : kind==='hunter_beam'?'violet'
    : ['radio','satellite_wave','emf_beam'].includes(kind)?'gold':'cyan';
  const index=palette==='gold'?0:palette==='cyan'?1:2;
  return {palette,premium,evolved,tier,color:kind==='tesla_bolt'?'#a8ed86':kind==='cryo_blast'?'#b2f3ff':['#ffd181','#75e8ff','#d1a3ff'][index]!,flightCell:4+index,launchCell:kind==='tesla_bolt'?2:kind==='hunter_beam'?10:index,impactCell:kind==='tesla_bolt'?2:kind==='cryo_blast'?1:8+index};
}
/** One shared raster atlas, no per-frame allocation, blur or full-screen flash. */
export function drawVfxCell(ctx:CanvasRenderingContext2D,atlas:HTMLImageElement|undefined,cell:number,x:number,y:number,w:number,h:number,alpha:number,angle=0):boolean {
  if(!atlas?.naturalWidth||cell<0||cell>11)return false;
  ctx.save();ctx.translate(x,y);if(angle)ctx.rotate(angle);ctx.globalAlpha=Math.max(0,Math.min(1,alpha));
  const cw=atlas.naturalWidth/4,ch=atlas.naturalHeight/3;
  ctx.drawImage(atlas,cell%4*cw,Math.floor(cell/4)*ch,cw,ch,-w/2,-h/2,w,h);
  ctx.restore();return true;
}
export function drawCinematicFlight(ctx:CanvasRenderingContext2D,p:Readonly<Projectile>,look:CinematicLook,atlas:HTMLImageElement|undefined,reduced:boolean,busy:boolean,time=0):boolean {
  if(!['radio','satellite_wave','drone_laser','hunter_beam'].includes(p.kind)||!atlas?.naturalWidth)return false;
  const alpha=Math.min(1,Math.max(0,p.duration/.12));
  const angle=Math.atan2(p.vy,p.vx);
  const beam=p.kind==='drone_laser'||p.kind==='hunter_beam';
  const phase=reduced?0:((time*(beam?4:2.4)+p.duration*.3)%1+1)%1;
  const breath=reduced?1:1+Math.sin(phase*Math.PI*2)*(busy?.025:.07);
  const length=(reduced?26:32+look.tier*9+(look.premium?8:0))*breath;
  const width=(reduced?10:10+look.tier*2+(look.premium?3:0))*(busy?.72:1)/breath;
  // Screen blending keeps the colored envelope rather than adding it to white.
  ctx.save();ctx.globalCompositeOperation='screen';
  drawVfxCell(ctx,atlas,look.flightCell,p.x-Math.cos(angle)*length*.20,p.y-Math.sin(angle)*length*.20,length,width,alpha*(look.premium?.92:.76),angle);
  // Advect small pulses along the painted envelope; never move the actual projectile.
  ctx.translate(p.x,p.y);ctx.rotate(angle);ctx.strokeStyle=look.color;ctx.lineWidth=1.2;ctx.globalAlpha=alpha*.75;
  for(let i=0;i<look.tier;i++){
    const x=reduced?-8-i*7:-5-((i+phase)%look.tier)*7;
    const spread=width*(beam?.18+.14*(1-phase):.3+.10*phase);
    ctx.beginPath();ctx.moveTo(x,-spread);ctx.lineTo(x,spread);ctx.stroke();
  }
  if(look.evolved){
    ctx.lineWidth=1.6;ctx.globalAlpha=alpha*(busy?.45:.8);
    for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(-length*.62,side*width*.42);ctx.lineTo(-length*.18,side*width*.28);ctx.lineTo(5,side*width*.12);ctx.stroke();}
  }
  ctx.restore();return true;
}
export function drawCinematicContact(ctx:CanvasRenderingContext2D,event:Readonly<ProjectileFeedback>,age:number,duration:number,look:CinematicLook,atlas:HTMLImageElement|undefined,reduced:boolean,busy:boolean):void {
  if(event.worker||reduced||!atlas?.naturalWidth||event.kind==='cone_trap')return;
  const {t,exposure:fade,travel,material}=weaponContactEnvelope(event.phase,age,duration);
  const extent=(event.phase==='launch'?22:event.phase==='impact'?30:16)+look.tier*5+(look.premium?12:0);
  const scale=event.phase==='impact'?.72+travel*.73:event.phase==='launch'?.65+Math.sin(Math.min(1,t*2)*Math.PI/2)*.45:1-t*.3;
  const cell=event.phase==='launch'?look.launchCell:look.impactCell;
  ctx.save();ctx.globalCompositeOperation='screen';
  drawVfxCell(ctx,atlas,cell,0,0,extent*scale,extent*scale*(event.phase==='launch'?.60:1),fade*(busy?.35:.8),event.phase==='launch'?event.angle:0);
  if(event.phase==='impact'&&(look.premium||look.evolved)&&!busy){
    // A directional hot core and material fragments, not a screen-wide flash.
    drawVfxCell(ctx,atlas,look.launchCell,0,0,extent*(.46-travel*.20),extent*(.28-travel*.12),fade*.9,event.angle);
    ctx.strokeStyle=look.color;ctx.lineWidth=event.critical?2.4:1.7;ctx.globalAlpha=material*.85;
    for(let i=0;i<4;i++){
      const angle=event.angle+(i-1.5)*.42,r=8+travel*22;
      ctx.beginPath();ctx.moveTo(Math.cos(angle)*r,Math.sin(angle)*r);
      ctx.lineTo(Math.cos(angle)*(r+7),Math.sin(angle)*(r+7));ctx.stroke();
    }
  }
  if(look.evolved&&event.phase==='impact'){
    ctx.strokeStyle=look.color;ctx.lineWidth=event.critical?2.4:1.4;ctx.globalAlpha=fade*(busy?.4:.85);
    const radius=12+travel*14,marks=busy?3:kindContactMarks(event.kind);
    const spin=event.kind==='tesla_bolt'?t*.7:event.kind==='hunter_beam'?-t*.35:0;
    for(let i=0;i<marks;i++){const a=event.angle+i*Math.PI*2/marks+spin;ctx.beginPath();ctx.moveTo(Math.cos(a)*radius,Math.sin(a)*radius*.6);ctx.lineTo(Math.cos(a)*(radius+6*(1-t)),Math.sin(a)*(radius+6*(1-t))*.6);ctx.stroke();}
  }
  ctx.restore();
}
/** Directional colored wake only; the material layer already owns the bright impact core. */
export function drawCinematicAccent(ctx:CanvasRenderingContext2D,event:Readonly<ProjectileFeedback>,age:number,duration:number,look:CinematicLook,atlas:HTMLImageElement|undefined,busy:boolean):void {
  if(event.worker||event.blocked||!atlas?.naturalWidth||event.phase==='release')return;
  const envelope=weaponContactEnvelope(event.phase,age,duration);
  const power=look.premium||look.evolved?1:.7;
  const distance=6+envelope.travel*14;
  ctx.save();ctx.globalCompositeOperation='screen';
  drawVfxCell(ctx,atlas,look.flightCell,-Math.cos(event.angle)*distance,-Math.sin(event.angle)*distance,28+envelope.travel*18,8+power*5,envelope.material*power*(busy?.38:.64),event.angle);
  ctx.restore();
}
function kindContactMarks(kind:ProjectileKind):number {return kind==='cryo_blast'?6:kind==='emf_beam'?4:kind==='hunter_beam'?3:5;}
export function drawDroneEmission(ctx:CanvasRenderingContext2D,atlas:HTMLImageElement|undefined,x:number,y:number,evolved:boolean,time:number,reduced:boolean):void {
  const breath=reduced?1:1+Math.sin(time*9)*.08;
  ctx.save();ctx.globalCompositeOperation='screen';
  drawVfxCell(ctx,atlas,evolved?2:1,x,y+10,(evolved?19:12)*breath,evolved?30:20,evolved?.60:.38,Math.PI/2);
  ctx.restore();
}
export function premiumVfxDetailLevel(_equippedCount:number,busy:boolean,reduced:boolean):0|1|2 {
  if(reduced)return 0;
  if(busy)return 1;
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

export function drawPremiumProtocol(ctx:CanvasRenderingContext2D,state:SurvivorsGameState,atlas:HTMLImageElement|undefined,reduced:boolean,movingAngle?:number,busy=false,recoveryCellAuthored=false):void {
  const gear=state.premiumGear;
  if(!gear?.equipped.length||!atlas?.naturalWidth)return;
  const has=(id:string)=>gear.equipped.includes(id);
  const x=state.player.x,y=state.player.y;
  const detail=premiumVfxDetailLevel(gear.equipped.length,busy,reduced);
  ctx.save();ctx.globalCompositeOperation='screen';
  // Idle presence belongs to the grounded identity layer; these respond to actual state.
  // Shield feedback is owned by drawPremiumGear in gameplay and fitting alike.
  if((gear.recoveryAmount??0)>0&&((has('recovery_cell')&&!recoveryCellAuthored)||has('rescue_wing'))){
    drawVfxCell(ctx,atlas,11,x,y+2,52,40,reduced?.14:busy?.18:.28);
  }
  if(movingAngle!==undefined&&detail>0&&has('extraction_pack')){
    drawVfxCell(ctx,atlas,4,x-Math.cos(movingAngle)*20,y+5-Math.sin(movingAngle)*10,
      60,18,busy?.18:.3,movingAngle);
  }
  if(gear.feedback>0&&has('barrier_forge')){
    drawVfxCell(ctx,atlas,8,x,y+8,58,24,busy?.2:.32);
  }
  ctx.restore();
}

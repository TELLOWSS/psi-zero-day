import type {OmegaFieldObstacle,OmegaFieldPlan,OmegaFieldPoint} from '../domain/omega-protocol-field';
import {OMEGA_FIELD_HEIGHT as FIELD_H,OMEGA_FIELD_WIDTH as FIELD_W} from '../domain/omega-protocol-field';
import {omegaConnectedDeckElevation} from '../domain/omega-protocol-field-transit';
import type {OmegaCameraState} from './omega-protocol-camera';
import {drawOmegaPaintedRainOverlay} from './omega-protocol-vfx-art';

/**
 * Diablo Immortal-inspired 3D atmospheric depth, multi-plane parallax backdrop,
 * specular floor reflections, 3D prop relief shading, dynamic combat floor lighting,
 * and sector weather across ALL 5 sectors / 15 connected zones.
 *
 * Strictly presentation-only: zero changes to Watch XY physics, collision bounds,
 * hitboxes, line of sight, enemy AI, or Sector-1 M12 unit contracts.
 */

export interface Omega3DBudget {
 readonly tier:'mobile'|'tablet'|'desktop';
 readonly weatherCount:number;
 readonly puddles:number;
 readonly lights:number;
 readonly godRays:number;
 readonly parallaxBeams:number;
 readonly shadowBlur:boolean;
}

export type Omega3DWeatherKind='rain'|'sparks'|'storm'|'mist'|'embers';

export interface Omega3DSectorTheme {
 readonly sector:1|2|3|4|5;
 readonly skyTop:string;
 readonly skyBottom:string;
 readonly abyssGlow:string;
 readonly structureFar:string;
 readonly structureMid:string;
 readonly keyLight:string;
 readonly keyRgb:string;
 readonly fillLight:string;
 readonly fillRgb:string;
 readonly accentGlow:string;
 readonly ambientTint:string;
 readonly weather:Omega3DWeatherKind;
}

export interface Omega3DCombatFlash {
 readonly muzzle:number;
 readonly blade:number;
}

export interface Omega3DEnemyPresence {
 readonly x:number;
 readonly y:number;
 readonly hp:number;
 readonly radius?:number;
 readonly isStageBoss?:boolean;
}

const SECTOR_THEMES:Readonly<Record<1|2|3|4|5,Omega3DSectorTheme>>={
 1:{
  sector:1,
  skyTop:'#040912',skyBottom:'#0c1c2c',abyssGlow:'rgba(34,88,124,.24)',
  structureFar:'rgba(14,31,48,.82)',structureMid:'rgba(20,42,60,.88)',
  keyLight:'#f5b56d',keyRgb:'245,181,109',
  fillLight:'#5ecae8',fillRgb:'94,202,232',
  accentGlow:'#94f3fc',ambientTint:'rgba(8,22,38,.28)',weather:'rain',
 },
 2:{
  sector:2,
  skyTop:'#0a0812',skyBottom:'#1e1925',abyssGlow:'rgba(229,116,52,.22)',
  structureFar:'rgba(26,22,33,.84)',structureMid:'rgba(39,33,42,.88)',
  keyLight:'#ff9f5a',keyRgb:'255,159,90',
  fillLight:'#7ab6d9',fillRgb:'122,182,217',
  accentGlow:'#ffcb82',ambientTint:'rgba(26,18,16,.24)',weather:'sparks',
 },
 3:{
  sector:3,
  skyTop:'#080816',skyBottom:'#181730',abyssGlow:'rgba(142,102,232,.24)',
  structureFar:'rgba(22,20,42,.84)',structureMid:'rgba(34,30,58,.88)',
  keyLight:'#d18cff',keyRgb:'209,140,255',
  fillLight:'#ffd07a',fillRgb:'255,208,122',
  accentGlow:'#eaa0ff',ambientTint:'rgba(16,13,34,.24)',weather:'storm',
 },
 4:{
  sector:4,
  skyTop:'#040d10',skyBottom:'#0c2329',abyssGlow:'rgba(42,196,162,.21)',
  structureFar:'rgba(10,30,36,.86)',structureMid:'rgba(16,44,50,.90)',
  keyLight:'#63f2ca',keyRgb:'99,242,202',
  fillLight:'#52b8d9',fillRgb:'82,184,217',
  accentGlow:'#80efcf',ambientTint:'rgba(5,22,24,.28)',weather:'mist',
 },
 5:{
  sector:5,
  skyTop:'#0c040e',skyBottom:'#211022',abyssGlow:'rgba(235,68,126,.28)',
  structureFar:'rgba(28,12,31,.86)',structureMid:'rgba(42,18,45,.90)',
  keyLight:'#ff6e9c',keyRgb:'255,110,156',
  fillLight:'#ffbf7a',fillRgb:'255,191,122',
  accentGlow:'#ff9bc6',ambientTint:'rgba(24,8,20,.28)',weather:'embers',
 },
};

const DECK_PROP_RISE:Readonly<Record<OmegaFieldObstacle['kind'],number>>={
 container:78,scaffold:127,machine:63,barrier:29,
};

const GROUND_PROP_RISE:Readonly<Record<OmegaFieldObstacle['kind'],number>>={
 container:72,scaffold:95,machine:80,barrier:38,
};

const WET_PUDDLES:readonly (readonly [number,number,number,number,number])[]=[
 [185,332,78,15,-.08],
 [455,674,94,17,.06],
 [815,282,102,16,-.09],
 [1175,442,110,18,.04],
 [645,488,88,15,-.05],
 [320,785,84,14,.07],
 [1035,772,92,16,-.06],
 [975,168,74,13,.08],
];

const LAMP_POOLS:readonly (readonly [number,number,number,boolean])[]=[
 [265,170,225,false],
 [660,275,245,true],
 [1040,225,230,false],
 [415,635,235,true],
 [1135,695,240,true],
];

const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));
const wrapMod=(value:number,span:number)=>((value%span)+span)%span-span;

export function omega3DBudget(width:number,height:number):Omega3DBudget {
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)
  throw new RangeError('Invalid 3D atmosphere viewport');
 const pixels=width*height;
 if(pixels<370_000){
  return {
   tier:'mobile',weatherCount:12,puddles:4,lights:3,
   godRays:2,parallaxBeams:5,shadowBlur:false,
  };
 }
 if(pixels<900_000){
  return {
   tier:'tablet',weatherCount:22,puddles:6,lights:4,
   godRays:3,parallaxBeams:7,shadowBlur:true,
  };
 }
 return {
  tier:'desktop',weatherCount:34,puddles:8,lights:5,
  godRays:4,parallaxBeams:9,shadowBlur:true,
 };
}

export function omega3DSectorTheme(sector:number):Omega3DSectorTheme {
 if(!Number.isInteger(sector)||sector<1||sector>5)
  throw new RangeError('Invalid sector for 3D atmosphere theme');
 return SECTOR_THEMES[sector as 1|2|3|4|5];
}

function propTopRise(plan:OmegaFieldPlan,kind:OmegaFieldObstacle['kind']):number {
 return omegaConnectedDeckElevation(plan.wave)>0?DECK_PROP_RISE[kind]:GROUND_PROP_RISE[kind];
}

function drawPolygon(ctx:CanvasRenderingContext2D,coords:readonly number[]):void {
 ctx.beginPath();
 ctx.moveTo(coords[0]!,coords[1]!);
 for(let i=2;i<coords.length;i+=2)ctx.lineTo(coords[i]!,coords[i+1]!);
 ctx.closePath();
 ctx.fill();
}

function drawLine(ctx:CanvasRenderingContext2D,ax:number,ay:number,bx:number,by:number):void {
 ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.stroke();
}

/**
 * Multi-plane 3D parallax backdrop rendered in screen coordinates behind the
 * tilted 3/4 arena deck. Gives elevated, crane, underground, and Omega Core
 * arenas unmistakable spatial depth around and beneath the combat deck.
 */
export function drawOmega3DBackdrop(
 ctx:CanvasRenderingContext2D,
 plan:OmegaFieldPlan,
 camera:OmegaCameraState,
 width:number,
 height:number,
 seconds:number,
 budget:Omega3DBudget,
 hasPaintedVista=false,
):void {
 if(!Number.isFinite(seconds)||!Number.isFinite(width)||!Number.isFinite(height)||
    width<=0||height<=0||!Number.isFinite(camera.scale)||
    !Number.isFinite(camera.projectedOffsetX)||!Number.isFinite(camera.projectedOffsetY))
  return;
 const theme=omega3DSectorTheme(plan.sector);
 const elevated=omegaConnectedDeckElevation(plan.wave)>0;
 const camPxX=camera.projectedOffsetX*camera.scale;
 const camPxY=camera.projectedOffsetY*camera.scale;

 ctx.save();
 ctx.setTransform(1,0,0,1,0,0);

 // 1. Deep atmospheric skybox / mood glaze (translucent when painterly vista is underneath).
 if(hasPaintedVista){
  const glaze=ctx.createLinearGradient(0,0,0,height);
  glaze.addColorStop(0,'rgba(4,8,16,.44)');
  glaze.addColorStop(.52,'rgba(8,14,24,.18)');
  glaze.addColorStop(1,'rgba(4,8,16,.46)');
  ctx.fillStyle=glaze;
  ctx.fillRect(0,0,width,height);
 }else{
  const skyGrad=ctx.createLinearGradient(0,0,0,height);
  skyGrad.addColorStop(0,theme.skyTop);
  skyGrad.addColorStop(.55,theme.skyBottom);
  skyGrad.addColorStop(1,theme.skyTop);
  ctx.fillStyle=skyGrad;
  ctx.fillRect(0,0,width,height);
 }

 // 2. Deep under-deck chasm bounce glow so elevated platforms float over abyss.
 const abyss=ctx.createRadialGradient(
  width*.52,elevated?height*.78:height*.35,Math.min(width,height)*.08,
  width*.52,elevated?height*.78:height*.35,Math.max(width,height)*.78,
 );
 abyss.addColorStop(0,theme.abyssGlow);
 abyss.addColorStop(1,'rgba(0,0,0,0)');
 ctx.fillStyle=abyss;
 ctx.fillRect(0,0,width,height);

 // 3. Far Parallax Plane (0.14x): Monumental industrial / reactor silhouettes.
 const farStride=220;
 const farShiftX=wrapMod(camPxX*.14,farStride);
 const farShiftY=clamp(camPxY*.07,-height*.06,height*.06);
 ctx.save();
 ctx.translate(farShiftX,farShiftY);
 const farCount=Math.ceil(width/farStride)+3;
 if(theme.sector===5){
  // Omega Core concentric rotating reactor halo in the upper center horizon.
  const cx=width*.5-farShiftX*.35;
  const cy=height*.24;
  const baseR=Math.min(width,height)*.26;
  ctx.lineWidth=4;
  for(let ring=0;ring<3;ring++){
   const radius=baseR*(.65+ring*.24);
   const start=seconds*(ring%2===0?.24:-.18)+ring*1.1;
   ctx.strokeStyle=ring===1?'rgba(255,155,198,.24)':'rgba(255,110,156,.16)';
   ctx.beginPath();ctx.arc(cx,cy,radius,start,start+Math.PI*1.35);ctx.stroke();
  }
 }
 for(let i=-1;i<farCount;i++){
  const bx=i*farStride;
  const seedMod=(i*37+plan.sector*13)%5;
  const bw=118+(Math.abs(seedMod)*22);
  const bh=height*(.28+Math.abs((i*19+plan.sector*7)%4)*.08);
  const by=height*.36-bh*.55;
  ctx.fillStyle=theme.structureFar;
  ctx.fillRect(bx,by,bw,bh+height*.55);
  ctx.strokeStyle=`rgba(${theme.fillRgb},.15)`;
  ctx.lineWidth=1.2;
  ctx.strokeRect(bx+1,by+1,bw-2,bh);
  if(theme.sector===4){
   // Vaulted subterranean tunnel ribs.
   ctx.beginPath();
   ctx.arc(bx+bw*.5,by+30,bw*.48,Math.PI,0);
   ctx.stroke();
  }else if(theme.sector===3){
   // High-altitude crane jibs & counterweight silhouettes.
   ctx.strokeStyle=`rgba(${theme.keyRgb},.18)`;
   ctx.lineWidth=3;
   drawLine(ctx,bx+bw*.5,by,bx+bw*1.25,by-26);
  }
  if(i%2===0&&budget.tier!=='mobile'){
   const beaconAlpha=.25+.22*Math.sin(seconds*2.3+i);
   ctx.fillStyle=`rgba(${theme.keyRgb},${beaconAlpha.toFixed(2)})`;
   ctx.fillRect(bx+bw*.45,by+10,6,6);
  }
 }
 ctx.restore();

 // 4. Mid Parallax Plane (0.34x): Diagonal structural trusses & searchlight beams.
 const midStride=Math.max(160,width/Math.max(3,budget.parallaxBeams));
 const midShiftX=wrapMod(camPxX*.34,midStride);
 const midShiftY=clamp(camPxY*.15,-height*.09,height*.09);
 ctx.save();
 ctx.translate(midShiftX,midShiftY);
 const midCount=Math.ceil(width/midStride)+3;
 for(let i=-1;i<midCount;i++){
  const mx=i*midStride;
  // Diagonal volumetric light cone cutting through darkness.
  const cone=ctx.createLinearGradient(mx,0,mx+midStride*.7,height*.82);
  cone.addColorStop(0,`rgba(${i%2===0?theme.fillRgb:theme.keyRgb},.065)`);
  cone.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=cone;
  drawPolygon(ctx,[
   mx,0,mx+midStride*.34,0,
   mx+midStride*1.05,height*.85,mx+midStride*.42,height*.85,
  ]);
  // Structural girder column.
  ctx.fillStyle=theme.structureMid;
  ctx.fillRect(mx,0,18,height);
  ctx.strokeStyle=`rgba(${theme.fillRgb},.20)`;
  ctx.lineWidth=1.4;
  drawLine(ctx,mx+18,0,mx+midStride*.35,height*.42);
  drawLine(ctx,mx+midStride*.35,0,mx+18,height*.42);
 }
 ctx.restore();

 // 5. Chasm Perspective Layer (0.56x) beneath elevated Sector 2-5 platforms.
 if(elevated){
  const chasmShift=wrapMod(camPxX*.56,280);
  ctx.save();
  ctx.translate(chasmShift,0);
  ctx.strokeStyle=`rgba(${theme.keyRgb},.15)`;
  ctx.lineWidth=2;
  const cols=Math.ceil(width/280)+3;
  for(let i=-1;i<cols;i++){
   const gx=i*280;
   drawLine(ctx,gx,height*.66,gx+120,height);
   drawLine(ctx,gx+140,height*.66,gx+20,height);
  }
  ctx.restore();
 }

 ctx.restore();
}

/**
 * Tactile world-space floor plates, animated wet puddle specular glints,
 * overhead light pools, deck rim ambient occlusion, and grounded directional
 * obstacle shadows (for Sectors 2-5). Runs on top of drawOmegaFieldGround.
 */
export function drawOmega3DGroundSurface(
 ctx:CanvasRenderingContext2D,
 plan:OmegaFieldPlan,
 seconds:number,
 budget:Omega3DBudget,
):void {
 if(!Number.isFinite(seconds))return;
 const theme=omega3DSectorTheme(plan.sector);
 ctx.save();

 // 1. Subtle sector atmospheric floor tint.
 ctx.fillStyle=theme.ambientTint;
 ctx.fillRect(0,0,FIELD_W,FIELD_H);

 // 2. Recessed 3D steel deck armor bays & tactile beveled floor seams.
 ctx.strokeStyle=`rgba(${theme.fillRgb},.16)`;
 ctx.lineWidth=1.5;
 const platePositions:readonly (readonly [number,number,number,number])[]=[
  [76,72,380,196],[505,72,380,196],[935,72,390,196],
  [76,622,380,204],[505,622,380,204],[935,622,390,204],
 ];
 for(const [px,py,pw,ph] of platePositions){
  const plateGrad=ctx.createLinearGradient(px,py,px,py+ph);
  plateGrad.addColorStop(0,'rgba(4,10,18,.28)');
  plateGrad.addColorStop(.5,'rgba(12,26,38,.09)');
  plateGrad.addColorStop(1,`rgba(${theme.fillRgb},.07)`);
  ctx.fillStyle=plateGrad;
  ctx.fillRect(px,py,pw,ph);
  ctx.strokeRect(px,py,pw,ph);
  // Corner deck fastener glints on tablet/desktop.
  if(budget.tier!=='mobile'){
   ctx.fillStyle=`rgba(${theme.fillRgb},.28)`;
   ctx.fillRect(px+7,py+7,4,4);
   ctx.fillRect(px+pw-11,py+7,4,4);
   ctx.fillRect(px+7,py+ph-11,4,4);
   ctx.fillRect(px+pw-11,py+ph-11,4,4);
  }
 }

 // 3. Arena perimeter Ambient Occlusion + metallic rim lip (3D platform silhouette).
 const topAo=ctx.createLinearGradient(0,0,0,76);
 topAo.addColorStop(0,'rgba(2,6,12,.56)');
 topAo.addColorStop(1,'rgba(2,6,12,0)');
 ctx.fillStyle=topAo;ctx.fillRect(0,0,FIELD_W,76);
 const bottomAo=ctx.createLinearGradient(0,FIELD_H-82,0,FIELD_H);
 bottomAo.addColorStop(0,'rgba(2,6,12,0)');
 bottomAo.addColorStop(1,'rgba(2,6,12,.64)');
 ctx.fillStyle=bottomAo;ctx.fillRect(0,FIELD_H-82,FIELD_W,82);
 ctx.strokeStyle=`rgba(${theme.fillRgb},.34)`;
 ctx.lineWidth=3;
 drawLine(ctx,6,4,FIELD_W-6,4);
 ctx.strokeStyle=`rgba(${theme.keyRgb},.30)`;
 drawLine(ctx,6,FIELD_H-5,FIELD_W-6,FIELD_H-5);

 // 4. Wet specular puddles / oil slicks with subtle animated reflection shimmer.
 for(let i=0;i<budget.puddles&&i<WET_PUDDLES.length;i++){
  const [px,py,rx,ry,tilt]=WET_PUDDLES[i]!;
  const ripple=.55+.45*Math.sin(seconds*2.1+i*1.3);
  const puddleGrad=ctx.createRadialGradient(px-rx*.2,py-ry*.2,3,px,py,rx);
  puddleGrad.addColorStop(0,`rgba(${i%2===0?theme.fillRgb:theme.keyRgb},${(.19+.07*ripple).toFixed(3)})`);
  puddleGrad.addColorStop(.72,'rgba(8,18,29,.26)');
  puddleGrad.addColorStop(1,'rgba(8,18,29,0)');
  ctx.fillStyle=puddleGrad;
  ctx.beginPath();ctx.ellipse(px,py,rx,ry,tilt,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=`rgba(${theme.fillRgb},${(.22+.12*ripple).toFixed(2)})`;
  ctx.lineWidth=1.2;
  drawLine(ctx,px-rx*.48,py+2,px+rx*.32,py-1);
 }

 // 5. Sector overhead floodlight floor pools.
 for(let i=0;i<budget.lights&&i<LAMP_POOLS.length;i++){
  const [lx,ly,lr,warm]=LAMP_POOLS[i]!;
  const flicker=.94+.06*Math.sin(seconds*5.3+i*2.1);
  const rgb=warm?theme.keyRgb:theme.fillRgb;
  const g=ctx.createRadialGradient(lx,ly,8,lx,ly,lr*flicker);
  g.addColorStop(0,`rgba(${rgb},.16)`);
  g.addColorStop(.55,`rgba(${rgb},.06)`);
  g.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=g;
  ctx.fillRect(lx-lr,ly-lr,lr*2,lr*2);
 }

 // 6. Grounded directional cast shadows & base AO skirts on Sectors 2-5
 // (Sector 1 uses drawOmegaM12TerrainShadows unchanged).
 if(plan.sector!==1){
  for(const o of plan.obstacles){
   const rise=propTopRise(plan,o.kind);
   const skewShadowX=rise*.45+18;
   const skewShadowY=rise*.24+12;
   ctx.fillStyle='rgba(2,6,14,.42)';
   drawPolygon(ctx,[
    o.x+o.width,o.y+10,
    o.x+o.width+skewShadowX,o.y+skewShadowY+20,
    o.x+o.width+skewShadowX,o.y+o.height+skewShadowY,
    o.x+24,o.y+o.height+skewShadowY,
    o.x,o.y+o.height,
    o.x+o.width,o.y+o.height,
   ]);
   // Ground base AO oval under each obstacle footprint.
   ctx.fillStyle='rgba(0,4,10,.36)';
   ctx.beginPath();
   ctx.ellipse(o.x+o.width*.52,o.y+o.height+6,o.width*.56,Math.max(11,o.height*.2),-.05,0,Math.PI*2);
   ctx.fill();
  }
 }

 ctx.restore();
}

/**
 * Adds directional 3D volume gradients, bevel rim highlights, grounded base AO,
 * and kind-specific industrial details inside an existing obstacle footprint.
 */
export function drawOmega3DPropRelief(
 ctx:CanvasRenderingContext2D,
 plan:OmegaFieldPlan,
 obstacle:OmegaFieldObstacle,
 seconds:number,
 budget:Omega3DBudget,
):void {
 if(!Number.isFinite(seconds)||!plan.obstacles.includes(obstacle))return;
 const theme=omega3DSectorTheme(plan.sector);
 const {x,y,width:w,height:h,kind}=obstacle;
 const rise=propTopRise(plan,kind);
 const top=y-rise;
 const bottom=y+h;

 ctx.save();
 ctx.beginPath();
 ctx.rect(x,top,w,bottom-top);
 ctx.clip();

 // Vertical 3D form lighting (cool top rim -> darker grounded base AO).
 const shade=ctx.createLinearGradient(x,top,x,bottom);
 shade.addColorStop(0,'rgba(218,242,255,.16)');
 shade.addColorStop(.32,'rgba(0,0,0,0)');
 shade.addColorStop(1,'rgba(2,6,14,.44)');
 ctx.fillStyle=shade;
 ctx.fillRect(x,top,w,bottom-top);

 // Top-left directional rim specular & right-side depth face darkening.
 ctx.fillStyle='rgba(2,7,15,.22)';
 ctx.fillRect(x+w-Math.max(12,w*.16),top,Math.max(12,w*.16),bottom-top);
 ctx.strokeStyle=`rgba(${theme.fillRgb},.44)`;
 ctx.lineWidth=1.8;
 drawLine(ctx,x+2,top+2,x+w-2,top+2);
 ctx.strokeStyle='rgba(0,0,0,.48)';
 ctx.lineWidth=2.5;
 drawLine(ctx,x+2,bottom-1,x+w-2,bottom-1);

 // Kind-specific crisp 3D surface reliefs.
 if(kind==='container'){
  const ribs=budget.tier==='mobile'?4:7;
  for(let i=1;i<ribs;i++){
   const rx=x+i*w/ribs;
   ctx.strokeStyle='rgba(255,255,255,.12)';
   ctx.lineWidth=1.2;
   drawLine(ctx,rx,top+16,rx,bottom-6);
   ctx.strokeStyle='rgba(2,6,14,.32)';
   drawLine(ctx,rx+2,top+16,rx+2,bottom-6);
  }
  ctx.fillStyle=`rgba(${theme.keyRgb},.42)`;
  ctx.fillRect(x+8,top+10,16,4);
 }else if(kind==='scaffold'){
  const lamps=budget.tier==='mobile'?2:3;
  for(let i=0;i<lamps;i++){
   const lx=x+24+i*(w-48)/Math.max(1,lamps-1);
   ctx.fillStyle=`rgba(${theme.keyRgb},.68)`;
   ctx.fillRect(lx-5,top+6,10,4);
  }
 }else if(kind==='machine'){
  const pulse=.55+.45*Math.sin(seconds*3.4+x*.015);
  const cx=x+w*.5;
  const cy=y+h*.22;
  ctx.fillStyle=`rgba(${theme.keyRgb},${(.34+.34*pulse).toFixed(2)})`;
  ctx.fillRect(cx-w*.18,cy-4,w*.36,8);
  ctx.strokeStyle=`rgba(${theme.fillRgb},.55)`;
  ctx.lineWidth=1.4;
  ctx.strokeRect(cx-w*.18,cy-4,w*.36,8);
 }else if(kind==='barrier'){
  ctx.fillStyle=`rgba(${theme.keyRgb},.24)`;
  drawLine(ctx,x+8,top+4,x+w-8,top+4);
 }

 ctx.restore();
}

/**
 * Dynamic floor lighting anchored to the real hero, enemies, active boss,
 * and genuine gun muzzle / blade slash timing. Runs on ground under telegraphs.
 */
export function drawOmega3DActorLighting(
 ctx:CanvasRenderingContext2D,
 plan:OmegaFieldPlan,
 player:OmegaFieldPoint,
 facing:OmegaFieldPoint,
 enemies:readonly Omega3DEnemyPresence[],
 seconds:number,
 combatFlash:Omega3DCombatFlash,
 budget:Omega3DBudget,
):void {
 if(!Number.isFinite(seconds)||!Number.isFinite(player.x)||!Number.isFinite(player.y))
  return;
 const theme=omega3DSectorTheme(plan.sector);
 ctx.save();

 // 1. Grounded contact shadows & threat rings across Sectors 2-5
 // (Sector 1 uses drawOmegaG4ActorGrounding untouched).
 if(plan.sector!==1){
  // Hero double-ellipse grounded shadow & ice-cyan command ring.
  ctx.save();
  ctx.translate(player.x,player.y);
  ctx.fillStyle='rgba(0,6,14,.48)';
  ctx.beginPath();ctx.ellipse(2,6,31,10,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='rgba(128,236,248,.42)';
  ctx.lineWidth=1.8;
  ctx.beginPath();ctx.ellipse(0,5,34,12,0,0,Math.PI*2);ctx.stroke();
  ctx.restore();

  for(const e of enemies){
   if(e.hp<=0||!Number.isFinite(e.x)||!Number.isFinite(e.y))continue;
   const r=clamp(e.radius??24,18,46);
   ctx.save();
   ctx.translate(e.x,e.y);
   ctx.fillStyle='rgba(0,5,12,.42)';
   ctx.beginPath();ctx.ellipse(2,5,r*1.12,Math.max(6,r*.33),0,0,Math.PI*2);ctx.fill();
   if(e.isStageBoss){
    const pulse=.65+.35*Math.sin(seconds*4.5);
    ctx.strokeStyle=`rgba(255,112,158,${(.45+.25*pulse).toFixed(2)})`;
    ctx.lineWidth=2.5;
    ctx.beginPath();ctx.ellipse(0,5,r*1.58,r*.54,0,0,Math.PI*2);ctx.stroke();
   }
   ctx.restore();
  }
 }

 // 2. Hero Diablo-style dynamic tactical ground torch & forward aim cone (ALL sectors).
 const poolR=162;
 const heroPool=ctx.createRadialGradient(player.x,player.y,10,player.x,player.y,poolR);
 heroPool.addColorStop(0,`rgba(${theme.fillRgb},.20)`);
 heroPool.addColorStop(.55,`rgba(${theme.fillRgb},.07)`);
 heroPool.addColorStop(1,'rgba(0,0,0,0)');
 ctx.fillStyle=heroPool;
 ctx.fillRect(player.x-poolR,player.y-poolR,poolR*2,poolR*2);

 const fxLen=Number.isFinite(facing.x)&&Number.isFinite(facing.y)?Math.hypot(facing.x,facing.y):0;
 if(fxLen>.01){
  const ux=facing.x/fxLen,uy=facing.y/fxLen;
  const dist=budget.tier==='mobile'?130:175;
  const spread=48;
  const tipX=player.x+ux*dist,tipY=player.y+uy*dist;
  const coneGrad=ctx.createLinearGradient(player.x,player.y,tipX,tipY);
  coneGrad.addColorStop(0,`rgba(${theme.fillRgb},.15)`);
  coneGrad.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=coneGrad;
  drawPolygon(ctx,[
   player.x,player.y,
   tipX-uy*spread,tipY+ux*spread,
   tipX+uy*spread,tipY-ux*spread,
  ]);
 }

 // 3. Genuine combat light bounce on floor when real Watch fire or blade triggers.
 const muzzle=Number.isFinite(combatFlash.muzzle)?clamp(combatFlash.muzzle,0,1):0;
 const blade=Number.isFinite(combatFlash.blade)?clamp(combatFlash.blade,0,1):0;
 if(muzzle>0){
  const mr=135;
  const mg=ctx.createRadialGradient(player.x,player.y,6,player.x,player.y,mr);
  mg.addColorStop(0,`rgba(130,248,255,${(.34*muzzle).toFixed(3)})`);
  mg.addColorStop(1,'rgba(130,248,255,0)');
  ctx.fillStyle=mg;
  ctx.fillRect(player.x-mr,player.y-mr,mr*2,mr*2);
 }
 if(blade>0){
  const br=148;
  const bg=ctx.createRadialGradient(player.x,player.y,10,player.x,player.y,br);
  bg.addColorStop(0,`rgba(196,128,255,${(.36*blade).toFixed(3)})`);
  bg.addColorStop(1,'rgba(196,128,255,0)');
  ctx.fillStyle=bg;
  ctx.fillRect(player.x-br,player.y-br,br*2,br*2);
 }

 ctx.restore();
}

/**
 * Tactical floor silhouette ring when AIRA passes behind tall solids on
 * Sectors 2-5 (Sector 1 uses drawOmegaM12OcclusionBeacon unchanged).
 */
export function drawOmega3DOcclusionGuide(
 ctx:CanvasRenderingContext2D,
 plan:OmegaFieldPlan,
 actor:OmegaFieldPoint,
 seconds:number,
):boolean {
 if(plan.sector===1||!Number.isFinite(actor.x)||!Number.isFinite(actor.y)||!Number.isFinite(seconds))
  return false;
 const occluded=plan.obstacles.some(o=>{
  const rise=propTopRise(plan,o.kind);
  return actor.x+20>o.x&&actor.x-20<o.x+o.width&&
   actor.y>=o.y-rise-15&&actor.y<o.y+o.height;
 });
 if(!occluded)return false;
 const pulse=.58+.35*Math.sin(seconds*6.2);
 ctx.save();
 ctx.strokeStyle=`rgba(138,248,255,${pulse.toFixed(2)})`;
 ctx.lineWidth=2.6;
 ctx.setLineDash([7,5]);
 ctx.beginPath();ctx.ellipse(actor.x,actor.y+2,27,11,0,0,Math.PI*2);ctx.stroke();
 ctx.setLineDash([]);
 ctx.fillStyle='rgba(148,246,255,.15)';
 ctx.beginPath();ctx.ellipse(actor.x,actor.y+2,21,8,0,0,Math.PI*2);ctx.fill();
 ctx.restore();
 return true;
}

/**
 * Multi-layered energy bolt tracer projectile (replaces flat single circle).
 * Uses real projectile radius and velocity without mutating physics.
 */
export function drawOmega3DProjectile(
 ctx:CanvasRenderingContext2D,
 x:number,
 y:number,
 radius:number,
 vx:number,
 vy:number,
 isEnemy=false,
):void {
 if(!Number.isFinite(x)||!Number.isFinite(y)||!Number.isFinite(radius)||radius<=0)return;
 const speed=Number.isFinite(vx)&&Number.isFinite(vy)?Math.hypot(vx,vy):0;
 ctx.save();
 if(speed>.01){
  const tx=x-(vx/speed)*(radius*3.1+10);
  const ty=y-(vy/speed)*(radius*3.1+10);
  const tail=ctx.createLinearGradient(x,y,tx,ty);
  tail.addColorStop(0,isEnemy?'rgba(255,120,165,.88)':'rgba(128,246,255,.92)');
  tail.addColorStop(1,'rgba(0,0,0,0)');
  ctx.strokeStyle=tail;
  ctx.lineWidth=Math.max(2,radius*1.15);
  ctx.lineCap='round';
  drawLine(ctx,x,y,tx,ty);
 }
 ctx.fillStyle=isEnemy?'rgba(255,86,138,.36)':'rgba(92,235,255,.36)';
 ctx.beginPath();ctx.arc(x,y,radius*1.95,0,Math.PI*2);ctx.fill();
 ctx.fillStyle=isEnemy?'#ffe2ec':'#ebffff';
 ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);ctx.fill();
 ctx.restore();
}

/**
 * Screen-space near-camera parallax edge framing (Sectors 2-5), volumetric
 * atmospheric god-rays, deterministic weather motes/rain/sparks/embers, and
 * Diablo-style dark edge vignette across ALL 5 sectors.
 */
export function drawOmega3DForegroundAtmosphere(
 ctx:CanvasRenderingContext2D,
 plan:OmegaFieldPlan,
 camera:OmegaCameraState,
 width:number,
 height:number,
 seconds:number,
 bossActive:boolean,
 budget:Omega3DBudget,
):void {
 if(!Number.isFinite(seconds)||!Number.isFinite(width)||!Number.isFinite(height)||
    width<=0||height<=0||!Number.isFinite(camera.scale)||
    !Number.isFinite(camera.projectedOffsetX)||!Number.isFinite(camera.projectedOffsetY))
  return;
 const theme=omega3DSectorTheme(plan.sector);
 ctx.save();
 ctx.setTransform(1,0,0,1,0,0);

 // 1. Foreground near-camera parallax edge framing on Sectors 2-5
 // (Sector 1 keeps drawOmegaG3ParallaxArchitecture intact).
 if(plan.sector!==1){
  const camPxX=camera.projectedOffsetX*camera.scale;
  const nearShiftX=wrapMod(camPxX*.82,width*.32);
  // Top overhead lintel silhouettes (clipped strictly to top 13.5%).
  ctx.save();
  ctx.beginPath();ctx.rect(0,0,width,height*.135);ctx.clip();
  ctx.translate(nearShiftX,0);
  const topGrad=ctx.createLinearGradient(0,0,0,height*.13);
  topGrad.addColorStop(0,'rgba(4,8,16,.88)');
  topGrad.addColorStop(1,'rgba(8,16,28,.22)');
  ctx.fillStyle=topGrad;
  ctx.fillRect(-width*.35,0,width*1.7,height*.09);
  ctx.strokeStyle=`rgba(${theme.fillRgb},.34)`;
  ctx.lineWidth=2;
  drawLine(ctx,-width*.35,height*.09,width*1.35,height*.09);
  ctx.restore();

  // Left & right lateral foreground pillars (strictly outer 7.5% margins).
  ctx.save();
  ctx.beginPath();
  ctx.rect(0,0,width*.075,height);
  ctx.rect(width*.925,0,width*.075,height);
  ctx.clip();
  ctx.fillStyle=theme.structureMid;
  drawPolygon(ctx,[0,0,width*.055,0,width*.072,height*.42,0,height*.55]);
  drawPolygon(ctx,[width,0,width*.945,0,width*.928,height*.42,width,height*.55]);
  ctx.strokeStyle=`rgba(${theme.keyRgb},.32)`;
  ctx.lineWidth=2.5;
  drawLine(ctx,width*.055,0,width*.072,height*.42);
  drawLine(ctx,width*.945,0,width*.928,height*.42);
  ctx.restore();
 }

 // 2. Diagonal volumetric god-rays (very subtle alpha so telegraphs stay sharp).
 for(let i=0;i<budget.godRays;i++){
  const startX=width*(.12+i*.25)+Math.sin(seconds*.35+i)*22;
  const rayGrad=ctx.createLinearGradient(startX,0,startX+width*.22,height*.88);
  rayGrad.addColorStop(0,`rgba(${i%2===0?theme.fillRgb:theme.keyRgb},.065)`);
  rayGrad.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=rayGrad;
  drawPolygon(ctx,[
   startX,0,startX+width*.08,0,
   startX+width*.29,height,startX+width*.14,height,
  ]);
 }

 // 3. Painted rain-sheet overlay (Sectors 1 & 3) + ultra-fine tapered streaks.
 const paintedRain=drawOmegaPaintedRainOverlay(ctx,plan,camera,width,height,seconds,budget);
 const streakCount=paintedRain&&(theme.weather==='rain'||theme.weather==='storm')
  ?Math.max(8,Math.floor(budget.weatherCount*0.35))
  :budget.weatherCount;
 for(let i=0;i<streakCount;i++){
  const rainSpeed=(theme.weather==='storm'?860:690)+(i%5)*38;
  const windVX=theme.weather==='storm'?-215:-155;
  const px=((i*197+seconds*(theme.weather==='embers'?18:theme.weather==='rain'||theme.weather==='storm'?windVX:54+i%5*19))%(width+80)+width+80)%(width+80)-40;
  const dir=theme.weather==='embers'?-1:1;
  const py=((i*139+seconds*dir*(theme.weather==='rain'||theme.weather==='storm'?rainSpeed:62+i%4*18))%(height+60)+height+60)%(height+60)-30;
  const alpha=.16+(i%5)*.055;
  if(theme.weather==='rain'||theme.weather==='storm'){
   const dx=theme.weather==='storm'?-7.5:-4.8;
   const dy=theme.weather==='storm'?29:20;
   const grad=ctx.createLinearGradient(px,py,px+dx,py+dy);
   grad.addColorStop(0,'rgba(220,238,255,0)');
   grad.addColorStop(0.7,`rgba(226,242,255,${(alpha*0.72).toFixed(3)})`);
   grad.addColorStop(1,`rgba(248,252,255,${(alpha*1.12).toFixed(3)})`);
   ctx.strokeStyle=grad;
   ctx.lineWidth=theme.weather==='storm'?0.95:0.75;
   drawLine(ctx,px,py,px+dx,py+dy);
  }else if(theme.weather==='sparks'||theme.weather==='embers'){
   ctx.fillStyle=`rgba(${theme.keyRgb},${(alpha+.18).toFixed(2)})`;
   ctx.beginPath();ctx.arc(px+Math.sin(seconds*3+i)*4,py,1.8+(i%2)*.9,0,Math.PI*2);ctx.fill();
  }else{
   ctx.fillStyle=`rgba(${theme.fillRgb},${alpha.toFixed(2)})`;
   ctx.beginPath();ctx.arc(px+Math.sin(seconds*1.6+i)*7,py,2.2+(i%3)*.8,0,Math.PI*2);ctx.fill();
  }
 }

 // 4. Diablo-style dark edge vignette (with subtle crimson outer edge during bosses).
 const cx=width*.5,cy=height*.5;
 const vig=ctx.createRadialGradient(
  cx,cy,Math.min(width,height)*.36,
  cx,cy,Math.max(width,height)*.78,
 );
 vig.addColorStop(0,'rgba(0,0,0,0)');
 vig.addColorStop(.68,bossActive?'rgba(42,6,18,.14)':'rgba(3,7,14,.12)');
 vig.addColorStop(1,bossActive?'rgba(74,10,24,.46)':'rgba(3,6,12,.40)');
 ctx.fillStyle=vig;
 ctx.fillRect(0,0,width,height);

 ctx.restore();
}

import type {Hazard} from '../domain/patrol-survivors';
import type {OmegaZombieBrain} from '../domain/omega-protocol-zombie-ai';
import {omegaG5DevRequested,omegaG5Art} from './omega-protocol-m12-g5-art';

/**
 * Wave-15-only original POWER WARDEN silhouette. This is authored technical
 * QA geometry, not final character art: still driven by real CRANE_BOSS HP.
 * Drawn at the existing boss origin/scale to preserve collision honesty.
 */
export function drawOmegaPowerWarden(ctx:CanvasRenderingContext2D,time:number,phase2=false):void{
 const pulse=.5+.5*Math.sin(time*4);
 const glow=phase2?'#ff8de1':'#8af3f7';
 ctx.save();
 // Heavy ground-mounted reactor with two raised induction pylons.
 ctx.fillStyle='#12253a';ctx.fillRect(-30,-49,60,47);
 ctx.fillStyle='#3a5571';ctx.fillRect(-38,-71,76,28);
 ctx.strokeStyle=glow;ctx.lineWidth=4;ctx.strokeRect(-38,-71,76,28);
 for(const side of [-1,1]){
  ctx.fillStyle='#1c354d';ctx.fillRect(side<0?-53:37,-97,16,53);
  ctx.strokeStyle='#bddef4';ctx.lineWidth=4;
  ctx.beginPath();
  ctx.moveTo(side*45,-93);ctx.lineTo(side*63,-120);
  ctx.lineTo(side*77,-111);ctx.stroke();
  ctx.fillStyle=glow;ctx.fillRect(side<0?-80:70,-116,10,7);
 }
 // Core takes almost half the silhouette so the power-sweep phase reads
 // differently from wave 9's recognizable crane boom and hook arms.
 ctx.fillStyle='#090e23';ctx.beginPath();ctx.moveTo(0,-84);
 ctx.lineTo(30,-59);ctx.lineTo(0,-26);ctx.lineTo(-30,-59);ctx.closePath();ctx.fill();
 ctx.strokeStyle=glow;ctx.lineWidth=4;ctx.stroke();
 ctx.fillStyle=glow;ctx.globalAlpha=.6+.3*pulse;
 ctx.beginPath();ctx.arc(0,-58,12+3*pulse,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
 for(let i=0;i<3;i++){
  ctx.strokeStyle=phase2?'#f7afd9':'#87e1ee';
  ctx.globalAlpha=.45+i*.13;ctx.lineWidth=2.5;
  ctx.beginPath();ctx.arc(0,-58,22+i*10,time*.8+i,Math.PI*1.3+time*.8+i);ctx.stroke();
 }
 ctx.globalAlpha=1;
 ctx.fillStyle=phase2?'#ef84c6':'#8de9ec';ctx.fillRect(-29,-18,58,7);
 ctx.fillStyle='#cceaf2';ctx.font='bold 9px system-ui';
 ctx.textAlign='center';ctx.fillText('CORE 15',0,-88);
 ctx.restore();
}

/** OMEGA-exclusive visual mapping for the existing Watch engine type.
 * Every UNHELMETED hazard here is a FICTIONAL INFECTED WORKER ZOMBIE
 * with an unmistakable safety helmet and reflective vest.
 * This renderer is never imported into the ordinary Watch game view.
 * Geometry is an early QA placeholder, NOT high-resolution production art.
 */
export const OMEGA_INFECTED_VISUAL_ID='HELMET_ZOMBIE' as const;
export function drawOmegaHelmetZombie(
 ctx:CanvasRenderingContext2D,h:Hazard,time:number,
 brain?:OmegaZombieBrain,
):void {
 const variant=Array.from(h.id??'zombie').reduce((v,ch)=>v+ch.charCodeAt(0),0)%3;
 const vest=['#b56c31','#b8a43a','#638969'][variant]!;
 const helmet=brain?{
  drifter:'#ffd34b',sprinter:'#a3fb76',armored:'#ffc36a',stalker:'#ce9cff',
 }[brain.kind]:['#ffcb3e','#f6da68','#ff9d40'][variant]!;
 const sway=Math.sin(time*5+variant*2+h.x*.02)*2.5;
 const bob=Math.sin(time*7+variant)*1.4;
 ctx.save();
 ctx.translate(0,bob);
 // Animation hints are tied to the actual AI state, not a colour-only swap.
 if(brain?.kind==='sprinter')ctx.rotate(-.12);
 else if(brain?.kind==='stalker')ctx.rotate(.08*Math.sin(time*2));
 // Work trousers, mismatched steps and torn-looking but bloodless coveralls.
 ctx.fillStyle='#26343b';
 ctx.fillRect(-11,-15,9,20);ctx.fillRect(4,-13+sway*.25,9,19);
 ctx.fillStyle='#111b24';ctx.fillRect(-13,3,13,5);ctx.fillRect(4,3,13,5);
 // Contaminated coverall and high-visibility reflective vest.
 ctx.fillStyle=vest;
 ctx.beginPath();ctx.moveTo(-17,-40);ctx.lineTo(17,-40);
 ctx.lineTo(14,-15);ctx.lineTo(-14,-15);ctx.closePath();ctx.fill();
 ctx.fillStyle='#f3d9a1';ctx.fillRect(-14,-29,28,4);
 ctx.fillStyle='#bddfd6';ctx.fillRect(-3,-40,6,22);
 // Unsettling hunched reaches; distinctly hostile from ordinary Watch NPC.
 ctx.strokeStyle='#718f83';ctx.lineWidth=7;ctx.lineCap='round';
 ctx.beginPath();ctx.moveTo(-16,-36);ctx.lineTo(-21+sway,-21);
 ctx.lineTo(-30+sway*2,-13);ctx.moveTo(16,-36);
 ctx.lineTo(23-sway,-21);ctx.lineTo(31-sway*2,-18);ctx.stroke();
 // Ill complexion and bright infected eyes, with no blood or exposed injury.
 ctx.fillStyle='#789c87';ctx.beginPath();ctx.ellipse(0,-48,12,13,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#ecff86';ctx.fillRect(-8,-51,5,2.8);ctx.fillRect(4,-51,5,2.8);
 ctx.fillStyle='#1a2b2c';ctx.fillRect(-4,-42,8,2);
 // Four DISTINCT structural silhouettes: forearm runner fins, an armored
 // riot shield + bulky shoulders, or asymmetric stalker comms rig. The
 // mandatory helmet and reflective stripe are NEVER removed.
 if(brain?.kind==='sprinter'){
  ctx.fillStyle='#6bdd83';ctx.fillRect(-22,-36,8,17);ctx.fillRect(14,-36,8,17);
  ctx.strokeStyle='#adff9b';ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(-19,-10);ctx.lineTo(-27,-2);
  ctx.moveTo(18,-10);ctx.lineTo(26,-2);ctx.stroke();
 }else if(brain?.kind==='armored'){
  ctx.fillStyle='#718191';ctx.fillRect(-25,-44,14,24);ctx.fillRect(11,-44,14,24);
  ctx.fillStyle='#2e5165';ctx.fillRect(-31,-40,12,36);
  ctx.strokeStyle='#c9e4f1';ctx.lineWidth=3;ctx.strokeRect(-31,-40,12,36);
  ctx.fillStyle='#febd6d';ctx.fillRect(-27,-43,11,4);
 }else if(brain?.kind==='stalker'){
  ctx.fillStyle='#4e466f';ctx.fillRect(-22,-42,9,23);
  ctx.fillRect(14,-44,12,19);
  ctx.strokeStyle='#d49bff';ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(20,-43);ctx.lineTo(25,-69);
  ctx.lineTo(34,-70);ctx.stroke();
  ctx.fillStyle='#ff9df2';ctx.fillRect(31,-74,6,6);
 }
 // Safety helmet — full dome, protruding brim, light reflective patch,
 // chin strap. Always retained for every zombie appearance variant.
 ctx.fillStyle=helmet;ctx.beginPath();ctx.arc(0,-55,14,Math.PI,Math.PI*2);ctx.fill();
 ctx.fillRect(-15,-56,31,6);
 ctx.fillStyle='#fff8d2';ctx.fillRect(-4,-65,8,3);
 ctx.strokeStyle='#ffe6a7';ctx.lineWidth=2;
 ctx.beginPath();ctx.moveTo(-10,-55);ctx.lineTo(-9,-42);
 ctx.lineTo(10,-42);ctx.lineTo(10,-55);ctx.stroke();
 ctx.strokeStyle='rgba(138,255,182,.45)';ctx.lineWidth=2;
 ctx.beginPath();ctx.arc(0,-45,16+Math.sin(time*4)*1,0,Math.PI*2);ctx.stroke();
 ctx.restore();
}

/**
 * Original vector combat silhouettes for PROTOCOL's internal playable QA.
 * These are recognizable enemy archetypes, not approved production sprites
 * or licensed "Solo Leveling" monsters.
 */
export function drawOmegaProtocolEnemy(
 ctx:CanvasRenderingContext2D,h:Hazard,time:number,
 options:Readonly<{finalBoss?:boolean;zombie?:OmegaZombieBrain}>={} ,
):void {
 if(h.hp<=0)return;
 const boss=Boolean(h.isStageBoss);
 const scale=boss?1.7:Math.max(.8,Math.min(1.5,h.radius/24));
 const sway=Math.sin(time*3+h.x*.019+h.y*.003);
 ctx.save();
 ctx.scale(scale,scale);
 // Contact shadow and direction-independent feet.
 ctx.fillStyle='rgba(1,7,14,.55)';
 ctx.beginPath();ctx.ellipse(0,4,boss?46:23,boss?11:6,0,0,Math.PI*2);ctx.fill();
 if(h.type==='UNHELMETED'){
  if(options.zombie){
   const brain=options.zombie;
   if(brain.phase==='warning'){
    const progress=Math.max(0,Math.min(1,brain.timer/brain.warningDuration));
    ctx.strokeStyle=brain.kind==='armored'?'#ffa05b':'#ff6ecf';
    ctx.globalAlpha=.5+.4*Math.sin(time*13);
    ctx.lineWidth=4+3*(1-progress);
    ctx.beginPath();ctx.arc(0,-17,brain.attackRadius*.62,0,Math.PI*2);ctx.stroke();
    ctx.globalAlpha=1;
    ctx.strokeStyle='#fff2e1';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(0,-16);
    ctx.lineTo(brain.lockedX*28,-16+brain.lockedY*22);ctx.stroke();
   }else if(brain.phase==='charge'){
    ctx.strokeStyle='#ceffb3';ctx.lineWidth=6;
    ctx.beginPath();ctx.moveTo(-brain.lockedX*34,-18-brain.lockedY*27);
    ctx.lineTo(0,-18);ctx.stroke();
   }
  }
  const g5=typeof window!=='undefined'&&omegaG5DevRequested(window.location.search,
   import.meta.env.DEV||import.meta.env.VITE_OMEGA_PROTOCOL_LAB==='1');
  // Dev-only two independently posed original drifter sources; preserve the
  // native telegraph above, all real health bars, and original other species.
  if(!(g5&&omegaG5Art.drawDrifter(ctx,h,options.zombie)))
   drawOmegaHelmetZombie(ctx,h,time,options.zombie);
 }else if(h.type==='RUNAWAY_CART'){
  ctx.fillStyle='#39485a';ctx.fillRect(-28,-25,58,24);
  ctx.strokeStyle='#ffce73';ctx.lineWidth=4;ctx.strokeRect(-27,-25,54,24);
  ctx.fillStyle='#f8b45d';ctx.fillRect(-20,-38,38,14);
  ctx.fillStyle='#253b49';
  ctx.beginPath();ctx.arc(-18,3,8,0,Math.PI*2);ctx.arc(18,3,8,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#fff5ac';ctx.fillRect(15,-29,8,4);
  ctx.strokeStyle='#c5a772';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-29,-27);ctx.lineTo(-36,-42);ctx.stroke();
  if(h.variant==='reinforced_cart'){
   ctx.strokeStyle='#ff9681';ctx.lineWidth=4;ctx.strokeRect(-30,-28,62,30);
  }
 }else if(h.type==='GAS_LEAK'){
  ctx.fillStyle='#52606a';ctx.fillRect(-8,-21,18,23);
  ctx.fillStyle='#52ead4';ctx.beginPath();ctx.arc(2,-32,14,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=.38;
  for(let i=0;i<4;i++){
   const dx=Math.cos(time*1.7+i*2)*15;
   const dy=-32+Math.sin(time*1.4+i)*14;
   ctx.fillStyle=i%2?'#80e9f3':'#8cf4bd';
   ctx.beginPath();ctx.arc(dx,dy,14+i*2,0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=1;
  ctx.strokeStyle='#e3fff2';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,-30,13,0,Math.PI*2);ctx.stroke();
 }else if(h.type==='FALLING_DEBRIS'){
  ctx.fillStyle='#293d4b';
  ctx.beginPath();ctx.moveTo(-25,-2);ctx.lineTo(-25,-30);ctx.lineTo(-11,-42);ctx.lineTo(23,-31);
  ctx.lineTo(29,-10);ctx.lineTo(10,3);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#ef995a';ctx.lineWidth=4;ctx.stroke();
  ctx.strokeStyle='#879cab';ctx.lineWidth=3;ctx.beginPath();
  ctx.moveTo(-17,-28);ctx.lineTo(13,-10);ctx.moveTo(18,-25);ctx.lineTo(-8,-6);ctx.stroke();
  ctx.fillStyle='#e6aa73';ctx.fillRect(-12,-18,21,5);
 }else if(h.type==='CRANE_BOSS'&&options.finalBoss){
  drawOmegaPowerWarden(ctx,time,h.bossPhase===2);
 }else if(h.type==='CRANE_BOSS'){
  // Wave-9 crane boss: separate original boom-and-hook silhouette.
  ctx.fillStyle='#22283d';ctx.fillRect(-23,-48,46,51);
  ctx.fillStyle='#9e4968';ctx.fillRect(-31,-72,62,30);
  ctx.strokeStyle='#ffcf81';ctx.lineWidth=5;ctx.strokeRect(-31,-72,62,30);
  ctx.fillStyle='#3c4759';ctx.fillRect(-38,-49,76,15);
  ctx.fillStyle='#ffd580';ctx.fillRect(-13,-65,26,17);
  ctx.fillStyle='#ff72c8';ctx.beginPath();ctx.arc(0,-55,7+Math.sin(time*5)*1.3,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#8dcce0';ctx.lineWidth=8;
  ctx.beginPath();ctx.moveTo(-28,-65);ctx.lineTo(-58,-79+sway*2);
  ctx.moveTo(28,-65);ctx.lineTo(57,-88-sway*2);ctx.stroke();
  ctx.strokeStyle='#eac48c';ctx.lineWidth=5;
  ctx.beginPath();ctx.moveTo(-58,-79+sway*2);ctx.lineTo(-60,-108);
  ctx.moveTo(57,-88-sway*2);ctx.lineTo(62,-111);ctx.stroke();
  ctx.fillStyle='#a7d9e8';ctx.fillRect(-64,-111,10,8);ctx.fillRect(57,-117,10,8);
  ctx.strokeStyle=h.bossPhase===2?'#ffa5ef':'#f4bf81';ctx.lineWidth=3;
  ctx.beginPath();ctx.arc(0,-54,43,-Math.PI*.9,Math.PI*.2);ctx.stroke();
 }
 if((h.hitFlashTimer??0)>0){
  ctx.globalAlpha=.34;ctx.fillStyle='#fff8df';
  ctx.fillRect(boss?-60:-28,boss?-115:-45,boss?120:56,boss?120:48);
  ctx.globalAlpha=1;
 }
 ctx.fillStyle='#0b1423';ctx.fillRect(boss?-45:-27,boss?-125:-55,boss?90:54,6);
 ctx.fillStyle=boss?'#ffa2c7':'#8df5d4';
 ctx.fillRect(boss?-45:-27,boss?-125:-55,(boss?90:54)*Math.max(0,h.hp/Math.max(1,h.maxHp)),6);
 ctx.restore();
}

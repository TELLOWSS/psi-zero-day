import type {Hazard} from '../domain/patrol-survivors';
import type {OmegaZombieBrain} from '../domain/omega-protocol-zombie-ai';
import {omegaG5VectorStudyRequested,omegaG5Art} from './omega-protocol-m12-g5-art';
import {omegaInfectedCandidateReview} from './omega-infected-candidate-review';
import {drawOmegaAuthoredHazardOrBoss,drawOmegaAuthoredZombie} from './omega-protocol-entity-art';

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
function traceHpRoundedRect(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number):void{
 const rr=Math.max(0,Math.min(r,w*.5,h*.5));
 ctx.beginPath();
 ctx.moveTo(x+rr,y);
 ctx.lineTo(x+w-rr,y);
 ctx.quadraticCurveTo(x+w,y,x+w,y+rr);
 ctx.lineTo(x+w,y+h-rr);
 ctx.quadraticCurveTo(x+w,y+h,x+w-rr,y+h);
 ctx.lineTo(x+rr,y+h);
 ctx.quadraticCurveTo(x,y+h,x,y+h-rr);
 ctx.lineTo(x,y+rr);
 ctx.quadraticCurveTo(x,y,x+rr,y);
 ctx.closePath();
}

const enemyDrainTracker = new Map<string, { ratio: number; seenAt: number }>();

function resolveEnemyTrailingRatio(id: string | undefined, hpRatio: number, time: number): number {
 if (!id || !Number.isFinite(time)) return hpRatio;
 const key = id;
 const prev = enemyDrainTracker.get(key);
 if (!prev) {
  if (enemyDrainTracker.size >= 180) {
   for (const [k, v] of enemyDrainTracker) {
    if (time - v.seenAt > 6) enemyDrainTracker.delete(k);
    if (enemyDrainTracker.size < 140) break;
   }
  }
  enemyDrainTracker.set(key, { ratio: hpRatio, seenAt: time });
  return hpRatio;
 }
 const dt = Math.max(0, Math.min(0.25, time - prev.seenAt));
 let ratio = prev.ratio;
 if (hpRatio > ratio) {
  ratio = hpRatio;
 } else if (ratio > hpRatio) {
  ratio = Math.max(hpRatio, ratio - dt * 1.9);
 }
 enemyDrainTracker.set(key, { ratio, seenAt: time });
 return ratio;
}

export function drawOmegaProtocolEnemy(
 ctx:CanvasRenderingContext2D,h:Hazard,time:number,
 options:Readonly<{finalBoss?:boolean;zombie?:OmegaZombieBrain;infectedReview?:boolean;targetX?:number}>={} ,
):void {
 if(h.hp<=0)return;
 const boss=Boolean(h.isStageBoss);
 const scale=boss?1.7:Math.max(.8,Math.min(1.5,h.radius/24));
 const sway=Math.sin(time*3+h.x*.019+h.y*.003);
 let spriteTopY=boss?-118:-68;
 const hitFlash=h.hitFlashTimer??0;
 const pushSign=options.targetX!==undefined?(h.x>=options.targetX?1:-1):1;
 const recoilX=hitFlash>0?pushSign*Math.sin(hitFlash*68)*4.8:0;
 const recoilSqX=hitFlash>0&&!boss?1.06:1;
 const recoilSqY=hitFlash>0&&!boss?0.94:1;
 ctx.save();
 ctx.scale(scale,scale);
 // Contact shadow remains planted cleanly at ground origin.
 ctx.fillStyle='rgba(1,7,14,.55)';
 ctx.beginPath();ctx.ellipse(0,4,boss?46:23,boss?11:6,0,0,Math.PI*2);ctx.fill();
 ctx.save();
 if(hitFlash>0){ctx.translate(recoilX,0);ctx.scale(recoilSqX,recoilSqY);}
 if(h.type==='UNHELMETED'){
  if(options.zombie){
   const brain=options.zombie;
   if(brain.phase==='warning'){
    const progress=Math.max(0,Math.min(1,1-brain.timer/Math.max(0.01,brain.warningDuration)));
    const pulse=.55+.45*Math.sin(time*15);
    const lockAngle=Math.atan2(brain.lockedY,brain.lockedX);
    const warnRgb=brain.kind==='armored'?'255,176,82':'255,96,142';
    ctx.save();
    ctx.globalCompositeOperation='lighter';
    ctx.fillStyle=`rgba(${warnRgb},${(0.14+0.24*progress).toFixed(3)})`;
    ctx.beginPath();
    ctx.moveTo(0,2);
    ctx.ellipse(0,2,18+progress*12,6+progress*4,0,lockAngle-0.85,lockAngle+0.85);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle=`rgba(${warnRgb},${(0.55*pulse+0.3*progress).toFixed(3)})`;
    ctx.lineWidth=1.8+progress*0.8;
    ctx.beginPath();
    ctx.ellipse(0,2,20+progress*10,7+progress*3.5,0,lockAngle-0.85,lockAngle+0.85);
    ctx.stroke();
    ctx.restore();
   }else if(brain.phase==='charge'){
    // Sleek motion-streak filaments behind charging zombie (zero solid sticks).
    ctx.save();
    ctx.globalCompositeOperation='lighter';
    for(let i=-1;i<=1;i++){
     const sy=-36+i*10;
     const bx=-brain.lockedX*(26+Math.abs(i)*5);
     const by=sy-brain.lockedY*16;
     ctx.strokeStyle=i===0?'rgba(164,244,255,0.48)':'rgba(255,132,168,0.34)';
     ctx.lineWidth=i===0?2.2:1.4;
     ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(0,sy);ctx.stroke();
    }
    ctx.restore();
   }
  }
  const g5=typeof window!=='undefined'&&omegaG5VectorStudyRequested(window.location.search,
   import.meta.env.DEV||import.meta.env.VITE_OMEGA_PROTOCOL_LAB==='1');
  // Dev-only two independently posed original drifter sources; preserve the
  // native telegraph above, all real health bars, and original other species.
  if(options.infectedReview&&options.zombie&&omegaInfectedCandidateReview.draw(ctx,h,options.zombie,time,options.targetX??h.x)){
   spriteTopY=-78;
  }else if(g5&&omegaG5Art.drawDrifter(ctx,h,options.zombie)){
   spriteTopY=-64;
  }else if(drawOmegaAuthoredZombie(ctx,h,time,options.zombie,options.targetX)){
   spriteTopY=-96;
  }else{
   drawOmegaHelmetZombie(ctx,h,time,options.zombie);
   spriteTopY=-64;
  }
 }else if(drawOmegaAuthoredHazardOrBoss(ctx,h,time,Boolean(options.finalBoss))){
  // Authored 3/4 isometric entity or boss sprite drawn above.
  spriteTopY=boss?-118:h.type==='RUNAWAY_CART'?-68:-74;
 }else if(h.type==='RUNAWAY_CART'){
  spriteTopY=-50;
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
  spriteTopY=-52;
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
  spriteTopY=-50;
  ctx.fillStyle='#293d4b';
  ctx.beginPath();ctx.moveTo(-25,-2);ctx.lineTo(-25,-30);ctx.lineTo(-11,-42);ctx.lineTo(23,-31);
  ctx.lineTo(29,-10);ctx.lineTo(10,3);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#ef995a';ctx.lineWidth=4;ctx.stroke();
  ctx.strokeStyle='#879cab';ctx.lineWidth=3;ctx.beginPath();
  ctx.moveTo(-17,-28);ctx.lineTo(13,-10);ctx.moveTo(18,-25);ctx.lineTo(-8,-6);ctx.stroke();
  ctx.fillStyle='#e6aa73';ctx.fillRect(-12,-18,21,5);
 }else if(h.type==='CRANE_BOSS'&&options.finalBoss){
  spriteTopY=-114;
  drawOmegaPowerWarden(ctx,time,h.bossPhase===2);
 }else if(h.type==='CRANE_BOSS'){
  spriteTopY=-114;
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
  ctx.save();
  ctx.globalCompositeOperation='lighter';
  const flashY=boss?-58:-28;
  const flashR=boss?56:28;
  const flashGrad=ctx.createRadialGradient?.(0,flashY,4,0,flashY,flashR);
  if(flashGrad&&typeof flashGrad.addColorStop==='function'){
   flashGrad.addColorStop(0,'rgba(255,254,244,0.68)');
   flashGrad.addColorStop(0.42,'rgba(125,244,255,0.40)');
   flashGrad.addColorStop(1,'rgba(0,0,0,0)');
   ctx.fillStyle=flashGrad;
  }else{
   ctx.globalAlpha=.42;
   ctx.fillStyle='#fff8df';
  }
  ctx.beginPath();ctx.arc(0,flashY,flashR,0,Math.PI*2);ctx.fill();
  ctx.restore();
 }
 ctx.restore(); // close recoil shake/squash transform so HP bar stays crisp!

 // Sleek beveled tactical HP bar with trailing damage-drain ghost chunk & toughness tier clarity.
 const maxHp=Math.max(1,h.maxHp);
 const hpRatio=Math.max(0,Math.min(1,h.hp/maxHp));
 const trailRatio=resolveEnemyTrailingRatio(h.id,hpRatio,time);
 const armored=options.zombie?.kind==='armored'||h.variant==='reinforced_cart'||h.type==='RUNAWAY_CART';
 const damaged=hpRatio<0.995||(h.hitFlashTimer??0)>0;
 const invScale=scale>0?1/scale:1;
 const barW=boss?94:armored?48:damaged?42:34;
 const barH=boss?7:armored?5.5:damaged?4.5:3.2;
 const barX=-barW*.5;
 const barY=Math.round(spriteTopY*scale)-10;

 ctx.save();
 ctx.scale(invScale,invScale);
 ctx.globalAlpha=boss||damaged||armored?0.96:0.78;
 traceHpRoundedRect(ctx,barX-1,barY-1,barW+2,barH+2,barH*.55+1);
 ctx.fillStyle='rgba(5,11,22,0.88)';
 ctx.fill();

 // Trailing white-gold recent damage drain bar!
 if(trailRatio>hpRatio+0.008){
  const trailW=Math.max(2,barW*trailRatio);
  ctx.fillStyle='rgba(255,244,214,0.88)';
  traceHpRoundedRect(ctx,barX,barY,trailW,barH,barH*.5);
  ctx.fill();
 }

 if(hpRatio>0){
  const fillW=Math.max(2,barW*hpRatio);
  const barGrad=ctx.createLinearGradient?.(barX,barY,barX+barW,barY);
  if(barGrad&&typeof barGrad.addColorStop==='function'){
   if(boss){
    barGrad.addColorStop(0,'#f472b6');
    barGrad.addColorStop(1,'#fbbf24');
   }else if(armored){
    barGrad.addColorStop(0,'#f59e0b');
    barGrad.addColorStop(1,'#fde047');
   }else{
    barGrad.addColorStop(0,'#e11d48');
    barGrad.addColorStop(1,'#fb7185');
   }
   ctx.fillStyle=barGrad;
  }else{
   ctx.fillStyle=boss?'#ffa2c7':armored?'#fbbf24':'#fb7185';
  }
  traceHpRoundedRect(ctx,barX,barY,fillW,barH,barH*.5);
  ctx.fill();
 }

 if(boss){
  for(const frac of [0.25,0.5,0.75]){
   ctx.fillStyle=frac===0.5?'rgba(255,255,255,0.82)':'rgba(255,255,255,0.42)';
   ctx.fillRect(barX+barW*frac-0.5,barY-1,1.2,barH+2);
  }
 }else if(armored){
  // Toughness segment ticks + compact armor diamond badge on left rim.
  const segs=Math.min(4,Math.max(2,Math.round(maxHp/45)));
  ctx.fillStyle='rgba(6,12,24,0.68)';
  for(let s=1;s<segs;s++){
   ctx.fillRect(barX+(barW*s)/segs-0.5,barY,1,barH);
  }
  const bx=barX-4,by=barY+barH*0.5;
  ctx.fillStyle='#fbbf24';
  ctx.beginPath();
  ctx.moveTo(bx,by-3.5);ctx.lineTo(bx+3.5,by);ctx.lineTo(bx,by+3.5);ctx.lineTo(bx-3.5,by);
  ctx.closePath();
  ctx.fill();
 }

 const critical=hpRatio>0&&hpRatio<=0.3;
 traceHpRoundedRect(ctx,barX-0.5,barY-0.5,barW+1,barH+1,barH*.55);
 ctx.strokeStyle=(h.hitFlashTimer??0)>0
  ?'rgba(224,250,255,0.92)'
  :critical
    ?'rgba(251,113,133,0.78)'
    :armored
      ?'rgba(251,191,36,0.52)'
      :'rgba(148,197,226,0.36)';
 ctx.lineWidth=1;
 ctx.stroke();
 ctx.restore();
 ctx.restore();
}

import type {Hazard} from '../domain/patrol-survivors';

/**
 * Original vector combat silhouettes for PROTOCOL's internal playable QA.
 * These are recognizable enemy archetypes, not approved production sprites
 * or licensed "Solo Leveling" monsters.
 */
export function drawOmegaProtocolEnemy(
 ctx:CanvasRenderingContext2D,h:Hazard,time:number,
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
  ctx.fillStyle='#222b39';ctx.fillRect(-10,-2,9,13);ctx.fillRect(3,-2,9,13);
  ctx.fillStyle='#d6a071';ctx.beginPath();ctx.arc(0,-29,10,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#c87845';ctx.fillRect(-13,-20,26,20);
  ctx.fillStyle='#303647';ctx.fillRect(-13,-15,26,7);
  ctx.strokeStyle='#eac294';ctx.lineWidth=5;
  ctx.beginPath();ctx.moveTo(-13,-15);ctx.lineTo(-20,-3+sway);
  ctx.moveTo(13,-15);ctx.lineTo(20,-6-sway);ctx.stroke();
  ctx.strokeStyle='#a6dff0';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(-8,-33);ctx.lineTo(9,-33);ctx.stroke();
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
 }else if(h.type==='CRANE_BOSS'){
  // Unique foreground layers and central reactor silhouette.
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

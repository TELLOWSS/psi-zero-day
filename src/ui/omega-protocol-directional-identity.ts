import type {OmegaHeading} from './omega-protocol-actor-render';

/**
 * Procedural AIRA identity landmarks for the eight active screen headings.
 * Real gameplay art is still gated behind an approved 160-frame sprite pack.
 * World-foot anchors, collision and projectile angle never depend on this.
 */
export type OmegaFaceMode='front'|'three-quarter'|'profile'|'rear-quarter'|'back';
export function omegaDirectionProfile(heading:OmegaHeading):Readonly<{
 face:OmegaFaceMode; eyeCount:0|1|2; backPlate:boolean; sideArmor:boolean;
}> {
 if(heading==='N')return {face:'back',eyeCount:0,backPlate:true,sideArmor:false};
 if(heading==='NW'||heading==='NE')return {face:'rear-quarter',eyeCount:0,backPlate:true,sideArmor:true};
 if(heading==='E'||heading==='W')return {face:'profile',eyeCount:1,backPlate:false,sideArmor:true};
 if(heading==='SE'||heading==='SW')return {face:'three-quarter',eyeCount:2,backPlate:false,sideArmor:true};
 return {face:'front',eyeCount:2,backPlate:false,sideArmor:false};
}

export function drawOmegaDirectionalGear(
 ctx:CanvasRenderingContext2D,heading:OmegaHeading,nod:number,
):void{
 const p=omegaDirectionProfile(heading);
 ctx.save();
 if(p.backPlate){
  // Segmented original emergency-response backpack on rear facings.
  ctx.fillStyle='#122138';ctx.fillRect(-11,-53+nod,22,22);
  ctx.fillStyle='#5a7c92';ctx.fillRect(-9,-50+nod,18,3);
  ctx.fillStyle='#a2f3eb';ctx.fillRect(-6,-43+nod,12,4);
  ctx.strokeStyle='#ed83c3';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(-5,-38+nod);ctx.lineTo(-5,-34+nod);
  ctx.moveTo(5,-38+nod);ctx.lineTo(5,-34+nod);ctx.stroke();
  ctx.strokeStyle='#b2c7d5';ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(-15,-49+nod);ctx.lineTo(-9,-35+nod);
  ctx.moveTo(15,-49+nod);ctx.lineTo(9,-35+nod);ctx.stroke();
 }
 if(p.sideArmor){
  // Distinct near-shoulder plate over far shoulder silhouette.
  ctx.fillStyle=p.backPlate?'#587f98':'#ecf4fc';
  ctx.beginPath();ctx.moveTo(12,-57+nod);ctx.lineTo(22,-54+nod);
  ctx.lineTo(22,-47+nod);ctx.lineTo(12,-46+nod);ctx.closePath();ctx.fill();
  ctx.fillStyle='#f07cbd';ctx.fillRect(17,-51+nod,5,2);
  ctx.strokeStyle='#7595aa';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(-19,-48+nod);ctx.lineTo(-14,-38+nod);ctx.stroke();
 }
 if(p.face==='front'||p.face==='three-quarter'){
  // Visible front chest identification panel; hidden behind backpack on rear.
  const offset=p.face==='three-quarter'?4:0;
  ctx.fillStyle='#a1edf1';ctx.fillRect(offset-4,-50+nod,7,3);
  ctx.fillStyle='#f585c9';ctx.fillRect(offset+3,-49+nod,3,2);
 }
 ctx.restore();
}

export function drawOmegaDirectionalHead(
 ctx:CanvasRenderingContext2D,heading:OmegaHeading,nod:number,
):void{
 const p=omegaDirectionProfile(heading);
 ctx.save();
 if(p.backPlate){
  // Cover the front-face placeholder on rear views: there are no eyes on
  // the back of AIRA's head, only silver crown and the headset strap.
  ctx.fillStyle='#e0ebfa';ctx.beginPath();ctx.ellipse(0,-66+nod,12,12,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#d77caf';ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(-11,-66+nod);ctx.lineTo(11,-66+nod);ctx.stroke();
  ctx.strokeStyle='#8da2b8';ctx.lineWidth=2;
  ctx.beginPath();ctx.arc(0,-71+nod,8,Math.PI*.05,Math.PI*.95);ctx.stroke();
  if(p.face==='rear-quarter'){
   ctx.fillStyle='#293b52';ctx.fillRect(9,-67+nod,4,7);
   ctx.fillStyle='#f395c6';ctx.fillRect(10,-65+nod,2,3);
  }else{
   ctx.fillStyle='#ec92c3';ctx.fillRect(-4,-75+nod,8,3);
  }
  ctx.restore();return;
 }
 const lens=(x:number,y:number,r:number,shade:string)=>{
  ctx.fillStyle='#111827';ctx.beginPath();ctx.arc(x,y,r+2,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=shade;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#fff1c6';ctx.fillRect(x-r*.65,y-r*.7,2.7,2);
 };
 if(p.face==='profile'){
  // Profile: one amber lens, forward-facing nose and open lower jaw.
  lens(4,-79+nod,5,'#ed9c4f');
  ctx.fillStyle='#e4bbbc';ctx.beginPath();ctx.moveTo(10,-69+nod);
  ctx.lineTo(16,-65+nod);ctx.lineTo(11,-62+nod);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#774e6d';ctx.lineWidth=1.4;
  ctx.beginPath();ctx.moveTo(8,-61+nod);ctx.lineTo(12,-61+nod);ctx.stroke();
  ctx.fillStyle='#52677f';ctx.fillRect(-11,-65+nod,5,8);
 }else if(p.face==='three-quarter'){
  // Foreshortened off-eye and one prominent near-side goggle lens.
  lens(-5,-78+nod,3.4,'#bc7c54');
  lens(6,-79+nod,5,'#ffa852');
  ctx.fillStyle='#3a2f46';ctx.fillRect(4,-64+nod,3.5,2);
  ctx.fillStyle='#f4c4c4';ctx.fillRect(10,-64+nod,3,3);
  ctx.strokeStyle='#ac6589';ctx.lineWidth=1.4;
  ctx.beginPath();ctx.moveTo(0,-59+nod);ctx.lineTo(5,-59+nod);ctx.stroke();
 }else{
  lens(-6,-79+nod,4,'#e69a4f');lens(6,-79+nod,4,'#e69a4f');
  ctx.fillStyle='#31273c';ctx.fillRect(-6,-64+nod,3,2);ctx.fillRect(4,-64+nod,3,2);
  ctx.strokeStyle='#ad6b94';ctx.lineWidth=1.2;
  ctx.beginPath();ctx.moveTo(-2,-59+nod);ctx.lineTo(3,-59+nod);ctx.stroke();
 }
 // Forehead hair direction keeps the same silver hairstyle in every pose.
 ctx.strokeStyle='#f1f5ff';ctx.lineWidth=p.face==='profile'?3:3.6;
 ctx.beginPath();ctx.moveTo(-7,-77+nod);
 ctx.quadraticCurveTo(p.face==='profile'?3:-2,-67+nod,-9,-58+nod);
 ctx.stroke();
 ctx.restore();
}

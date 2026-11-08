export const OMEGA_DIRECTIONS=['E','SE','S','SW','W','NW','N','NE'] as const;
export type OmegaHeading=typeof OMEGA_DIRECTIONS[number];
export function omegaFieldHeading(x:number,y:number):OmegaHeading{
 if(!Number.isFinite(x)||!Number.isFinite(y))return 'S';
 if(x===0&&y===0)return 'S';
 const angle=Math.atan2(y,x);
 const index=((Math.round(angle/(Math.PI/4))%8)+8)%8;
 return OMEGA_DIRECTIONS[index]!;
}
export interface OmegaActorView {
 readonly facingX:number;
 readonly facingY:number;
 readonly moving:boolean;
 readonly time:number;
 readonly dashing:boolean;
 readonly shooting:boolean;
 readonly hurt?:boolean;
}
/**
 * Internally authored PROCEDURAL technical placeholder, never an approved
 * AIRA image. Uses independent visible front/side/back drawings and foot gait,
 * with shoulder/rifle/pink ponytail equipment cues in eight screen headings.
 */
export function drawOmegaProtocolActor(ctx:CanvasRenderingContext2D,view:OmegaActorView):void{
 const heading=omegaFieldHeading(view.facingX,view.facingY);
 const left=heading==='W'||heading==='NW'||heading==='SW';
 const back=heading==='N'||heading==='NW'||heading==='NE';
 const side=heading==='E'||heading==='W';
 const stride=view.moving?Math.sin(view.time*12)*9:0;
 const nod=view.moving?Math.cos(view.time*24)*1.8:0;
 ctx.save();
 if(left)ctx.scale(-1,1);
 const helmet=back?'#bdcbdf':'#e1eaf5';
 // Stride/plant feet at local y = 0, preserving the actual contact point.
 ctx.fillStyle='#08152598';
 ctx.beginPath();ctx.ellipse(0,2,23,6,0,0,Math.PI*2);ctx.fill();
 if(view.dashing){
  ctx.globalAlpha=.35;ctx.fillStyle='#f47ec8';
  ctx.beginPath();ctx.ellipse(-15,0,35,13,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  // Short trailing strokes, not extra entities or collision ghosts.
  ctx.strokeStyle='#90e5f8';ctx.lineWidth=3;
  for(let i=0;i<3;i++){
   const y=-10-i*16;
   ctx.beginPath();ctx.moveTo(-52-i*4,y);ctx.lineTo(-33-i*2,y+3);ctx.stroke();
  }
 }
 // Two-joint leg arcs make planted steps legible without fake horizontal
 // translation of the physics contact point.
 ctx.strokeStyle='#182b40';ctx.lineWidth=9;ctx.lineCap='round';
 ctx.beginPath();
 ctx.moveTo(-7,-34);ctx.lineTo(-10+stride*.20,-20);
 ctx.lineTo(-9+stride*.55,-7);
 ctx.moveTo(8,-34);ctx.lineTo(10-stride*.20,-20);
 ctx.lineTo(9-stride*.55,-7);ctx.stroke();
 ctx.fillStyle='#e6ecfa';
 ctx.fillRect(-15+stride*.5,-9,14,8);
 ctx.fillRect(4-stride*.5,-9,14,8);
 ctx.strokeStyle='#ffa6d0';ctx.lineWidth=2;
 ctx.beginPath();ctx.moveTo(-14+stride*.5,-9);ctx.lineTo(-3+stride*.5,-9);
 ctx.moveTo(5-stride*.5,-9);ctx.lineTo(16-stride*.5,-9);ctx.stroke();
 // Ribbed tactical torso / jacket.
 ctx.fillStyle='#1b3049';
 ctx.beginPath();ctx.moveTo(-20,-54+nod);ctx.lineTo(19,-54+nod);
 ctx.lineTo(15,-31+nod);ctx.lineTo(-16,-31+nod);ctx.closePath();ctx.fill();
 ctx.fillStyle='#dfe7f5';
 ctx.beginPath();ctx.moveTo(-17,-53+nod);ctx.lineTo(15,-53+nod);
 ctx.lineTo(11,-39+nod);ctx.lineTo(-11,-39+nod);ctx.closePath();ctx.fill();
 ctx.fillStyle='#fd9ccf';ctx.fillRect(-14,-43+nod,27,4);
 ctx.fillStyle='#18293c';ctx.fillRect(-16,-35+nod,31,8);
 if(back){
  ctx.fillStyle='#273850';ctx.fillRect(-15,-53+nod,29,24);
  ctx.strokeStyle='#87dcde';ctx.lineWidth=3;ctx.strokeRect(-15,-53+nod,29,24);
  ctx.fillStyle='#f0aacd';ctx.fillRect(-7,-45+nod,14,5);
 }
 // Shoulder pads and radio equipment.
 ctx.fillStyle='#c2d6e9';
 ctx.beginPath();ctx.arc(-18,-50+nod,8,0,Math.PI*2);
 ctx.arc(17,-49+nod,8,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#192d49';ctx.fillRect(-24,-49+nod,9,16);
 ctx.strokeStyle='#f8aad4';ctx.lineWidth=5;ctx.lineCap='round';
 const armMove=back?-1:1;
 ctx.beginPath();ctx.moveTo(-19,-49+nod);ctx.lineTo(-21,-34+nod+stride*.17);
 ctx.moveTo(17,-49+nod);ctx.lineTo(23,-35+nod-stride*.17*armMove);ctx.stroke();
 ctx.fillStyle='#26364a';ctx.fillRect(-25,-39+nod,11,7);ctx.fillRect(17,-41+nod,10,7);
 // Character head and silver ponytail.
 ctx.fillStyle='#c3d1e6';ctx.beginPath();ctx.arc(0,-64+nod,13,0,Math.PI*2);ctx.fill();
 ctx.fillStyle=helmet;
 ctx.beginPath();ctx.arc(0,-68+nod,12,Math.PI,0);ctx.lineTo(12,-65+nod);ctx.lineTo(-12,-65+nod);ctx.closePath();ctx.fill();
 ctx.strokeStyle='#f5acd7';ctx.lineWidth=6;
 ctx.beginPath();ctx.moveTo(side?5:11,-71+nod);ctx.lineTo(17,-81+nod);
 ctx.lineTo(26,-72+nod+Math.sin(view.time*9)*3);ctx.stroke();
 if(!back){
  ctx.fillStyle='#d676a9';ctx.fillRect(side?1:-9,-68+nod,side?9:18,5);
  ctx.fillStyle='#fff0ab';ctx.fillRect(side?4:-5,-67+nod,side?4:10,3);
 }
 // The weapon rotates in eight screen-relative directions, so idle and
 // shot poses never claim a projectile was launched behind the character.
 // Mirrored left poses flip the local weapon as well; no physics rotation.
 const rifleY=side?-45:-41;
 const rifleAngle=heading==='N'?-Math.PI/2:heading==='S'?Math.PI/2:
  (heading==='NE'||heading==='NW')?-Math.PI/4:
  (heading==='SE'||heading==='SW')?Math.PI/4:0;
 const recoil=view.shooting?3:0;
 ctx.save();ctx.translate(side?18:12,rifleY+3+nod);ctx.rotate(rifleAngle);
 ctx.fillStyle='#14283e';ctx.fillRect(-recoil,-3,27,6);
 ctx.fillStyle='#95becf';ctx.fillRect(13-recoil,-2,22,3);
 if(view.shooting){
  const mx=37-recoil;
  ctx.fillStyle='#a9fff5';ctx.beginPath();ctx.arc(mx,0,5.5,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#eaffd5';ctx.lineWidth=2.5;ctx.beginPath();
  ctx.moveTo(mx+4,0);ctx.lineTo(mx+17,0);
  ctx.moveTo(mx+2,-2);ctx.lineTo(mx+11,-7);
  ctx.moveTo(mx+2,2);ctx.lineTo(mx+11,7);ctx.stroke();
 }
 ctx.restore();
 if(view.hurt){
  ctx.strokeStyle='#ff7f9f';ctx.lineWidth=3;ctx.globalAlpha=.85;
  ctx.beginPath();ctx.arc(0,-42,26,Math.PI*.1,Math.PI*1.1);ctx.stroke();
  ctx.globalAlpha=1;
 }
 ctx.restore();
}

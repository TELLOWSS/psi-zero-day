import type {OmegaWalkPose} from './omega-protocol-grounded-gait';
import {drawOmegaDirectionalGear,drawOmegaDirectionalHead} from './omega-protocol-directional-identity';
import {omegaAiraKineticPose} from './omega-protocol-aira-kinetics';
import type {OmegaArtAction} from './omega-protocol-art-motion';
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
 /** Real Watch director-shout or OMEGA final victory, visual-only. */
 readonly ultimate?:boolean;
 readonly finished?:boolean;
 /** Actual per-run terminal pose age; engine gameTime may be frozen. */
 readonly actionAge?:number;
 /** Independent, genuine native-shot muzzle bearing in screen coordinates. */
 readonly weaponFacingX?:number;
 readonly weaponFacingY?:number;
 /** Actual collision-corrected movement, not joystick input or global time. */
 readonly gait?:OmegaWalkPose;
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
 const gaitActive=view.gait?view.gait.active:view.moving;
 // The real native action selected by the Watch-derived state now changes
 // torso, shoulders, hair inertia and rifle recoil, not just a colored ring.
 const action:OmegaArtAction=view.finished?'finish':view.ultimate?'ultimate':
  view.hurt?'hit':view.dashing?'dash':view.shooting?'fire':'walk';
 const elapsed=action==='walk'
  ?(gaitActive?(view.gait?.phase??(view.time*2%1))*.59:0)
  :(Number.isFinite(view.actionAge)?Math.max(0,view.actionAge!):0);
 const kinetic=omegaAiraKineticPose(heading,action,elapsed);
 const stepAngle=view.gait?view.gait.phase*Math.PI*2:view.time*12;
 const stride=gaitActive?Math.sin(stepAngle)*9*kinetic.strideScale:0;
 const nod=gaitActive?Math.cos(stepAngle*2)*1.8:0;
 ctx.save();
 if(left)ctx.scale(-1,1);
 // Explicit AIRA identity anchors: silver hair with magenta ribbon, amber
 // goggles, black plated suit and asymmetric rose-white field jacket.
 // These drawings remain development geometry, NOT approved sprite art.
 const helmet=back?'#eff5fa':'#fcfcff';
 const hairBounce=(view.moving?Math.sin(view.time*10)*2:Math.sin(view.time*1.8)*.8)+kinetic.hairSweep*.45;
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
 // Long high silver ponytail sits BEHIND her back and weapons. This keeps
 // the signature identity legible from front, side and back at small scale.
 const tailRootX=back?4:11,tailRootY=-74+nod;
 ctx.strokeStyle='#ab70b8';ctx.lineWidth=15;ctx.lineCap='round';ctx.lineJoin='round';
 ctx.beginPath();ctx.moveTo(tailRootX,tailRootY);
 ctx.bezierCurveTo(24,-92+hairBounce,35,-75+hairBounce,29,-54+hairBounce);
 ctx.bezierCurveTo(28,-38+hairBounce,42,-31+hairBounce,33,-22+hairBounce);ctx.stroke();
 ctx.strokeStyle='#f4f8ff';ctx.lineWidth=11;
 ctx.beginPath();ctx.moveTo(tailRootX,tailRootY);
 ctx.bezierCurveTo(24,-92+hairBounce,35,-75+hairBounce,29,-54+hairBounce);
 ctx.bezierCurveTo(28,-38+hairBounce,42,-31+hairBounce,33,-22+hairBounce);ctx.stroke();
 ctx.strokeStyle='#ff86c9';ctx.lineWidth=3;
 ctx.beginPath();ctx.moveTo(tailRootX+2,tailRootY+2);
 ctx.bezierCurveTo(29,-84+hairBounce,31,-67+hairBounce,29,-51+hairBounce);
 ctx.bezierCurveTo(28,-36+hairBounce,39,-28+hairBounce,33,-21+hairBounce);ctx.stroke();
 // Distinct pink high-tie, including a small fluttering ribbon tab.
 ctx.fillStyle='#f45ba9';ctx.beginPath();ctx.moveTo(7,-78+nod);
 ctx.lineTo(16,-80+nod);ctx.lineTo(14,-72+nod);
 ctx.lineTo(19,-66+nod+hairBounce);ctx.lineTo(10,-70+nod);
 ctx.closePath();ctx.fill();
 // 2-joint legs read the actual post-collision stance-foot positions:
 // stance anchors remain fixed in WORLD projection, swing soles rise in air.
 // The fallback keeps legacy technical poses in direct canvas unit tests.
 // The procedural fallback mirrors its entire body in left headings.
 // Undo that mirror for measured foot offsets so stance feet stay anchored
 // at the SAME projected world coordinates on all eight headings.
 const l=view.gait?.active?{...view.gait.left,
  x:left?-view.gait.left.x:view.gait.left.x}:{x:-9+stride*.55,y:0,planted:true};
 const r=view.gait?.active?{...view.gait.right,
  x:left?-view.gait.right.x:view.gait.right.x}:{x:9-stride*.55,y:0,planted:true};
 ctx.strokeStyle='#182b40';ctx.lineWidth=9;ctx.lineCap='round';
 ctx.beginPath();
 ctx.moveTo(-7,-34);ctx.lineTo((-7+l.x)*.5-2,-19+l.y*.24-(l.planted?0:2));
 ctx.lineTo(l.x,l.y-7);
 ctx.moveTo(8,-34);ctx.lineTo((8+r.x)*.5+2,-19+r.y*.24-(r.planted?0:2));
 ctx.lineTo(r.x,r.y-7);ctx.stroke();
 // Boots follow the feet instead of an unrelated global sine wave.
 ctx.fillStyle='#070f1b';
 ctx.fillRect(l.x-8,l.y-10,17,10);
 ctx.fillRect(r.x-8,r.y-10,17,10);
 ctx.fillStyle='#e9f1f5';
 ctx.fillRect(l.x-7,l.y-10,14,5);
 ctx.fillRect(r.x-7,r.y-10,14,5);
 ctx.strokeStyle='#ffa6d0';ctx.lineWidth=2;
 ctx.beginPath();ctx.moveTo(l.x-6,l.y-9);ctx.lineTo(l.x+5,l.y-9);
 ctx.moveTo(r.x-6,r.y-9);ctx.lineTo(r.x+5,r.y-9);ctx.stroke();
 // Tiny ground-contact arcs fire ONLY on genuine swing->stance crossing,
 // never on a timer, idle collision, dashing or an untrusted sprite guess.
 if(view.gait?.active){
  ctx.strokeStyle='#8ddfee';ctx.lineWidth=1.7;ctx.globalAlpha=.55;
  for(const foot of [l,r]){
   if(!foot.landed)continue;
   ctx.beginPath();ctx.ellipse(foot.x,foot.y+1,12,3,0,0,Math.PI*2);ctx.stroke();
   ctx.beginPath();ctx.moveTo(foot.x-10,foot.y-3);
   ctx.lineTo(foot.x-16,foot.y-6);ctx.moveTo(foot.x+10,foot.y-3);
   ctx.lineTo(foot.x+16,foot.y-6);ctx.stroke();
  }
  ctx.globalAlpha=1;
 }
 // Narrow only the upper silhouette in side view, moderately in diagonal
 // view, and keep full shoulder breadth at front/back. Keep lower limbs and
 // true collision-corrected stance feet OUTSIDE this perspective transform.
 // This is an original technical placeholder, not artist-approved 8x20 art.
 const upperWidth=side?.73:
  (heading==='SE'||heading==='SW'||heading==='NW'||heading==='NE')?.88:1;
 ctx.save();ctx.translate(0,kinetic.torsoYOffset);
 ctx.rotate(kinetic.torsoTilt);
 ctx.scale(upperWidth,1);
 // Ribbed tactical torso / jacket.
 ctx.fillStyle='#1b3049';
 ctx.beginPath();ctx.moveTo(-20,-54+nod);ctx.lineTo(19,-54+nod);
 ctx.lineTo(15,-31+nod);ctx.lineTo(-16,-31+nod);ctx.closePath();ctx.fill();
 // Asymmetric split field jacket: white left shoulder, black tactical
 // corset harness and a small pink/white NEW-PSI chest accent.
 ctx.fillStyle='#eaf1f8';
 ctx.beginPath();ctx.moveTo(-17,-55+nod);ctx.lineTo(-4,-53+nod);
 ctx.lineTo(-7,-38+nod);ctx.lineTo(-17,-42+nod);ctx.closePath();ctx.fill();
 ctx.fillStyle='#0b1526';
 ctx.beginPath();ctx.moveTo(-7,-52+nod);ctx.lineTo(15,-54+nod);
 ctx.lineTo(10,-33+nod);ctx.lineTo(-11,-34+nod);ctx.closePath();ctx.fill();
 ctx.strokeStyle='#db72b7';ctx.lineWidth=2;
 ctx.beginPath();ctx.moveTo(-3,-51+nod);ctx.lineTo(8,-32+nod);
 ctx.moveTo(9,-51+nod);ctx.lineTo(-5,-36+nod);ctx.stroke();
 ctx.fillStyle='#fd9ccf';ctx.fillRect(-14,-43+nod,27,3);
 ctx.fillStyle='#eaf7fa';ctx.fillRect(4,-49+nod,8,3);
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
 // Radio pack, amber status lens and independent short antenna.
 ctx.fillStyle='#122136';ctx.fillRect(-25,-62+nod,12,18);
 ctx.fillStyle='#f1ad57';ctx.fillRect(-23,-58+nod,7,3);
 ctx.strokeStyle='#95afc5';ctx.lineWidth=2;ctx.beginPath();
 ctx.moveTo(-18,-61+nod);ctx.lineTo(-20,-78+nod);ctx.stroke();
 ctx.strokeStyle='#f8aad4';ctx.lineWidth=5;ctx.lineCap='round';
 const armMove=back?-1:1;
 ctx.beginPath();ctx.moveTo(-19,-49+nod);ctx.lineTo(-21,-34+nod+stride*.17+kinetic.shoulderYOffset);
 ctx.moveTo(17,-49+nod);ctx.lineTo(23,-35+nod-stride*.17*armMove+kinetic.shoulderYOffset);ctx.stroke();
 ctx.fillStyle='#26364a';ctx.fillRect(-25,-39+nod,11,7);ctx.fillRect(17,-41+nod,10,7);
 drawOmegaDirectionalGear(ctx,heading,nod);
 // Hair frame overlays the face and reads as silver, never a helmet.
 // The actual safety helmet belongs to the construction-world context,
 // while her signature orange-lens goggles are worn on her head.
 ctx.fillStyle=back?'#dae6f6':'#eec5c6';
 ctx.beginPath();ctx.arc(0,-64+nod,12,0,Math.PI*2);ctx.fill();
 ctx.fillStyle=helmet;
 ctx.beginPath();ctx.arc(-1,-70+nod,13,Math.PI,Math.PI*2);
 ctx.lineTo(12,-69+nod);ctx.lineTo(6,-64+nod);
 ctx.lineTo(-3,-66+nod);ctx.lineTo(-8,-61+nod);
 ctx.lineTo(-11,-66+nod);ctx.closePath();ctx.fill();
 ctx.strokeStyle='#f5efff';ctx.lineWidth=3;
 ctx.beginPath();ctx.moveTo(-11,-70+nod);ctx.lineTo(6,-78+nod);ctx.stroke();
 drawOmegaDirectionalHead(ctx,heading,nod);
 // The weapon rotates in eight screen-relative directions, so idle and
 // shot poses never claim a projectile was launched behind the character.
 // Mirrored left poses flip the local weapon as well; no physics rotation.
 const rifleY=side?-45:-41;
 // The torso may turn smoothly through eight authored heading buckets, but
 // the rifle must point EXACTLY at the actual fired projectile angle.
 // Undo mirror for local weapon geometry when the body faces left.
 const aimX=Number.isFinite(view.weaponFacingX)?view.weaponFacingX!:view.facingX;
 const aimY=Number.isFinite(view.weaponFacingY)?view.weaponFacingY!:view.facingY;
 const localAimX=left?-aimX:aimX;
 const rifleAngle=(localAimX===0&&aimY===0)?0:Math.atan2(aimY,localAimX);
 const recoil=view.shooting?kinetic.weaponRecoil:0;
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
 ctx.restore(); // rifle-local transform
 ctx.restore(); // upper-body perspective only
 if(view.ultimate){
  // This ring only displays while the actual Watch directorShoutTimer>0.
  // Original procedural illustration, never a fake projectile/HP event.
  ctx.strokeStyle='#b7fff2';ctx.lineWidth=3;ctx.globalAlpha=.7;
  const pulse=1+.07*Math.sin(view.time*12);
  ctx.beginPath();ctx.ellipse(0,-38,28*pulse,37*pulse,0,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle='#baf8f0';ctx.beginPath();ctx.arc(0,-59,4,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=1;
 }
 if(view.finished){
  // The technical fallback gets two visible completion key poses even
  // without the approved art pack. Engine gameTime is already frozen,
  // so drive this exclusively from the run-local terminal render clock.
  const elapsed=Number.isFinite(view.actionAge)?Math.max(0,view.actionAge!):0;
  const resolved=Math.min(1,elapsed*6);
  ctx.strokeStyle='#f3caed';ctx.lineWidth=2.5;ctx.globalAlpha=.5+.3*resolved;
  ctx.beginPath();ctx.arc(0,-45,30+resolved*12,
   Math.PI*1.05,Math.PI*(1.55+.40*resolved));ctx.stroke();
  ctx.fillStyle='#fff1d5';ctx.beginPath();
  ctx.arc(0,-89-9*resolved,3+resolved*2,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=1;
 }
 if(view.hurt){
  ctx.strokeStyle='#ff7f9f';ctx.lineWidth=3;ctx.globalAlpha=.85;
  ctx.beginPath();ctx.arc(0,-42,26,Math.PI*.1,Math.PI*1.1);ctx.stroke();
  ctx.globalAlpha=1;
 }
 ctx.restore();
}

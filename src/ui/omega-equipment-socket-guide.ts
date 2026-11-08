import {OMEGA_DIRECTIONS} from './omega-operator-motion';
import {omegaSolveLeg,type OmegaPoint} from './omega-leg-ik';

/**
 * Procedurally authored 8×6 animation-guide coordinates.
 * NOT signed-off production sprites, not an equipable CharacterId.
 * The independent NE prototype is generated from 135° camera orientation,
 * never by mirroring NW bitmap pixels.
 */
export type OmegaHeading=typeof OMEGA_DIRECTIONS[number];
export type OmegaSocket='head'|'chest'|'hip'|'back'|
  'leftHip'|'rightHip'|'leftKnee'|'rightKnee'|'leftFoot'|'rightFoot'|
  'leftWrist'|'rightWrist'|'radio'|'weaponMuzzle'|'leftShoulder'|'rightShoulder';
export interface OmegaSocketFrame{
 readonly heading:OmegaHeading;
 readonly phase:0|1|2|3|4|5;
 readonly sockets:Readonly<Record<OmegaSocket,OmegaPoint>>;
 readonly stance:Readonly<{left:boolean;right:boolean}>;
 readonly artStatus:'VECTOR_PROTOTYPE_NOT_PLAYABLE';
 readonly editorApproval:false;
 readonly avatarEnabled:false;
}
const CAM_DEGREES=[90,45,0,-45,-90,-135,180,135] as const;
const px=(x:number,y:number):OmegaPoint=>({x:Math.round(x*100)/100,y:Math.round(y*100)/100});
const clamp=(x:number,min:number,max:number)=>Math.max(min,Math.min(max,x));
function footStep(time:number,offset:number):{delta:number;lift:number;planted:boolean}{
 const p=(time+offset)%1;
 if(p<.6)return {delta:(.5-p/.6)*34,lift:0,planted:true};
 const t=(p-.6)/.4;
 return {delta:(t-.5)*34,lift:Math.sin(Math.PI*t)*26,planted:false};
}
export function omegaFrameSocketGuide(heading:OmegaHeading,phase:number):OmegaSocketFrame{
 const dir=OMEGA_DIRECTIONS.indexOf(heading);
 if(dir<0)throw new Error('Invalid OMEGA direction');
 if(!Number.isInteger(phase)||phase<0||phase>=6)throw new RangeError('OMEGA phase must be 0..5');
 const angle=CAM_DEGREES[dir]!*Math.PI/180;
 const cosine=Math.cos(angle),sine=Math.sin(angle);
 const local=(side:number,forward:number)=>side*cosine+forward*sine;
 const time=phase/6,cycle=2*Math.PI*time;
 const rootX=192+2.5*Math.sin(cycle),rootY=1.5*Math.cos(2*cycle);
 const hip=px(rootX,306+rootY),chest=px(rootX,210+rootY);
 const sockets={} as Record<OmegaSocket,OmegaPoint>;
 const planted={left:false,right:false};
 sockets.head=px(rootX+sine*7,152+rootY);
 sockets.chest=chest;sockets.hip=hip;sockets.back=px(rootX,227);
 let radioX=0;
 for(const [side,name,offset] of [[-1,'left',0],[1,'right',.5]] as const){
  const key=(part:string)=> (name+part) as OmegaSocket;
  const sideHip=px(rootX+local(side,0)*13,309+rootY);
  const foot=footStep(time,offset);
  const footPt=px(rootX+local(side,0)*17+sine*foot.delta,454-foot.lift);
  const target=px(footPt.x,footPt.y-27);
  const bend=Math.abs(cosine)>.35?side:(sine>0?1:-1);
  const knee=omegaSolveLeg(sideHip,target,72,77,bend as 1|-1);
  if(!knee)throw new Error('OMEGA knee guide cannot be calculated');
  const shoulder=px(rootX+local(side,0)*36*(.68+.32*Math.abs(cosine)),215+rootY);
  const other=footStep(time,.5-offset);
  const wrist=px(shoulder.x+sine*other.delta+local(side,0)*6,292+rootY+5*Math.sin(cycle+(name==='left'?0:Math.PI)));
  sockets[key('Hip')]=sideHip;
  sockets[key('Foot')]=footPt;
  sockets[key('Knee')]=px(knee.knee.x,knee.knee.y);
  sockets[key('Shoulder')]=shoulder;
  sockets[key('Wrist')]=wrist;
  planted[name]=foot.planted;
 }
 radioX=rootX+local(-1,0)*29;
 sockets.radio=px(radioX,218);
 sockets.weaponMuzzle=px(rootX+sine*48,sockets.rightWrist.y-3);
 for(const value of Object.values(sockets)){
  if(!Number.isFinite(value.x)||!Number.isFinite(value.y)||
     value.x<0||value.x>384||value.y<0||value.y>512)
   throw new Error('OMEGA socket outside 384×512 sprite cell');
 }
 return {heading,phase:phase as OmegaSocketFrame['phase'],sockets,
  stance:{left:planted.left,right:planted.right},
  artStatus:'VECTOR_PROTOTYPE_NOT_PLAYABLE',editorApproval:false,avatarEnabled:false};
}
/** Lightweight preflight suitable for offline art editors. No image bytes read. */
export function omegaAllSocketGuides():ReadonlyArray<OmegaSocketFrame>{
 return OMEGA_DIRECTIONS.flatMap(dir=>Array.from({length:6},(_,frame)=>omegaFrameSocketGuide(dir,frame)));
}

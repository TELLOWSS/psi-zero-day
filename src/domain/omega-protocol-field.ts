/**
 * OMEGA PROTOCOL: location-driven construction/industrial operation nodes.
 * Deterministic mission layout and collision geometry; no account save,
 * unlock change, premium reward or third-party game assets.
 */
export const OMEGA_FIELD_WIDTH=1400 as const;
export const OMEGA_FIELD_HEIGHT=900 as const;
export const OMEGA_FIELD_INTERACT_RADIUS=100 as const;
/** Shared terrain-camera projection, intentionally not part of Watch physics. */
export const OMEGA_QUARTER_VIEW={skewX:-0.22,groundYScale:0.78} as const;
/** Convert joystick/screen axes to world movement so UP actually looks UP. */
export function omegaFieldScreenMoveToWorld(dx:number,dy:number):{x:number;y:number}{
 if(!Number.isFinite(dx)||!Number.isFinite(dy))throw new RangeError('Invalid movement');
 const y=dy/OMEGA_QUARTER_VIEW.groundYScale;
 const x=dx-OMEGA_QUARTER_VIEW.skewX*y;
 const len=Math.hypot(x,y);
 const amount=Math.min(1,Math.hypot(dx,dy));
 return len>0?{x:x/len*amount,y:y/len*amount}:{x:0,y:0};
}
export type OmegaFieldEventKind='power_lockout'|'worker_evacuation'|'structure_stabilization';
export type OmegaFieldPhase='combat'|'objective'|'exit';
export interface OmegaFieldPoint {readonly x:number;readonly y:number}
export interface OmegaFieldObstacle {
 readonly id:string;
 readonly x:number; readonly y:number;
 readonly width:number; readonly height:number;
 readonly kind:'container'|'scaffold'|'machine'|'barrier';
}
export interface OmegaFieldEventStep{
 readonly id:string;
 readonly label:string;
 readonly target:OmegaFieldPoint;
}
export interface OmegaFieldEvent {
 readonly kind:OmegaFieldEventKind;
 readonly label:string;
 readonly instructions:string;
 readonly target:OmegaFieldPoint;
 readonly steps:readonly OmegaFieldEventStep[];
}
export interface OmegaFieldPlan {
 readonly wave:number;
 readonly sector:number;
 readonly sectorName:string;
 readonly entry:OmegaFieldPoint;
 readonly exit:OmegaFieldPoint;
 readonly event:OmegaFieldEvent;
 readonly obstacles:readonly OmegaFieldObstacle[];
 readonly palette:{readonly floor:string;readonly structures:string;readonly accent:string};
}
export interface OmegaFieldProgress {
 readonly phase:OmegaFieldPhase;
 readonly eventComplete:boolean;
 readonly exitUnlocked:boolean;
 readonly completedSteps:number;
}
const sectors=[
 {name:'야간 현장 진입로',floor:'#182838',structures:'#3d6071',accent:'#9fe3fb'},
 {name:'철골·비계 작업구역',floor:'#1c2939',structures:'#526978',accent:'#ffa86b'},
 {name:'크레인 위험구역',floor:'#242735',structures:'#5c596c',accent:'#eaa0ff'},
 {name:'지하 설비구역',floor:'#162936',structures:'#467a79',accent:'#80efcf'},
 {name:'중앙 통제시설',floor:'#271e32',structures:'#6c5177',accent:'#ff9bc6'},
] as const;
const events=[
 {kind:'power_lockout',label:'전력 차단 장치',instructions:'제어함을 조작해 위험 설비의 에너지를 차단'},
 {kind:'worker_evacuation',label:'근로자 대피 통제',instructions:'대피 지점에서 안전 동선을 확보'},
 {kind:'structure_stabilization',label:'구조물 안정화',instructions:'지지 장치를 활성화해 위험 구역을 안정화'},
] as const;
const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));
export function omegaFieldPlan(seed:number,wave:number):OmegaFieldPlan{
 if(!Number.isInteger(wave)||wave<1||wave>15)throw new RangeError('Field node must be 1..15');
 const sector=Math.ceil(wave/3),sectorTheme=sectors[sector-1]!;
 // Three mission sites per sector, not three copies of a fixed wave circle.
 const local=(wave-1)%3;
 const event=events[(wave+sector+Math.abs(Math.trunc(seed)))%events.length]!;
 const target={x:1040+(local-1)*54,y:235+local*105};
 const stepData:readonly OmegaFieldEventStep[]=event.kind==='power_lockout'?[
  {id:'breaker_a',label:'제1 차단기 분리',target:{x:635,y:265}},
  {id:'breaker_b',label:'제2 차단기 분리',target},
  {id:'isolation_check',label:'잔류 전원 확인',target:{x:1065,y:380}},
 ]:event.kind==='worker_evacuation'?[
  {id:'worker_contact',label:'작업자 위치 확인',target},
  {id:'safe_handoff',label:'안전 집결지 인계',target:{x:390,y:605}},
 ]:[
  {id:'brace_a',label:'A 지지대 설치',target:{x:1065,y:210}},
  {id:'brace_b',label:'B 지지대 설치',target:{x:635,y:360}},
  {id:'stability_check',label:'구조물 안정화 확인',target},
 ];
 const obstacles:OmegaFieldObstacle[]=[
  {id:'cargo',x:240,y:185+local*16,width:170,height:120,kind:'container'},
  {id:'scaffold',x:565,y:680-local*25,width:190,height:115,kind:'scaffold'},
  {id:'machine',x:795,y:470-local*23,width:155,height:120,kind:'machine'},
  {id:'safety_line',x:440,y:250+local*14,width:85,height:45,kind:'barrier'},
 ];
 return {
  wave,sector,sectorName:sectorTheme.name,
  entry:{x:150,y:450},
  exit:{x:1210,y:730-local*115},
  event:{...event,target:stepData[0]!.target,steps:stepData},
  obstacles,
  palette:{floor:sectorTheme.floor,structures:sectorTheme.structures,accent:sectorTheme.accent},
 };
}
export function omegaFieldInitialProgress():OmegaFieldProgress{
 return {phase:'combat',eventComplete:false,exitUnlocked:false,completedSteps:0};
}
export function omegaFieldCurrentStep(
 plan:OmegaFieldPlan,progress:OmegaFieldProgress,
):OmegaFieldEventStep|null{
 return progress.phase==='objective'?plan.event.steps[progress.completedSteps]??null:null;
}
/** Compass guidance for event consoles and extraction gates. Projected
 * heading matches the actual 3/4 camera, not raw top-down world coordinates.
 */
export function omegaFieldTargetGuide(
 plan:OmegaFieldPlan,progress:OmegaFieldProgress,actor:OmegaFieldPoint,
):Readonly<{degrees:number;distance:number;ready:boolean;label:string}>|null {
 const step=omegaFieldCurrentStep(plan,progress);
 const dest=progress.phase==='objective'?step?.target:progress.phase==='exit'?plan.exit:undefined;
 if(!dest||!Number.isFinite(actor.x)||!Number.isFinite(actor.y))return null;
 const dx=dest.x-actor.x,dy=dest.y-actor.y;
 const screenDx=dx+OMEGA_QUARTER_VIEW.skewX*dy;
 const screenDy=OMEGA_QUARTER_VIEW.groundYScale*dy;
 return {
  degrees:Math.atan2(screenDy,screenDx)*180/Math.PI,
  distance:Math.round(Math.hypot(dx,dy)),
  ready:Math.hypot(dx,dy)<=OMEGA_FIELD_INTERACT_RADIUS,
  label:progress.phase==='exit'?'출구':step?.label??'임무 지점',
 };
}
export function omegaFieldDistance(a:OmegaFieldPoint,b:OmegaFieldPoint):number{
 return Math.hypot(a.x-b.x,a.y-b.y);
}
export function omegaFieldCanInteract(actor:OmegaFieldPoint,target:OmegaFieldPoint):boolean{
 return Number.isFinite(actor.x)&&Number.isFinite(actor.y)&&
  omegaFieldDistance(actor,target)<=OMEGA_FIELD_INTERACT_RADIUS;
}
/** Player-vs-rect collision for independently authored field props.
 * Resolves x/y one axis at a time to prevent wall tunneling on normal steps.
 */
export function omegaFieldResolveCollision(
 previous:OmegaFieldPoint,
 proposed:OmegaFieldPoint,
 obstacles:readonly OmegaFieldObstacle[],
 radius=20,
):OmegaFieldPoint{
 if(!Number.isFinite(proposed.x)||!Number.isFinite(proposed.y)||!Number.isFinite(radius))
  throw new RangeError('Invalid collision geometry');
 const collide=(x:number,y:number,r:OmegaFieldObstacle)=>{
  const nearestX=clamp(x,r.x,r.x+r.width);
  const nearestY=clamp(y,r.y,r.y+r.height);
  return (x-nearestX)**2+(y-nearestY)**2<radius*radius;
 };
 let x=clamp(proposed.x,radius,OMEGA_FIELD_WIDTH-radius),y=clamp(proposed.y,radius,OMEGA_FIELD_HEIGHT-radius);
 // Stop fast dashes from crossing a box entirely between frames.
 for(const o of obstacles){
  const left=o.x-radius,right=o.x+o.width+radius;
  const top=o.y-radius,bottom=o.y+o.height+radius;
  if(previous.y>=top&&previous.y<=bottom){
   if(previous.x<=left&&x>left)x=left;
   else if(previous.x>=right&&x<right)x=right;
  }
 }
 for(const o of obstacles)if(collide(x,previous.y,o)){x=previous.x;break;}
 for(const o of obstacles){
  const left=o.x-radius,right=o.x+o.width+radius;
  const top=o.y-radius,bottom=o.y+o.height+radius;
  if(x>=left&&x<=right){
   if(previous.y<=top&&y>top)y=top;
   else if(previous.y>=bottom&&y<bottom)y=bottom;
  }
 }
 for(const o of obstacles)if(collide(x,y,o)){y=previous.y;break;}
 return {x:clamp(x,radius,OMEGA_FIELD_WIDTH-radius),y:clamp(y,radius,OMEGA_FIELD_HEIGHT-radius)};
}

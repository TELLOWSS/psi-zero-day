import type {OmegaFieldPlan,OmegaFieldProgress,OmegaFieldPoint} from '../domain/omega-protocol-field';

/** Actual 3/4 mission-prop artwork, rendered at native real mission XY.
 * Not a collider: the Watch mission interaction radius and player navigation
 * are unchanged. Draw these BEFORE/AFTER the hero by world-foot depth.
 */
export type OmegaDeviceState='locked'|'active'|'completed';
export function omegaDeviceState(progress:OmegaFieldProgress,index:number):OmegaDeviceState {
 if(!Number.isSafeInteger(index)||index<0)throw new RangeError('Invalid device index');
 if(index<progress.completedSteps)return 'completed';
 return progress.phase==='objective'&&index===progress.completedSteps?'active':'locked';
}
const finish={locked:'#e6ab67',active:'#7ce9ff',completed:'#70f0bd'} as const;
const body='#24394e',rim='#9fb4c7';
function shine(ctx:CanvasRenderingContext2D,x:number,y:number,color:string,active:boolean):void{
 if(!active)return;
 const light=ctx.createRadialGradient(x,y,1,x,y,39);
 light.addColorStop(0,color+'99');light.addColorStop(1,'rgba(0,0,0,0)');
 ctx.fillStyle=light;ctx.fillRect(x-39,y-39,78,78);
}
export function drawOmegaMissionDevice(
 ctx:CanvasRenderingContext2D,plan:OmegaFieldPlan,
 progress:OmegaFieldProgress,index:number,seconds:number,
):void{
 const step=plan.event.steps[index];
 if(!step||!Number.isFinite(seconds))return;
 const state=omegaDeviceState(progress,index);
 const color=finish[state],pulse=.65+.35*Math.sin(seconds*4+index);
 const active=state==='active';
 ctx.save();ctx.translate(step.target.x,step.target.y);
 // Ground footprint remains a decoration, not navigable collision cover.
 ctx.fillStyle='rgba(0,6,17,.48)';ctx.beginPath();
 ctx.ellipse(0,4,38,13,0,0,Math.PI*2);ctx.fill();
 // Cabinet material and stepped bevels. Supports all 3 event types
 // without placing an invisible wall across the real interaction radius.
 ctx.fillStyle='#111e2d';ctx.beginPath();
 ctx.moveTo(-29,-11);ctx.lineTo(-29,-57);ctx.lineTo(17,-66);
 ctx.lineTo(33,-51);ctx.lineTo(33,-9);ctx.closePath();ctx.fill();
 ctx.fillStyle=body;ctx.fillRect(-29,-57,51,49);
 ctx.fillStyle='#6d8599';ctx.beginPath();
 ctx.moveTo(-29,-57);ctx.lineTo(-16,-67);ctx.lineTo(34,-64);
 ctx.lineTo(22,-57);ctx.closePath();ctx.fill();
 ctx.strokeStyle=rim;ctx.lineWidth=2;ctx.strokeRect(-29,-57,51,49);
 ctx.strokeStyle='rgba(227,244,248,.38)';ctx.lineWidth=1.3;
 ctx.beginPath();ctx.moveTo(22,-57);ctx.lineTo(33,-51);ctx.lineTo(33,-9);ctx.stroke();
 // Bright function panel is at the height of an actual field control unit.
 shine(ctx,-1,-34,color,active);
 ctx.fillStyle='#0c182b';ctx.fillRect(-22,-50,37,24);
 ctx.strokeStyle=color;ctx.lineWidth=2.2;ctx.strokeRect(-22,-50,37,24);
 ctx.fillStyle=color;ctx.globalAlpha=active?.72+.28*pulse:state==='locked'?.48:1;
 if(plan.event.kind==='power_lockout'){
  // Breaker panel: toggles visibly from energized amber to isolated teal.
  for(let i=0;i<3;i++){
   const x=-17+i*11;
   ctx.fillRect(x,-46,7,7);
   ctx.fillStyle='#172d42';ctx.fillRect(x+2,-44,3,4);
   ctx.fillStyle=color;
  }
  ctx.strokeStyle=color;ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(-15,-33);ctx.lineTo(state==='completed'?-9:-15,-36);ctx.stroke();
 }else if(plan.event.kind==='worker_evacuation'){
  // Person and directed wayfinding, not a generic coloured square.
  ctx.beginPath();ctx.arc(-12,-43,4,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=color;ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(-12,-38);ctx.lineTo(-12,-30);
  ctx.moveTo(-12,-34);ctx.lineTo(-19,-28);
  ctx.moveTo(-12,-34);ctx.lineTo(-5,-28);
  ctx.moveTo(1,-43);ctx.lineTo(11,-43);ctx.lineTo(6,-47);
  ctx.moveTo(11,-43);ctx.lineTo(6,-39);ctx.stroke();
 }else{
  // Bracing winch: crossed diagonal stabilizers and positive-lock pin.
  ctx.strokeStyle=color;ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(-18,-45);ctx.lineTo(10,-30);
  ctx.moveTo(10,-45);ctx.lineTo(-18,-30);ctx.stroke();
  ctx.fillRect(-6,-40,7,7);
 }
 ctx.globalAlpha=1;
 ctx.fillStyle='#102032';ctx.fillRect(-19,-16,31,5);
 ctx.fillStyle=color;ctx.fillRect(-19,-16,state==='completed'?31:state==='active'?21:7,5);
 // Every machine has an amber rail and individually identifiable safety face.
 ctx.fillStyle='#d6a65e';ctx.fillRect(-30,-9,53,5);
 ctx.fillStyle='#0d1a29';for(let x=-25;x<21;x+=13){
  ctx.beginPath();ctx.moveTo(x,-9);ctx.lineTo(x+7,-9);ctx.lineTo(x+2,-4);
  ctx.lineTo(x-5,-4);ctx.closePath();ctx.fill();
 }
 if(active){
  ctx.globalAlpha=.35+.25*pulse;ctx.strokeStyle=color;ctx.lineWidth=2.5;
  ctx.beginPath();ctx.ellipse(0,4,38+pulse*8,14+pulse*3,0,0,Math.PI*2);ctx.stroke();
 }
 ctx.restore();
}
export function drawOmegaExtractionUnit(
 ctx:CanvasRenderingContext2D,point:OmegaFieldPoint,unlocked:boolean,seconds:number,
):void {
 if(!Number.isFinite(seconds))return;
 ctx.save();ctx.translate(point.x,point.y);
 const color=unlocked?'#70f0bd':'#ffb87a';
 const blink=.6+.4*Math.sin(seconds*4);
 ctx.fillStyle='rgba(0,7,18,.55)';ctx.beginPath();
 ctx.ellipse(0,7,64,18,0,0,Math.PI*2);ctx.fill();
 // Two upright original steel support portals anchored to the extraction XY.
 for(const side of [-1,1]){
  const x=side*48;
  ctx.fillStyle='#263749';ctx.fillRect(x-7,-98,14,104);
  ctx.fillStyle='#8ca6af';ctx.fillRect(x-7,-98,4,104);
  ctx.strokeStyle='#d1e4e3';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(x-9,4);ctx.lineTo(x+9,4);ctx.stroke();
 }
 ctx.fillStyle='#293e52';ctx.fillRect(-53,-108,106,18);
 ctx.fillStyle='#71899c';ctx.fillRect(-52,-108,106,4);
 ctx.fillStyle=color;ctx.fillRect(-41,-105,82,8);
 ctx.fillStyle='#111d2a';ctx.fillRect(-35,-89,70,16);
 ctx.font='bold 11px system-ui';ctx.textAlign='center';ctx.fillStyle=color;
 ctx.fillText(unlocked?'EXTRACT':'LOCKED',0,-77);
 // Transition only after the real event progress has unlocked the exit.
 if(unlocked){
  ctx.strokeStyle='#79f9d5';ctx.lineWidth=4;ctx.globalAlpha=.38+blink*.4;
  ctx.beginPath();ctx.moveTo(-34,-64);ctx.lineTo(-34,-4);
  ctx.moveTo(34,-64);ctx.lineTo(34,-4);ctx.stroke();
  ctx.beginPath();ctx.moveTo(-23,-27);ctx.lineTo(18,-27);
  ctx.moveTo(18,-27);ctx.lineTo(9,-34);
  ctx.moveTo(18,-27);ctx.lineTo(9,-20);ctx.stroke();
 }else{
  ctx.fillStyle='rgba(30,42,57,.79)';ctx.fillRect(-33,-70,66,69);
  ctx.strokeStyle='#bb747c';ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(-25,-63);ctx.lineTo(25,-6);
  ctx.moveTo(25,-63);ctx.lineTo(-25,-6);ctx.stroke();
 }
 ctx.restore();
}

export interface FootPoint {x:number;y:number}
interface ContactSample {x:number;y:number;clock:number;feet:FootPoint[];planted:boolean[]}
/** Presentation contacts in world space; never moves the engine actor. */
export class FootContactTracker {
 private samples=new WeakMap<object,ContactSample>();
 sample(entity:object,x:number,y:number,clock:number,feet:readonly FootPoint[],planted:readonly boolean[],reach=34):FootPoint[]{
  let previous=this.samples.get(entity);
  if(previous&&(clock<previous.clock||clock-previous.clock>.5||Math.hypot(x-previous.x,y-previous.y)>80))previous=undefined;
  if(previous&&clock===previous.clock&&x===previous.x&&y===previous.y)return previous.feet.map(p=>({x:p.x-x,y:p.y-y}));
  const world=feet.map((foot,i)=>{
   const expected={x:x+foot.x,y:y+foot.y},held=previous?.planted[i]&&planted[i]?previous.feet[i]:undefined;
   return held&&Math.hypot(held.x-expected.x,held.y-expected.y)<=reach?{...held}:expected;
  });
  this.samples.set(entity,{x,y,clock,feet:world,planted:[...planted]});return world.map(p=>({x:p.x-x,y:p.y-y}));
 }
}
export function turnToward(angle:number,target:number,dt:number,rate=Math.PI*4):number {
 const delta=((target-angle+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI;
 return angle+Math.max(-rate*Math.max(0,dt),Math.min(rate*Math.max(0,dt),delta));
}

/** Continuous swing between authored contact/passing keys; the planted foot is held separately. */
export function swingContactPoints(cycle:number,keys:readonly (readonly FootPoint[])[],height:number):FootPoint[]{
 const tau=Math.PI*2,phase=((cycle%tau+tau)%tau)/tau,index=Math.floor(phase*4),fraction=phase*4-index;
 const t=fraction*fraction*(3-2*fraction),a=keys[index]!,b=keys[(index+1)%4]!;
 return [0,1].map(side=>{const swing=side===1?phase*2:(phase-.5)*2, lift=swing>0&&swing<1?Math.sin(swing*Math.PI)*height*.065:0;
  return {x:a[side]!.x+(b[side]!.x-a[side]!.x)*t,y:a[side]!.y+(b[side]!.y-a[side]!.y)*t-lift};});
}

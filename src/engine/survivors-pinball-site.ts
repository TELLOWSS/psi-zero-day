import {PINBALL_TABLES,type PinballTableId,type PinballRail} from '../domain/survivors-pinball-tables';
import type {PinballBall} from './survivors-pinball-engine';
export interface SiteShot {x:number;y:number;vx:number;vy:number;life:number;pierce:number;hit:number[];}
export interface SiteFragment {x:number;y:number;vx:number;vy:number;angle:number;life:number;tile:number;piece:number;}
export class PinballSite {
 readonly layout;readonly hp:number[];shots:SiteShot[]=[];fragments:SiteFragment[]=[];
 charge=0;active=0;activations=0;switch=0;sequence=0;lastLane=-1;phase=0;capture=0;laneCooldown:number[];targetCooldown:number[];arcs:{ax:number;ay:number;bx:number;by:number;life:number}[]=[];
 private captured:PinballBall|null=null;private dropped:PinballBall|null=null;
 constructor(readonly id:PinballTableId){this.layout=PINBALL_TABLES[id];this.hp=this.layout.targets.map(t=>t.hp);this.laneCooldown=this.layout.lanes.map(()=>0);this.targetCooldown=this.hp.map(()=>0);}
 reset(){this.hp.splice(0,this.hp.length,...this.layout.targets.map(t=>t.hp));this.shots=[];this.fragments=[];this.charge=0;this.active=0;this.sequence=0;this.lastLane=-1;this.capture=0;this.captured=null;this.dropped=null;this.laneCooldown.fill(0);this.targetCooldown.fill(0);}
 hold(ball:PinballBall){return this.captured===ball&&this.capture>0;}
 rebindBall(previous:PinballBall,next:PinballBall){if(this.captured===previous)this.captured=next;if(this.dropped===previous)this.dropped=next;}
 get rails():readonly PinballRail[]{const dynamic=this.id==='water'?this.switch%2?[[210,400,270,445],[390,400,450,445]]:[[150,400,210,445],[330,445,390,400]]:this.id==='rail'?this.switch%2?[[270,310,335,365]]:[[330,310,265,365]]:[];return [...this.layout.rails,...dynamic] as PinballRail[];}
 private activate(award:(n:number)=>void,balls:PinballBall[],fx:(x:number,y:number,kind?:'special')=>void){this.charge=0;this.active=this.layout.duration;this.activations++;award(750);fx(300,200,'special');
  if(this.id==='cargo'||this.id==='zeroday'){for(let i=0;i<(this.id==='zeroday'?4:2)&&balls.length<4;i++)balls.push({x:160+i*85,y:280,vx:i%2?-220:220,vy:-350,source:'site'});}
 }
 private progress(award:(n:number)=>void,balls:PinballBall[],fx:(x:number,y:number,kind?:'special')=>void){if(++this.charge>=this.layout.charge)this.activate(award,balls,fx);}
 private damage(index:number,amount:number,award:(n:number)=>void,balls:PinballBall[],fx:(x:number,y:number,kind?:'special')=>void,chain=true){if((this.hp[index]??0)<=0)return;
  if(this.id==='power'&&this.active===0&&index!==this.sequence)return;
  const target=this.layout.targets[index];if(!target)return;this.hp[index]=Math.max(0,(this.hp[index]??0)-amount);award(75);fx(target.x,target.y);
  if(this.hp[index]>0)return;award(250);this.progress(award,balls,fx);
  for(let piece=0;piece<4;piece++){const angle=piece*Math.PI/2+this.activations*.3;this.fragments.push({x:target.x,y:target.y,vx:Math.cos(angle)*95,vy:Math.sin(angle)*95-60,angle,life:.8,tile:this.layout.sprite,piece});}this.fragments=this.fragments.slice(-48);
  if(this.id==='power')this.sequence=(this.sequence+1)%this.hp.length;
  if(this.id==='water'||this.id==='rail')this.switch++;
  if(this.id==='zeroday')this.phase=(this.phase+1)%3;
  if(chain&&(this.id==='power'||this.id==='foundry'||this.id==='demolition'||this.id==='zeroday'&&this.phase===1)&&this.active>0){const next=this.hp.findIndex((hp,i)=>hp>0&&i!==index);if(next>=0){const to=this.layout.targets[next]!;this.arcs.push({ax:target.x,ay:target.y,bx:to.x,by:to.y,life:.22});this.damage(next,this.id==='demolition'?3:1,award,balls,fx,false);}}
 }
 /** Only a real manually timed paddle contact calls this method. Holding/assistance never fires. */
 fire(ball:PinballBall){if(this.id==='factory')return;const target=this.id==='power'&&(this.hp[this.sequence]??0)>0?this.sequence:this.hp.findIndex(hp=>hp>0);if(target<0)return;const p=this.layout.targets[target];if(!p)return;const angle=Math.atan2(p.y-ball.y,p.x-ball.x);const fan=this.active>0&&(this.id==='foundry'||this.id==='zeroday')?[-.16,0,.16]:[0];
  for(const offset of fan)this.shots.push({x:ball.x,y:ball.y,vx:Math.cos(angle+offset)*1100,vy:Math.sin(angle+offset)*1100,life:1.1,pierce:this.id==='tunnel'||this.id==='conveyor'||this.id==='zeroday'?4:1,hit:[]});this.shots=this.shots.slice(-16);
 }
 ball(ball:PinballBall,dt:number,award:(n:number)=>void,balls:PinballBall[],fx:(x:number,y:number,kind?:'special')=>void){if(this.id==='factory')return;
  this.layout.lanes.forEach((lane,i)=>{if((this.laneCooldown[i]??0)>0||Math.hypot(ball.x-lane.x,ball.y-lane.y)>lane.r)return;this.laneCooldown[i]=1;award(100);
   if(this.id==='conveyor'||this.id==='foundry'){if(i!==this.lastLane){this.lastLane=i;this.progress(award,balls,fx);}ball.vy-=120;}
   else if(this.id==='tower'&&!this.captured){this.capture=.45;this.captured=ball;ball.x=lane.x;ball.y=lane.y;ball.vx=0;ball.vy=0;this.progress(award,balls,fx);}
   else if(this.id==='rail'){this.switch++;ball.vx=this.switch%2?260:-260;ball.vy=-550;this.progress(award,balls,fx);}
   else if(this.id==='water'){ball.vy=-700;ball.vx=i===0?180:-180;this.progress(award,balls,fx);}
   else {this.progress(award,balls,fx);if(this.id==='cargo')ball.vy=-500;}
  });
  if(this.id==='conveyor'&&this.lastLane>=0&&ball.x<(this.lastLane===0?215:465)&&ball.x>(this.lastLane===0?130:380))ball.vy-=350*dt;
  if(this.active>0&&(this.id==='water'||this.id==='zeroday'&&this.phase===2)&&ball.y>400){ball.vy-=300*dt;}
  if(this.active>0&&this.id==='rail'&&ball.y<600)ball.vy-=180*dt;
  this.layout.targets.forEach((target,i)=>{if((this.hp[i]??0)<=0)return;const dx=ball.x-target.x,dy=ball.y-target.y,dist=Math.hypot(dx,dy);if(dist>=30)return;const nx=dist?dx/dist:0,ny=dist?dy/dist:1;ball.x=target.x+nx*30.2;ball.y=target.y+ny*30.2;const speed=ball.vx*nx+ball.vy*ny;if(speed<0){ball.vx-=1.8*speed*nx;ball.vy-=1.8*speed*ny;if(this.targetCooldown[i]===0){this.targetCooldown[i]=.2;this.damage(i,1,award,balls,fx);if(this.id==='tower'&&this.dropped===ball){this.dropped=null;this.hp.forEach((hp,j)=>{if(hp>0&&j!==i)this.damage(j,this.active>0?3:1,award,balls,fx);});}}}});
 }
 update(dt:number,award:(n:number)=>void,balls:PinballBall[],fx:(x:number,y:number,kind?:'special')=>void){this.active=Math.max(0,this.active-dt);this.capture=Math.max(0,this.capture-dt);if(this.captured&&this.capture===0){this.captured.vy=1100;this.dropped=this.captured;this.captured=null;}this.laneCooldown=this.laneCooldown.map(c=>Math.max(0,c-dt));this.targetCooldown=this.targetCooldown.map(c=>Math.max(0,c-dt));
  for(const shot of this.shots){const ox=shot.x,oy=shot.y;shot.x+=shot.vx*dt;shot.y+=shot.vy*dt;shot.life-=dt;this.layout.targets.forEach((target,i)=>{if((this.hp[i]??0)<=0||shot.hit.includes(i)||shot.pierce<=0)return;const dx=shot.x-ox,dy=shot.y-oy,k=Math.max(0,Math.min(1,((target.x-ox)*dx+(target.y-oy)*dy)/(dx*dx+dy*dy||1)));if(Math.hypot(target.x-ox-k*dx,target.y-oy-k*dy)>24)return;shot.hit.push(i);shot.pierce--;this.damage(i,this.active>0?2:1,award,balls,fx);});}
  this.shots=this.shots.filter(s=>s.life>0&&s.pierce>0);this.fragments=this.fragments.map(f=>({...f,x:f.x+f.vx*dt,y:f.y+f.vy*dt,vy:f.vy+220*dt,angle:f.angle+dt*3,life:f.life-dt})).filter(f=>f.life>0);this.arcs=this.arcs.map(a=>({...a,life:a.life-dt})).filter(a=>a.life>0);
  if(this.hp.length&&this.hp.every(hp=>hp<=0)&&this.active===0){this.hp.splice(0,this.hp.length,...this.layout.targets.map(t=>t.hp));this.sequence=0;}
 }
}

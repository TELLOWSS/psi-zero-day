export const PINBALL_WIDTH=600,PINBALL_HEIGHT=900;
export const PINBALL_BUMPERS=[{x:204,y:220,r:49},{x:396,y:220,r:49},{x:300,y:352,r:49}] as const;
export const PINBALL_RAILS=[ [110,135,490,135], [110,135,90,280], [90,280,90,640], [490,135,510,280], [510,280,510,640], [90,640,246,826], [510,640,354,826] ] as const;
export interface PinballInput {left:boolean;right:boolean;assist:boolean;}
export interface PinballEffect {x:number;y:number;kind:'metal'|'rubber'|'crane';life:number;}
export class SurvivorsPinballEngine {
 private sounds:{kind:'metal'|'rubber'|'crane'|'flipper';x:number}[]=[];
 drainSounds(){return this.sounds.splice(0);}
 readonly state={phase:'ready' as 'ready'|'playing'|'between'|'finished',ball:0,remaining:30,
  x:480,y:650,vx:0,vy:0,score:0,earned:0,combo:0,bestCombo:0,
  leftAngle:.35,rightAngle:Math.PI-.35,lit:[false,false,false],effects:[] as PinballEffect[],hits:0,saves:0,elapsed:0};
 private cooldown=[0,0,0];private comboTime=0;private protection=0;
 launch(){const s=this.state;if(s.phase!=='ready'&&s.phase!=='between')return false;
  s.ball++;s.phase='playing';s.remaining=30;s.x=480;s.y=650;s.vx=-170+(s.ball-1)*20;s.vy=-1080;s.combo=0;s.lit=[false,false,false];
  this.protection=4;this.cooldown=[0,0,0];this.comboTime=0;s.earned=Math.max(100,s.earned);return true;
 }
 finish(){this.state.phase='finished';return this.state.earned;}
 update(dt:number,input:PinballInput){
  if(this.state.phase!=='playing'||!Number.isFinite(dt)||dt<=0)return;
  const count=Math.ceil(Math.min(dt,.1)*240),step=Math.min(dt,.1)/count;
  for(let i=0;i<count&&this.state.phase==='playing';i++)this.step(step,input);
 }
 private hit(x:number,y:number,kind:PinballEffect['kind']) {
  this.sounds.push({kind,x});if(this.sounds.length>32)this.sounds.shift();
  const s=this.state;s.effects.push({x,y,kind,life:kind==='crane'?1.2:.28});
  if(s.effects.length>24)s.effects.shift();
 }
 private capsule(ax:number,ay:number,bx:number,by:number,r:number,bounce:number,wx=0,wy=0){
  const s=this.state,dx=bx-ax,dy=by-ay;
  const t=Math.max(0,Math.min(1,((s.x-ax)*dx+(s.y-ay)*dy)/(dx*dx+dy*dy||1)));
  const cx=ax+t*dx,cy=ay+t*dy,dist=Math.hypot(s.x-cx,s.y-cy),radius=11+r;
  if(dist>=radius)return;
  const nx=dist>1e-6?(s.x-cx)/dist:0,ny=dist>1e-6?(s.y-cy)/dist:-1;
  s.x=cx+nx*(radius+.2);s.y=cy+ny*(radius+.2);
  const relative=(s.vx-wx)*nx+(s.vy-wy)*ny;
  if(relative<0){s.vx-=(1+bounce)*relative*nx;s.vy-=(1+bounce)*relative*ny;
   if(Math.abs(relative)>160)this.hit(cx,cy,'rubber');}
 }
 private step(dt:number,input:PinballInput){
  const s=this.state;s.elapsed+=dt;s.remaining=Math.max(0,s.remaining-dt);this.protection=Math.max(0,this.protection-dt);
  this.comboTime=Math.max(0,this.comboTime-dt);if(this.comboTime===0)s.combo=0;
  this.cooldown=this.cooldown.map(c=>Math.max(0,c-dt));
  s.effects=s.effects.map(e=>({...e,life:e.life-dt})).filter(e=>e.life>0);
  const auto=input.assist&&s.y>580&&s.vy>0;
  const oldLeft=s.leftAngle,oldRight=s.rightAngle;
  const approach=(angle:number,target:number)=>angle+Math.max(-14*dt,Math.min(14*dt,target-angle));
  s.leftAngle=approach(s.leftAngle,input.left||(auto&&s.x<325)?-.55:.35);
  s.rightAngle=approach(s.rightAngle,input.right||(auto&&s.x>275)?Math.PI+.55:Math.PI-.35);
  if(oldLeft===.35&&s.leftAngle<oldLeft)this.sounds.push({kind:'flipper',x:185});
  if(oldRight===Math.PI-.35&&s.rightAngle>oldRight)this.sounds.push({kind:'flipper',x:415});
  s.vy+=820*dt;s.vx*=Math.exp(-.055*dt);s.vy*=Math.exp(-.055*dt);s.x+=s.vx*dt;s.y+=s.vy*dt;
  for(const [ax,ay,bx,by] of PINBALL_RAILS)this.capsule(ax,ay,bx,by,5,.82);
  // Real angular contact velocity transfers paddle timing to the ball.
  for(const [px,angle,old] of [[185,s.leftAngle,oldLeft],[415,s.rightAngle,oldRight]] as const){
   const dx=Math.cos(angle)*100,dy=Math.sin(angle)*100,omega=(angle-old)/dt;
   const projection=Math.max(0,Math.min(1,((s.x-px)*dx+(s.y-735)*dy)/10000));
   this.capsule(px,735,px+dx,735+dy,12,.88,-omega*dy*projection,omega*dx*projection);
  }
  PINBALL_BUMPERS.forEach((b,i)=>{
   const dx=s.x-b.x,dy=s.y-b.y,dist=Math.hypot(dx,dy);
   if(dist>=b.r+11)return;
   const nx=dist>1e-6?dx/dist:0,ny=dist>1e-6?dy/dist:-1;
   s.x=b.x+nx*(b.r+11+.2);s.y=b.y+ny*(b.r+11+.2);
   const speed=s.vx*nx+s.vy*ny;
   if(speed<0){s.vx-=1.85*speed*nx;s.vy-=1.85*speed*ny;}
   if(this.cooldown[i]===0){s.vx+=nx*180;s.vy+=ny*180;this.cooldown[i]=.16;
    s.hits++;s.combo++;s.bestCombo=Math.max(s.bestCombo,s.combo);this.comboTime=1.8;
    s.score+=100+Math.min(10,s.combo-1)*25;s.lit[i]=true;this.hit(b.x,b.y,'metal');
    if(s.lit.every(Boolean)){s.score+=1000;s.lit=[false,false,false];this.hit(300,155,'crane');}
    s.earned=Math.min(400,100+Math.floor(s.score/100)*5);
   }
  });
  const speed=Math.hypot(s.vx,s.vy);if(speed>1300){s.vx*=1300/speed;s.vy*=1300/speed;}
  if(s.y>846){
   if(this.protection>0){s.saves++;this.protection=0;s.x=480;s.y=650;s.vx=-170;s.vy=-1080;this.hit(480,650,'rubber');}
   else s.phase=s.ball<3?'between':'finished';
  }
  if(s.remaining===0)s.phase=s.ball<3?'between':'finished';
 }
}

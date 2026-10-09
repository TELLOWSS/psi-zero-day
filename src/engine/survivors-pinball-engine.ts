export const PINBALL_WIDTH=600,PINBALL_HEIGHT=900;
export const PINBALL_BUMPERS=[{x:204,y:220,r:49},{x:396,y:220,r:49},{x:300,y:352,r:49}] as const;
export const PINBALL_RAILS=[[110,135,490,135],[110,135,90,280],[90,280,90,690],[490,135,510,280],[510,280,510,690],[90,690,170,790],[170,790,265,828],[510,690,430,790],[430,790,335,828]] as const;
export const PINBALL_SLINGS=[[95,494,126,530],[505,494,474,530]] as const;
export const PINBALL_PADDLES={left:{x:185,y:735,rest:.35,raised:-.55},right:{x:415,y:735,rest:Math.PI-.35,raised:Math.PI+.55},length:100,radius:12} as const;
export type PinballMode='bonus'|'practice';
export interface PinballInput {left:boolean;right:boolean;assist:boolean;}
export interface PinballBall {x:number;y:number;vx:number;vy:number;}
export interface PinballEffect {x:number;y:number;kind:'metal'|'rubber'|'crane'|'perfect'|'jackpot';life:number;}
export type PinballCallout='perfect'|'skillshot'|'rush'|'jackpot'|'tilt'|'';
export class SurvivorsPinballEngine {
 constructor(readonly mode:PinballMode='bonus'){}
 private sounds:{kind:'metal'|'rubber'|'crane'|'flipper';x:number}[]=[];
 drainSounds(){return this.sounds.splice(0);}
 readonly state={phase:'ready' as 'ready'|'playing'|'between'|'finished',ball:0,remaining:30,
  x:480,y:650,vx:0,vy:0,score:0,earned:0,combo:0,bestCombo:0,leftAngle:.35,rightAngle:Math.PI-.35,
  lit:[false,false,false],effects:[] as PinballEffect[],hits:0,saves:0,elapsed:0,
  extraBalls:[] as PinballBall[],rushTime:0,jackpots:0,perfects:0,skillTarget:0,
  nudgesLeft:3,nudgeCooldown:0,tiltTime:0,callout:'' as PinballCallout,calloutTime:0};
 private cooldown=[0,0,0];private slingCooldown=[0,0];private comboTime=0;private protection=0;private launchedAt=0;private firstHit=true;
 private assistPulse={left:0,right:0};private assistCooldown={left:0,right:0};
 private manual={left:false,right:false};private pressAge={left:10,right:10};private strokeUsed={left:false,right:false};
 launch(power=.65){const s=this.state;if(s.phase!=='ready'&&s.phase!=='between')return false;const strength=Number.isFinite(power)?Math.max(.15,Math.min(1,power)):.65;
  s.ball++;s.phase='playing';s.remaining=30;Object.assign(s,{x:480,y:650,vx:-40-strength*200+(s.ball-1)*20,vy:-1080-(strength-.65)*350});s.combo=0;s.lit=[false,false,false];
  s.extraBalls=[];s.rushTime=0;s.nudgesLeft=3;s.nudgeCooldown=0;s.tiltTime=0;s.callout='';s.calloutTime=0;s.leftAngle=.35;s.rightAngle=Math.PI-.35;s.skillTarget=(s.ball-1)%3;
  this.protection=4;this.cooldown=[0,0,0];this.slingCooldown=[0,0];this.comboTime=0;this.launchedAt=s.elapsed;this.firstHit=true;
  this.assistPulse={left:0,right:0};this.assistCooldown={left:0,right:0};this.manual={left:false,right:false};this.pressAge={left:10,right:10};this.strokeUsed={left:false,right:false};
  s.earned=this.mode==='practice'?0:Math.max(100,s.earned);return true;}
 finish(){this.endBall(true);return this.state.earned;}
 nudge(){const s=this.state;if(s.phase!=='playing'||s.nudgesLeft===0||s.tiltTime>0)return false;
  if(s.nudgeCooldown>0){s.tiltTime=1.5;this.callout('tilt');return false;}
  s.nudgesLeft--;s.nudgeCooldown=1.2;for(const b of [s,...s.extraBalls]){b.vx+=b.x<300?100:-100;b.vy-=160;}this.hit(s.x,s.y,'rubber');return true;}
 update(dt:number,input:PinballInput){if(this.state.phase!=='playing'||!Number.isFinite(dt)||dt<=0)return;
  const count=Math.ceil(Math.min(dt,.1)*240),step=Math.min(dt,.1)/count;for(let i=0;i<count&&this.state.phase==='playing';i++)this.step(step,input);}
 private award(points:number){const s=this.state;s.score+=points;s.earned=this.mode==='practice'?0:Math.min(400,100+Math.floor(s.score/100)*5);}
 private callout(kind:PinballCallout){const s=this.state,p={perfect:1,skillshot:2,rush:3,jackpot:4,tilt:5,'':0};if(s.calloutTime>0&&p[s.callout]>p[kind])return;s.callout=kind;s.calloutTime=1.4;}
 private hit(x:number,y:number,kind:PinballEffect['kind']){
  this.sounds.push({kind:kind==='perfect'?'metal':kind==='jackpot'?'crane':kind,x});if(this.sounds.length>32)this.sounds.shift();
  this.state.effects.push({x,y,kind,life:kind==='crane'||kind==='jackpot'?1.2:.28});if(this.state.effects.length>24)this.state.effects.shift();}
 private capsule(b:PinballBall,ax:number,ay:number,bx:number,by:number,r:number,bounce:number,wx=0,wy=0,fx=true){
  const dx=bx-ax,dy=by-ay,t=Math.max(0,Math.min(1,((b.x-ax)*dx+(b.y-ay)*dy)/(dx*dx+dy*dy||1))),cx=ax+t*dx,cy=ay+t*dy,dist=Math.hypot(b.x-cx,b.y-cy),radius=11+r;if(dist>=radius)return null;
  const nx=dist>1e-6?(b.x-cx)/dist:0,ny=dist>1e-6?(b.y-cy)/dist:-1;b.x=cx+nx*(radius+.2);b.y=cy+ny*(radius+.2);
  const relative=(b.vx-wx)*nx+(b.vy-wy)*ny;if(relative<0){b.vx-=(1+bounce)*relative*nx;b.vy-=(1+bounce)*relative*ny;if(fx&&Math.abs(relative)>160)this.hit(cx,cy,'rubber');}
  return {relative,nx,ny,x:cx,y:cy};}
 private endBall(finish=false){const s=this.state;s.phase=finish||s.ball>=3?'finished':'between';s.extraBalls=[];s.rushTime=0;}
 private moveBall(b:PinballBall,dt:number,oldLeft:number,oldRight:number){const s=this.state;
  b.vy+=820*dt;b.vx*=Math.exp(-.055*dt);b.vy*=Math.exp(-.055*dt);b.x+=b.vx*dt;b.y+=b.vy*dt;
  for(const [ax,ay,bx,by] of PINBALL_RAILS)this.capsule(b,ax,ay,bx,by,5,.82);
  PINBALL_SLINGS.forEach(([ax,ay,bx,by],i)=>{const c=this.capsule(b,ax,ay,bx,by,8,.88,0,0,false);if(c&&c.relative<-120&&this.slingCooldown[i]===0){b.vx+=c.nx*120;b.vy-=150;this.slingCooldown[i]=.25;this.award(s.rushTime>0?100:50);this.hit(c.x,c.y,'rubber');}});
  for(const side of ['left','right'] as const){const p=PINBALL_PADDLES[side],angle=side==='left'?s.leftAngle:s.rightAngle,old=side==='left'?oldLeft:oldRight,dx=Math.cos(angle)*100,dy=Math.sin(angle)*100,omega=(angle-old)/dt,projection=Math.max(0,Math.min(1,((b.x-p.x)*dx+(b.y-p.y)*dy)/10000));
   const c=this.capsule(b,p.x,p.y,p.x+dx,p.y+dy,12,.88,-omega*dy*projection,omega*dx*projection);
   if(c&&c.relative<0&&this.manual[side]&&this.pressAge[side]<.12&&!this.strokeUsed[side]&&Math.abs(omega)>8&&projection>.25&&b.vy<-250){this.strokeUsed[side]=true;s.perfects++;this.award(s.rushTime>0?500:250);this.hit(b.x,b.y,'perfect');this.callout('perfect');}}
  PINBALL_BUMPERS.forEach((p,i)=>{const dx=b.x-p.x,dy=b.y-p.y,dist=Math.hypot(dx,dy);if(dist>=p.r+11)return;
   const nx=dist>1e-6?dx/dist:0,ny=dist>1e-6?dy/dist:-1;b.x=p.x+nx*(p.r+11+.2);b.y=p.y+ny*(p.r+11+.2);const speed=b.vx*nx+b.vy*ny;if(speed<0){b.vx-=1.85*speed*nx;b.vy-=1.85*speed*ny;}
   if((this.cooldown[i]??0)>0)return;b.vx+=nx*180;b.vy+=ny*180;this.cooldown[i]=.16;s.hits++;s.combo++;s.bestCombo=Math.max(s.bestCombo,s.combo);this.comboTime=1.8;
   this.award((100+Math.min(10,s.combo-1)*25)*(s.rushTime>0?2:1));s.lit[i]=true;this.hit(p.x,p.y,'metal');
   if(this.firstHit){this.firstHit=false;if(i===s.skillTarget&&s.elapsed-this.launchedAt<=2.5){this.award(500);this.callout('skillshot');}}
   if(s.lit.every(Boolean)){s.lit=[false,false,false];if(s.rushTime>0){this.award(2000);s.jackpots++;this.hit(300,155,'jackpot');this.callout('jackpot');}
    else{this.award(1000);s.rushTime=10;s.extraBalls=[{x:140,y:340,vx:220,vy:-500},{x:460,y:340,vx:-220,vy:-500}];this.hit(300,155,'crane');this.callout('rush');}}});
  const speed=Math.hypot(b.vx,b.vy);if(speed>1300){b.vx*=1300/speed;b.vy*=1300/speed;}return b.y<=846;}
 private step(dt:number,input:PinballInput){const s=this.state;s.elapsed+=dt;s.remaining=Math.max(0,s.remaining-dt);this.protection=Math.max(0,this.protection-dt);this.comboTime=Math.max(0,this.comboTime-dt);if(this.comboTime===0)s.combo=0;
  this.cooldown=this.cooldown.map(c=>Math.max(0,c-dt));this.slingCooldown=this.slingCooldown.map(c=>Math.max(0,c-dt));s.effects=s.effects.map(e=>({...e,life:e.life-dt})).filter(e=>e.life>0);
  s.nudgeCooldown=Math.max(0,s.nudgeCooldown-dt);s.tiltTime=Math.max(0,s.tiltTime-dt);s.calloutTime=Math.max(0,s.calloutTime-dt);if(s.calloutTime===0)s.callout='';
  if(s.rushTime>0){s.rushTime=Math.max(0,s.rushTime-dt);if(s.rushTime===0)s.extraBalls=[];}
  for(const side of ['left','right'] as const){const pressed=input[side]&&s.tiltTime===0;if(pressed&&!this.manual[side]){this.pressAge[side]=0;this.strokeUsed[side]=false;}else this.pressAge[side]+=dt;this.manual[side]=pressed;
   this.assistPulse[side]=Math.max(0,this.assistPulse[side]-dt);this.assistCooldown[side]=Math.max(0,this.assistCooldown[side]-dt);if(!input.assist||s.tiltTime>0){this.assistPulse[side]=0;continue;}
   const arriving=[s,...s.extraBalls].some(b=>{const t=(715-b.y)/Math.max(1,b.vy),x=b.x+b.vx*Math.max(0,t);return b.vy>35&&b.y>640&&b.y<770&&t<=.065&&(side==='left'?x>=175&&x<=290:x>=310&&x<=425);});
   if(arriving&&this.assistCooldown[side]===0){this.assistPulse[side]=.11;this.assistCooldown[side]=.24;}}
  const oldLeft=s.leftAngle,oldRight=s.rightAngle,approach=(angle:number,target:number)=>angle+Math.max(-14*dt,Math.min(14*dt,target-angle));
  s.leftAngle=approach(s.leftAngle,this.manual.left||this.assistPulse.left>0?PINBALL_PADDLES.left.raised:PINBALL_PADDLES.left.rest);s.rightAngle=approach(s.rightAngle,this.manual.right||this.assistPulse.right>0?PINBALL_PADDLES.right.raised:PINBALL_PADDLES.right.rest);
  if(oldLeft===.35&&s.leftAngle<oldLeft)this.sounds.push({kind:'flipper',x:185});if(oldRight===Math.PI-.35&&s.rightAngle>oldRight)this.sounds.push({kind:'flipper',x:415});
  let alive=this.moveBall(s,dt,oldLeft,oldRight);s.extraBalls=s.extraBalls.filter(b=>this.moveBall(b,dt,oldLeft,oldRight));
  if(!alive&&s.extraBalls.length){const next=s.extraBalls.shift();if(next){Object.assign(s,next);alive=true;}}
  if(!alive){if(this.protection>0){s.saves++;this.protection=0;Object.assign(s,{x:480,y:650,vx:-170,vy:-1080});this.hit(480,650,'rubber');}else this.endBall();}if(s.remaining===0)this.endBall();}
}

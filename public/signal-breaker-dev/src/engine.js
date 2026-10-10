/* SIGNAL BREAKER — independent deterministic arcade prototype core.
   No assets, network, account, or SIGNAL WATCH persistence dependencies. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.SignalBreakerEngine=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const W=1100,H=620,GROUND=536,DT=1/120;
const STAGES=[
 {id:'SB-01',name:'첫 번째 반사',area:'기초 · 반입',summary:'방호판을 활용해 금속 신호를 분리하고 회수하세요.',types:['metal'],cores:[{x:410,y:175,vx:122,vy:32,tier:2,kind:'metal'},{x:800,y:228,vx:-96,vy:-30,tier:1,kind:'metal'}],bumper:[{x:729,y:286,r:44}],rail:[{x:515,y:323,length:168,angle:-0.58}],magnet:{x:870,y:400},gate:{x:1019,y:461},conveyor:false,boss:false},
 {id:'SB-02',name:'확산과 안정화',area:'기초 · 집진',summary:'분진 코어는 포획 장비로 안정적으로 회수하면 높은 점수를 얻습니다.',types:['metal','dust'],cores:[{x:416,y:225,vx:105,vy:-50,tier:2,kind:'dust'},{x:805,y:175,vx:-103,vy:52,tier:1,kind:'metal'}],bumper:[{x:673,y:245,r:40}],rail:[{x:498,y:335,length:200,angle:0.50}],magnet:{x:850,y:380},gate:{x:1025,y:465},conveyor:true,boss:false},
 {id:'SB-03',name:'정밀 회수 통로',area:'기초 · 컨베이어',summary:'방호판의 각도를 조절하고 자력장을 이용해 연속 회수하세요.',types:['metal','dust','power'],cores:[{x:380,y:163,vx:120,vy:68,tier:2,kind:'metal'},{x:748,y:130,vx:-111,vy:20,tier:1,kind:'power'},{x:930,y:251,vx:-75,vy:-40,tier:1,kind:'dust'}],bumper:[{x:570,y:245,r:40},{x:843,y:299,r:34}],rail:[{x:480,y:378,length:195,angle:-0.64}],magnet:{x:825,y:382},gate:{x:1025,y:450},conveyor:true,boss:false},
 {id:'SB-04',name:'BOSS · 반입동선 혼선',area:'기초 · 보스',summary:'중계 노드 3개를 활성화해 실드를 해제하고 최종 코어를 해소하세요.',types:['metal','load'],cores:[{x:345,y:235,vx:95,vy:15,tier:1,kind:'load'}],bumper:[{x:530,y:336,r:40}],rail:[{x:495,y:338,length:195,angle:-0.48}],magnet:{x:845,y:394},gate:{x:1015,y:468},conveyor:true,boss:true}
];
const KINDS={metal:{color:'#6ee6f9',rim:'#e1fcff',restitution:.94},dust:{color:'#ffc06b',rim:'#fff3c4',restitution:.78},power:{color:'#be99ff',rim:'#ede1ff',restitution:.96},load:{color:'#ff9567',rim:'#ffe3a2',restitution:.86}};
const finite=(x,def=0)=>Number.isFinite(x)?x:def;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const mass=tier=>Math.pow(2,Math.max(0,tier));
function createRng(seed){let s=(seed>>>0)||1;return ()=>{s=(1664525*s+1013904223)>>>0;return s/4294967296;};}
function closest(px,py,ax,ay,bx,by){let dx=bx-ax,dy=by-ay,t=clamp(((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy||1),0,1);return {x:ax+dx*t,y:ay+dy*t,t};}
class Game {
 constructor(stageId='SB-01',seed=20261010){this.config=STAGES.find(x=>x.id===stageId)||STAGES[0];this.seed=seed;this.random=createRng(seed);this.id=0;this.reset();}
 reset(){const c=this.config;this.time=0;this.accumulator=0;this.state='ready';this.player={x:290,y:563,life:5,invuln:0,aimX:625,aimY:245};this.weapon='pulse';this.shots=[];this.cores=[];this.particles=[];this.floaters=[];this.events=[];this.effects=[];this.score=0;this.cleared=0;this.maxUnits=c.cores.reduce((a,v)=>a+mass(v.tier),0);this.chain=0;this.bestChain=0;this.comboTime=0;this.shotsFired=0;this.shotsHit=0;this.captureUnits=0;this.bounces=0;this.shieldAngle=0;this.magnetOn=true;this.cooldown=0;this.shake=0;this.story=c.summary;this.boss=c.boss?{phase:'sealed',nodes:[{x:686,y:154,hit:false},{x:882,y:162,hit:false},{x:787,y:296,hit:false}],x:785,y:199,exposure:0}:null;this.rail=c.rail.map(x=>({...x}));for(const spec of c.cores)this.addCore({...spec});}
 addCore(spec){if(this.cores.length>=36)return false;const r=spec.tier===2?31:spec.tier===1?23:14;this.cores.push({id:++this.id,x:spec.x,y:spec.y,vx:spec.vx,vy:spec.vy,r,tier:spec.tier,kind:spec.kind,age:0,glow:0,stable:spec.stable||false});return true;}
 event(kind,x=W/2,y=H/2,n=0){this.events.push({kind,x,y,n,t:this.time});if(this.events.length>70)this.events.shift();}
 drainEvents(){return this.events.splice(0);}
 start(){if(this.state==='ready'){this.state='playing';this.event('start');}return this.state==='playing';}
 pause(){if(this.state==='playing')this.state='paused';else if(this.state==='paused')this.state='playing';return this.state;}
 setAim(x,y){this.player.aimX=clamp(finite(x,625),25,W-25);this.player.aimY=clamp(finite(y,280),28,GROUND-40);}
 move(direction,dt){if(this.state!=='playing')return;this.player.x=clamp(this.player.x+clamp(finite(direction),-1,1)*285*clamp(dt,0,.05),57,W-57);}
 cycleShield(){if(this.state!=='playing'&&this.state!=='ready')return;this.shieldAngle=(this.shieldAngle+1)%3;this.event('shield',495,340,this.shieldAngle);}
 toggleMagnet(){if(this.state!=='playing'&&this.state!=='ready')return;this.magnetOn=!this.magnetOn;this.event('magnet',this.config.magnet.x,this.config.magnet.y,this.magnetOn?1:0);}
 selectWeapon(id){if(id==='pulse'||id==='net'){this.weapon=id;this.event('weapon',this.player.x,this.player.y,id==='pulse'?1:2);}}
 fire(){if(this.state==='ready')this.start();if(this.state!=='playing'||this.cooldown>0)return false;
  let dx=this.player.aimX-this.player.x,dy=this.player.aimY-this.player.y;
  if(dy>-18)dy=-85;
  const m=Math.hypot(dx,dy)||1, vx=dx/m,vy=dy/m;
  const net=this.weapon==='net';this.shots.push({id:++this.id,x:this.player.x,y:this.player.y-25,vx:vx*(net?570:770),vy:vy*(net?570:770),r:net?20:8,kind:this.weapon,life:net?1.85:1.6,bounces:0,trail:[],hit:false});this.cooldown=net?.53:.29;this.shotsFired++;this.event('fire',this.player.x,this.player.y,net?2:1);return true;
 }
 update(elapsed){if(this.state!=='playing')return;let d=clamp(finite(elapsed),0,.066);this.accumulator=Math.min(.099,this.accumulator+d);let n=0;while(this.accumulator>=DT&&n<12){this.step(DT);this.accumulator-=DT;n++;}}
 step(dt){this.time+=dt;this.cooldown=Math.max(0,this.cooldown-dt);this.player.invuln=Math.max(0,this.player.invuln-dt);this.shake=Math.max(0,this.shake-18*dt);this.comboTime=Math.max(0,this.comboTime-dt);if(this.comboTime===0)this.chain=0;
  for(const f of this.floaters)f.life-=dt;this.floaters=this.floaters.filter(v=>v.life>0).slice(-35);
  for(const p of this.particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.986;p.vy+=55*dt;}this.particles=this.particles.filter(p=>p.life>0).slice(-100);for(const e of this.effects)e.life-=dt;this.effects=this.effects.filter(e=>e.life>0).slice(-20);
  if(this.boss&&this.boss.phase==='exposed')this.boss.exposure+=dt;
  for(const s of this.shots){s.life-=dt;s.trail.push({x:s.x,y:s.y});if(s.trail.length>7)s.trail.shift();s.x+=s.vx*dt;s.y+=s.vy*dt;this.shotEdges(s);if(s.life<=0)continue;this.shotRail(s);if(this.boss)this.shotBoss(s);if(s.life<=0)continue;for(const core of [...this.cores]){if(s.life<=0)break;if((s.x-core.x)**2+(s.y-core.y)**2<(s.r+core.r)**2){s.hit=true;s.life=-1;this.shotsHit++;if(s.kind==='net')this.netBurst(core);else this.pulse(core,s);}}}
  this.shots=this.shots.filter(x=>x.life>0).slice(-32);
  for(const core of [...this.cores])this.coreMotion(core,dt);
  if(this.cores.length===0&&(!this.boss||this.boss.phase==='resolved')&&this.state==='playing')this.finish(true);
 }
 shotEdges(s){if(s.x<13||s.x>W-13){s.x=clamp(s.x,13,W-13);if(s.bounces<2){s.vx*=-.89;s.bounces++;this.bounces++;this.event('ricochet',s.x,s.y);}else s.life=-1;}
  if(s.y<17){s.y=17;if(s.bounces<2){s.vy=Math.abs(s.vy)*.92;s.bounces++;this.bounces++;this.event('ricochet',s.x,s.y);}else s.life=-1;}if(s.y>GROUND+12)s.life=-1;}
 railSegment(v){const a=this.shieldAngle===0?v.angle:this.shieldAngle===1?v.angle+.5:v.angle-.5;return {ax:v.x-Math.cos(a)*v.length/2,ay:v.y-Math.sin(a)*v.length/2,bx:v.x+Math.cos(a)*v.length/2,by:v.y+Math.sin(a)*v.length/2};}
 bounceSegment(obj,v,r,rest){const seg=this.railSegment(v),q=closest(obj.x,obj.y,seg.ax,seg.ay,seg.bx,seg.by),dd=Math.hypot(obj.x-q.x,obj.y-q.y);if(dd>=obj.r+r)return false;let nx=dd>.0001?(obj.x-q.x)/dd:0,ny=dd>.0001?(obj.y-q.y)/dd:-1;obj.x=q.x+nx*(obj.r+r+.25);obj.y=q.y+ny*(obj.r+r+.25);let dot=obj.vx*nx+obj.vy*ny;if(dot<0){obj.vx-=(1+rest)*dot*nx;obj.vy-=(1+rest)*dot*ny;return true;}return false;}
 shotRail(s){for(const v of this.rail){if(this.bounceSegment(s,v,9,.98)){s.bounces++;this.bounces++;this.event('ricochet',s.x,s.y);if(s.bounces>4)s.life=-1;}}}
 shotBoss(s){const b=this.boss;if(!b||s.life<=0)return;for(const n of b.nodes){if(n.hit||Math.hypot(s.x-n.x,s.y-n.y)>s.r+23)continue;if(s.kind==='net'){this.event('denied',n.x,n.y);s.life=-1;return;}n.hit=true;s.life=-1;this.shotsHit++;this.score+=380;this.event('node',n.x,n.y);this.emitParticles(n.x,n.y,'#93faff',18);if(b.nodes.every(x=>x.hit)){b.phase='exposed';this.event('unseal',b.x,b.y);this.floaters.push({x:b.x,y:b.y-65,label:'방호 해제!',life:1.4,color:'#d4ffe7'});}return;}
  if(b.phase!=='resolved'&&Math.hypot(s.x-b.x,s.y-b.y)<s.r+48){s.life=-1;if(b.phase==='sealed'){this.event('denied',s.x,s.y);this.emitParticles(s.x,s.y,'#7fbcf0',6);}else {b.phase='resolved';this.score+=2200;this.shake=7;this.event('boss',b.x,b.y);this.emitParticles(b.x,b.y,'#f5c76e',65);this.floaters.push({x:b.x,y:b.y-70,label:'ZERO CHAIN!',life:1.7,color:'#fff2aa'});}}
 }
 pulse(core,shot){const at={x:core.x,y:core.y};core.glow=.2;this.shake=Math.max(this.shake,3);this.chainAction(65+shot.bounces*35,core.x,core.y);this.emitParticles(core.x,core.y,KINDS[core.kind].color,12);this.event('impact',core.x,core.y,shot.bounces);this.cores=this.cores.filter(x=>x.id!==core.id);
  if(core.tier>0){const speed=core.tier===2?166:205;let v=Math.atan2(shot.vy,shot.vx)+Math.PI/2;let ok1=this.addCore({x:clamp(at.x-12,30,W-30),y:at.y-8,tier:core.tier-1,kind:core.kind,stable:core.stable,vx:Math.cos(v)*speed-35,vy:Math.sin(v)*speed-90});let ok2=this.addCore({x:clamp(at.x+12,30,W-30),y:at.y-8,tier:core.tier-1,kind:core.kind,stable:core.stable,vx:-Math.cos(v)*speed+35,vy:-Math.sin(v)*speed-90});if(!ok1||!ok2){this.cleared+=(!ok1?mass(core.tier-1):0)+(!ok2?mass(core.tier-1):0);}this.event('split',at.x,at.y,core.tier);
  }else{this.cleared++;this.event('resolved',at.x,at.y);this.score+=95;}
 }
 netBurst(target){const x=target.x,y=target.y;this.effects.push({x,y,life:.48});this.event('netfield',x,y);const captured=[...this.cores].filter(c=>Math.hypot(c.x-x,c.y-y)<=102+c.r);for(const core of captured)this.capture(core,true);}
 capture(core,byNet=false){const amount=mass(core.tier);if(byNet&&core.tier===2&&!core.stable){core.stable=true;core.vx*=.48;core.vy*=.48;core.glow=.8;this.event('stabilize',core.x,core.y);this.floaters.push({x:core.x,y:core.y-34,label:'안정화',life:.7,color:'#aefbdc'});return;}
  this.cores=this.cores.filter(x=>x.id!==core.id);this.cleared+=amount;this.captureUnits+=amount;this.chainAction((core.kind==='dust'?300:200)*amount,core.x,core.y);this.emitParticles(core.x,core.y,core.kind==='dust'?'#ffd899':'#96ffe1',15+Math.min(12,amount*3));this.event('capture',core.x,core.y,amount);
 }
 chainAction(base,x,y){this.chain++;this.bestChain=Math.max(this.chain,this.bestChain);this.comboTime=2.5;const pts=Math.round(base*(1+Math.min(this.chain-1,9)*.13));this.score+=pts;this.floaters.push({x,y:y-20,label:'+'+pts+(this.chain>=3?'  ×'+this.chain:''),life:.78,color:this.chain>=3?'#fff09e':'#b2f6ff'});if(this.chain%5===0)this.event('chain',x,y,this.chain);}
 emitParticles(x,y,color,count){for(let i=0;i<count&&this.particles.length<115;i++){const a=this.random()*Math.PI*2,s=40+this.random()*200;this.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.18+this.random()*.5,max:.68,color,size:1.4+this.random()*4});}}
 coreMotion(c,dt){c.age+=dt;c.glow=Math.max(0,c.glow-dt);const gravity=c.kind==='dust'?40:115;c.vy+=gravity*dt;if(this.magnetOn&&c.kind==='metal'){const m=this.config.magnet,dx=m.x-c.x,dy=m.y-c.y,d=Math.hypot(dx,dy);if(d<240&&d>15){let p=clamp((240-d)/240,0,1)*230;c.vx+=dx/d*p*dt;c.vy+=dy/d*p*dt;}}
  if(this.config.conveyor&&c.y>455&&c.x>325&&c.x<850)c.vx+=65*dt;
  c.x+=c.vx*dt;c.y+=c.vy*dt;const bounce=KINDS[c.kind].restitution;
  if(c.x<c.r+15){c.x=c.r+15;c.vx=Math.abs(c.vx)*bounce;}if(c.x>W-15-c.r){c.x=W-15-c.r;c.vx=-Math.abs(c.vx)*bounce;}if(c.y<48+c.r){c.y=48+c.r;c.vy=Math.abs(c.vy)*bounce;}if(c.y>GROUND-c.r){c.y=GROUND-c.r;c.vy=-Math.max(Math.abs(c.vy)*bounce,155);c.vx*=.996;}
  for(const b of this.config.bumper){const dx=c.x-b.x,dy=c.y-b.y,d=Math.hypot(dx,dy);if(d<c.r+b.r&&d>1){const nx=dx/d,ny=dy/d;c.x=b.x+nx*(c.r+b.r+1);c.y=b.y+ny*(c.r+b.r+1);const v=c.vx*nx+c.vy*ny;if(v<0){c.vx-=(1+1.08)*v*nx;c.vy-=(1+1.08)*v*ny;c.vx+=nx*40;c.vy+=ny*40;this.event('bumper',b.x,b.y);}}}
  for(const rail of this.rail){if(this.bounceSegment(c,rail,7,bounce)){this.event('corebounce',c.x,c.y);}}
  const g=this.config.gate;if(c.tier<=1&&c.x>g.x-32&&c.y>g.y-92&&c.y<g.y+74&&c.vx>30)this.capture(c);
  if(this.player.invuln===0&&Math.hypot(c.x-this.player.x,c.y-(this.player.y-10))<c.r+23){this.player.life--;this.player.invuln=1.8;this.shake=7;this.event('hurt',this.player.x,this.player.y,this.player.life);c.vy=-240;c.vx=(c.x-this.player.x>0?1:-1)*200;if(this.player.life<=0)this.finish(false);}
  let speed=Math.hypot(c.vx,c.vy);if(speed>520){c.vx*=520/speed;c.vy*=520/speed;}
 }
 finish(win){if(this.state!=='playing')return;this.state=win?'won':'lost';this.event(win?'victory':'defeat',W/2,H/2,Math.round(this.score));}
 snapshot(){return {stage:this.config.id,state:this.state,score:this.score,cleared:this.cleared,total:this.maxUnits,chain:this.chain,bestChain:this.bestChain,shotsFired:this.shotsFired,shotsHit:this.shotsHit,captureUnits:this.captureUnits,life:this.player.life,weapon:this.weapon,bossPhase:this.boss?.phase||null,activeCores:this.cores.length};}
}
return {Game,STAGES,KINDS,W,H,DT,createRng,closest,mass};
});
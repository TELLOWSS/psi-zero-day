/* Deterministic raid simulation. Called exclusively by engine actions and steps. */
(function(root,factory){const req=typeof module==='object'&&module.exports,api=factory(req?require('./boss-encounter-registry.js'):root.SignalBreakerRaidRegistry,req?require('./boss-counter-resolver.js'):root.SignalBreakerRaidCounter);if(req)module.exports=api;root.SignalBreakerRaid=api;})(typeof globalThis!=='undefined'?globalThis:this,function(Registry,Counter){'use strict';
 const bounded=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
 function log(g,kind,extra={}){const r=g.boss.raid;const row={kind,time:g.time,phase:r.phase,pattern:r.pattern,...extra};r.log.push(row);if(r.log.length>120)r.log.shift();g.event('raid'+kind,g.boss.x,g.boss.y,r.phase,g.boss.identity);}
 function create(g,b){if(!g.raidEnabled||!Registry.bosses[b.identity])return b;
  const tune=Registry.pattern(b.identity,1,g.episode,g.raidDifficulty);b.maxHp=Math.round((45+b.stage*10)*(1+(g.episode-1)*.2));b.hp=b.maxHp;b.phase='exposed';b.nodes=[];
  b.raid={version:2,difficulty:g.raidDifficulty,phase:1,state:'INTRO',until:g.time+1.2,pattern:b.identity+'.1',counter:tune.counter,pressure:0,successes:0,attempts:0,failures:0,observed:0,damageTaken:0,burstDamage:0,totalDamage:0,required:false,log:[],lastFailure:null,started:g.time,practice:!!g.raidPractice};return b;
 }
 function configure(g){const b=g.boss,r=b.raid,p=Registry.pattern(b.identity,r.phase,g.episode,r.difficulty);Object.assign(r,{counter:p.counter,pattern:b.identity+'.'+r.phase,required:false,pressure:0,sequence:0,requireEvade:p.compound,evaded:false});b.phase='exposed';b.nodes=[];}
 function observe(g){const r=g.boss.raid;r.state='OBSERVE';r.until=g.time+.8;}
 function warning(g){const b=g.boss,r=b.raid,p=Registry.pattern(b.identity,r.phase,g.episode,r.difficulty);r.state='WARNING';r.observed++;r.attempts++;r.fake=p.fake;r.warningDuration=p.warning+(p.fake?.65:0);r.trueAt=g.time+(p.fake?.65:0);r.deadline=r.trueAt+p.warning;r.initialBelt=g.conveyorDirection;r.evaded=false;r.laneX=b.identity==='delivery'?g.player.x:b.identity==='grid'?[300,650,950][(r.phase+r.sequence-1)%3]:b.identity==='extraction'?b.x:650;r.half=p.half;r.direction=(r.phase+r.sequence)%2?1:-1;b.warningUntil=r.deadline;log(g,'warning');}
 function safe(g){const r=g.boss.raid;return Math.abs(g.player.x-r.laneX)>r.half+24;}
 function success(g){const b=g.boss,r=b.raid,p=Registry.pattern(b.identity,r.phase,g.episode,r.difficulty);r.successes++;r.sequence++;b.warningUntil=0;g.score+=200;
  if(p.compound&&r.sequence<2){r.state='RECOVERY';r.until=g.time+.9;log(g,'sequence');return;}
  if(p.support){r.state='SUPPORT';r.until=g.time+8;b.nodes=[{id:'raid-left',x:b.x-105,y:420,hit:false},{id:'raid-right',x:b.x+105,y:420,hit:false}];log(g,'support');return;}
  stagger(g);
 }
 function stagger(g){const b=g.boss,r=b.raid;r.required=true;r.state='STAGGER';r.until=g.time+.25;b.nodes=[];b.warningUntil=0;log(g,'counter');}
 function fail(g,cause='missed'){const b=g.boss,r=b.raid,p=Registry.pattern(b.identity,r.phase,g.episode,r.difficulty);r.failures++;r.lastFailure={pattern:r.pattern,cause,phase:r.phase,at:g.time,warned:true,position:g.player.x,weapon:g.weapon};r.state='RECOVERY';r.until=g.time+p.retry;r.sequence=0;b.nodes=[];b.warningUntil=0;log(g,'failure',{cause});}
 function action(g,a){const r=g.boss?.raid;if(!r||g.state!=='playing')return false;
  if(r.state==='WARNING'&&g.time>=r.trueAt&&safe(g))r.evaded=true;
  if(!Counter.resolve(g,a))return false;success(g);return true;
 }
 function step(g){const b=g.boss,r=b?.raid;if(!r||g.state!=='playing'||b.phase==='resolved')return;
  if(r.state==='INTRO'&&g.time>=r.until){configure(g);observe(g);}
  else if((r.state==='OBSERVE'||r.state==='RECOVERY')&&g.time>=r.until)warning(g);
  else if(r.state==='WARNING'){
   if(g.time>=r.trueAt&&safe(g))r.evaded=true;
   if(g.time>=r.deadline){if(!safe(g)&&!g.godMode&&g.damagePlayer(Registry.bosses[b.identity].material,g.player.x,g.player.y,'raid:'+b.identity))r.damageTaken++;fail(g,r.fake?'early_or_missed':'missed');}
  }else if(r.state==='SUPPORT'){if(b.nodes.every(n=>n.hit))stagger(g);else if(g.time>=r.until)fail(g,'support');}
  else if(r.state==='STAGGER'&&g.time>=r.until){r.state='BURST';r.until=g.time+Registry.difficulties[r.difficulty].weakpoint;log(g,'burst');}
  else if(r.state==='BURST'&&g.time>=r.until){r.state='OBSERVE';r.until=g.time+.8;}
  else if(r.state==='TRANSITION'&&g.time>=r.until){configure(g);observe(g);}
 }
 function damage(g,amount){const b=g.boss,r=b.raid;if(!Number.isFinite(amount)||amount<=0||['INTRO','TRANSITION','STAGGER','FINISHER'].includes(r.state))return 0;
  const p=Registry.pattern(b.identity,r.phase,g.episode,r.difficulty),floor=b.maxHp*p.floor;
  const multiplier=r.state==='BURST'?1.5+bounded(r.pressure/b.maxHp,0,.15):1;
  const lower=r.required?floor:Math.max(floor,r.phase===3?1:floor),next=Math.max(lower,b.hp-amount*multiplier),dealt=b.hp-next;
  r.pressure=bounded(r.pressure+Math.max(0,amount*multiplier-dealt)*.1,0,b.maxHp*.15);b.hp=next;r.totalDamage+=dealt;if(r.state==='BURST')r.burstDamage+=dealt;
  if(r.required&&b.hp<=floor+1e-7){if(r.phase<3&&!g.raidPractice){r.phase++;r.state='TRANSITION';r.until=g.time+.8;r.required=false;r.sequence=0;r.pressure=0;b.warningUntil=0;b.nodes=[];log(g,'phase');}else{b.hp=0;b.phase='resolved';r.state='FINISHER';r.finished=g.time;g.score+=2200;log(g,'clear');g.event('boss',b.x,b.y);}}
  return dealt;
 }
 function shot(g,s){const b=g.boss,r=b.raid;if(g.state!=='playing'||b.phase==='resolved'||s.life<=0)return;s.life=-1;
  const node=b.nodes.find(n=>!n.hit&&Math.hypot(s.x-n.x,s.y-n.y)<=s.r+23.00001);
  if(node){if(['pulse','bankshot','resonance'].includes(s.kind)){node.hit=true;g.event('node',node.x,node.y);}return;}
  if(Math.hypot(s.x-b.x,s.y-b.y)>s.r+48.00001)return;
  if(s.kind==='mist'){action(g,{kind:'mist',intake:true});return;}
  if(['pulse','bankshot','resonance'].includes(s.kind)){action(g,{kind:'bank',bounces:s.bounces||0});damage(g,g.growthDamage(s)+(g.veteran?Math.max(0,g.raidEvolutionDamage(s,b)-1):0));g.event('bosshit',b.x,b.y);}
 }
 function skipIntro(g){const r=g.boss?.raid;if(g.state!=='playing'||r?.state!=='INTRO')return false;configure(g);observe(g);return true;}
 function snapshot(g){const b=g.boss,r=b?.raid;if(!r)return null;return {...r,log:r.log.map(v=>({...v})),lastFailure:r.lastFailure?{...r.lastFailure}:null,hp:b.hp,maxHp:b.maxHp,identity:b.identity,elapsed:(r.finished??g.time)-r.started,remaining:Math.max(0,(r.state==='WARNING'?r.deadline:r.until)-g.time),trueSignal:r.state==='WARNING'&&g.time>=r.trueAt};}
 return {create,action,step,damage,shot,skipIntro,snapshot};
});

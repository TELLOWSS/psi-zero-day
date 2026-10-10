// Read-only simulation: actual projectiles, collision, damage and completion rules.
// Synthetic inputs are not a human playtest. Never removes/captures fixture cores.
const fs=require('node:fs'),path=require('node:path');
const {Game,CHAPTER}=require('../src/engine.js');
const dt=1/60,seeds=Array.from({length:16},(_,i)=>20261010+(i+1)*7919),limit=180;
function simulate(id,seed,policy,gear='default'){
 const g=new Game(id,seed,{extended:true,premiumRun:true});if(gear==='pulse-only')g.setLoadout(['pulse','net']);g.start();g.drainEvents();
 let assistAt=0,target=null,frames=0,empty=0,maxCores=g.cores.length,totalCores=0;const events={},waves=[],rests=[],trace=[];let traceAt=0,start=0,counts={};
 const drain=()=>{for(const e of g.drainEvents()){events[e.kind]=(events[e.kind]||0)+1;counts[e.kind]=(counts[e.kind]||0)+1;}};
 const waveEnd=()=>{waves.push({wave:g.wave,seconds:+(g.time-start).toFixed(3),initial:g.wavePlans[g.wave-1].length,events:{...counts},life:g.player.life});start=g.time;counts={};};
 while(g.state==='playing'||g.state==='intermission'){
  if(g.time>=limit)break;
  if(g.state==='intermission'){waveEnd();rests.push(g.wave);g.chooseTuning(g.draft[0]);assistAt=0;target=null;drain();continue;}
  let direction=0;if(policy==='patrol')direction=Math.sin(g.time*.55)>0?1:-1;
  if(policy==='track'){const node=(g.boss?.phase==='sealed'?g.boss.nodes:g.circuit).find(n=>!n.hit),object=node||(g.boss?.phase==='exposed'?g.boss:g.cores.reduce((a,c)=>!a||Math.abs(c.x-g.player.x)<Math.abs(a.x-g.player.x)?c:a,null));if(object)direction=Math.abs(object.x-g.player.x)>20?(object.x>g.player.x?1:-1):0;}
  g.move(direction,dt,false,true);g.update(dt);
  if(g.state==='playing'){if(g.time>=assistAt){if(gear==='pulse-only')g.selectWeapon('pulse');target=g.assistAim(gear!=='pulse-only');assistAt=g.time+.12;}if(target?.aligned)g.fire();}
  drain();if(policy==='stationary'&&['CH-03','CH-05'].includes(id)&&seed===seeds[0]&&g.time>=traceAt){trace.push({time:+g.time.toFixed(2),wave:g.wave,weapon:g.weapon,playerX:g.player.x,shots:g.shotsFired,cores:g.cores.map(c=>({id:c.id,kind:c.kind,tier:c.tier,x:+c.x.toFixed(1),y:+c.y.toFixed(1),stable:c.stable,mistExposure:+(c.mistExposure||0).toFixed(3)})),fields:g.fields.map(f=>({kind:f.kind,x:+f.x.toFixed(1),y:+f.y.toFixed(1)})),boss:g.boss?{phase:g.boss.phase,nodes:g.boss.nodes.map(n=>({x:n.x,y:n.y,hit:n.hit}))}:null});traceAt=g.time+10;}frames++;totalCores+=g.cores.length;maxCores=Math.max(maxCores,g.cores.length);if(!g.cores.length)empty++;
 }
 if(g.state==='won')waveEnd();
 return {stage:id,seed,policy,gear,state:g.state,time:+g.time.toFixed(3),waves,pauses:rests.length,shots:g.shotsFired,life:g.player.life,events,maxCores,meanCores:+(totalCores/(frames||1)).toFixed(3),emptyPercent:+(empty/(frames||1)*100).toFixed(2),tunings:[...g.tunings],trace};
}
const runs=[];for(const c of CHAPTER)for(const policy of ['stationary','patrol','track'])for(const seed of seeds)runs.push(simulate(c.id,seed,policy));
const quant=(xs,q)=>{const s=xs.slice().sort((a,b)=>a-b);return s.length?+s[Math.round((s.length-1)*q)].toFixed(2):null;};
const groups=[];for(const c of CHAPTER)for(const policy of ['stationary','patrol','track']){const rows=runs.filter(r=>r.stage===c.id&&r.policy===policy),waves=rows.flatMap(r=>r.waves),won=rows.filter(r=>r.state==='won');groups.push({stage:c.id,policy,runs:rows.length,won:won.length,lost:rows.filter(r=>r.state==='lost').length,timeout:rows.filter(r=>!['won','lost'].includes(r.state)).length,completeWaves:waves.length,waveP10:quant(waves.map(r=>r.seconds),.1),waveMedian:quant(waves.map(r=>r.seconds),.5),waveP90:quant(waves.map(r=>r.seconds),.9),waveUnder5:waves.filter(w=>w.seconds<5).length,waveUnder10:waves.filter(w=>w.seconds<10).length,runMedian:quant(won.map(r=>r.time),.5),impactsMedian:quant(waves.map(w=>w.events.impact||0),.5),splitsMedian:quant(waves.map(w=>w.events.split||0),.5),capturesMedian:quant(waves.map(w=>w.events.capture||0),.5),maxCoresMedian:quant(rows.map(r=>r.maxCores),.5),meanCoresMedian:quant(rows.map(r=>r.meanCores),.5)});}
const counterfactual=[];for(const id of ['CH-01','CH-02'])for(const seed of seeds)counterfactual.push(simulate(id,seed,'track','pulse-only'));
const out=process.env.SIGNAL_BREAKER_AUDIT_OUTPUT||path.resolve(__dirname,'../../../docs/qa/signal-breaker-pacing-20261011/results.json');
const report={commit:process.env.SIGNAL_BREAKER_AUDIT_SHA||'ac457774fee311c3c6ce0f33340152f3811ea748',method:{seeds:16,policies:['stationary','patrol','track'],dt,assistInterval:.12,limitSeconds:limit,gear:'default stage loadout, level 1, smart gear, auto fire; first offered tuning',noCompletionFixtures:true,selectionDwellSecondsAssumed:3},groups,runs,counterfactual};fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');console.table(groups);console.log('Wrote',out);

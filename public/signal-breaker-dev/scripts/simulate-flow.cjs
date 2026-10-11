/* Actual engine rules and ordinary inputs. No forced capture, life refill or state completion. */
const fs=require('node:fs'),path=require('node:path');
const {Game,CHAPTER,DT}=require('../src/engine.js');
function simulate(id,seed,profile='roam',limit=180){
 const g=new Game(id,seed,{extended:true,premiumRun:true,causal:id==='CH-01'});g.start();
 let assist=null,nextAssist=0,lastProgress=0,progressKey='',maxIdle=0;
 const peaks={cores:0,shots:0,fields:0,particles:0},events={};
 for(let tick=0;tick<limit/DT&&['playing','intermission'].includes(g.state);tick++){
  if(g.state==='intermission'){g.chooseTuning(g.draft[0]);nextAssist=0;continue;}
  if(g.source&&g.time>=2&&!g.source.observed)g.observeSource();
  if(g.source&&g.time>=3&&!g.source.requested)g.controlSource('isolate');
  if(profile==='roam'){
   const danger=g.cores.filter(c=>c.y>430&&Math.abs(c.x-g.player.x)<130).sort((a,b)=>Math.abs(a.x-g.player.x)-Math.abs(b.x-g.player.x))[0];
   const direction=danger?(danger.x>=g.player.x?-1:1):(Math.sin(g.time*.35)>=0?1:-1);
   g.move(g.player.x<90?1:g.player.x>1010?-1:direction,DT,false,true);
  }
  g.update(DT);
  if(g.time>=nextAssist){assist=g.assistAim(true);nextAssist=g.time+.12;}
  if(assist?.aligned)g.fire();
  for(const k of Object.keys(peaks))peaks[k]=Math.max(peaks[k],g[k].length);
  for(const e of g.drainEvents())events[e.kind]=(events[e.kind]||0)+1;
  const key=[g.wave,g.cleared,g.stableCaptures,g.circuit.filter(n=>n.hit).length,g.boss?.phase,g.boss?.nodes.filter(n=>n.hit).length,g.cores.filter(c=>c.stable).length,g.source?.verified].join(':');
  if(key!==progressKey){progressKey=key;lastProgress=g.time;}
  maxIdle=Math.max(maxIdle,g.time-lastProgress);
 }
 return {chapter:id,seed,profile,state:g.state==='playing'?'timeout':g.state,wave:g.wave,seconds:+g.time.toFixed(2),life:g.player.life,cleared:g.cleared,total:g.maxUnits,shots:g.shotsFired,hits:g.shotsHit,maxIdle:+maxIdle.toFixed(2),peaks,events,remaining:g.cores.map(c=>({kind:c.kind,tier:c.tier,stable:c.stable})),history:g.waveHistory};
}
function summarize(runs){return CHAPTER.flatMap(c=>['stationary','roam'].map(profile=>{const rows=runs.filter(r=>r.chapter===c.id&&r.profile===profile);return {chapter:c.id,profile,runs:rows.length,won:rows.filter(r=>r.state==='won').length,lost:rows.filter(r=>r.state==='lost').length,timeout:rows.filter(r=>r.state==='timeout').length,meanWave:+(rows.reduce((n,r)=>n+r.wave,0)/rows.length).toFixed(2),maxIdle:Math.max(...rows.map(r=>r.maxIdle)),peakCores:Math.max(...rows.map(r=>r.peaks.cores)),peakShots:Math.max(...rows.map(r=>r.peaks.shots))};}));}
if(require.main===module){const runs=[];for(const c of CHAPTER)for(const profile of ['stationary','roam'])for(let seed=1;seed<=8;seed++)runs.push(simulate(c.id,seed,profile));const result={method:'5 chapters × 2 deterministic input profiles × 8 seeds; 180 seconds per run; 120 Hz rules; assist every 0.12 seconds; first offered tuning; ordinary source commands; no forced completion. Not human win rate or device FPS.',summary:summarize(runs),runs};const out=process.argv[2]||path.join(__dirname,'../docs/flow-simulation.json');fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(result,null,2));console.log(JSON.stringify(result.summary,null,2));}
module.exports={simulate,summarize};

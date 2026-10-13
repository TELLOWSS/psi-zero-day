/* Actual command simulation: no forced clears, damage overrides or life refills. */
const fs=require('node:fs'),{Game,DT}=require('../src/engine.js');
function run(stage,seed,policy){
 const g=new Game(stage,seed,{extended:true,premiumRun:true,burst:true,continuous:true,operation:true,causal:stage==='CH-01',autoTuning:policy==='auto'}),choices=[];
 g.start();let peakShots=0;
 for(let i=0;i<360/DT&&!['won','lost'].includes(g.state);i++){
  if(g.state==='intermission'){
   const candidates=[...g.draft],choice=policy==='last'?candidates.at(-1):policy==='middle'?candidates[Math.floor(candidates.length/2)]:candidates[0];
   choices.push({wave:g.wave,candidates,choice});if(!g.chooseTuning(choice))throw Error('invalid draft');
  }
  if(g.source&&g.time>=2&&!g.source.observed)g.observeSource();if(g.source&&g.time>=3&&!g.source.requested)g.controlSource('isolate');
  const danger=g.cores.find(c=>c.y>430&&Math.abs(c.x-g.player.x)<130),d=danger?(danger.x>=g.player.x?-1:1):(Math.sin(g.time*.35)>=0?1:-1);
  g.move(g.player.x<90?1:g.player.x>1010?-1:d,DT,false,true);g.update(DT);if(i%14===0)g.assistAim(true);g.fire();if(g.runPoints>=40)g.activateBoost();g.drainEvents();peakShots=Math.max(peakShots,g.shots.length);
 }
 return {stage,seed,policy,state:g.state,time:+g.time.toFixed(3),life:g.player.life,wave:g.wave,bossHP:g.boss?.hp??null,choices,tunings:g.tunings,peakShots};
}
const runs=[];for(let n=1;n<=5;n++)for(const seed of [17,29,43,71,97])for(const policy of ['auto','first','middle','last'])runs.push(run('CH-0'+n,seed,policy));
const summary={runs:runs.length,won:runs.filter(r=>r.state==='won').length,lost:runs.filter(r=>r.state==='lost').length,unfinished:runs.filter(r=>!['won','lost'].includes(r.state)).length,byPolicy:Object.fromEntries(['auto','first','middle','last'].map(p=>[p,{won:runs.filter(r=>r.policy===p&&r.state==='won').length,lost:runs.filter(r=>r.policy===p&&r.state==='lost').length,unfinished:runs.filter(r=>r.policy===p&&!['won','lost'].includes(r.state)).length}]))};
fs.writeFileSync(process.argv[2]||'gameplay-simulation.json',JSON.stringify({method:'100 runs: 5 stages × 5 seeds × automatic/first/middle/last draft choice. Up to 360 seconds at 120Hz, ordinary movement, assist, fire, source and boost commands. Manual choices use actual draft candidates. No forced clear, life refill or artificial stats. Not human enjoyment or purchase evidence.',summary,runs},null,2));console.log(JSON.stringify(summary));

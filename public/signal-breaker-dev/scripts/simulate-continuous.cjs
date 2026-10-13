/* One-hour ordinary input endurance. No fixture completion or life refill. */
const fs=require('node:fs'),{Game,DT}=require('../src/engine.js'),Flow=require('../src/session-flow.js');
function run(seed,seconds=3600){let g=new Game('CH-01',seed,{extended:true,premiumRun:true,burst:true,continuous:true,causal:true}),assist=null,nextAssist=0,pauses=0,peaks={cores:0,shots:0},chapters=[];g.start();for(let tick=0;tick<seconds/DT;tick++){
 if(g.state==='intermission')pauses++;
 if(g.state==='lost')return {seed,seconds:+(tick*DT).toFixed(2),state:'lost',pauses,peaks,chapters};
 if(g.state==='won'){chapters.push({stage:g.config.id,cycle:g.storyCycle,seed:g.seed,seconds:+g.time.toFixed(2),life:g.player.life,waves:g.waveHistory.length,rank:g.burstRank()});g=Flow.next(g);g.start();assist=null;nextAssist=0;}
 if(g.source&&g.time>=2&&!g.source.observed)g.observeSource();if(g.source&&g.time>=3&&!g.source.requested)g.controlSource('isolate');
 const danger=g.cores.filter(c=>c.y>430&&Math.abs(c.x-g.player.x)<130).sort((a,b)=>Math.abs(a.x-g.player.x)-Math.abs(b.x-g.player.x))[0];const direction=danger?(danger.x>=g.player.x?-1:1):(Math.sin(g.time*.35)>=0?1:-1);g.move(g.player.x<90?1:g.player.x>1010?-1:direction,DT,false,true);g.update(DT);
 if(g.runPoints>=40&&g.cores.length>=2)g.activateBoost();if(g.time>=nextAssist){assist=g.assistAim(true);nextAssist=g.time+.12;}if(assist?.aligned)g.fire();g.drainEvents();peaks.cores=Math.max(peaks.cores,g.cores.length);peaks.shots=Math.max(peaks.shots,g.shots.length);
 }return {seed,seconds,state:g.state,pauses,peaks,chapters,current:{stage:g.config.id,wave:g.wave,cycle:g.storyCycle}};}
if(require.main===module){const result={method:'3 seeds × 3600 simulated seconds; 120 Hz fixed rules, ordinary movement/assist/shots/source/boost commands, automatic wave tuning and chapter succession. No forced completion or refill; built-in one-life chapter recovery is part of succession. Not a human engagement study or physical-device FPS.',runs:[1,3,8].map(s=>run(s))};fs.writeFileSync(process.argv[2]||'continuous-simulation.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result.runs.map(({chapters,...r})=>({...r,completedChapters:chapters.length})),null,2));}
module.exports={run};

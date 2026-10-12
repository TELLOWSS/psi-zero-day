/* Ordinary movement following the visible assistance direction; no forced outcomes. */
const fs=require('node:fs'),{simulate}=require('./simulate-flow.cjs');
const runs=[];
for(let chapter=1;chapter<=5;chapter++)for(let seed=1;seed<=8;seed++)runs.push(simulate('CH-0'+chapter,seed,'guided'));
const summary=[];
for(let chapter=1;chapter<=5;chapter++){const rows=runs.filter(r=>r.chapter==='CH-0'+chapter);summary.push({chapter:'CH-0'+chapter,runs:rows.length,won:rows.filter(r=>r.state==='won').length,lost:rows.filter(r=>r.state==='lost').length,timeout:rows.filter(r=>r.state==='timeout').length,maxIdle:Math.max(...rows.map(r=>r.maxIdle))});}
const report={method:'5 chapters × 8 seeds, 180 seconds, 120 Hz ordinary input. Remain still unless blocked/reposition assistance is visible, then use the indicated movement direction; ordinary assisted firing, first tuning and source requests. No target clearing, life refill or forced boss resolution. Not a human completion rate.',summary,runs};
fs.writeFileSync(process.argv[2]||'assist-guidance-simulation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(summary));

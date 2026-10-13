/* Ordinary movement/assist/fire inputs with earned-growth fixtures, no forced combat outcomes. */
const fs=require('node:fs'),path=require('node:path'),{TalentTechManager,TALENT_TREES,SOCKET_GEMS}=require('../src/talent-tech-tree.js');
const operations=require('./simulate-operations.cjs'),veteran=require('./simulate-veteran.cjs');
function build(order){const manager=new TalentTechManager();manager.addPoints(100);for(let n=0;n<4;n++)for(let id=1;id<=5;id++)manager.grantBossReward('CH-0'+id,`fixture:${id}:${n}`);
 for(const key of Object.keys(manager.weaponLevels))for(let tier=2;tier<=4;tier++)manager.upgradeWeapon(key);
 for(const tree of order)for(const talent of TALENT_TREES[tree].tiers)for(let n=0;n<talent.maxRank;n++)manager.investTalent(talent.id);
 manager.socketGem('pulse',0,'gem_kinetic');manager.socketGem('pulse',1,'gem_pulse');manager.socketGem('net',0,'gem_thermal');manager.socketGem('magnet',0,'gem_damper');manager.socketGem('mist',0,'gem_mist');manager.socketGem('anchor',0,'gem_tension');manager.socketGem('scan',0,'gem_insulation');
 if(manager.spentPoints>31)throw Error('fixture exceeds investment cap');return manager.getStats();}
const builds={defense:build(['defense','kinetic','engineering']),kinetic:build(['kinetic','engineering','defense']),engineering:build(['engineering','defense','kinetic'])},runs=[];
for(const [profile,stats] of Object.entries(builds))for(let stage=1;stage<=5;stage++)for(let seed=1;seed<=8;seed++){
 const id='CH-0'+stage;for(const episode of [1,2]){const run=episode===1?operations.run(id,seed,['rapid','spread','precision'][(seed-1)%3],stats):veteran.run(id,seed,'evolved','focus',stats);runs.push({profile,episode,...run});}
}
const summary=[];for(const profile of Object.keys(builds))for(const episode of [1,2]){const rows=runs.filter(r=>r.profile===profile&&r.episode===episode);summary.push({profile,episode,runs:rows.length,won:rows.filter(r=>r.state==='won').length,lost:rows.filter(r=>r.state==='lost').length,unfinished:rows.filter(r=>!['won','lost'].includes(r.state)).length,meanSeconds:rows.reduce((sum,r)=>sum+r.time,0)/rows.length});}
const result={method:'3 legal 31P builds × 5 stages × 8 seeds × 2 episodes = 240 runs. Advanced gear/owned gem fixtures are prepared through manager commands; combat uses ordinary input routines at 120 Hz without forced boss resolution, core removal or life refill. Not human balance or mobile FPS.',summary,runs};
const output=path.resolve(process.argv[2]||'../../artifacts/growth-20261013/simulation.json');fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(result,null,2));console.log(JSON.stringify(summary));

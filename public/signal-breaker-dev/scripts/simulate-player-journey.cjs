/* Fresh accounts: only command-earned rewards, no maxed build or forced win fixture. */
const fs=require('node:fs'),{Game,DT}=require('../src/engine.js'),{TalentTechManager}=require('../src/talent-tech-tree.js'),Journey=require('../src/player-journey.js');
function attempt(id,seed,veteran,mgr,profile){
 const g=new Game(id,seed,{operation:true,extended:true,premiumRun:true,burst:true,continuous:!veteran,veteran,causal:id==='CH-01'});
 const preferred=id==='CH-03'?'arc':'laser';if(veteran)g.selectFrame(preferred);g.applyTalentStats(mgr.getStats());g.start();let waves=0,bossReward=null;
 for(let i=0;i<360/DT&&['playing','intermission'].includes(g.state);i++){
  if(g.state==='intermission'){if(veteran&&g.pickupCount>=5&&!g.evolution.recipe)g.evolve(preferred==='arc'?'storm':'prism');g.chooseTuning(g.draft[0]);}
  if(g.source&&g.time>2&&!g.source.observed)g.observeSource();if(g.source&&g.time>3&&!g.source.requested)g.controlSource('isolate');
  if(veteran){if(g.boss?.identity==='conveyor'&&g.conveyorDirection!==0)g.cycleConveyor();const warning=g.boss?.warningUntil>g.time,support=warning&&g.boss.identity==='grid'?'scan':warning&&g.boss.identity==='tension'?'anchor':g.evolution.recipe?require('../src/evolution-rules.js').RECIPES[g.evolution.recipe].support:null;if(support)for(let k=0;k<8&&g.loadout[1]!==support;k++)g.cycleSupport();g.selectWeapon(warning&&support?support:'pulse');}
  let target=g.pickups?.[0]?.x??(560+Math.sin(g.time*.35)*300);if(g.boss?.warningUntil>g.time){const b=g.boss;if(b.identity==='delivery')target=b.dischargeX>560?250:870;if(b.identity==='grid')target=b.band===0?850:250;if(b.identity==='tension')target=g.player.x<650?b.snapLeft-80:b.snapRight+80;}
  const danger=g.cores.find(c=>Math.hypot(c.x-g.player.x,c.y-g.player.y)<110);const direction=profile==='stationary'?0:danger?(danger.x>=g.player.x?-1:1):Math.abs(target-g.player.x)>15?Math.sign(target-g.player.x):0;
  g.move(g.player.x<80?1:g.player.x>1040?-1:direction,DT,false,true);if(i%14===0)g.assistAim(!veteran);g.fire();if(!veteran&&g.runPoints>=40)g.activateBoost();g.update(DT);
  for(const e of g.drainEvents()){if(e.kind==='waveclear'){mgr.addPoints(1);waves++;}}
 }
 if(g.state==='won'&&g.boss?.phase==='resolved')bossReward=mgr.grantBossReward(id,(veteran?'EP02:':'EP01:')+id+':'+seed);
 return {g,row:{id,veteran,seed,profile,state:g.state,time:+g.time.toFixed(2),life:g.player.life,waves,bossReward:!!bossReward,recipe:g.evolution.recipe,chain:g.bestChain,reflectedHits:g.reflectedHits,reason:g.state==='lost'?Journey.recovery(g):null}};
}
function campaign(seed,profile){const mgr=new TalentTechManager(),records={},runs=[];mgr.claimGuideReward();for(let i=0;i<5;i++)mgr.investTalent('def_t1');for(let i=0;i<3;i++)mgr.investTalent('kin_t1');
 for(const veteran of [false,true])for(let c=1;c<=5;c++){
  const id='CH-0'+c;let won=false;
  for(let retry=0;retry<3&&!won;retry++){const {g,row}=attempt(id,seed+c*7919+(veteran?500:0),veteran,mgr,retry?'guided':profile);runs.push(row);won=g.state==='won';if(won)records[(veteran?'V-':'')+id]={won:true,mastery:Journey.mastery(g)};}
  if(!won)return {seed,profile,progress:Journey.progress(records),runs,points:mgr.points,parts:mgr.parts};
  if(mgr.weaponLevels.pulse<4)mgr.upgradeWeapon('pulse');else if(mgr.weaponLevels.net<4)mgr.upgradeWeapon('net');else mgr.upgradeWeapon('mist');
  if(mgr.availableGems('gem_kinetic')>0)mgr.socketGem('pulse',0,'gem_kinetic');
  for(const key of ['kin_t1','def_t2','eng_t1','kin_t2','def_t3','eng_t2','kin_t3'])while(mgr.canInvest(key))mgr.investTalent(key);
 }
 return {seed,profile,progress:Journey.progress(records),runs,points:mgr.points,parts:mgr.parts,tiers:mgr.weaponLevels};
}
if(require.main===module){const campaigns=[];for(const profile of ['stationary','guided'])for(const seed of [17,29,43,71,97,123])campaigns.push(campaign(seed,profile));const rows=campaigns.flatMap(c=>c.runs);const report={method:'12 fresh-account campaigns, guide +3P and initial 5P only; waves/bosses earn progression, upgrades consume earned parts, earned gems only. 120Hz ordinary command simulation, three same-seed attempts maximum with guided recovery. No state-forced wins, life refill or unlocked stage skip. Not human engagement/purchase evidence.',campaigns,summary:{campaigns:campaigns.length,complete:campaigns.filter(c=>c.progress.completed===10).length,attempts:rows.length,won:rows.filter(r=>r.state==='won').length,lost:rows.filter(r=>r.state==='lost').length,unfinished:rows.filter(r=>!['won','lost'].includes(r.state)).length}};fs.writeFileSync(process.argv[2]||'player-journey-simulation.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report.summary));}
module.exports={campaign,attempt};

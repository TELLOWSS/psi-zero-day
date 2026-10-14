const test=require('node:test'),a=require('node:assert/strict');
const {TalentTechManager,CAREERS,TALENT_TREES}=require('../src/talent-tech-tree.js');
const {Game}=require('../src/engine.js');
const evolution=require('../src/evolution-rules.js');
const storage=()=>{const map=new Map();return {getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v),map};};
test('legacy investment remains on player; six independent profiles share earned entitlement without farming',()=>{
 const s=storage();s.setItem('psi.signal-breaker.talent-tech.v1',JSON.stringify({schemaVersion:2,points:8,talents:{def_t1:5,def_t2:3},inventory:{gem_kinetic:1},weaponSockets:{pulse:['gem_kinetic',null,null]}}));
 const m=new TalentTechManager({storage:s});a.equal(m.spentPoints,8);a.equal(m.getAvailablePoints(),0);
 for(const id of Object.keys(CAREERS).slice(1)){a.ok(m.setCharacter(id));a.equal(m.points,8);a.equal(m.spentPoints,0);a.equal(m.getAvailablePoints(),8);a.ok(m.investTalent('def_t1'));}
 a.ok(m.setCharacter('player'));a.equal(m.spentPoints,8);const reloaded=new TalentTechManager({storage:s});a.equal(reloaded.spentPoints,8);reloaded.setCharacter('kang_taesik');a.equal(reloaded.spentPoints,1);a.equal(reloaded.availableGems('gem_kinetic'),0);
});
test('recommendations are legal, deterministic, capped, and lead to each unique career ultimate',()=>{
 for(const id of Object.keys(CAREERS)){const m=new TalentTechManager();m.points=50;m.setCharacter(id);let count=0;while(m.recommendation()){const next=m.recommendation();a.ok(m.canInvest(next.id));a.ok(m.investTalent(next.id));a.ok(++count<=31);}a.equal(count,31);a.equal(m.getAvailablePoints(),0);a.equal(m.careerProgress().filter(n=>n.active).length,3);a.equal(m.investTalent('def_t1'),false);}
});
test('career effects alter real combat and never apply before their path threshold',()=>{
 const m=new TalentTechManager();m.points=31;m.setCharacter('lee_jaehoon');const g=new Game('CH-01');g.applyTalentStats(m.getStats());const base=g.captureRadius();a.equal(m.getStats().netRadius,0);
 for(const node of TALENT_TREES.engineering.tiers)for(let i=0;i<node.maxRank;i++)a.ok(m.investTalent(node.id));g.applyTalentStats(m.getStats());a.equal(m.getStats().netRadius,.25);a.ok(g.captureRadius()>base);a.equal(m.getStats().cooldownReduction,.19);
 m.setCharacter('kang_taesik');a.equal(m.getStats().netRadius,0);a.equal(m.careerProgress()[0].active,false);
});
test('failed storage rolls back investment, reset and character switches without losing progress',()=>{
 const s=storage(),m=new TalentTechManager({storage:s});m.investTalent('def_t1');s.setItem=()=>{throw Error('quota');};a.equal(m.investTalent('def_t1'),false);a.equal(m.spentPoints,1);a.equal(m.resetTalents(),false);a.equal(m.spentPoints,1);a.equal(m.setCharacter('lim_junho'),false);a.equal(m.characterId,'player');a.equal(m.lastSaveSucceeded,false);
});
test('corrupt per-character ranks, unsupported characters and excess cap are sanitized',()=>{
 const s=storage();s.setItem('psi.signal-breaker.talent-tech.v1',JSON.stringify({schemaVersion:3,points:99,characterId:'not-valid',characterTalents:{player:{def_t1:999,def_t2:3,kin_t5:1,eng_t1:-1},kang_taesik:{def_t2:3}}}));const m=new TalentTechManager({storage:s});a.equal(m.characterId,'player');a.equal(m.talents.def_t1,5);a.equal(m.talents.kin_t5,0);a.equal(m.talents.eng_t1,0);a.equal(m.setCharacter('__proto__'),false);m.setCharacter('kang_taesik');a.equal(m.spentPoints,0);
});
test('equipment recommendation spends only owned stock and rolls back a failed write',()=>{
 const s=storage(),m=new TalentTechManager({storage:s});a.equal(m.equipmentRecommendation(['pulse','net']),null);m.parts=1;const next=m.equipmentRecommendation(['pulse','net']);a.deepEqual(next,{type:'upgrade',weapon:'pulse',cost:1});a.ok(m.upgradeWeapon(next.weapon));a.equal(m.parts,0);a.equal(m.weaponLevels.pulse,2);m.inventory.gem_kinetic=1;a.deepEqual(m.equipmentRecommendation(['pulse']),{type:'socket',weapon:'pulse',slot:0,gemId:'gem_kinetic',cost:0});s.setItem=()=>{throw Error('quota');};a.equal(m.socketGem('pulse',0,'gem_kinetic'),false);a.equal(m.weaponSockets.pulse[0],null);m.parts=1;a.equal(m.upgradeWeapon('pulse'),false);a.equal(m.weaponLevels.pulse,2);a.equal(m.parts,1);
});
test('evolution recommendations obey frame, field safety and progression costs',()=>{
 const g=new Game('CH-03',123,{veteran:true,operation:true,premiumRun:true,burst:true,extended:true});a.equal(evolution.recommendation(g),null);g.state='intermission';g.pickupCount=99;g.evolution.frame='laser';const id=evolution.recommendation(g);a.equal(id,'plasma');a.ok(g.evolve(id));a.equal(evolution.recommendation(g),null);g.wave=2;a.equal(evolution.recommendation(g),'spread');a.ok(g.advanceEvolution('spread'));g.wave=3;a.equal(evolution.recommendation(g),'capstone');g.pickupCount=0;a.equal(evolution.recommendation(g),null);
});

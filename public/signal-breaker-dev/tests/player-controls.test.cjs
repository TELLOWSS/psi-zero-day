const {test}=require('node:test'),a=require('node:assert/strict'),{Game}=require('../src/engine.js'),S=require('../src/session-flow.js');
const options={extended:true,premiumRun:true,operation:true,burst:true,continuous:true,autoTuning:false};
test('retry plan restores gear, active support, frame and tuning preference through validated engine commands',()=>{
 for(const veteran of [false,true]){const old=new Game('CH-03',17,{...options,veteran});old.setLoadout(['pulse','mist'],2,'duration');old.selectWeapon('mist');if(veteran)old.selectFrame('laser');old.setAutoTuning(true);const plan=S.retryPlan(old);old.start();const fresh=new Game('CH-03',17,{...options,veteran});a.equal(S.applyRetry(fresh,plan),true);a.deepEqual(fresh.loadout,['pulse','mist']);a.equal(fresh.weapon,'mist');a.equal(fresh.weaponLevel,2);a.equal(fresh.weaponUpgrade,'duration');a.equal(fresh.evolution.frame,plan.frame);a.equal(fresh.autoTuning,true);a.equal(fresh.time,0);a.equal(fresh.wave,1);a.deepEqual(fresh.tunings,[]);a.equal(fresh.runPoints,0);}
});
test('retry plans are detached and cannot apply to a different stage, seed, episode or active run',()=>{
 const old=new Game('CH-01',17,options),plan=S.retryPlan(old);plan.loadout[0]='net';a.equal(old.loadout[0],'pulse');const good=S.retryPlan(old);
 for(const fresh of [new Game('CH-02',17,options),new Game('CH-01',29,options),new Game('CH-01',17,{...options,veteran:true})]){const before=JSON.stringify(fresh);a.equal(S.applyRetry(fresh,good),false);a.equal(JSON.stringify(fresh),before);}old.start();a.equal(S.applyRetry(old,good),false);
});
test('malformed frame, tuning flag or active weapon cannot mutate retry preparation',()=>{
 const g=new Game('CH-01',17,options),plan=S.retryPlan(g);for(const bad of [{...plan,frame:'unknown'},{...plan,autoTuning:'false'},{...plan,weapon:'scan'}]){const before=JSON.stringify(g);a.equal(S.applyRetry(g,bad),false);a.equal(JSON.stringify(g),before);}
});

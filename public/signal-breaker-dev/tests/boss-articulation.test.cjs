const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function fixture(){
 const root={PSIPresentationAssets:{image:()=>({complete:true,naturalWidth:1024,naturalHeight:683})}};
 const context={window:root,Image:function(){},Math};vm.createContext(context);
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/premium-art.js'),'utf8'),context);
 return new root.SignalBreakerPremiumArt.PremiumArt();
}
const boss=()=>({identity:'conveyor',phase:'sealed',x:650,y:205,hp:3,maxHp:3,warningUntil:0,segment:1,maxSegments:5,nodes:[{x:550,y:170,hit:false}]});
test('joint clocks freeze at identical simulation time and reduced motion disables mechanical travel',()=>{
 const art=fixture(),b=boss();
 assert.deepEqual(art.bossMotion(b,2),art.bossMotion(b,2));
 assert.notEqual(art.bossMotion(b,2).phase,art.bossMotion(b,3).phase);
 const angle=art.bossMotion(b,3).phase;art.setReducedMotion(true);assert.equal(art.bossMotion(b,3).phase,angle);assert.equal(art.bossMotion(b,30).phase,angle);
 assert.equal(art.bossMotion(b,2).stopped,true);
});
test('reversing conveyor or suppressing extraction never jumps the raster joint angle',()=>{
 const art=fixture(),b=boss();art.bossMotion(b,0,{direction:1});const at=art.bossMotion(b,1,{direction:1}).phase;
 assert.equal(art.bossMotion(b,1,{direction:-1}).phase,at);
 assert.ok(art.bossMotion(b,1.1,{direction:-1}).phase<at);
 b.identity='extraction';b.mistUntil=5;const slow=art.bossMotion(b,1.1).phase;
 assert.equal(slow,art.bossMotion(b,1.1).phase);
});
test('actual conveyor direction, tension secure and mist control drive the presentation',()=>{
 const art=fixture(),b=boss(),before=JSON.stringify(b);
 assert.equal(art.bossMotion(b,2,{direction:-1}).direction,-1);
 assert.equal(art.bossMotion(b,2,{direction:1}).direction,1);
 assert.equal(art.bossMotion(b,2,{secured:true}).stopped,true);
 b.mistUntil=5;assert.equal(art.bossMotion(b,2).controlled,true);assert.equal(art.bossMotion(b,6).controlled,false);
 delete b.mistUntil;assert.equal(JSON.stringify(b),before);
});
test('damage persists across engine armor stages but decreases only on a fresh encounter',()=>{
 const art=fixture(),b=boss();assert.equal(art.bossMotion(b,0).wear,0);
 b.hp=1;const damaged=art.bossMotion(b,0).wear;assert.ok(damaged>0);
 b.segment=2;b.hp=3;assert.ok(art.bossMotion(b,0).wear>damaged);
 b.segment=5;b.hp=0;assert.equal(art.bossMotion(b,0).wear,1);
 assert.equal(art.bossMotion(boss(),0).wear,0);
});
test('boss hit response is local, bounded, freezes with zero dt and resets with the encounter',()=>{
 const art=fixture(),b=boss();art.event({kind:'bosshit',x:b.x,y:b.y},{boss:b});
 assert.equal(art.bossMotion(b,0).impact,1);art.update(0);assert.equal(art.bossMotion(b,0).impact,1);
 for(let i=0;i<6;i++)art.update(.05);assert.equal(art.bossMotion(b,0).impact,0);
 art.event({kind:'bosshit',x:b.x,y:b.y},{boss:b});art.setReducedMotion(true);assert.equal(art.bossMotion(b,0).impact,0);
 art.reset();art.setReducedMotion(false);assert.equal(art.bossMotion(b,0).impact,0);
});

test('CH04 authored housing wear persists across all four restored load tests',()=>{
 const art=fixture(),b={...boss(),identity:'tension',segment:undefined,maxSegments:undefined,loadStage:1,maxLoadStages:4,hp:6,maxHp:6};
 assert.equal(art.bossMotion(b,0).wear,0);b.loadStage=2;b.phase='rebalancing';assert.equal(art.bossMotion(b,1).wear,.25);
 b.loadStage=4;b.phase='sealed';assert.equal(art.bossMotion(b,2).wear,.75);b.hp=0;b.phase='resolved';assert.equal(art.bossMotion(b,3).wear,1);
});
test('stopped conveyor holds its joint angle and resumes without a jump',()=>{const art=fixture(),b=boss();art.bossMotion(b,0,{direction:1});const at=art.bossMotion(b,1,{direction:1}).phase;assert.equal(art.bossMotion(b,1,{direction:0}).phase,at);assert.equal(art.bossMotion(b,8,{direction:0}).phase,at);assert.equal(art.bossMotion(b,8,{direction:-1}).phase,at);assert.ok(art.bossMotion(b,8.1,{direction:-1}).phase<at);});

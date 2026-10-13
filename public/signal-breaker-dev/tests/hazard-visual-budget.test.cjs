const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../src/premium-art.js'),'utf8');
const context={window:{},Math};
vm.runInNewContext(source,context);
const {PremiumArt}=context.window.SignalBreakerPremiumArt;
test('released hazard artwork cannot overflow far outside its physical footprint on mobile',()=>{
 const art=new PremiumArt();
 for(const radius of [14,23,31])for(const scale of [.7,1,1.25,1.7,2.1,3]){
  const world=art.hazardVisualSize({r:radius},scale),pixels=world*scale,minimum=2*radius*scale;
  assert.ok(world>=2*radius,'do not draw smaller than physical collision');
  assert.ok(pixels<=Math.max(110,minimum)+1e-8,'released hazard is bounded by visible pixels unless hitbox itself is larger');
  assert.ok(world<=2.35*radius+1e-8,'no oversized released atlas artwork');
 }
});
test('each hazard kind and motion setting draws one isolated bounded atlas cell without touching gameplay state',()=>{
 const art=new PremiumArt();art.hazardAtlas={complete:true,naturalWidth:1200,naturalHeight:1200};
 for(const quality of ['high','balanced','low'])for(const motion of [true,false])for(const kind of ['metal','dust','power','load']){
  art.setQuality(quality);art.setReducedMotion(motion);const sizes=[],calls=[];
  const c=new Proxy({drawImage:(...args)=>calls.push(args),arc:(...args)=>sizes.push(args)},{get:(obj,k)=>k in obj?obj[k]:()=>{}});
  const core={id:5,x:690,y:325,r:31,age:1.4,kind,released:true,releaseAt:4.1,stable:false},before=JSON.stringify(core);
  assert.equal(art.hazard(c,core,5,1.65),true);
  assert.equal(JSON.stringify(core),before,'no physics mutation');
  assert.equal(calls.length,1,'one sprite draw');
  assert.equal(calls[0].length,9);
  const span=art.hazardVisualSize(core,1.65);assert.ok(Math.abs(calls[0][7]-span)<1e-8);
  assert.ok(Math.abs(calls[0][8]-span)<1e-8);
  assert.ok(sizes.some(args=>Math.abs(args[2]-(core.r+3))<1e-8),'collision boundary stays visible');
 }
});
test('unloaded optional images preserve existing fallback art route',()=>{
 const art=new PremiumArt();
 assert.equal(art.hazard({}, {r:14,kind:'metal'},0,1),false);
});

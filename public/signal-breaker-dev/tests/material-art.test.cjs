const {test}=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const code=fs.readFileSync(path.join(__dirname,'../src/premium-art.js'),'utf8');
test('four material sprites use isolated atlas cells and preserve gameplay state across quality profiles',()=>{
 const window={};vm.runInNewContext(code,{window,Math});const art=new window.SignalBreakerPremiumArt.PremiumArt();
 art.coreAtlas={complete:true,naturalWidth:1254,naturalHeight:1254};
 for(const quality of ['high','balanced','low'])for(const [cell,kind] of ['metal','dust','power','load'].entries()){
  art.setQuality(quality);art.setReducedMotion(true);const calls=[],arcs=[];
  const context=new Proxy({drawImage:(...v)=>calls.push(v),arc:(...v)=>arcs.push(v)},{get:(o,k)=>k in o?o[k]:()=>{}});
  for(const stable of [false,true]){
   const q={kind,x:500,y:240,r:30,stable,mistExposure:.375,glow:0},before=JSON.stringify(q);
   a.equal(art.core(context,q,5),true);a.equal(JSON.stringify(q),before);
   const v=calls.at(-1);a.deepEqual(v.slice(1,5),[[145,129,407,441],[718,135,416,423],[113,729,467,413],[795,717,297,443]][cell]);
   const [x,y,width,height]=v.slice(5);a.ok(Math.abs(Math.max(width,height)-60)<1e-8);a.equal(x,-width/2);a.equal(y,-height/2);a.ok(width<=60+1e-8&&height<=60+1e-8,'art inside unchanged physical diameter');
  }
  if(['dust','power'].includes(kind))a.ok(arcs.some(v=>Math.abs(v[4]-v[3]-Math.PI)<1e-6),'half-exposure progress');
 }
 a.equal(art.core({}, {kind:'unknown'},0),false);
});

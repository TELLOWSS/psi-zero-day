const {test}=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
test('equipment states use authored isolated regions without changing engine data',()=>{
 const window={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/premium-art.js'),'utf8'),{window,Math});
 const art=new window.SignalBreakerPremiumArt.PremiumArt();art.equipmentAtlas={complete:true,naturalWidth:1254,naturalHeight:1254};
 const boss={phase:'sealed',x:785,y:199,nodes:[{x:882,y:162,hit:false}]};
 for(const quality of ['high','balanced','low'])for(const motion of [false,true]){
  art.setQuality(quality);art.setReducedMotion(motion);
  for(let cell=0;cell<4;cell++){
   const calls=[],context=new Proxy({drawImage:(...v)=>calls.push(v)},{get:(o,k)=>k in o?o[k]:()=>{}}),before=JSON.stringify(boss),size=cell<2?104:48;
   a.equal(art.equipment(context,cell,boss.x,boss.y,size),true);a.equal(JSON.stringify(boss),before);
   a.deepEqual(calls[0].slice(1,5),[(cell%2)*627,cell<2?0:600,627,cell<2?600:654]);
   a.deepEqual(calls[0].slice(5),[-size/2,-size/2,size,size]);
  }
 }
 a.equal(art.equipment({},4,0,0,104),false);art.equipmentAtlas.complete=false;a.equal(art.equipment({},0,0,0,104),false);
});

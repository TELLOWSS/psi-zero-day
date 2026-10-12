const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const dir=path.resolve(__dirname,'..'),keys=['delivery','conveyor','extraction','tension','grid'];
test('all five production boss bodies are detailed WebP sprites with transparent corners',async()=>{
 const sharp=require('../../../node_modules/sharp');
 for(const key of keys){const file=path.join(dir,'art',`boss-${key}-final-v2.webp`),image=sharp(file),meta=await image.metadata();
  assert.equal(meta.format,'webp');assert.equal(meta.width,1024);assert.equal(meta.hasAlpha,true);
  const {data,info}=await image.raw().toBuffer({resolveWithObject:true});
  assert.ok(data[3]<=2&&data[(info.width-1)*4+3]<=2,'top corners must not be an opaque poster');
  let clear=0,solid=0;for(let i=3;i<data.length;i+=4){if(data[i]<8)clear++;if(data[i]>245)solid++;}
  assert.ok(clear/(info.width*info.height)>.15,'silhouette has transparent space');assert.ok(solid/(info.width*info.height)>.35,'body retains substantial rendered material');
 }
});
test('raster body replaces each procedural body without moving engine state or weak points',()=>{
 const images=[],draws=[],root={PSIPresentationAssets:{image:source=>{images.push(source);return {complete:true,naturalWidth:1024,naturalHeight:683};}}};
 const context={window:root,Image:function(){},Math};vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(dir,'src/premium-art.js'),'utf8'),context);
 const art=new root.SignalBreakerPremiumArt.PremiumArt(),ctx=new Proxy({drawImage:(...args)=>draws.push(args),createRadialGradient:()=>({addColorStop(){}})}, {get:(target,key)=>key in target?target[key]:()=>{},set:(target,key,value)=>(target[key]=value,true)});
 const methods=['deliveryBoss','conveyorBoss','extractionBoss','tensionBoss','gridBoss'];
 keys.forEach((identity,i)=>{for(const phase of ['sealed','exposed','rearming']){const boss={identity,phase,x:650,y:205,hp:2,maxHp:3,warningUntil:2,nodes:[{x:550,y:170,hit:false}],gatePhase:2,maxGatePhases:5},before=JSON.stringify(boss),n=draws.length;
  assert.equal(art[methods[i]](ctx,boss,1,1),true);assert.equal(draws.length,n+1,'one authored body per frame');assert.equal(JSON.stringify(boss),before,'presentation cannot mutate collision or phases');assert.equal(art.lastBossArt.identity,identity);
 }});
 assert.equal(new Set(images.filter(x=>x.includes('final-v2'))).size,5,'five independently cached authored bodies');
});

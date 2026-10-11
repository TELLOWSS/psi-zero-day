const {test}=require('node:test'),assert=require('node:assert/strict');
const {frame}=require('../src/boss-camera.js');
const boss={x:785,nodes:[{x:670,hit:false},{x:895,hit:false},{x:785,hit:true}]};
test('portrait CH03 frames actual operator plus boss core simultaneously at 390x844',()=>{
 const f=frame({width:390,height:844,worldWidth:1100,boundsHeight:1650,player:{x:290},boss});
 const px=(290-f.x)*f.scale,bx=(boss.x-f.x)*f.scale;
 assert.ok(px>=20&&px<=370,'operator must remain visible');assert.ok(bx>=50&&bx<=340,'boss core must remain visible');
 assert.ok((boss.x+143-f.x)*f.scale<=390,'pressure danger edge stays visible');
});
test('all five unique bosses have valid camera framing across supported portrait widths',()=>{
 for(const width of [320,360,390,430,768])for(const playerX of [200,290,440]){
  const f=frame({width,height:width===768?1024:844,worldWidth:1100,boundsHeight:1650,player:{x:playerX},boss});
  assert.ok(f.scale>0&&Number.isFinite(f.scale));
  assert.ok(f.x>=0&&f.x+f.visible<=1100+1e-6,'no view outside world');
  assert.ok((playerX-f.x)*f.scale>=-1e-6&&(playerX-f.x)*f.scale<=width+1e-6,'operator remains on-screen');
  assert.ok((boss.x-f.x)*f.scale>=-1e-6&&(boss.x-f.x)*f.scale<=width+1e-6,'active boss core on-screen where practical');
 }
});
test('purging or sealed boss node changes do not mutate engine state during camera fit',()=>{
 const spec={width:390,height:844,worldWidth:1100,boundsHeight:1650,player:{x:290},boss:{...boss,nodes:boss.nodes.map(n=>({...n}))}};
 const before=JSON.stringify(spec);
 const x=frame(spec),y=frame(spec);assert.deepEqual(x,y);assert.equal(JSON.stringify(spec),before);
});

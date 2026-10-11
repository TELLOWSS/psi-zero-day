const {test}=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
test('short landscape equipment label avoids the actual guide band and stays inside the viewport',()=>{
 const window={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/premium-art.js'),'utf8'),{window,Math});
 const art=new window.SignalBreakerPremiumArt.PremiumArt(),camera={width:844,height:390,scale:844/1100,x:0,y:134},guide={left:235,right:608,top:112,bottom:141},b={x:785,y:220};
 const toast={left:349,right:608,top:62,bottom:91},p=art.equipmentLabel(b,camera,[guide,toast]),x=(p.x-camera.x)*camera.scale,y=(p.y-camera.y)*camera.scale;
 a.ok(x-50*camera.scale>=8&&x+50*camera.scale<=836);
 a.ok(x+50*camera.scale<=guide.left||x-50*camera.scale>=guide.right||y+4*camera.scale<=guide.top||y-16*camera.scale>=guide.bottom);
 a.ok(x+50*camera.scale<=toast.left||x-50*camera.scale>=toast.right||y+4*camera.scale<=toast.top||y-16*camera.scale>=toast.bottom);
 a.equal(art.equipmentLabel(b,camera,null).x,b.x+112,'short landscape keeps status beside equipment even between messages');
 a.equal(art.equipmentLabel(b,{width:1100,height:620,scale:1,x:0,y:0},null).y,b.y+66,'ordinary label stays below equipment');
});
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

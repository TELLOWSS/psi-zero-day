const {test}=require('node:test'),a=require('node:assert/strict');
const {frame}=require('../src/boss-camera.js');
const W=1100,ground=594;
const make=(stage,playerX=165,width=390,height=844)=>({
 width,height,worldWidth:W,boundsTop:-606,boundsHeight:1730,ground,
 player:{x:playerX},boss:{x:650+(stage-1)*25,phase:'sealed',
 nodes:[{x:550+(stage-1)*25,hit:false},{x:750+(stage-1)*25,hit:false},{x:650+(stage-1)*25,hit:false}]}
});
const assertVisible=(v,c)=>{
 const px=x=>(x-v.x)*v.scale;
 a.ok(v.scale>0,'positive scale');
 for(const {x,r} of [{x:c.player.x,r:39},{x:c.boss.x,r:149},...c.boss.nodes.map(n=>({x:n.x,r:30}))]){
  if(x-r>=0)a.ok(px(x-r)>=15.9, 'left geometry in viewport: '+JSON.stringify({x,r,v,c}));
  if(x+r<=W)a.ok(px(x+r)<=c.width-15.9,'right geometry in viewport');
 }
 a.ok((ground-v.y)*v.scale>c.height*.38 && (ground-v.y)*v.scale<c.height*.82,'ground and operator stay above mobile controls');
};
test('portrait framing contains operator, 5 distinct bosses and all relays at 390px',()=>{
 for(let stage=1;stage<=5;stage++)for(let playerX of [90,165,380,760,1060]){
  const c=make(stage,playerX),v=frame(c);assertVisible(v,c);
 }
});
test('portrait framing remains complete on narrow phones, tablets and short portrait windows',()=>{
 for(const [width,height] of [[320,690],[360,740],[390,844],[412,915],[600,960],[768,1024]])
 for(const stage of [1,3,5]){
  const c=make(stage,150,width,height),v=frame(c);assertVisible(v,c);
 }
});
test('camera framing is stable when relay nodes are cleared or reopening',()=>{
 const c=make(3);const sealed=frame(c);
 c.boss.nodes[0].hit=true;c.boss.nodes[1].hit=true;c.boss.phase='exposed';
 const open=frame(c);
 a.equal(open.x,sealed.x);a.equal(open.scale,sealed.scale);a.equal(open.y,sealed.y);
 c.boss.phase='purging';a.equal(frame(c).scale,sealed.scale);
});
test('camera respects rendered portrait background height when it fits, permits cropping-free letterbox when not',()=>{
 const c=make(3);
 const normal=frame(c);a.ok(normal.scale<=c.height/c.boundsHeight+1e-8);
 c.boundsHeight=2200;c.boundsTop=-985;
 const tall=frame(c);a.ok(tall.scale<=c.height/c.boundsHeight+1e-8);
 a.ok(tall.y>=c.boundsTop && tall.y+c.height/tall.scale<=c.boundsTop+c.boundsHeight+1e-7);
});
test('the camera makes no physics changes and does not operate on resolved encounters',()=>{
 const c=make(3),before=JSON.stringify(c);for(let i=0;i<100;i++)frame(c);
 a.equal(JSON.stringify(c),before);
 c.boss.phase='resolved';a.equal(frame(c),null);
});

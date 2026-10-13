/* SIGNAL BREAKER — original procedural scene art and event visuals.
   No network assets or third-party game sprites. Rendering quality does not alter hitboxes. */
(function(root){'use strict';
const W=1100,H=620,GROUND=536,PI=Math.PI,TAU=2*PI;
const sat=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const palette={metal:['#d9ffff','#50d8f1','#174966'],dust:['#fff5c7','#e8a34d','#633c21'],power:['#f4ecff','#a385ff','#453182'],load:['#ffedbb','#f79b58','#793c31']};
function path(c,pts,fill,stroke,thick=1){c.beginPath();c.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)c.lineTo(pts[i][0],pts[i][1]);c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=thick;c.stroke();}}
function line(c,x,y,a,b,color,width=2){c.beginPath();c.moveTo(x,y);c.lineTo(a,b);c.strokeStyle=color;c.lineWidth=width;c.stroke();}
function disk(c,x,y,r,fill,stroke,width=1){c.beginPath();c.arc(x,y,Math.max(0,r),0,TAU);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
function rect(c,x,y,w,h,fill,stroke){if(fill){c.fillStyle=fill;c.fillRect(x,y,w,h);}if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.strokeRect(x,y,w,h);}}
function glow(c,x,y,r,color){const g=c.createRadialGradient(x,y,1,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}
function steel(c,x,y,w,h,bright=false){const g=c.createLinearGradient(x,0,x+w,0);g.addColorStop(0,bright?'#d6b992':'#405a64');g.addColorStop(.3,bright?'#8dabb5':'#6c8792');g.addColorStop(.57,bright?'#41545c':'#273f4f');g.addColorStop(1,bright?'#d2ddd7':'#526775');rect(c,x,y,w,h,g,'#91a4a824');line(c,x+2,y+1,x+w-2,y+1,bright?'#f6eed9aa':'#a4b8bf48',1);}
function drawCanvas(c,stage){
 const bg=c.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#142d40');bg.addColorStop(.38,'#2b5760');bg.addColorStop(.68,'#22434a');bg.addColorStop(1,'#101f2e');rect(c,0,0,W,H,bg);
 glow(c,777,112,440,'#77dace25');glow(c,190,188,430,'#efa56513');
 // layered hazy skyline, with depth separation and original silhouettes
 for(let i=0;i<16;i++){const bx=i*84-45,y=205+(i*37%113);rect(c,bx,y,70,H-y,'#16374175');for(let k=0;k<4;k++)rect(c,bx+12+k*13,y+22,6,8,'#9babb517');}
 rect(c,0,402,W,135,'#19343ccc');
 // receding slabs and foreground open work bays
 for(let i=0;i<6;i++){const x=-70+i*225;path(c,[[x,402],[x+165,402],[x+119,465],[x-37,465]],'#29444d','#6e808438');line(c,x,402,x-37,465,'#a2a7a133',2);}
 // tall crane with cabin, counterweight, hook. Distinct from playable mechanics.
 steel(c,213,70,13,380);steel(c,219,58,13,18,true);
 for(let i=0;i<9;i++){let yy=88+i*40;line(c,218,yy,224,yy+40,'#a6bac063',2);line(c,225,yy,217,yy+40,'#a6bac063',2);}
 steel(c,137,76,344,10,true);steel(c,172,67,13,28);steel(c,226,51,6,41);
 for(let i=0;i<8;i++){let xx=157+i*39;line(c,xx,77,xx+39,86,'#bcc2b957',1.6);line(c,xx+39,77,xx,86,'#6b8892ad',1.6);}
 path(c,[[218,77],[298,29],[305,32],[230,78]],'#83989c','#dfd6b557');line(c,220,77,145,35,'#7b9499',3);
 rect(c,149,81,44,20,'#3d4c53','#ddcf985a');rect(c,311,86,20,16,'#5c7072','#cba979b0');
 line(c,390,82,390,175,'#b9bdac',1.2);line(c,383,176,397,176,'#facd8c',3);disk(c,390,183,7,'#a3a6a2','#f4d99b',1);
 // catwalks with textured metal grating and adjustable steel frames
 steel(c,24,298,298,13);steel(c,19,310,7,154);
 for(let i=0;i<5;i++){let x=35+i*56;steel(c,x,139,7,332);line(c,x,157,x+56,293,'#66828a93',2);line(c,x+56,157,x,293,'#66828a93',2);}
 steel(c,24,148,293,9);for(let i=0;i<12;i++){let x=34+i*23;line(c,x,149,x,297,'#69838d40',1);}
 steel(c,19,462,330,12,true);
 // worksite concrete towers at center/right
 for(const [x,y,w,h] of [[450,310,115,160],[571,258,110,213],[677,292,170,177]]){
  rect(c,x,y,w,h,'#284650','#8db0ac28');steel(c,x,y,w,8);for(let i=0;i<5;i++){let yy=y+30+i*28;line(c,x+5,yy,x+w-7,yy,'#98aaaf4e',2);}for(let i=0;i<4;i++)rect(c,x+10+i*(w-24)/4,y+18,10,h-29,'#20374343');
 }
 // warm working floodlights and local falloff
 for(const [x,y] of [[325,179],[608,238],[902,129]]){rect(c,x-4,y-10,8,12,'#829ca4');path(c,[[x-12,y],[x+12,y],[x+6,y+6],[x-6,y+6]],'#e9cc99','#ffdca0');glow(c,x,y+36,145,'#ffc97822');}
 // stacked pallets and formwork, different depth layers
 for(let i=0;i<3;i++){let x=362+i*50;rect(c,x,438-i*5,54,12,'#6b6556','#d5af7844');rect(c,x+7,429-i*5,46,9,'#82725c','#b3a88c88');}
 for(let i=0;i<4;i++){let xx=872+i*27;steel(c,xx,428+i*2,22,68);line(c,xx,496,xx+22,430,'#bcc6bb44',2);}
 // floor: marked hazard / perspective grid
 const floor=c.createLinearGradient(0,GROUND,0,H);floor.addColorStop(0,'#243943');floor.addColorStop(1,'#0c1624');rect(c,0,GROUND,W,H-GROUND,floor);steel(c,0,GROUND,W,10,true);
 for(let i=0;i<13;i++){let xx=i*103;line(c,xx,GROUND+8,xx+42,H,'#aec1c519',1);}
 line(c,0,574,W,574,'#70848c32',2);line(c,0,609,W,609,'#70848c20',1);
 for(let i=0;i<7;i++){const xx=49+i*165;path(c,[[xx,543],[xx+26,543],[xx+6,553],[xx-21,553]],'#ad8043','#4d3835');}
 // environmental fore warning tape foreground, not a HUD
 for(let x=0;x<W;x+=42){path(c,[[x,532],[x+22,532],[x+10,538],[x-12,538]],'#c99b42','#3a4247');}
 rect(c,0,42,W,1,'#e4faff13');rect(c,0,100,W,1,'#e4faff09');
 // stage-specific accent infrastructure, fixed scenery only
 if(stage?.id==='SB-02'){rect(c,864,311,94,79,'#465a5a','#f9c66f');for(let i=0;i<6;i++)line(c,874,331+i*9,946,331+i*9,'#c8b67e',3);glow(c,909,346,140,'#d6c78526');}
 if(stage?.id==='SB-03'){for(let i=0;i<4;i++){steel(c,572+i*70,412,61,9,true);disk(c,602+i*70,432,10,'#203b48','#d1be87',2);}}
 if(stage?.boss){glow(c,800,212,290,'#b686ff23');for(let i=0;i<7;i++){let a=i*.9;line(c,786,200,786+Math.cos(a)*180,200+Math.sin(a)*170,'#b892ff13',4);}}
}
class PremiumArt{
 // Final raster bodies use the existing world origin; physics and relay nodes remain engine-owned.
 bossMotion(b,time,options={}){
  const warning=b.warningUntil>time,exposed=b.phase==='exposed';
  const stopped=this.reducedMotion||options.secured||options.direction===0||b.phase==='resolved'||b.phase==='defeated';
  const speed=warning?1.7:exposed?.45:1;
  const direction=options.direction===-1?-1:1,controlled=b.mistUntil>time;
  this.bossClocks=this.bossClocks||new WeakMap();
  let clock=this.bossClocks.get(b);
  if(!clock||time<clock.time){clock={time,phase:0,exposure:exposed?1:0,warningBlend:warning?1:0};this.bossClocks.set(b,clock);}
  const dt=Math.max(0,time-clock.time),ease=1-Math.exp(-Math.min(dt,.1)*10);
  if(!this.reducedMotion)clock.exposure+=((exposed?1:0)-clock.exposure)*ease;
  if(!stopped)clock.warningBlend+=((warning?1:0)-clock.warningBlend)*ease;
  if(!stopped)clock.phase+=(time-clock.time)*speed*(b.identity==='conveyor'?direction:1)*(b.identity==='extraction'&&controlled?.22:1);
  clock.time=time;
  const phase=clock.phase;
  const stages=b.maxGatePhases||b.maxSegments||b.maxFilterStages||b.maxLoadStages||1;
  const stage=b.gatePhase||b.segment||b.filterStage||b.loadStage||1;
  const wear=sat(((stage-1)+(1-sat(b.maxHp?b.hp/b.maxHp:1)))/stages);
  const impact=this.bossImpact?.identity===b.identity?Math.max(0,1-(this.clock-this.bossImpact.at)/.24):0;
  return {phase,speed,warning,exposed,exposure:clock.exposure,vibration:this.reducedMotion?0:Math.sin(phase*3.1)*(.65+clock.warningBlend*1.55),wear,impact:this.reducedMotion?0:impact,controlled,direction,stopped};
 }
 // Move only authored metal within measured component masks; the world footprint stays fixed.
 bossJoints(c,image,b,w,h,m){
  const left=b.x-w/2,top=b.y-h/2;
  const rotor=(x,y,r,angle)=>{
   const px=left+x*w,py=top+y*h,rr=r*Math.min(w,h);
   c.save();c.beginPath();c.arc(px,py,rr,0,TAU);c.clip();
   c.translate(px,py);c.rotate(angle);
   c.drawImage(image,left-px,top-py,w,h);c.restore();
  };
  const slide=(x,y,rw,rh,dx,dy)=>{
   const px=left+x*w,py=top+y*h;
   c.save();c.beginPath();c.rect(px,py,rw*w,rh*h);c.clip();
   c.fillStyle='#101b22';c.fillRect(px,py,rw*w,rh*h);
   c.drawImage(image,left+dx,top+dy,w,h);c.restore();
  };
  const a=m.phase;
  if(b.identity==='delivery'){
   const travel=m.exposure*5,v=m.stopped?0:Math.sin(a*2.8)*.7;
   slide(.23,.30,.19,.44,-travel,v);slide(.65,.37,.14,.39,travel,-v);
   rotor(.533,.56,.041,a*.22);
  }else if(b.identity==='conveyor'){
   rotor(.117,.485,.049,-a*1.8);
   rotor(.889,.48,.049,a*1.8);
  }else if(b.identity==='extraction'){
   rotor(.488,.642,.070,a*2.1);
  }else if(b.identity==='tension'){
   const v=m.vibration;
   slide(.145,.58,.185,.19,0,v);slide(.64,.58,.17,.19,0,-v);
   rotor(.232,.263,.021,a*.55);rotor(.768,.258,.021,-a*.55);
  }else if(b.identity==='grid'){
   const travel=m.exposure*3;
   slide(.477,.456,.040,.177,0,-travel);
   rotor(.128,.555,.040,a*.12);rotor(.883,.555,.040,-a*.12);
  }
 }
 bossDamage(c,b,w,h,m){
  if(m.wear<=0&&!m.impact)return;
  c.save();
  // Dark scoring and a metal rim stay on the housing, away from the live relay markers.
  const marks=[[-.34,.20],[.33,.18],[-.29,-.12],[.29,-.15]];
  for(let i=0;i<Math.ceil(m.wear*marks.length);i++){
   const [dx,dy]=marks[i],x=b.x+dx*w,y=b.y+dy*h;
   c.globalAlpha=.35+m.wear*.45;
   line(c,x-7,y-3,x+6,y+3,'#0b151d',3.4);
   line(c,x-6,y-4,x+5,y+2,'#c6a078',.8);
  }
  if(m.impact){c.globalAlpha=m.impact*.65;disk(c,b.x,b.y,26,null,'#fff3cf',2.5);}
  c.restore();
 }
 bossBody(c,b,time,options={}){
  if(typeof Image==='undefined'||!root.PSIPresentationAssets)return false;
  const sizes={delivery:[252,184],conveyor:[280,188],extraction:[244,214],tension:[286,202],grid:[280,224]},size=sizes[b.identity];
  if(!size)return false;
  const source='art/boss-'+b.identity+'-final-v2.webp';
  this.bossImages=this.bossImages||{};
  const image=this.bossImages[source]||root.PSIPresentationAssets.image(source);this.bossImages[source]=image;
  if(!image?.complete||!image.naturalWidth)return false;
  const [w,maxH]=size,h=Math.min(maxH,w*image.naturalHeight/image.naturalWidth),exposed=b.phase==='exposed',warning=b.warningUntil>time;
  c.save();
  // Shadow and light are local to the apparatus, never a second collision silhouette.
  glow(c,b.x,b.y,w*.52,exposed?'#f8c67429':warning?'#ef785924':'#65b7c511');
  c.drawImage(image,b.x-w/2,b.y-h/2,w,h);
  const motion=this.bossMotion(b,time,options);
  this.bossJoints(c,image,b,w,h,motion);
  this.bossDamage(c,b,w,h,motion);
  const hp=b.maxHp?Math.max(0,b.hp)/b.maxHp:1;
  if(hp<1){c.globalAlpha=(1-hp)*.35;glow(c,b.x,b.y,42,'#f9ad6544');c.globalAlpha=1;}
  disk(c,b.x,b.y,exposed?22:14,exposed?'#fff0bdcc':'#122935bc',exposed?'#ffe6a5':'#83bec999',exposed?3:1.5);
  if(exposed){disk(c,b.x,b.y,31,null,'#ffdda366',2);}
  const segments=b.maxGatePhases||b.maxSegments||b.maxFilterStages||0,phase=b.gatePhase||b.segment||b.filterStage||b.loadStage||1;
  if(segments>1){for(let i=0;i<segments;i++)disk(c,b.x+(i-(segments-1)/2)*12,b.y+h/2-8,3.5,i<phase?'#ffd389':'#284854');}
  if(warning){const alpha=this.reducedMotion ? .75 : .55+.2*Math.sin(time*6);c.globalAlpha=alpha;disk(c,b.x-w*.38,b.y-h*.28,5,'#ffd390');disk(c,b.x+w*.38,b.y-h*.28,5,'#ffd390');}
  c.restore();this.lastBossArt={identity:b.identity,source,width:w,height:h,ready:true,motion:{...motion}};return true;
 }

 projectileSprite(c,s,time,coat){
  if(!this.projectileAtlas&&root.PSIPresentationAssets)this.projectileAtlas=root.PSIPresentationAssets.image('art/psi-projectiles-atlas-v1.webp');
  const image=this.projectileAtlas;if(!image?.complete||!image.naturalWidth)return false;
  const keys=['pulse','bankshot','resonance','net','magnet','mist','anchor','scan','arc','laser','storm','singularity','prism','plasma','final-arc','final-laser'];
  const key=s.element?(s.capstone?'final-'+s.element:s.recipe||s.element):s.kind,cell=keys.indexOf(key);if(cell<0)return false;
  const size=s.capstone?76:s.recipe?62:48,w=image.naturalWidth/4,h=image.naturalHeight/4,color=coat||root.SignalBreakerChapter?.WEAPONS[s.kind]?.color||'#a0f5ed';
  c.save();c.lineCap='round';const trail=s.trail||[];for(let i=1;i<trail.length;i++){const a=i/trail.length;c.globalAlpha=a*.4;line(c,trail[i-1].x,trail[i-1].y,trail[i].x,trail[i].y,color,(s.branch==='focus'?4:2)*a);}
  c.globalAlpha=1;c.translate(s.x,s.y);c.rotate(Math.atan2(s.vy,s.vx));
  if(s.branch==='spread'&&this.quality!=='low'){c.globalAlpha=.3;for(const y of [-6,6])line(c,-26,y,8,y,color,1);c.globalAlpha=1;}
  c.drawImage(image,cell%4*w,Math.floor(cell/4)*h,w,h,-size/2,-size/2,size,size);c.restore();this.projectileKinds=this.projectileKinds||new Set();this.projectileKinds.add(key);return true;
 }
 projectile(c,s,time,coat=null){this.combatVfx?.projectile(c,s);
  if(this.projectileSprite(c,s,time,coat))return true;
  const spec=root.SignalBreakerChapter?.WEAPONS[s.kind];if(!spec)return false;
  if(s.element){const arc=s.element==='arc',color=coat||(arc?'#93edff':'#f3a1ff'),trail=s.trail||[],angle=Math.atan2(s.vy,s.vx);c.save();c.globalCompositeOperation='lighter';c.lineCap='round';
   if(trail.length>1){const end=trail.at(-1),first=trail[Math.max(0,trail.length-(arc?5:9))];c.globalAlpha=.75;
    if(arc){let x=first.x,y=first.y;const n=this.quality==='low'?3:6;for(let i=1;i<=n;i++){const t=i/n,xx=first.x+(end.x-first.x)*t+(i<n&&!this.reducedMotion?Math.sin(i*7+s.id)*5:0),yy=first.y+(end.y-first.y)*t;line(c,x,y,xx,yy,color,s.recipe?3:2);x=xx;y=yy;}}
    else{line(c,first.x,first.y,end.x,end.y,color,s.recipe?8:5);line(c,first.x,first.y,end.x,end.y,'#ffffff',2);}}
   c.globalAlpha=1;c.translate(s.x,s.y);c.rotate(angle);if(arc){disk(c,0,0,s.recipe?7:5,'#e5ffff',color,2);}else{line(c,-27,0,15,0,color,s.recipe?7:4);line(c,-24,0,14,0,'#fff8ff',2);}c.restore();return true;
  }
  const color=coat||spec.color,trail=s.trail||[],angle=Math.atan2(s.vy,s.vx);
  c.save();c.globalCompositeOperation='lighter';c.lineCap='round';
  if(trail.length>1){for(let i=1;i<trail.length;i++){const a=i/trail.length;c.globalAlpha=a*.5;line(c,trail[i-1].x,trail[i-1].y,trail[i].x,trail[i].y,color,(s.kind==='net'?9:5)*a);}}
  c.globalAlpha=1;c.translate(s.x,s.y);c.rotate(angle);c.shadowColor=color;c.shadowBlur=this.quality==='low'?0:12;
  if(s.kind==='bankshot'){path(c,[[-23,0],[-6,-4],[9,-4],[19,0],[9,4],[-6,4]],'#4d95bd',color,2);line(c,-28,0,20,0,'#e8ffff',2.5);disk(c,-5,0,4,'#f4ffff');for(const sign of [-1,1])line(c,-12,sign*10,12,sign*6,color,2);
  }else if(s.kind==='resonance'){for(let i=0;i<3;i++){c.beginPath();c.arc(0,0,6+i*5,-1.2,1.2);c.strokeStyle=i===0?'#ffffff':color;c.lineWidth=3-i*.6;c.stroke();}disk(c,4,0,7,'#ffdceb',color,2);
  }else if(s.kind==='pulse'){
   const flame=c.createLinearGradient(-30,0,14,0);flame.addColorStop(0,'transparent');flame.addColorStop(.65,color);flame.addColorStop(1,'#fff8df');
   path(c,[[-30,0],[-4,-6],[14,0],[-4,6]],flame);line(c,-12,0,12,0,'#fff9e4',2);
  }else if(s.kind==='net'){
   c.rotate(time*2);c.strokeStyle=color;c.lineWidth=2;const r=s.r;
   for(let i=0;i<6;i++){const a=i*TAU/6,b=(i+1)*TAU/6;line(c,Math.cos(a)*r,Math.sin(a)*r,Math.cos(b)*r,Math.sin(b)*r,color,2);line(c,Math.cos(a)*r,Math.sin(a)*r,-Math.cos(a)*r,-Math.sin(a)*r,color+'88',1);disk(c,Math.cos(a)*r,Math.sin(a)*r,2,'#edfff6');}
  }else if(s.kind==='magnet'){
   for(const sign of [-1,1]){c.beginPath();c.moveTo(-22,sign*7);c.bezierCurveTo(-7,sign*15,6,sign*12,11,sign*3);c.strokeStyle=color;c.lineWidth=2;c.stroke();}disk(c,4,0,5,'#e3fcff');
  }else if(s.kind==='mist'){
   for(let i=0;i<5;i++){const r=4+i*1.8;c.globalAlpha=1-i*.15;disk(c,7-i*7,Math.sin(time*8+i)*4,r,color+'a0');}c.globalAlpha=1;disk(c,6,0,3,'#fff2cf');
  }else if(s.kind==='anchor'){
   c.globalCompositeOperation='source-over';path(c,[[-12,-4],[5,-4],[12,-10],[9,0],[12,10],[5,4],[-12,4]],'#859b9e','#ffe0b2',1.5);line(c,-25,0,-12,0,color,2);
  }else{
   c.rotate(time*2);for(let i=0;i<3;i++){c.beginPath();c.ellipse(0,0,6+i*4,3+i*2,i*PI/3,0,TAU);c.strokeStyle=color;c.lineWidth=1.5;c.stroke();}disk(c,0,0,3,'#f7edff');
  }
  c.restore();return true;
 }
 atmosphere(c,game){
  if(this.quality==='low')return;const t=this.reducedMotion?0:game.time,stage=game.config,cell=stage.artCell;
  c.save();
  // Bounded, deterministic presentation only: no particles or collision bodies added.
  if(cell===3||stage.id==='SB-04'){
   c.strokeStyle='#a9c8d02b';c.lineWidth=1;
   for(let i=0;i<(this.quality==='high'?45:18);i++){const x=(i*83.7+t*65)%W,y=(i*47.3+t*230)%GROUND;line(c,x,y,x-7,y+22,'#bbd9e02b',1);}
  }else if(cell===1||stage.id==='SB-03'){
   for(let i=0;i<(this.quality==='high'?12:5);i++){const x=120+i*87,y=380+Math.sin(t*.4+i)*50;glow(c,x,y,60,'#c9a46a0c');}
  }
  const bounds=this.worldBounds(game.config),shade=c.createLinearGradient(0,bounds.top,0,bounds.top+bounds.height);shade.addColorStop(0,'#06131c33');shade.addColorStop(.25,'transparent');shade.addColorStop(.8,'transparent');shade.addColorStop(1,'#03101c44');rect(c,0,bounds.top,W,bounds.height,shade);
  c.restore();
 }
 equipmentLabel(b,camera,guide){
  const half=50*camera.scale,top=16*camera.scale,bottom=4*camera.scale;
  const candidates=[{x:b.x,y:b.y+66},{x:b.x+112,y:b.y+6},{x:b.x-112,y:b.y+6},{x:b.x,y:b.y-64}];
  // Short landscape reserves the central message band even while a toast fades.
  if(camera.width>camera.height&&camera.height<=500)[candidates[0],candidates[1]]=[candidates[1],candidates[0]];
  for(const p of candidates){const x=(p.x-camera.x)*camera.scale,y=(p.y-camera.y)*camera.scale;
   const bounds={left:x-half,right:x+half,top:y-top,bottom:y+bottom};
   const fits=bounds.left>=8&&bounds.right<=camera.width-8&&bounds.top>=8&&bounds.bottom<=camera.height-8;
   const covered=(Array.isArray(guide)?guide:[guide]).some(g=>g&&bounds.left<g.right&&bounds.right>g.left&&bounds.top<g.bottom&&bounds.bottom>g.top);
   if(fits&&!covered)return p;
  }
  return candidates[0];
 }
 // Stage 01 production-specific industrial boss vector. Unlike the shared equipment atlas,
 // the delivery conveyor controller has its own silhouette, moving blast doors and warning lamps.
 deliveryBoss(c,b,time){
  if(this.bossBody(c,b,time))return true;
  const opened=b.phase==='exposed',rearming=b.phase==='rearming',gate=b.gatePhase||1,danger=b.warningUntil>time,beat=this.reducedMotion?0:time;
  c.save();c.translate(b.x,b.y);glow(c,0,0,142,rearming?'#fbb06a55':opened?'#ffda8e55':'#7dd7ea22');
  path(c,[[-114,-48],[-81,-84],[85,-84],[114,-45],[114,52],[80,79],[-82,79],[-114,52]],'#1a3443','#95b8c4',4);
  rect(c,-96,-68,192,15,gate>=4?'#79564b':'#314e59','#b7d7d9',1.4);
  for(let i=1;i<gate;i++){const x=-77+(i-1)*39;line(c,x,-46,x+13,-22,'#ffe0a386',3);line(c,x+13,-22,x-3,-2,'#ba9b878a',2);}
  for(let i=0;i<gate;i++)disk(c,-84+i*28,61,4,rearming?'#ffefb2':'#f3b771');
  for(let i=0;i<9;i++){const x=-92+i*21;path(c,[[x,-66],[x+11,-66],[x+18,-55],[x+7,-55]],i%2?'#3a3331':'#edb957');}
  for(const side of [-1,1]){const x=side*90;rect(c,x-13,-28,26,81,'#2c5266','#9cc2cd',2);rect(c,x-7,-20,14,62,'#5d7e86');disk(c,x,-51,9,danger&&Math.floor(beat*8)%2?'#fff0bf':'#e29348','#493525',2);}
  c.save();c.rotate(opened?0:Math.sin(beat*.55)*.08);
  disk(c,0,2,61,'#112e41','#8199a6',5);for(let i=0;i<10;i++){const angle=i*Math.PI/5+beat*.3;line(c,Math.cos(angle)*43,Math.sin(angle)*43,Math.cos(angle)*53,Math.sin(angle)*53,'#ffb85e',4);}
  disk(c,0,2,33,opened?'#f4b35b':'#2c6575','#d7e2dc',4);disk(c,0,2,opened?20:13,opened?'#fff0b3':'#63b7c4');
  c.restore();
  const retract=opened?30:0;for(const side of [-1,1]){rect(c,side*(18+retract)-27,-38,54,79,opened?'#294859':'#385b65','#c9d4d2',2);for(let i=0;i<4;i++)rect(c,side*(18+retract)-22,-30+i*18,44,7,opened?'#dc9a53':'#718d92');}
  rect(c,-68,65,136,12,'#122b39','#b4bfbd',1.5);for(let i=-2;i<=2;i++)disk(c,i*23,70,5,'#31515f','#e1be7a',1);
  c.font='800 11px sans-serif';c.textAlign='center';c.fillStyle='#d8edf0';c.fillText('BAY 01 · SIGNAL GATE',0,-93);
  c.font='900 12px sans-serif';c.fillStyle='#ffe4b4';c.fillText('LOCK '+gate+' / '+(b.maxGatePhases||1)+(rearming?' · RESET':''),0,102);
  if(danger){c.globalAlpha=this.reducedMotion ? .72 : .5+.4*Math.sin(beat*13);line(c,-88,-91,88,-91,'#ffd175',4);}
  c.restore();return true;
 }
 // CH-02 dedicated moving conveyor controller: twin drive shafts, belt teeth,
 // variable rotation and outward opening core. Rendered procedurally for offline performance.
 conveyorBoss(c,b,time,direction){
  if(this.bossBody(c,b,time,{direction}))return true;
  const open=b.phase==='exposed',warning=b.warningUntil>time,shift=b.phase==='rebuilding',segment=b.segment||1,phase=this.reducedMotion?0:time*direction*1.7;
  c.save();c.translate(b.x,b.y);
  glow(c,0,0,146,shift?'#fdb57555':warning?'#ff9e7647':open?'#a5f6de40':'#62adcb2b');
  path(c,[[-131,-34],[-110,-78],[-42,-87],[25,-72],[104,-84],[132,-44],[131,60],[-124,60]],'#172f40','#87a9ae',4);
  rect(c,-115,-57,230,111,segment>=4?'#3b4054':segment>=3?'#314d57':'#203947',segment>=4?'#f6bd9e':'#a4bec4',3);
  for(let k=0;k<segment-1;k++){const x=-88+k*47;line(c,x,-50,x+12,-34,'#ffb983aa',3);line(c,x+12,-34,x+2,-15,'#fff0cb77',2);}
  rect(c,-107,-33,214,78,'#122632','#536d7e',2);
  const beltColor=direction===0?'#476f76':'#427d8a';
  rect(c,-99,-26,198,64,beltColor,'#a4bac2',2);
  for(let i=-4;i<=4;i++){let x=i*22+phase*8%22;if(x>100)x-=198;if(x< -100)x+=198;line(c,x-9,-22,x+10,33,'#b0cfcd53',3);}
  for(const x of [-91,91]){
   disk(c,x,4,31,'#193b4a','#bdd1d0',5);disk(c,x,4,23,'#517684','#e1b66d',3);
   for(let k=0;k<8;k++){const a=k*Math.PI/4+phase;line(c,x+Math.cos(a)*8,4+Math.sin(a)*8,x+Math.cos(a)*19,4+Math.sin(a)*19,'#d4dcde',3);}
   disk(c,x,4,7,direction===0?'#93e8d7':'#ebbc74');
  }
  path(c,[[-42,-65],[-16,-88],[16,-88],[43,-65],[25,-28],[-23,-28]],'#2b4e61','#c3d8d9',3);
  const door=open?40:10;
  for(const side of [-1,1]){
   const x=side*door;
   path(c,[[x-18,-19],[x+18,-19],[x+24,36],[x-24,36]],open?'#325967':'#394953',open?'#f1b66b':'#7ca2b2',2.5);
   for(let j=0;j<3;j++)line(c,x-12,-11+j*15,x+12,-11+j*15,'#d5e7df66',2);
  }
  disk(c,0,7,open?24:13,open?'#ffe7ac':'#6dc9d7','#e6ebda',3);
  for(const side of [-1,1]){const x=side*111;rect(c,x-12,-72,24,32,'#33454a','#e6ba69',2);disk(c,x,-60,7,warning?'#ff7d57':'#b19a63');}
  rect(c,-95,65,190,12,'#192e38','#95b9bf',2);
  c.font='800 11px sans-serif';c.fillStyle='#d9ebed';c.textAlign='center';c.fillText('CH-02 · OVERLOAD DRIVE',0,-97);
  c.fillStyle=shift?'#ffe8bb':'#e3edeb';c.font='900 12px sans-serif';c.fillText('CORE ARMOUR '+segment+' / '+(b.maxSegments||1)+(shift?' · REBUILDING':''),0,112);
  if(direction===0){c.fillStyle='#b5fff2';c.fillText('BELT LOCK / SAFE',0,94);}
  c.restore();return true;
 }
 // CH-03 distinct tall pressure extraction tower: cyclone duct, collector drum and fan.
 // Pure Canvas vector geometry, keeping responsive draw budget bounded.
 extractionBoss(c,b,time,gate){
  if(this.bossBody(c,b,time))return true;
  const open=b.phase==='exposed',purging=b.phase==='purging',warning=b.warningUntil>time,controlled=b.mistUntil>time,filter=b.filterStage||b.loadStage||1,t=this.reducedMotion?0:time;
  c.save();c.translate(b.x,b.y);
  glow(c,0,0,163,purging?'#bbffca56':controlled?'#9cf1d848':warning?'#f7b57445':'#a3d7e42b');
  path(c,[[-68,-97],[24,-112],[73,-75],[84,35],[55,67],[-56,67],[-83,23]],'#23434a','#b7d1cb',4);
  // Vertical extraction vessel and narrowing collection funnel.
  rect(c,-49,-87,98,95,'#3d626b','#a9c9c6',3);
  path(c,[[-48,6],[48,6],[20,82],[-20,82]],'#395761','#d2bd9c',3);
  for(let k=0;k<5;k++)line(c,-42,-69+k*16,42,-69+k*16,k<filter-1?'#e6b58c':k%2?'#759ca0':'#bed1c9',2);
  for(let k=1;k<filter;k++)disk(c,-36+k*18,-83,5,purging?'#d9ffca':'#e9ad87','#fff4df',1);
  path(c,[[-49,-71],[-96,-71],[-117,-48],[-117,-3]],null,'#d2bb94',12);
  disk(c,-117,-2,19,'#263e4b','#d0b994',3);disk(c,-117,-2,9,controlled?'#aaffdb':'#d5ac72');
  // Twin-filter canisters show state without relying only on hue.
  for(const side of [-1,1]){const x=side*66;rect(c,x-18,14,36,52,'#253e47','#d3c7a9',2);for(let j=0;j<4;j++)line(c,x-12,23+j*11,x+12,23+j*11,controlled?'#a1e2c5':'#b18d67',2);}
  disk(c,0,-37,31,'#142e39','#cbd5c7',4);disk(c,0,-37,23,controlled?'#86e4c5':warning?'#eaa268':'#648e9c','#f0dfb7',2);
  for(let k=0;k<5;k++){const a=t*(controlled?.6:1.1)+k*Math.PI*2/5;line(c,Math.cos(a)*6,Math.sin(a)*6-37,Math.cos(a)*19,Math.sin(a)*19-37,'#d9e3d4',3);}
  rect(c,-34,-94,68,12,'#172c37','#b4c8c7',1.7);
  for(const x of [-55,55])disk(c,x,-92,7,warning?'#fba06b':controlled?'#adffcf':'#d3bb86');
  const pressure=warning?.9:controlled?.18:.45;
  rect(c,47,-54,22,61,'#203c48','#c4d3ce',2);rect(c,54,-47+47*(1-pressure),8,47*pressure,warning?'#f7ac6b':'#83d1c2');
  c.font='800 10px sans-serif';c.fillStyle='#e0e9dc';c.textAlign='center';c.fillText('CH-03 · FILTER CORE',0,-124);
  c.font='900 11px sans-serif';c.fillStyle='#d0f6df';c.fillText('FILTER '+filter+' / '+(b.maxFilterStages||b.maxLoadStages||1)+(purging?' · PURGING':''),0,116);
  c.fillStyle=controlled?'#baffdf':'#f1d0a3';c.fillText(controlled?'PRESSURE PURGED':(gate.open?'DAMPER OPEN':'DAMPER SHUT'),0,99);
  c.restore();return true;
 }
 // CH04 distinct counterweight/tension-drum profile; independent of three preceding boss silhouettes.
 tensionBoss(c,b,time,secured){
  if(this.bossBody(c,b,time,{secured}))return true;
  const opened=b.phase==='exposed',warning=b.warningUntil>time,t=this.reducedMotion?0:time;
  c.save();c.translate(b.x,b.y);
  glow(c,0,0,154,secured?'#95f5c34c':warning?'#ffae7b4a':'#c9c4a632');
  // Hoist head, sheave frame and separate hanging counterweights.
  path(c,[[-82,-79],[-48,-113],[48,-113],[83,-79],[89,-10],[-90,-10]],'#263d4a','#c5d0c6',4);
  rect(c,-74,-73,148,82,'#284958','#a9bcb9',2.5);
  for(const side of [-1,1]){
   const sx=side*58;disk(c,sx,-43,26,'#192f3a','#d7ccae',4);
   for(let k=0;k<8;k++){const ang=k*Math.PI/4+(secured?0:t*.65)*side;line(c,sx+Math.cos(ang)*9,-43+Math.sin(ang)*9,sx+Math.cos(ang)*19,-43+Math.sin(ang)*19,'#e0dfcf',3);}
   disk(c,sx,-43,7,secured?'#80edc9':'#efb277');
   line(c,sx,-17,sx,69,secured?'#8bedcb':'#aabdc2',4);
   rect(c,sx-18,60,36,22,'#53656b','#c7bc9c',2);
   for(let k=0;k<3;k++)line(c,sx-13,66+k*5,sx+13,66+k*5,'#f2b66e',2);
  }
  path(c,[[-50,8],[-35,-5],[35,-5],[50,8],[33,57],[-33,57]],'#243d47','#d9c09e',3);
  disk(c,0,26,opened?27:17,opened?'#f9df9e':'#7996ab','#d9dfd1',4);disk(c,0,26,8,secured?'#9bf7ca':'#d7a06d');
  const tick=secured?0:Math.sin(t*2)*7;
  line(c,-45,4,45,4+tick,warning?'#ffb889':'#b7cdcd',3.3);
  for(const side of [-1,1]){const sx=side*97;rect(c,sx-12,-66,24,34,'#39434a','#d9b276',2);disk(c,sx,-55,7,warning?'#ff8c65':secured?'#91ffd1':'#a8ab83');}
  rect(c,-60,83,120,13,'#1a313e','#d7c6a5',2);
  c.font='800 11px sans-serif';c.textAlign='center';c.fillStyle='#ecddc3';c.fillText('CH-04 · TENSION RELAY',0,-128);
  c.fillStyle=secured?'#aefbd3':'#f2ba83';c.fillText(secured?'ANCHOR LOCKED':'CABLE UNDER LOAD',0,111);
  c.restore();return true;
 }
 // CH05 finale: multi-circuit command center with rotating armature and three live channels.
 gridBoss(c,b,time){
  if(this.bossBody(c,b,time))return true;
  const open=b.phase==='exposed',critical=b.combatTier===2,warning=b.warningUntil>time,isolated=b.scannedUntil>time,t=this.reducedMotion?0:time;
  c.save();c.translate(b.x,b.y);
  glow(c,0,0,182,critical?'#fc78ae49':isolated?'#a8f6d54c':'#bdabfb38');
  // Spoked outer cradle is unlike the conveyor, extraction chimney or hoist pulley.
  path(c,[[-123,-76],[-74,-125],[74,-125],[123,-76],[132,55],[77,103],[-77,103],[-132,55]],'#1b2f4b','#b0b9db',4);
  disk(c,0,-5,90,'#162e4a','#aebde1',6);
  disk(c,0,-5,71,'#315074','#8acbda',3);
  c.save();c.rotate(open?0:t*(critical?.62:.32));
  for(let j=0;j<8;j++){const a=j*Math.PI/4;line(c,Math.cos(a)*34,Math.sin(a)*34-5,Math.cos(a)*64,Math.sin(a)*64-5,critical?'#ef8fb3':'#8edbd9',4);}
  c.restore();
  for(let j=0;j<3;j++){
   const a=-Math.PI/2+j*2*Math.PI/3,x=Math.cos(a)*95,y=Math.sin(a)*95-5;
   disk(c,x,y,29,'#233750','#d9e1d9',3);
   disk(c,x,y,19,b.band===j&&warning?'#ff8b9e':isolated?'#6fe3c7':j===0?'#e9af70':j===1?'#a9adf8':'#83d8df','#f3dfdf',2);
   c.font='900 15px sans-serif';c.fillStyle='#f7f7ef';c.textAlign='center';c.fillText(String(j+1),x,y+5);
  }
  disk(c,0,-5,open?35:27,open?'#e6d7ff':'#596f9d','#eaf2df',4);
  disk(c,0,-5,open?20:13,isolated?'#91f7d2':critical?'#ff8eab':'#9ae8e8');
  for(const side of [-1,1]){const x=side*108;rect(c,x-12,42,24,28,'#263c57','#c9c9db',2);disk(c,x,52,8,warning?'#fe8fa7':isolated?'#8cf9d0':'#c0abc7');}
  rect(c,-87,116,174,13,'#24394e','#c1bed0',2);
  c.font='900 12px sans-serif';c.fillStyle=critical?'#ffd2e3':'#e0e7ff';c.textAlign='center';c.fillText('CH-05 · GRID COMMAND',0,-144);
  c.font='800 11px sans-serif';c.fillStyle=isolated?'#a4ffde':'#f2d6f2';c.fillText(critical?'PHASE 2 · CASCADE':'PHASE 1 · TRIAGE',0,151);
  c.restore();return true;
 }
 equipment(c,cell,x,y,size){
  if(!Number.isInteger(cell)||cell<0||cell>3)return false;
  if(!this.equipmentAtlas&&typeof Image!=='undefined')this.equipmentAtlas=root.PSIPresentationAssets.image('art/boss-equipment-v1.webp');
  const image=this.equipmentAtlas;if(!image?.complete||!image.naturalWidth)return false;
  // Authored row gap is at y=600, not the mathematical half; keep every sprite isolated.
  const sx=image.naturalWidth/1254,sy=image.naturalHeight/1254;
  const top=cell<2?0:600,height=cell<2?600:654;
  c.save();c.translate(x,y);c.drawImage(image,(cell%2)*627*sx,top*sy,627*sx,height*sy,-size/2,-size/2,size,size);c.restore();return true;
 }
 structure(c,cell,x,y,w,h,angle=0){
  if(!this.structureAtlas&&typeof Image!=='undefined')this.structureAtlas=root.PSIPresentationAssets.image('art/industrial-devices-v2.webp');
  const image=this.structureAtlas;if(!image?.complete||!image.naturalWidth)return false;
  // The authored atlas has varied aspect ratios; measured regions exclude neighbours.
  const crops=[[28,164,540,207],[602,40,413,391],[1070,32,429,401],[65,435,440,540],[565,517,452,427],[1040,453,480,547]];
  const [left,top,width,height]=crops[cell],sx=image.naturalWidth/1536,sy=image.naturalHeight/1024;
  c.save();c.translate(x,y);c.rotate(angle);
  c.drawImage(image,left*sx,top*sy,width*sx,height*sy,-w/2,-h/2,w,h);c.restore();return true;
 }
 constructor(){this.combatVfx=root.SignalBreakerCombatVfx?new root.SignalBreakerCombatVfx.CombatVfx():null;this.canvas=null;this.cacheStage='';this.clock=0;this.fx=[];this.sparks=[];this.max=75;this.quality='high';this.reducedMotion=false;this.flash=0;this.hitFocus=0;this.lastEventId=0;this.recoil=0;this.recovery=[];this.scene=null;if(typeof Image!=='undefined'){this.scene=root.PSIPresentationAssets.image('art/sb01-delivery-bay-v1.webp');this.coreAtlas=root.PSIPresentationAssets.image('art/core-materials-v3.png');this.operator=root.PSIPresentationAssets.image('art/operator-idle-v1.webp');}}
 reset(){this.combatVfx?.reset();this.fx=[];this.sparks=[];this.recovery=[];this.recoil=0;this.flash=0;this.bossImpact=null;this.bossClocks=new WeakMap();}
 setQuality(q){this.combatVfx?.configure(q,this.reducedMotion);this.quality=['high','balanced','low'].includes(q)?q:'high';this.max=this.quality==='high'?150:this.quality==='balanced'?75:30;if(this.sparks.length>this.max)this.sparks=this.sparks.slice(-this.max);}
 setReducedMotion(v){this.reducedMotion=!!v;this.combatVfx?.configure(this.quality,this.reducedMotion);}
 setPortrait(value){this.portrait=!!value;}
 sceneForStage(stage){this.activeStage=stage;const names={'CH-01':'delivery','CH-02':'conveyor','CH-03':'extraction','CH-04':'hoist','CH-05':'power','SB-01':'delivery','SB-02':'extraction','SB-03':'conveyor','SB-04':'power'},name=names[stage?.id];if(!name||typeof Image==='undefined')return null;const source=this.portrait?'art/world-'+name+'-v4.webp':'art/map-'+name+(name==='delivery'?'-v3.webp':'-v2.webp');this.stageScenes=this.stageScenes||{};if(!this.stageScenes[source])this.stageScenes[source]=root.PSIPresentationAssets.image(source);return {name,source,image:this.stageScenes[source]};}
 worldBounds(stage){const authored=this.sceneForStage(stage);if(this.portrait){const h=authored?.image.naturalWidth?W*authored.image.naturalHeight/authored.image.naturalWidth:1650;const floors={delivery:.684,conveyor:.738,extraction:.695,hoist:.684,power:.707},top=594-h*(floors[authored?.name]||.684);return {top,height:h};}return {top:0,height:H};}
 backgroundRevision(stage){const authored=this.sceneForStage(stage);return authored?.image.complete?authored.source+':'+authored.image.naturalWidth:'loading';}
 background(c,stage){const authored=this.sceneForStage(stage);if(authored?.image.complete&&authored.image.naturalWidth){const image=authored.image;if(this.portrait){const bounds=this.worldBounds(stage);c.drawImage(image,0,bounds.top,W,bounds.height);}else{const tops={delivery:.684,conveyor:.655,extraction:.71,hoist:.754,power:.509},height=594/tops[authored.name],width=height*image.naturalWidth/image.naturalHeight;c.drawImage(image,(W-width)/2,0,width,height);}return;}if(!this.canvas||this.cacheStage!==stage?.id){const el=document.createElement('canvas');el.width=W;el.height=H;drawCanvas(el.getContext('2d',{alpha:false}),stage);this.canvas=el;this.cacheStage=stage?.id;}c.drawImage(this.canvas,0,0);}
 ambiance(c,game){if(this.quality==='low')return;const t=game.time; c.save();
 c.globalCompositeOperation='screen';
 for(let i=0;i<(this.quality==='high'?20:9);i++){const k=i*71.98;let xx=(k*13.9+t*(7+i%5))%W,yy=94+(k*9.9%430),r=1.1+(i%4)*.5;disk(c,xx,yy+Math.sin(t*.65+i)*4,r,i%3?'#9bddda32':'#f6ce7a20');}
 glow(c,710+Math.sin(t*.2)*55,240,250,'#78dacc0c');c.restore();}
 event(e,game){this.combatVfx?.event(e);if(['electrochain','laserline'].includes(e.kind)){if(this.combatVfx)return;this.fx.push({kind:e.kind,x:e.x,y:e.y,toX:e.toX,toY:e.toY,color:e.color||'#c8ffff',age:0,duration:.22,size:0});this.fx=this.fx.slice(-22);return;}const weapon=root.SignalBreakerChapter?.WEAPONS[e.weapon];const col=e.element?(e.element==='arc'?'#93edff':'#f3a1ff'):e.kind==='fire'&&weapon?weapon.color:e.material&&e.kind!=='capture'?(palette[e.material]||palette.metal)[1]:e.kind==='capture'?'#8ffff2':e.kind==='split'?'#ffd292':e.kind==='ricochet'||e.kind==='corebounce'?'#f9d8a1':e.kind==='boss'||e.kind==='victory'?'#ffe7a6':e.kind==='hurt'?'#ff786d':e.kind==='node'||e.kind==='unseal'?'#d0b8ff':e.kind==='fire'?(e.n===2?'#80ffe6':'#ffe5aa'):'#8ae8f0';
 if(e.kind==='bosshit'&&game.boss)this.bossImpact={identity:game.boss.identity,at:this.clock};
 const kind=e.kind;if(['impact','split','capture'].includes(kind)&&typeof Image!=='undefined'&&!this.sharedVfx)this.sharedVfx=root.PSIPresentationAssets.image('/assets/survivors/cinematic-vfx-v3.png');if(kind==='fire')this.recoil=.18;if(kind==='bumper'){this.bumperHits=this.bumperHits||[];this.bumperHits.push({x:e.x,y:e.y,nx:e.nx||0,ny:e.ny||1,at:game.time});this.bumperHits=this.bumperHits.slice(-6);}if(kind==='capture')this.recovery.push({x:e.x,y:e.y,age:0,gate:{...game.config.gate},units:e.n});this.recovery=this.recovery.slice(-12); const count={fire:7,impact:26,split:22,capture:21,ricochet:11,corebounce:8,netfield:17,boss:65,victory:30,waveclear:38,wave:18,chain:35,node:21,unseal:40,bossphase:44,bossrearm:27,gatephase:39,gaterearm:21,loadstage:38,loadbalanced:25,loadrearm:20,filterpurge:37,filterflush:22,filterrearm:17,itemcollect:14,powerup:26,watchsync:35,hurt:26,bumper:10}[kind]||0;
 if(count){const n=Math.floor(count*(this.quality==='high'?1:this.quality==='balanced'?.58:.26));for(let i=0;i<n&&this.sparks.length<this.max;i++){
 let a=i*2.39996+e.x*.01,s=45+((i*81+e.y*2)%270);
 this.sparks.push({x:e.x,y:e.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.26+((i*17)%28)/100,max:.65,size:i%4?1.2:2.7,color:col,kind:i%5===0?'shard':'spark'});
 }}
 if(['fire','impact','split','capture','netfield','chain','node','unseal','boss','hurt','waveclear','itemcollect','powerup','watchsync','resonance','bankchain','bosswarning','bossdischarge','beltwarning','beltintercept','beltsurge','pressurewarning','pressuremist','pressurevent','pressureburst','filterpurge','filterflush','filterrearm','tensionwarning','tensionsecured','tensionsnap','gridwarning','gridscan','gridisolated','gridarc','gridphase','bossphase','bossrearm','gatephase','gaterearm','loadstage','loadbalanced','loadrearm'].includes(kind)){
 this.fx.push({x:e.x,y:e.y,age:0,material:e.material,weapon:e.weapon,angle:kind==='fire'&&game.launchGeometry?Math.atan2(e.dy??game.launchGeometry().direction.y,e.dx??game.launchGeometry().direction.x):0,duration:kind==='waveclear'?.65:kind==='boss'?.78:kind==='netfield'?.43:.31,color:col,kind,size:kind==='loadstage'?157:kind==='loadbalanced'?124:kind==='loadrearm'?100:kind==='waveclear'?130:kind==='boss'?100:kind==='resonance'?106:kind==='gatephase'?164:kind==='gaterearm'?108:kind==='bossphase'?154:kind==='bossrearm'?102:kind==='bossdischarge'?110:kind==='gridarc'?158:kind==='gridphase'?160:kind==='gridisolated'?120:kind==='gridwarning'?115:kind==='gridscan'?87:kind==='tensionsnap'?135:kind==='tensionsecured'?105:kind==='tensionwarning'?110:kind==='filterpurge'?156:kind==='filterflush'?115:kind==='filterrearm'?100:kind==='pressureburst'?136:kind==='pressurevent'?108:kind==='pressurewarning'?125:kind==='pressuremist'?92:kind==='beltsurge'?140:kind==='beltintercept'?95:kind==='beltwarning'?100:kind==='bosswarning'?85:kind==='bankchain'?65:kind==='netfield'?82:kind==='split'?56:30});this.fx=this.fx.slice(-22);
 }
 if(['impact','boss','node','split','hurt'].includes(kind)){this.flash=sat(this.flash+(kind==='boss'?.17:.055),0,.23);this.hitFocus=kind==='boss'?.08:.025;}
 }
 update(dt){dt=sat(dt,0,.05);this.combatVfx?.update(dt);this.clock+=dt;this.recoil=Math.max(0,this.recoil-dt);for(const q of this.recovery)q.age+=dt;this.recovery=this.recovery.filter(q=>q.age<.55);this.flash=Math.max(0,this.flash-dt*(this.reducedMotion?4:2.2));this.hitFocus=Math.max(0,this.hitFocus-dt);for(let i=this.fx.length-1;i>=0;i--){const q=this.fx[i];q.age+=dt;if(q.age>q.duration)this.fx.splice(i,1);}for(let i=this.sparks.length-1;i>=0;i--){const p=this.sparks[i];p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=1-dt*1.8;p.vy+=dt*100;if(p.life<=0)this.sparks.splice(i,1);}}
 effects(c){c.save();for(const q of this.recovery){const u=q.age/.55,t=u*u*(3-2*u);const x=q.x+(q.gate.x-q.x)*t,y=q.y+(q.gate.y-q.y)*t-Math.sin(t*PI)*60;c.globalAlpha=1-u;line(c,x,y,x-15,y+5,'#91ffe0',3);disk(c,x,y,4,'#effff4');}c.globalAlpha=1;c.globalCompositeOperation='lighter';for(const e of this.fx){const a=e.age/e.duration,opacity=Math.pow(1-a,1.7);c.globalAlpha=opacity;
 if(this.sharedVfx?.complete&&this.sharedVfx.naturalWidth&&['impact','split','capture'].includes(e.kind)){const image=this.sharedVfx,cw=image.naturalWidth/4,ch=image.naturalHeight/3,cell=e.kind==='capture'?9:e.kind==='split'?8:10,size=e.size*(1+a)*(e.kind==='impact'?1.45:1.8);c.globalAlpha=opacity*.65;c.drawImage(image,cell%4*cw,Math.floor(cell/4)*ch,cw,ch,e.x-size/2,e.y-size/2,size,size);c.globalAlpha=opacity;}
 if(['electrochain','laserline'].includes(e.kind)){line(c,e.x,e.y,e.toX,e.toY,e.color,this.quality==='low'?2:4);if(this.quality!=='low')line(c,e.x,e.y,e.toX,e.toY,'#efffff',1);continue;}
 if(e.kind==='fire'&&this.combatVfx)continue;if(e.kind==='fire'){c.save();c.translate(e.x,e.y);c.rotate(e.angle);const reach=e.weapon==='pulse'?24:e.weapon==='net'?18:14;path(c,[[0,-3],[reach*(1-a),-8*(1-a)],[reach*1.4*(1-a),0],[reach*(1-a),8*(1-a)],[0,3]],e.color);c.restore();continue;}if(e.material==='power'&&e.kind==='impact'){for(let j=0;j<5;j++){const turn=j*TAU/5,r=e.size*(.4+a);path(c,[[e.x,e.y],[e.x+Math.cos(turn+.2)*r*.5,e.y+Math.sin(turn+.2)*r*.5],[e.x+Math.cos(turn)*r,e.y+Math.sin(turn)*r]],null,e.color,2);}}c.lineWidth=e.kind==='boss'?8:3.5;c.strokeStyle=e.color;c.beginPath();c.arc(e.x,e.y,e.size*(.24+a*2.1),0,TAU);c.stroke();if(this.quality!=='low'){c.globalAlpha=opacity*.3;c.lineWidth=1.7;c.beginPath();c.arc(e.x,e.y,e.size*(.1+a*2.8),0,TAU);c.stroke();}
 if(e.kind==='split'){for(let i=0;i<9;i++){let a2=i*TAU/9+e.age*.7;line(c,e.x+Math.cos(a2)*e.size*a*.5,e.y+Math.sin(a2)*e.size*a*.5,e.x+Math.cos(a2)*e.size*a*1.7,e.y+Math.sin(a2)*e.size*a*1.7,e.color,3*(1-a));}}
 }
 for(const p of this.sparks){let o=sat(p.life/p.max);c.globalAlpha=o*.93;c.strokeStyle=p.color;c.fillStyle=p.color;c.lineWidth=p.kind==='shard'?2.8:1.5;c.beginPath();c.moveTo(p.x,p.y);c.lineTo(p.x-p.vx*(p.kind==='shard'?.036:.017),p.y-p.vy*(p.kind==='shard'?.036:.017));c.stroke();if(p.kind==='shard'&&this.quality==='high')disk(c,p.x,p.y,1.9,p.color);}
 c.restore();this.combatVfx?.draw(c);if(!this.reducedMotion&&this.flash>.005){c.fillStyle=`rgba(238,252,249,${Math.min(.22,this.flash)})`;const bounds=this.worldBounds(this.activeStage);c.fillRect(0,bounds.top,W,bounds.height);}}
 // Presentation-only size guard. Physics and capture still use q.r.
 // Ensures mobile zoom never enlarges a small hazard into a boss-sized illustration.
 hazardVisualSize(q,screenScale=1){
  const radius=Math.max(1,Number(q?.r)||14),scale=Math.max(.25,Number(screenScale)||1);
  return Math.max(radius*2,Math.min(radius*2.35,110/scale));
 }
 hazard(c,q,time,screenScale=1){
  if(!this.hazardAtlas&&root.PSIPresentationAssets)this.hazardAtlas=root.PSIPresentationAssets.image('art/released-hazards-v1.webp');
  const im=this.hazardAtlas;if(!im?.complete||!im.naturalWidth)return false;
  const cell=['metal','dust','power','load'].indexOf(q.kind);if(cell<0)return false;
  const w=im.naturalWidth/2,h=im.naturalHeight/2,size=this.hazardVisualSize(q,screenScale),warning=time<q.releaseAt;
  c.save();c.translate(q.x,q.y);if(!this.reducedMotion){c.rotate(q.kind==='load'?q.age*(q.vx>=0?1:-1)*1.8:q.kind==='metal'?Math.sin(q.age*3)*.3:q.kind==='power'?Math.sin(q.age*6)*.08:0);const pulse=q.kind==='dust'?1+Math.sin(q.age*4)*.07:1;c.scale(pulse,pulse);}c.globalAlpha=warning?.75:1;c.drawImage(im,(cell%2)*w,Math.floor(cell/2)*h,w,h,-size/2,-size/2,size,size);
  if(warning){line(c,-size*.6,0,-size*.42,0,'#fff1bc',2);line(c,size*.42,0,size*.6,0,'#fff1bc',2);}c.restore();
  // Keep the actual collision footprint legible even when sprite scale is restrained.
  c.save();c.translate(q.x,q.y);c.lineWidth=Math.min(2.4,3/Math.max(.7,screenScale));c.strokeStyle=warning?'#ffce8b':q.kind==='metal'?'#86e9eb':q.kind==='dust'?'#f2ca94':q.kind==='power'?'#d5adff':'#ffb992';
  c.globalAlpha=warning?.9:.73;c.beginPath();c.arc(0,0,q.r+3,0,Math.PI*2);c.stroke();
  if(warning){c.setLineDash([5,6]);c.beginPath();c.arc(0,0,q.r+8,0,Math.PI*2);c.stroke();}
  c.restore();return true;
 }
 supplySprite(c,kind,x,y,size){
  if(!this.supplyAtlas&&root.PSIPresentationAssets)this.supplyAtlas=root.PSIPresentationAssets.image('art/psi-supply-atlas-v1.webp');
  const image=this.supplyAtlas,cell=['source','power','charge','watch'].indexOf(kind);
  if(cell<0||!image?.complete||!image.naturalWidth)return false;
  const w=image.naturalWidth/2,h=image.naturalHeight/2;c.drawImage(image,(cell%2)*w,Math.floor(cell/2)*h,w,h,x-size/2,y-size/2,size,size);this.supplyKinds=this.supplyKinds||new Set();this.supplyKinds.add(kind);return true;
 }
 pickup(c,p,time){const type=p.type||'power';if(this.supplySprite(c,type,p.x,p.y+(this.reducedMotion?0:Math.sin(time*4+p.id)*2),34))return;const color=type==='watch'?'#b8d4ff':type==='charge'?'#ffdc89':'#a9f5d8';c.save();c.translate(p.x,p.y);if(!this.reducedMotion)c.translate(0,Math.sin(time*4+p.id)*2);c.shadowBlur=this.quality==='low'?0:12;c.shadowColor=color;const metal=c.createLinearGradient(-13,-13,13,13);metal.addColorStop(0,'#76908d');metal.addColorStop(.28,'#243b43');metal.addColorStop(.7,'#0c252e');metal.addColorStop(1,'#8da49a');path(c,[[-9,-13],[9,-13],[14,-8],[14,8],[9,13],[-9,13],[-14,8],[-14,-8]],metal,color,1.6);c.shadowBlur=0;disk(c,0,0,9,'#082128',color,1);c.fillStyle=color;c.font='800 12px system-ui';c.textAlign='center';c.fillText(type==='watch'?'W':type==='charge'?'C':'P',0,4);line(c,-6,-11,6,-11,'#eefaf1',1);c.restore();}

 core(c,q,time){
 if(!this.coreAtlas?.complete||!this.coreAtlas.naturalWidth)return false;
 const cell=['metal','dust','power','load'].indexOf(q.kind);if(cell<0)return false;
 const image=this.coreAtlas;const crops=[[145,129,407,441],[718,135,416,423],[113,729,467,413],[795,717,297,443]],crop=crops[cell],sx=image.naturalWidth/1254,sy=image.naturalHeight/1254;const width=crop[2],height=crop[3],fit=size=>size/Math.max(width,height);
 // Authored 2x2 transparent cells. Art remains inside the existing collision footprint.
 const size=q.r*2;c.save();c.translate(q.x,q.y);
 const angle=this.reducedMotion?0:q.kind==='metal'?time*.22:q.kind==='load'?Math.sin(time*.7)*.06:q.kind==='dust'?Math.sin(time*.8)*.03:0;
 c.rotate(angle);c.globalAlpha=q.stable?.78:1;
 const scale=fit(size),dw=width*scale,dh=height*scale;c.drawImage(image,crop[0]*sx,crop[1]*sy,width*sx,height*sy,-dw/2,-dh/2,dw,dh);c.restore();
 c.save();disk(c,q.x,q.y,q.r,null,(palette[q.kind]||palette.metal)[0]+'88',1);
 if(!q.stable&&['dust','power'].includes(q.kind)&&q.mistExposure>0){
  const progress=sat(q.mistExposure/.75);c.beginPath();c.arc(q.x,q.y,q.r+6,-PI/2,-PI/2+TAU*progress);c.strokeStyle='#b6ffe0';c.lineWidth=3;c.stroke();
 }
 if(q.glow>0){c.globalAlpha=Math.min(.65,q.glow*2);disk(c,q.x,q.y,q.r+5,null,'#ffffff',3);}
 if(q.stable){c.globalAlpha=1;disk(c,q.x,q.y,q.r+7,null,'#a4ffce',2);const x=q.x+q.r*.65,y=q.y-q.r*.65;disk(c,x,y,7,'#103c32','#a4ffce',1);line(c,x-3,y,x-1,y+2,'#dffff0',2);line(c,x-1,y+2,x+4,y-3,'#dffff0',2);}
 c.restore();return true;
 }
 proceduralCore(c,q,time){c.save();c.translate(q.x,q.y);let rr=q.r;let kind=q.kind;const cc=palette[kind]||palette.metal;const t=time*(kind==='power'?-1:1);
 if(kind==='metal'){
 c.rotate(t*.45);for(let i=0;i<6;i++){let a=i*TAU/6;path(c,[[Math.cos(a)*rr*.84,Math.sin(a)*rr*.84],[Math.cos(a+.17)*rr*1.08,Math.sin(a+.17)*rr*1.08],[Math.cos(a+.39)*rr*.79,Math.sin(a+.39)*rr*.79]],'#90dcf582','#efffffaa',1.4);}disk(c,0,0,rr*.43,'#14566a','#d1f9ffbd',2);for(let i=0;i<4;i++){let a=i*TAU/4+t*.33;line(c,Math.cos(a)*rr*.3,Math.sin(a)*rr*.3,Math.cos(a)*rr*.7,Math.sin(a)*rr*.7,'#d3f5ff',1.2);}
 }else if(kind==='dust'){
 c.globalCompositeOperation='screen';for(let i=0;i<7;i++){let a=i*TAU/7+time*.18;disk(c,Math.cos(a)*rr*(.65+i%3*.2),Math.sin(a)*rr*(.7+i%2*.3),rr*.17,'#e5a96655');}c.globalCompositeOperation='source-over';disk(c,0,0,rr*.63,'#b68b4688','#ffe5a1',2);for(let i=0;i<4;i++){let a=i*TAU/4;disk(c,Math.cos(a)*rr*.4,Math.sin(a)*rr*.4,rr*.12,'#ffecc0');}
 }else if(kind==='power'){
 c.rotate(Math.sin(t)*.09);path(c,[[0,-rr*.92],[rr*.68,-rr*.12],[rr*.72,rr*.55],[0,rr*.9],[-rr*.72,rr*.55],[-rr*.68,-rr*.12]],'#352d6fbb','#f0dfff',2.5);
 c.shadowColor='#b998ff';c.shadowBlur=11;path(c,[[-rr*.24,-rr*.65],[rr*.09,-rr*.13],[-rr*.09,0],[rr*.24,rr*.61],[-rr*.2,rr*.1],[0,-rr*.07]],'#f4e6ff');
 }else if(kind==='load'){
 c.rotate(t*.28);path(c,[[0,-rr*.9],[rr*.82,-rr*.42],[rr*.82,rr*.42],[0,rr*.9],[-rr*.82,rr*.42],[-rr*.82,-rr*.42]],'#833e3399','#ffd199',3);for(let i=0;i<3;i++){let a=i*TAU/3;line(c,Math.cos(a)*rr*.19,Math.sin(a)*rr*.19,Math.cos(a)*rr*.76,Math.sin(a)*rr*.76,'#fff2c9',3);}}
 if(q.stable){c.strokeStyle='#90f9d2';c.lineWidth=3;c.setLineDash([4,7]);c.beginPath();c.arc(0,0,rr+11,-t,TAU-t);c.stroke();}
 c.restore();}
 shot(c,s){const col=s.kind==='net'?'#8fffe4':'#ffe4a5',vx=s.vx,vy=s.vy,mag=Math.hypot(vx,vy)||1;
 c.save();c.translate(s.x,s.y);c.rotate(Math.atan2(vy,vx));c.globalCompositeOperation='lighter';c.shadowBlur=this.quality==='low'?0:15;c.shadowColor=col;
 if(s.kind==='pulse'){path(c,[[14,0],[-8,-5],[-27,-2],[-33,0],[-27,2],[-8,5]],'#ffe1a5a5',col,1.2);disk(c,4,0,4,'#ffffff');}
 else{c.strokeStyle='#a8ffe0';c.lineWidth=2;for(let i=0;i<8;i++){let a=i*TAU/8;line(c,Math.cos(a)*16,Math.sin(a)*16,Math.cos(a+.1)*25,Math.sin(a+.1)*25,'#aaffdd',1.2);}disk(c,0,0,16,'#5ee1c61c','#d5ffea',2);disk(c,0,0,4,'#d2fff1');}
 c.restore();}
 // Draw a visible forward muzzle above rear-facing sprite occlusion; never change ballistic simulation.
 directionalMuzzle(c,launch,weapon,firing=false){
  if(!launch?.muzzle||!launch?.direction)return;
  const spec=root.SignalBreakerChapter?.WEAPONS[weapon],color=launch.color||spec?.color||'#e2e6f3',d=launch.direction,m=launch.muzzle;
  c.save();c.translate(m.x,m.y);c.rotate(Math.atan2(d.y,d.x));c.lineCap='round';
  c.strokeStyle='#172d3d';c.lineWidth=8;c.beginPath();c.moveTo(-12,0);c.lineTo(1,0);c.stroke();
  c.lineWidth=3.5;c.strokeStyle=color;c.beginPath();c.moveTo(-11,0);c.lineTo(1,0);c.stroke();
  c.fillStyle='#edf7fa';c.beginPath();c.arc(1,0,2.5,0,Math.PI*2);c.fill();
  if(firing){c.globalAlpha=.8;c.strokeStyle=color;c.lineWidth=2;c.beginPath();c.moveTo(6,-4);c.lineTo(13,0);c.lineTo(6,4);c.stroke();}
  c.restore();
 }
 player(c,p,weapon,time,launch){
 if(this.operator?.complete&&this.operator.naturalWidth){
  c.save();c.translate(p.x,p.y);c.save();c.globalAlpha=.4;c.scale(1,.22);disk(c,0,135,31,'#08161c');c.restore();
  c.save();c.translate(0,31);c.scale((launch?.direction.x??(p.aimX-p.x))<0?-1:1,this.reducedMotion?1:1+Math.sin(time*2)*.002);c.drawImage(this.operator,-32,-96,64,96);c.restore();
  c.translate(0,-25);c.rotate(launch?Math.atan2(launch.direction.y,launch.direction.x):Math.atan2(p.aimY-p.y,p.aimX-p.x));const recoil=this.reducedMotion?0:Math.sin(this.recoil/.18*PI)*5;
  rect(c,-27-recoil,-6,30,12,weapon==='net'?'#3d9c84':'#b98b48','#d7e8e8');rect(c,-9-recoil,-10,18,20,'#203e4f','#9bbfcb');
  rect(c,18,-7,4,14,weapon==='net'?'#acffe1':'#ffe6a4');if(this.recoil>.12){c.globalAlpha=(this.recoil-.12)/.06;disk(c,22,0,weapon==='net'?10:7,weapon==='net'?'#a3ffe2':'#fff5c5');}c.restore();return;
 }
 c.save();c.translate(p.x,p.y);const angle=launch?.direction?Math.atan2(launch.direction.y,launch.direction.x):Math.atan2(p.aimY-(p.y-25),p.aimX-p.x);
 // shadow, boots, vest, neck, hard hat — compact but recognizable field-device operator
 c.save();c.globalAlpha=.45;c.scale(1,.28);disk(c,0,77,51,'#08161c');c.restore();
 for(const s of [-1,1]){rect(c,s*16-8,5,18,24,'#1a3240','#87a2b5');rect(c,s*16-10,22,22,9,'#36414d','#9aabac');}
 path(c,[[-22,-24],[22,-24],[27,10],[-27,10]],'#324f62','#b5d2d9',2);
 rect(c,-8,-19,16,18,'#edbd5b','#f8e1a2');line(c,-18,-22,18,9,'#d9f7e0',4);line(c,18,-22,-18,9,'#d9f7e0',4);
 // helmet/body asymmetry
 disk(c,0,-34,15,'#d7b18b','#b2c5d0',1.5);path(c,[[-19,-36],[-16,-49],[10,-53],[19,-43],[19,-37]],'#f5c45f','#f7e1a7',2);rect(c,-21,-38,42,6,'#e9a74b','#ffe2a5');
 rect(c,-8,-37,16,6,'#394b54');
 c.save();c.rotate(angle);c.translate(-Math.sin(this.recoil/.18*PI)*7,0);rect(c,0,-5,42,10,weapon==='net'?'#45c8a6':'#d7a44c','#ebeff0');rect(c,31,-9,20,18,'#25475b','#bedce2');rect(c,40,-7,5,14,weapon==='net'?'#a0ffe5':'#ffe8a7');c.restore();
 // breathing light and targeting holo
 glow(c,-17,-5,21,'#7be7dd44');c.restore();}
}
root.SignalBreakerPremiumArt={PremiumArt};
})(typeof window!=='undefined'?window:globalThis);

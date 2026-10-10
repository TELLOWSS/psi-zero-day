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
 constructor(){this.canvas=null;this.cacheStage='';this.clock=0;this.fx=[];this.sparks=[];this.max=75;this.quality='high';this.reducedMotion=false;this.flash=0;this.hitFocus=0;this.lastEventId=0;this.recoil=0;this.recovery=[];this.scene=null;if(typeof Image!=='undefined'){this.scene=root.PSIPresentationAssets.image('art/sb01-delivery-bay-v1.png');this.coreAtlas=root.PSIPresentationAssets.image('art/core-materials-v1.png');this.operator=root.PSIPresentationAssets.image('art/operator-idle-v1.png');}}
 reset(){this.fx=[];this.sparks=[];this.recovery=[];this.recoil=0;this.flash=0;}
 setQuality(q){this.quality=['high','balanced','low'].includes(q)?q:'high';this.max=this.quality==='high'?150:this.quality==='balanced'?75:30;if(this.sparks.length>this.max)this.sparks=this.sparks.slice(-this.max);}
 setReducedMotion(v){this.reducedMotion=!!v;}
 background(c,stage){if(stage?.id==='SB-01'&&this.scene?.complete&&this.scene.naturalWidth){const seam=Math.round(this.scene.naturalHeight*.817);c.drawImage(this.scene,0,0,this.scene.naturalWidth,seam,0,0,W,GROUND);c.drawImage(this.scene,0,seam,this.scene.naturalWidth,this.scene.naturalHeight-seam,0,GROUND,W,H-GROUND);return;}if(!this.canvas||this.cacheStage!==stage?.id){const el=document.createElement('canvas');el.width=W;el.height=H;let off=el.getContext('2d',{alpha:false});drawCanvas(off,stage);this.canvas=el;this.cacheStage=stage?.id;}c.drawImage(this.canvas,0,0);}
 ambiance(c,game){if(this.quality==='low')return;const t=game.time; c.save();
 c.globalCompositeOperation='screen';
 for(let i=0;i<(this.quality==='high'?20:9);i++){const k=i*71.98;let xx=(k*13.9+t*(7+i%5))%W,yy=94+(k*9.9%430),r=1.1+(i%4)*.5;disk(c,xx,yy+Math.sin(t*.65+i)*4,r,i%3?'#9bddda32':'#f6ce7a20');}
 glow(c,710+Math.sin(t*.2)*55,240,250,'#78dacc0c');c.restore();}
 event(e,game){const col=e.material&&e.kind!=='capture'?(palette[e.material]||palette.metal)[1]:e.kind==='capture'?'#8ffff2':e.kind==='split'?'#ffd292':e.kind==='ricochet'||e.kind==='corebounce'?'#f9d8a1':e.kind==='boss'||e.kind==='victory'?'#ffe7a6':e.kind==='hurt'?'#ff786d':e.kind==='node'||e.kind==='unseal'?'#d0b8ff':e.kind==='fire'?(e.n===2?'#80ffe6':'#ffe5aa'):'#8ae8f0';
 const kind=e.kind;if(['impact','split','capture'].includes(kind)&&typeof Image!=='undefined'&&!this.sharedVfx)this.sharedVfx=root.PSIPresentationAssets.image('/assets/survivors/cinematic-vfx-v3.png');if(kind==='fire')this.recoil=.18;if(kind==='capture')this.recovery.push({x:e.x,y:e.y,age:0,gate:{...game.config.gate},units:e.n});this.recovery=this.recovery.slice(-12); const count={fire:7,impact:26,split:22,capture:21,ricochet:11,corebounce:8,netfield:17,boss:65,victory:30,chain:35,node:21,unseal:40,hurt:26,bumper:10}[kind]||0;
 if(count){const n=Math.floor(count*(this.quality==='high'?1:this.quality==='balanced'?.58:.26));for(let i=0;i<n&&this.sparks.length<this.max;i++){
 let a=i*2.39996+e.x*.01,s=45+((i*81+e.y*2)%270);
 this.sparks.push({x:e.x,y:e.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.26+((i*17)%28)/100,max:.65,size:i%4?1.2:2.7,color:col,kind:i%5===0?'shard':'spark'});
 }}
 if(['impact','split','capture','netfield','chain','node','unseal','boss','hurt'].includes(kind)){
 this.fx.push({x:e.x,y:e.y,age:0,duration:kind==='boss'?.78:kind==='netfield'?.43:.31,color:col,kind,size:kind==='boss'?100:kind==='netfield'?82:kind==='split'?56:30});this.fx=this.fx.slice(-22);
 }
 if(['impact','boss','node','split','hurt'].includes(kind)){this.flash=sat(this.flash+(kind==='boss'?.17:.055),0,.23);this.hitFocus=kind==='boss'?.08:.025;}
 }
 update(dt){dt=sat(dt,0,.05);this.clock+=dt;this.recoil=Math.max(0,this.recoil-dt);for(const q of this.recovery)q.age+=dt;this.recovery=this.recovery.filter(q=>q.age<.55);this.flash=Math.max(0,this.flash-dt*(this.reducedMotion?4:2.2));this.hitFocus=Math.max(0,this.hitFocus-dt);for(let i=this.fx.length-1;i>=0;i--){const q=this.fx[i];q.age+=dt;if(q.age>q.duration)this.fx.splice(i,1);}for(let i=this.sparks.length-1;i>=0;i--){const p=this.sparks[i];p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=1-dt*1.8;p.vy+=dt*100;if(p.life<=0)this.sparks.splice(i,1);}}
 effects(c){c.save();for(const q of this.recovery){const u=q.age/.55,t=u*u*(3-2*u);const x=q.x+(q.gate.x-q.x)*t,y=q.y+(q.gate.y-q.y)*t-Math.sin(t*PI)*60;c.globalAlpha=1-u;line(c,x,y,x-15,y+5,'#91ffe0',3);disk(c,x,y,4,'#effff4');}c.globalAlpha=1;c.globalCompositeOperation='lighter';for(const e of this.fx){const a=e.age/e.duration,opacity=Math.pow(1-a,1.7);c.globalAlpha=opacity;
 if(this.sharedVfx?.complete&&this.sharedVfx.naturalWidth&&['impact','split','capture'].includes(e.kind)){const image=this.sharedVfx,cw=image.naturalWidth/4,ch=image.naturalHeight/3,cell=e.kind==='capture'?9:e.kind==='split'?8:10,size=e.size*(1+a)*2;c.drawImage(image,cell%4*cw,Math.floor(cell/4)*ch,cw,ch,e.x-size/2,e.y-size/2,size,size);}
 c.lineWidth=e.kind==='boss'?8:3.5;c.strokeStyle=e.color;c.beginPath();c.arc(e.x,e.y,e.size*(.24+a*2.1),0,TAU);c.stroke();if(this.quality!=='low'){c.globalAlpha=opacity*.3;c.lineWidth=1.7;c.beginPath();c.arc(e.x,e.y,e.size*(.1+a*2.8),0,TAU);c.stroke();}
 if(e.kind==='split'){for(let i=0;i<9;i++){let a2=i*TAU/9+e.age*.7;line(c,e.x+Math.cos(a2)*e.size*a*.5,e.y+Math.sin(a2)*e.size*a*.5,e.x+Math.cos(a2)*e.size*a*1.7,e.y+Math.sin(a2)*e.size*a*1.7,e.color,3*(1-a));}}
 }
 for(const p of this.sparks){let o=sat(p.life/p.max);c.globalAlpha=o*.93;c.strokeStyle=p.color;c.fillStyle=p.color;c.lineWidth=p.kind==='shard'?2.8:1.5;c.beginPath();c.moveTo(p.x,p.y);c.lineTo(p.x-p.vx*(p.kind==='shard'?.036:.017),p.y-p.vy*(p.kind==='shard'?.036:.017));c.stroke();if(p.kind==='shard'&&this.quality==='high')disk(c,p.x,p.y,1.9,p.color);}
 c.restore();if(this.flash>.005){c.fillStyle=`rgba(238,252,249,${Math.min(.22,this.flash)})`;c.fillRect(0,0,W,H);}}
 core(c,q,time){
 if(!this.coreAtlas?.complete||!this.coreAtlas.naturalWidth)return false;
 const cell=['metal','dust','power','load'].indexOf(q.kind),image=this.coreAtlas,w=image.naturalWidth/4,h=image.naturalHeight;
 const size=q.r*2.45; c.save();c.translate(q.x,q.y);
 const angle=this.reducedMotion?0:q.kind==='metal'?time*.45:q.kind==='load'?Math.sin(time*.7)*.12:q.kind==='dust'?Math.sin(time*.8)*.06:Math.sin(time*1.2)*.04;
 c.rotate(angle);c.drawImage(image,cell*w,0,w,h,-size*w/h/2,-size/2,size*w/h,size);c.restore();
 c.save();disk(c,q.x,q.y,q.r,null,(palette[q.kind]||palette.metal)[0]+'88',1);
 if(q.glow>0){c.globalAlpha=Math.min(.65,q.glow*2);disk(c,q.x,q.y,q.r+5,null,'#ffffff',3);}
 if(q.stable)disk(c,q.x,q.y,q.r+10,null,'#a4ffce',3);c.restore();return true;
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
 player(c,p,weapon,time){
 if(this.operator?.complete&&this.operator.naturalWidth){
  c.save();c.translate(p.x,p.y);c.save();c.globalAlpha=.4;c.scale(1,.22);disk(c,0,135,31,'#08161c');c.restore();
  c.save();c.translate(0,31);c.scale(p.aimX<p.x?-1:1,this.reducedMotion?1:1+Math.sin(time*2)*.002);c.drawImage(this.operator,-32,-96,64,96);c.restore();
  c.translate(0,-25);c.rotate(Math.atan2(p.aimY-p.y,p.aimX-p.x));const recoil=this.reducedMotion?0:Math.sin(this.recoil/.18*PI)*5;
  rect(c,-27-recoil,-6,30,12,weapon==='net'?'#3d9c84':'#b98b48','#d7e8e8');rect(c,-9-recoil,-10,18,20,'#203e4f','#9bbfcb');
  rect(c,4-recoil,-7,5,14,weapon==='net'?'#acffe1':'#ffe6a4');if(this.recoil>.12){c.globalAlpha=(this.recoil-.12)/.06;disk(c,11,0,weapon==='net'?10:7,weapon==='net'?'#a3ffe2':'#fff5c5');}c.restore();return;
 }
 c.save();c.translate(p.x,p.y);const angle=Math.atan2(p.aimY-p.y,p.aimX-p.x);
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
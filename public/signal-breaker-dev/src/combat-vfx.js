/* Bounded, deterministic presentation. Never reads randomness or writes game state. */
(function(root){'use strict';
const COLORS={pulse:'#ffcd85',bankshot:'#8de9ff',resonance:'#ffabd5',net:'#91ffe1',magnet:'#79dbff',mist:'#f5d39b',anchor:'#ffc38e',scan:'#bbaaff',arc:'#91efff',laser:'#f7acff'};
const RECIPE_COLORS={storm:'#93e9ff',singularity:'#73ffdd',prism:'#f2a9ff',plasma:'#ffc2a0'};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function stroke(c,points,color,width){c.beginPath();c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.strokeStyle=color;c.lineWidth=width;c.stroke();}
function ring(c,x,y,r,color,width=1){c.beginPath();c.arc(x,y,Math.max(.1,r),0,Math.PI*2);c.strokeStyle=color;c.lineWidth=width;c.stroke();}
class CombatVfx{
 constructor(){this.quality='balanced';this.reduced=false;this.reset();}
 reset(){this.items=[];this.serial=0;this.seen=new Set();}
 configure(quality,reduced){this.quality=quality;this.reduced=!!reduced;this.items=this.items.slice(-this.limit());}
 limit(){return this.quality==='low'?8:this.quality==='high'?28:16;}
 event(e){
  if(!['fire','impact','armorhit','armorbreak','evolved','bosshit','capture','skillshot','electrochain','laserline','relaybreak','assaultsurge','weaponcontact','ricochet','netfield','evolutionfield','raidcounter','raidburst','raidfailure'].includes(e.kind)||!Number.isFinite(e.x)||!Number.isFinite(e.y))return false;
  const family=e.element||e.weapon||'pulse',materialColor={metal:'#ffd597',dust:COLORS.mist,power:COLORS.scan,load:COLORS.anchor}[e.material],color=['weaponcontact','ricochet','netfield','evolutionfield'].includes(e.kind)?COLORS[family]||COLORS.pulse:['assaultsurge','relaybreak'].includes(e.kind)?'#91ffe1':e.kind==='capture'?COLORS.net:e.kind!=='fire'&&materialColor?materialColor:COLORS[family]||COLORS.pulse;
  if(e.kind==='evolutionfield')this.items=this.items.filter(q=>q.kind!=='evolutionfield'||q.recipe!==e.recipe);
  this.items.push({kind:e.kind,x:e.x,y:e.y,angle:Math.atan2(e.vy??e.dy??0,e.vx??e.dx??1),toX:e.toX,toY:e.toY,family,color:RECIPE_COLORS[e.recipe]||color,recipe:e.recipe,capstone:!!e.capstone,material:e.material,radius:['netfield','armorbreak','evolutionfield'].includes(e.kind)&&Number.isFinite(e.n)?e.n:0,tier:e.equipmentTier||1,age:0,duration:e.kind==='evolutionfield'?Math.min(2.4,e.duration||1.2):e.kind==='raidcounter'?.48:e.kind==='raidburst'?.64:e.kind==='raidfailure'?.28:e.kind==='bosshit'?.34:e.kind==='netfield'?.42:['assaultsurge','relaybreak','evolved'].includes(e.kind)?.55:e.kind==='armorbreak'?.38:e.kind==='fire'?.16:e.kind==='capture'?.38:.25,seed:++this.serial});
  this.items=this.items.slice(-this.limit());this.seen.add(e.kind+':'+family);return true;
 }
 update(dt){dt=clamp(Number(dt)||0,0,.05);for(const q of this.items)q.age+=dt;this.items=this.items.filter(q=>q.age<q.duration);}
 status(){return {active:this.items.length,limit:this.limit(),quality:this.quality,reduced:this.reduced,seen:[...this.seen]};}
 projectile(c,s,time=0){
  if(!Number.isFinite(s.x)||!Number.isFinite(s.y))return;
  const key=s.element||s.kind,color=({storm:'#91efff',singularity:'#79ffd0',prism:'#eeb4ff',plasma:'#ffc692'})[s.recipe]||COLORS[key]||COLORS.pulse,trail=(s.trail||[]).slice(-7);c.save();c.lineCap='round';
  // Short tails preserve the exact physical trajectory, including ricochet corners.
  if(trail.length>1){c.globalAlpha=this.reduced?.28:.48;stroke(c,trail.map(p=>[p.x,p.y]),color,this.quality==='low'?2:s.element==='laser'?5:3);if(this.quality!=='low'){c.globalAlpha=.65;stroke(c,trail.slice(-4).map(p=>[p.x,p.y]),'#fff5e1',1);}}
  if((s.equipmentTier||1)>=3&&this.quality!=='low'&&!this.reduced){c.globalAlpha=.35;ring(c,s.x,s.y,10+(s.equipmentTier===4?4:0),color,1.2);}if(s.recipe&&this.quality!=='low'&&!this.reduced){c.globalAlpha=.4;ring(c,s.x,s.y,s.capstone?13:8,color,1.5);}c.translate(s.x,s.y);if(s.recipe==='singularity'&&this.quality!=='low'){c.beginPath();c.ellipse(0,0,13,6,Math.atan2(s.vy,s.vx)+Math.PI/4,0,Math.PI*2);c.strokeStyle=color;c.lineWidth=1.5;c.stroke();}c.rotate(Math.atan2(s.vy,s.vx));c.globalAlpha=this.reduced?.35:.7;
  if(key==='laser'){if(s.recipe==='prism'&&this.quality!=='low'&&!this.reduced){stroke(c,[[-20,-4],[10,-4]],color,1);stroke(c,[[-20,4],[10,4]],color,1);}stroke(c,[[-19,0],[14,0]],color,4);stroke(c,[[-16,0],[12,0]],'#fff4ff',1.3);}
  else if(key==='arc'){stroke(c,[[-18,0],[-12,-4],[-7,3],[-2,-3],[8,0]],color,1.8);}
  else if(key==='net'){ring(c,0,0,11,color,1);}
  else if(key==='resonance'){for(const r of [9,16]){c.beginPath();c.arc(-4,0,r,-.85,.85);c.strokeStyle=color;c.lineWidth=1.5;c.stroke();}}
  c.restore();
 }
 draw(c){c.save();c.lineCap='round';for(const q of this.items){const t=q.age/q.duration,fade=(1-t)**2;c.save();c.globalAlpha=fade*(this.reduced?.4:.85);
  if(['raidcounter','raidburst','raidfailure'].includes(q.kind)){
   const r=(q.kind==='raidburst'?32:q.kind==='raidcounter'?22:16)+t*(q.kind==='raidburst'?94:67);
   const tint=q.kind==='raidfailure'?'#ff9b82':q.kind==='raidcounter'?'#9effd9':'#ffe6aa';
   c.globalAlpha=fade*(this.reduced?.42:.90);
   ring(c,q.x,q.y,r,tint,this.quality==='low'?2:4);
   if(!this.reduced&&this.quality!=='low'){ring(c,q.x,q.y,r*.64,'#fbffff',1.6);
    for(let i=0;i<8;i++){const a=i*Math.PI/4+q.seed*.3;
     stroke(c,[[q.x+Math.cos(a)*r*.7,q.y+Math.sin(a)*r*.7],
       [q.x+Math.cos(a)*(r+18*(1-t)),q.y+Math.sin(a)*(r+18*(1-t))]],tint,2.4);}
   }c.restore();continue;
  }
  if(q.kind==='bosshit'){
   // One real contact produces three separately timed layers: white-hot core,
   // compressing contact seal, and outward structural fracture. All radii are
   // world-space; nothing is randomized or projected over HUD controls.
   const expansion=1-Math.pow(1-t,2),r=8+64*expansion;
   c.globalAlpha=fade*(this.reduced?.3:.90);
   ring(c,q.x,q.y,r,'#ffe6ba',this.quality==='low'?2:4.2*(1-t*.45));
   if(this.quality!=='low'&&!this.reduced){
    c.globalAlpha=fade*.56;ring(c,q.x,q.y,r*.74,'#f4b969',1.8);
    const halo=c.createRadialGradient(q.x,q.y,0,q.x,q.y,36*(1-t*.25));
    halo.addColorStop(0,'#fff9efbb');halo.addColorStop(.24,'#ffdea277');
    halo.addColorStop(.62,'#fa984b23');halo.addColorStop(1,'#fa984b00');
    c.fillStyle=halo;c.fillRect(q.x-40,q.y-40,80,80);
    c.globalAlpha=fade*.96;
    for(let i=0;i<11;i++){
     const angle=i*Math.PI*2/11+q.seed*.38;
     const inner=4+expansion*(15+i%3*3),outer=14+expansion*(36+i%4*9);
     stroke(c,[[q.x+Math.cos(angle)*inner,q.y+Math.sin(angle)*inner],
      [q.x+Math.cos(angle+.03)*outer,q.y+Math.sin(angle+.03)*outer]],
      i%3===0?'#e8fbff':i%2?'#ffd18c':'#fff7d9',i%3===0?1.4:2.8*(1-t*.5));
    }
    // Angular boss plating fragments, not identical circular particles.
    for(let i=0;i<5;i++){
     const angle=(i*2+1)*Math.PI/5+q.seed*.13,dist=10+expansion*(33+i%3*7);
     const x=q.x+Math.cos(angle)*dist,y=q.y+Math.sin(angle)*dist;
     c.beginPath();c.moveTo(x+Math.cos(angle)*6*(1-t),y+Math.sin(angle)*6*(1-t));
     c.lineTo(x-Math.sin(angle)*3,y+Math.cos(angle)*3);
     c.lineTo(x+Math.sin(angle)*3,y-Math.cos(angle)*3);
     c.closePath();c.fillStyle=i%2?'#ffd7a0':'#d6e5e6';c.fill();
    }
   }c.restore();continue;
  }
  if(q.kind==='evolutionfield'){const r=q.radius;c.globalAlpha=fade*.45;ring(c,q.x,q.y,r,q.color,2);if(q.recipe==='singularity'){ring(c,q.x,q.y,18+10*(1-t),q.color,4);if(!this.reduced&&this.quality!=='low')for(let i=0;i<5;i++){const a=i*Math.PI*2/5+t*3,reach=r*(1-t*.7);stroke(c,[[q.x+Math.cos(a)*reach,q.y+Math.sin(a)*reach],[q.x+Math.cos(a+.7)*reach*.5,q.y+Math.sin(a+.7)*reach*.5],[q.x,q.y]],q.color,1.3);}}else{ring(c,q.x,q.y,r*.65,q.color,1);if(!this.reduced&&this.quality!=='low')for(let i=-2;i<=2;i++){const d=i*r/3,span=Math.sqrt(r*r-d*d);stroke(c,[[q.x-span,q.y+d],[q.x+span,q.y+d]],q.color,1);}}c.restore();continue;}
  if(q.kind==='armorbreak'){const r=q.radius+4+t*18;ring(c,q.x,q.y,r,'#9fffe0',this.quality==='low'?2:3);if(!this.reduced&&this.quality!=='low'){for(let i=0;i<6;i++){const a=i*Math.PI/3+q.seed,dx=Math.cos(a),dy=Math.sin(a);stroke(c,[[q.x+dx*r-dy*4,q.y+dy*r+dx*4],[q.x+dx*(r+5),q.y+dy*(r+5)],[q.x+dx*r+dy*4,q.y+dy*r-dx*4]],'#d4efff',1.6);}}c.restore();continue;}
  if(q.kind==='evolved'){ring(c,q.x,q.y-24,18+t*22,'#b6f7e8',2);if(!this.reduced&&this.quality!=='low')ring(c,q.x,q.y-24,12+t*14,'#fff1be',1);c.restore();continue;}
  if(['electrochain','laserline'].includes(q.kind)){
   if(Number.isFinite(q.toX)&&Number.isFinite(q.toY)){const pts=[[q.x,q.y]],dx=q.toX-q.x,dy=q.toY-q.y,len=Math.hypot(dx,dy)||1;for(let i=1;i<6;i++){const off=q.kind==='electrochain'&&!this.reduced?Math.sin(i*9+q.seed)*7:0;pts.push([q.x+dx*i/6-dy/len*off,q.y+dy*i/6+dx/len*off]);}pts.push([q.toX,q.toY]);const tint=RECIPE_COLORS[q.recipe]||(q.kind==='laserline'?COLORS.laser:COLORS.arc);stroke(c,pts,tint,this.quality==='low'?2:q.capstone?5:4);if(this.quality!=='low'){stroke(c,pts,'#faffff',1);if(!this.reduced){const u=.15+.7*t,x=q.x+dx*u,y=q.y+dy*u;ring(c,x,y,q.recipe==='singularity'?7:3,tint,1.5);if(q.recipe==='prism'){for(const sign of [-1,1])stroke(c,[[q.x-dy/len*4*sign,q.y+dx/len*4*sign],[q.toX-dy/len*4*sign,q.toY+dx/len*4*sign]],tint,1);}if(q.recipe==='plasma')ring(c,q.toX,q.toY,4+t*12,tint,2);}}}c.restore();continue;
  }
  if(['assaultsurge','relaybreak'].includes(q.kind)){const r=14+t*85;ring(c,q.x,q.y,r,q.color,this.quality==='low'?2:3);if(!this.reduced&&this.quality!=='low')ring(c,q.x,q.y,r*.65,'#eafff2',1);c.restore();continue;}if(q.kind==='netfield'){const r=q.radius;c.globalAlpha=fade*.6;ring(c,q.x,q.y,r,COLORS.net,1.5);if(this.quality!=='low'&&!this.reduced){ring(c,q.x,q.y,r*(.35+.65*t),COLORS.net,1);for(let i=0;i<6;i++){const a=i*Math.PI/3;stroke(c,[[q.x,q.y],[q.x+Math.cos(a)*r,q.y+Math.sin(a)*r]],'#91ffe150',1);}}c.restore();continue;}
  if(q.kind==='weaponcontact'&&!['pulse','bankshot','resonance','arc','laser'].includes(q.family)){const r=8+t*24;if(q.family==='mist'){const count=this.quality==='low'?3:6;for(let i=0;i<count;i++){const a=i*Math.PI*2/count;ring(c,q.x+Math.cos(a)*r*.6,q.y+Math.sin(a)*r*.35,4+t*8,COLORS.mist,2);}}else{ring(c,q.x,q.y,r,q.color,1.5);if(q.family==='scan'){stroke(c,[[q.x-r,q.y],[q.x+r,q.y]],q.color,1);stroke(c,[[q.x,q.y-r],[q.x,q.y+r]],q.color,1);}if(q.family==='magnet')ring(c,q.x,q.y,r*.6,q.color,1);}c.restore();continue;}
  c.translate(q.x,q.y);
  if(q.kind==='ricochet'){c.rotate(q.angle);stroke(c,[[-6,-5],[9,0],[-6,5]],q.color,1.7);ring(c,0,0,3+t*12,q.color,1);c.restore();continue;}
  if(this.quality!=='low'&&!this.reduced){const radius=q.kind==='fire'?17:22,light=c.createRadialGradient(0,0,1,0,0,radius);light.addColorStop(0,q.kind==='capture'?'#91ffe14d':q.color+'66');light.addColorStop(1,q.color+'00');c.fillStyle=light;c.fillRect(-radius,-radius,radius*2,radius*2);}
  if(q.kind==='fire'){
   c.rotate(q.angle);const length=22+22*(1-t),spread=q.family==='mist'?14:7;
   if(['net','magnet','scan','resonance'].includes(q.family)){const count=this.quality==='low'?1:3;for(let i=0;i<count;i++){c.beginPath();c.ellipse(9+i*10+t*12,0,3+t*5,6+i*3,-Math.PI*.04,0,Math.PI*2);c.strokeStyle=q.color;c.lineWidth=2-i*.4;c.stroke();}}
   else if(q.family==='arc'){stroke(c,[[0,0],[12,-6],[21,4],[30,-4],[length,0]],q.color,2);}
   else if(q.family==='anchor'){stroke(c,[[0,0],[length*.7,0]],q.color,3);for(const sign of [-1,1])stroke(c,[[7,sign*4],[16,sign*9]],'#ffe4bd',1.5);}
   else{c.beginPath();c.moveTo(0,-2);c.lineTo(length*.4,-spread);c.lineTo(length,0);c.lineTo(length*.4,spread);c.lineTo(0,2);c.closePath();c.fillStyle=q.color;c.fill();stroke(c,[[0,0],[length*.8,0]],'#fff9ec',2);}
  }else if(q.kind==='capture'){
   const r=8+22*(1-t);for(let i=0;i<6;i++){const a=i*Math.PI/3;stroke(c,[[Math.cos(a)*r,Math.sin(a)*r],[Math.cos(a)*(r+5),Math.sin(a)*(r+5)]],COLORS.net,2);}ring(c,0,0,r,COLORS.net,1.5);
  }else{
   const color=q.kind==='armorhit'?'#94bed5':q.material==='power'?COLORS.scan:q.material==='dust'?COLORS.mist:q.material==='load'?COLORS.anchor:'#ffd597';
   const n=this.quality==='low'?4:q.material==='dust'?6:10;
   for(let i=0;i<n;i++){const a=i*Math.PI*2/n+q.seed*.7,near=3+t*9,far=near+(q.kind==='bosshit'?25:17)*(1-t);
    if(q.material==='dust'){c.globalAlpha=fade*(this.reduced?.18:.3);ring(c,Math.cos(a)*near,Math.sin(a)*near,3+t*6,color,2.5);}
    else if(q.material==='power'){stroke(c,[[Math.cos(a)*near,Math.sin(a)*near],[Math.cos(a+.22)*far*.7,Math.sin(a+.22)*far*.7],[Math.cos(a)*far,Math.sin(a)*far]],color,1.6);}
    else stroke(c,[[Math.cos(a)*near,Math.sin(a)*near],[Math.cos(a)*far,Math.sin(a)*far]],color,q.material==='load'?2.4:1.7);
   }
   ring(c,0,0,4+t*(q.kind==='bosshit'?30:18),color,1.2);if(this.quality!=='low'&&!this.reduced){stroke(c,[[-5,0],[5,0]],'#fff7d9',2);stroke(c,[[0,-5],[0,5]],'#fff7d9',2);}
  }c.restore();
 }c.restore();}
}
root.SignalBreakerCombatVfx={CombatVfx,COLORS};if(typeof module==='object'&&module.exports)module.exports=root.SignalBreakerCombatVfx;
})(typeof window!=='undefined'?window:globalThis);

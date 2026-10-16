/* Rendering only. Geometry is copied from the engine's current warning. */
(function(root){'use strict';function draw(cx,g,t,reduced=false){const r=g.raidSnapshot?.();if(!r||g.boss.phase==='resolved')return;
 if(r.state==='WARNING'){
  const x=Math.max(35,r.laneX-r.half),right=Math.min(1065,r.laneX+r.half),y=452;
  cx.save();cx.fillStyle=r.trueSignal?'#ffb24735':'#c1d3e72b';cx.strokeStyle=r.trueSignal?'#ffce87':'#d8e6ee';cx.lineWidth=3;cx.setLineDash(r.trueSignal?[]:[9,7]);cx.fillRect(x,y,right-x,82);cx.strokeRect(x,y,right-x,82);
  // Direction and hatching remain readable without color or animated flashes.
  cx.beginPath();for(let k=x+10;k<right-8;k+=30){cx.moveTo(k,y+74);cx.lineTo(Math.min(k+24,right),y+48);}cx.stroke();cx.setLineDash([]);
  cx.font='bold 16px sans-serif';cx.textAlign='center';cx.fillStyle='#fff4d6';cx.fillText((r.trueSignal?'! ':'↔ ')+t(r.trueSignal?'breaker.raid.true':'breaker.raid.fake'),(x+right)/2,y-12);
  const direction=r.trueSignal?r.direction:-r.direction,tip=direction>0?right:x,back=tip-direction*25;cx.beginPath();cx.moveTo(tip,y+16);cx.lineTo(back,y+7);cx.lineTo(back,y+25);cx.closePath();cx.fill();cx.restore();
 }else if(r.state==='SUPPORT'){cx.save();cx.strokeStyle='#b6f4f1';cx.lineWidth=3;for(const n of g.boss.nodes)if(!n.hit){cx.strokeRect(n.x-28,n.y-28,56,56);cx.beginPath();cx.moveTo(n.x-10,n.y);cx.lineTo(n.x+10,n.y);cx.moveTo(n.x,n.y-10);cx.lineTo(n.x,n.y+10);cx.stroke();}cx.restore();}
 }
 root.SignalBreakerRaidTelegraph={draw};
})(typeof globalThis!=='undefined'?globalThis:this);

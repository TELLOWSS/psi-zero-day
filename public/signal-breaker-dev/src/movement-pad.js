/* Pure analog gesture mapping in CSS pixels. Horizontal movement remains authoritative. */
(function(root){'use strict';
function sample(origin,point,radius=48,floating=true){
 if(![origin.x,origin.y,point.x,point.y,radius].every(Number.isFinite)||radius<=0)return {origin:{x:0,y:0},x:0,y:0,movement:0};
 const dx=point.x-origin.x,dy=point.y-origin.y,distance=Math.hypot(dx,dy),length=Math.min(radius,distance),nx=distance?dx/distance:0,ny=distance?dy/distance:0;
 const base=floating&&distance>radius?{x:point.x-nx*radius,y:point.y-ny*radius}:{...origin},deadzone=radius*.15;
 const power=length<=deadzone?0:(length-deadzone)/(radius-deadzone);
 return {origin:base,x:nx*length,y:ny*length,movement:nx*power};
}
root.SignalBreakerMovementPad={sample};if(typeof module==='object'&&module.exports)module.exports=root.SignalBreakerMovementPad;
})(typeof window!=='undefined'?window:globalThis);

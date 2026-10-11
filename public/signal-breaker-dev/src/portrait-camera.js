/* Portrait free-play camera. Pure viewport composition; no rules or physics mutations. */
(function(root){'use strict';
const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
function frame({width,height,worldWidth=1100,boundsTop=0,boundsHeight=1650,ground=594,playerX,aimX}){
 if(![width,height,worldWidth,boundsTop,boundsHeight,ground,playerX,aimX].every(Number.isFinite)||width<=0||height<=0||boundsHeight<=0)return null;
 // A full-height cover camera makes the player unreadably small on tall phones.
 // Crop decor, not playability: target a 30% larger gameplay scale.
 const span=Math.min(800,Math.max(600,Math.abs(aimX-playerX)+180));
 const scale=Math.max(width/span,height/boundsHeight*1.30);
 const visible=width/scale,visibleHeight=height/scale;
 const left=visible>=worldWidth?(worldWidth-visible)/2:clamp(playerX-visible*.40,0,worldWidth-visible);
 // Keep the actor near the lower-middle, above thumb controls.
 const intendedY=ground-visibleHeight*.61,maxY=boundsTop+boundsHeight-visibleHeight;
 const y=maxY>=boundsTop?clamp(intendedY,boundsTop,maxY):boundsTop+(boundsHeight-visibleHeight)/2;
 return {scale,x:left,y,visible,visibleHeight};
}
root.SignalBreakerPortraitCamera={frame};
if(typeof module==='object'&&module.exports)module.exports=root.SignalBreakerPortraitCamera;
})(typeof window!=='undefined'?window:globalThis);

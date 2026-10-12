/* SIGNAL BREAKER — portrait boss encounter framing.
 * Pure presentation calculation: never modifies physics, aim, boss or operator state. */
(function(root){'use strict';
const clamp=(x,a,b)=>Math.min(Math.max(x,a),b);
function frame({width,height,worldWidth=1100,boundsTop=0,boundsHeight=1650,ground=594,player,boss}){
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<1||height<1||!boss||!player||boss.phase==='resolved')return null;
 // Stable composition: include all three relay nodes, even those recently cleared.
 // Keeping them avoids distracting camera zoom jumps as armour/filters reopen.
 const targets=[{x:player.x,r:39},{x:boss.x,r:149},
  ...(boss.nodes||[]).map(node=>({x:node.x,r:30}))];
 let left=clamp(Math.min(...targets.map(p=>p.x-p.r)),0,worldWidth);
 let right=clamp(Math.max(...targets.map(p=>p.x+p.r)),0,worldWidth);
 if(right-left<200){left=Math.max(0,left-100);right=Math.min(worldWidth,right+100);}
 const margin=16,span=Math.max(200,right-left),fitScale=(width-2*margin)/span;
 // IMPORTANT: existing Math.max(zoomFit, verticalCover) cropped the boss out.
 // Allow letterbox/edge fill behind controls rather than hide a live weak point.
 const backgroundCover=height/boundsHeight;
 const scale=Math.max(.01,Math.min(fitScale,backgroundCover));
 const visible=width/scale,visibleHeight=height/scale;
 const minX=visible>=worldWidth?(worldWidth-visible)*.5:-margin/scale;
 const maxX=visible>=worldWidth?minX:worldWidth-visible+margin/scale;
 const x=visible>=worldWidth?minX:clamp((left+right-visible)*.5,minX,maxX);
 const wantedY=ground-.65*visibleHeight;
 const maxY=boundsTop+boundsHeight-visibleHeight;
 const y=maxY>=boundsTop?clamp(wantedY,boundsTop,maxY):boundsTop;
 return {x,y,scale,visible,visibleHeight,targets:{left,right,player:player.x,boss:boss.x},
         zoomFit:fitScale,verticalCover:backgroundCover};
}
function landscapeFrame({width,height,worldWidth=1100,player,boss}){
 if(!Number.isFinite(width)||!Number.isFinite(height)||!boss||!player||boss.phase==='resolved'||width<=height||height>600||height<140||!Number.isFinite(boss.y)||!Number.isFinite(player.y))return null;
 // Show the complete authored body, its engine relay rings and operator feet below the compact HUD.
 const top=Math.min(boss.y-120,...(boss.nodes||[]).map(n=>n.y-31)),bottom=player.y+31;
 const safeTop=50,safeBottom=24,scale=Math.min(width/worldWidth,(height-safeTop-safeBottom)/Math.max(200,bottom-top));
 if(scale<=0)return null;
 return {scale,x:(worldWidth-width/scale)/2,y:top-safeTop/scale,targets:{top,bottom},safeTop,safeBottom};
}
root.SignalBreakerBossCamera={frame,landscapeFrame};
if(typeof module==='object'&&module.exports)module.exports=root.SignalBreakerBossCamera;
})(typeof window!=='undefined'?window:globalThis);

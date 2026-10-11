/* Portrait battle framing: present player + boss silhouette in the same physical viewport.
 * Pure and read-only: no influence on aim, collision, input or saved game state. */
(function(root){'use strict';
const clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
function frame({width,height,worldWidth=1100,boundsHeight,player,boss}){
 const xs=[boss.x-143,boss.x+143,...(boss.nodes||[]).filter(n=>!n.hit).map(n=>n.x)];
 const left=Math.min(player.x-50,...xs),right=Math.max(player.x+50,...xs);
 const desiredSpan=Math.min(worldWidth,Math.max(600,right-left+16));
 const scale=Math.max(width/desiredSpan,height/boundsHeight);
 const visible=Math.min(worldWidth,width/scale);
 // Center the action when possible, then enforce that the operator stays in frame.
 const maximum=Math.max(0,worldWidth-visible);
 let x=clamp((left+right-visible)/2,0,maximum);
 const operatorMax=clamp(player.x-38,0,maximum);
 const operatorMin=clamp(player.x+32-visible,0,maximum);
 x=clamp(x,Math.min(operatorMin,operatorMax),Math.max(operatorMin,operatorMax));
 // Prefer a complete boss silhouette (143 world units) while keeping the player visible.
 const fullBossLeft=clamp(right-visible,0,maximum);
 x=Math.max(x,Math.min(operatorMax,fullBossLeft));
 return {scale,x,visible,playerInView:player.x>=x&&player.x<=x+visible,
         bossInView:boss.x>=x&&boss.x<=x+visible};
}
root.SignalBreakerBossCamera={frame};
if(typeof module==='object'&&module.exports)module.exports=root.SignalBreakerBossCamera;
})(typeof window!=='undefined'?window:globalThis);

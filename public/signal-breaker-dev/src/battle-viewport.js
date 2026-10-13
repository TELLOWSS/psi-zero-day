/* Pure battle framing after reserving real HUD/control space. */
(function(root){'use strict';
function frame({width,height,worldWidth=1100,ground=536,player,boss}){
 if(![width,height].every(Number.isFinite)||width<1||height<1||!player)return null;
 const portrait=height>width;if(portrait&&!boss)return null;
 const targets=boss?[{x:player.x-39,y:player.y+31},{x:player.x+39,y:player.y+31},{x:boss.x-149,y:boss.y-120},{x:boss.x+149,y:boss.y+110},...(boss.nodes||[]).flatMap(n=>[{x:n.x-30,y:n.y-30},{x:n.x+30,y:n.y+30}])]:[{x:0,y:60},{x:worldWidth,y:ground+58}];
 const left=Math.min(...targets.map(v=>v.x)),right=Math.max(...targets.map(v=>v.x)),top=Math.min(...targets.map(v=>v.y)),bottom=Math.max(...targets.map(v=>v.y));
 const margin=16,scale=Math.max(.01,Math.min((width-margin*2)/Math.max(200,right-left),(height-margin*2)/Math.max(200,bottom-top)));
 return {scale,x:(left+right-width/scale)/2,y:(top+bottom-height/scale)/2,targets:{left,right,top,bottom},safeTop:margin,safeBottom:margin};
}
root.SignalBreakerBattleViewport={frame};if(typeof module==='object'&&module.exports)module.exports=root.SignalBreakerBattleViewport;
})(typeof window!=='undefined'?window:globalThis);

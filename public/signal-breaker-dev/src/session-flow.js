/* Pure chapter succession. No browser, storage or presentation dependency. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./engine.js'):root.SignalBreakerEngine);if(typeof module==='object'&&module.exports)module.exports=api;root.SignalBreakerSession=api;})(typeof globalThis!=='undefined'?globalThis:this,function(core){
'use strict';const {Game,CHAPTER}=core;
function next(g){if(g.operation||!g.continuous||g.state!=='won')return null;const i=CHAPTER.findIndex(c=>c.id===g.config.id);if(i<0)return null;const wrap=i===CHAPTER.length-1,id=CHAPTER[(i+1)%CHAPTER.length].id;const n=new Game(id,(g.seed+7919)%2147483647,{extended:true,premiumRun:true,burst:true,continuous:true,storyCycle:Math.min(999,g.storyCycle+(wrap?1:0)),causal:id==='CH-01'});if(!wrap){n.runPoints=g.runPoints;n.pickupCount=g.pickupCount;n.burstVolley=g.burstVolley;n.signalWatch=g.signalWatch;n.pickups=g.pickups.map(p=>({...p,id:++n.id}));}n.player.x=g.player.x;n.player.life=Math.min(5,g.player.life+1);return n;}
return {next};
});

/* Only engine actions/collisions can satisfy a counter. No DOM or auto-aim policy. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.SignalBreakerRaidCounter=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
 function live(g){const r=g.boss?.raid;return !!r&&g.state==='playing'&&r.state==='WARNING'&&g.time>=r.trueAt&&g.time<=r.deadline;}
 function resolve(g,action){if(!live(g))return false;const r=g.boss.raid;if(r.requireEvade&&!r.evaded)return false;
  return r.counter==='bank'?action.kind==='bank'&&action.bounces>0&&r.evaded:
   r.counter==='belt'?action.kind==='belt'&&action.direction!==r.initialBelt:
   r.counter==='mist'?action.kind==='mist'&&action.intake===true:
   r.counter==='anchor'?action.kind==='anchor'&&action.lock===true:
   r.counter==='scan'?action.kind==='scan'&&action.circuit===true:false;
 }
 return {live,resolve};
});

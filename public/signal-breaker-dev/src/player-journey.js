/* Pure summaries of earned progress. No new rewards, difficulty or commerce rules. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SignalBreakerJourney=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const stages=['CH-01','CH-02','CH-03','CH-04','CH-05'];
 function progress(records={}){
  const routes=[false,true].flatMap(veteran=>stages.map(id=>({id,veteran,key:(veteran?'V-':'')+id})));
  const complete=route=>records?.[route.key]?.won===true;
  const first=routes.find(route=>!complete(route));
  return {completed:routes.filter(complete).length,total:10,next:first||null,
   episodeOne:routes.slice(0,5).filter(complete).length,episodeTwo:routes.slice(5).filter(complete).length};
 }
 function mastery(game,previous={}){
  const current={chain:game.bestChain>=3,reflect:game.reflectedHits>=3,gear:(game.usedWeapons?.size||0)>=2};
  return Object.fromEntries(Object.entries(current).map(([id,earned])=>[id,earned||previous[id]===true]));
 }
 function recovery(game){
  if(game.source&&!game.source.verified)return 'breaker.journey.recovery.source';
  if(game.veteran&&!game.evolution?.recipe)return 'breaker.journey.recovery.evolution';
  if(game.boss?.phase==='sealed')return 'breaker.journey.recovery.nodes';
  return 'breaker.journey.recovery.'+({'CH-01':'move','CH-02':'belt','CH-03':'mist','CH-04':'anchor','CH-05':'scan'}[game.config.id]||'move');
 }
 return {progress,mastery,recovery};
});

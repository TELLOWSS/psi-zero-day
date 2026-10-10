/* Pure source control rules. All time is simulation time, never wall-clock time. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.SignalBreakerCausal=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERIFY_SECONDS=2,RECURRENCE_SECONDS=6,MAX_ECHOES=2;
function createSource(){return {id:'delivery-stack',x:650,y:115,response:'isolate',observed:false,controlled:false,stableFor:0,verified:false,nextEmission:8,emissions:0};}
function observe(source){return !source||source.observed?source:{...source,observed:true};}
function control(source,response){return !source||!source.observed||source.controlled||response!==source.response?source:{...source,controlled:true,stableFor:0};}
function advance(source,dt,remaining,echoes){
 if(!Number.isFinite(dt)||dt<0||dt>.25)throw Error('Invalid source simulation step');
 if(!source||source.verified||dt===0)return {source,emit:false};
 const stableFor=source.controlled&&remaining===0?source.stableFor+dt:0;
 const nextEmission=Math.max(0,source.nextEmission-dt);
 const emit=!source.controlled&&nextEmission<=1e-8&&echoes<MAX_ECHOES;
 return {source:{...source,stableFor,verified:stableFor+1e-8>=VERIFY_SECONDS,nextEmission:emit?RECURRENCE_SECONDS:nextEmission,emissions:source.emissions+(emit?1:0)},emit};
}
return {createSource,observe,control,advance,VERIFY_SECONDS,MAX_ECHOES};
});

/* Pure source control rules. All time is simulation time, never wall-clock time. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.SignalBreakerCausal=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const CONTROL_SECONDS=3,VERIFY_SECONDS=2,RECURRENCE_SECONDS=6,MAX_ECHOES=2;
function createSource(){return {id:'delivery-stack',x:650,y:180,response:'isolate',observed:false,requested:false,controlRemaining:0,controlled:false,stableFor:0,verified:false,nextEmission:8,emissions:0};}
function observe(source){return !source||source.observed?source:{...source,observed:true};}
function control(source,response){return !source||!source.observed||source.requested||source.controlled||response!==source.response?source:{...source,requested:true,controlRemaining:CONTROL_SECONDS,stableFor:0};}
function advance(source,dt,remaining,echoes){
 if(!Number.isFinite(dt)||dt<0||dt>.25)throw Error('Invalid source simulation step');
 if(!source||source.verified||dt===0)return {source,emit:false};
 const pending=source.requested&&!source.controlled;
 const controlRemaining=pending?Math.max(0,source.controlRemaining-dt):source.controlRemaining;
 const controlled=source.controlled||(pending&&controlRemaining<=1e-8);
 // Only time after execution finishes counts toward recurrence verification.
 const verificationDt=source.controlled?dt:controlled?Math.max(0,dt-source.controlRemaining):0;
 const stableFor=controlled&&remaining===0?source.stableFor+verificationDt:0;
 const nextEmission=Math.max(0,source.nextEmission-dt);
 const emit=!controlled&&nextEmission<=1e-8&&echoes<MAX_ECHOES;
 return {source:{...source,controlled,controlRemaining,stableFor,verified:stableFor+1e-8>=VERIFY_SECONDS,nextEmission:emit?RECURRENCE_SECONDS:nextEmission,emissions:source.emissions+(emit?1:0)},emit};
}
return {createSource,observe,control,advance,CONTROL_SECONDS,VERIFY_SECONDS,MAX_ECHOES};
});

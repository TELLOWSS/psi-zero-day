/* Injected storage adapter; never accesses campaign storage keys. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./rest-engine.js'):root.SignalBreakerRest);if(typeof module==='object'&&module.exports)module.exports=api;root.SignalBreakerRestSession=api;})(typeof globalThis!=='undefined'?globalThis:this,function(R){'use strict';
const KEY='psi.signal-breaker.rest.v1';
const defaults=()=>({actor:'player',build:'storm',rhythm:'calm',autoFire:true,autoAim:true,pad:'free',padSize:118,reduced:false,quality:'balanced',music:.35,ambient:.3,effects:.45,idle:90,reminder:0,showStats:true});
function preferences(v={}){const p=defaults();for(const k of ['autoFire','autoAim','reduced','showStats'])if(typeof v[k]==='boolean')p[k]=v[k];for(const [k,allowed] of Object.entries({actor:R.ACTORS,build:Object.keys(R.BUILDS),rhythm:Object.keys(R.PROFILES),pad:['free','fixed'],quality:['low','balanced','high'],idle:[0,90],reminder:[0,5,10,15]}))if(allowed.includes(v[k]))p[k]=v[k];for(const k of ['music','ambient','effects'])if(Number.isFinite(v[k])&&v[k]>=0&&v[k]<=1)p[k]=v[k];if([104,118,136].includes(v.padSize))p.padSize=v.padSize;return p;}
function counts(v){return v&&Number.isSafeInteger(v.resolved)&&v.resolved>=0&&v.resolved<=1e9&&Number.isSafeInteger(v.returned)&&v.returned>=0&&v.returned<=1e9&&Number.isFinite(v.seconds)&&v.seconds>=0&&v.seconds<=2e8?{resolved:v.resolved,returned:v.returned,seconds:v.seconds}:null;}
function checkpoint(v){if(!v||!Number.isSafeInteger(v.seed)||v.seed<0||v.seed>2147483647||!Number.isSafeInteger(v.cycle)||v.cycle<0||v.cycle>1000000||!counts(v.counts))return null;return {seed:v.seed,cycle:v.cycle,counts:counts(v.counts)};}
class RestStore{
 constructor(storage){this.storage=storage;this.failed=false;this.corrupt=false;this.existed=false;this.value={version:1,prefs:defaults(),checkpoint:null,summary:null};try{const raw=storage.getItem(KEY);if(raw){const v=JSON.parse(raw);if(v?.version!==1)throw Error('version');this.existed=true;this.value={version:1,prefs:preferences(v.prefs),checkpoint:checkpoint(v.checkpoint),summary:counts(v.summary)};this.corrupt=!!v.checkpoint&&!this.value.checkpoint;}}catch{this.corrupt=true;}}
 save(prefs,cp,summary=null){const next={version:1,prefs:preferences(prefs),checkpoint:checkpoint(cp),summary:counts(summary)};this.value=next;try{this.storage.setItem(KEY,JSON.stringify(next));this.failed=false;return true;}catch{this.failed=true;return false;}}
}
return {KEY,defaults,preferences,counts,checkpoint,RestStore};
});

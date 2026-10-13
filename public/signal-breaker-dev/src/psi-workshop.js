/* Pure, fixed-price PSI credit inventory. No payment provider or browser dependency. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.SignalBreakerWorkshop=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const CATALOG=Object.freeze([
 {id:'hud-field',category:'hud',price:0,value:'field',image:'art/psi-hud-field-v1.webp'},
 {id:'hud-brass',category:'hud',price:180,value:'brass',image:'art/psi-hud-brass-v1.webp'},
 {id:'hud-grid',category:'hud',price:240,value:'grid',image:'art/psi-hud-grid-v1.webp'},
 {id:'reticle-signal',category:'reticle',price:0,value:'signal',image:'art/psi-nav-ring-v1.webp'},
 {id:'reticle-beacon',category:'reticle',price:80,value:'beacon',image:'art/psi-shield-chip-v1.webp'},
 {id:'reticle-prism',category:'reticle',price:120,value:'prism',image:'art/psi-fire-ring-v1.webp'},
 {id:'beam-standard',category:'beam',price:0,value:'standard',image:'art/psi-nav-ring-v1.webp'},
 {id:'beam-amber',category:'beam',price:100,value:'amber',color:'#ffd497',image:'art/psi-fire-ring-v1.webp'},
 {id:'beam-ion',category:'beam',price:140,value:'ion',color:'#c2baff',image:'art/psi-hud-grid-v1.webp'},
 {id:'module-none',category:'module',price:0,value:'none',image:'art/psi-shield-chip-v1.webp'},
 {id:'module-relay',category:'module',price:180,value:'relay',image:'art/psi-hud-brass-v1.webp',episode2:true},
 {id:'module-catalyst',category:'module',price:300,value:'catalyst',image:'art/psi-shield-chip-v1.webp',episode2:true},
 {id:'module-survey',category:'module',price:220,value:'survey',image:'art/psi-hud-grid-v1.webp',episode2:true}
]);
const find=id=>CATALOG.find(x=>x.id===id)||null;
function normalize(raw){const owned=[...new Set([...CATALOG.filter(x=>x.price===0).map(x=>x.id),...(Array.isArray(raw?.owned)?raw.owned:[])])].filter(id=>find(id));const selected={};for(const category of ['hud','reticle','beam','module']){const candidate=find(raw?.selected?.[category]);selected[category]=candidate?.category===category&&owned.includes(candidate.id)?candidate.id:CATALOG.find(x=>x.category===category&&x.price===0).id;}return {version:1,owned,selected};}
function purchase(state,credits,id,episode2=false){const item=find(id),s=normalize(state);if(!Number.isSafeInteger(credits)||credits<0)return {ok:false,error:'balance'};if(!item)return {ok:false,error:'unknown'};if(item.episode2&&!episode2)return {ok:false,error:'locked'};if(s.owned.includes(id))return {ok:false,error:'owned'};if(credits<item.price)return {ok:false,error:'funds'};return {ok:true,credits:credits-item.price,state:{...s,owned:[...s.owned,id],selected:{...s.selected,[item.category]:id}}};}
function equip(state,id,episode2=false){const s=normalize(state),item=find(id);if(!item||!s.owned.includes(id)||item.episode2&&!episode2)return null;return {...s,selected:{...s.selected,[item.category]:id}};}
const selected=(s,category)=>find(normalize(s).selected[category]);
return {CATALOG,find,normalize,purchase,equip,selected};});

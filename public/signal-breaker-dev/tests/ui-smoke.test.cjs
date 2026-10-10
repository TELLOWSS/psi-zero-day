const assert=require('node:assert/strict');const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const dir=path.resolve(__dirname,'..');const html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
const src=fs.readFileSync(path.join(dir,'src/app.js'),'utf8');
const ids=new Set([...html.matchAll(/id="([^"]+)"/g)].map(x=>x[1]));
const refs=[...src.matchAll(/\$\('([^']+)'\)/g)].map(x=>x[1]);for(const r of refs)assert.ok(ids.has(r),`missing HTML ID ${r}`);
let queue=[], windowListeners={},documentListeners={},storage=new Map(),currentNow=0;
class Element {
 constructor(tag='div'){this.tag=tag;this.children=[];this.style={};this.listeners={};this.textContent='';this._html='';Object.defineProperty(this,'innerHTML',{get(){return this._html},set(v){this._html=v;this.children=[]}});this.classList={state:new Set(),contains:x=>this.classList.state.has(x),add:x=>this.classList.state.add(x),remove:x=>this.classList.state.delete(x),toggle:(x,on)=>{if(on===undefined)on=!this.classList.state.has(x);if(on)this.classList.state.add(x);else this.classList.state.delete(x);return on;}};}
 addEventListener(n,fn){(this.listeners[n]??=[]).push(fn)}
 append(...es){this.children.push(...es)}appendChild(el){this.children.push(el)}replaceChildren(...es){this.children=es}
 getBoundingClientRect(){return {left:0,top:0,width:1100,height:620}}getContext(){return proxyContext}
 setAttribute(name,value){this[name]=value;}
 setPointerCapture(){}trigger(n,e={}){for(const cb of this.listeners[n]||[])cb(e)}
}
const proxyContext=new Proxy({createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}})}, {get:(obj,key)=>key in obj?obj[key]:()=>{},set:(obj,key,v)=>(obj[key]=v,true)});
const elements={};const document={hidden:false,body:new Element('body'),getElementById(id){return elements[id]??(elements[id]=new Element(id==='arena'?'canvas':'div'));},createElement:t=>new Element(t),addEventListener(n,fn){(documentListeners[n]??=[]).push(fn)}};
for(const id of ids)document.getElementById(id);
global.document=document;global.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};global.performance={now:()=>currentNow};global.requestAnimationFrame=fn=>queue.push(fn);
global.window={SignalBreakerActors:{characters:[{id:'player',textId:'breaker.actor.player'},{id:'kang_taesik',textId:'breaker.actor.kang'}],createActor:()=>({draw:()=>false,status:()=>({ready:false}),fire(){}})},SignalBreakerEngine:require('../src/engine.js'),addEventListener(n,fn){(windowListeners[n]??=[]).push(fn)},AudioContext:undefined};
vm.runInThisContext(fs.readFileSync(path.join(dir,'src/premium-art.js'),'utf8'),{filename:'src/premium-art.js'});
vm.runInThisContext(fs.readFileSync(path.join(dir,'src/premium-sound.js'),'utf8'),{filename:'src/premium-sound.js'});
vm.runInThisContext(fs.readFileSync(path.join(dir,'src/localization-ko.js'),'utf8'),{filename:'src/localization-ko.js'});
vm.runInThisContext(src,{filename:'src/app.js'});
// Visual settings and focus screen must be operable without rerunning the game.
elements.qualityBtn.trigger('click');assert.equal(elements.qualityBtn.textContent,'GRAPHICS · BALANCED');
elements.qualityBtn.trigger('click');assert.equal(elements.qualityBtn.textContent,'GRAPHICS · LOW');
elements.motionBtn.trigger('click');assert.equal(elements.motionBtn.textContent,'MOTION · LOW');
elements.focusBtn.trigger('click');assert.equal(document.body.classList.state.has('breaker-focus'),true);
elements.focusBtn.trigger('click');assert.equal(document.body.classList.state.has('breaker-focus'),false);
assert.ok(window.SignalBreakerQA,'QA bridge exists');assert.equal(window.SignalBreakerQA.snapshot().state,'ready');assert.equal(elements.stageList.children.length,4);
assert.ok(elements.overlayInner.children.length===5,'ready overlay has actor selector and action');const startButton=elements.overlayInner.children.at(-1);startButton.trigger('click');assert.equal(window.SignalBreakerQA.snapshot().state,'playing');
const touch=(pointerId,clientX=500,clientY=200)=>({pointerId,clientX,clientY,pointerType:'touch',preventDefault(){}});
const shotCount=window.SignalBreakerQA.snapshot().shotsFired;
elements.arena.trigger('pointerdown',touch(10));
assert.equal(window.SignalBreakerQA.snapshot().shotsFired,shotCount,'drag start does not fire');
elements.arena.trigger('pointerdown',touch(11,900,350));
assert.equal(window.SignalBreakerQA.engine().player.aimX,500,'second touch cannot steal aim');
elements.arena.trigger('pointercancel',touch(10));elements.arena.trigger('pointerup',touch(10));
assert.equal(window.SignalBreakerQA.snapshot().shotsFired,shotCount,'cancel cannot fire');
elements.arena.trigger('pointerdown',touch(12));elements.arena.trigger('pointermove',touch(12,550,210));elements.arena.trigger('pointerup',touch(12));
assert.equal(window.SignalBreakerQA.snapshot().shotsFired,shotCount+1,'release fires exactly once');
for(let i=0;i<120;i++){const callback=queue.shift();assert.ok(callback,'requestAnimationFrame was scheduled');currentNow+=1000/60;callback(currentNow);}
assert.ok(window.SignalBreakerQA.engine().time>1.5);assert.equal(elements.score.textContent.length,6);
const event=(code)=>({code,repeat:false,preventDefault(){}});for(const f of windowListeners.keydown||[])f(event('Digit2'));assert.equal(window.SignalBreakerQA.snapshot().weapon,'net');
for(const f of windowListeners.keydown||[])f(event('KeyQ'));assert.equal(window.SignalBreakerQA.engine().shieldAngle,1);
for(const f of windowListeners.keydown||[])f(event('KeyP'));assert.equal(window.SignalBreakerQA.snapshot().state,'paused');assert.ok(elements.overlayInner.children.length===5);
const picker=elements.overlayInner.children[3].children[0];picker.value='kang_taesik';picker.trigger('change');
assert.equal(JSON.parse(storage.get('psi.signal-breaker.offline.v1')).characterId,'kang_taesik');
const shotsBeforeSelect=window.SignalBreakerQA.snapshot().shotsFired;for(const f of windowListeners.keydown||[])f({...event('Space'),target:{matches:()=>true}});assert.equal(window.SignalBreakerQA.snapshot().shotsFired,shotsBeforeSelect);assert.equal(window.SignalBreakerQA.snapshot().state,'paused');
const before=window.SignalBreakerQA.engine().time;for(let i=0;i<60;i++){currentNow+=1000/60;queue.shift()(currentNow);}assert.equal(window.SignalBreakerQA.engine().time,before);
window.SignalBreakerQA.selectStage('SB-04');assert.equal(window.SignalBreakerQA.snapshot().stage,'SB-04');assert.equal(window.SignalBreakerQA.snapshot().state,'ready');
// Completion path must persist independent local progress exactly once.
window.SignalBreakerQA.selectStage('SB-01');window.SignalBreakerQA.engine().start();window.SignalBreakerQA.engine().finish(true);currentNow+=1000/60;queue.shift()(currentNow);
assert.equal(window.SignalBreakerQA.records()['SB-01'].won,true);
assert.equal(JSON.parse(storage.get('psi.signal-breaker.offline.v1')).records['SB-01'].won,true);
console.log('PASS offline best-score persistence after victory');
console.log('PASS HTML ID contracts and render-path smoke');console.log('PASS ready→play→weapon→shield→pause→new stage');console.log('PASS 180 mock canvas frames without JS error');

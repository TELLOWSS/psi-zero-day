import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {runInNewContext} from 'node:vm';

const src=readFileSync(fileURLToPath(new URL('../tools/omega-rig-annotation-lab.html',import.meta.url)),'utf8');
const inline=src.match(/<script>([\s\S]*?)<\/script>/)?.[1];
function launchMock(){
 if(!inline)throw Error('Offline OMEGA annotation JS missing');
 const ids=['view','headline','imageStatus','hint','frame','frameText','direction','reviewState','annotatedCount','skeleton','onion','joint','back','play','forward','proposeIK','reset','atlasFile','export','import','message'];
 const el=Object.fromEntries(ids.map(id=>[id,{
  id,value:id==='direction'?'0':id==='frame'?'0':id==='joint'?'head':'',
  checked:id==='skeleton',textContent:'',files:[] as unknown[],
  handlers:{} as Record<string,(arg?:unknown)=>void>,
  addEventListener(type:string,fn:(arg?:unknown)=>void){this.handlers[type]=fn},
  setPointerCapture(){},getBoundingClientRect(){return {left:0,top:0,width:560,height:700}},
 }])) as Record<string,any>;
 const ctx=Object.fromEntries(['clearRect','fillRect','strokeRect','save','restore','drawImage','beginPath','moveTo','lineTo','stroke','arc','fill','fillText'].map(k=>[k,()=>{}]));
 el.view.getContext=()=>ctx;el.view.width=560;el.view.height=700;
 let raf:((time:number)=>void)|null=null,downloaded=false;
 const document={
  getElementById:(id:string)=>el[id]??null,
  createElement:()=>({click(){downloaded=true},remove(){}}),
  body:{append(){}},
 };
 class MockImage{
  naturalWidth=1536;naturalHeight=1536;
  set src(_value:string){this.onload?.();}
  onload:(()=>void)|null=null;
  onerror:(()=>void)|null=null;
 }
 const globals={
  document,Image:MockImage,performance:{now:()=>0},
  requestAnimationFrame:(fn:(time:number)=>void)=>{raf=fn},
  URL:{createObjectURL:()=>'blob:test',revokeObjectURL(){}},
  Blob:class MockBlob{constructor(_data:unknown,_options:unknown){}},
  setTimeout(){},console,
 };
 runInNewContext(inline,globals,{timeout:2000});
 return {el,tick:(time:number)=>{if(raf)(raf as (t:number)=>void)(time)},wasDownloaded:()=>downloaded};
}

describe('OMEGA rig anchor lab: artist QA only, not a playable character',()=>{
 it('loads without network APIs and never displays a released player skin',()=>{
  expect(src).toContain('NOT PLAYABLE');
  expect(src).toContain('OMEGA_RIG_REVIEW_V1');
  expect(src).toContain('48프레임 기준점 JSON 저장');
  expect(src).not.toMatch(/<script\s+[^>]*src=/);
  expect(src).not.toMatch(/\b(fetch|XMLHttpRequest|WebSocket)\s*\(/);
  const {el}=launchMock();
  expect(el.imageStatus.textContent).toBe('1536×1536 아틀라스 연결');
  expect(el.headline.textContent).toMatch(/E · 1\/6/);
 });
 it('supports direction/frame control, frame-specific IK proposal, reset and export',()=>{
  const lab=launchMock(),el=lab.el;
  el.direction.value='4';el.direction.onchange({target:el.direction});
  expect(el.headline.textContent).toMatch(/W · 1\/6/);
  el.frame.value='3';el.frame.oninput({target:el.frame});
  expect(el.headline.textContent).toMatch(/W · 4\/6/);
  el.proposeIK.onclick();
  expect(el.reviewState.textContent).toBe('사용자 수정');
  expect(el.annotatedCount.textContent).toBe('1 / 48');
  el.reset.onclick();
  expect(el.annotatedCount.textContent).toBe('0 / 48');
  el.play.onclick();
  lab.tick(100);
  expect(el.headline.textContent).toMatch(/W · 5\/6/);
  el.export.onclick();
  expect(lab.wasDownloaded()).toBe(true);
 });
});

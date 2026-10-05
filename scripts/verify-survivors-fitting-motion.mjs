import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const out=path.resolve('artifacts/fitting-motion');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN}),results=[];
try{
 for(const [width,height] of [[1440,900],[390,844],[844,390],[667,375],[568,320]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:5196');await page.getByRole('button',{name:/야간 긴급 순찰/}).click();
  await page.getByRole('button',{name:'PSI로 장비 구매·수리',exact:true}).click();
  await page.getByRole('tab',{name:'착용 미리보기',exact:true}).click();
  for(const [slot,id] of [['계도 전달','broadcast_crown'],['대응 방식','sync_gauntlet'],['보급·출동','extraction_pack'],['생존 지원','shock_mantle'],['동행 지원','inspection_wing'],['현장 전술','barrier_forge']])await page.getByLabel(slot,{exact:true}).selectOption(id);
  await page.waitForFunction(()=>!document.querySelector('.survivors-fitting-art figcaption'));
  const storage=await page.evaluate(()=>JSON.stringify({...localStorage}));
  const pixels=()=>page.evaluate(()=>{const c=document.querySelector('.survivors-fitting-art canvas'),data=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let hash=2166136261,nonblank=0;for(let i=0;i<data.length;i++){hash=Math.imul(hash^data[i],16777619);if(i%4===3&&data[i])nonblank++;}return {hash:hash>>>0,nonblank};});
  await page.getByRole('combobox',{name:'미리보기 동작',exact:true}).selectOption('walk');await page.waitForTimeout(100);const early=await pixels();await page.waitForTimeout(340);const moving=await pixels();
  await page.getByRole('button',{name:'미리보기 일시정지',exact:true}).click();const stopped=await pixels();await page.waitForTimeout(220);const still=await pixels();
  await page.getByRole('button',{name:'왼쪽',exact:true}).click();const mirrored=await pixels();
  await page.getByRole('combobox',{name:'미리보기 동작',exact:true}).selectOption('shot');await page.getByRole('button',{name:'미리보기 재생',exact:true}).click();await page.waitForTimeout(180);const action=await pixels();
  const attackSelect=page.getByRole('combobox',{name:'미리보기 동작',exact:true});
  for(const kind of ['shot','spray','ultimate']){await attackSelect.selectOption(kind);if(await attackSelect.inputValue()!==kind)throw new Error('Attack selection failed');}
  await page.waitForTimeout(180);
  await page.screenshot({path:path.join(out,`${width}x${height}-action.png`)});
  if(width>height&&height<=560){
   const fits=await page.evaluate(()=>{
    const canvas=document.querySelector('.survivors-fitting-art canvas').getBoundingClientRect(),tabs=document.querySelector('.survivors-store-tabs').getBoundingClientRect();
    return canvas.top>=tabs.bottom&&[...document.querySelectorAll('.survivors-fitting-controls button, .survivors-fitting-attack-select')].every(button=>button.getBoundingClientRect().bottom<=innerHeight-16);
   });if(!fits)throw new Error('Landscape fitting canvas or controls are clipped');
  }
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(100);const reduced=await pixels();await page.waitForTimeout(240);const quiet=await pixels();
  await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForTimeout(100);
  await page.getByRole('tab',{name:'장비 목록',exact:true}).click();const hidden=await pixels();await page.waitForTimeout(240);const inactive=await pixels();
  const unchanged=await page.evaluate(()=>JSON.stringify({...localStorage}))===storage;
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  const pass=early.nonblank>0&&early.hash!==moving.hash&&stopped.hash===still.hash&&mirrored.hash!==still.hash&&action.nonblank>0&&reduced.hash===quiet.hash&&hidden.hash===inactive.hash&&unchanged&&!overflow&&!errors.length;
  results.push({width,height,early,moving,stopped,still,mirrored,action,reduced,quiet,hidden,inactive,unchanged,overflow,errors,pass});await page.close();
 }
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results));if(results.some(r=>!r.pass))process.exitCode=1;
}finally{await browser.close();}

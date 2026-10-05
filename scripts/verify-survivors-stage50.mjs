import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const out=path.resolve('artifacts/stage50');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
const results=[];
try {
  for(const [width,height,number] of [[1440,900,21],[390,844,31],[844,390,50]]){
    const page=await browser.newPage({viewport:{width,height},hasTouch:true}),errors=[];
    page.on('pageerror',error=>errors.push(String(error)));
    await page.goto(process.env.PSI_PREVIEW_URL||'http://127.0.0.1:5196');
    await page.evaluate(()=>{
      localStorage.setItem('psi.survivors.unlocked_stages',JSON.stringify(Array.from({length:50},(_,i)=>`stage_${String(i+1).padStart(2,'0')}`)));
      localStorage.setItem('psi.survivors.growth_v1',JSON.stringify(Array.from({length:12},(_,i)=>({characterId:'player',stageId:`stage_${String(i+1).padStart(2,'0')}`,stars:[true,i%2===0,false]}))));
    });
    await page.reload();
    await page.getByRole('button',{name:/야간 긴급 순찰/}).click();
    await page.getByRole('button',{name:'작전 구역',exact:true}).click();
    await page.getByRole('tab').nth(Math.floor((number-1)/10)).click();
    await page.locator('.survivors-stage-card').filter({hasText:`STAGE ${number}`}).click();
    await page.waitForFunction(()=>{const image=document.querySelector('.survivors-stage-preview');return image?.complete&&image.naturalWidth>0;});
    const selection=await page.evaluate(()=>{
      const selected=document.querySelector('.survivors-chapter-tabs [aria-selected="true"]'),r=selected.getBoundingClientRect(),parent=selected.parentElement.getBoundingClientRect();
      return {cards:document.querySelectorAll('.survivors-stage-card').length,chapters:document.querySelectorAll('.survivors-chapter-tabs button').length,tabVisible:r.left>=parent.left-1&&r.right<=parent.right+1,overflow:document.documentElement.scrollWidth>innerWidth};
    });
    await page.screenshot({path:path.join(out,`${width}x${height}-selector.png`)});
    await page.getByRole('button',{name:'작전 준비',exact:true}).click();
    const memory=await page.locator('.survivors-growth-record').innerText();
    await page.evaluate(async()=>{
      const {SurvivorsEngine}=await import('/src/engine/patrol-survivors-engine.ts');
      const update=SurvivorsEngine.prototype.update;
      SurvivorsEngine.prototype.update=function(dt,input){
        window.psiStageQaEngine=this;const result=update.call(this,dt,input);
        if(window.psiStageQaForceVictory&&this.state.phase==='playing'){
          window.psiStageQaForceVictory=false;this.state.starsEarned=[true,true,true];this.state.phase='victory';
        }
        return result;
      };
    });
    await page.getByRole('button',{name:'순찰 시작하기',exact:true}).click();
    await page.waitForFunction(()=>window.psiStageQaEngine?.state.gameTime>.4);
    const gameplay=await page.evaluate(()=>{
      const canvas=document.querySelector('canvas'),data=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
      return {stage:window.psiStageQaEngine.state.stageId,nonblank:data.some((value,index)=>index%4!==3&&value>30),badge:document.querySelector('.survivors-campaign-position').textContent};
    });
    await page.screenshot({path:path.join(out,`${width}x${height}-gameplay.png`)});
    // Explicit fixture outcome tests persistence, not natural combat success.
    await page.evaluate(()=>{window.psiStageQaForceVictory=true;});
    await page.waitForFunction(()=>JSON.parse(localStorage.getItem('psi.survivors.growth_v1')||'[]').length===13);
    const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('psi.survivors.growth_v1')).at(-1));
    await page.locator('.survivors-growth-record').scrollIntoViewIfNeeded();
    await page.screenshot({path:path.join(out,`${width}x${height}-growth.png`)});
    await page.reload();await page.getByRole('button',{name:/야간 긴급 순찰/}).click();
    const restored=await page.locator('.survivors-growth-record').innerText();
    const pass=selection.cards===10&&selection.chapters===5&&selection.tabVisible&&!selection.overflow&&memory.includes('12/50')&&restored.includes('13/50')&&gameplay.nonblank&&gameplay.stage===`stage_${number}`&&saved.stageId===`stage_${number}`&&!errors.length;
    results.push({viewport:{width,height},selection,gameplay,saved,pass,errors});
    await page.close();
  }
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({scope:'SEEDED_UNLOCKS_AND_CLEAR_OUTCOMES_NOT_NATURAL_PROGRESSION',results},null,2));
  console.log(JSON.stringify(results));
  if(results.some(r=>!r.pass))process.exitCode=1;
}finally{await browser.close();}

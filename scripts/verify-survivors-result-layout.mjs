import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const out=path.resolve('artifacts/result-layout');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
const results=[];
try {
 for(const [width,height] of [[1440,900],[390,844],[844,390],[667,375],[568,320]]) {
  for(const phase of ['victory','defeat']) {
   const page=await browser.newPage({viewport:{width,height}}),errors=[];
   page.on('pageerror',e=>errors.push(String(e)));
   await page.goto('http://127.0.0.1:5196');
   await page.getByRole('button',{name:/야간 긴급 순찰/}).click();
   await page.evaluate(async phase=>{
    const {SurvivorsEngine}=await import('/src/engine/patrol-survivors-engine.ts');
    SurvivorsEngine.prototype.update=function(){this.state.psiCredits=321;this.state.phase=phase;};
   },phase);
   await page.getByRole('button',{name:'순찰 시작하기',exact:true}).click();
   const dialog=page.locator('.survivors-result-dialog');await dialog.waitFor();
   await page.waitForFunction(()=>document.activeElement?.closest('.survivors-result-actions'));
   await page.getByText('+321 PSI',{exact:true}).waitFor();
   await page.waitForTimeout(500);
   const bounds=await page.evaluate(()=>{
    const body=document.querySelector('.survivors-result-body'),buttons=[...document.querySelectorAll('.survivors-result-actions button')];
    const before=buttons.map(b=>b.getBoundingClientRect().toJSON());body.scrollTop=body.scrollHeight;
    return {before,after:buttons.map(b=>b.getBoundingClientRect().toJSON()),scrollable:body.scrollHeight>body.clientHeight,overflow:document.documentElement.scrollWidth>innerWidth};
   });
   const pass=!bounds.overflow&&!errors.length&&bounds.before.every((r,i)=>r.x>=0&&r.y>=0&&r.right<=width&&r.bottom<=height&&r.height>=44&&r.y===bounds.after[i].y);
   await page.screenshot({path:path.join(out,`${width}x${height}-${phase}.png`)});
   await page.getByRole('button',{name:'같은 작전 다시 준비',exact:true}).click();
   await page.getByRole('button',{name:'순찰 시작하기',exact:true}).waitFor();
   await page.waitForTimeout(100);
   if(await page.locator('.survivors-result-dialog').count())throw new Error('Retry automatically restarted');
   results.push({width,height,phase,...bounds,errors,pass});await page.close();
  }
 }
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({scope:'CONTROLLED_TERMINAL_STATE_LAYOUT',results},null,2));
 console.log(JSON.stringify(results));if(results.some(r=>!r.pass))process.exitCode=1;
}finally{await browser.close();}

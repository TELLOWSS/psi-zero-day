import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const output='artifacts/handoff-result';fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN}),rows=[];
try{
 for(const [width,height] of [[1440,900],[390,844],[844,390]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.addInitScript(()=>localStorage.setItem('psi.survivors.stage_stars',JSON.stringify(Object.fromEntries(Array.from({length:11},(_,i)=>['stage_'+String(i+1).padStart(2,'0'),[true,true,true]])))));
  await page.route('**/assets/*.js',async route=>{const response=await route.fetch(),body=await response.text(),marker=/update\([^)]*\)\{(?=if\(this\.state\.phase!==)/g;await route.fulfill({response,body:body.replace(marker,m=>`${m}window.resultEngine=this;if(window.completeFixture){window.completeFixture=false;this.state.terrainRecord.rubbleCleared=1;this.state.phase='victory';this.state.starsEarned=[true,false,false];}`)});});
  await page.goto(process.env.PSI_PREVIEW_URL);await page.getByRole('button',{name:/시그널 워치.*SURVIVORS/}).click();
  await page.locator('.survivors-preflight-tabs button').nth(1).click();await page.locator('#survivors-chapter-1').click();
  await page.locator('.survivors-stage-card').filter({has:page.locator('.survivors-stage-badge strong',{hasText:/^STAGE 12$/})}).click();
  await page.locator('.survivors-ready-launch .survivors-btn-primary').click();await page.waitForFunction(()=>window.resultEngine?.state.phase==='playing');
  await page.evaluate(()=>{window.completeFixture=true;});
  const scene=page.locator('.survivors-result-handoff');await scene.waitFor({timeout:10000}).catch(async error=>{console.log(await page.evaluate(()=>({phase:window.resultEngine?.state.phase,character:window.resultEngine?.state.characterId,stage:window.resultEngine?.state.stageId,number:window.resultEngine?.state.stage.stageNumber,storage:localStorage.getItem('psi.survivors.operation-handoff.v1'),result:document.querySelector('.survivors-result')?.textContent})));throw error;});await scene.locator('summary').click();
  await scene.locator('img').evaluate(img=>img.decode());await scene.getByRole('button',{name:'인계 대화',exact:true}).click();
  await scene.getByRole('button',{name:'경계부터 함께 확인해요',exact:true}).click();await scene.locator('.survivors-handoff-line').waitFor();await scene.scrollIntoViewIfNeeded();
  const result=await scene.evaluate(el=>({text:el.textContent,overflow:document.documentElement.scrollWidth>innerWidth+1,clipped:[...el.querySelectorAll('p,button,summary')].some(n=>n.scrollWidth>n.clientWidth+1)}));
  const choice=await page.evaluate(()=>localStorage.getItem('psi.survivors.handoff-dialogue.v1'));await page.screenshot({path:`${output}/${width}x${height}.png`});
  await page.locator('.survivors-result-actions .survivors-btn-primary').click();
  await page.waitForFunction(()=>document.querySelector('.survivors-ready-launch')?.textContent.includes('STAGE 13'));
  await page.locator('.survivors-preflight-tabs button').nth(0).click();
  const archive=page.locator('.survivors-operation-brief');
  await archive.locator('details').filter({has:page.locator('.survivors-handoff-dialogue')}).locator('summary').click();
  await archive.getByRole('button',{name:'다시보기',exact:true}).click();
  const restored=await archive.locator('.survivors-handoff-line').textContent(),after=await page.evaluate(()=>localStorage.getItem('psi.survivors.handoff-dialogue.v1'));
  rows.push({width,height,scope:'EXPLICIT_VICTORY_AND_ROUTE_FIXTURE_NOT_NATURAL_STAGE12',...result,choiceUnchanged:choice===after,restored,errors,pass:!result.overflow&&!result.clipped&&choice===after&&restored.includes(' 놓친 부분')&&!errors.length});await page.close();
 }
 fs.writeFileSync(`${output}/report.json`,JSON.stringify(rows,null,2));console.log(JSON.stringify(rows));if(rows.some(r=>!r.pass))process.exitCode=1;
}finally{await browser.close();}

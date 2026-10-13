import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const output='artifacts/character-chapters';fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
const reports=[];
try{
 for(const [width,height] of [[1440,900],[390,844],[844,390]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];
  page.on('pageerror',error=>errors.push(String(error)));
  await page.addInitScript(()=>localStorage.setItem('psi.survivors.growth_v1',JSON.stringify([
   {characterId:'player',stageId:'stage_12',stars:[true,true,false]},
   {characterId:'player',stageId:'stage_41',stars:[true,false,false]},
   {characterId:'lim_junho',stageId:'stage_11',stars:[true,true,true]}
  ])));
  await page.goto(process.env.PSI_PREVIEW_URL,{waitUntil:'networkidle'});
  await page.getByRole('button',{name:/시그널 워치.*SURVIVORS/}).click();
  const chapters=page.locator('.survivors-character-chapters').first();
  await chapters.waitFor();
  await page.waitForTimeout(800);
  const snapshot=()=>page.evaluate(()=>JSON.stringify(Object.keys(localStorage).sort().map(key=>[key,localStorage.getItem(key)])));
  const before=await snapshot();
  await chapters.locator('summary').click();
  await chapters.scrollIntoViewIfNeeded();
  const result=await chapters.evaluate(element=>({
   count:element.querySelectorAll('section').length,
   text:element.textContent,
   summaryHeight:element.querySelector('summary').getBoundingClientRect().height,
   overflow:document.documentElement.scrollWidth>innerWidth,
   clipped:[...element.querySelectorAll('h4,p')].some(node=>node.scrollWidth>node.clientWidth+1)
  }));
  const after=await snapshot();
  await page.screenshot({path:`${output}/${width}x${height}.png`});
  const pass=result.count===2&&result.summaryHeight>=44&&!result.overflow&&!result.clipped&&before===after&&!errors.length&&result.text.includes('작업중지 이유와 재개 조건')&&!result.text.includes('급한 상황에서도');
  reports.push({width,height,...result,saveUnchanged:before===after,errors,pass});await page.close();
 }
 fs.writeFileSync(`${output}/report.json`,JSON.stringify({scope:'SEEDED_CLEAR_RECORD_UI_NOT_NATURAL_GROWTH_OR_CAREER_UNLOCK',reports},null,2));
 console.log(JSON.stringify(reports));if(reports.some(row=>!row.pass))process.exitCode=1;
}finally{await browser.close();}

import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const output='artifacts/character-reflection';fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
const reports=[];
const assetSha=createHash('sha256').update(fs.readFileSync('public/assets/survivors/growth/player-stage12-handoff-v1.png')).digest('hex');
if(assetSha!=='0129709a46a7381b68491eba8c3b453b82fc9ae2b750470184ba5f18544da72e')throw Error('Approved scene bytes changed');
try{
 for(const [width,height] of [[1440,900],[390,844],[844,390]]){
  for(const outcome of ['victory','defeat','empty']){
   const page=await browser.newPage({viewport:{width,height}}),errors=[];
   page.on('pageerror',error=>errors.push(String(error)));
   await page.addInitScript(outcome=>localStorage.setItem('psi.survivors.operation-handoff.v1',JSON.stringify([
    {version:1,characterId:'player',stageId:'stage_12',stageNumber:12,outcome:outcome==='defeat'?'defeat':'victory',zones:outcome==='empty'?0:2,cartStops:outcome==='empty'?0:1,rubbleCleared:outcome==='empty'?0:3,damageTaken:0,stars:[true,true,false]},
    {version:1,characterId:'lim_junho',stageId:'stage_13',stageNumber:13,outcome:'victory',zones:9,cartStops:9,rubbleCleared:9,damageTaken:0,stars:[true,true,true]}
   ])),outcome);
   await page.goto(process.env.PSI_PREVIEW_URL,{waitUntil:'networkidle'});
   await page.getByRole('button',{name:/시그널 워치.*SURVIVORS/}).click();
   const brief=page.locator('.survivors-operation-brief').first();await brief.waitFor();await page.waitForTimeout(800);
   const snapshot=()=>page.evaluate(()=>JSON.stringify(Object.keys(localStorage).sort().map(key=>[key,localStorage.getItem(key)])));
   const before=await snapshot(),details=brief.locator('details').last();
   await details.locator('summary').click();await details.scrollIntoViewIfNeeded();
   const scene=details.locator('.survivors-handoff-scene img');
   if(await scene.count())await scene.evaluate(image=>image.decode());
   const result=await details.evaluate(element=>({text:element.textContent,count:element.querySelectorAll('li').length,summaryHeight:element.querySelector('summary').getBoundingClientRect().height,overflow:document.documentElement.scrollWidth>innerWidth+1,clipped:[...element.querySelectorAll('p,li,h4')].some(node=>node.scrollWidth>node.clientWidth+1)}));
   const sceneResult=await scene.count()?await scene.evaluate(image=>({loaded:image.complete&&image.naturalWidth>0,width:image.getBoundingClientRect().width,height:image.getBoundingClientRect().height,naturalWidth:image.naturalWidth,naturalHeight:image.naturalHeight})):null;
   const scenePass=outcome==='victory'?sceneResult?.loaded&&Math.abs(sceneResult.width/sceneResult.height-sceneResult.naturalWidth/sceneResult.naturalHeight)<.01:!sceneResult;
   const after=await snapshot();await page.screenshot({path:`${output}/${width}x${height}-${outcome}.png`});
   const pass=scenePass&&result.count===(outcome==='empty'?0:outcome==='defeat'?4:3)&&result.text.includes('STAGE 12')&&!result.text.includes('STAGE 13')&&result.summaryHeight>=44&&!result.overflow&&!result.clipped&&before===after&&!errors.length;
   reports.push({width,height,outcome,...result,scene:sceneResult,assetSha,saveUnchanged:before===after,errors,pass});await page.close();
  }
 }
 fs.writeFileSync(`${output}/report.json`,JSON.stringify({scope:'SEEDED_HANDOFF_UI_NOT_NATURAL_CAREER_OR_STORY_UNLOCK',reports},null,2));
 console.log(JSON.stringify(reports));if(reports.some(row=>!row.pass))process.exitCode=1;
}finally{await browser.close();}

import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const archive=process.env.PSI_ARCHIVE_QA==='1';
const output=archive?'artifacts/handoff-archive':'artifacts/handoff-dialogue';fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN}),reports=[];
try{
 for(const [width,height] of [[1440,900],[390,844],[844,390]])for(const choice of ['together','explain']){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];
  page.on('pageerror',error=>errors.push(String(error)));
  await page.addInitScript(archive=>{
   localStorage.setItem('psi.survivors.operation-handoff.v1',JSON.stringify([{version:1,characterId:'player',stageId:'stage_12',stageNumber:12,outcome:'victory',zones:0,cartStops:0,rubbleCleared:1,damageTaken:0,stars:[true,false,false]}]));
   if(archive){const rows=JSON.parse(localStorage.getItem('psi.survivors.operation-handoff.v1'));rows.push({...rows[0],stageId:'stage_13',stageNumber:13,rubbleCleared:0});localStorage.setItem('psi.survivors.operation-handoff.v1',JSON.stringify(rows));}
   window.dialogueWrites=0;window.failDialogue=false;
   const set=Storage.prototype.setItem;
   Storage.prototype.setItem=function(key,value){if(key==='psi.survivors.handoff-dialogue.v1'){if(window.failDialogue)throw Error('QA write failure');window.dialogueWrites++;}return set.call(this,key,value);};
  },archive);
  await page.goto(process.env.PSI_PREVIEW_URL,{waitUntil:'networkidle'});
  await page.getByRole('button',{name:/시그널 워치.*SURVIVORS/}).click();
  const details=page.locator('.survivors-operation-brief').first().locator('details').last();await details.locator('summary').click();
  const dialogue=page.locator('.survivors-handoff-dialogue');await dialogue.waitFor();await page.waitForTimeout(800);
  const snapshot=()=>page.evaluate(()=>JSON.stringify(Object.keys(localStorage).filter(key=>key!=='psi.survivors.handoff-dialogue.v1').sort().map(key=>[key,localStorage.getItem(key)])));
  const before=await snapshot();
  await dialogue.getByRole('button',{name:'인계 대화',exact:true}).click();
  await dialogue.getByRole('button',{name:'나중에',exact:true}).click();
  const skipFocus=await dialogue.getByRole('button',{name:'인계 대화',exact:true}).evaluate(element=>document.activeElement===element);
  const skipUnwritten=await page.evaluate(()=>localStorage.getItem('psi.survivors.handoff-dialogue.v1')===null&&window.dialogueWrites===0);
  await dialogue.getByRole('button',{name:'인계 대화',exact:true}).click();await page.evaluate(()=>window.failDialogue=true);
  const choiceHeights=await dialogue.locator('.survivors-handoff-choices button').evaluateAll(buttons=>buttons.map(button=>button.getBoundingClientRect().height));
  const label=choice==='together'?'경계부터 함께 확인해요':'확인한 내용부터 설명할게요';
  await dialogue.getByRole('button',{name:label,exact:true}).click();await dialogue.getByRole('alert').waitFor();
  const failureUnwritten=await page.evaluate(()=>localStorage.getItem('psi.survivors.handoff-dialogue.v1')===null&&window.dialogueWrites===0);
  await page.evaluate(()=>window.failDialogue=false);await dialogue.getByRole('button',{name:label,exact:true}).click();
  await dialogue.locator('.survivors-handoff-line').waitFor();await dialogue.getByRole('button',{name:'닫기',exact:true}).click();
  const closeFocus=await dialogue.getByRole('button',{name:'다시보기',exact:true}).evaluate(element=>document.activeElement===element);
  await dialogue.getByRole('button',{name:'다시보기',exact:true}).click();await dialogue.scrollIntoViewIfNeeded();
  const geometry=await dialogue.evaluate(element=>({overflow:document.documentElement.scrollWidth>innerWidth+1,clipped:[...element.querySelectorAll('p,h4,button')].some(node=>node.scrollWidth>node.clientWidth+1),buttons:[...element.querySelectorAll('button')].map(button=>button.getBoundingClientRect().height)}));
  const persisted=await page.evaluate(()=>({value:JSON.parse(localStorage.getItem('psi.survivors.handoff-dialogue.v1')),writes:window.dialogueWrites}));
  const after=await snapshot();await page.screenshot({path:`${output}/${width}x${height}-${choice}.png`});
  await page.reload();await page.getByRole('button',{name:/시그널 워치.*SURVIVORS/}).click();
  await page.locator('.survivors-operation-brief').first().locator('details').last().locator('summary').click();
  await dialogue.getByRole('button',{name:'다시보기',exact:true}).click();
  const restored=await dialogue.locator('.survivors-handoff-line').textContent();
  const replayWrites=await page.evaluate(()=>window.dialogueWrites);
  const focused=await dialogue.locator('.survivors-handoff-line').evaluate(element=>document.activeElement===element);
  const pass=skipFocus&&closeFocus&&focused&&choiceHeights.length===2&&choiceHeights.every(height=>height>=44)&&skipUnwritten&&failureUnwritten&&persisted.value.choice===choice&&persisted.writes===1&&replayWrites===0&&before===after&&!geometry.overflow&&!geometry.clipped&&geometry.buttons.every(height=>height>=44)&&!errors.length&&restored.includes(choice==='together'?' 놓친 부분이 있다면':'확인하지 못한 곳은');
  reports.push({width,height,choice,scope:'SEEDED_HANDOFF_UI_WITH_WRITE_FAILURE_NOT_NATURAL_STAGE12',skipFocus,closeFocus,skipUnwritten,failureUnwritten,persisted,replayWrites,focused,choiceHeights,unrelatedStorageUnchanged:before===after,restored,geometry,errors,pass});await page.close();
 }
 fs.writeFileSync(`${output}/report.json`,JSON.stringify(reports,null,2));console.log(JSON.stringify(reports));if(reports.some(row=>!row.pass))process.exitCode=1;
}finally{await browser.close();}

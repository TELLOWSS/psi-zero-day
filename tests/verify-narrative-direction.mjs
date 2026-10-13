import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const output='artifacts/narrative-direction';fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN}),rows=[];
try{
 for(const [width,height] of [[1440,900],[390,844],[844,390]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',error=>errors.push(String(error)));
  await page.addInitScript(()=>{
   localStorage.setItem('psi.survivors.operation-handoff.v1',JSON.stringify([{version:1,characterId:'player',stageId:'stage_12',stageNumber:12,outcome:'victory',zones:0,cartStops:0,rubbleCleared:1,damageTaken:0,stars:[true,false,false]}]));
   window.directionWrites=0;window.failDirection=false;const set=Storage.prototype.setItem;
   Storage.prototype.setItem=function(key,value){if(key==='psi.survivors.narrative-direction.v1'){if(window.failDirection)throw Error('QA write failure');window.directionWrites++;}return set.call(this,key,value);};
  });
  await page.goto(process.env.PSI_PREVIEW_URL);await page.getByRole('button',{name:/시그널 워치.*SURVIVORS/}).click();
  await page.locator('.survivors-operation-brief details').last().locator('summary').click();
  const direction=page.locator('.survivors-narrative-direction'),dialogue=page.locator('.survivors-handoff-dialogue');
  const hiddenBeforeDialogue=await direction.count()===0;
  await dialogue.getByRole('button',{name:'인계 대화',exact:true}).click();await dialogue.getByRole('button',{name:'경계부터 함께 확인해요',exact:true}).click();
  await direction.waitFor();
  const snapshot=()=>page.evaluate(()=>JSON.stringify(Object.keys(localStorage).filter(key=>key!=='psi.survivors.narrative-direction.v1').sort().map(key=>[key,localStorage.getItem(key)])));
  const before=await snapshot();await direction.getByRole('button',{name:'관심사 선택',exact:true}).click();await direction.locator('select').selectOption('control');await direction.getByRole('button',{name:'나중에',exact:true}).click();
  const skipUnwritten=await page.evaluate(()=>window.directionWrites===0&&localStorage.getItem('psi.survivors.narrative-direction.v1')===null);
  await direction.getByRole('button',{name:'관심사 선택',exact:true}).click();await direction.locator('select').selectOption('control');
  const imageGates=[];
  for(const id of ['control','coordination','investigation']){await direction.locator('select').selectOption(id);await direction.getByRole('button',{name:'관심사 저장',exact:true}).click();const image=direction.locator('.survivors-narrative-interest-scene img');await image.evaluate(img=>img.decode());imageGates.push(await image.evaluate((img,id)=>img.naturalWidth>0&&getComputedStyle(img).objectFit==='contain'&&img.getAttribute('src').includes(`player-${id}-interest-v1.png`),id));await image.evaluate(img=>img.scrollIntoView({block:'center'}));await page.screenshot({path:`${output}/${width}x${height}-${id}-art.png`});}
  await direction.getByRole('button',{name:'관심사 저장',exact:true}).click();
  await page.evaluate(()=>window.failDirection=true);await direction.locator('select').selectOption('control');await direction.getByRole('button',{name:'관심사 저장',exact:true}).click();await direction.getByRole('alert').waitFor();
  const failurePreserved=await page.evaluate(()=>JSON.parse(localStorage.getItem('psi.survivors.narrative-direction.v1')).direction==='investigation'&&window.directionWrites===3);
  await page.evaluate(()=>window.failDirection=false);await direction.getByRole('button',{name:'관심사 저장',exact:true}).click();await direction.getByRole('status').waitFor();
  await direction.getByRole('button',{name:'나중에',exact:true}).click();
  const closeFocus=await direction.getByRole('button',{name:'관심사 변경',exact:true}).evaluate(element=>document.activeElement===element);
  await direction.getByRole('button',{name:'관심사 변경',exact:true}).click();await direction.scrollIntoViewIfNeeded();
  const geometry=await direction.evaluate(el=>({overflow:document.documentElement.scrollWidth>innerWidth+1,clipped:[...el.querySelectorAll('p,button,select')].some(n=>n.scrollWidth>n.clientWidth+1),heights:[...el.querySelectorAll('button,select')].map(n=>n.getBoundingClientRect().height)}));
  const unchanged=before===await snapshot();await page.screenshot({path:`${output}/${width}x${height}.png`});
  await page.reload();await page.getByRole('button',{name:/시그널 워치.*SURVIVORS/}).click();await page.locator('.survivors-operation-brief details').last().locator('summary').click();
  const actualRestored=(await direction.textContent()).includes('중지와 재개 경계를');
  await direction.locator('.survivors-narrative-interest-scene img').evaluate(img=>img.decode());
  const reloadUnwritten=await page.evaluate(()=>window.directionWrites===0);
  await page.locator('.survivors-preflight-tabs button').nth(2).click();await page.locator('.survivors-char-card').filter({has:page.getByAltText('임준호',{exact:true})}).click();await page.locator('.survivors-preflight-tabs button').nth(0).click();
  const actorSeparated=await direction.count()===0;
  if(!imageGates.every(Boolean))throw Error('Approved interest image gate or aspect ratio failed');
  rows.push({width,height,scope:'SEEDED_HANDOFF_UI_NOT_NATURAL_GROWTH_OR_DEVICE',hiddenBeforeDialogue,skipUnwritten,failurePreserved,closeFocus,geometry,unrelatedStorageUnchanged:unchanged,restored:actualRestored,reloadUnwritten,actorSeparated,errors,pass:hiddenBeforeDialogue&&skipUnwritten&&failurePreserved&&closeFocus&&actualRestored&&reloadUnwritten&&actorSeparated&&unchanged&&!geometry.overflow&&!geometry.clipped&&geometry.heights.every(h=>h>=44)&&!errors.length});await page.close();
 }
 fs.writeFileSync(`${output}/report.json`,JSON.stringify(rows,null,2));console.log(JSON.stringify(rows));if(rows.some(r=>!r.pass))process.exitCode=1;
}finally{await browser.close();}

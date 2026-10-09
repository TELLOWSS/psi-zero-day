import fs from 'node:fs';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const copy=JSON.parse(fs.readFileSync('content/localization/survivors-store-ko.json','utf8')),detail=JSON.parse(fs.readFileSync('content/localization/survivors-equipment-details-ko.json','utf8'));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN}),reports=[];
try{for(const [width,height] of [[1440,900],[390,844]]){
 const page=await browser.newPage({viewport:{width,height},recordVideo:width===1440?{dir:'artifacts/contact-video',size:{width:1440,height:900}}:undefined}),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.addInitScript(()=>{window.contactDraws=[];window.wornViews=[];const fn=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(image,...args){if(image?.dataset?.contactSheet)window.contactDraws.push({src:image.dataset.contactSheet,frame:image.dataset.contactFrame});if(image?.dataset?.propAtlas)window.wornViews.push(image.dataset.propAtlas);return fn.call(this,image,...args);};});
 await page.goto('http://127.0.0.1:5203/',{waitUntil:'networkidle'});
 await page.getByRole('button',{name:/시그널 워치.*SURVIVORS/}).click();await page.getByRole('button',{name:copy.briefBrowse,exact:true}).click();await page.getByRole('tab',{name:copy.fitting,exact:true}).click();
 const canvas=page.locator('.survivors-fitting-visual canvas'),before=await page.evaluate(()=>JSON.stringify({...localStorage}));
 let checks=0;for(const character of Object.keys(detail.roles)){
  await page.getByLabel(detail.character,{exact:true}).selectOption(character);
  await page.getByLabel(copy.categories.tempo,{exact:true}).selectOption('sync_gauntlet');
  await page.getByLabel(copy.attackMotion,{exact:true}).selectOption('turn');
  await page.waitForFunction(()=>!document.querySelector('.survivors-fitting-visual figcaption'));
  await page.evaluate(()=>{window.contactDraws=[];});
  await page.waitForTimeout(2100);
  const trace=await page.evaluate(()=>window.contactDraws);
  if(!trace.some(d=>d.src.includes('/'+character+'-contact-')))throw Error('Missing authored contact atlas '+character);
  if(!trace.some(d=>d.frame==='1'))throw Error('Missing intermediate turn '+character);
  if(await canvas.getAttribute('data-contact-art')!=='true')throw Error('Contact mesh missing '+character);
  const error=Number(await canvas.getAttribute('data-contact-error'));if(!Number.isFinite(error)||error>1e-6)throw Error('Socket projection mismatch '+character+':'+error);
  if(width===1440)await canvas.screenshot({path:'artifacts/contact-turn-'+character+'.png'});
  await page.getByLabel(copy.attackMotion,{exact:true}).selectOption('walk');await page.waitForTimeout(1200);
  if(width===1440)await canvas.screenshot({path:'artifacts/contact-walk-'+character+'.png'});
  await page.getByRole('button',{name:copy.pausePreview,exact:true}).click();await page.waitForTimeout(100);const frozen=await canvas.screenshot();await page.waitForTimeout(150);if(!frozen.equals(await canvas.screenshot()))throw Error('Pause drift '+character);
  const poseClock=await canvas.getAttribute('data-preview-clock');
  await page.evaluate(()=>{window.poseLoadingCount=0;window.poseObserver=new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes)if(node instanceof Element&&(node.matches('figcaption')||node.querySelector('figcaption')))window.poseLoadingCount++;});window.poseObserver.observe(document.querySelector('.survivors-fitting-visual'),{childList:true,subtree:true});});
  for(const motion of ['idle','walk','turn']){await page.getByLabel(copy.attackMotion,{exact:true}).selectOption(motion);await page.waitForTimeout(80);if(await canvas.getAttribute('data-preview-motion')!==motion)throw Error('Pose switch not painted '+character);if(await canvas.getAttribute('data-preview-clock')!==poseClock)throw Error('Pose switch reset paused clock '+character);if(await page.locator('.survivors-fitting-visual figcaption').count())throw Error('Pose switch reloaded artwork '+character);}
  if(await page.evaluate(()=>window.poseLoadingCount))throw Error('Loading flash on pose switch '+character);await page.evaluate(()=>window.poseObserver.disconnect());
  await page.getByRole('button',{name:copy.playPreview,exact:true}).click();checks++;
 }
 await page.getByLabel(detail.character,{exact:true}).selectOption('player');
 await page.getByRole('button',{name:copy.pausePreview,exact:true}).click();
 const lab=page.locator('.survivors-equipment-lab');await lab.locator('summary').click();
 await lab.getByLabel('시험 장비',{exact:true}).selectOption('steel_boots');await lab.getByLabel(copy.pose,{exact:true}).selectOption('turn');
 await page.waitForFunction(()=>!document.querySelector('.survivors-equipment-lab figcaption'));
 await page.evaluate(()=>{window.wornViews=[];});await page.waitForTimeout(2100);
 for(const view of ['side','rear'])if(!await page.evaluate(view=>window.wornViews.some(path=>path.includes('normal-worn-'+view+'-v1')),view))throw Error('Missing free equipment '+view+' view');
 if(width===1440)await lab.locator('canvas').screenshot({path:'artifacts/contact-steel-boots-turn.png'});
 await page.getByLabel(copy.attackMotion,{exact:true}).selectOption('check');await page.getByRole('button',{name:copy.playPreview,exact:true}).click();await page.evaluate(()=>{window.contactDraws=[];});await page.waitForTimeout(900);
 if(!await page.evaluate(()=>window.contactDraws.some(d=>d.frame==='7')))throw Error('Player authored equipment check regressed');
 if(await page.evaluate(()=>JSON.stringify({...localStorage}))!==before)throw Error('Preview changed wallet/inventory');
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw Error('Horizontal overflow');
 if(errors.length)throw Error(errors.join('\n'));reports.push({width,height,characters:checks,errors,contactProjection:'<1e-6 logical units',pause:'stable',poseSwitch:'no loading flash or clock reset',storage:'unchanged'});
 await page.close();
}fs.writeFileSync('artifacts/contact-browser.json',JSON.stringify(reports,null,2));console.log(JSON.stringify(reports));}finally{await browser.close();}

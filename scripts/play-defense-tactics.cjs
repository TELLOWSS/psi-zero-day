const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PSI_PLAYWRIGHT_MODULE || 'playwright');
const out=path.resolve(process.env.PSI_QA_OUTPUT || 'docs/qa/defense-tactics-20261015');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,headless:true});const rows=[];
 try{for(const [name,width,height,support] of [['pc',1440,900,'COORDINATOR'],['portrait',390,844,'OBSERVER'],['landscape',844,390,'COORDINATOR']]){
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto((process.env.PSI_PREVIEW_URL || 'http://127.0.0.1:4176/'),{waitUntil:'networkidle'});await page.locator('.is-defense-entry').click();await page.locator(`[data-support="${support}"]`).click();
  const skip=page.getByRole('button',{name:'안내 건너뛰기',exact:true});if(await skip.isVisible())await skip.click();
  await page.locator('.zb-speed button').nth(1).click();
  await page.clock.install();await page.clock.pauseAt(Date.now()+100);
  const row={name,support,errors,purchases:[],waves:[],steps:0};let captured=false;
  for(let step=0;step<700;step++){
   const shell=page.locator('[data-defense-screen="combat"]'),status=await shell.getAttribute('data-status');
   if(status==='WON'||status==='LOST'){row.status=status;row.shield=await shell.getAttribute('data-shield');break;}
   if(status==='READY'||status==='INTERMISSION'){
    const wave=await shell.getAttribute('data-wave');row.waves.push(wave);
    for(let n=0;n<30;n++){
     const recommend=page.locator('.zb-tactics-strip button');if(await recommend.isDisabled())break;
     await recommend.click();
     const buy=page.locator('.zb-tower-shop button[data-recommended="true"],.zb-tech-nodes button[data-recommended="true"]');
     if(await buy.count()!==1)throw Error('Recommendation has no executable selected command');
     row.purchases.push({wave,text:await buy.innerText()});try{await buy.click();}catch(e){await page.screenshot({path:path.join(out,`${name}-play-error.png`)});console.error(JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll('.zb-command,.zb-selection,.zb-build-panel,.zb-tower-shop,.zb-tech-tree,.zb-run-controls')].map(x=>({c:x.className,display:getComputedStyle(x).display,height:x.clientHeight,scroll:x.scrollHeight,rect:x.getBoundingClientRect().toJSON()})))));throw e;}
    }
    const close=page.getByRole('button',{name:'현장으로 돌아가기',exact:true});if(await close.count())await close.click();
    await page.locator('.zb-start-wave').click();
   }
   const supportButton=page.locator('.zb-support-action button');if(await supportButton.isEnabled())await supportButton.click();
   if(!captured&&Number(await shell.getAttribute('data-wave'))>=5){await page.screenshot({path:path.join(out,`${name}-actual-combat.png`)});captured=true;}
   await page.clock.runFor(1000);row.steps++;
  }
  await page.screenshot({path:path.join(out,`${name}-actual-result.png`)});
  row.resultText=await page.locator('.zb-result').innerText();
  await page.clock.runFor(100);
  row.saved=await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('psi-zero-day.defense.save.v1'));return {records:s?.document?.records??s?.payload?.records,keys:Object.keys(s||{})};});
  rows.push(row);fs.writeFileSync(path.join(out,'natural-play.json'),JSON.stringify(rows,null,2));
  console.log(name,row.status,row.shield,row.purchases.length);
  if(row.status!=='WON'||errors.length)throw Error(`${name}: expected real victory without page errors`);
  await context.close();
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});

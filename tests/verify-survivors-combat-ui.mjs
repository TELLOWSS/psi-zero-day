import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const url=process.env.PSI_PREVIEW_URL;if(!url)throw Error('Set PSI_PREVIEW_URL to a Vite dev server');
fs.mkdirSync('artifacts/combat-debrief-ui',{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN,args:['--renderer-process-limit=1']}),rows=[];
try{
 for(const [width,height] of [[1440,900],[390,844],[844,390]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:/시그널 워치.*SURVIVORS/}).click({noWaitAfter:true});
  await page.locator('.survivors-ready-launch .survivors-btn-primary').click({noWaitAfter:true});
  await page.locator('.survivors-container.is-combat').waitFor();
  await page.screenshot({path:`artifacts/combat-debrief-ui/${width}x${height}-hud.png`});
  const hudFits=await page.locator('.survivors-hud-top').evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&el.scrollWidth<=el.clientWidth+1;});
  await page.keyboard.press('KeyP');
  const health=await page.getByRole('progressbar',{name:'안전 체력',exact:true}).evaluate(el=>({current:Number(el.getAttribute('aria-valuenow')),max:Number(el.getAttribute('aria-valuemax'))}));
  const storage=await page.evaluate(()=>JSON.stringify({...localStorage})),outcomes=[];
  for(const outcome of ['victory','defeat']){
   await page.evaluate(async outcome=>{const {mountResultFixture}=await import('/tests/survivors-result-browser-fixture.tsx');mountResultFixture(outcome);},outcome);
   await page.locator('#qa-result-fixture .survivors-result-reward').waitFor();
   await page.waitForFunction(outcome=>document.querySelector('#qa-result-fixture [data-outcome]')?.getAttribute('data-outcome')===outcome,outcome);
   const layout=await page.locator('#qa-result-fixture').evaluate(host=>{
    const dialog=host.querySelector('.survivors-result-dialog'),body=host.querySelector('.survivors-result-body'),button=host.querySelector('button'),r=button.getBoundingClientRect();body.scrollTop=body.scrollHeight;
    return {overflow:dialog.scrollWidth>dialog.clientWidth+1,actionVisible:r.top>=0&&r.bottom<=innerHeight&&r.height>=44,reward:host.querySelector('.survivors-result-reward strong').textContent,stats:host.querySelectorAll('dt').length};
   });
   await page.locator('#qa-result-fixture .survivors-result-body').evaluate(el=>el.scrollTop=0);
   await page.screenshot({path:`artifacts/combat-debrief-ui/${width}x${height}-${outcome}-fixture.png`});outcomes.push({outcome,...layout});
  }
  const unchanged=storage===await page.evaluate(()=>JSON.stringify({...localStorage}));
  const pass=hudFits&&health.max>0&&health.current>=0&&health.current<=health.max&&unchanged&&outcomes.every(o=>!o.overflow&&o.actionVisible&&o.stats===(o.outcome==='victory'?5:3)&&o.reward.includes(o.outcome==='victory'?'1,234,567':'+0'))&&!errors.length;
  rows.push({width,height,scope:'Real launch/pause HUD; explicit test-only result presentation fixtures, not simulated clears',health,hudFits,unchanged,outcomes,errors,pass});await page.close();
 }
 fs.writeFileSync('artifacts/combat-debrief-ui/report.json',JSON.stringify(rows,null,2));console.log(JSON.stringify(rows));if(rows.some(r=>!r.pass))process.exitCode=1;
}finally{await browser.close();}

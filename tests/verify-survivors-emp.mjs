import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const url=process.env.PSI_PREVIEW_URL;if(!url)throw Error('Set built preview URL');
const output='artifacts/emp-fixture';fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN,args:['--renderer-process-limit=1']}),rows=[];
try{
 for(const [width,height] of [[1440,900],[390,844],[844,390]])for(const reduced of [false,true]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.emulateMedia({reducedMotion:reduced?'reduce':'no-preference'});
  await page.route('**/assets/PatrolSurvivorsGame-*.js',async route=>{
   const response=await route.fetch(),body=await response.text(),pattern=/update\([^)]*\)\{(?=if\(this\.state\.phase!==)/g;
   if([...body.matchAll(pattern)].length!==1)throw Error('Fixture capture unavailable');
   await route.fulfill({response,body:body.replace(pattern,m=>`${m}window.empFixtureEngine=this;`)});
  });
  await page.goto(url);await page.getByRole('button',{name:/시그널 워치.*SURVIVORS/}).click();
  await page.locator('.survivors-ready-launch .survivors-btn-primary').click();
  await page.waitForFunction(()=>window.empFixtureEngine?.state.phase==='playing');
  await page.evaluate(()=>{const s=window.empFixtureEngine.state;s.activePerks.plasma_grid=1;s.player.hp=s.player.maxHp=10000;});
  await page.waitForFunction(()=>window.empFixtureEngine.state.projectiles.some(p=>p.kind==='plasma_arc'&&p.duration>.3));
  await page.keyboard.press('KeyP');
  // Hide only the pause overlay for this frozen presentation fixture screenshot.
  await page.addStyleTag({content:'.survivors-modal-backdrop{visibility:hidden!important}'});
  await page.waitForTimeout(100);
  const metrics=await page.evaluate(()=>{
   const s=window.empFixtureEngine.state,p=s.projectiles.find(p=>p.kind==='plasma_arc'),c=document.querySelector('.survivors-canvas')??document.querySelector('canvas');
   const bytes=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let min=255,max=0;for(let i=0;i<bytes.length;i+=32){min=Math.min(min,bytes[i]);max=Math.max(max,bytes[i]);}
   return {phase:s.phase,pulse:p?{radius:p.radius,duration:p.duration,kind:p.kind}:null,nonblank:max-min>20,overflow:document.documentElement.scrollWidth>innerWidth};
  });
  await page.screenshot({path:`${output}/${width}x${height}-${reduced?'reduced':'motion'}.png`});
  rows.push({width,height,reduced,...metrics,errors,pass:metrics.phase==='paused'&&metrics.pulse?.radius===165&&metrics.nonblank&&!metrics.overflow&&!errors.length});await page.close();
 }
 fs.writeFileSync(`${output}/report.json`,JSON.stringify({scope:'EXPLICIT_PLASMA_EVOLUTION_FIXTURE_NOT_NATURAL_PROGRESSION_OR_PHYSICAL_DEVICE',url,rows},null,2));
 console.log(JSON.stringify(rows));if(rows.some(r=>!r.pass))process.exitCode=1;
}finally{await browser.close();}

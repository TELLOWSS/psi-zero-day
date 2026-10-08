import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const output='artifacts/grouting-combat';fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN}),rows=[];
try{
 for(const [width,height] of [[1440,900],[390,844],[844,390]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.route('**/assets/PatrolSurvivorsGame-*.js',async route=>{
   const response=await route.fetch(),body=await response.text(),pattern=/update\([^)]*\)\{(?=if\(this\.state\.phase!==)/g;
   if([...body.matchAll(pattern)].length!==1)throw Error('Engine capture unavailable');
   await route.fulfill({response,body:body.replace(pattern,m=>`${m}window.groutEngine=this;`)});
  });
  await page.goto(process.env.PSI_PREVIEW_URL);
  await page.getByRole('button',{name:/시그널 워치.*SURVIVORS/}).click();
  await page.locator('.survivors-ready-launch .survivors-btn-primary').click();
  await page.waitForFunction(()=>window.groutEngine?.state.phase==='playing');
  await page.keyboard.press('KeyP');
  await page.addStyleTag({content:'.survivors-modal-backdrop{visibility:hidden!important}'});
  for(const kind of ['grout_slug','hydraulic_wave']){
   await page.evaluate(kind=>{
    const s=window.groutEngine.state,p=s.player;
    s.projectiles=Array.from({length:5},(_,i)=>({id:`review${i}`,kind,x:p.x+60+i*18,y:p.y+(i-2)*22,vx:400,vy:(i-2)*50,radius:kind==='grout_slug'?22:40,damage:1,duration:kind==='grout_slug'?.75:.3,pierce:1,color:'#cbd2c9'}));
   },kind);
   await page.waitForTimeout(700);
   const result=await page.evaluate(()=>{
    const c=document.querySelector('.survivors-canvas'),s=window.groutEngine.state;
    const data=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let hash=2166136261;
    for(let i=0;i<data.length;i+=4)hash=Math.imul(hash^data[i],16777619);
    return {hash:hash>>>0,time:s.gameTime,phase:s.phase,count:s.projectiles.length,overflow:document.documentElement.scrollWidth>innerWidth+1};
   });
   await page.screenshot({path:`${output}/${width}x${height}-${kind}.png`});
   rows.push({width,height,kind,...result,errors:[...errors],pass:result.phase==='paused'&&result.count===5&&!result.overflow&&!errors.length});
  }
  await page.close();
 }
 fs.writeFileSync(`${output}/report.json`,JSON.stringify({scope:'PAUSED_EXPLICIT_PROJECTILE_FIXTURE_NOT_NATURAL_PLAY_OR_DEVICE',rows},null,2));
 console.log(JSON.stringify(rows));if(rows.some(r=>!r.pass))process.exitCode=1;
}finally{await browser.close();}

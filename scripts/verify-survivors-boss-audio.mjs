import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const out=path.resolve('artifacts/boss-audio');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
const results=[];
try {
 for(const [width,height] of [[1440,900],[390,844],[844,390]]) {
  const page=await browser.newPage({viewport:{width,height}}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(process.env.PSI_PREVIEW_URL||'http://127.0.0.1:5196');
  await page.getByRole('button',{name:/야간 긴급 순찰/}).click();
  await page.evaluate(async()=>{
   const {SurvivorsEngine}=await import('/src/engine/patrol-survivors-engine.ts');
   const original=SurvivorsEngine.prototype.update;
   SurvivorsEngine.prototype.update=function(dt,input){window.qaEngine=this;return original.call(this,dt,input);};
  });
  await page.getByRole('button',{name:'순찰 시작하기',exact:true}).click();
  await page.waitForFunction(()=>window.qaEngine?.state.gameTime>.3);
  const result=await page.evaluate(async()=>{
   const e=window.qaEngine,s=e.state;
   s.gameTime=181;for(let i=0;i<120&&!s.stageBossSpawned;i++)e.update(1/60,{moveX:0,moveY:0});
   const noTimeoutWin=s.phase==='playing',boss=s.hazards.find(h=>h.isStageBoss);
   const {equipmentSoundSamples}=await import('/src/ui/survivors-equipment-sound.ts');
   const kinds=['radio','satellite_wave','extinguisher','cryo_blast','drone_laser','hunter_beam','tesla_bolt','emf_beam','shout_shockwave','cone_trap'];
   const sounds=kinds.map(kind=>{const pcm=equipmentSoundSamples(kind,'launch',false,48000);let sum=0,peak=0;for(const v of pcm){sum+=v*v;peak=Math.max(peak,Math.abs(v));}return {kind,rms:Math.sqrt(sum/pcm.length),peak};});
   return {noTimeoutWin,boss:boss?.type,sounds};
  });
  await page.waitForTimeout(150);
  await page.screenshot({path:path.join(out,`${width}x${height}-boss.png`)});
  const layout=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,timer:document.querySelector('.survivors-timer').textContent,nonblank:document.querySelector('canvas').getContext('2d').getImageData(0,0,400,200).data.some((v,i)=>i%4!==3&&v>30)}));
  results.push({width,height,...result,...layout,errors,pass:result.noTimeoutWin&&Boolean(result.boss)&&result.sounds.every(s=>s.rms>0&&s.peak<1)&&!layout.overflow&&layout.nonblank&&!errors.length});
  await page.close();
 }
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({scope:'BROWSER_RENDER_AND_CONTROLLED_ENGINE_FIXTURE_PCM_NOT_HUMAN_LISTENING',results},null,2));
 console.log(JSON.stringify(results));if(results.some(r=>!r.pass))process.exitCode=1;
}finally{await browser.close();}

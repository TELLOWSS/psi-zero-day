// Current launcher contract: WATCH/GUARD/STORY are playable entries, not old
// "coming soon" mode-preview dialogs. Exercise the real WATCH loading → preflight
// → combat → pause → home loop at desktop and both mobile orientations.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const baseUrl=process.env.PSI_PREVIEW_URL||'http://127.0.0.1:5196';
const out=path.resolve(process.env.PSI_TITLE_ARTIFACT_DIR||'artifacts/mode-preview-release');
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
const results=[];
try{
  for(const [width,height] of [[1440,900],[390,844],[844,390]]){
    const page=await browser.newPage({viewport:{width,height}}),errors=[];
    page.setDefaultTimeout(30000);
    page.on('pageerror',error=>errors.push(String(error)));
    const row={width,height,images:[],loadingSeen:false,preflightSeen:false,nonblank:false,overflow:false,errors,pass:false};
    try{
      await page.goto(baseUrl,{waitUntil:'domcontentloaded'});
      await page.locator('[data-title-layout="MODE_SELECT_V11"]').waitFor();
      // Decode three actual launcher cards. Do not click Story/Guard just to
      // satisfy an obsolete preview expectation or mutate their save state.
      for(const mode of ['survivors','defense','story']){
        const card=page.locator('button.is-'+mode+'-entry');
        if(await card.count()!==1)throw new Error('Missing live '+mode+' launcher');
        const image=await card.locator('img.commercial-title-action-art').evaluate(async img=>{
          await img.decode();
          return {src:new URL(img.src).pathname,width:img.naturalWidth,height:img.naturalHeight};
        });
        if(!image.src||image.width<700||image.height<300)throw new Error('Launcher artwork not decoded '+mode+' '+JSON.stringify(image));
        row.images.push({mode,...image});
      }
      await page.screenshot({path:path.join(out,`${width}x${height}-launcher.png`),animations:'disabled'});
      await page.locator('button.is-survivors-entry').click();
      // The WATCH cinematic loader intentionally occupies the full screen.
      row.loadingSeen=await page.locator('.signal-watch-loading').count()>0;
      await page.locator('.survivors-ready-launch').waitFor({timeout:45000});
      row.preflightSeen=true;
      const launch=page.locator('.survivors-ready-launch .survivors-btn-primary');
      await launch.waitFor({state:'visible'});
      await page.waitForFunction(()=>{const b=document.querySelector('.survivors-ready-launch .survivors-btn-primary');return b instanceof HTMLButtonElement&&!b.disabled;},null,{timeout:25000});
      await page.screenshot({path:path.join(out,`${width}x${height}-preflight.png`),animations:'disabled'});
      await launch.click();
      const canvas=page.locator('.survivors-container canvas').first();
      await canvas.waitFor({state:'visible'});
      await page.waitForTimeout(1500);
      row.nonblank=await canvas.evaluate(canvas=>{
        if(!(canvas instanceof HTMLCanvasElement)||!canvas.width||!canvas.height)return false;
        const pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data,colors=new Set();
        for(let i=0;i<pixels.length;i+=160)colors.add(`${pixels[i]},${pixels[i+1]},${pixels[i+2]}`);
        return colors.size>10;
      });
      await page.screenshot({path:path.join(out,`${width}x${height}-playing.png`),animations:'disabled'});
      await page.keyboard.press('KeyP');
      await page.getByRole('button',{name:'메인으로 나가기',exact:true}).click();
      await page.locator('[data-title-layout="MODE_SELECT_V11"]').waitFor();
      row.overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);
      row.pass=row.preflightSeen&&row.nonblank&&!row.overflow&&!errors.length;
      if(!row.pass)throw new Error('WATCH live-mode QA failed '+JSON.stringify(row));
    }catch(error){
      row.failure=error instanceof Error?error.message:String(error);
      try{await page.screenshot({path:path.join(out,`${width}x${height}-failure.png`),animations:'disabled'});}catch{}
    }finally{
      results.push(row);
      await page.close();
    }
  }
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({baseUrl,results},null,2)+'\n');
  console.log('SURVIVORS_LIVE_LAUNCHER='+JSON.stringify(results));
  if(results.some(result=>!result.pass))process.exitCode=1;
}finally{await browser.close();}

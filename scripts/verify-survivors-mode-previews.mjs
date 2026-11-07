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
    page.setDefaultTimeout(30000);page.on('pageerror',error=>errors.push(String(error)));
    await page.goto(baseUrl,{waitUntil:'domcontentloaded'});
    await page.locator('.rg-home,.commercial-title-home').waitFor();
    const images=[],entries=[];
    for(const mode of ['defense','story']){
      const entry=page.locator(mode==='defense'?'button.rg-card.is-guard,button.is-defense-entry':'button.rg-story-button,button.is-story-entry').first();
      const image=await (mode==='story'&&await page.locator('.rg-home').count()?page.locator('.rg-hero-art'):entry.locator('img')).evaluate(async image=>{
        await image.decode();return {src:new URL(image.src).pathname,width:image.naturalWidth,height:image.naturalHeight};
      });
      images.push(image);
      // Both cards now enter live modes. The former locked-preview contract is retired.
      await entry.click();
      await page.locator(mode==='defense'?'[data-defense-screen="guard-home"]':'.game-frame').waitFor();
      entries.push({mode,entered:true});
      await page.screenshot({path:path.join(out,`${width}x${height}-${mode}.png`)});
      await page.goto(baseUrl,{waitUntil:'domcontentloaded'});
      await page.locator('.rg-home,.commercial-title-home').waitFor();
    }
    await page.locator('button.rg-card.is-watch,button.is-survivors-entry').first().click();
    await page.locator('.survivors-ready-launch .survivors-btn-primary').click();
    const canvas=page.locator('.survivors-container canvas').first();
    await page.waitForTimeout(1500);
    const nonblank=await canvas.evaluate(canvas=>{
      const pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data,colors=new Set();
      for(let i=0;i<pixels.length;i+=160)colors.add(`${pixels[i]},${pixels[i+1]},${pixels[i+2]}`);
      return colors.size>10;
    });
    await page.screenshot({path:path.join(out,`${width}x${height}-playing.png`)});
    await page.keyboard.press('KeyP');
    await page.getByRole('button',{name:'메인으로 나가기',exact:true}).click();
    await page.locator('.rg-home,.commercial-title-home').waitFor();
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
    // The Guard card retains its 900px+ premium art contract. The
    // user-approved RE:IGNITION character is deliberately portrait artwork
    // (700×788), so reject unknown images rather than applying the old
    // landscape-only threshold to a correctly loaded portrait.
    const artContract={
      defense:images[0]?.width>=900&&images[0]?.height>=650,
      approvedReignition:images[1]?.src==='/assets/reignition/veteran-return.webp'
        &&images[1]?.width>=650&&images[1]?.height>=750,
    };
    const pass=artContract.defense&&artContract.approvedReignition&&entries.length===2&&nonblank&&!overflow&&!errors.length;
    results.push({width,height,images,artContract,entries,nonblank,overflow,errors,pass});await page.close();
  }
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({baseUrl,results},null,2));
  console.log(JSON.stringify(results));if(results.some(result=>!result.pass))process.exitCode=1;
}finally{await browser.close();}

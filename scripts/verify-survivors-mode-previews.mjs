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
    await page.locator('[data-title-layout="MODE_SELECT_V11"]').waitFor();
    const images=[];
    for(const mode of ['defense','story']){
      await page.locator(`.is-${mode}-entry`).click();
      const dialog=page.locator('.mode-preview-dialog');await dialog.waitFor();
      const image=await dialog.locator('.mode-preview-visual img').evaluate(async image=>{
        await image.decode();return {src:new URL(image.src).pathname,width:image.naturalWidth,height:image.naturalHeight};
      });
      images.push(image);
      if(await page.locator('[data-defense-screen],.zb-shell').count())throw new Error('Locked mode entered gameplay');
      await page.screenshot({path:path.join(out,`${width}x${height}-${mode}.png`)});
      await page.locator('.mode-preview-close').click();
    }
    await page.getByRole('button',{name:/시그널 워치.*SURVIVORS/}).click();
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
    await page.locator('[data-title-layout="MODE_SELECT_V11"]').waitFor();
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
    const pass=images.every(image=>image.src.endsWith('-v2.webp')&&image.width>=1600&&image.height>=900)&&nonblank&&!overflow&&!errors.length;
    results.push({width,height,images,nonblank,overflow,errors,pass});await page.close();
  }
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({baseUrl,results},null,2));
  console.log(JSON.stringify(results));if(results.some(result=>!result.pass))process.exitCode=1;
}finally{await browser.close();}

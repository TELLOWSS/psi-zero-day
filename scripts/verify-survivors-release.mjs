import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const baseUrl=process.env.PSI_PREVIEW_URL;
if(!baseUrl)throw new Error('Set PSI_PREVIEW_URL to the intended release URL.');
const out=path.resolve(process.env.PSI_SURVIVORS_QA_DIR||'artifacts/survivors-release');
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN}),rows=[];
try {
 for(const [width,height] of [[1440,900],[390,844],[844,390]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];
  page.on('pageerror',error=>errors.push(String(error)));
  await page.goto(baseUrl,{waitUntil:'networkidle'});
  const assets=await page.evaluate(async()=>{
   const results=[];
   for(const name of ['player-walk-eight-v1.png','player-walk-passing-v1.png','player-command-eight-v1.png']){
    const image=new Image();image.src='/assets/survivors/'+name;await image.decode();
    results.push({name,width:image.naturalWidth,height:image.naturalHeight});
   }
   return results;
  });
  await page.getByRole('button',{name:/시그널 워치.*SURVIVORS/}).click();
  await page.getByRole('button',{name:'시그널 워치 시작',exact:true}).click();
  await page.locator('.survivors-pause-command').waitFor();await page.waitForTimeout(1500);
  const pixels=()=>page.evaluate(()=>{
   const canvas=document.querySelector('.survivors-canvas'),data=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
   let hash=2166136261,colored=0;for(let i=0;i<data.length;i++){hash=Math.imul(hash^data[i],16777619);if(i%4===0&&data[i]+data[i+1]+data[i+2]>60)colored++;}
   return {hash:hash>>>0,colored};
  });
  const before=await pixels();await page.keyboard.down('ArrowRight');await page.waitForTimeout(500);await page.keyboard.up('ArrowRight');
  const after=await pixels();await page.screenshot({path:path.join(out,`${width}x${height}-play.png`)});
  await page.locator('.survivors-pause-command').click();
  await page.getByRole('button',{name:'순찰 재개',exact:true}).waitFor();await page.waitForTimeout(500);
  const paused=await pixels();await page.waitForTimeout(250);const held=await pixels();
  await page.getByRole('button',{name:'순찰 재개',exact:true}).click();await page.waitForTimeout(350);const resumed=await pixels();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  const pass=assets.every(asset=>asset.width>0&&asset.height>0)&&before.colored>1000&&after.hash!==before.hash&&paused.hash===held.hash&&resumed.hash!==held.hash&&!overflow&&!errors.length;
  rows.push({width,height,assets,before,after,paused,held,resumed,overflow,errors,pass});await page.close();
 }
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({baseUrl,rows},null,2));console.log(JSON.stringify({baseUrl,rows}));
 if(rows.some(row=>!row.pass))process.exitCode=1;
}finally{await browser.close();}

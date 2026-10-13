import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const out=path.resolve('artifacts/barrier-animation');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
try {
 const reports=[];
 for(const [width,height] of [[1440,900],[390,844],[844,390]]) {
  const page=await browser.newPage({viewport:{width,height},hasTouch:width<900}),errors=[];
  page.on('pageerror',error=>errors.push(String(error)));
  await page.goto('http://127.0.0.1:5196');await page.getByRole('button',{name:/야간 긴급 순찰/}).click();
  const art=await page.evaluate(async()=>{
   const {prepareBarrierAnimation}=await import('/src/ui/survivors-equipment-animation.ts');
   const image=new Image();image.src='/assets/survivors/barrier-forge-deploy-v1.png';await image.decode();
   const sheet=prepareBarrierAnimation(image),ctx=sheet.getContext('2d'),frames=[];
   for(let frame=0;frame<6;frame++){
    const pixels=ctx.getImageData(frame*256,0,256,256).data;
    let visible=0,edge=0,weight=0,cx=0,cy=0;
    for(let y=0;y<256;y++)for(let x=0;x<256;x++){
     const i=(y*256+x)*4,a=pixels[i+3];if(a<=16)continue;visible++;
     if(x<25||x>=231||y<25||y>=231)edge++;
     if(Math.hypot(x-128,y-128)<20&&pixels[i]>230&&pixels[i+1]>200){weight+=a;cx+=x*a;cy+=y*a;}
    }
    frames.push({visible,edge,coreOffset:weight?Math.hypot(cx/weight-128,cy/weight-128):999});
   }
   const {SurvivorsEngine}=await import('/src/engine/patrol-survivors-engine.ts'),update=SurvivorsEngine.prototype.update;
   SurvivorsEngine.prototype.update=function(...args){window.qaEngine=this;return update.apply(this,args);};
   return {frames,gallery:sheet.toDataURL(),pass:frames.every(f=>f.visible>20&&f.edge===0&&f.coreOffset<8)};
  });
  fs.writeFileSync(path.join(out,`${width}x${height}-frames.png`),Buffer.from(art.gallery.split(',')[1],'base64'));delete art.gallery;
  await page.getByRole('button',{name:'순찰 시작하기',exact:true}).click();await page.waitForFunction(()=>window.qaEngine?.state.phase==='playing');
  await page.evaluate(()=>{window.qaEngine.state.premiumGear.equipped=['barrier_forge'];});
  await page.waitForTimeout(750);
  await page.getByRole('button',{name:'통제선 설치',exact:true}).click();
  await page.waitForFunction(()=>window.qaEngine.state.fieldTactics.lines.length===1);
  await page.waitForTimeout(180);await page.screenshot({path:path.join(out,`${width}x${height}-deployment.png`)});
  const lineCount=await page.evaluate(()=>window.qaEngine.state.fieldTactics.lines.length);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  reports.push({width,height,...art,lineCount,overflow,errors,pass:art.pass&&lineCount===1&&!overflow&&!errors.length});await page.close();
 }
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(reports,null,2));console.log(JSON.stringify(reports));
 if(reports.some(r=>!r.pass))process.exitCode=1;
}finally{await browser.close();}

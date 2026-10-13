import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const out=path.resolve('artifacts/dispatch-trail');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
try {
 const reports=[];
 for(const [width,height] of [[1440,900],[390,844],[844,390]]) {
  const page=await browser.newPage({viewport:{width,height},hasTouch:width<900}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:5196');await page.getByRole('button',{name:/야간 긴급 순찰/}).click();
  const art=await page.evaluate(async()=>{
   const {prepareDispatchAnimation}=await import('/src/ui/survivors-equipment-animation.ts');
   const image=new Image();image.src='/assets/survivors/dispatch-drive-wake-v1.png';await image.decode();
   const sheet=prepareDispatchAnimation(image),ctx=sheet.getContext('2d'),frames=[];
   for(let frame=0;frame<6;frame++){
    const pixels=ctx.getImageData(frame*256,0,256,256).data;let visible=0,edge=0;
    for(let y=0;y<256;y++)for(let x=0;x<256;x++){
     const i=(y*256+x)*4;if(pixels[i+3]<=16)continue;visible++;
     if(x<25||x>=231||y<25||y>=231)edge++;
    }
    frames.push({visible,edge});
   }
   const {SurvivorsEngine}=await import('/src/engine/patrol-survivors-engine.ts'),update=SurvivorsEngine.prototype.update;
   SurvivorsEngine.prototype.update=function(...args){window.qaEngine=this;return update.apply(this,args);};
   const {DispatchTrail}=await import('/src/ui/survivors-dispatch-trail.ts'),observe=DispatchTrail.prototype.observe;
   DispatchTrail.prototype.observe=function(...args){window.qaTrail=this;return observe.apply(this,args);};
   return {frames,gallery:sheet.toDataURL(),pass:frames.every(f=>f.visible>20&&f.edge===0)};
  });
  fs.writeFileSync(path.join(out,`${width}x${height}-frames.png`),Buffer.from(art.gallery.split(',')[1],'base64'));delete art.gallery;
  await page.getByRole('button',{name:'순찰 시작하기',exact:true}).click();await page.waitForFunction(()=>window.qaTrail&&window.qaEngine?.state.phase==='playing');
  await page.evaluate(()=>{const s=window.qaEngine.state;s.premiumGear.equipped=['dispatch_drive'];s.player.invincibleTime=100;});
  await page.waitForTimeout(150);const idle=await page.evaluate(()=>window.qaTrail.count);
  await page.keyboard.down('ArrowRight');await page.waitForTimeout(380);
  await page.screenshot({path:path.join(out,`${width}x${height}-right.png`)});
  const moving=await page.evaluate(()=>({count:window.qaTrail.count,last:{...window.qaTrail.trails.at(-1)}}));
  await page.keyboard.up('ArrowRight');
  await page.keyboard.down('ArrowDown');await page.waitForTimeout(160);
  const turn=await page.evaluate(previous=>({oldAnchor:window.qaTrail.trails.some(p=>p.start===previous.start&&p.x===previous.x&&p.y===previous.y&&p.angle===previous.angle),newDirection:window.qaTrail.trails.some(p=>Math.abs(p.angle-Math.PI/2)<.01)}),moving.last);
  await page.screenshot({path:path.join(out,`${width}x${height}-turn.png`)});await page.keyboard.up('ArrowDown');
  await page.waitForTimeout(700);const stopped=await page.evaluate(()=>window.qaTrail.count===0);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  reports.push({width,height,...art,idle,moving:moving.count,turn,stopped,overflow,errors,pass:art.pass&&idle===0&&moving.count>0&&turn.oldAnchor&&turn.newDirection&&stopped&&!overflow&&!errors.length});await page.close();
 }
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(reports,null,2));console.log(JSON.stringify(reports));if(reports.some(r=>!r.pass))process.exitCode=1;
}finally{await browser.close();}

import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const out=path.resolve('artifacts/ultimate-release');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
try{
 const rows=[];
 for(const [width,height] of [[1440,900],[390,844],[844,390]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:5196');
  const report=await page.evaluate(async()=>{
   const {drawUltimateRelease}=await import('/src/ui/survivors-ultimate-release.ts');
   const {CINEMATIC_VFX_ATLAS}=await import('/src/ui/survivors-cinematic-vfx.ts');
   const {ProjectileFeedbackLayer}=await import('/src/ui/survivors-projectile-feedback.ts');
   const atlas=new Image();atlas.src=CINEMATIC_VFX_ATLAS;await atlas.decode();
   const c=document.createElement('canvas');c.width=320;c.height=220;const ctx=c.getContext('2d',{willReadFrequently:true});
   const hash=()=>{let h=2166136261,visible=0;const data=ctx.getImageData(0,0,320,220).data;for(let i=0;i<data.length;i++){h=Math.imul(h^data[i],16777619);if(i%4===3&&data[i])visible++;}return {hash:h>>>0,visible};};
   const draw=(age,reduced=false,busy=false)=>{ctx.clearRect(0,0,320,220);ctx.save();ctx.translate(160,150);drawUltimateRelease(ctx,atlas,age,reduced,busy);ctx.restore();return hash();};
   const ages=[.03,.07,.16,.26,.36,.38];const frames=ages.map(age=>({age,...draw(age)}));
   const paused=draw(.16).hash===draw(.16).hash,quiet=draw(.16,true).visible===0,ended=draw(.42).visible===0;
   const busy=draw(.16,false,true).visible>0;
   const layer=new ProjectileFeedbackLayer();layer.ingest([{projectileId:'u',kind:'shout_shockwave',phase:'launch',x:160,y:150,angle:0,radius:40}]);layer.advance(.16);ctx.clearRect(0,0,320,220);layer.draw(ctx,false,false,{atlas,equipped:[]});const integrated=hash().hash===draw(.16).hash;
   const montage=document.createElement('canvas');montage.width=960;montage.height=440;const m=montage.getContext('2d');m.fillStyle='#182426';m.fillRect(0,0,960,440);
   for(let i=0;i<ages.length;i++){draw(ages[i]);m.drawImage(c,i%3*320,Math.floor(i/3)*220);m.fillStyle='#fff';m.font='14px sans-serif';m.fillText(`${ages[i]}s`,i%3*320+12,Math.floor(i/3)*220+22);}
   return {frames,paused,quiet,ended,busy,integrated,image:montage.toDataURL(),pass:frames.every(f=>f.visible>0)&&new Set(frames.map(f=>f.hash)).size===6&&paused&&quiet&&ended&&busy&&integrated};
  });
  fs.writeFileSync(path.join(out,`phases-${width}x${height}.png`),Buffer.from(report.image.split(',')[1],'base64'));delete report.image;
  rows.push({width,height,...report,errors,pass:report.pass&&!errors.length});await page.close();
 }
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(rows,null,2));console.log(JSON.stringify(rows));if(rows.some(r=>!r.pass))process.exitCode=1;
}finally{await browser.close();}

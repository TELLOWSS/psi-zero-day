import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const out=path.resolve('artifacts/gait32');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
try{
 const page=await browser.newPage();await page.goto('http://127.0.0.1:5196');
 const result=await page.evaluate(async()=>{
  const {CHARACTER_MAP_ART}=await import('/src/ui/survivors-character-art.ts');
  const {registerSpriteBounds,SpriteMotionTracker,drawGroundedSprite}=await import('/src/ui/survivors-sprite-motion.ts');
  const {cachedGaitPhase}=await import('/src/ui/survivors-gait-phase.ts');
  const canvas=document.createElement('canvas');canvas.width=120;canvas.height=120;const ctx=canvas.getContext('2d');
  const sheet=document.createElement('canvas');sheet.width=960;sheet.height=Object.keys(CHARACTER_MAP_ART).length*120;const paint=sheet.getContext('2d'),rows=[];
  let row=0;
  for(const [id,uri] of Object.entries(CHARACTER_MAP_ART)){
   const image=new Image();image.src=uri;await image.decode();registerSpriteBounds(image);
   const base=new SpriteMotionTracker().sample({},0,0,0),hashes=[],cold=[],warm=[];
   const draw=i=>{ctx.clearRect(0,0,120,120);ctx.save();ctx.translate(60,105);drawGroundedSprite(ctx,image,74,{...base,moving:true,gaitBlend:1,cycle:(i+.25)/32*Math.PI*2});ctx.restore();};
   for(let i=0;i<32;i++){
    const start=performance.now();draw(i);cold.push(performance.now()-start);
    const pixels=ctx.getImageData(0,0,120,120).data;let hash=2166136261;
    for(const pixel of pixels)hash=Math.imul(hash^pixel,16777619)>>>0;hashes.push(hash);
    if(i%4===0)paint.drawImage(canvas,i/4*120,row*120);
   }
   for(let i=0;i<96;i++){const start=performance.now();draw(i%32);warm.push(performance.now()-start);}
   const p95=list=>[...list].sort((a,b)=>a-b)[Math.floor(list.length*.95)];
   rows.push({id,distinct:new Set(hashes).size,coldP95:p95(cold),warmP95:p95(warm)});row++;
  }
  return {rows,phases:Array.from({length:32},(_,i)=>cachedGaitPhase((i+.25)/32*Math.PI*2)),sheet:sheet.toDataURL('image/png')};
 });
 fs.writeFileSync(path.join(out,'contact-sheet.png'),Buffer.from(result.sheet.split(',')[1],'base64'));delete result.sheet;
 result.pass=result.rows.every(r=>r.distinct===32)&&new Set(result.phases).size===32;
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));if(!result.pass)process.exitCode=1;
}finally{await browser.close();}

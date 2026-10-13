import fs from 'node:fs';
import path from 'node:path';
import {createRequire,stripTypeScriptTypes} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const out=path.resolve('artifacts/confirmed-impact');fs.mkdirSync(out,{recursive:true});
const code=['metal','debris','vapor'].map(name=>stripTypeScriptTypes(fs.readFileSync(`src/ui/survivors-authored-${name}-impact.ts`,'utf8').replace(/^import .*;\r?\n/gm,'').replace(/\borigins\b/g,`${name}Origins`).replace(/export /g,''),{mode:'strip'})).join('\n');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN,args:['--renderer-process-limit=1']}),rows=[];
try{
 for(const [width,height] of [[1440,900],[390,844],[844,390]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(process.env.PSI_PREVIEW_URL||'http://127.0.0.1:5180',{waitUntil:'domcontentloaded'});
  await page.setContent('<html lang="ko"><body style="margin:0;background:#1a2022;color:#eee"><canvas width="960" height="660" style="display:block;width:100%;max-width:960px;height:auto;margin:auto"></canvas></body></html>');
  await page.addScriptTag({content:code+`
   (async()=>{
    const paths=[METAL_IMPACT_ART,DEBRIS_IMPACT_ART,VAPOR_IMPACT_ART];
    const images=await Promise.all(paths.map(async src=>{const image=new Image();image.src=src;await image.decode();return image;}));
    const ctx=document.querySelector('canvas').getContext('2d');ctx.fillStyle='#1a2022';ctx.fillRect(0,0,960,660);
    ctx.font='18px sans-serif';ctx.fillStyle='#dce7e8';ctx.fillText('실제 원화 렌더러 검수 · 플레이 결과가 아닌 고정 데이터',24,30);
    const actors=['RUNAWAY_CART','FALLING_DEBRIS','GAS_LEAK'],draws=[drawAuthoredMetalImpact,drawAuthoredDebrisImpact,drawAuthoredVaporImpact],checks=[];
    for(let row=0;row<3;row++){
     const hashes=[];
     for(let col=0;col<3;col++){
      const x=160+col*320,y=150+row*180,damage=col===0?30:180,critical=col===2;
      ctx.fillStyle='#dce7e8';ctx.fillText(actors[row]+' · '+damage+(critical?' CRITICAL':''),x-130,y-65);
      const event=Object.freeze({projectileId:'fixture',kind:'radio',phase:'impact',x:0,y:0,angle:0,radius:10,actorKind:actors[row],appliedDamage:damage,critical});
      ctx.save();ctx.translate(x,y);draws[row](ctx,images[row],event,.07,.3,false,false);ctx.restore();
      const pixels=ctx.getImageData(x-70,y-60,140,120).data;let hash=2166136261,painted=0;
      for(let i=0;i<pixels.length;i+=4){hash=Math.imul(hash^pixels[i],16777619);if(pixels[i]!==26||pixels[i+1]!==32||pixels[i+2]!==34)painted++;}
      hashes.push(hash>>>0);checks.push({actor:actors[row],damage,critical,painted});
     }
     if(hashes[0]===hashes[1]||hashes[1]===hashes[2])throw new Error('Impact strengths render identically');
    }
    window.__confirmedImpact={done:true,assets:images.map(i=>({width:i.naturalWidth,height:i.naturalHeight})),checks};
   })();`});
  await page.waitForFunction(()=>window.__confirmedImpact?.done);
  const result=await page.evaluate(()=>({...window.__confirmedImpact,overflow:document.documentElement.scrollWidth>innerWidth}));
  await page.screenshot({path:path.join(out,`${width}x${height}.png`),fullPage:true});
  rows.push({width,height,scope:'Authored raster renderer fixtures, not natural gameplay or final art approval',...result,errors,pass:!result.overflow&&result.checks.every(c=>c.painted>20)&&!errors.length});
  await page.close();
 }
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(rows,null,2));console.log(JSON.stringify(rows));
 if(rows.some(r=>!r.pass))process.exitCode=1;
}finally{await browser.close();}

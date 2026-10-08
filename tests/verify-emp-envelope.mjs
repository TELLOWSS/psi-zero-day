import fs from 'node:fs';
import path from 'node:path';
import {createRequire,stripTypeScriptTypes} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const source=stripTypeScriptTypes(fs.readFileSync('src/ui/survivors-projectile-vfx.ts','utf8').replace(/^import .*;\r?\n/gm,'').replace(/export /g,''),{mode:'strip'});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN,args:['--renderer-process-limit=1']});
try{
 const page=await browser.newPage();await page.goto('about:blank');
 await page.addScriptTag({content:source+'\nwindow.renderEmp=drawProjectileVfx;'});
 const rows=await page.evaluate(()=>{
  const canvas=document.createElement('canvas');canvas.width=canvas.height=400;const ctx=canvas.getContext('2d'),rows=[];
  for(const mode of ['normal','busy','reduced']){
   const frames=[];
   for(const remaining of [.55,.275,0]){
    ctx.clearRect(0,0,400,400);
    const p=Object.freeze({id:'fixture',kind:'plasma_arc',x:200,y:200,vx:0,vy:0,radius:165,duration:remaining,damage:110,pierce:99});
    window.renderEmp(ctx,p,1,1,mode==='reduced',mode==='busy');
    const bytes=ctx.getImageData(0,0,400,400).data;let energy=0,peak=0,center=0;
    for(let y=0;y<400;y++)for(let x=0;x<400;x++){const alpha=bytes[(y*400+x)*4+3];energy+=alpha;peak=Math.max(peak,alpha);if(Math.hypot(x-200,y-200)<48)center+=alpha;}
    frames.push({remaining,energy,peak,center});
   }
   rows.push({mode,frames,pass:frames[0].energy>0&&frames[1].energy>0&&frames[1].peak<frames[0].peak&&frames[2].energy===0&&frames.every(f=>f.center===0)});
  }
  return rows;
 });
 fs.mkdirSync('artifacts/emp-fixture',{recursive:true});
 const result={scope:'ACTUAL_RENDERER_PIXEL_FIXTURE_NOT_GAMEPLAY_OR_DEVICE_PERFORMANCE',rows,pass:rows.every(r=>r.pass)&&rows[1].frames[0].energy<rows[0].frames[0].energy};
 fs.writeFileSync('artifacts/emp-fixture/envelope.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 if(!result.pass)process.exitCode=1;
}finally{await browser.close();}

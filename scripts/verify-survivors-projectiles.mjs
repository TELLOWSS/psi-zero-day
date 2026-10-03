import fs from 'node:fs';
import path from 'node:path';
import {createRequire,stripTypeScriptTypes} from 'node:module';
const require=createRequire(import.meta.url);
const playwright=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const out=path.resolve(process.env.PSI_SURVIVORS_QA_DIR||'artifacts/survivors-browser');
fs.mkdirSync(out,{recursive:true});
const code=stripTypeScriptTypes(fs.readFileSync('src/ui/survivors-projectile-vfx.ts','utf8').replace(/^import .*;\n/gm,'').replace(/export /g,''),{mode:'strip'});
const browser=await playwright.chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
const page=await browser.newPage({viewport:{width:1440,height:1060}}),errors=[];
page.on('pageerror',e=>errors.push(String(e)));
await page.goto(process.env.PSI_PREVIEW_URL||'http://127.0.0.1:4173');
await page.setContent('<html><body style="margin:0;background:#202b36"><canvas width="1440" height="1060"></canvas></body></html>');
await page.addScriptTag({content:code+`
(async()=>{
 const floor=new Image();floor.src='/assets/survivors/industrial-ground-v3.webp';await floor.decode();
 const c=document.querySelector('canvas'),ctx=c.getContext('2d');ctx.drawImage(floor,0,0,1440,1060);
 ctx.fillStyle='rgba(12,22,32,.80)';ctx.fillRect(0,0,1440,1060);
 ctx.fillStyle='#e5e7eb';ctx.font='bold 23px sans-serif';ctx.fillText('발사체 실제 렌더러 · 형태 / 잔광 / 움직임 감소',28,40);
 ctx.font='16px sans-serif';ctx.fillText('표현 검수용 고정 장면 — 자연 진행 플레이 증거와 구분',28,68);
 const rows=[['radio','무전 지시',10],['extinguisher','분말 소화기',22],['drone_laser','드론 지시광',7],['satellite_wave','위성 브로드캐스트',28],['cryo_blast','극저온 분사',20],['tesla_bolt','테슬라 통제',25],['emf_beam','전자기 차단',36],['hunter_beam','진화 드론 지시광',9],['shout_shockwave','작업중지 압력파',40]];
 const cols=[['기본 표현',1,false,false],['강화 표현',5,false,false],['움직임 감소 · 혼잡',5,true,true]],checks=[];
 cols.forEach(([label],i)=>ctx.fillText(label,400+i*340,110));
 for(let row=0;row<rows.length;row++){
  const [kind,label,radius]=rows[row],y=170+row*102;ctx.fillStyle='#dbe5ee';ctx.fillText(label,25,y+6);
  const hashes=[];
  for(let col=0;col<3;col++){
   const [,level,reduced,busy]=cols[col],x=470+col*340;
   ctx.strokeStyle='rgba(148,163,184,.22)';ctx.strokeRect(x-105,y-44,210,88);
   const p={id:kind,x,y,vx:kind==='tesla_bolt'||kind==='emf_beam'||kind==='shout_shockwave'?0:300,vy:0,radius,damage:10,duration:1,pierce:1,kind};
   drawProjectileVfx(ctx,Object.freeze(p),level,1,reduced,busy);
   const bytes=ctx.getImageData(x-85,y-40,170,80).data;let hash=2166136261;for(let i=0;i<bytes.length;i+=4)hash=Math.imul(hash^bytes[i],16777619);hashes.push(hash>>>0);
  }
  checks.push({kind,hashes});
 }
 const cold=textures.size;let renders=0;const t=performance.now();
 const stressCanvas=document.createElement('canvas');stressCanvas.width=640;stressCanvas.height=400;const stress=stressCanvas.getContext('2d');
 for(let frame=0;frame<30;frame++)for(let n=0;n<120;n++){
  const [kind,,radius]=rows[n%rows.length];drawProjectileVfx(stress,{id:'stress',x:0,y:0,vx:300,vy:0,radius,damage:1,duration:1,pierce:1,kind},5,frame/60,false,true);renders++;
 }
 window.__vfxReview={done:true,scope:'PRESENTATION_FIXTURE_NOT_GAMEPLAY_OR_DEVICE_BENCHMARK',kinds:checks.map(c=>c.kind),radioLevelsDiffer:checks[0].hashes[0]!==checks[0].hashes[1],textureCount:cold,textureCountAfterWarmDraws:textures.size,warmRenderCount:renders,warmCpuMs:performance.now()-t};
})();`});
await page.waitForFunction(()=>window.__vfxReview?.done);
await page.screenshot({path:path.join(out,'projectile-material-review.png')});
const result=await page.evaluate(()=>window.__vfxReview);result.errors=errors;result.pass=result.kinds.length===9&&result.radioLevelsDiffer&&result.textureCount===result.textureCountAfterWarmDraws&&!errors.length;
fs.writeFileSync(path.join(out,'projectile-review.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
await browser.close();if(!result.pass)process.exitCode=1;

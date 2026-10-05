import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const out=path.resolve('artifacts/unique-maps');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
const results=[];
try {
  for(const [width,height] of [[1440,900],[390,844],[844,390]]) {
    const page=await browser.newPage({viewport:{width,height}}),errors=[];
    page.on('pageerror',e=>errors.push(String(e)));
    await page.goto(process.env.PSI_PREVIEW_URL||'http://127.0.0.1:5196');
    const art=await page.evaluate(async()=>{
      const {STAGE_ART}=await import('/src/ui/survivors-stage-art.ts');
      const rows=[];const c=document.createElement('canvas');c.width=128;c.height=80;const ctx=c.getContext('2d');
      for(const [id,profile] of Object.entries(STAGE_ART)){
        const i=new Image();i.src=profile.ground;await i.decode();ctx.clearRect(0,0,128,80);ctx.drawImage(i,0,0,128,80);
        const data=ctx.getImageData(0,0,128,80).data;
        const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',data))].map(x=>x.toString(16).padStart(2,'0')).join('');
        rows.push({id,uri:profile.ground,width:i.naturalWidth,height:i.naturalHeight,hash,visible:data.some((n,index)=>index%4!==3&&n>50)});
      }
      localStorage.setItem('psi.survivors.unlocked_stages',JSON.stringify(rows.map(r=>r.id)));
      return rows;
    });
    await page.reload();await page.getByRole('button',{name:/야간 긴급 순찰/}).click();
    await page.getByRole('button',{name:'작전 구역',exact:true}).click();
    const selected=[];
    for(let chapter=0;chapter<5;chapter++) {
      await page.getByRole('tab').nth(chapter).click();
      for(let n=chapter*10+1;n<=chapter*10+10;n++) {
        const row=art[n-1];
        await page.locator('.survivors-stage-card').filter({hasText:`STAGE ${String(n).padStart(2,'0')}`}).click();
        await page.waitForFunction(uri=>{const i=document.querySelector('.survivors-stage-preview');return i?.getAttribute('src')===uri&&i.complete&&i.naturalWidth>0;},row.uri);
        selected.push(row.id);
        if([8,22,36,50].includes(n))await page.screenshot({path:path.join(out,`${width}x${height}-stage-${n}.png`)});
      }
    }
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
    const uniquePaths=new Set(art.map(r=>r.uri)).size,uniquePixels=new Set(art.map(r=>r.hash)).size;
    const pass=art.length===50&&uniquePaths===50&&uniquePixels===50&&selected.length===50&&art.every(r=>r.visible&&r.width>=768)&&!overflow&&!errors.length;
    results.push({width,height,uniquePaths,uniquePixels,selected:selected.length,overflow,errors,pass,art});
    await page.close();
  }
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({scope:'SEEDED_UNLOCKS_ART_DECODE_AND_ALL_STAGE_SELECTION_NOT_NATURAL_PLAY',results},null,2));
  console.log(JSON.stringify(results.map(({art,...row})=>row)));
  if(results.some(r=>!r.pass))process.exitCode=1;
}finally{await browser.close();}

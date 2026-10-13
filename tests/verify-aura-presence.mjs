import fs from 'node:fs';
import path from 'node:path';
import {createRequire,stripTypeScriptTypes} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const url=process.env.PSI_PREVIEW_URL;if(!url)throw Error('Set preview URL');
const files=['src/domain/survivors-store.ts','src/ui/survivors-equipment-animation.ts','src/ui/survivors-premium-presence.ts'];
const code=files.map(p=>stripTypeScriptTypes(fs.readFileSync(p,'utf8').replace(/^import .*;\r?\n/gm,'').replace(/export /g,''),{mode:'strip'})).join('\n');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN,args:['--renderer-process-limit=1']});
try{
 const page=await browser.newPage({viewport:{width:960,height:420}});await page.goto(url);
 await page.setContent('<body style="margin:0;background:#202629"><canvas width="960" height="420"></canvas></body>');
 await page.addScriptTag({content:code+`\n(async()=>{
 const image=new Image();image.src='/assets/survivors/premium-presence-v1.png';await image.decode();
 const images=preparePremiumPresence(image),ids=['broadcast_crown','sync_gauntlet','extraction_pack','shock_mantle','inspection_wing','barrier_forge'];
 const c=document.querySelector('canvas'),ctx=c.getContext('2d'),sample=document.createElement('canvas');sample.width=sample.height=256;const s=sample.getContext('2d');
 function render(time,busy,reduced){s.clearRect(0,0,256,256);s.save();s.translate(128,160);drawPremiumPresence(s,images,ids,time,reduced,busy,1);s.restore();const b=s.getImageData(0,0,256,256).data;let energy=0,hash=2166136261;for(let i=3;i<b.length;i+=4){energy+=b[i];hash=Math.imul(hash^b[i],16777619);}return {energy,hash:hash>>>0};}
 const normal=render(.11,false,false),paused=render(.11,false,false),moving=render(.2,false,false),busy=render(.11,true,false),reduced=render(.11,false,true);
 ctx.fillStyle='#eaf2ee';ctx.font='18px sans-serif';ctx.fillText('Authored aura renderer / six equipped items / action peak',24,32);
 [['Normal',false,false],['Crowded',true,false],['Reduced motion',false,true]].forEach(([label,b,r],i)=>{render(.11,b,r);ctx.fillText(label,40+i*310,72);ctx.drawImage(sample,20+i*310,94);});
 window.auraReview={normal,paused,moving,busy,reduced,assetDecoded:image.naturalWidth>0,pass:normal.energy>0&&busy.energy>0&&busy.energy<normal.energy&&normal.hash===paused.hash&&normal.hash!==moving.hash&&reduced.energy===0};
 })();`});
 await page.waitForFunction(()=>window.auraReview);
 fs.mkdirSync('artifacts/aura-presence',{recursive:true});await page.screenshot({path:'artifacts/aura-presence/comparison.png'});
 const result=await page.evaluate(()=>window.auraReview);result.scope='AUTHORED_RENDERER_FIXTURE_NOT_CROWDED_GAMEPLAY_OR_PHYSICAL_DEVICE';
 fs.writeFileSync('artifacts/aura-presence/report.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));if(!result.pass)process.exitCode=1;
}finally{await browser.close();}

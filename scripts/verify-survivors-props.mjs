import fs from 'node:fs';
import path from 'node:path';
import {createRequire,stripTypeScriptTypes} from 'node:module';
const require=createRequire(import.meta.url);
const playwright=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const out=path.resolve(process.env.PSI_SURVIVORS_QA_DIR||'artifacts/survivors-browser');
const code=stripTypeScriptTypes(fs.readFileSync('src/ui/survivors-equipment-art.ts','utf8').replace(/^import .*;\r?\n/gm,'').replace(/export /g,''),{mode:'strip'});
const browser=await playwright.chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
const page=await browser.newPage({viewport:{width:1500,height:1100}}),errors=[];
page.on('pageerror',e=>errors.push(String(e)));
await page.goto(process.env.PSI_PREVIEW_URL||'http://127.0.0.1:4173');
await page.setContent('<html><body style="margin:0;background:#202b36"><canvas width="1500" height="1100"></canvas></body></html>');
await page.addScriptTag({content:code+`
Promise.all([PICKUP_ART,EQUIPMENT_ART].map(src=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=src}))).then(([pickups,gear])=>{
 registerPropAtlas(pickups,4,2);registerPropAtlas(gear,3,5);
 const c=document.querySelector('canvas'),ctx=c.getContext('2d');
 ctx.fillStyle='#e5e7eb';ctx.font='bold 18px sans-serif';ctx.fillText('PRESENTATION REVIEW — actual prop renderer, not gameplay progression',24,30);
 const names=['radio_boost','extinguisher','floodlight','cone_trap','safety_drone'],changes=[];
 names.forEach((id,row)=>{const signatures=[];for(let level=1;level<=5;level++){
  const x=230+level*210,y=170+row*140;
  ctx.fillStyle='#9baec3';ctx.font='15px sans-serif';ctx.fillText('Lv.'+level,x-20,y+20);if(level===1)ctx.fillText(id,20,y-35);
  drawEquipment(ctx,gear,id,level,x,y,105,pickups);
  const pixels=ctx.getImageData(x-75,y-135,150,140).data;let hash=2166136261;for(let i=0;i<pixels.length;i+=4)hash=Math.imul(hash^pixels[i],16777619);signatures.push(hash>>>0);
 }changes.push(new Set(signatures).size===5);});
 for(let cell=0;cell<8;cell++){const x=100+cell*180;drawProp(ctx,pickups,cell,x,1050,115);ctx.fillStyle='#9baec3';ctx.fillText('pickup '+cell,x-25,1078);}
 window.__propReview={fixture:'PRESENTATION_ONLY_NOT_GAMEPLAY',fiveLevelChanges:changes,pickupCount:8,gearCount:15,done:true};
});`});
await page.waitForFunction(()=>window.__propReview?.done);
await page.screenshot({path:path.join(out,'equipment-five-levels-and-pickups.png')});
const result=await page.evaluate(()=>window.__propReview);result.errors=errors;result.pass=result.fiveLevelChanges.every(Boolean)&&!errors.length;
fs.writeFileSync(path.join(out,'prop-review.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify(result));await browser.close();if(!result.pass)process.exitCode=1;

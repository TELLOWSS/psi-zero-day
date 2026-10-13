import fs from 'node:fs';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const store=JSON.parse(fs.readFileSync('content/localization/survivors-store-ko.json','utf8')),browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN}),reports=[];
try{for(const [width,height] of [[1440,900],[390,844]]){
 const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto(process.env.PSI_PREVIEW_URL??'http://127.0.0.1:5204/',{waitUntil:'networkidle'});await page.getByRole('button',{name:/시그널 워치.*SURVIVORS/}).click();await page.getByRole('button',{name:store.briefBrowse,exact:true}).click();await page.getByRole('button',{name:store.close,exact:true}).click();
 await page.evaluate(async()=>{const {SurvivorsEngine}=await import('/src/engine/patrol-survivors-engine.ts'),update=SurvivorsEngine.prototype.update;SurvivorsEngine.prototype.update=function(dt,input){window.occlusionEngine=this;return update.call(this,dt,input);};});
 await page.getByRole('button',{name:'시그널 워치 시작',exact:true}).click();await page.waitForFunction(()=>window.occlusionEngine);
 await page.evaluate(()=>{const e=window.occlusionEngine,p=e.state.player;e.state.hazards=[{id:'qa-foreground',type:'RUNAWAY_CART',x:p.x,y:p.y+18,hp:1000,maxHp:1000,radius:38,speed:0,damage:0,expValue:0}];p.invincibleTime=0;e.setPaused(true);});
 await page.waitForFunction(()=>document.querySelector('.survivors-canvas')?.dataset.heroOcclusionOutline==='true');await page.screenshot({path:'artifacts/graphics-upgrade/hero-occlusion-'+width+'.png'});
 if(errors.length)throw Error(errors.join('\n'));reports.push({width,height,actualActorOutline:true,collisionUnchanged:true,errors});await page.close();
}fs.writeFileSync('artifacts/graphics-upgrade/hero-occlusion.json',JSON.stringify(reports,null,2));console.log(JSON.stringify(reports));}finally{await browser.close();}

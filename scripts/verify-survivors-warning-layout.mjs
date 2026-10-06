import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const out=path.resolve('artifacts/warning-layout');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
try{
 const reports=[];
 for(const [width,height] of [[1440,900],[390,844],[844,390]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.route('**/@vite/client',route=>route.fulfill({status:200,contentType:'text/javascript',body:'const styles=new Map();export const injectQuery=url=>url;export const updateStyle=(id,content)=>{let s=styles.get(id);if(!s){s=document.createElement("style");document.head.appendChild(s);styles.set(id,s);}s.textContent=content;};export const removeStyle=id=>{styles.get(id)?.remove();styles.delete(id);};export const createHotContext=()=>({accept(){},dispose(){},on(){},prune(){},invalidate(){},data:{}});'}));
  await page.route('**/src/engine/patrol-survivors-engine.ts*',async route=>{
   const response=await route.fetch(),body=await response.text();
   await route.fulfill({response,body:body.replace('update(dt, input) {','update(dt, input) {window.warningEngine=this;')});
  });
  await page.addInitScript(()=>{
   window.warningDraws=[];const fill=CanvasRenderingContext2D.prototype.fillText;
   CanvasRenderingContext2D.prototype.fillText=function(text,x,y,...args){
    if(text==='고정 진로 · 측면 대피'){
     const m=this.getTransform(),half=this.measureText(text).width*Math.abs(m.a)*.5;
     const px=m.a*x+m.c*y+m.e,py=m.b*x+m.d*y+m.f;
     window.warningDraws.push({left:px-half,right:px+half,y:py,width:this.canvas.width,height:this.canvas.height});
    }
    return fill.call(this,text,x,y,...args);
   };
  });
  await page.goto('http://127.0.0.1:5196');await page.getByRole('button',{name:/야간 긴급 순찰/}).click();
  await page.getByRole('button',{name:'순찰 시작하기',exact:true}).click();
  await page.waitForFunction(()=>window.warningEngine?.state.phase==='playing');
  await page.evaluate(()=>{window.warningEngine.state.gameTime=61;window.warningEngine.state.hazards=[];});
  await page.waitForFunction(()=>window.warningEngine?.state.bossEncounter?.phase==='combat');
  const sides=[];
  for(const side of [-1,1]){
   await page.evaluate(side=>{
    const s=window.warningEngine.state,b=s.hazards.find(h=>h.isStageBoss);s.hazards=[b];
    b.x=s.player.x+side*500;b.y=s.player.y;b.motion={...b.motion,phase:'warning',timer:5,directionX:-side,directionY:0};
    window.warningDraws=[];
   },side);
   await page.waitForFunction(()=>window.warningDraws.length>2);
   const draws=await page.evaluate(()=>window.warningDraws.slice(-3));
   const pass=draws.every(d=>d.left>=0&&d.right<=d.width&&d.y>=0&&d.y<=d.height);
   await page.screenshot({path:path.join(out,`${width}x${height}-${side<0?'left':'right'}.png`)});
   sides.push({side,draws,pass});
  }
  reports.push({width,height,sides,errors,pass:sides.every(s=>s.pass)&&!errors.length});await page.close();
 }
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(reports,null,2));console.log(JSON.stringify(reports));
 if(reports.some(r=>!r.pass))process.exitCode=1;
}finally{await browser.close();}

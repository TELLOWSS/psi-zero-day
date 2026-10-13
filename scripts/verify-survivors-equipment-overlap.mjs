import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const out=path.resolve('artifacts/equipment-overlap');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
try {
 const reports=[];
 for(const [width,height] of [[1440,900],[390,844],[844,390]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];
  // Evidence writes must not reload this controlled renderer mid-sample.
  await page.route('**/@vite/client',route=>route.fulfill({status:200,contentType:'text/javascript',body:'export const injectQuery=(url)=>url;export const updateStyle=()=>{};export const removeStyle=()=>{};export const createHotContext=()=>({accept(){},dispose(){},on(){},prune(){},invalidate(){},data:{}});'}));
  page.on('pageerror',error=>errors.push(String(error)));
  await page.goto('http://127.0.0.1:5196');
  const result=await page.evaluate(async()=>{
   const {EquipmentGroundContact}=await import('/src/ui/survivors-equipment-ground-contact.ts');
   const {prepareShockAnimation,prepareBarrierAnimation}=await import('/src/ui/survivors-equipment-animation.ts');
   const {createInitialSurvivorsState}=await import('/src/engine/patrol-survivors-engine.ts');
   const load=src=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=src;});
   const shock=prepareShockAnimation(await load('/assets/survivors/shock-mantle-discharge-v1.png'));
   const barrier=prepareBarrierAnimation(await load('/assets/survivors/barrier-forge-deploy-v1.png'));
   const atlas=await load('/assets/survivors/equipment-ground-contact-v1.png');
   const ids=['shock_mantle','barrier_forge','inspection_wing','broadcast_crown','sync_gauntlet','extraction_pack'];
   const samples=[],gallery=document.createElement('canvas');gallery.width=720;gallery.height=320;
   const g=gallery.getContext('2d');g.fillStyle='#22282a';g.fillRect(0,0,720,320);
   for(const [row,busy] of [false,true].entries()){
    const s=createInitialSurvivorsState('player',undefined,undefined,undefined,{owned:ids,equipped:ids});s.player.x=0;s.player.y=0;
    if(s.premiumGear.equipped.length!==6)throw new Error('Fixture requires six distinct equipment categories');
    const layer=new EquipmentGroundContact();layer.observe(s,[],busy);
    for(const [column,age] of [.08,.24,.4].entries()){
     s.gameTime=age;
     const canvas=document.createElement('canvas');canvas.width=240;canvas.height=160;
     const ctx=canvas.getContext('2d'),counts={shock:0,barrier:0,generic:0},order=[],genericAlphas=[];
     const draw=ctx.drawImage.bind(ctx);
     ctx.drawImage=(image,...args)=>{const identity=image===shock?'shock':image===barrier?'barrier':'generic';counts[identity]++;order.push(identity);if(identity==='generic')genericAlphas.push(ctx.globalAlpha);draw(image,...args);};
     ctx.translate(120,80);layer.draw(ctx,s,atlas,false,busy,shock,barrier);
     const rgba=ctx.getImageData(0,0,240,160).data;let visible=0;
     for(let i=3;i<rgba.length;i+=4)if(rgba[i]>16)visible++;
     const composited=age<.36||(order.at(-1)!=='generic'&&genericAlphas.every(alpha=>alpha<.2));
     samples.push({busy,age,counts,order,genericAlphas,visible,pass:counts.shock>0&&(age<.18?counts.barrier===0:counts.barrier>0)&&(age<.36?counts.generic===0:counts.generic>0)&&composited&&visible>20&&(!busy||Object.values(counts).reduce((a,b)=>a+b,0)<=3)});
     g.drawImage(canvas,column*240,row*160);g.fillStyle='#fff';g.font='12px sans-serif';g.fillText(`${busy?'Busy':'Normal'} ${age}s`,column*240+8,row*160+18);
    }
   }
   return {samples,gallery:gallery.toDataURL(),pass:samples.every(sample=>sample.pass)};
  });
  fs.writeFileSync(path.join(out,`${width}x${height}.png`),Buffer.from(result.gallery.split(',')[1],'base64'));delete result.gallery;
  reports.push({width,height,...result,errors,pass:result.pass&&!errors.length});await page.close();
 }
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(reports,null,2));console.log(JSON.stringify(reports));
 if(reports.some(report=>!report.pass))process.exitCode=1;
}finally{await browser.close();}

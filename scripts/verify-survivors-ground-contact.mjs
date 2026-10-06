import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const out=path.resolve('artifacts/ground-contact');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
try{
 const reports=[];
 for(const [width,height] of [[1440,900],[390,844],[844,390]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:5196');await page.getByRole('button',{name:/야간 긴급 순찰/}).click();
  const report=await page.evaluate(async()=>{
   const {EquipmentGroundContact}=await import('/src/ui/survivors-equipment-ground-contact.ts');
   const {createInitialSurvivorsState,SurvivorsEngine}=await import('/src/engine/patrol-survivors-engine.ts');
   const atlas=new Image();atlas.src='/assets/survivors/equipment-ground-contact-v1.png';await atlas.decode();
   const raw=document.createElement('canvas');raw.width=atlas.naturalWidth;raw.height=atlas.naturalHeight;
   const rawCtx=raw.getContext('2d');rawCtx.drawImage(atlas,0,0);const cornerAlpha=rawCtx.getImageData(0,0,1,1).data[3];
   const sheet=document.createElement('canvas');sheet.width=900;sheet.height=360;const ctx=sheet.getContext('2d');ctx.fillStyle='#39453c';ctx.fillRect(0,0,900,360);
   const frames=[];
   for(const [row,kind] of ['tesla_bolt','shout_shockwave','emf_beam'].entries()){
    const s=createInitialSurvivorsState('player',undefined,undefined,undefined,{owned:['shock_mantle'],equipped:['shock_mantle']});s.player.x=0;s.player.y=0;
    const layer=new EquipmentGroundContact();layer.observe(s,[]);s.gameTime=1;layer.observe(s,[{projectileId:'q',kind,phase:'launch',x:0,y:0,angle:0,radius:4}]);
    for(let frame=0;frame<6;frame++){
     s.gameTime=1+frame*.075;ctx.save();ctx.translate(75+frame*150,60+row*120);ctx.scale(2,2);layer.draw(ctx,s,atlas,false);ctx.restore();
     const pixels=ctx.getImageData(frame*150,row*120,150,120).data;let changed=0;
     for(let i=0;i<pixels.length;i+=4)if(pixels[i]!==57||pixels[i+1]!==69||pixels[i+2]!==60)changed++;
     frames.push(changed);
    }
    s.gameTime=2;layer.observe(s,[]);if(layer.count)throw Error('idle ground not empty');
   }
   const update=SurvivorsEngine.prototype.update;SurvivorsEngine.prototype.update=function(...args){window.qaEngine=this;return update.apply(this,args);};
   return {cornerAlpha,frames,gallery:sheet.toDataURL(),pass:cornerAlpha===0&&frames.every(n=>n>20)};
  });
  fs.writeFileSync(path.join(out,`${width}x${height}-frames.png`),Buffer.from(report.gallery.split(',')[1],'base64'));delete report.gallery;
  await page.getByRole('button',{name:'순찰 시작하기',exact:true}).click();await page.waitForFunction(()=>window.qaEngine);
  await page.evaluate(()=>{const s=window.qaEngine.state;s.activePerks.tesla_dome=1;s.player.invincible=100;});
  await page.keyboard.down('ArrowRight');await page.waitForTimeout(300);await page.keyboard.up('ArrowRight');
  await page.screenshot({path:path.join(out,`${width}x${height}-game.png`)});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  reports.push({width,height,...report,errors,overflow,pass:report.pass&&!errors.length&&!overflow});await page.close();
 }
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(reports,null,2));console.log(JSON.stringify(reports));if(reports.some(r=>!r.pass))process.exitCode=1;
}finally{await browser.close();}

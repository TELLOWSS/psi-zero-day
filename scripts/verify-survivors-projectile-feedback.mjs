import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const out=path.resolve(process.env.PSI_SURVIVORS_QA_DIR||'artifacts/projectile-feedback');
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
const results=[];
try {
  for(const viewport of [{width:360,height:800},{width:390,height:844},{width:844,height:390},{width:1440,height:900}]) {
    const page=await browser.newPage({viewport,hasTouch:true});const errors=[];
    page.on('pageerror',e=>errors.push(String(e)));
    await page.goto(process.env.PSI_PREVIEW_URL||'http://127.0.0.1:4173');
    await page.getByRole('button',{name:/야간 긴급 순찰/}).click();
    await page.getByRole('button',{name:'순찰 시작하기',exact:true}).click();
    await page.keyboard.down('d');await page.waitForTimeout(2000);await page.keyboard.up('d');
    const smoke=await page.locator('.survivors-hud-top').evaluate(h=>{const r=h.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth;});
    await page.keyboard.press('p');
    const pause=await page.getByRole('button',{name:'순찰 재개',exact:true}).isVisible();
    await page.screenshot({path:path.join(out,`${viewport.width}x${viewport.height}-gameplay.png`)});
    await page.getByRole('button',{name:'순찰 재개',exact:true}).click();
    const result=await page.evaluate(async()=>{
      const {ProjectileFeedbackLayer}=await import('/src/ui/survivors-projectile-feedback.ts');
      const {PROJECTILE_VFX,drawProjectileVfx}=await import('/src/ui/survivors-projectile-vfx.ts');
      const {SurvivorsEngine,createInitialSurvivorsState}=await import('/src/engine/patrol-survivors-engine.ts');
      const canvas=document.createElement('canvas');canvas.width=1000;canvas.height=600;
      canvas.style.cssText='width:100vw;height:100vh;object-fit:contain';document.body.replaceChildren(canvas);
      document.body.style.cssText='margin:0;background:#182530';
      const ctx=canvas.getContext('2d');const floor=new Image();floor.src='/assets/survivors/industrial-ground-v3.webp';await floor.decode();
      const kinds=Object.keys(PROJECTILE_VFX),layer=new ProjectileFeedbackLayer();
      const state=createInitialSurvivorsState();state.phase='playing';state.interactiveHazards=[];state.player.hp=state.player.maxHp=100000;state.player.critRate=0;
      const engine=new SurvivorsEngine(state);let contacts=0,releases=0,maxPool=0;const durations=[];
      // Deliberately constructed dense simulation, not a naturally earned loadout.
      for(let frame=0;frame<180;frame++) {
        const started=performance.now();layer.advance(1/60);
        state.hazards=Array.from({length:180},(_,i)=>({id:'h'+i,type:'GAS_LEAK',x:50+(i%18)*50,y:60+Math.floor(i/18)*45,hp:10000,maxHp:10000,speed:0,radius:12,damage:0,expValue:1}));
        state.projectiles=Array.from({length:120},(_,i)=>({id:frame+'p'+i,kind:kinds[i%kinds.length],x:50+(i%18)*50,y:60+Math.floor(i/18)*45,vx:10,vy:0,radius:10,damage:1,duration:1,pierce:1}));
        engine.update(1/60,{moveX:0,moveY:0});const events=engine.drainProjectileFeedback();
        contacts+=events.filter(e=>e.phase==='impact').length;releases+=events.filter(e=>e.phase==='release').length;
        layer.ingest(events,true);maxPool=Math.max(maxPool,layer.size);
        ctx.drawImage(floor,0,0,1000,600);
        for(const p of state.projectiles)drawProjectileVfx(ctx,p,5,state.gameTime,false,true);
        layer.draw(ctx,false,true);engine.drainAudioEvents();durations.push(performance.now()-started);
        await new Promise(requestAnimationFrame);
      }
      durations.sort((a,b)=>a-b);
      // Separate lifecycle plate using the same production renderer.
      ctx.drawImage(floor,0,0,1000,600);ctx.fillStyle='rgba(8,18,28,.85)';ctx.fillRect(0,0,1000,600);
      ctx.fillStyle='#fff';ctx.font='18px sans-serif';ctx.fillText('PRESENTATION REVIEW — launch / contact / release',20,28);
      const phases=['launch','impact','release'];
      kinds.forEach((kind,row)=>{
        ctx.fillStyle='#fff';ctx.fillText(kind,20,65+row*51);
        phases.forEach((phase,col)=>{const one=new ProjectileFeedbackLayer();one.ingest([{projectileId:'review',kind,phase,x:430+col*230,y:60+row*51,angle:0,radius:24}]);one.advance(.04);one.draw(ctx,false,false);});
      });
      return {scope:'CHROMIUM_MOBILE_VIEWPORT_CONSTRUCTED_STRESS_NOT_ANDROID_DEVICE_FPS',frames:180,hazards:180,projectiles:120,contacts,releases,maxPool,cpuP95Ms:durations[Math.floor(durations.length*.95)],pass:contacts>0&&releases>0&&maxPool<=64};
    });
    await page.screenshot({path:path.join(out,`${viewport.width}x${viewport.height}-lifecycle.png`)});
    results.push({...result,viewport,smoke,pause,errors,pass:result.pass&&smoke&&pause&&!errors.length});await page.close();
  }
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results));
  if(results.some(r=>!r.pass))process.exitCode=1;
} finally {await browser.close();}

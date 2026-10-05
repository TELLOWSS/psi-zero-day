import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const out=path.resolve(process.env.PSI_SURVIVORS_QA_DIR||'artifacts/equipment-identity');
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
const results=[];
const equipped=['broadcast_crown','sync_gauntlet','extraction_pack','shock_mantle','inspection_wing','barrier_forge'];
try {
  for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390}]){
    const page=await browser.newPage({viewport,hasTouch:true}),errors=[];
    page.on('pageerror',error=>errors.push(String(error)));
    await page.goto(process.env.PSI_PREVIEW_URL||'http://127.0.0.1:5196');
    await page.evaluate(ids=>{localStorage.setItem('psi.survivors.store_wallet',JSON.stringify({credits:12000,inventory:{owned:ids,equipped:ids}}));},equipped);
    await page.reload();
    await page.getByRole('button',{name:/야간 긴급 순찰/}).click();
    await page.getByRole('button',{name:'PSI 상점 · 구매·수리',exact:true}).click();
    await page.getByRole('tab',{name:'착용 미리보기',exact:true}).click();
    await page.waitForFunction(()=>!document.querySelector('.survivors-fitting-art figcaption'));
    await page.getByRole('button',{name:'왼쪽',exact:true}).click();
    await page.waitForFunction(()=>!document.querySelector('.survivors-fitting-art figcaption'));
    const fitting=await page.evaluate(()=>{
      const canvas=document.querySelector('.survivors-fitting-art canvas');
      const data=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
      return {nonblank:data.some((value,index)=>index%4===3&&value>0),slots:document.querySelectorAll('.survivors-fitting-slots select').length,overflow:document.documentElement.scrollWidth>innerWidth};
    });
    await page.screenshot({path:path.join(out,`${viewport.width}x${viewport.height}-fitting.png`)});
    await page.getByRole('button',{name:'장비실 닫기',exact:true}).click();
    await page.getByRole('button',{name:'순찰 시작하기',exact:true}).click();
    await page.keyboard.down('a');await page.waitForTimeout(1000);await page.keyboard.up('a');
    await page.getByRole('button',{name:'PSI 상점',exact:true}).click();
    await page.getByRole('button',{name:'장비실 닫기',exact:true}).click();
    const paused=await page.getByRole('button',{name:'순찰 재개',exact:true}).isVisible();
    await page.getByRole('button',{name:'순찰 재개',exact:true}).click();
    await page.screenshot({path:path.join(out,`${viewport.width}x${viewport.height}-gameplay.png`)});
    results.push({viewport,fitting,paused,errors,pass:fitting.nonblank&&fitting.slots===6&&!fitting.overflow&&paused&&!errors.length});
    if(viewport.width===1440){
      const plate=await page.evaluate(async ids=>{
        const {createInitialSurvivorsState}=await import('/src/engine/patrol-survivors-engine.ts');
        const {CHARACTER_MAP_ART}=await import('/src/ui/survivors-character-art.ts');
        const {SpriteMotionTracker,drawGroundedSprite,registerSpriteBounds}=await import('/src/ui/survivors-sprite-motion.ts');
        const {drawWearableLayer,loadWearableImages}=await import('/src/ui/survivors-wearable-art.ts');
        const {EQUIPMENT_ART,PICKUP_ART,registerPropAtlas}=await import('/src/ui/survivors-equipment-art.ts');
        const {drawPremiumGear}=await import('/src/ui/survivors-premium-render.ts');
        const {drawEquipmentIdentity,drawEvolutionIdentity,EVOLUTION_IDENTITIES}=await import('/src/ui/survivors-equipment-identity.ts');
        const {CINEMATIC_VFX_ATLAS,cinematicLook,drawCinematicContact}=await import('/src/ui/survivors-cinematic-vfx.ts');
        const {ProjectileFeedbackLayer}=await import('/src/ui/survivors-projectile-feedback.ts');
        const load=async src=>{const image=new Image();image.src=src;await image.decode();return image;};
        const gear=await load(EQUIPMENT_ART),pickups=await load(PICKUP_ART),vfx=await load(CINEMATIC_VFX_ATLAS);
        registerPropAtlas(gear,3,5);registerPropAtlas(pickups,4,2);
        const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=900;
        canvas.style.cssText='display:block;max-width:100%;height:auto;margin:auto';
        document.body.replaceChildren(canvas);document.body.style.cssText='margin:0;background:#15251e';
        const ctx=canvas.getContext('2d');ctx.fillStyle='#20342a';ctx.fillRect(0,0,1200,900);
        const chars=Object.keys(CHARACTER_MAP_ART),checks=[];
        for(let index=0;index<chars.length;index++){
          const id=chars[index],actor=await load(CHARACTER_MAP_ART[id]),wearables=await loadWearableImages(id);registerSpriteBounds(actor);
          const state=createInitialSurvivorsState(id,undefined,undefined,undefined,{owned:ids,equipped:ids});state.gameTime=2;
          state.player.x=state.player.y=0;
          const tracker=new SpriteMotionTracker();tracker.sample(state.player,0,0,0);tracker.act(state.player,.1);
          const pose=tracker.sample(state.player,index%2?-10:10,0,.1);
          const before=JSON.stringify(state);ctx.save();ctx.translate(index%3*400+200,Math.floor(index/3)*300+260);ctx.scale(2.6,2.6);
          drawWearableLayer(ctx,state,actor,74,pose,wearables,'back');drawGroundedSprite(ctx,actor,74,pose);drawWearableLayer(ctx,state,actor,74,pose,wearables,'front');
          drawPremiumGear(ctx,state,gear,false,0,pickups,wearables,{actor,height:74,pose,vfxAtlas:vfx});drawEquipmentIdentity(ctx,state,vfx,false);ctx.restore();
          ctx.fillStyle='#eef5ed';ctx.font='14px sans-serif';ctx.fillText(`QA fixture: ${id} / ${pose.facing===1?'right':'left'}`,index%3*400+16,Math.floor(index/3)*300+22);
          checks.push({id,unchanged:JSON.stringify(state)===before,assets:actor.naturalWidth>0});
        }
        window.psiIdentityPlate={canvas,ctx,createInitialSurvivorsState,drawEvolutionIdentity,EVOLUTION_IDENTITIES,vfx,cinematicLook,drawCinematicContact,ProjectileFeedbackLayer};
        return {characters:checks,pass:checks.every(check=>check.unchanged&&check.assets)};
      },equipped);
      await page.screenshot({path:path.join(out,'nine-character-attachment-fixture.png')});
      const evolution=await page.evaluate(()=>{
        const {canvas,ctx,createInitialSurvivorsState,drawEvolutionIdentity,EVOLUTION_IDENTITIES,vfx,cinematicLook,drawCinematicContact,ProjectileFeedbackLayer}=window.psiIdentityPlate;
        canvas.width=1200;canvas.height=500;ctx.fillStyle='#20342a';ctx.fillRect(0,0,1200,500);
        Object.entries(EVOLUTION_IDENTITIES).forEach(([id,identity],index)=>{
          const x=index*240+120,state=createInitialSurvivorsState();state.activePerks[id]=1;state.player.x=x;state.player.y=135;
          ctx.fillStyle=identity.color;ctx.font='14px sans-serif';ctx.fillText(`QA: ${id}`,index*240+12,30);
          drawEvolutionIdentity(ctx,state,vfx,false);
          for(const [phase,y] of [['launch',240],['impact',340]]){
            ctx.save();ctx.translate(x,y);ctx.scale(2,2);drawCinematicContact(ctx,{projectileId:id,kind:identity.kind,phase,x,y,angle:0,radius:6},.02,.2,cinematicLook(identity.kind,5),vfx,false,false);ctx.restore();
          }
        });
        const scratch=document.createElement('canvas');scratch.width=1200;scratch.height=600;
        const stress=scratch.getContext('2d'),layer=new ProjectileFeedbackLayer(),times=[];
        for(let frame=0;frame<180;frame++){
          const started=performance.now();layer.advance(1/60);
          layer.ingest(Array.from({length:120},(_,index)=>({projectileId:`${frame}-${index}`,kind:'hunter_beam',phase:'impact',x:index%20*60,y:Math.floor(index/20)*60,angle:0,radius:6})),true);
          stress.clearRect(0,0,scratch.width,scratch.height);layer.draw(stress,false,true,{atlas:vfx,equipped:[],levels:{hunter_beam:5}});times.push(performance.now()-started);
        }
        times.sort((a,b)=>a-b);return {frames:180,pool:layer.size,cpuP95Ms:times[Math.floor(times.length*.95)],pass:layer.size<=64};
      });
      await page.screenshot({path:path.join(out,'five-evolution-contact-fixture.png')});
      results.push({scope:'CONSTRUCTED_RENDERER_FIXTURES_NOT_NATURAL_PROGRESS_OR_DEVICE_FPS',plate,evolution,pass:plate.pass&&evolution.pass});
    }
    await page.close();
  }
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results));
  if(results.some(result=>!result.pass))process.exitCode=1;
}finally{await browser.close();}

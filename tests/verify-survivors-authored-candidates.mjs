import fs from 'node:fs';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const inspected=JSON.parse(fs.readFileSync('artifacts/graphics-upgrade/candidate-layouts.json','utf8'));
const names=['east-v1','southeast-v1','south-v2','southwest-v1','west-v1','northwest-v1','north-v1','northeast-v1'];
const actors=JSON.parse(fs.readFileSync('content/art/survivors-authored-actor-layouts-v1.json','utf8')),reports=[];
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
try{for(const [id,layouts] of Object.entries(actors)){
const page=await browser.newPage({viewport:{width:1440,height:950},recordVideo:{dir:'artifacts/graphics-upgrade/candidate-video',size:{width:1440,height:950}}});
 await page.goto(process.env.PSI_PREVIEW_URL??'http://127.0.0.1:5203/',{waitUntil:'networkidle'});
 const rendering=page.evaluate(async ({id,layouts})=>{
  const {loadAuthoredDirectionalActor,drawDirectionalBody,directionalBootSockets}=await import('/src/ui/survivors-directional-art.ts'),{fittingPose}=await import('/src/ui/survivors-fitting-pose.ts');
  const actor=new Image();actor.src='/assets/characters/player-map.webp';const preparationStart=performance.now();await loadAuthoredDirectionalActor(actor,id,layouts);const preparationMs=performance.now()-preparationStart;
  document.body.innerHTML='';document.body.style.cssText='margin:0;background:#152629;color:#cee3e1;font:16px sans-serif';
  const title=document.createElement('h2');title.textContent='원화 후보 · 방향별 연속 보행과 달리기 검수';document.body.append(title);
  const cases=[],renders=[];let maximum=0,maximumSlip=0;
  for(const [row,speed] of [[0,120],[1,220]]){
   const section=document.createElement('section');section.style.cssText='display:flex;gap:2px';document.body.append(section);
   for(let direction=0;direction<8;direction++){
    const canvas=document.createElement('canvas');canvas.width=178;canvas.height=290;section.append(canvas);
    const ctx=canvas.getContext('2d'),entity={},angle=direction*Math.PI/4;
    const metrics={direction,speed,maximumSlip:0};
    renders.push(frame=>{
     const clock=frame/60,pose={...fittingPose(clock,'walk',1,false),speed,mode:speed>145?'run':'walk',direction,visualAngle:angle,contactCycle:clock*speed*Math.PI*2/(speed>145?96:64),clock,worldX:Math.cos(angle)*speed*clock,worldY:Math.sin(angle)*speed*clock,entity};
     ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#24342e';ctx.fillRect(0,0,178,290);ctx.translate(89,250);ctx.scale(2.8,2.8);
     if(!drawDirectionalBody(ctx,actor,74,pose))throw Error('Candidate did not render');
     const stretch=Number(canvas.dataset.contactLegStretch);if(!Number.isFinite(stretch)||stretch>1.080001)throw Error('Candidate leg stretch '+direction+': '+stretch);maximum=Math.max(maximum,stretch);
     metrics.maximumSlip=Math.max(metrics.maximumSlip,Number(canvas.dataset.contactSlip)||0);maximumSlip=Math.max(maximumSlip,metrics.maximumSlip);
     const feet=directionalBootSockets(actor,pose,74);if(feet.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)))throw Error('Invalid boot socket');
    });cases.push(metrics);
   }
  }
  window.candidateReady=true;
  await new Promise(resolve=>{let frame=0;const tick=()=>{for(const render of renders)render(frame);window.candidateFrame=frame;if(++frame<360)requestAnimationFrame(tick);else resolve();};requestAnimationFrame(tick);});
  const timeCases=[];
  for(const hz of [30,60,120])for(let direction=0;direction<8;direction++)for(const reverse of [false,true]){
   const canvas=document.createElement('canvas');canvas.width=130;canvas.height=180;const ctx=canvas.getContext('2d'),entity={},angle=direction*Math.PI/4;let stretch=0,slip=0;
   for(let frame=0;frame<hz*2;frame++){const clock=frame/hz,speed=120,pose={...fittingPose(clock,'walk',1,false),direction,visualAngle:angle,contactCycle:clock*speed*Math.PI*2/64*(reverse?-1:1),clock,worldX:Math.cos(angle)*speed*clock*(reverse?-1:1),worldY:Math.sin(angle)*speed*clock*(reverse?-1:1),entity};ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,130,180);ctx.translate(65,160);drawDirectionalBody(ctx,actor,74,pose);stretch=Math.max(stretch,Number(canvas.dataset.contactLegStretch));slip=Math.max(slip,Number(canvas.dataset.contactSlip));}
   if(!Number.isFinite(stretch)||stretch>1.080001)throw Error('Timed gait stretched '+id);timeCases.push({hz,direction,reverse,stretch,slip});
  }
  return {id,preparationMs,cases,timeCases,maximum,maximumSlip,continuousFrames:360,status:'runtime-candidate-director-review-pending'};
 },{id,layouts});
 await page.waitForFunction(()=>window.candidateReady);const motionStart=await page.evaluate(()=>performance.now());
 for(let sample=0;sample<6;sample++){await page.waitForTimeout(400);await page.screenshot({path:'artifacts/graphics-upgrade/continuous-'+id+'-'+sample+'.png'});}
 const result=await rendering;
 await page.screenshot({path:'artifacts/graphics-upgrade/candidate-directions-'+id+'.png',fullPage:true});result.reviewFrames=6;result.motionStartPageMs=motionStart;reports.push(result);console.log(JSON.stringify({id,maximum:result.maximum,maximumSlip:result.maximumSlip,preparationMs:result.preparationMs,timeCases:result.timeCases.length}));const video=page.video();await page.close();result.video=await video.path();
}fs.writeFileSync('artifacts/graphics-upgrade/candidate-render-all.json',JSON.stringify(reports,null,2));}finally{await browser.close();}

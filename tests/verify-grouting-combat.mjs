import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const edge=process.env.PSI_FEEDBACK_EDGE==='1';
const output=edge?'artifacts/feedback-edge':'artifacts/grouting-combat';fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN}),rows=[];
try{
 for(const [width,height] of [[1440,900],[390,844],[844,390]])for(const mode of ['normal','busy','reduced']){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.emulateMedia({reducedMotion:mode==='reduced'?'reduce':'no-preference'});
  await page.addInitScript(()=>{
    window.qaImages=[];window.feedbackPaint=[];
    window.Image=new Proxy(window.Image,{construct(target,args){const image=Reflect.construct(target,args);window.qaImages.push(image);return image;}});
    const original=CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText=function(...args){
      const text=String(args[0]);
      if(this.canvas.classList.contains('survivors-canvas')&&['-20','위험 통제 완료','회수 +3','긴급 탈출 호송반 출동! 랑데부 구역을 사수하십시오!'].includes(text)){
        const t=this.getTransform(),width=this.measureText(text).width*Math.abs(t.a);
        window.feedbackPaint.push({text,left:t.e-width/2,right:t.e+width/2,canvasWidth:this.canvas.width});
        window.feedbackPaint=window.feedbackPaint.slice(-12);
      }
      return Reflect.apply(original,this,args);
    };
  });
  await page.route('**/assets/PatrolSurvivorsGame-*.js',async route=>{
   const response=await route.fetch();let body=await response.text();const pattern=/update\([^)]*\)\{(?=if\(this\.state\.phase!==)/g;
   if([...body.matchAll(pattern)].length!==1)throw Error('Engine capture unavailable');
   body=body.replace(pattern,m=>`${m}window.groutEngine=this;`);
   const marker=body.indexOf('.priority)-Number('),start=body.lastIndexOf('function ',marker),header=/^function \w+\(([^)]+)\)\{/.exec(body.slice(start));
   if(marker<0||!header||header[1].split(',').length!==2)throw Error('Feedback selection capture unavailable');
   const input=header[1].split(',')[0],end=body.indexOf('return ',marker),tail=/^return (\w+)\.reverse\(\)/.exec(body.slice(end));
   if(!tail)throw Error('Feedback result capture unavailable');
   body=body.slice(0,end)+body.slice(end).replace(tail[0],`return window.feedbackSelected=${tail[1]}.reverse()`);
   body=body.slice(0,start)+body.slice(start).replace(header[0],header[0]+`${input}=window.feedbackFixture??${input};`);
   await route.fulfill({response,body});
  });
  await page.goto(process.env.PSI_PREVIEW_URL);
  await page.getByRole('button',{name:/시그널 워치.*SURVIVORS/}).click();
  await page.locator('.survivors-ready-launch .survivors-btn-primary').click();
  await page.waitForFunction(()=>window.groutEngine?.state.phase==='playing');
  const required=['player-walk-eight-v1.png','player-walk-passing-v1.png','player-command-eight-v1.png','player-equipment-check-eight-v1.png','industrial-hazards-v3.webp','runaway-carrier-boss-v1.webp'];
  await page.waitForFunction(names=>names.every(name=>window.qaImages.some(image=>image.src.endsWith(name)&&image.complete&&image.naturalWidth>0)),required,{timeout:30000});
  await page.keyboard.press('KeyP');
  await page.addStyleTag({content:'.survivors-modal-backdrop{visibility:hidden!important}'});
  for(const kind of ['grout_slug','hydraulic_wave']){
   await page.evaluate(({kind,edge})=>{
    const s=window.groutEngine.state,p=s.player;
    s.projectiles=Array.from({length:5},(_,i)=>({id:`review${i}`,kind,x:p.x+60+i*18,y:p.y+(i-2)*22,vx:400,vy:(i-2)*50,radius:kind==='grout_slug'?22:24,damage:1,duration:kind==='grout_slug'?.75:.85,pierce:1,color:'#cbd2c9'}));
    const feedback=(id,text,color,isCrit=false,priority=false)=>({id,text,color,isCrit,priority,x:p.x,y:p.y-42,life:.65,maxLife:.75});
    window.feedbackFixture=[feedback(1,'-20','#ef4444',false,true),feedback(2,'위험 통제 완료','#10b981',true),...Array.from({length:12},(_,i)=>feedback(i+3,'회수 +3','#78e8d5'))];
    if(edge){window.feedbackFixture[1].text='긴급 탈출 호송반 출동! 랑데부 구역을 사수하십시오!';window.feedbackFixture[1].x=p.x+200;window.feedbackFixture[0].x=p.x-200;}
    window.feedbackPaint=[];
   },{kind,edge});
   await page.evaluate(busy=>{
    const s=window.groutEngine.state,p=s.player;
    s.hazards=Array.from({length:busy?46:4},(_,i)=>{const a=i*Math.PI*2/12,r=160+Math.floor(i/12)*85;return {id:`warning${i}`,type:'RUNAWAY_CART',x:p.x+Math.cos(a)*r,y:p.y+Math.sin(a)*r,hp:100,maxHp:100,speed:0,radius:18,damage:0,expValue:0,motion:{phase:'warning',timer:1,directionX:-Math.cos(a),directionY:-Math.sin(a)}};});
   },mode==='busy');
   await page.waitForTimeout(700);
   const result=await page.evaluate(()=>{
    const c=document.querySelector('.survivors-canvas'),s=window.groutEngine.state;
    const data=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let hash=2166136261;
    for(let i=0;i<data.length;i+=4)hash=Math.imul(hash^data[i],16777619);
    return {hash:hash>>>0,time:s.gameTime,phase:s.phase,count:s.projectiles.length,images:window.qaImages.filter(i=>i.complete&&i.naturalWidth>0).map(i=>i.src).filter(src=>/player-(walk|command|equipment)|industrial-hazards|runaway-carrier/.test(src)),paint:window.feedbackPaint,selected:window.feedbackSelected.map(({id,y,text})=>({id,y,text})),overflow:document.documentElement.scrollWidth>innerWidth+1};
   });
   await page.screenshot({path:`${output}/${width}x${height}-${kind}-${mode}.png`});
   const paintedBounds=result.paint.length>=3&&result.paint.every(p=>p.left>=-1&&p.right<=p.canvasWidth+1);
   rows.push({width,height,kind,mode,...result,errors:[...errors],pass:result.phase==='paused'&&result.count===5&&result.selected.length===3&&result.selected.some(x=>x.id===1)&&result.selected.some(x=>x.id===2)&&(edge||new Set(result.selected.map(x=>x.y)).size===3)&&paintedBounds&&!result.overflow&&!errors.length});
  }
  await page.close();
 }
 fs.writeFileSync(`${output}/report.json`,JSON.stringify({scope:'PAUSED_EXPLICIT_PROJECTILE_FIXTURE_NOT_NATURAL_PLAY_OR_DEVICE',rows},null,2));
 console.log(JSON.stringify(rows.map(({images,paint,selected,...row})=>({...row,readyImages:images.length,paintSamples:paint.length,selectedCount:selected.length}))));if(rows.some(r=>!r.pass))process.exitCode=1;
}finally{await browser.close();}

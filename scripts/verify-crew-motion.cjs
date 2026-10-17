const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict'),{chromium}=require('playwright');
const base=process.env.PSI_DEV_URL||'http://127.0.0.1:4180',out=process.env.PSI_QA_OUTPUT||'artifacts/crew-motion';fs.mkdirSync(out,{recursive:true});
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROME_BIN,headless:true});try{const p=await b.newPage({viewport:{width:1440,height:900}});await p.route('**/__crew-qa',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Crew frame QA</title>'}));await p.goto(base+'/__crew-qa',{waitUntil:'load'});
const report=await p.evaluate(async()=>{
 const {loadAuthoredDirectionalActor,drawDirectionalBody}=await import('/src/ui/survivors-directional-art.ts');
 const {default:layouts}=await import('/content/art/survivors-authored-actor-layouts-v1.json');
 const {SpriteMotionTracker}=await import('/src/ui/survivors-sprite-motion.ts');
 const results=[];
 for(const id of ['player','kang_taesik','yoon_sungho','lee_jaehoon','lim_junho']){
  const actor=new Image();actor.src='/assets/episode01/characters/new-psi-crew-v2/'+id.replaceAll('_','-')+'-map.webp';await actor.decode();
  await loadAuthoredDirectionalActor(actor,id,layouts[id]);
  const sheet=document.createElement('canvas');sheet.width=800;sheet.height=8*240;const ctx=sheet.getContext('2d');ctx.fillStyle='#18313d';ctx.fillRect(0,0,sheet.width,sheet.height);
  for(let direction=0;direction<8;direction++)for(let mode=0;mode<4;mode++){
   const pose={...new SpriteMotionTracker().sample({},0,0,0),direction,visualAngle:direction*Math.PI/4,moving:mode===1||mode===2,mode:mode===2?'run':mode===1?'walk':'idle',speed:mode===2?180:mode===1?90:0,gaitBlend:mode===1||mode===2?1:0,cycle:1.1,authoredCycle:1.1,contactCycle:1.1,action:mode===3?.8:0,actionProgress:.3,attackAngle:direction*Math.PI/4,actionKind:'shot'};
   ctx.save();ctx.translate(mode*200+100,direction*240+230);if(!drawDirectionalBody(ctx,actor,220,pose))throw Error('Body '+id);ctx.restore();
  }
  results.push({id,directions:8,poses:4,frames:160,identity:sheet.dataset.actorIdentity,png:sheet.toDataURL()});
 }return results;
});
for(const row of report){a.equal(row.identity,'single-authored-frame');fs.writeFileSync(path.join(out,row.id+'.png'),Buffer.from(row.png.split(',')[1],'base64'));delete row.png;console.log('PASS',row.id,'160 authored frames');}
fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
}finally{await Promise.race([b.close(),new Promise(r=>setTimeout(r,3000))]);}})().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1)});

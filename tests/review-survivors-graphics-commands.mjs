import fs from 'node:fs';import {createRequire} from 'node:module';const require=createRequire(import.meta.url),{chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const inspected=JSON.parse(fs.readFileSync('artifacts/graphics-upgrade/candidate-layouts.json','utf8'));
const dirs=['east','southeast','south','southwest','west','northwest','north','northeast'];
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
try{const page=await browser.newPage({viewport:{width:1200,height:1100}});await page.goto('http://127.0.0.1:5203/');
for(const id of ['player','kang_taesik','yoon_sungho','lee_jaehoon','lim_junho','safety_monitor']){
 const rows=dirs.map(dir=>inspected.find(r=>r.file===`${id}-${dir}-${id==='player'&&dir==='south'?'v2':'v1'}.png`));if(rows.some(r=>!r||r.issues.length))continue;
 await page.evaluate(async({id,rows})=>{document.body.innerHTML='';document.body.style.cssText='margin:0;background:#24332e;color:white';
 const title=document.createElement('h2');title.textContent=id+' · 정지 / 회전 연결 / 피격';document.body.append(title);
 for(const frame of [15,16,17]){const section=document.createElement('section');section.style.display='flex';document.body.append(section);
 for(let d=0;d<8;d++){const canvas=document.createElement('canvas');canvas.width=149;canvas.height=200;section.append(canvas);const ctx=canvas.getContext('2d'),image=new Image();image.src='/assets/survivors/graphics-v1/actors/'+rows[d].file;await image.decode();const p=rows[d].selected[frame],s=166/rows[d].selected[0].height;ctx.drawImage(image,p.x,p.y,p.width,p.height,74-p.width*s/2,180-p.height*s,p.width*s,p.height*s);ctx.fillText('방향 '+d+' · 자세 '+frame,10,197);}}
 },{id,rows});await page.screenshot({path:'artifacts/graphics-upgrade/commands-'+id+'.png'});
}await page.close();}finally{await browser.close();}

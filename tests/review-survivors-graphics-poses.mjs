import fs from 'node:fs';import {createRequire} from 'node:module';const require=createRequire(import.meta.url),{chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const layouts=JSON.parse(fs.readFileSync('content/art/survivors-authored-actor-layouts-v1.json','utf8'));
const dirs=['east','southeast','south','southwest','west','northwest','north','northeast'];
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
try{const page=await browser.newPage({viewport:{width:1200,height:1100}});await page.goto(process.env.PSI_PREVIEW_URL??'http://127.0.0.1:5203/');
for(const id of Object.keys(layouts)){
 const rows=layouts[id];
 await page.evaluate(async({id,rows})=>{document.body.innerHTML='';document.body.style.cssText='margin:0;background:#24332e;color:white';
 const title=document.createElement('h2');title.textContent=id+' · 정지 / 회전 연결 / 피격';document.body.append(title);
 for(const frame of [0,13,14,18,19]){const section=document.createElement('section');section.style.display='flex';document.body.append(section);
 for(let d=0;d<8;d++){const canvas=document.createElement('canvas');canvas.width=149;canvas.height=200;section.append(canvas);const ctx=canvas.getContext('2d'),p=rows[d].frames[frame],image=new Image();image.src=p.src??rows[d].src;await image.decode();const s=166/(p.referenceHeight??rows[d].frames[0].height);ctx.save();if(p.mirror){ctx.translate(149,0);ctx.scale(-1,1);}ctx.drawImage(image,p.x,p.y,p.width,p.height,74-p.width*s/2,180-p.height*s,p.width*s,p.height*s);ctx.restore();ctx.fillStyle='white';ctx.fillText('방향 '+d+' · 자세 '+frame,10,197);}}
 },{id,rows});await page.screenshot({path:'artifacts/graphics-upgrade/accepted-poses-'+id+'.png'});
}await page.close();}finally{await browser.close();}

import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{PNG}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'pngjs'));
const folder='public/assets/survivors/graphics-v1/actors',reports=[];
for(const file of fs.readdirSync(folder).filter(f=>f.endsWith('.png'))){
 const {width,height,data}=PNG.sync.read(fs.readFileSync(path.join(folder,file)));
 const seen=new Uint8Array(width*height),queue=new Int32Array(width*height),components=[];let transparent=0;
 for(let start=0;start<seen.length;start++){
  if(data[start*4+3]===0)transparent++;if(seen[start]||data[start*4+3]<32)continue;
  let head=0,tail=1,left=width,right=0,top=height,bottom=0;queue[0]=start;seen[start]=1;
  while(head<tail){const i=queue[head++],x=i%width,y=Math.floor(i/width);left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
   for(const n of [x>0?i-1:-1,x+1<width?i+1:-1,y>0?i-width:-1,y+1<height?i+width:-1])if(n>=0&&!seen[n]&&data[n*4+3]>=32){seen[n]=1;queue[tail++]=n;}
  }
  if(tail>1000&&bottom-top>height*.08)components.push({x:left,y:top,width:right-left+1,height:bottom-top+1,pixels:tail});
 }
 const rows=Array.from({length:4},()=>[]);
 for(const c of components)rows[Math.min(3,Math.floor((c.y+c.height/2)/height*4))].push(c);
 for(const row of rows)row.sort((a,b)=>a.x-b.x);
 const turns=file.includes('-turns-')||file.includes('-braces-'),columns=turns?2:5,expected=columns*4;
 let selected=rows.flatMap((row,i)=>!turns&&i===3&&row.length===6?row.slice(1):row);
 // Reviewed extra neutral cells; never infer their role from a generic grid crop.
 let explicitSelection=false;
 if(file==='lee_jaehoon-northwest-v1.png'&&rows.map(r=>r.length).join(',')==='5,5,6,5'){
  selected=[...rows[0],...rows[1],...rows[2].slice(0,4),rows[2][5],...rows[3]];explicitSelection=true;
 }
 if(['lee_jaehoon-southwest-v1.png','yoon_sungho-southwest-v1.png','lim_junho-southeast-v1.png'].includes(file)&&rows[3].length===7){
  selected=[...rows[0],...rows[1],...rows[2],...(file.startsWith('lee_')?[rows[3][0]]:[]),...rows[3].slice(2)];explicitSelection=true;
 }
 if(file==='lim_junho-north-v1.png'&&rows.map(r=>r.length).join(',')==='6,6,4,7'){selected=[...rows[0],...rows[1].slice(0,3),...rows[2],...rows[3]];explicitSelection=true;}
 const issues=[];if(selected.length!==expected)issues.push(`Expected ${expected} isolated body components; explicit frame selection required.`);
 if(!explicitSelection&&rows.some((row,i)=>row.length!==(!turns&&i===3&&components.length===21?6:columns)))issues.push('Row geometry deviates from contract; inspect clipping or merged neighboring bodies.');
 if(transparent/(width*height)<.1)issues.push('Insufficient transparent separation.');
 reports.push({file,width,height,transparentFraction:transparent/(width*height),components:components.length,rowCounts:rows.map(r=>r.length),selected,issues,status:'geometry-inspected-not-motion-approved'});
}
fs.mkdirSync('artifacts/graphics-upgrade',{recursive:true});fs.writeFileSync('artifacts/graphics-upgrade/candidate-layouts.json',JSON.stringify(reports,null,2));
console.log(JSON.stringify(reports.map(({file,components,rowCounts,issues})=>({file,components,rowCounts,issues}))));

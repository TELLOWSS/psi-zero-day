import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

const root=process.cwd(), generated='C:/Users/user/.codex/generated_images/01a13458-6d9f-7992-9023-d99924880690';
const output='public/assets/defense/premium-v1';
await fs.mkdir(output,{recursive:true});
const sources={
  towers:path.join(generated,'exec-6e716135-7ec3-44be-b6ed-84a7eaa044ec.png'),
  hazards:path.join(generated,'exec-69798012-3ff9-4b12-bd98-d20698cd0610.png'),
  world:path.join(generated,'exec-979563bf-193c-4480-a9f5-6ae117a38972.png'),
  hero:path.join(generated,'exec-061bfecf-b656-4469-9119-0aef5c6e4afa.png'),
};
const assets=[];
async function record(id,file,source,extra={}){
 const bytes=await fs.readFile(file),m=await sharp(bytes).metadata();
 assets.push({id,uri:file.replace(/^public\//,''),width:m.width,height:m.height,alpha:m.hasAlpha,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),source,...extra});
}
async function atlas(source,key,cols,rows,ids,rects){
 const m=await sharp(source).metadata();
 await sharp(source).webp({quality:94,alphaQuality:100}).toFile(`${output}/${key}-atlas.webp`);
 for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
  // AI atlases do not have exact equal cells. Reviewed source bounds preserve
  // complete dishes/hoses and exclude fragments from adjacent hazards.
  const {left,top,width,height}=rects[row*cols+col];
  const cell=await sharp(source).extract({left,top,width,height}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  let x0=width,y0=height,x1=-1,y1=-1;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(cell.data[(y*width+x)*4+3]>16){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
  if(x1<0)throw Error(`Empty sprite ${key}/${row}/${col}`);
  const id=ids[row*cols+col],file=`${output}/${id.toLowerCase().replaceAll('.','-')}.webp`;
  await sharp(cell.data,{raw:cell.info}).extract({left:x0,top:y0,width:x1-x0+1,height:y1-y0+1})
   .resize(320,320,{fit:'contain',background:'#00000000'}).extend({top:24,bottom:24,left:24,right:24,background:'#00000000'})
   .webp({quality:93,alphaQuality:100}).toFile(file);
  await record(id,file,source,{sourceRect:{left,top,width,height},visibleBounds:{left:x0,top:y0,right:x1,bottom:y1}});
 }
}
const towerRects=[
 [55,41,228,249],[341,31,276,262],[647,28,245,263],[920,25,310,268],
 [34,320,247,271],[331,319,274,262],[633,309,264,273],[952,315,271,269],
 [13,628,278,243],[322,607,272,258],[614,593,306,291],[927,591,315,264],
 [25,874,250,350],[326,870,265,356],[639,884,283,341],[971,872,263,353],
].map(([left,top,width,height])=>({left,top,width,height}));
const hazardRects=[[40,40,450,430],[530,35,500,435],[1045,18,450,470],[60,480,455,470],[550,480,430,475],[1004,480,520,490]]
 .map(([left,top,width,height])=>({left,top,width,height}));
await atlas(sources.towers,'equipment',4,4,['PULSE','BURST','CONTROL','SENSOR'].flatMap(id=>['L1','L2','L3A','L3B'].map(level=>`${id}.${level}`)),towerRects);
await atlas(sources.hazards,'hazards',3,2,['NORMAL','SWIFT','ARMORED','SWARM','VEILED','BOSS'],hazardRects);
for(const key of ['world','hero']){
 const file=`${output}/${key}.webp`;
 await sharp(sources[key]).webp({quality:92}).toFile(file);await record(key,file,sources[key]);
}
const manifest={schemaVersion:1,visualVersion:'defense-premium-20261015-v1',status:'FINAL_CANDIDATE_RUNTIME_INTEGRATED',scope:['ramp-01'],generator:'built-in image_gen',sources,assets};
await fs.writeFile(path.join(root,'content/defense/premium-art-v1.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({assets:assets.length,bytes:assets.reduce((sum,a)=>sum+a.bytes,0),transparentSprites:assets.filter(a=>a.alpha).length}));

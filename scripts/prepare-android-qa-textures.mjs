/**
 * Build-artifact-only graphics budget pass for an Android QA APK.
 * Never mutates public/ source media, never runs on Vercel, and keeps file paths,
 * image formats and transparency unchanged. Existing 1920x1080 Episode01 cinema
 * environments and any non-target artwork are deliberately out of scope.
 */
import { readdir, readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const root=path.resolve('dist/assets/survivors');
const reportPath='artifacts/android-qa/texture-budget.json';
const whitelisted=['maps','pinball/tables','graphics-v1'];
const minBytes=2*1024*1024; // 2 MiB; focus on the largest textures
const maxEdge=1280; // QA-only mobile texture budget; browser retains original resolution
sharp.concurrency(2);
sharp.cache(false);

const rows=[];
let examinedPngs=0,largePngs=0,overMaxEdge=0,notSmaller=0;
for(const group of whitelisted){
 const folder=path.join(root,group);
 const stack=[folder];
 while(stack.length){
  const dir=stack.pop();
  let names;
  try{names=await readdir(dir,{withFileTypes:true})}catch(e){if(e.code==='ENOENT')continue;throw e}
  for(const n of names){
   const loc=path.join(dir,n.name);
   if(n.isDirectory()){stack.push(loc);continue}
   if(!n.isFile()||!n.name.toLowerCase().endsWith('.png'))continue;
   examinedPngs++;
   const info=await stat(loc);
   if(info.size<minBytes)continue;
   largePngs++;
   const original=await readFile(loc);
   const meta=await sharp(original,{limitInputPixels:10000*10000}).metadata();
   if(!meta.width||!meta.height)continue;
   const downsample=Math.max(meta.width,meta.height)>maxEdge;
   if(downsample)overMaxEdge++;
   // The PNG container and alpha stay intact. Lanczos downsampling is applied
   // to the QA package only, never to canonical art or Vercel preview.
   const image=sharp(original);
   const target=await (downsample
    ? image.resize({width:maxEdge,height:maxEdge,fit:'inside',withoutEnlargement:true,kernel:'lanczos3'})
    : image).png({compressionLevel:9,progressive:false,effort:7}).toBuffer();
   // Avoid replacing an asset with a larger binary or an unreadable image.
   const newMeta=await sharp(target).metadata();
   if(newMeta.format!=='png'||target.length>=original.length||Boolean(meta.hasAlpha)!==Boolean(newMeta.hasAlpha)){
    notSmaller++;
    continue;
   }
   await writeFile(loc,target);
   rows.push({file:path.relative('dist',loc).split(path.sep).join('/'),
    original_bytes:original.length,packaged_bytes:target.length,
    original_dimensions:[meta.width,meta.height],
    packaged_dimensions:[newMeta.width,newMeta.height],
    preserved_alpha:Boolean(meta.hasAlpha),
    original_sha256:createHash('sha256').update(original).digest('hex'),
    packaged_sha256:createHash('sha256').update(target).digest('hex')});
  }
 }
}
const oldBytes=rows.reduce((sum,row)=>sum+row.original_bytes,0);
const newBytes=rows.reduce((sum,row)=>sum+row.packaged_bytes,0);
const out={scope:'ANDROID_DEBUG_QA_ONLY',source_root_untouched:'public/assets/survivors',
 files_examined:examinedPngs,large_png_candidates:largePngs,images_over_max_edge:overMaxEdge,images_not_smaller:notSmaller,
 folders:whitelisted,min_bytes:minBytes,max_edge:maxEdge,files_optimized:rows.length,
 transformed_original_bytes:oldBytes,transformed_packaged_bytes:newBytes,
 reduction_bytes:oldBytes-newBytes,approval:'PREVIEW_ONLY_NOT_COMMERCIAL_ART_LOCK',files:rows};
await mkdir(path.dirname(reportPath),{recursive:true});
await writeFile(reportPath,JSON.stringify(out,null,2)+'\n');
console.log('ANDROID QA texture budget: '+JSON.stringify({
 scope:out.scope,candidates:largePngs,over_max_edge:overMaxEdge,files:out.files_optimized,original_mib:+(oldBytes/1048576).toFixed(1),
 packaged_mib:+(newBytes/1048576).toFixed(1),
 saved_mib:+((oldBytes-newBytes)/1048576).toFixed(1)}));

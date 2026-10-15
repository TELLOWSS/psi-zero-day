import fs from 'node:fs/promises';
import sharp from 'sharp';
import {createHash} from 'node:crypto';
const source='C:/Users/user/.codex/generated_images/01a13f52-a9f8-7bc3-882e-04ad824ccf4e/exec-635c2408-2721-42b3-91a2-3a1c06455577.png';
const raw=await sharp(source).resize(1600,800,{fit:'fill'}).png().toBuffer();
const frames=[];
for(let index=0;index<8;index++){
 const cell=await sharp(raw).extract({left:index%4*400,top:Math.floor(index/4)*400,width:400,height:400}).resize(256,256).extend({top:32,bottom:32,left:32,right:32,background:{r:0,g:0,b:0,alpha:0}}).png().toBuffer();
 frames.push({input:cell,left:index%4*320,top:Math.floor(index/4)*320});
}
const bytes=await sharp({create:{width:1280,height:640,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(frames).webp({quality:90,alphaQuality:100}).toBuffer();
const uri='assets/defense/cinematic-v1/signal-resolve-atlas.webp';
await fs.mkdir('public/assets/defense/cinematic-v1',{recursive:true});await fs.writeFile('public/'+uri,bytes);
const metadata=await sharp(bytes).metadata();
const manifest={schemaVersion:1,visualVersion:'guard-cinematic-20261016-v1',status:'FINAL_CANDIDATE_RUNTIME_INTEGRATED',generator:'built-in image_gen',source,promptFile:'docs/guard-cinematic-image-prompts-20261016.json',resolveAtlas:{uri,width:1280,height:640,columns:4,rows:2,frames:8,frameSize:320,durationMs:400,safePaddingPixels:32,hasAlpha:metadata.hasAlpha,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')},budgets:{attackGroups:24,resolveSprites:4,damageLabels:8,worldLightingLayers:2}};
await fs.writeFile('content/defense/guard-cinematic-v1.json',JSON.stringify(manifest,null,2)+'\n');console.log(JSON.stringify(manifest.resolveAtlas));

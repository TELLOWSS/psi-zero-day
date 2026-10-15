import fs from 'node:fs/promises';
import sharp from 'sharp';
import {createHash} from 'node:crypto';
const source='C:/Users/user/.codex/generated_images/01a13458-6d9f-7992-9023-d99924880690/';
const towers={ 'PULSE.L4A':'7b44c1b3-66ca-4f84-97d2-bde66c47f8c8','PULSE.L4B':'bd878109-e9ee-4981-8356-d413ccbb90c0','BURST.L4A':'df242d5e-1aed-44cf-b2ff-07ff6844d1f1','BURST.L4B':'d45ad11f-bbd9-4d22-990c-75c6493b4eff','CONTROL.L4A':'5b8cf522-0ed9-41bf-a620-ffbd80136b4c','CONTROL.L4B':'8b789611-27bf-465f-a410-42965d0c6e6a','SENSOR.L4A':'472d0ef8-61d4-41eb-9e05-da242104b291','SENSOR.L4B':'2e7f9435-d7aa-4e27-ac86-20ef303bce3a'};
const boards={'GD-04':'1c988b76-76a0-4c3f-91d6-79c099d755e8','GD-05':'b4e33926-dc81-4578-b036-3d6a0355e9f4','GD-06':'416a07e9-409c-49b6-a98e-ff2f651b11b0'};
await fs.mkdir('public/assets/defense/guard-p2-v1',{recursive:true});
async function ingest(id,uuid,tower){
 const input=source+'exec-'+uuid+'.png',uri='assets/defense/guard-p2-v1/'+id.toLowerCase().replace('.','-')+'.webp';
 const original=await sharp(input).metadata();
 if(tower&&!original.hasAlpha)throw Error(id+' needs alpha');
 const data=await sharp(input).resize(tower?368:1600,tower?368:960,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).webp({quality:90,alphaQuality:100}).toBuffer();
 await fs.writeFile('public/'+uri,data);const meta=await sharp(data).metadata(),stats=await sharp(data).stats();
 if(tower&&stats.channels[3]?.min!==0)throw Error(id+' missing transparent margin');
 return {id,...(!tower?{stageId:id}:{}),uri,source:input,width:meta.width,height:meta.height,hasAlpha:meta.hasAlpha,bytes:data.length,sha256:createHash('sha256').update(data).digest('hex'),status:'FINAL_CANDIDATE_RUNTIME_INTEGRATED'};
}
const manifest={schemaVersion:1,generator:'built-in image_gen',prompts:'docs/guard-p2-image-prompts-20261015.json',towers:[],boards:[]};
for(const [id,uuid]of Object.entries(towers))manifest.towers.push(await ingest(id,uuid,true));
for(const [id,uuid]of Object.entries(boards))manifest.boards.push(await ingest(id,uuid,false));
await fs.writeFile('content/defense/guard-p2-art-v1.json',JSON.stringify(manifest,null,2)+'\n');
console.log('Ingested',manifest.towers.length,'transparent towers and',manifest.boards.length,'boards');

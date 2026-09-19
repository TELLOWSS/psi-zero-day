import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const queue=JSON.parse(fs.readFileSync(path.join(root,'content/episode01/visual-production-queue.json'),'utf8'));
const catalog=JSON.parse(fs.readFileSync(path.join(root,'content/episode01/scene-background-catalog.json'),'utf8'));
const ingest=JSON.parse(fs.readFileSync(path.join(root,'content/episode01/final-art-ingest-manifest.json'),'utf8'));
const errors=[];

const surfaces=queue.production_surfaces??[];
const catalogEntries=Object.entries(catalog.backgrounds??{});
const catalogById=new Map(catalogEntries.map(([key,value])=>[value.asset_id,{key,...value}]));
const ingestByPath=new Map((ingest.assets??[]).map(item=>[item.target_path.replace(/^public\//,''),item]));

if(surfaces.length!==8) errors.push(`production_surfaces must contain 8 items (got ${surfaces.length})`);
if(new Set(surfaces.map(item=>item.asset_id)).size!==surfaces.length) errors.push('production surface asset_id values must be unique');

for(const surface of surfaces){
  const runtime=catalogById.get(surface.asset_id);
  if(!runtime){
    errors.push(`${surface.key}: asset_id not found in scene-background-catalog (${surface.asset_id})`);
    continue;
  }
  if(runtime.key!==surface.key) errors.push(`${surface.key}: catalog key mismatch (${runtime.key})`);
  if(runtime.final_path!==surface.final_path) errors.push(`${surface.key}: final_path mismatch`);
  if(runtime.rc_path!==surface.rc_path) errors.push(`${surface.key}: rc_path mismatch`);
  if(JSON.stringify(runtime.used_by)!==JSON.stringify(surface.used_by)) errors.push(`${surface.key}: used_by mismatch`);
  if(!surface.used_by?.length) errors.push(`${surface.key}: no runtime event bindings`);
  if(!ingestByPath.has(surface.final_path)) errors.push(`${surface.key}: final path missing from final-art ingest manifest`);
}

if((ingest.assets??[]).length!==8) errors.push(`final-art ingest manifest must contain 8 assets (got ${ingest.assets?.length??0})`);
if(queue.final_art_batch?.archive_sha256!==ingest.archive?.sha256) errors.push('queue archive checksum must match ingest manifest');
if(queue.final_art_batch?.required_surfaces!==8) errors.push('queue required_surfaces must be 8');
if(queue.master_map?.asset_id && surfaces.some(item=>item.asset_id===queue.master_map.asset_id)) {
  errors.push('master Production Map must not masquerade as a distinct immersive scene background');
}

const publicDir=path.join(root,'public/assets/episode01/cg');
const present=surfaces.filter(item=>fs.existsSync(path.join(root,'public',item.final_path))).length;
if(present!==0 && present!==8) errors.push(`partial immersive background batch detected: ${present}/8; repository must contain either 0 or all 8`);

console.log(`Visual production queue: ${surfaces.length}/8 runtime surfaces synchronized; final WebPs in repo: ${present}/8.`);
if(errors.length){
  for(const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

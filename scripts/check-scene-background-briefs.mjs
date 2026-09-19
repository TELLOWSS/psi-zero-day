import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const catalog=JSON.parse(fs.readFileSync(path.join(root,'content/episode01/scene-background-catalog.json'),'utf8'));
const briefs=JSON.parse(fs.readFileSync(path.join(root,'content/episode01/scene-background-production-briefs.json'),'utf8'));
const errors=[];
const catalogKeys=Object.keys(catalog.backgrounds??{}).sort();
const briefKeys=Object.keys(briefs.backgrounds??{}).sort();

if(JSON.stringify(catalogKeys)!==JSON.stringify(briefKeys)){
  errors.push(`background brief keys differ from catalog: catalog=${catalogKeys.join(',')} brief=${briefKeys.join(',')}`);
}
for(const key of catalogKeys){
  const source=catalog.backgrounds[key];
  const brief=briefs.backgrounds?.[key];
  if(!brief) continue;
  if(brief.final_path!==source.final_path) errors.push(`${key}: final_path mismatch`);
  for(const field of ['story_function','time_light','camera','tension','ui_safe_zone']){
    if(typeof brief[field]!=='string'||brief[field].trim().length<12) errors.push(`${key}: missing/weak ${field}`);
  }
  if(!Array.isArray(brief.must_show)||brief.must_show.length<4) errors.push(`${key}: must_show needs at least four anchors`);
}
if(!briefs.global_contract?.style||!briefs.global_contract?.composition||!briefs.global_contract?.character_rule){
  errors.push('global production contract incomplete');
}
console.log(`Episode 01 final background briefs: ${briefKeys.length}/${catalogKeys.length} authored.`);
for(const error of errors) console.error('  error  '+error);
if(errors.length) process.exit(1);

import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const catalog=JSON.parse(fs.readFileSync(path.join(root,'content/episode01/scene-background-catalog.json'),'utf8'));
const prompts=JSON.parse(fs.readFileSync(path.join(root,'content/episode01/scene-background-imagegen-prompts.json'),'utf8'));
const errors=[];
const keys=Object.keys(catalog.backgrounds??{}).sort();
const promptKeys=Object.keys(prompts.backgrounds??{}).sort();

if(JSON.stringify(keys)!==JSON.stringify(promptKeys)){
  errors.push('imagegen prompt keys must exactly match scene background catalog');
}
for(const key of keys){
  const source=catalog.backgrounds[key];
  const item=prompts.backgrounds?.[key];
  if(!item) continue;
  if(item.final_path!==source.final_path) errors.push(`${key}: final_path mismatch`);
  if(typeof item.prompt!=='string'||item.prompt.trim().length<220) errors.push(`${key}: production prompt too weak`);
  if(!item.prompt.toLowerCase().includes('korean')) errors.push(`${key}: Korean-site continuity missing`);
}
for(const field of ['style','continuity','composition','negative']){
  if(typeof prompts.output_contract?.[field]!=='string'||prompts.output_contract[field].trim().length<30){
    errors.push(`output_contract.${field} missing or weak`);
  }
}
console.log(`Episode 01 image-generation prompts: ${promptKeys.length}/${keys.length} production slots authored.`);
for(const error of errors) console.error('  error  '+error);
if(errors.length) process.exit(1);

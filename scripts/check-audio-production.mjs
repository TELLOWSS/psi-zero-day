import fs from 'node:fs';
import path from 'node:path';

const requireFinal=process.argv.includes('--require-final');
const root=process.cwd();
const contractPath=path.join(root,'content/episode01/audio-production.json');
const contract=JSON.parse(fs.readFileSync(contractPath,'utf8'));
const seen=new Set();
const missing=[];
const errors=[];

for(const item of contract.assets){
  if(seen.has(item.asset_id)) errors.push(`duplicate asset_id: ${item.asset_id}`);
  seen.add(item.asset_id);
  if(!item.target_uri.startsWith('assets/episode01/audio/')) errors.push(`unexpected target_uri: ${item.target_uri}`);
  const publicPath=path.join(root,'public',item.target_uri);
  if(!fs.existsSync(publicPath)) missing.push(item);
  else if(fs.statSync(publicPath).size < 512) errors.push(`audio binary too small: ${item.target_uri}`);
}

if(contract.required_core_assets!==contract.assets.length) errors.push('required_core_assets must equal assets.length');
if(contract.final_asset_count!==contract.assets.length-missing.length) {
  if(contract.final_asset_count!==0 || missing.length!==contract.assets.length) {
    errors.push(`final_asset_count stale: contract=${contract.final_asset_count}, detected=${contract.assets.length-missing.length}`);
  }
}

console.log(`Episode 01 audio production: ${contract.assets.length-missing.length}/${contract.assets.length} final binaries present.`);
for(const item of missing) console.log(`  pending  ${item.key} -> ${item.target_uri}`);
for(const error of errors) console.error(`  error    ${error}`);

if(errors.length || (requireFinal && missing.length)) process.exit(1);

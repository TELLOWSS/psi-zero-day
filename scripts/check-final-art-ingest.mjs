import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { isWebP, webPDimensions } from './webp-dimensions.mjs';

const root=process.cwd();
const manifestPath=path.join(root,'content/episode01/final-art-ingest-manifest.json');
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
const requireFinal=process.argv.includes('--require-final');
const rows=[];
const errors=[];

for(const asset of manifest.assets??[]){
  const abs=path.join(root,asset.target_path);
  if(!fs.existsSync(abs)){
    rows.push({filename:asset.filename,status:'MISSING'});
    continue;
  }
  const bytes=fs.readFileSync(abs);
  if(!isWebP(bytes)){
    errors.push(`${asset.filename}: not a valid WebP`);
    continue;
  }
  const dim=webPDimensions(bytes);
  if(!dim || dim.width!==asset.width || dim.height!==asset.height){
    errors.push(`${asset.filename}: dimensions ${dim?.width??'?'}x${dim?.height??'?'} != ${asset.width}x${asset.height}`);
  }
  const sha=crypto.createHash('sha256').update(bytes).digest('hex');
  if(sha!==asset.sha256) errors.push(`${asset.filename}: sha256 mismatch`);
  rows.push({filename:asset.filename,status:'READY',bytes:bytes.length});
}

const ready=rows.filter(row=>row.status==='READY').length;
const total=manifest.assets?.length??0;
console.log(`Episode 01 generated final-art ingest: ${ready}/${total} exact binaries present.`);
for(const row of rows) console.log(`${row.status.padEnd(7)} ${row.filename}${row.bytes?` ${row.bytes} bytes`:''}`);

if(ready>0 && ready<total) errors.push(`partial final-art ingest detected: ${ready}/${total}; deliver all eight as one batch`);
if(requireFinal && ready!==total) errors.push(`final-art ingest requires ${total}/${total} exact binaries`);
if(errors.length){
  console.error('- '+errors.join('\n- '));
  process.exit(1);
}

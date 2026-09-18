import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const strict=process.argv.includes('--require-new');
const baseline=JSON.parse(fs.readFileSync(path.join(root,'content/episode01/character-replacement-baseline.json'),'utf8'));
const manifest=JSON.parse(fs.readFileSync(path.join(root,'content/episode01/embedded-media/character-media.json'),'utf8'));
const plan=JSON.parse(fs.readFileSync(path.join(root,'content/episode01/character-replacement-plan.json'),'utf8'));

const byId=new Map((manifest.assets??[]).map(asset=>[asset.id,asset]));
const rows=[];
const errors=[];

for(const base of baseline.assets??[]){
  const current=byId.get(base.id);
  if(!current){
    rows.push({id:base.id,status:'missing'});
    errors.push(`${base.id}: missing from embedded character manifest`);
    continue;
  }
  const changed=current.sha256!==base.sha256;
  const shapeOk=current.width>=base.width && current.height>=base.height && current.alpha===true;
  rows.push({
    id:base.id,
    status:changed && shapeOk ? 'new-candidate' : changed ? 'new-invalid-shape' : 'legacy',
    width:current.width,
    height:current.height,
    bytes:current.bytes,
    sha256:current.sha256,
  });
  if(changed && !shapeOk) errors.push(`${base.id}: replacement changed but minimum dimensions/alpha contract failed`);
}

const replaced=rows.filter(row=>row.status==='new-candidate').length;
const total=baseline.assets?.length??0;
console.log(`Character replacement status: ${replaced}/${total} core portrait/map assets differ from legacy baseline.`);
for(const row of rows) console.log(` - ${row.id}: ${row.status}`);

const claimedIntegrated=(plan.batch??[]).some(item=>/integrated|complete|approved/i.test(item.state??''));
if(claimedIntegrated && replaced!==total){
  errors.push(`replacement plan claims integrated/completed state but only ${replaced}/${total} assets differ from baseline`);
}
if(strict && replaced!==total){
  errors.push(`strict replacement check requires ${total}/${total} new core assets; current ${replaced}/${total}`);
}
if(errors.length){
  console.error('Character replacement gate failed:');
  errors.forEach(error=>console.error(' -',error));
  process.exit(1);
}
if(replaced===total) console.log('All core title-cast character binaries are new candidates. Run production and visual QA before marking integrated.');
else console.log('Legacy runtime art is intentionally retained until approved replacement WebPs are staged.');

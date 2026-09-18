import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root=process.cwd();
const readJson=async file=>JSON.parse(await readFile(path.join(root,file),'utf8'));
const status=await readJson('content/episode01/character-production-status.json');
const plan=await readJson('content/episode01/character-replacement-plan.json');
const baseline=await readJson('content/episode01/character-replacement-baseline.json');
const manifest=await readJson('content/episode01/embedded-media/character-media.json');

if(status.schema_version!==1) throw new Error('unsupported character production status schema');
if(plan.pipeline_status==='ready_for_new_webp_inputs'){
  const current=new Map((manifest.assets??[]).map(asset=>[asset.id,asset]));
  const rows=(baseline.assets??[]).map(base=>{
    const asset=current.get(base.id);
    return {id:base.id,changed:Boolean(asset&&asset.sha256!==base.sha256),present:Boolean(asset)};
  });
  const changed=rows.filter(row=>row.changed).length;
  console.log(`Milestone: ${status.active_milestone}`);
  console.log(`Title-cast replacement: ${changed}/${rows.length} new core portrait/map binaries`);
  for(const row of rows) console.log(`- ${row.id}: ${row.present ? (row.changed ? 'new candidate' : 'legacy baseline') : 'missing'}`);
  if(changed<rows.length){
    const next=(status.replacement_a?.assets??[]).find(asset=>asset.status==='next')
      ?? (status.replacement_a?.assets??[]).find(asset=>!rows.find(row=>row.id===asset.id)?.changed);
    console.log(`Next asset: ${next?.file ?? status.next_asset ?? 'generate remaining title-cast WebPs'}`);
    for(const requirement of next?.requirements??[]) console.log(`- ${requirement}`);
    console.log('Do not mark the title cast as replaced yet.');
  }else{
    console.log('All eight core binaries differ from the legacy baseline.');
    console.log('Next: npm run assets:character-replacement-check && npm run assets:production-batch-a-check && npm run release:check, then main/loading/map visual QA.');
  }
  process.exit(0);
}

console.log(`Milestone: ${status.active_milestone ?? 'unknown'}`);
console.log(status.next_work ?? 'No next production step recorded.');

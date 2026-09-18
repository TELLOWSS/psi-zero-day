import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const sourcePath=path.join(root,'content/episode01/scene-element-catalog.json');
const targetPath=path.join(root,'content/episode01/scene-element-runtime.json');
const check=process.argv.includes('--check');
const source=JSON.parse(fs.readFileSync(sourcePath,'utf8'));
const placed=new Set(Object.values(source.event_elements??{}).flat().map(item=>item.element_key));
const runtime={schema_version:1,source:'scene-element-catalog.json',elements:{},event_elements:source.event_elements??{}};

for(const key of placed){
  const d=source.elements?.[key];
  if(!d) throw new Error(`Placed scene element missing from catalog: ${key}`);
  runtime.elements[key]={
    element_id:d.element_id,
    kind:d.kind,
    label:d.label,
    visual_token:d.visual_token,
    production_status:d.production_status,
    ...(d.planned_asset_id?{planned_asset_id:d.planned_asset_id}:{}),
    ...(d.art?{art:{pivot:d.art.pivot,map_max_px:d.art.map_max_px}}:{}),
    ...(d.lifting_profile?{lifting_profile:d.lifting_profile}:{}),
    ...(d.fall_protection_profile?{fall_protection_profile:d.fall_protection_profile}:{}),
    ...(d.storage_profile?{storage_profile:d.storage_profile}:{}),
    ...(d.access_control_profile?{access_control_profile:d.access_control_profile}:{}),
    ...(d.traffic_conflict_profile?{traffic_conflict_profile:d.traffic_conflict_profile}:{})
  };
}

const output=JSON.stringify(runtime,null,2)+'\n';
if(check){
  const current=fs.existsSync(targetPath)?fs.readFileSync(targetPath,'utf8'):'';
  if(current!==output){
    console.error('scene-element-runtime.json is stale. Run npm run assets:scene-runtime');
    process.exit(1);
  }
  console.log(`Verified scene runtime projection: ${Object.keys(runtime.elements).length} placed element(s), ${Buffer.byteLength(output)} bytes.`);
}else{
  fs.writeFileSync(targetPath,output);
  console.log(`Wrote scene runtime projection: ${Object.keys(runtime.elements).length} placed element(s), ${Buffer.byteLength(output)} bytes.`);
}

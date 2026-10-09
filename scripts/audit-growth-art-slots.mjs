import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..');
const read=relative=>JSON.parse(fs.readFileSync(path.join(root,relative),'utf8'));
const growth=read('content/episode01/character-growth.json');
const assets=read('content/episode01/assets.json');
const hash=relative=>createHash('sha256').update(fs.readFileSync(path.join(root,relative))).digest('hex');
const rows=Object.entries(growth.characters).map(([id,config])=>{
 const portrait=assets.assets.find(asset=>asset.asset_id===`ep01.character.${id}.portrait`);
 return {characterId:id,stageFlag:config.stage_flag,stages:Object.entries(config.stages).map(([stage,state])=>({stage,expression:state.expression,posture:state.posture,items:state.items})),portraits:(portrait?.variants??[]).map(variant=>({path:`public/${variant.uri}`,sha256:hash(`public/${variant.uri}`)})),stageSpecificManifestAssets:assets.assets.filter(asset=>asset.asset_id.startsWith(`ep01.character.${id}.`)&&growth.policy.stage_order.some(stage=>asset.asset_id.endsWith(`.${stage}`))).map(asset=>asset.asset_id),approval:'not_inferred_from_manifest_or_existing_runtime'};
});
const approvedScenes=['PLAYER-STAGE12-HANDOFF-APPROVAL.json','PLAYER-CONTROL-INTEREST-APPROVAL.json'].map(file=>{
 const approval=read(`docs/branding/${file}`),actualSha256=hash(approval.path);
 return {approvalFile:file,assetId:approval.asset_id,path:approval.path,approvedScope:approval.approved_scope,actualSha256,exactBytesMatch:actualSha256===approval.sha256,runtimeGate:approval.runtime_gate,rightsReview:approval.rights_review};
});
const pair=read('docs/branding/PLAYER-INTEREST-PAIR-APPROVAL.json');
for(const asset of pair.assets){const actualSha256=hash(asset.path);approvedScenes.push({approvalFile:'PLAYER-INTEREST-PAIR-APPROVAL.json',assetId:`player-${asset.direction}-interest-v1`,path:asset.path,approvedScope:pair.approved_scope,actualSha256,exactBytesMatch:actualSha256===asset.sha256,runtimeGate:pair.runtime_gate,rightsReview:pair.rights_and_physical_device_review});}
const result={scope:'READ_ONLY_ASSET_AND_FLAG_INVENTORY_NOT_NEW_GROWTH_UNLOCK_OR_APPROVAL',policy:growth.policy,rows,approvedScenes,summary:{characters:rows.length,stageContracts:rows.reduce((sum,row)=>sum+row.stages.length,0),separateStageManifestAssets:rows.reduce((sum,row)=>sum+row.stageSpecificManifestAssets.length,0),approvedSceneByteChecks:approvedScenes.every(scene=>scene.exactBytesMatch)}};
const output=path.join(root,'artifacts/growth-art-slots');fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify(result.summary));if(!result.summary.approvedSceneByteChecks)process.exitCode=1;

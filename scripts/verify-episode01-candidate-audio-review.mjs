// Format+source-integrity audit only: listening, loudness and commercial rights require human review.
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
const root=process.cwd(), candidate=JSON.parse(await readFile('content/episode01/candidate-audio-production.json','utf8'));
const report={status:'AUTOMATED_ASSET_ONLY',release:candidate.release,asset_count:0,score_excerpts:0,foley_one_shots:0,items:[],human_listening:'PENDING',license_rights:'PENDING',physical_android:'PENDING'};
const errors=[];
for(const item of candidate.assets){
 const buffer=await readFile(path.join(root,'public',item.uri));
 const magic=buffer.toString('ascii',0,4),sha=createHash('sha1').update('blob '+buffer.length+'\0').update(buffer).digest('hex');
 const valid=magic==='OggS'&&sha===item.git_blob_sha&&buffer.length>100;
 if(!valid)errors.push(item.asset_id+': Ogg/header/git-blob-SHA mismatch');
 report.items.push({asset_id:item.asset_id,bytes:buffer.length,git_blob_sha:sha,kind:item.kind,format:'ogg',automated_integrity:valid?'PASS':'FAIL',listening:'PENDING'});
 report[item.kind==='score_excerpt'?'score_excerpts':'foley_one_shots']++;
}
report.asset_count=report.items.length;
if(report.asset_count!==17||report.score_excerpts!==8||report.foley_one_shots!==9)errors.push('Expected 8 editorial OST excerpts and 9 distinct Foley assets.');
if(candidate.release!=='PREVIEW_ONLY_UNTIL_LICENSE_AND_LISTENING_LOCK')errors.push('Release lock unexpectedly removed');
report.status=errors.length?'FAIL':'PASS_PREVIEW_INTEGRITY_ONLY';
report.errors=errors;
await mkdir('artifacts/ep01-director-media',{recursive:true});
await writeFile('artifacts/ep01-director-media/audio-integrity.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,asset_count:report.asset_count,score_excerpts:report.score_excerpts,foley_one_shots:report.foley_one_shots,open_approvals:['headphones/speaker listening','license rights','Android physical device']}));
if(errors.length)process.exitCode=1;

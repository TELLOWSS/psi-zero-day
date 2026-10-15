import fs from 'node:fs/promises';import crypto from 'node:crypto';import sharp from 'sharp';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const generated='C:/Users/user/.codex/generated_images/01a13458-6d9f-7992-9023-d99924880690';
const masters=['exec-87eab867-4f37-43a4-a236-5df858e0bf3a.png','exec-6d428262-f10e-4535-b5e9-eb5022dd2db3.png','exec-4375ff95-76e3-4523-aeed-9d3a99596c17.png'];
await fs.mkdir('public/assets/defense/guard-v1',{recursive:true});const boards=[];
for(const [i,name] of masters.entries()){const file=`public/assets/defense/guard-v1/gd-0${i+1}.webp`;await sharp(`${generated}/${name}`).resize(1600,960,{fit:'fill'}).webp({quality:91}).toFile(file);const b=await fs.readFile(file);boards.push({stageId:`GD-0${i+1}`,uri:file.slice(7),source:`${generated}/${name}`,width:1600,height:960,sha256:sha(b),bytes:b.length,status:'FINAL_CANDIDATE_RUNTIME_INTEGRATED'});}
await fs.writeFile('content/defense/guard-art-v1.json',JSON.stringify({schemaVersion:1,generator:'built-in image_gen',boards},null,2)+'\n');
const root='public/assets/defense/audio/guard-v1',assets=[];
for(const file of (await fs.readdir(root)).sort()){const bytes=await fs.readFile(`${root}/${file}`);assets.push({id:file.replace('.mp3',''),uri:`assets/defense/audio/guard-v1/${file}`,bytes:bytes.length,sha256:sha(bytes),role:file.startsWith('MUSIC_')?'FULL_MIX_MUSIC':'ONE_SHOT_SFX'});}
if(assets.length!==32)throw Error('Expected 32 supplied MP3s');
const zip='C:/Users/user/Downloads/PSI_DEFENSE_AUDIO_32_GENERATED_20261015.zip';
await fs.writeFile('content/defense/guard-audio-v1.json',JSON.stringify({schemaVersion:1,status:'USER_SUPPLIED_RUNTIME_INTEGRATED_RIGHTS_NOT_VERIFIED',sourceZip:zip,sourceZipSha256:sha(await fs.readFile(zip)),musicPolicy:'ONE_FULL_MIX_AT_A_TIME_CROSSFADED_NOT_STEMS',assets},null,2)+'\n');console.log(JSON.stringify({boards:boards.length,audio:assets.length,uniqueAudio:new Set(assets.map(a=>a.sha256)).size}));

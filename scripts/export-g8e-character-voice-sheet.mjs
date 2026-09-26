import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const manifest=JSON.parse(fs.readFileSync(path.join(root,'content/episode01/g8e-character-voice-layer.json'),'utf8'));
const locFiles=[
  'content/episode01/ko.json',
  'content/episode01/responsibility-ko.json',
  'content/episode01/stopwork-ko.json',
  'content/episode01/record-pressure-ko.json',
];
const messages={};
for(const file of locFiles){
  const data=JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
  Object.assign(messages,data.messages??data);
}
const cast=Object.fromEntries(manifest.cast.map(x=>[x.characterId,x]));
const outDir=path.resolve(process.env.PSI_G8E_VOICE_ARTIFACT_DIR||'artifacts/g8e-character-voice');
fs.mkdirSync(outDir,{recursive:true});

const rows=manifest.cues.map(cue=>{
  const actor=cast[cue.speakerId];
  const text=messages[cue.textId];
  if(!text) throw new Error('Missing Korean line for '+cue.textId);
  return {
    cue_id:cue.cueId,
    event_id:cue.eventId,
    node_id:cue.nodeId,
    beat:cue.beat,
    character_id:cue.speakerId,
    character_name:actor?.displayName??cue.speakerId,
    age:actor?.age??null,
    role:actor?.role??null,
    voice_direction:actor?.voiceDirection??'',
    text_id:cue.textId,
    korean_text:text,
    target_uri:cue.targetUri,
    asset_id:cue.assetId,
    target_duration_min_sec:cue.targetDurationSec[0],
    target_duration_max_sec:cue.targetDurationSec[1],
    gain:cue.gain,
    runtime_state:cue.runtimeState,
  };
});

fs.writeFileSync(path.join(outDir,'g8e-voice-sheet.json'),JSON.stringify({
  schemaVersion:1,
  source:'Episode 01 authored Korean localization',
  status:manifest.status,
  runtimePolicy:manifest.runtimePolicy,
  rows,
},null,2)+'\n');

const columns=Object.keys(rows[0]);
const quote=v=>'"'+String(v??'').replaceAll('"','""')+'"';
const csv=['\uFEFF'+columns.map(quote).join(','),...rows.map(row=>columns.map(key=>quote(row[key])).join(','))].join('\r\n')+'\r\n';
fs.writeFileSync(path.join(outDir,'g8e-voice-sheet.csv'),csv,'utf8');

const summary=[
  '# G8-E Character Voice Production Sheet',
  '',
  'Status: '+manifest.status,
  'Planned cues: '+rows.length,
  'Distinct characters: '+new Set(rows.map(row=>row.character_id)).size,
  '',
  'Rules:',
  '- Subtitles remain authoritative and visible.',
  '- Do not synthesize filler dialogue.',
  '- Do not add runtime assets until the real binary exists and is reviewed.',
  '- Keep field ambience under spoken lines through runtime ducking.',
  '',
  ...rows.flatMap((row,index)=>[
    '## '+String(index+1).padStart(2,'0')+' · '+row.character_name+' · '+row.beat,
    row.korean_text,
    '',
    'Direction: '+row.voice_direction,
    'Target: '+row.target_uri+' · '+row.target_duration_min_sec+'–'+row.target_duration_max_sec+'s',
    '',
  ]),
].join('\n');
fs.writeFileSync(path.join(outDir,'g8e-voice-sheet.md'),summary+'\n','utf8');

console.log(JSON.stringify({
  status:manifest.status,
  plannedCues:rows.length,
  distinctCharacters:new Set(rows.map(row=>row.character_id)).size,
  outputDir:outDir,
},null,2));

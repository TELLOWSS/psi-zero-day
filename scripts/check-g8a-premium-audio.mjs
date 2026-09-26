import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const requireFinal=process.argv.includes('--require-final');
const contract=JSON.parse(fs.readFileSync(path.join(root,'content/defense/g8a-premium-audio-production.json'),'utf8'));

const slots=[
  ...contract.dynamicScore.stems.map(item=>({kind:'score',id:item.id,path:item.path,state:item.state})),
  ...contract.fieldSound.map(item=>({kind:'field',id:item.id,path:item.path,state:item.state})),
  ...contract.gameplaySfx.map(item=>({kind:'gameplay',id:item.cue,path:item.path,state:item.state})),
];

const failures=[];
const rows=[];
for(const item of slots){
  const abs=path.join(root,'public',item.path);
  const exists=fs.existsSync(abs);
  let bytes=0;
  let ogg=false;
  if(exists){
    const data=fs.readFileSync(abs);
    bytes=data.length;
    ogg=data.subarray(0,4).toString('ascii')==='OggS';
    if(bytes<2048) failures.push(item.id+': audio binary too small');
    if(!ogg) failures.push(item.id+': runtime binary is not an Ogg container');
  }
  if(item.state==='PRODUCTION_APPROVED' && !exists) failures.push(item.id+': approved slot has no runtime binary');
  if(item.state!=='PRODUCTION_APPROVED' && exists) failures.push(item.id+': binary exists but manifest is not approved');
  rows.push({...item,exists,bytes,ogg});
}

const approved=rows.filter(row=>row.state==='PRODUCTION_APPROVED').length;
const present=rows.filter(row=>row.exists).length;
if(contract.acceptance.requiredAssetCount!==slots.length){
  failures.push('requiredAssetCount mismatch: '+contract.acceptance.requiredAssetCount+' != '+slots.length);
}
if(contract.acceptance.finalBinaryCount!==present){
  failures.push('finalBinaryCount stale: '+contract.acceptance.finalBinaryCount+' != '+present);
}
if(contract.absoluteRules.oscillatorFinalAudioForbidden!==true){
  failures.push('oscillatorFinalAudioForbidden must remain true');
}
if(contract.absoluteRules.sourceMaster.sampleRateHz!==48000 || contract.absoluteRules.sourceMaster.bitDepth!==24){
  failures.push('source master must remain 48kHz / 24-bit');
}
if(requireFinal){
  if(contract.status!=='AUDIO_PRODUCTION_LOCKED') failures.push('contract is not AUDIO_PRODUCTION_LOCKED');
  if(contract.acceptance.productionLockAllowed!==true) failures.push('productionLockAllowed is not true');
  if(approved!==slots.length) failures.push('not all premium audio slots are approved');
  if(present!==slots.length) failures.push('not all premium audio binaries are present');
}

const report={
  gate:contract.gate,
  status:contract.status,
  required:slots.length,
  approved,
  present,
  oscillatorFinalAudioForbidden:contract.absoluteRules.oscillatorFinalAudioForbidden,
  productionLockAllowed:contract.acceptance.productionLockAllowed,
  rows,
  failures,
  result:failures.length?'FAIL':(requireFinal?'FINAL_AUDIO_VALID':'AUDIO_PREPRODUCTION_VALID'),
};
console.log('G8A_PREMIUM_AUDIO='+JSON.stringify(report));
if(failures.length) process.exit(1);

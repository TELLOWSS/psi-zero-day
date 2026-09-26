import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root=process.cwd();
const requireFinal=process.argv.includes('--require-final');
const contract=JSON.parse(fs.readFileSync(path.join(root,'content/defense/g8a-premium-audio-production.json'),'utf8'));
const ledger=JSON.parse(fs.readFileSync(path.join(root,'content/defense/g8a-premium-audio-qa-ledger.json'),'utf8'));

function probe(rel){
  const abs=path.join(root,'public',rel);
  if(!fs.existsSync(abs)) return {exists:false};
  const ff=spawnSync('ffprobe',[
    '-v','error','-show_entries','stream=sample_rate,channels,codec_name:format=duration',
    '-of','json',abs
  ],{encoding:'utf8'});
  if(ff.status!==0) return {exists:true,error:(ff.stderr||ff.stdout||'ffprobe failed').trim()};
  const parsed=JSON.parse(ff.stdout||'{}');
  const stream=(parsed.streams||[])[0]||{};
  return {
    exists:true,
    codec:stream.codec_name||null,
    sampleRate:Number(stream.sample_rate||0),
    channels:Number(stream.channels||0),
    duration:Number(parsed.format?.duration||0),
  };
}

function peak(rel){
  const abs=path.join(root,'public',rel);
  if(!fs.existsSync(abs)) return null;
  const ff=spawnSync('ffmpeg',[
    '-hide_banner','-nostats','-i',abs,
    '-filter_complex','ebur128=peak=true',
    '-f','null','-'
  ],{encoding:'utf8'});
  const out=(ff.stderr||'')+'\n'+(ff.stdout||'');
  const tp=[...out.matchAll(/Peak:\s*(-?\d+(?:\.\d+)?)\s*dBFS/gi)].at(-1);
  const integrated=[...out.matchAll(/I:\s*(-?\d+(?:\.\d+)?)\s*LUFS/gi)].at(-1);
  return {
    truePeakDbfs:tp?Number(tp[1]):null,
    integratedLufs:integrated?Number(integrated[1]):null,
  };
}

const slots=[
  ...contract.dynamicScore.stems.map(item=>({id:item.id,path:item.path,state:item.state,category:'SCORE'})),
  ...contract.fieldSound.map(item=>({id:item.id,path:item.path,state:item.state,category:'FIELD'})),
  ...contract.gameplaySfx.map(item=>({id:item.cue,path:item.path,state:item.state,category:'GAMEPLAY'})),
];

const failures=[];
const rows=[];
for(const slot of slots){
  const p=probe(slot.path);
  let loudness=null;
  if(p.exists && !p.error) loudness=peak(slot.path);
  if(slot.state==='PRODUCTION_APPROVED'){
    if(!p.exists) failures.push(slot.id+': approved file missing');
    else if(p.error) failures.push(slot.id+': ffprobe failed: '+p.error);
    else {
      if(p.sampleRate!==48000) failures.push(slot.id+': sample rate '+p.sampleRate+' != 48000');
      if(!['opus','vorbis'].includes(String(p.codec))) failures.push(slot.id+': unexpected Ogg codec '+p.codec);
      if(!(p.duration>0)) failures.push(slot.id+': invalid duration');
      if(loudness?.truePeakDbfs!==null && loudness.truePeakDbfs>-1.0) failures.push(slot.id+': peak exceeds -1 dBFS target: '+loudness.truePeakDbfs);
    }
  }
  rows.push({...slot,...p,loudness});
}

const byId=new Map(rows.map(r=>[r.id,r]));
const loopIds=['score.foundation_bed','score.pressure_ostinato','score.swift_threat'];
const loopRows=loopIds.map(id=>byId.get(id)).filter(Boolean);
if(loopRows.every(r=>r.state==='PRODUCTION_APPROVED' && r.exists && !r.error)){
  const target=45.7142857;
  for(const r of loopRows){
    if(Math.abs(r.duration-target)>0.08) failures.push(r.id+': 16-bar loop duration '+r.duration+' not within 80 ms of '+target);
  }
  const durations=loopRows.map(r=>r.duration);
  if(Math.max(...durations)-Math.min(...durations)>0.04){
    failures.push('score loop stems are not sample-time aligned closely enough: '+JSON.stringify(durations));
  }
}

const control=byId.get('score.control_intervention');
if(control?.state==='PRODUCTION_APPROVED' && (control.duration<2.0 || control.duration>3.5)){
  failures.push('score.control_intervention duration outside 2.0-3.5 s');
}

const reverse=byId.get('swift.reverse_alarm');
if(reverse?.state==='PRODUCTION_APPROVED' && (reverse.duration<4 || reverse.duration>8.5)){
  failures.push('swift.reverse_alarm duration outside loop target');
}

const approved=rows.filter(r=>r.state==='PRODUCTION_APPROVED').length;
const present=rows.filter(r=>r.exists).length;
if(requireFinal){
  if(contract.status!=='AUDIO_PRODUCTION_LOCKED') failures.push('contract status is not AUDIO_PRODUCTION_LOCKED');
  if(contract.acceptance.productionLockAllowed!==true) failures.push('productionLockAllowed is false');
  if(approved!==24 || present!==24) failures.push('final audio requires 24/24 approved and present');
  if(ledger.approvedAssetCount!==24) failures.push('QA ledger is not 24/24 approved');
  for(const item of ledger.items){
    for(const key of ['technicalQa','headphoneQa','androidPhoneQa','smallSpeakerQa','maskingQa','fatigueQa']){
      if(item[key]!=='PASS') failures.push(item.id+': '+key+' is not PASS');
    }
    if(item.productionApproved!==true) failures.push(item.id+': productionApproved is not true');
  }
  if(ledger.actualPlay.desktop!=='PASS') failures.push('desktop actual-play audio QA not PASS');
  if(ledger.actualPlay.androidMobile!=='PASS') failures.push('Android actual-play audio QA not PASS');
  if(ledger.actualPlay.oscillatorFallbackCount!==0) failures.push('oscillator fallback count is not zero');
}

const report={gate:contract.gate,requireFinal,approved,present,rows,failures,result:failures.length?'FAIL':(requireFinal?'PREMIUM_AUDIO_TECHNICAL_PASS':'PREMIUM_AUDIO_TECHNICAL_STATUS')};
console.log('G8A_PREMIUM_AUDIO_TECH='+JSON.stringify(report));
if(failures.length) process.exit(1);

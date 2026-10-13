import {spawnSync} from 'node:child_process';
import {mkdirSync,readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';

const ffmpeg=process.env.FFMPEG_PATH||'ffmpeg';
const source=process.argv[2];
const render=process.argv.includes('--render');
if(!source)throw new Error('Pass the extracted PSI_ZERO_DAY_SFX_V2_WAV_PACK directory.');

const defs=[
 ['radio_release','A','PSI_SFX_RADIO_RELEASE_V2_A.wav',-20],
 ['radio_release','B','PSI_SFX_RADIO_RELEASE_V2_B.wav',-20],
 ['radio_release','C','PSI_SFX_RADIO_RELEASE_V2_C.wav',-20],
 ['extinguisher_release','A','PSI_SFX_EXTINGUISHER_RELEASE_V2_A.wav',-20],
 ['extinguisher_release','B','PSI_SFX_EXTINGUISHER_RELEASE_V2_B.wav',-20],
 ['extinguisher_release','C','PSI_SFX_EXTINGUISHER_RELEASE_V2_C.wav',-20],
 ['drone_release','A','PSI_SFX_DRONE_PRECISION_RELEASE_V2_A.wav',-20],
 ['drone_release','B','PSI_SFX_DRONE_PRECISION_RELEASE_V2_B.wav',-20],
 ['drone_release','C','PSI_SFX_DRONE_PRECISION_RELEASE_V2_C.wav',-20],
 ['drone_premium_release','A','PSI_SFX_DRONE_PREMIUM_RELEASE_V2_A.wav',-20],
 ['drone_premium_release','B','PSI_SFX_DRONE_PREMIUM_RELEASE_V2_B.wav',-20],
 ['drone_premium_release','C','PSI_SFX_DRONE_PREMIUM_RELEASE_V2_C.wav',-20],
 ['drone_hunter_burst','A','PSI_SFX_DRONE_HUNTER_BURST_V2_A.wav',-20],
 ['drone_hunter_burst','B','PSI_SFX_DRONE_HUNTER_BURST_V2_B.wav',-20],
 ['drone_launch','A','PSI_SFX_DRONE_LAUNCH_V2_A.wav',-22],
 ['drone_dock','A','PSI_SFX_DRONE_DOCK_V2_A.wav',-22],
 ['tesla_control','A','PSI_SFX_TESLA_CONTROL_V2_A.wav',-20],
 ['tesla_control','B','PSI_SFX_TESLA_CONTROL_V2_B.wav',-20],
 ['tesla_control','C','PSI_SFX_TESLA_CONTROL_V2_C.wav',-20],
 ['impact_steel','A','PSI_SFX_IMPACT_STEEL_V2_A.wav',-20],
 ['impact_steel','B','PSI_SFX_IMPACT_STEEL_V2_B.wav',-20],
 ['impact_steel','C','PSI_SFX_IMPACT_STEEL_V2_C.wav',-20],
 ['impact_concrete','A','PSI_SFX_IMPACT_CONCRETE_V2_A.wav',-20],
 ['impact_concrete','B','PSI_SFX_IMPACT_CONCRETE_V2_B.wav',-20],
 ['impact_concrete','C','PSI_SFX_IMPACT_CONCRETE_V2_C.wav',-20],
 ['player_hit','A','PSI_SFX_PLAYER_HIT_V2_A.wav',-20],
 ['player_hit','B','PSI_SFX_PLAYER_HIT_V2_B.wav',-20],
 ['pickup','A','PSI_SFX_PICKUP_V2_A.wav',-23],
 ['pickup','B','PSI_SFX_PICKUP_V2_B.wav',-23],
 ['footstep_concrete','A','PSI_SFX_FOOTSTEP_CONCRETE_V2_A.wav',-24],
 ['footstep_concrete','B','PSI_SFX_FOOTSTEP_CONCRETE_V2_B.wav',-24],
 ['footstep_concrete','C','PSI_SFX_FOOTSTEP_CONCRETE_V2_C.wav',-24],
 ['footstep_concrete','D','PSI_SFX_FOOTSTEP_CONCRETE_V2_D.wav',-24],
 ['footstep_steel','A','PSI_SFX_FOOTSTEP_STEEL_V2_A.wav',-24],
 ['footstep_steel','B','PSI_SFX_FOOTSTEP_STEEL_V2_B.wav',-24],
 ['footstep_steel','C','PSI_SFX_FOOTSTEP_STEEL_V2_C.wav',-24],
 ['footstep_steel','D','PSI_SFX_FOOTSTEP_STEEL_V2_D.wav',-24],
 ['ui_equip','A','PSI_SFX_UI_EQUIP_V2_A.wav',-24],
 ['ui_denied','A','PSI_SFX_UI_DENIED_V2_A.wav',-24],
 ['target_controlled','A','PSI_SFX_TARGET_CONTROLLED_V2_A.wav',-20],
 ['boss_alert','A','PSI_CUE_BOSS_ALERT_V2_A.wav',-19],
 ['incident_secured','A','PSI_CUE_INCIDENT_SECURED_V2_A.wav',-19],
 ['site_night','A','PSI_AMBIENCE_SITE_NIGHT_V2_A.wav',-34],
];

const output='public/assets/survivors/sfx-v2';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const run=args=>{
 const result=spawnSync(ffmpeg,args,{maxBuffer:256*1024*1024,windowsHide:true});
 if(result.status!==0)throw new Error(result.stderr.toString());
 return result.stdout;
};
const db=value=>20*Math.log10(Math.max(value,1e-12));
if(render)mkdirSync(output,{recursive:true});
const report=[];

for(const [id,variant,name,targetRmsDb] of defs){
 const input=join(source,name);
 if(!existsSync(input))throw new Error('Missing '+name);
 const stereo=id==='site_night',channels=stereo?2:1;
 const pcm=run(['-v','error','-i',input,'-af','highpass=f=20','-f','f32le','-ac',String(channels),'-ar','48000','pipe:1']);
 const samples=new Float32Array(pcm.buffer,pcm.byteOffset,pcm.length/4);
 let peak=0,energy=0,clipped=0,first=-1,last=-1;
 for(let i=0;i<samples.length;i++){
   const v=Math.abs(samples[i]);peak=Math.max(peak,v);energy+=v*v;if(v>=1)clipped++;
   if(v>.001){if(first<0)first=i;last=i;}
 }
 const sampleRatePerInterleaved=48000*channels;
 const duration=samples.length/sampleRatePerInterleaved;
 const rms=Math.sqrt(energy/Math.max(1,samples.length));
 const requested=10**(targetRmsDb/20)/Math.max(rms,1e-12);
 const peakCeiling=10**(-1.5/20)/Math.max(peak,1e-12);
 const gain=Math.min(requested,peakCeiling);
 const gainDb=db(gain);
 const runtimeName=id+'_'+variant.toLowerCase()+'.ogg';
 const entry={
   id,variant,source:name,sourceSha256:hash(readFileSync(input)),duration,
   sampleRate:48000,channels,targetRmsDb,
   sourcePeakDbfs:db(peak),sourceRmsDbfs:db(rms),decodedOverFullScaleSamples:clipped,
   leadingSilenceSeconds:first<0?duration:first/sampleRatePerInterleaved,
   trailingSilenceSeconds:last<0?duration:(samples.length-1-last)/sampleRatePerInterleaved,
   gainDb,status:'CANDIDATE',technicalPass:true,listeningApproval:false,
 };
 if(render){
   const destination=join(output,runtimeName);
   const fade=stereo?.008:.0015;
   run(['-v','error','-y','-i',input,'-af',`highpass=f=20,volume=${gainDb}dB,afade=t=in:d=${fade},afade=t=out:st=${Math.max(0,duration-fade)}:d=${fade}`,'-ar','48000','-c:a','libvorbis','-q:a','5',destination]);
   entry.uri='/assets/survivors/sfx-v2/'+runtimeName;
   entry.sha256=hash(readFileSync(destination));
   const decoded=run(['-v','error','-i',destination,'-f','f32le','-ac',String(channels),'-ar','48000','pipe:1']);
   const runtime=new Float32Array(decoded.buffer,decoded.byteOffset,decoded.length/4);
   let runtimePeak=0,runtimeClipped=0;
   for(const sample of runtime){runtimePeak=Math.max(runtimePeak,Math.abs(sample));if(Math.abs(sample)>=1)runtimeClipped++;}
   entry.runtimePeakDbfs=db(runtimePeak);entry.runtimeOverFullScaleSamples=runtimeClipped;
   if(runtimeClipped)throw new Error('Runtime decode clips: '+runtimeName);
 }
 report.push(entry);
}
if(render)writeFileSync('content/survivors-sfx-v2-ingest.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));

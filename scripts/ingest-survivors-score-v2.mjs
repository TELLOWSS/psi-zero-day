import {spawnSync} from 'node:child_process';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';

const ffmpeg=process.env.FFMPEG_PATH;
if(!ffmpeg)throw new Error('Set FFMPEG_PATH to the local ffmpeg executable.');
const source=process.argv[2];
if(!source)throw new Error('Pass the source audio directory.');
const output='public/assets/survivors/score-v2';
const definitions=[
 ['ready','PSI_M01_READY_v01',null],['foundation','PSI_M02_FOUNDATION_v02',null],
 ['pressure','PSI_M03_PRESSURE_v02',null],['heavy_risk','PSI_M04_HEAVY_RISK_v02',null],
 ['evolution','PSI_CUE_EVOLUTION_v01',3],['intervention','PSI_CUE_SHOUT_FX_v01',2.5],
 ['boss_alert','PSI_CUE_BOSS_ALERT_v01',1.5],['success','PSI_CUE_SUCCESS_v01',4],
 ['failure','PSI_CUE_FAILURE_v01',3],
];
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const run=args=>{
 const result=spawnSync(ffmpeg,args,{maxBuffer:128*1024*1024});
 if(result.status!==0)throw new Error(result.stderr.toString());
 return result.stdout;
};
const report=[];
const valuesPerSecond=48000;
if(process.argv.includes('--render'))mkdirSync(output,{recursive:true});
for(const [id,name,cueDuration] of definitions){
 const input=join(source,name+'.mp3');
 const pcm=run(['-v','error','-i',input,'-f','f32le','-ac','2','-ar','24000','pipe:1']);
 const samples=new Float32Array(pcm.buffer,pcm.byteOffset,pcm.length/4);
 let energy=0,peak=0,clipped=0;
 for(const sample of samples){energy+=sample*sample;peak=Math.max(peak,Math.abs(sample));if(Math.abs(sample)>=1)clipped++;}
 const duration=samples.length/valuesPerSecond,rms=Math.sqrt(energy/samples.length);
 let start=0;
 // Technical onset selection, not an artistic listening approval. Preserve early musical context.
 if(cueDuration){
  for(let i=0;i<Math.min(samples.length,valuesPerSecond*15);i+=4800){
   let local=0;for(let j=i;j<Math.min(i+4800,samples.length);j++)local+=samples[j]*samples[j];
   if(Math.sqrt(local/4800)>Math.max(.008,rms*.45)){start=Math.max(0,i/valuesPerSecond-.03);break;}
  }
 }
 const length=cueDuration?Math.min(cueDuration,duration-start):duration;
 let excerptEnergy=0,excerptPeak=0;
 const begin=Math.floor(start*valuesPerSecond),end=Math.min(samples.length,Math.floor((start+length)*valuesPerSecond));
 for(let i=begin;i<end;i++){excerptEnergy+=samples[i]**2;excerptPeak=Math.max(excerptPeak,Math.abs(samples[i]));}
 const excerptRms=Math.sqrt(excerptEnergy/(end-begin));
 const gain=Math.min(10**((cueDuration?-18:-21)/20)/Math.max(.0001,excerptRms),.85/Math.max(.0001,excerptPeak));
 const entry={id,source:name+'.mp3',sourceSha256:hash(readFileSync(input)),duration,peak,rms,decodedOverFullScaleSamples:clipped,start,length,gainDb:20*Math.log10(gain),selection:cueDuration?'first early audible onset; technical candidate':'full track; runtime crossfade loop'};
 if(process.argv.includes('--render')){
  const destination=join(output,id+'.ogg');
  const fades=cueDuration?`,afade=t=in:d=0.015,afade=t=out:st=${Math.max(0,length-.25)}:d=0.25`:'';
  run(['-v','error','-y','-ss',String(start),'-i',input,'-t',String(length),'-af',`volume=${entry.gainDb}dB${fades}`,'-ar','48000','-c:a','libvorbis','-q:a','5',destination]);
  entry.uri='/assets/survivors/score-v2/'+id+'.ogg';entry.sha256=hash(readFileSync(destination));
 }
 report.push(entry);
}
if(process.argv.includes('--render'))writeFileSync('content/survivors-score-v2-ingest.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));

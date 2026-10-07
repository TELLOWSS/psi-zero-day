import {spawnSync} from 'node:child_process';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';

const source=process.argv[2];
if(!source)throw new Error('Pass the extracted impact SFX directory.');
const ffmpeg=process.env.FFMPEG_PATH||'ffmpeg',render=process.argv.includes('--render');
const output='public/assets/survivors/impact-sfx-v1';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const run=args=>{
 const result=spawnSync(ffmpeg,args,{maxBuffer:32*1024*1024,windowsHide:true});
 if(result.status!==0)throw new Error(result.stderr.toString());
 return result.stdout;
};
const db=value=>20*Math.log10(Math.max(value,1e-12));
const measure=pcm=>{
 const samples=new Float32Array(pcm.buffer,pcm.byteOffset,pcm.length/4);
 let peak=0,energy=0,clipped=0,first=-1,last=-1;
 for(let i=0;i<samples.length;i++){
  const v=Math.abs(samples[i]);peak=Math.max(peak,v);energy+=v*v;if(v>=1)clipped++;
  if(v>.001){if(first<0)first=i;last=i;}
 }
 return {samples:samples.length,peak,rms:Math.sqrt(energy/Math.max(1,samples.length)),clipped,first,last};
};
if(render)mkdirSync(output,{recursive:true});
const report=[];
for(const [family,id] of [['METAL','impact_steel'],['CONCRETE','impact_concrete'],['FINISHER','impact_finisher']]){
 for(const variant of ['A','B','C']){
  const name=`SFX_IMPACT_${family}_${variant}_v01.mp3`,input=join(source,name);
  const decoded=measure(run(['-v','error','-i',input,'-f','f32le','pipe:1']));
  const mono=measure(run(['-v','error','-i',input,'-ac','1','-f','f32le','pipe:1']));
  const sampleRate=44100,duration=mono.samples/sampleRate,targetRmsDb=id==='impact_finisher'?-21:-23;
  if(!mono.peak||mono.first<0||decoded.clipped)throw new Error('Silent or clipped source: '+name);
  const gain=Math.min(10**(targetRmsDb/20)/mono.rms,10**(-3/20)/mono.peak,10**(6/20));
  const entry={id,variant,source:name,sourceSha256:hash(readFileSync(input)),sampleRate,sourceChannels:2,channels:1,duration,
   sourcePeakDbfs:db(decoded.peak),sourceRmsDbfs:db(decoded.rms),decodedOverFullScaleSamples:decoded.clipped,
   leadingSilenceSeconds:mono.first/sampleRate,trailingSilenceSeconds:(mono.samples-1-mono.last)/sampleRate,
   gainDb:db(gain),targetRmsDb,status:'CANDIDATE',listeningApproval:false,rightsApproval:process.argv.includes('--rights-approved'),
   sourceTool:'Manus / manus-tools generate_sound_effect',processing:'Mono downmix, measured gain and short edge fades; native 44100 Hz retained. No upsampling or quality-restoration claim.'};
  if(render){
   const destination=join(output,`${id}_${variant.toLowerCase()}.wav`);
   run(['-v','error','-y','-i',input,'-ac','1','-af',`volume=${entry.gainDb}dB,afade=t=in:d=0.001,afade=t=out:st=${Math.max(0,duration-.012)}:d=0.012`,'-c:a','pcm_s16le',destination]);
   const runtime=measure(run(['-v','error','-i',destination,'-f','f32le','pipe:1']));
   entry.uri='/assets/survivors/impact-sfx-v1/'+`${id}_${variant.toLowerCase()}.wav`;
   entry.sha256=hash(readFileSync(destination));entry.runtimePeakDbfs=db(runtime.peak);entry.runtimeOverFullScaleSamples=runtime.clipped;
   entry.technicalPass=runtime.clipped===0&&runtime.peak>0&&runtime.peak<1;
   if(!entry.technicalPass)throw new Error('Runtime validation failed: '+name);
  }
  report.push(entry);
 }
}
if(render)writeFileSync('content/survivors-impact-sfx-ingest.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));

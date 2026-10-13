import {spawnSync} from 'node:child_process';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
const ffmpeg=process.env.FFMPEG_PATH,source=process.argv[2];
if(!ffmpeg||!source)throw new Error('Set FFMPEG_PATH and pass the source directory.');
const definitions=[
 ['radio_release','PSI_SFX_RADIO_RELEASE_v01_A.mp3'],['drone_release','PSI_SFX_DRONE_RELEASE_v01_A.mp3'],
 ['tesla_control','PSI_SFX_TESLA_CONTROL_v01_A.mp3'],['pickup','PSI_SFX_PICKUP_v01_A.mp3'],
 ['drone_launch','PSI_SFX_DRONE_LAUNCH_v01_A.mp3'],['drone_dock','PSI_SFX_DRONE_DOCK_v01_A.mp3'],
 ['ui_equip','PSI_SFX_UI_EQUIP_v01_A.mp3'],['ui_denied','PSI_SFX_UI_DENIED_v01_A.mp3'],
 [null,'DcUDQwad.mp3'],[null,'ToX8Y7kk.mp3'],[null,'mDJ0b7al.mp3'],[null,'QsWhV0ou.mp3'],[null,'ilSuAwM9.mp3'],[null,'mpmMBBYn.mp3'],[null,'NS8YwVIF.mp3'],
];
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const run=args=>{const result=spawnSync(ffmpeg,args,{maxBuffer:128*1024*1024});if(result.status!==0)throw new Error(result.stderr.toString());return result.stdout;};
const output='public/assets/survivors/sfx-v1',render=process.argv.includes('--render');
if(render)mkdirSync(output,{recursive:true});
const report=[];
for(const [id,name] of definitions){
 const input=join(source,name),pcm=run(['-v','error','-i',input,'-f','f32le','-ac','2','-ar','24000','pipe:1']);
 const samples=new Float32Array(pcm.buffer,pcm.byteOffset,pcm.length/4);
 let peak=0,energy=0,clipped=0,first=-1,last=-1;
 for(let i=0;i<samples.length;i++){const value=Math.abs(samples[i]);peak=Math.max(peak,value);energy+=value*value;if(value>=1)clipped++;if(value>.002){if(first<0)first=i;last=i;}}
 const duration=samples.length/48000,rms=Math.sqrt(energy/samples.length);
 const entry={id,source:name,sourceSha256:hash(readFileSync(input)),duration,peak,rms,decodedOverFullScaleSamples:clipped,leadingSilenceSeconds:first<0?duration:first/48000,trailingSilenceSeconds:last<0?duration:(samples.length-last)/48000,status:'CANDIDATE',mapping:id?'EXPLICIT_FILENAME':'AWAITING_DIRECTOR_MAPPING',listeningApproval:false};
 if(id&&render){
   if(first<0||rms<.0001)throw new Error(`${name}: silent source cannot be applied.`);
   const gain=Math.min(10**(-20/20)/rms,.8/Math.max(.0001,peak),10**(12/20));
   entry.gainDb=20*Math.log10(gain);
   const destination=join(output,id+'.ogg');
   run(['-v','error','-y','-i',input,'-af',`volume=${entry.gainDb}dB,afade=t=in:d=0.002,afade=t=out:st=${Math.max(0,duration-.025)}:d=0.025`,'-ar','48000','-c:a','libvorbis','-q:a','5',destination]);
   entry.uri='/assets/survivors/sfx-v1/'+id+'.ogg';entry.sha256=hash(readFileSync(destination));
 }
 report.push(entry);
}
if(render)writeFileSync('content/survivors-sfx-v1-ingest.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));

import {it,expect,vi} from 'vitest';
import sharp from 'sharp';import {createHash} from 'node:crypto';
import {drawAuthoredRadioLaunch,VOICE_LENS_RELEASE_DURATION} from '../src/ui/survivors-authored-radio-launch';
import {ProjectileFeedbackLayer} from '../src/ui/survivors-projectile-feedback';
const atlas={naturalWidth:1536,naturalHeight:1024} as HTMLImageElement;
const event={projectileId:'radio-1',kind:'radio' as const,phase:'launch' as const,x:10,y:20,angle:1,radius:4};
const context=()=>({save:vi.fn(),restore:vi.fn(),translate:vi.fn(),rotate:vi.fn(),drawImage:vi.fn()} as unknown as CanvasRenderingContext2D);
it('reserves this authored sequence for actual voice-lens radio launch and preserves input',()=>{
 const ctx=context(),before=JSON.stringify(event);
 expect(drawAuthoredRadioLaunch(ctx,atlas,event,.05,.24,false,false,['voice_lens'])).toBe(true);
 expect(ctx.drawImage).toHaveBeenCalledTimes(2);expect(ctx.rotate).toHaveBeenCalledWith(1);
 expect(JSON.stringify(event)).toBe(before);
 for(const [e,reduced,gear] of [[{...event,worker:true},false,['voice_lens']],[{...event,blocked:true},false,['voice_lens']],
  [{...event,phase:'impact' as const},false,['voice_lens']],[{...event,kind:'satellite_wave' as const},false,['voice_lens']],
  [event,true,['voice_lens']],[event,false,['broadcast_crown']]] as const)
  expect(drawAuthoredRadioLaunch(context(),atlas,e,0,.24,reduced,false,gear)).toBe(false);
 expect(drawAuthoredRadioLaunch(context(),undefined,event,0,.24,false,false,['voice_lens'])).toBe(false);
});
it('uses at most one busy stamp and ends at the bounded duration',()=>{
 const ctx=context();drawAuthoredRadioLaunch(ctx,atlas,event,.1,.24,false,true,['voice_lens']);
 expect(ctx.drawImage).toHaveBeenCalledTimes(1);
 expect(drawAuthoredRadioLaunch(ctx,atlas,event,.24,.24,false,false,['voice_lens'])).toBe(false);
});
it('replaces the feedback core without stacking a generic contact and advances through six frames',()=>{
 const layer=new ProjectileFeedbackLayer(),ctx=context(),frames=new Set<number>();
 layer.ingest([event],false,['voice_lens']);
 for(let i=0;i<14;i++){
  vi.mocked(ctx.drawImage).mockClear();layer.draw(ctx,false,false,{radioLaunchAtlas:atlas,equipped:['voice_lens']});
  for(const args of vi.mocked(ctx.drawImage).mock.calls){expect(args[0]).toBe(atlas);frames.add(Number(args[1])/512+Number(args[2])/512*3);}
  layer.advance(VOICE_LENS_RELEASE_DURATION/14);
 }
 expect(frames.size).toBe(6);layer.advance(.01);expect(layer.size).toBe(0);
});
it('contains six distinct transparent drawings with bounded gutters and a sparse tail',async()=>{
 const {data,info}=await sharp('public/assets/survivors/voice-lens-release-v1.png').raw().toBuffer({resolveWithObject:true});
 expect([info.width,info.height,info.channels]).toEqual([1536,1024,4]);
 const counts:number[]=[],hashes=new Set<string>();
 for(let f=0;f<6;f++){
  const bytes:Buffer[]=[],x0=f%3*512,y0=Math.floor(f/3)*512;let count=0;
  for(let y=0;y<512;y++){
   bytes.push(data.subarray(((y0+y)*1536+x0)*4,((y0+y)*1536+x0+512)*4));
   for(let x=0;x<512;x++){const alpha=data[((y0+y)*1536+x0+x)*4+3]!;
    if(alpha<=16)continue;count++;expect(x>=32&&x<480&&y>=32&&y<480).toBe(true);}
  }
  counts.push(count);hashes.add(createHash('sha256').update(Buffer.concat(bytes)).digest('hex'));
 }
 expect(hashes.size).toBe(6);expect(counts[5]!).toBeLessThan(counts[2]!*.25);
});

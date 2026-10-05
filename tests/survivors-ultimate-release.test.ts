import {it,expect,vi} from 'vitest';
import {ultimateReleaseFrame,drawUltimateRelease,ULTIMATE_RELEASE_DURATION} from '../src/ui/survivors-ultimate-release';
import {ProjectileFeedbackLayer} from '../src/ui/survivors-projectile-feedback';
const atlas={naturalWidth:1536,naturalHeight:1024} as HTMLImageElement;
const context=()=>({save:vi.fn(),restore:vi.fn(),translate:vi.fn(),rotate:vi.fn(),drawImage:vi.fn()}) as unknown as CanvasRenderingContext2D;
it('separates ignition, travelling pressure and tail without exceeding local bounds',()=>{
 expect(ultimateReleaseFrame(0)?.core).toBe(0);
 expect(ultimateReleaseFrame(.05)!.core).toBeGreaterThan(ultimateReleaseFrame(.3)!.core);
 expect(ultimateReleaseFrame(.2)!.radius).toBeGreaterThan(ultimateReleaseFrame(.05)!.radius);
 expect(ultimateReleaseFrame(.4)!.tail).toBeLessThan(ultimateReleaseFrame(.2)!.tail);
 for(let age=0;age<ULTIMATE_RELEASE_DURATION;age+=.001){const f=ultimateReleaseFrame(age)!;expect(f.radius).toBeLessThanOrEqual(52);for(const alpha of [f.core,f.front,f.tail]){expect(alpha).toBeGreaterThanOrEqual(0);expect(alpha).toBeLessThanOrEqual(.52);}}
 for(const age of [NaN,Infinity,-1,.42,2])expect(ultimateReleaseFrame(age)).toBeUndefined();
});
it('caps raster stamps, restores context and draws identical geometry at paused time',()=>{
 const ctx=context();drawUltimateRelease(ctx,atlas,.1,false,false);const calls=vi.mocked(ctx.drawImage).mock.calls.slice();expect(calls).toHaveLength(7);
 vi.mocked(ctx.drawImage).mockClear();drawUltimateRelease(ctx,atlas,.1,false,false);expect(vi.mocked(ctx.drawImage).mock.calls).toEqual(calls);
 vi.mocked(ctx.drawImage).mockClear();drawUltimateRelease(ctx,atlas,.1,false,true);expect(ctx.drawImage).toHaveBeenCalledTimes(2);
 expect(vi.mocked(ctx.save).mock.calls.length).toBe(vi.mocked(ctx.restore).mock.calls.length);
 vi.mocked(ctx.drawImage).mockClear();expect(drawUltimateRelease(ctx,atlas,.1,true,false)).toBe(false);expect(drawUltimateRelease(ctx,undefined,.1,false,false)).toBe(false);expect(ctx.drawImage).not.toHaveBeenCalled();
});
it('keeps only ultimate launch feedback alive for the authored gesture duration',()=>{
 const layer=new ProjectileFeedbackLayer();const event={projectileId:'u',kind:'shout_shockwave' as const,phase:'launch' as const,x:10,y:20,angle:0,radius:40};
 layer.ingest([event,{...event,projectileId:'r',kind:'radio'}]);layer.advance(.11);expect(layer.size).toBe(1);
 const ctx=context();layer.draw(ctx,false,false,{atlas,equipped:[]});expect(ctx.drawImage).toHaveBeenCalledTimes(7);
 layer.advance(.25);expect(layer.size).toBe(1);layer.advance(.07);expect(layer.size).toBe(0);
 expect(event.radius).toBe(40);
});

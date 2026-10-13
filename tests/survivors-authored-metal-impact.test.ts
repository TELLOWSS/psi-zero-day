import {expect,it,vi} from 'vitest';
import {metalImpactFrame,drawAuthoredMetalImpact} from '../src/ui/survivors-authored-metal-impact';
it('plays chronological painted shapes, settles and rejects invalid time',()=>{
 expect(metalImpactFrame(0,.3)?.frame).toBe(0);expect(metalImpactFrame(.1,.3)?.frame).toBe(2);expect(metalImpactFrame(.25,.3)?.frame).toBe(4);
 expect(metalImpactFrame(.299,.3)?.alpha).toBeLessThan(.02);
 for(const age of [-1,NaN,Infinity,.3])expect(metalImpactFrame(age,.3)).toBeUndefined();
});
it('bounds stamps, keeps origins aligned and excludes safety receipts',()=>{
 const ctx={save:vi.fn(),restore:vi.fn(),rotate:vi.fn(),drawImage:vi.fn()} as unknown as CanvasRenderingContext2D;
 const atlas={naturalWidth:1536,naturalHeight:1024} as HTMLImageElement;
 const event={projectileId:'metal',kind:'radio' as const,phase:'impact' as const,x:0,y:0,radius:10,angle:0,actorKind:'RUNAWAY_CART' as const};
 expect(drawAuthoredMetalImpact(ctx,atlas,event,.1,.3,false,false)).toBe(true);expect(ctx.drawImage).toHaveBeenCalledTimes(2);
 const calls=vi.mocked(ctx.drawImage).mock.calls.slice();vi.mocked(ctx.drawImage).mockClear();drawAuthoredMetalImpact(ctx,atlas,event,.1,.3,false,false);expect(vi.mocked(ctx.drawImage).mock.calls).toEqual(calls);
 vi.mocked(ctx.drawImage).mockClear();drawAuthoredMetalImpact(ctx,atlas,event,.1,.3,false,true);expect(ctx.drawImage).toHaveBeenCalledTimes(1);
 for(const options of [{worker:true},{blocked:true},{actorKind:'GAS_LEAK' as const}])expect(drawAuthoredMetalImpact(ctx,atlas,{...event,...options},.1,.3,false,false)).toBe(false);
 expect(drawAuthoredMetalImpact(ctx,atlas,event,.1,.3,true,false)).toBe(false);
 expect(vi.mocked(ctx.save).mock.calls.length).toBe(vi.mocked(ctx.restore).mock.calls.length);
});

import {expect,it,vi} from 'vitest';
import {drawAuthoredDebrisImpact} from '../src/ui/survivors-authored-debris-impact';
import {drawIndustrialContact} from '../src/ui/survivors-industrial-art';
it('replaces the debris material core with bounded changing frames, never safety receipts',()=>{
 const ctx={save:vi.fn(),restore:vi.fn(),rotate:vi.fn(),drawImage:vi.fn()} as unknown as CanvasRenderingContext2D;
 const atlas={naturalWidth:1536,naturalHeight:1024} as HTMLImageElement;
 const event={projectileId:'debris',kind:'radio' as const,phase:'impact' as const,x:0,y:0,angle:0,radius:10,actorKind:'FALLING_DEBRIS' as const};
 expect(drawIndustrialContact(ctx,undefined,event,.08,.3,false,false,undefined,atlas)).toBe(true);expect(ctx.drawImage).toHaveBeenCalledTimes(2);
 const frame=vi.mocked(ctx.drawImage).mock.calls.slice();vi.mocked(ctx.drawImage).mockClear();drawAuthoredDebrisImpact(ctx,atlas,event,.2,.3,false,false);expect(vi.mocked(ctx.drawImage).mock.calls).not.toEqual(frame);
 vi.mocked(ctx.drawImage).mockClear();drawAuthoredDebrisImpact(ctx,atlas,event,.08,.3,false,true);expect(ctx.drawImage).toHaveBeenCalledTimes(1);
 for(const change of [{worker:true},{blocked:true},{actorKind:'RUNAWAY_CART' as const},{phase:'release' as const}])expect(drawAuthoredDebrisImpact(ctx,atlas,{...event,...change},.08,.3,false,false)).toBe(false);
 expect(drawAuthoredDebrisImpact(ctx,atlas,event,.08,.3,true,false)).toBe(false);
 expect(vi.mocked(ctx.save).mock.calls.length).toBe(vi.mocked(ctx.restore).mock.calls.length);
});

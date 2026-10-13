import {expect,it,vi} from 'vitest';
import {drawAuthoredVaporImpact} from '../src/ui/survivors-authored-vapor-impact';
import {drawIndustrialContact} from '../src/ui/survivors-industrial-art';
it('replaces pressure material with changing bounded authored frames',()=>{
 const ctx={save:vi.fn(),restore:vi.fn(),rotate:vi.fn(),drawImage:vi.fn()} as unknown as CanvasRenderingContext2D;
 const atlas={naturalWidth:1536,naturalHeight:1024} as HTMLImageElement;
 const event={projectileId:'vapor',kind:'radio' as const,phase:'impact' as const,x:0,y:0,angle:0,radius:10,actorKind:'GAS_LEAK' as const};
 expect(drawIndustrialContact(ctx,undefined,event,.08,.3,false,false,undefined,undefined,atlas)).toBe(true);expect(ctx.drawImage).toHaveBeenCalledTimes(2);
 const calls=vi.mocked(ctx.drawImage).mock.calls.slice();vi.mocked(ctx.drawImage).mockClear();drawAuthoredVaporImpact(ctx,atlas,event,.08,.3,false,false);expect(vi.mocked(ctx.drawImage).mock.calls).toEqual(calls);
 vi.mocked(ctx.drawImage).mockClear();drawAuthoredVaporImpact(ctx,atlas,event,.22,.3,false,false);expect(vi.mocked(ctx.drawImage).mock.calls).not.toEqual(calls);
 vi.mocked(ctx.drawImage).mockClear();drawAuthoredVaporImpact(ctx,atlas,event,.08,.3,false,true);expect(ctx.drawImage).toHaveBeenCalledTimes(1);
 for(const change of [{worker:true},{blocked:true},{actorKind:'FALLING_DEBRIS' as const},{phase:'release' as const}])expect(drawAuthoredVaporImpact(ctx,atlas,{...event,...change},.08,.3,false,false)).toBe(false);
 expect(drawAuthoredVaporImpact(ctx,atlas,event,.08,.3,true,false)).toBe(false);
 expect(vi.mocked(ctx.save).mock.calls.length).toBe(vi.mocked(ctx.restore).mock.calls.length);
});

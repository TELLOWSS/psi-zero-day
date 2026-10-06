import {expect,it,vi} from 'vitest';
import {drawAuthoredDroneLaunch} from '../src/ui/survivors-authored-drone-launch';
import {ProjectileFeedbackLayer} from '../src/ui/survivors-projectile-feedback';
const context=()=>({save:vi.fn(),restore:vi.fn(),rotate:vi.fn(),translate:vi.fn(),drawImage:vi.fn()} as unknown as CanvasRenderingContext2D);
const atlas={naturalWidth:1536,naturalHeight:1024} as HTMLImageElement;
const event={projectileId:'drone',kind:'drone_laser' as const,phase:'launch' as const,x:70,y:40,angle:Math.PI/2,radius:4};
it('gives hunter evolution its own larger authored launch without requiring premium equipment',()=>{
 const c=context(),hunter={...event,kind:'hunter_beam' as const};
 expect(drawAuthoredDroneLaunch(c,undefined,hunter,.03,.14,false,false,[],atlas)).toBe(true);
 expect(c.drawImage).toHaveBeenCalledTimes(2);
 expect(vi.mocked(c.drawImage).mock.calls[0]![7]).toBe(80);
 vi.mocked(c.drawImage).mockClear();
 expect(drawAuthoredDroneLaunch(c,undefined,hunter,.03,.14,false,true,[],atlas)).toBe(true);
 expect(c.drawImage).toHaveBeenCalledTimes(1);
 for(const change of [{worker:true},{blocked:true},{phase:'impact' as const},{phase:'release' as const}]){
  expect(drawAuthoredDroneLaunch(c,undefined,{...hunter,...change},0,.14,false,false,[],atlas)).toBe(false);
 }
 expect(drawAuthoredDroneLaunch(c,undefined,hunter,0,.14,true,false,[],atlas)).toBe(false);
 expect(drawAuthoredDroneLaunch(c,atlas,hunter,0,.14,false,false,[])).toBe(false);
});
it('preserves three separated hunter emission origins with only three busy raster draws',()=>{
 const layer=new ProjectileFeedbackLayer(),c=context();
 const events=[0,1,2].map(index=>({...event,projectileId:`hunter-${index}`,kind:'hunter_beam' as const,x:70+index*90}));
 const before=JSON.stringify(events);layer.ingest(events);layer.advance(.03);
 layer.draw(c,false,true,{hunterLaunchAtlas:atlas,equipped:[]});
 expect(c.drawImage).toHaveBeenCalledTimes(3);
 expect(vi.mocked(c.translate).mock.calls).toEqual([[70,40],[160,40],[250,40]]);
 expect(JSON.stringify(events)).toBe(before);layer.advance(.15);expect(layer.size).toBe(0);
});
it('replaces inspection launch with aligned changing silhouettes and a bounded busy frame',()=>{
 const c=context();
 expect(drawAuthoredDroneLaunch(c,atlas,event,0,.14,false,false,['inspection_wing'])).toBe(true);
 const first=vi.mocked(c.drawImage).mock.calls[0]!;
 expect(first[5]).toBeCloseTo(-169/512*64);expect(first[6]).toBeCloseTo(-259/512*64);
 expect(c.rotate).toHaveBeenCalledWith(Math.PI/2);
 const early=vi.mocked(c.drawImage).mock.calls.slice();vi.mocked(c.drawImage).mockClear();
 drawAuthoredDroneLaunch(c,atlas,event,.09,.14,false,false,['inspection_wing']);
 expect(vi.mocked(c.drawImage).mock.calls).not.toEqual(early);
 vi.mocked(c.drawImage).mockClear();drawAuthoredDroneLaunch(c,atlas,event,.09,.14,false,true,['inspection_wing']);
 expect(c.drawImage).toHaveBeenCalledTimes(1);
 expect(vi.mocked(c.save).mock.calls.length).toBe(vi.mocked(c.restore).mock.calls.length);
});
it('does not replace ordinary or rescue launches, impacts, safety receipts or reduced motion',()=>{
 for(const change of [{worker:true},{blocked:true},{phase:'impact' as const},{phase:'release' as const},{kind:'hunter_beam' as const}]){
  expect(drawAuthoredDroneLaunch(context(),atlas,{...event,...change},0,.14,false,false,['inspection_wing'])).toBe(false);
 }
 for(const equipped of [[],['rescue_wing']])expect(drawAuthoredDroneLaunch(context(),atlas,event,0,.14,false,false,equipped)).toBe(false);
 expect(drawAuthoredDroneLaunch(context(),undefined,event,0,.14,false,false,['inspection_wing'])).toBe(false);
 expect(drawAuthoredDroneLaunch(context(),atlas,event,0,.14,true,false,['inspection_wing'])).toBe(false);
});
it('uses recorded emitter position in the feedback layer and expires without changing the receipt',()=>{
 const layer=new ProjectileFeedbackLayer(),c=context(),before=JSON.stringify(event);
 layer.ingest([event],false,['inspection_wing']);layer.advance(.03);
 layer.draw(c,false,true,{droneLaunchAtlas:atlas,equipped:['inspection_wing']});
 expect(c.translate).toHaveBeenCalledWith(70,40);expect(c.drawImage).toHaveBeenCalledTimes(1);
 expect(JSON.stringify(event)).toBe(before);
 layer.advance(.14);expect(layer.size).toBe(0);
});

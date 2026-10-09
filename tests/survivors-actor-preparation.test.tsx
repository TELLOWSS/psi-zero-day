// @vitest-environment jsdom
import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {expect,it,vi} from 'vitest';
import {usePreparedSurvivorsActor} from '../src/ui/use-prepared-survivors-actor';
import type {CharacterId} from '../src/domain/patrol-survivors';
const load=vi.hoisted(()=>vi.fn());
vi.mock('../src/ui/survivors-directional-art',()=>({loadDirectionalActor:load}));
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
it('waits for the actual selected sheet and ignores a replaced selection',async()=>{
 const images:HTMLImageElement[]=[],finish:Array<(value:boolean)=>void>=[];
 vi.stubGlobal('Image',class{constructor(){const image=document.createElement('img');images.push(image);return image;}});
 load.mockImplementation(()=>new Promise<boolean>(resolve=>finish.push(resolve)));
 const maps:Partial<Record<CharacterId,HTMLImageElement>>={},host=document.createElement('div'),root=createRoot(host);
 const View=({id}:{id:CharacterId})=><button disabled={usePreparedSurvivorsActor(id,maps)!==id}>Start</button>;
 try{
  await act(async()=>root.render(<View id="player"/>));expect(host.querySelector('button')!.disabled).toBe(true);
  await act(async()=>images[0]!.dispatchEvent(new Event('load')));
  await act(async()=>root.render(<View id="lee_jaehoon"/>));
  await act(async()=>finish[0]!(true));expect(maps.player).toBeUndefined();expect(host.querySelector('button')!.disabled).toBe(true);
  await act(async()=>images[1]!.dispatchEvent(new Event('load')));
  await act(async()=>finish[1]!(true));expect(maps.lee_jaehoon).toBe(images[1]);expect(host.querySelector('button')!.disabled).toBe(false);
 }finally{await act(async()=>root.unmount());vi.unstubAllGlobals();load.mockReset();}
});

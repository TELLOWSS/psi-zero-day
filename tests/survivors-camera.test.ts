import {describe,it,expect} from 'vitest';
import {survivorsCamera} from '../src/ui/survivors-camera';
describe('grounded actor camera safety',()=>{
  it('preserves fractional travel instead of snapping the camera to whole world pixels',()=>{
    const a=survivorsCamera({x:700,y:450},390,600,1400,900,1);
    const b=survivorsCamera({x:700.25,y:450.25},390,600,1400,900,1);
    expect(b.x-a.x).toBeCloseTo(.25);expect(b.y-a.y).toBeCloseTo(.25);
  });
  it('retains room for actor and foot ring at every world corner across viewports',()=>{
    for(const [w,h,z] of [[390,844,.94],[844,390,1],[1440,900,1.03]] as const) {
      const vw=w/z,vh=h/z;
      for(const x of [20,1380])for(const y of [20,880]){
        const c=survivorsCamera({x,y},vw,vh,1400,900,z);
        expect((x-c.x)*z).toBeGreaterThan(48);
        expect((x-c.x)*z).toBeLessThan(w-48);
        expect((y-c.y)*z).toBeGreaterThan(90);
        expect((y-c.y)*z).toBeLessThan(h-90);
      }
    }
  });
});

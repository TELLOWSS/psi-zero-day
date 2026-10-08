import {describe,it,expect} from 'vitest';
import {SurvivorsPerformanceBudget,survivorsViewportZoom} from '../src/ui/survivors-performance';
describe('presentation budget and responsive field of view',()=>{
  it('reduces cost under sustained slow frames and recovers with hysteresis',()=>{
    const budget=new SurvivorsPerformanceBudget(true);
    expect(budget.pixelRatio(3,390,844)).toBe(1.5);
    for(let i=0;i<150;i++)budget.sample(40);
    expect(budget.level).toBe('low');
    expect(budget.particleLimit).toBe(80);
    budget.sample(10_000);expect(budget.level).toBe('low');
    for(let i=0;i<1200;i++)budget.sample(16.7);
    expect(budget.level).toBe('high');
    expect(budget.pixelRatio(3,1600,2560)**2*1600*2560).toBeLessThanOrEqual(2_800_001);
  });
  it.each([[390,844],[360,650],[844,390],[568,320],[768,1024],[1366,1024]])('keeps %sx%s within world bounds', (width,height)=>{
    const zoom=survivorsViewportZoom(width,height,1400,900);
    expect(width/zoom).toBeLessThanOrEqual(1400.001);
    expect(height/zoom).toBeLessThanOrEqual(900.001);
    if(height<480)expect(zoom).toBeLessThan(1);
  });
});

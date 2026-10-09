import {describe,it,expect} from 'vitest';
import {SurvivorsBonusEngine} from '../src/engine/survivors-bonus-engine';
describe('safe bonus recovery',()=>{
 it('collects each box once and pays the completion bonus exactly once',()=>{const e=new SurvivorsBonusEngine();for(const p of e.state.pickups){e.state.x=p.x;e.state.y=p.y;e.update(.01,{x:0,y:0});}expect(e.state.earned).toBe(400);expect(e.state.finished).toBe(true);e.update(1,{x:1,y:1});expect(e.finish()).toBe(400);expect(e.state.earned).toBe(400);});
 it('keeps partial rewards at timeout or early finish',()=>{const e=new SurvivorsBonusEngine();e.state.x=.2;e.state.y=.7;e.update(.01,{x:0,y:0});for(let i=0;i<301;i++)e.update(.1,{x:0,y:0});expect(e.state.finished).toBe(true);expect(e.finish()).toBe(50);});
 it('normalizes diagonal input and stays inside the field',()=>{const e=new SurvivorsBonusEngine();const x=e.state.x,y=e.state.y;e.update(.1,{x:1,y:1});expect(Math.hypot(e.state.x-x,e.state.y-y)).toBeCloseTo(.045);for(let i=0;i<60;i++)e.update(.1,{x:1,y:1});expect(e.state.x).toBeLessThanOrEqual(.96);expect(e.state.y).toBeLessThanOrEqual(.94);});
});

import {describe,it,expect} from 'vitest';
import {warningLabelLayout} from '../src/ui/survivors-warning-layout';
describe('hazard warning viewport placement',()=>{
 it('keeps an edge warning fully visible without moving its world anchor',()=>{
  const anchor={x:-40,y:500},viewport={x:0,y:0,width:390,height:844,zoom:1};
  const label=warningLabelLayout(anchor,220,viewport);
  expect(label.x).toBe(118);expect(label.y).toBe(500);expect(anchor.x).toBe(-40);
  expect(warningLabelLayout({x:450,y:500},220,viewport).x).toBe(272);
 });
 it('fits long localized text and reserves HUD and bottom margins at zoom',()=>{
  const viewport={x:200,y:300,width:200,height:195,zoom:2};
  const label=warningLabelLayout({x:1000,y:200},400,viewport);
  expect(label.fontScale).toBeCloseTo(.48);expect(label.x).toBe(300);expect(label.y).toBe(345);
  expect(warningLabelLayout({x:300,y:900},100,viewport).y).toBe(485);
 });
 it('preserves centered labels and stable layout for a small viewport',()=>{
  expect(warningLabelLayout({x:300,y:200},100,{x:0,y:0,width:600,height:400,zoom:1}))
   .toEqual({x:300,y:200,fontScale:1});
  const label=warningLabelLayout({x:0,y:0},100,{x:0,y:0,width:30,height:30,zoom:1});
  expect(label.x).toBe(15);expect(label.y).toBe(15);expect(label.fontScale).toBe(.14);
 });
});

import {describe,it,expect} from 'vitest';
import {sanitizeDisplaySettings,DEFAULT_DISPLAY_SETTINGS,displayViewZoom} from '../src/ui/survivors-display-settings';
import {SurvivorsPerformanceBudget} from '../src/ui/survivors-performance';
describe('presentation customization',()=>{
 it('recovers corrupt/partial saves and rejects unknown values',()=>{
  expect(sanitizeDisplaySettings(null)).toEqual(DEFAULT_DISPLAY_SETTINGS);
  expect(sanitizeDisplaySettings({quality:'ultra',lighting:'false',view:999})).toEqual(DEFAULT_DISPLAY_SETTINGS);
  expect(sanitizeDisplaySettings({quality:'low',flash:false})).toEqual({...DEFAULT_DISPLAY_SETTINGS,quality:'low',flash:false});
 });
 it('honors manual quality under slow frames and restores adaptive mode',()=>{
  const budget=new SurvivorsPerformanceBudget(true);
  budget.configure({...DEFAULT_DISPLAY_SETTINGS,quality:'high'});
  for(let i=0;i<400;i++)budget.sample(40);
  expect(budget.level).toBe('high');
  budget.configure({...DEFAULT_DISPLAY_SETTINGS,quality:'balanced'});expect(budget.level).toBe('balanced');
  budget.configure({...DEFAULT_DISPLAY_SETTINGS,quality:'low'});expect(budget.pixelRatio(3,390,844)).toBe(1);
  budget.configure({...DEFAULT_DISPLAY_SETTINGS,quality:'auto'});
  for(let i=0;i<200;i++)budget.sample(40);
  expect(budget.level).toBe('low');
 });
 it('removes decorative particles and lighting without removing quality bounds',()=>{
  const budget=new SurvivorsPerformanceBudget();budget.configure({...DEFAULT_DISPLAY_SETTINGS,particles:'off',lighting:false});
  expect(budget.particleLimit).toBe(0);expect(budget.particleFraction).toBe(0);expect(budget.ambientLighting).toBe(false);
  budget.configure({...DEFAULT_DISPLAY_SETTINGS,particles:'sparse'});expect(budget.particleFraction).toBeCloseTo(.3);
  expect(budget.pixelRatio(4,1180,820)**2*1180*820).toBeLessThanOrEqual(2800001);
 });
 it('widens/narrows view but never reveals space beyond the world',()=>{
  expect(displayViewZoom(.7,390,844,1400,1800,'wide')).toBeLessThan(.7);
  expect(displayViewZoom(.7,390,844,1400,1800,'close')).toBeGreaterThan(.7);
  expect(displayViewZoom(.7,1180,820,1400,900,'wide')).toBeGreaterThanOrEqual(820/900);
 });
});

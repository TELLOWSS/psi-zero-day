import { expect, it } from 'vitest';
import { equipmentSoundSamples } from '../src/ui/survivors-equipment-sound';
import { PROJECTILE_VFX } from '../src/ui/survivors-projectile-vfx';
import type { ProjectileKind } from '../src/domain/patrol-survivors';
it('bakes distinct bounded signatures with quiet boundaries and deterministic output',()=>{
  const fingerprints=new Set<string>();
  for(const kind of Object.keys(PROJECTILE_VFX) as ProjectileKind[]) {
    for(const phase of ['launch','impact','release'] as const) {
      const samples=equipmentSoundSamples(kind,phase,false,48000);
      expect(samples[0]).toBe(0);expect(Math.abs(samples.at(-1)!)).toBeLessThan(.001);
      expect(samples.every(v=>Number.isFinite(v)&&Math.abs(v)<1)).toBe(true);
      expect(samples).toEqual(equipmentSoundSamples(kind,phase,false,48000));
      fingerprints.add(samples.slice(100,110).join(','));
    }
  }
  expect(fingerprints.size).toBe(Object.keys(PROJECTILE_VFX).length * 3);
});
it('gives critical contacts a distinct bounded pressure body without changing worker or launch cues',()=>{
 const base=equipmentSoundSamples('radio','impact',false,48000,[],'RUNAWAY_CART');
 const heavy=equipmentSoundSamples('radio','impact',false,48000,[],'RUNAWAY_CART',true);
 expect(heavy).not.toEqual(base);expect(heavy.every(v=>Number.isFinite(v)&&Math.abs(v)<1)).toBe(true);
 expect(heavy[0]).toBe(0);expect(Math.abs(heavy.at(-1)!)).toBeLessThan(.001);
 expect(equipmentSoundSamples('radio','impact',true,48000,[],undefined,true)).toEqual(equipmentSoundSamples('radio','impact',true,48000));
 expect(equipmentSoundSamples('radio','launch',false,48000,[],undefined,true)).toEqual(equipmentSoundSamples('radio','launch',false,48000));
});
it('uses the same calm confirmation on workers across equipment',()=>{
  expect(equipmentSoundSamples('radio','impact',true,48000)).toEqual(equipmentSoundSamples('tesla_bolt','impact',true,48000));
});
it('distinguishes metal, rubble and gas impacts without changing worker confirmations',()=>{
 const types=['RUNAWAY_CART','FALLING_DEBRIS','GAS_LEAK'] as const;
 expect(new Set(types.map(type=>equipmentSoundSamples('radio','impact',false,48000,[],type).slice(100,120).join(','))).size).toBe(3);
 const calm=equipmentSoundSamples('radio','impact',true,48000);
 for(const type of types)expect(equipmentSoundSamples('radio','impact',true,48000,[],type)).toEqual(calm);
});

import { describe, expect, it } from 'vitest';
import source from '../content/episode01/scene-element-catalog.json';
import runtime from '../content/episode01/scene-element-runtime.json';

describe('scene element runtime projection',()=>{
  it('ships only elements currently placed by Episode 01 runtime events',()=>{
    const placed=new Set(Object.values(source.event_elements).flat().map(item=>item.element_key));
    expect(Object.keys(runtime.elements).sort()).toEqual([...placed].sort());
  });

  it('preserves the exact runtime placement map',()=>{
    expect(runtime.event_elements).toEqual(source.event_elements);
  });

  it('keeps final art pivot and visual identity for every shipped element',()=>{
    for(const [key,item] of Object.entries(runtime.elements)){
      const original=source.elements[key as keyof typeof source.elements];
      expect(item.element_id).toBe(original.element_id);
      expect(item.planned_asset_id).toBe(original.planned_asset_id);
      expect(item.art?.pivot).toEqual(original.art?.pivot);
      expect(item.art?.map_max_px).toBe(original.art?.map_max_px);
    }
  });
});

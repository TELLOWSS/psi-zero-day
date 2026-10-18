import {describe,expect,it} from 'vitest';
import {PATROL_STAGE_IDS,type StageHazardObject} from '../src/domain/patrol-survivors';
import {STAGE_ART} from '../src/ui/survivors-stage-art';
import {foregroundFixtureSpec,foregroundFixtureOpacity} from '../src/ui/survivors-foreground-props';

const fixture=(type:StageHazardObject['type'],state:StageHazardObject['state']='idle',x=600,y=300)=>
 ({type,state,x,y} as StageHazardObject);

describe('Signal Watch approved foreground sprite depth',()=>{
  it('uses existing sprites, exact equipment contact anchors and all 50 authored floors',()=>{
    expect(PATROL_STAGE_IDS).toHaveLength(50);
    for(const id of PATROL_STAGE_IDS)expect(STAGE_ART[id]?.ground).toBeTruthy();
    expect(foregroundFixtureSpec(fixture('floodlight_tower'))).toEqual({kind:'light',anchorY:300,size:48,imageY:300});
    expect(foregroundFixtureSpec(fixture('explosive_barrel'))).toEqual({kind:'drum',anchorY:308,size:64,imageY:308});
    expect(foregroundFixtureSpec(fixture('electric_transformer'))).toEqual({kind:'cabinet',anchorY:308,size:68,imageY:308});
  });

  it('never overlays floor effects, warning zones or destroyed structures',()=>{
    for(const type of ['slurry_puddle','crane_drop_zone'] as const){
      expect(foregroundFixtureSpec(fixture(type))).toBeUndefined();
      expect(foregroundFixtureOpacity(fixture(type),{x:600,y:280})).toBe(1);
    }
    for(const type of ['electric_transformer','explosive_barrel','floodlight_tower'] as const){
      expect(foregroundFixtureSpec(fixture(type,'destroyed'))).toBeUndefined();
    }
  });

  it('draws in front by projected boot y; preserves visibility only when blocked',()=>{
    const object=Object.freeze(fixture('electric_transformer','warning'));
    const previous=JSON.stringify(object);
    expect(foregroundFixtureSpec(object)!.anchorY).toBeGreaterThan(object.y);
    expect(foregroundFixtureOpacity(object,{x:object.x,y:object.y-2})).toBeLessThan(1);
    expect(foregroundFixtureOpacity(object,{x:object.x,y:object.y-2})).toBeGreaterThanOrEqual(.52);
    expect(foregroundFixtureOpacity(object,{x:object.x+500,y:object.y-2})).toBe(1);
    expect(foregroundFixtureOpacity(object,{x:object.x,y:object.y+40})).toBe(1);
    expect(foregroundFixtureOpacity(object,{x:object.x,y:object.y-100})).toBe(1);
    expect(JSON.stringify(object)).toBe(previous);
  });
});

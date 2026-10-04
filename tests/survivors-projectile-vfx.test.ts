import { describe, expect, it, vi } from 'vitest';
import { drawProjectileVfx, projectileVisual, PROJECTILE_VFX } from '../src/ui/survivors-projectile-vfx';
import type { Projectile, ProjectileKind } from '../src/domain/patrol-survivors';

const projectile=(kind:ProjectileKind):Projectile=>({id:kind,x:10,y:20,vx:240,vy:120,radius:12,damage:10,duration:.2,pierce:1,kind});
describe('equipment-specific projectile presentation',()=>{
  it('covers every engine kind while keeping physical cones on their approved sprite pass',()=>{
    expect(Object.keys(PROJECTILE_VFX)).toHaveLength(10);
    expect(new Set(Object.values(PROJECTILE_VFX).map(v=>v.family)).size).toBe(8);
    expect(PROJECTILE_VFX.cone_trap.family).toBe('physical');
  });
  it('keeps collision radius intact, clamps opacity, and reduces detail without changing state',()=>{
    const p=Object.freeze(projectile('radio'));
    expect(projectileVisual(p,1,false,false).tier).toBe(1);
    expect(projectileVisual(p,5,false,false).tier).toBe(5);
    expect([1,2,3,4,5].map(level=>projectileVisual(p,level,true,false).tier)).toEqual([1,2,3,4,5]);
    expect(projectileVisual(p,5,true,false)).toMatchObject({trail:0,detail:false,radius:p.radius});
    expect(projectileVisual(p,5,false,true).detail).toBe(false);
    expect(projectileVisual({...p,duration:0},1,false,false).alpha).toBe(0);
    expect(projectileVisual({...p,duration:20},1,false,false).alpha).toBe(1);
  });
  it('restores the context, reuses cached textures and never mutates projectile rules',()=>{
    const gradient={addColorStop:vi.fn()};
    const ctx={save:vi.fn(),restore:vi.fn(),translate:vi.fn(),rotate:vi.fn(),drawImage:vi.fn(),beginPath:vi.fn(),ellipse:vi.fn(),arc:vi.fn(),fill:vi.fn(),fillRect:vi.fn(),stroke:vi.fn(),moveTo:vi.fn(),lineTo:vi.fn(),createRadialGradient:()=>gradient,createLinearGradient:()=>gradient};
    const createElement=vi.fn(()=>({width:0,height:0,dataset:{},getContext:()=>ctx}));
    vi.stubGlobal('document',{createElement});
    try{
      for(const kind of Object.keys(PROJECTILE_VFX) as ProjectileKind[]){const p=Object.freeze(projectile(kind));drawProjectileVfx(ctx as unknown as CanvasRenderingContext2D,p,5,1);expect(p).toEqual(projectile(kind));}
      const count=createElement.mock.calls.length;
      for(const kind of Object.keys(PROJECTILE_VFX) as ProjectileKind[])drawProjectileVfx(ctx as unknown as CanvasRenderingContext2D,Object.freeze(projectile(kind)),5,2,true,true);
      expect(createElement.mock.calls.length).toBe(count);
      expect(ctx.save.mock.calls.length).toBe(ctx.restore.mock.calls.length);
      expect(ctx.drawImage).toHaveBeenCalled();
    }finally{vi.unstubAllGlobals();}
  });
});

import {expect,it} from 'vitest';
import {readGraphicsMode,GRAPHICS_PROFILES} from '../src/ui/survivors-graphics-settings';
it('uses recommended for missing or unsupported saved modes',()=>{
 for(const raw of [null,'','ultra','{"mode":"smooth"}'])expect(readGraphicsMode(raw)).toBe('recommended');
 expect(readGraphicsMode('smooth')).toBe('smooth');expect(readGraphicsMode('vivid')).toBe('vivid');
});
it('reduces rendering costs monotonically without gameplay parameters',()=>{
 const {smooth,recommended,vivid}=GRAPHICS_PROFILES;
 expect(smooth.pixelRatio).toBeLessThan(recommended.pixelRatio);expect(recommended.pixelRatio).toBeLessThan(vivid.pixelRatio);
 expect(smooth.particles).toBeLessThan(recommended.particles);expect(recommended.particles).toBeLessThan(vivid.particles);
 for(const profile of Object.values(GRAPHICS_PROFILES))expect(Object.keys(profile).sort()).toEqual(['particles','pixelRatio']);
});

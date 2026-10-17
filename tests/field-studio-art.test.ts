import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import home from '../content/episode01/home-new-psi-art-v7.json';
import studio from '../content/art/field-studio-v1.json';
import {siteProfiles} from '../src/content/site-profiles';
import {profileStudioArt} from '../src/ui/field-studio-art';
for(const[name,a]of Object.entries({...home.assets,...studio.scenes}))it('decodes and verifies final studio image '+name,async()=>{
 const bytes=readFileSync('public'+a.uri),m=await sharp(bytes).metadata();expect(m.width).toBe(a.width);expect(m.height).toBe(a.height);expect(bytes.length).toBe(a.bytes);expect(bytes.length).toBeLessThan(600000);expect(createHash('sha256').update(bytes).digest('hex')).toBe(a.sha256);
});
it('assigns each catalog to its authored construction family rather than a combat floor',()=>{
 for(const p of siteProfiles){const art=profileStudioArt(p.id);expect(art.uri).toContain('/assets/field-studio-v1/');expect(art).toBe(p.projectArchetype==='DATA_CENTER'?studio.scenes.dataCenter:p.projectArchetype==='APT_REMODEL'?studio.scenes.remodel:studio.scenes.newBuild);}
});

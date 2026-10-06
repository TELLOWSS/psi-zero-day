import { expect, it } from 'vitest';
import sharp from 'sharp';
import { equipmentAppearance, EQUIPMENT_ART, EVOLUTION_ART } from '../src/ui/survivors-equipment-art';
import type { PerkId } from '../src/domain/patrol-survivors';
const pairs: [PerkId, PerkId][] = [['radio_boost','satellite_broadcast'],['extinguisher','cryo_blizzard'],['floodlight','tesla_dome'],['cone_trap','emf_barricade'],['safety_drone','hunter_swarm']];
it('separates five evolved silhouettes from the ordinary level-five atlas',()=>{
  expect(EVOLUTION_ART).not.toBe(EQUIPMENT_ART);
  const cells=pairs.map(([base,evolved])=>{
    expect(equipmentAppearance(base,5)?.evolved).toBe(false);
    const appearance=equipmentAppearance(evolved,1)!;
    expect(appearance.evolved).toBe(true);expect(appearance.module).toBe(false);
    return appearance.cell;
  });
  expect(cells).toEqual([0,1,2,3,4]);
});
it('contains five independently populated transparent cells and an empty sixth cell',async()=>{
  const atlas=sharp(`public${EVOLUTION_ART}`),metadata=await atlas.metadata();
  expect([metadata.width,metadata.height]).toEqual([768,512]);
  const hashes=[];
  for(let cell=0;cell<6;cell++){
    const data=await atlas.clone().extract({left:cell%3*256,top:Math.floor(cell/3)*256,width:256,height:256}).ensureAlpha().raw().toBuffer();
    let filled=0;for(let i=3;i<data.length;i+=4)if(data[i]!>32)filled++;
    if(cell<5){expect(filled).toBeGreaterThan(3000);expect(filled).toBeLessThan(48000);hashes.push(data.toString('base64'));}
    else expect(filled).toBe(0);
  }
  expect(new Set(hashes).size).toBe(5);
});

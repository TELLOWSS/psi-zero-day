import {expect,it,vi} from 'vitest';
import {premiumPresenceProfile,drawPremiumPresence} from '../src/ui/survivors-premium-presence';
import type {PremiumPresenceImages} from '../src/ui/survivors-equipment-animation';
const ids=['broadcast_crown','sync_gauntlet','extraction_pack','shock_mantle','inspection_wing','barrier_forge'];
const images={gold:{},cyan:{},violet:{}} as PremiumPresenceImages;
const ctx=()=>({save:vi.fn(),restore:vi.fn(),drawImage:vi.fn()} as unknown as CanvasRenderingContext2D);
it('increases equipped presence instead of reducing it at five-plus items',()=>{
 for(let n=1;n<=6;n++){
  const previous=premiumPresenceProfile(ids.slice(0,n-1)),next=premiumPresenceProfile(ids.slice(0,n));
  expect(next.alpha).toBeGreaterThan(previous.alpha);expect(next.width).toBeGreaterThan(previous.width);
 }
 const full=premiumPresenceProfile(ids),busy=premiumPresenceProfile(ids,true);
 expect(busy.alpha).toBeLessThan(.25);expect(full.alpha).toBeLessThan(.25);expect(busy.width).toBe(full.width);
 expect(full.left).not.toBe(full.right);
});
it('bounds action peaks and ignores invalid or duplicate equipment',()=>{
 expect(premiumPresenceProfile(['shock_mantle','shock_mantle','unknown']).count).toBe(1);
 expect(premiumPresenceProfile(ids,false,100)).toEqual(premiumPresenceProfile(ids,false,1));
 expect(premiumPresenceProfile(ids,false,NaN)).toEqual(premiumPresenceProfile(ids,false,0));
 expect(premiumPresenceProfile(ids,false,1).width).toBeLessThanOrEqual(144);
 expect(premiumPresenceProfile(ids,false,1).height).toBeLessThanOrEqual(152);
 const idle=premiumPresenceProfile(ids),peak=premiumPresenceProfile(ids,false,1);
 expect(peak.alpha).toBeGreaterThan(idle.alpha*3);
 expect(peak.width).toBeGreaterThan(idle.width);expect(peak.height).toBeGreaterThan(idle.height);
});
it('animates authored frames on simulation time and preserves bounded draw work',()=>{
 const a=ctx(),b=ctx();drawPremiumPresence(a,images,ids,.11,false);drawPremiumPresence(b,images,ids,.2,false);
 expect(a.drawImage).toHaveBeenCalledTimes(4);expect(vi.mocked(a.drawImage).mock.calls).not.toEqual(vi.mocked(b.drawImage).mock.calls);
 const same=ctx();drawPremiumPresence(same,images,ids,.11,false);expect(vi.mocked(a.drawImage).mock.calls).toEqual(vi.mocked(same.drawImage).mock.calls);
 expect(a.save).toHaveBeenCalledTimes(1);expect(a.restore).toHaveBeenCalledTimes(1);
});
it('has no unaquired, missing-asset, or reduced-motion corona',()=>{
 const c=ctx();drawPremiumPresence(c,images,[],0,false);drawPremiumPresence(c,undefined,ids,0,false);drawPremiumPresence(c,images,ids,0,true);
 expect(c.drawImage).not.toHaveBeenCalled();
});

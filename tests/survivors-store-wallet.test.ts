// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest';
import {persistStoreWallet} from '../src/app/survivors-store-wallet';
import {readSurvivorsCredits} from '../src/app/unified-meta-bridge';
afterEach(()=>{vi.restoreAllMocks();localStorage.clear();});
it('reads authoritative credits even when a compatibility mirror is unavailable',()=>{
 const original=Storage.prototype.setItem;
 vi.spyOn(Storage.prototype,'setItem').mockImplementation(function(this:Storage,key,value){if(key==='psi.survivors.credits')throw new Error('quota');original.call(this,key,value);});
 persistStoreWallet({credits:123,inventory:{owned:['voice_lens'],equipped:[],durability:{voice_lens:85}}});
 expect(readSurvivorsCredits()).toBe(123);
 expect(JSON.parse(localStorage.getItem('psi.survivors.store_wallet')!).inventory.durability.voice_lens).toBe(85);
});
it('does not save the compatibility balance when the authoritative transaction fails',()=>{
 localStorage.setItem('psi.survivors.credits','500');
 vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('quota');});
 expect(()=>persistStoreWallet({credits:0,inventory:{owned:['voice_lens'],equipped:[]}})).toThrow('quota');
 expect(readSurvivorsCredits()).toBe(500);expect(localStorage.getItem('psi.survivors.store_wallet')).toBeNull();
});

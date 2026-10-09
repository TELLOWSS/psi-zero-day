import {PATROL_STAGE_IDS,type PatrolStageId} from '../domain/patrol-survivors';
import {sanitizeInventory,type StoreInventory} from '../domain/survivors-store';
import {safeNumber} from './survivors-save';
export const STORE_WALLET_KEY='psi.survivors.store_wallet';
export interface StoreWallet {inventory:StoreInventory;credits:number;clearRewardClaims?:PatrolStageId[]}
export function readClearRewardClaims():PatrolStageId[]{try{const saved=JSON.parse(localStorage.getItem(STORE_WALLET_KEY)??'null')?.clearRewardClaims;return PATROL_STAGE_IDS.filter(id=>Array.isArray(saved)&&saved.includes(id));}catch{return [];}}
/** One authoritative write couples credits and equipment; compatibility mirrors are best effort. */
export function persistStoreWallet(wallet:StoreWallet):void {
  const previousClaims=readClearRewardClaims();
  const claims=PATROL_STAGE_IDS.filter(id=>previousClaims.includes(id)||wallet.clearRewardClaims?.includes(id));
  const safe={...(claims.length?{clearRewardClaims:claims}:{}),credits:safeNumber(wallet.credits),inventory:sanitizeInventory(wallet.inventory)};
  localStorage.setItem(STORE_WALLET_KEY,JSON.stringify(safe));
  try{localStorage.setItem('psi.survivors.credits',String(safe.credits));}catch{/* authoritative wallet already saved */}
  window.dispatchEvent(new CustomEvent('psi:meta-updated'));
}

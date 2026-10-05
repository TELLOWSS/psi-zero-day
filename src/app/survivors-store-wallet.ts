import {sanitizeInventory,type StoreInventory} from '../domain/survivors-store';
import {safeNumber} from './survivors-save';
export const STORE_WALLET_KEY='psi.survivors.store_wallet';
export interface StoreWallet {inventory:StoreInventory;credits:number}
/** One authoritative write couples credits and equipment; compatibility mirrors are best effort. */
export function persistStoreWallet(wallet:StoreWallet):void {
  const safe={credits:safeNumber(wallet.credits),inventory:sanitizeInventory(wallet.inventory)};
  localStorage.setItem(STORE_WALLET_KEY,JSON.stringify(safe));
  try{localStorage.setItem('psi.survivors.credits',String(safe.credits));}catch{/* authoritative wallet already saved */}
  window.dispatchEvent(new CustomEvent('psi:meta-updated'));
}

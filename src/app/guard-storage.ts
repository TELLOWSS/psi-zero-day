import type {StoragePort} from '../platform/storage';
import {browserLocalStoragePort} from '../platform/browser-storage';
import {DEFENSE_SAVE_KEY} from './defense-save';
export const GUARD_SAVE_KEY='psi-zero-day.guard.save.v1';
/** Keep legacy active training and story records untouched by the independent campaign. */
export function guardStoragePort(source?:StoragePort):StoragePort{
 const port=()=>source??browserLocalStoragePort();const key=(k:string)=>k===DEFENSE_SAVE_KEY?GUARD_SAVE_KEY:k;
 return {read:k=>port().read(key(k)),write:(k,v)=>port().write(key(k),v),remove:k=>port().remove(key(k)),keys:async()=>(await port().keys()).filter(k=>k!==DEFENSE_SAVE_KEY).map(k=>k===GUARD_SAVE_KEY?DEFENSE_SAVE_KEY:k)};
}

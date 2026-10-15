import type {StoragePort} from '../platform/storage';
import {browserLocalStoragePort} from '../platform/browser-storage';
import {DEFENSE_SAVE_KEY} from './defense-save';
import {migrateGuardSaveV1} from './guard-save-version';
export const GUARD_V1_SAVE_KEY='psi-zero-day.guard.save.v1';
export const GUARD_SAVE_KEY='psi-zero-day.guard.save.v2';
/** Keep legacy active training and story records untouched by the independent campaign. */
export function guardStoragePort(source?:StoragePort):StoragePort{
 const port=()=>source??browserLocalStoragePort();const key=(k:string)=>k===DEFENSE_SAVE_KEY?GUARD_SAVE_KEY:k;
 return {read:async k=>{const source=port(),value=await source.read(key(k));if(value!==null||k!==DEFENSE_SAVE_KEY)return value;const old=await source.read(GUARD_V1_SAVE_KEY);if(old===null)return null;let migrated:string;try{migrated=migrateGuardSaveV1(old);}catch{return old;}await source.write(GUARD_SAVE_KEY,migrated);return migrated;},write:(k,v)=>port().write(key(k),v),remove:k=>port().remove(key(k)),keys:async()=>(await port().keys()).filter(k=>k!==DEFENSE_SAVE_KEY&&k!==GUARD_V1_SAVE_KEY).map(k=>k===GUARD_SAVE_KEY?DEFENSE_SAVE_KEY:k)};
}

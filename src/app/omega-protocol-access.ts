import {parseSave} from './survivors-save';
import {omegaProtocolAccessFromRecords,type OmegaProtocolAccess} from '../domain/omega-protocol-run';

/**
 * Authoritative app-side SPECIAL EDITION gate for Watch EXTREME 50/50.
 * Never read normal campaign star totals or Mastery 3-star count instead.
 * All data stays in the existing user's local progress; this reads only.
 */
export function readOmegaProtocolAccess(
 storage:Pick<Storage,'getItem'>|undefined,
 artApproved=false,
):OmegaProtocolAccess{
 if(!storage)return omegaProtocolAccessFromRecords(null,artApproved);
 let raw:string|null=null;
 try{raw=storage.getItem('psi.survivors.store_wallet');}catch{return omegaProtocolAccessFromRecords(null,artApproved);}
 const saved=parseSave(raw);
 const record=saved&&typeof saved==='object'&&!Array.isArray(saved)
  ?(saved as Record<string,unknown>).difficultyClearRecords:null;
 return omegaProtocolAccessFromRecords(record,artApproved);
}

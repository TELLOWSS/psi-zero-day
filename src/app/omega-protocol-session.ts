import {OmegaProtocolCombatSession} from '../engine/omega-protocol-combat';

/** Normal play and restart both use the same physical gate transitions. */
export function createOmegaFieldSession(
 seed:number, options:Readonly<{legacyStageSnapshot?:boolean;qaGateTravel?:boolean}>={},
):OmegaProtocolCombatSession{
 return new OmegaProtocolCombatSession(seed,50,false,{
  fieldTraversal:true,
  gateTransition:options.legacyStageSnapshot!==true,
  qaGateTravel:options.qaGateTravel===true,
 });
}

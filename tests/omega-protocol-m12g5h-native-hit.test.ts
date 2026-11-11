import {describe,it,expect} from 'vitest';
import {OmegaProtocolCombatSession} from '../src/engine/omega-protocol-combat';
import {omegaCombatProbeMode,omegaSetupCombatProbe} from '../src/ui/omega-combat-browser-probe';
import {omegaG5hRealHitLabRequested,OMEGA_G5H_ART_GATE,
 omegaG5gNativePoseStudy} from '../src/ui/omega-protocol-m12g5g-native-pose';
import {OMEGA_PROTOCOL_APPROVED_ART,OMEGA_PROTOCOL_BINARY_AUDIT_PASSED} from '../src/ui/omega-protocol-art-slot';
import {OMEGA_G5D_ACTUAL_E_WALK} from '../src/ui/omega-protocol-m12g5d-actual-source';
const session=()=>new OmegaProtocolCombatSession(20261112,50,false,{fieldTraversal:true});
describe('M12-G5h REAL WATCH damage event -> AIRA E hurt source review; painted art still BLOCKED',()=>{
 it('accepts only explicit DEV real-hit lab AND combatHit fixture; non-dev and spoof flags do nothing',()=>{
  expect(omegaG5hRealHitLabRequested('?omegaLab=1&omegaM12G5h=1&omegaQaState=combatHit',true)).toBe(true);
  for(const [q,dev] of [
   ['?omegaLab=1&omegaM12G5h=1&omegaQaState=combatHit',false],
   ['?omegaM12G5h=1&omegaQaState=combatHit',true],
   ['?omegaLab=1&omegaM12G5h=1&omegaQaState=combatGun',true],
   ['?omegaLab=1&omegaM12G5h=1&omegaQaState=combatHit&omegaM12G5g=1',true],
   ['?omegaLab=1&omegaM12G5h=1&omegaQaState=combatHit&omegaSilverPreview=1',true],
  ] as const)expect(omegaG5hRealHitLabRequested(q,dev)).toBe(false);
  expect(omegaCombatProbeMode('?omegaQaState=combatHit')).toBe('combatHit');
  expect(omegaCombatProbeMode('?omegaQaState=hit')).toBeNull();
 });
 it('will NEVER count source-derived HIT poses as independent painterly action frames, or unlock production',()=>{
  expect(OMEGA_G5H_ART_GATE).toEqual({
   actualPlayerHitBrowserEvidenceRequired:true,
   independentPainterlyActionSourcesApproved:0,
   independentPainterlyInfectedSourcesApproved:0,
   final160Approved:0,final320MasksApproved:0,
   productionApproved:false,autoReplaceUserAira:false,
  });
  expect(OMEGA_PROTOCOL_APPROVED_ART).toBe(null);
  expect(OMEGA_PROTOCOL_BINARY_AUDIT_PASSED).toBe(false);
  expect(OMEGA_G5D_ACTUAL_E_WALK).toHaveLength(4);
 });
 it('sets DEV-only initial drifter fixture with NO radio gun, finite player grace, no synthetic engine event',()=>{
  const s=session(),all=s.engine.state.hazards.length;
  const fixture=omegaSetupCombatProbe(s,'combatHit');
  const p=s.engine.state.player,z=s.engine.state.hazards[0]!;
  expect(all).toBeGreaterThan(1);
  expect(s.engine.state.hazards).toHaveLength(1);
  expect(fixture).toMatchObject({mode:'combatHit',gunEnabled:false,initialHp:800});
  expect(s.zombieBrain(z.id)?.kind).toBe('drifter');
  expect(p.invincibleTime).toBe(3);
  expect(p.hp).toBeGreaterThan(0);
  expect(z.hp).toBe(800);
  expect(z.damage).toBe(0); // native brain damage only, never generic untelegraphed contact
  expect(s.engine.state.activePerks.radio_boost).toBe(0);
  expect(s.zombieBrain(z.id)?.hits).toBe(0);
  expect(s.zombieBrain(z.id)?.damageDone).toBe(0);
 });
 it('real time makes warned native melee damage player HP, without injecting hit, damage, timer or mocked props',()=>{
  const s=session();const fixture=omegaSetupCombatProbe(s,'combatHit');
  const state=s.engine.state,p=state.player,b=s.zombieBrain(fixture.zombieId)!;
  const initial=p.hp;
  let warningSeen=false,contactDamageObserved=false;
  for(let i=0;i<520;i++){
   // Continuous physical WATCH simulation: NO fake damage or input.
   s.update(1/60,{moveX:0,moveY:0,triggerAction:false});
   warningSeen ||=b.warnings>0;
   contactDamageObserved ||=p.hp<initial;
   if(contactDamageObserved)break;
  }
  expect(warningSeen).toBe(true);
  expect(b.attacks).toBeGreaterThan(0);
  expect(contactDamageObserved).toBe(true);
  expect(p.hp).toBeLessThan(initial);
  expect(b.hits).toBeGreaterThan(0);
  expect(b.damageDone).toBeGreaterThan(0);
  expect(p.hp).toBeGreaterThan(0);
  expect(state.hazards[0]?.hp).toBe(800);
  expect(omegaG5gNativePoseStudy.evidence().counts.hit).toBe(0);
 });
});

import { describe, expect, it } from 'vitest';
import contract from '../content/defense/g8a-premium-audio-production.json';
import {
  premiumDefenseAudioContractState,
  premiumDefenseAudioEnabled,
  premiumDefenseAudioRuntimeEnabled,
  premiumDefenseCueUri,
} from '../src/app/defense-premium-audio';
import type { PremiumDefenseAudioCue } from '../src/app/defense-premium-audio';

describe('G8-A premium orchestral audio contract', () => {
  it('enables 24/24 production-approved premium binaries after Production Lock', () => {
    expect(contract.status).toBe('AUDIO_PRODUCTION_LOCKED');
    expect(contract.absoluteRules.oscillatorFinalAudioForbidden).toBe(true);
    expect(contract.absoluteRules.genericTrailerMusicForbidden).toBe(true);
    expect(contract.acceptance.productionLockAllowed).toBe(true);
    expect(contract.acceptance.finalBinaryCount).toBe(24);
    expect(premiumDefenseAudioEnabled()).toBe(true);
    expect(premiumDefenseAudioRuntimeEnabled()).toBe(true);
    expect(premiumDefenseAudioContractState().runtimeReadyAssetCount).toBe(24);
    expect(premiumDefenseAudioContractState().productionApprovedAssetCount).toBe(24);
  });

  it('keeps a full adaptive orchestral score rather than one baked BGM loop', () => {
    expect(contract.dynamicScore.stems).toHaveLength(5);
    expect(contract.dynamicScore.stems.map(item=>item.id)).toEqual([
      'score.foundation_bed',
      'score.pressure_ostinato',
      'score.swift_threat',
      'score.control_intervention',
      'score.resolution_coda',
    ]);
    expect(contract.dynamicScore.runtimeStates.map(item=>item.state)).toContain('SWIFT_THREAT');
    expect(contract.dynamicScore.runtimeStates.map(item=>item.state)).toContain('CONTROL_INTERVENTION');
  });

  it('exposes all gameplay premium binaries as production approved', () => {
    expect(contract.gameplaySfx).toHaveLength(11);
    for(const item of contract.gameplaySfx){
      expect(item.state).toBe('PRODUCTION_APPROVED');
      expect(premiumDefenseCueUri(item.cue as PremiumDefenseAudioCue)).toBe(item.path);
    }
  });

  it('requires construction-field Foley and SWIFT/CONTROL-specific sound design', () => {
    const ids=contract.fieldSound.map(item=>item.id);
    expect(ids).toContain('field.excavation_world');
    expect(ids).toContain('swift.engine_loop');
    expect(ids).toContain('swift.reverse_alarm');
    expect(ids).toContain('swift.airbrake');
    expect(ids).toContain('control.radio_stop');
    expect(ids).toContain('control.barrier_clack');
    expect(contract.fieldSound.every(item=>item.state==='PRODUCTION_APPROVED')).toBe(true);
  });

  it('locks source provenance, runtime, mastering, mobile and headphone requirements', () => {
    expect(contract.absoluteRules.sourceMaster.policy).toBe('PRESERVE_NATIVE_GENERATOR_OUTPUT');
    expect(contract.absoluteRules.sourceMaster.nativeUpsampleForbidden).toBe(true);
    expect(contract.absoluteRules.runtime.format).toBe('ogg/opus');
    expect(contract.absoluteRules.runtime.sampleRateHz).toBe(48000);
    expect(contract.absoluteRules.mastering.truePeakDbtpMax).toBe(-1);
    expect(contract.absoluteRules.mastering.minimumProgramLraLu).toBeGreaterThanOrEqual(5);
    expect(contract.acceptance.listeningQa).toContain('Android phone speaker at normal listening volume');
    expect(contract.acceptance.listeningQa).toContain('studio/headphone stereo');
    expect(contract.acceptance.productionLockRequires).toContain('NO_OSCILLATOR_FALLBACK_IN_ACTUAL_PLAY');
  });

  it('tracks exactly 24 production-approved runtime deliverables', () => {
    const all=[...contract.dynamicScore.stems,...contract.fieldSound,...contract.gameplaySfx];
    expect(all).toHaveLength(24);
    expect(contract.acceptance.requiredAssetCount).toBe(24);
    expect(contract.acceptance.finalBinaryCount).toBe(24);
    expect(premiumDefenseAudioContractState().runtimeReadyAssetCount).toBe(24);
    expect(all.every(item=>item.state==='PRODUCTION_APPROVED')).toBe(true);
  });
});

import { describe, expect, it } from 'vitest';
import contract from '../content/defense/g8a-premium-audio-production.json';
import { premiumDefenseAudioContractState, premiumDefenseCueUri } from '../src/app/defense-premium-audio';
import type { PremiumDefenseAudioCue } from '../src/app/defense-premium-audio';

describe('G8-A premium orchestral audio contract', () => {
  it('does not call current synthetic/oscillator audio final-quality', () => {
    expect(contract.status).toBe('PREMIUM_AUDIO_ASSETS_PENDING');
    expect(contract.absoluteRules.oscillatorFinalAudioForbidden).toBe(true);
    expect(contract.absoluteRules.genericTrailerMusicForbidden).toBe(true);
    expect(contract.acceptance.productionLockAllowed).toBe(false);
    expect(premiumDefenseAudioContractState().productionLockAllowed).toBe(false);
  });

  it('requires a full adaptive orchestral score rather than one baked BGM loop', () => {
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

  it('requires construction-field Foley and SWIFT/CONTROL-specific sound design', () => {
    const ids=contract.fieldSound.map(item=>item.id);
    expect(ids).toContain('field.excavation_world');
    expect(ids).toContain('swift.engine_loop');
    expect(ids).toContain('swift.reverse_alarm');
    expect(ids).toContain('swift.airbrake');
    expect(ids).toContain('control.radio_stop');
    expect(ids).toContain('control.barrier_clack');
  });

  it('requires premium binaries for every gameplay cue before oscillator fallback can disappear', () => {
    expect(contract.gameplaySfx).toHaveLength(11);
    for(const item of contract.gameplaySfx){
      expect(item.state).toBe('ASSET_PENDING');
      expect(premiumDefenseCueUri(item.cue as PremiumDefenseAudioCue)).toBeNull();
    }
  });

  it('locks professional source provenance, runtime, mastering, mobile and headphone quality requirements', () => {
    expect(contract.absoluteRules.sourceMaster.policy).toBe('PRESERVE_NATIVE_GENERATOR_OUTPUT');
    expect(contract.absoluteRules.sourceMaster.nativeUpsampleForbidden).toBe(true);
    expect(contract.absoluteRules.sourceMaster.musicNativeSampleRateHz).toBeGreaterThan(0);
    expect(contract.absoluteRules.runtime.format).toBe('ogg/opus');
    expect(contract.absoluteRules.runtime.sampleRateHz).toBe(48000);
    expect(contract.absoluteRules.mastering.truePeakDbtpMax).toBe(-1);
    expect(contract.absoluteRules.mastering.minimumProgramLraLu).toBeGreaterThanOrEqual(5);
    expect(contract.acceptance.listeningQa).toContain('Android phone speaker at normal listening volume');
    expect(contract.acceptance.listeningQa).toContain('studio/headphone stereo');
    expect(contract.acceptance.productionLockRequires).toContain('NO_OSCILLATOR_FALLBACK_IN_ACTUAL_PLAY');
  });

  it('tracks exactly 24 premium runtime deliverables', () => {
    const total=contract.dynamicScore.stems.length+contract.fieldSound.length+contract.gameplaySfx.length;
    expect(total).toBe(24);
    expect(contract.acceptance.requiredAssetCount).toBe(total);
    expect(contract.acceptance.finalBinaryCount).toBe(0);
  });
});

import premiumRaw from '../../content/defense/g8a-premium-audio-production.json';

export type PremiumDefenseAudioCue =
  | 'select' | 'place' | 'upgrade' | 'sell' | 'warning'
  | 'single_resolve' | 'area_resolve' | 'leak' | 'support' | 'win' | 'loss';

export type PremiumScoreStemId =
  | 'score.foundation_bed'
  | 'score.pressure_ostinato'
  | 'score.swift_threat'
  | 'score.control_intervention'
  | 'score.resolution_coda';

export type PremiumFieldSoundId =
  | 'field.excavation_world'
  | 'field.excavator_hydraulic'
  | 'swift.engine_loop'
  | 'swift.reverse_alarm'
  | 'swift.gravel_tire'
  | 'swift.airbrake'
  | 'control.radio_stop'
  | 'control.barrier_clack';

interface PremiumAudioContract {
  readonly status: string;
  readonly dynamicScore: {
    readonly stems: readonly {
      readonly id: PremiumScoreStemId;
      readonly path: string;
      readonly state: 'ASSET_PENDING' | 'PRODUCTION_APPROVED';
    }[];
  };
  readonly fieldSound: readonly {
    readonly id: PremiumFieldSoundId;
    readonly path: string;
    readonly loop: boolean;
    readonly state: 'ASSET_PENDING' | 'PRODUCTION_APPROVED';
  }[];
  readonly gameplaySfx: readonly {
    readonly cue: PremiumDefenseAudioCue;
    readonly path: string;
    readonly state: 'ASSET_PENDING' | 'PRODUCTION_APPROVED';
  }[];
  readonly acceptance: {
    readonly productionLockAllowed: boolean;
  };
}

const contract = premiumRaw as PremiumAudioContract;

export function premiumDefenseAudioEnabled(): boolean {
  return contract.status === 'AUDIO_PRODUCTION_LOCKED'
    && contract.acceptance.productionLockAllowed === true;
}

export function premiumDefenseCueUri(cue: PremiumDefenseAudioCue): string | null {
  const item = contract.gameplaySfx.find(asset => asset.cue === cue);
  if (!item || item.state !== 'PRODUCTION_APPROVED') return null;
  return item.path;
}

export function premiumDefenseAudioContractState() {
  return {
    status: contract.status,
    productionLockAllowed: contract.acceptance.productionLockAllowed,
    approvedGameplayCueCount: contract.gameplaySfx.filter(item => item.state === 'PRODUCTION_APPROVED').length,
    totalGameplayCueCount: contract.gameplaySfx.length,
  } as const;
}


export function premiumDefenseScoreStemAssets(): readonly {
  readonly id: PremiumScoreStemId;
  readonly uri: string;
}[] {
  return contract.dynamicScore.stems
    .filter(item => item.state === 'PRODUCTION_APPROVED')
    .map(item => ({ id: item.id, uri: item.path }));
}

export function premiumDefenseFieldAssets(): readonly {
  readonly id: PremiumFieldSoundId;
  readonly uri: string;
  readonly loop: boolean;
}[] {
  return contract.fieldSound
    .filter(item => item.state === 'PRODUCTION_APPROVED')
    .map(item => ({ id: item.id, uri: item.path, loop: item.loop }));
}

export function premiumDefenseFieldUri(id: PremiumFieldSoundId): string | null {
  const item = contract.fieldSound.find(asset => asset.id === id);
  if (!item || item.state !== 'PRODUCTION_APPROVED') return null;
  return item.path;
}

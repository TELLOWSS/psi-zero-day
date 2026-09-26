import premiumRaw from '../../content/defense/g8a-premium-audio-production.json';

export type PremiumDefenseAudioCue =
  | 'select' | 'place' | 'upgrade' | 'sell' | 'warning'
  | 'single_resolve' | 'area_resolve' | 'leak' | 'support' | 'win' | 'loss';

interface PremiumAudioContract {
  readonly status: string;
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

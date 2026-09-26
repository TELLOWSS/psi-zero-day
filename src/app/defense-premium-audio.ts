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

type PremiumAssetState = 'ASSET_PENDING' | 'QA_READY' | 'PRODUCTION_APPROVED';
type PremiumPlaybackRole = 'SYNCHRONIZED_LOOP' | 'STATE_ENTRY_ONE_SHOT' | 'STATE_ENTRY_ONE_SHOT_OVER_FOUNDATION';

interface PremiumAudioContract {
  readonly status: string;
  readonly dynamicScore: {
    readonly stems: readonly {
      readonly id: PremiumScoreStemId;
      readonly path: string;
      readonly state: PremiumAssetState;
      readonly loop: boolean;
      readonly playbackRole: PremiumPlaybackRole;
    }[];
  };
  readonly fieldSound: readonly {
    readonly id: PremiumFieldSoundId;
    readonly path: string;
    readonly loop: boolean;
    readonly state: PremiumAssetState;
  }[];
  readonly gameplaySfx: readonly {
    readonly cue: PremiumDefenseAudioCue;
    readonly path: string;
    readonly state: PremiumAssetState;
  }[];
  readonly acceptance: {
    readonly productionLockAllowed: boolean;
    readonly runtimeQaAllowed?: boolean;
  };
}

const contract = premiumRaw as PremiumAudioContract;
const runtimeReady = (state: PremiumAssetState) => state === 'QA_READY' || state === 'PRODUCTION_APPROVED';

function allRuntimeAssetsReady(): boolean {
  return contract.dynamicScore.stems.every(item => runtimeReady(item.state))
    && contract.fieldSound.every(item => runtimeReady(item.state))
    && contract.gameplaySfx.every(item => runtimeReady(item.state));
}

export function premiumDefenseAudioEnabled(): boolean {
  return contract.status === 'AUDIO_PRODUCTION_LOCKED'
    && contract.acceptance.productionLockAllowed === true
    && allRuntimeAssetsReady();
}

export function premiumDefenseAudioRuntimeEnabled(): boolean {
  const qaReady = contract.status === 'PREMIUM_AUDIO_QA_READY'
    && contract.acceptance.productionLockAllowed === false;
  return (qaReady || premiumDefenseAudioEnabled()) && allRuntimeAssetsReady();
}

export function premiumDefenseCueUri(cue: PremiumDefenseAudioCue): string | null {
  const item = contract.gameplaySfx.find(asset => asset.cue === cue);
  if (!item || !runtimeReady(item.state)) return null;
  return item.path;
}

export function premiumDefenseAudioContractState() {
  const all = [...contract.dynamicScore.stems, ...contract.fieldSound, ...contract.gameplaySfx];
  return {
    status: contract.status,
    productionLockAllowed: contract.acceptance.productionLockAllowed,
    qaRuntimeEnabled: premiumDefenseAudioRuntimeEnabled(),
    runtimeReadyAssetCount: all.filter(item => runtimeReady(item.state)).length,
    productionApprovedAssetCount: all.filter(item => item.state === 'PRODUCTION_APPROVED').length,
    totalAssetCount: all.length,
  } as const;
}

export function premiumDefenseScoreStemAssets(): readonly {
  readonly id: PremiumScoreStemId;
  readonly uri: string;
  readonly loop: boolean;
  readonly playbackRole: PremiumPlaybackRole;
}[] {
  return contract.dynamicScore.stems
    .filter(item => runtimeReady(item.state))
    .map(item => ({ id: item.id, uri: item.path, loop: item.loop, playbackRole: item.playbackRole }));
}

export function premiumDefenseScoreStemUri(id: PremiumScoreStemId): string | null {
  const item = contract.dynamicScore.stems.find(asset => asset.id === id);
  if (!item || !runtimeReady(item.state)) return null;
  return item.path;
}

export function premiumDefenseFieldAssets(): readonly {
  readonly id: PremiumFieldSoundId;
  readonly uri: string;
  readonly loop: boolean;
}[] {
  return contract.fieldSound
    .filter(item => runtimeReady(item.state))
    .map(item => ({ id: item.id, uri: item.path, loop: item.loop }));
}

export function premiumDefenseFieldUri(id: PremiumFieldSoundId): string | null {
  const item = contract.fieldSound.find(asset => asset.id === id);
  if (!item || !runtimeReady(item.state)) return null;
  return item.path;
}

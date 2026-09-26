import raw from '../../content/episode01/g8e-character-voice-layer.json';

export type CharacterVoiceRuntimeState = 'ASSET_PENDING' | 'MATERIALIZED' | 'QA_READY' | 'PRODUCTION_APPROVED';

export interface EpisodeCharacterVoiceCue {
  readonly cueId: string;
  readonly eventId: string;
  readonly nodeId: string;
  readonly speakerId: string;
  readonly textId: string;
  readonly beat: string;
  readonly targetUri: string;
  readonly assetId: string;
  readonly runtimeState: CharacterVoiceRuntimeState;
  readonly targetDurationSec: readonly [number, number];
  readonly gain: number;
}

interface CharacterVoiceManifest {
  readonly schemaVersion: 1;
  readonly status: CharacterVoiceRuntimeState;
  readonly runtimePolicy: {
    readonly noSyntheticSpeechFallback: boolean;
    readonly noVoicePlaybackUntilBinaryMaterialized: boolean;
    readonly ducking: { readonly bgm: number; readonly ambience: number };
  };
  readonly cues: readonly EpisodeCharacterVoiceCue[];
  readonly acceptance: {
    readonly plannedCueCount: number;
    readonly productionLockAllowed: boolean;
  };
}

const manifest = raw as CharacterVoiceManifest;

export function episodeCharacterVoicePlan(
  eventId: string | null | undefined,
  nodeId: string | null | undefined,
  speakerId: string | null | undefined,
  textId: string | null | undefined,
): EpisodeCharacterVoiceCue | undefined {
  if (!eventId || !nodeId || !speakerId || !textId) return undefined;
  return manifest.cues.find(cue =>
    cue.eventId === eventId
    && cue.nodeId === nodeId
    && cue.speakerId === speakerId
    && cue.textId === textId
  );
}

export function episodeCharacterVoiceRuntimeCue(
  eventId: string | null | undefined,
  nodeId: string | null | undefined,
  speakerId: string | null | undefined,
  textId: string | null | undefined,
): EpisodeCharacterVoiceCue | undefined {
  const cue = episodeCharacterVoicePlan(eventId, nodeId, speakerId, textId);
  if (!cue) return undefined;
  if (!['MATERIALIZED', 'QA_READY', 'PRODUCTION_APPROVED'].includes(cue.runtimeState)) return undefined;
  return cue;
}

export function episodeCharacterVoicePolicy() {
  return manifest.runtimePolicy;
}

export function episodeCharacterVoiceManifestStatus() {
  return Object.freeze({
    status: manifest.status,
    plannedCueCount: manifest.acceptance.plannedCueCount,
    productionLockAllowed: manifest.acceptance.productionLockAllowed,
  });
}

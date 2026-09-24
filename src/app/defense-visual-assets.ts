import visualProductionRaw from '../../content/defense/visual-production.json';
import defHd01ArtIngestRaw from '../../content/defense/def-hd01-art-ingest.json';
import defHd01PqBenchmarkRaw from '../../content/defense/def-hd01-pq-benchmark.json';
import type { DefenseEnemyId, DefenseLevelId, DefenseTowerId } from '../domain/defense';

interface DefenseVisualAsset {
  readonly assetId: string;
  readonly kind: 'BOARD' | 'TOWER' | 'ENEMY';
  readonly uri: string;
  readonly format: 'svg';
  readonly width: number;
  readonly height: number;
  readonly transparent: boolean;
  readonly safeArea?: number;
  readonly anchor?: { readonly x: number; readonly y: number };
  readonly status: 'BASELINE_LOCKED' | 'PRODUCTION_LOCKED';
}

interface DefenseVisualProduction {
  readonly schemaVersion: 1;
  readonly visualVersion: string;
  readonly status: 'BASELINE_LOCKED' | 'PRODUCTION_LOCKED';
  readonly assets: readonly DefenseVisualAsset[];
}

export const defenseVisualProduction = visualProductionRaw as DefenseVisualProduction;

interface DefHd01ArtIngest {
  readonly status: string;
  readonly backgroundCandidate?: {
    readonly runtimeUri?: string;
  };
  readonly acceptanceState?: {
    readonly assetBytesInRepository?: string;
  };
}

const defHd01ArtIngest = defHd01ArtIngestRaw as DefHd01ArtIngest;

interface DefHd01PqBenchmark {
  readonly runtimePromotion?: {
    readonly approved?: boolean;
    readonly previewCandidateOnGateBranch?: boolean;
  };
  readonly benchmark?: {
    readonly response?: {
      readonly target?: {
        readonly kind?: string;
        readonly sources?: readonly string[];
      };
    };
    readonly risk?: {
      readonly target?: {
        readonly kind?: string;
        readonly asset?: string;
        readonly width?: number;
        readonly height?: number;
        readonly transparent?: boolean;
      };
    };
  };
}

const defHd01PqBenchmark = defHd01PqBenchmarkRaw as unknown as DefHd01PqBenchmark;

function pqPreviewEnabled(): boolean {
  return defHd01PqBenchmark.runtimePromotion?.approved === true
    || defHd01PqBenchmark.runtimePromotion?.previewCandidateOnGateBranch === true;
}

export function defenseControlPqComposite(): {
  readonly marshalUri: string;
  readonly barrierUri: string;
} | null {
  if (!pqPreviewEnabled()) return null;
  const sources = defHd01PqBenchmark.benchmark?.response?.target?.sources;
  if (defHd01PqBenchmark.benchmark?.response?.target?.kind !== 'RUNTIME_COMPOSITE' || !sources || sources.length < 2) {
    return null;
  }
  return { marshalUri: sources[0]!, barrierUri: sources[1]! };
}

export function defenseSwiftPqAsset(): {
  readonly uri: string;
  readonly width: number;
  readonly height: number;
} | null {
  if (!pqPreviewEnabled()) return null;
  const target = defHd01PqBenchmark.benchmark?.risk?.target;
  if (
    target?.kind !== 'STATIC_TRANSPARENT_SVG'
    || !target.asset
    || !target.width
    || !target.height
    || target.transparent !== true
  ) {
    return null;
  }
  return { uri: target.asset, width: target.width, height: target.height };
}

function asset(id: string): DefenseVisualAsset | null {
  return defenseVisualProduction.assets.find(item => item.assetId === id) ?? null;
}

export function defenseBoardArtUri(mapId: string): string | null {
  if (
    mapId === 'ramp-01'
    && defHd01ArtIngest.acceptanceState?.assetBytesInRepository === 'PASS'
    && defHd01ArtIngest.backgroundCandidate?.runtimeUri
  ) {
    return defHd01ArtIngest.backgroundCandidate.runtimeUri;
  }
  return asset(`defense.board.${mapId}`)?.uri ?? null;
}

export function defenseTowerArtUri(towerId: DefenseTowerId, levelId: DefenseLevelId): string | null {
  return asset(`defense.tower.${towerId}.${levelId}`)?.uri ?? null;
}

export function defenseEnemyArtUri(enemyId: DefenseEnemyId): string | null {
  return asset(`defense.enemy.${enemyId}`)?.uri ?? null;
}

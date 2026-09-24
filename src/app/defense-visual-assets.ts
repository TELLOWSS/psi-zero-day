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
    readonly approvedAssets?: {
      readonly control?: string | null;
      readonly swift?: string | null;
    };
  };
}

const defHd01PqBenchmark = defHd01PqBenchmarkRaw as DefHd01PqBenchmark;

function approvedPqAsset(kind: 'control' | 'swift'): string | null {
  if (defHd01PqBenchmark.runtimePromotion?.approved !== true) return null;
  return defHd01PqBenchmark.runtimePromotion.approvedAssets?.[kind] ?? null;
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
  if (towerId === 'CONTROL' && levelId === 'L1') {
    const approved = approvedPqAsset('control');
    if (approved) return approved;
  }
  return asset(`defense.tower.${towerId}.${levelId}`)?.uri ?? null;
}

export function defenseEnemyArtUri(enemyId: DefenseEnemyId): string | null {
  if (enemyId === 'SWIFT') {
    const approved = approvedPqAsset('swift');
    if (approved) return approved;
  }
  return asset(`defense.enemy.${enemyId}`)?.uri ?? null;
}

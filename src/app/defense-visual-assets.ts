import visualProductionRaw from '../../content/defense/visual-production.json';
import defHd01ArtIngestRaw from '../../content/defense/def-hd01-art-ingest.json';
import defHd01PqBenchmarkRaw from '../../content/defense/def-hd01-pq-benchmark.json';
import productionMapFamilyRaw from '../../content/defense/production-map-family-v1.json';
import swiftFinalRaw from '../../content/defense/g8a-swift-final-art.json';
import worldFinalRaw from '../../content/defense/g8a-world-final-art.json';
import g8bWorldFinalRaw from '../../content/defense/g8b-world-final-art.json';
import g8bVeiledFinalRaw from '../../content/defense/g8b-veiled-final-art.json';
import g8bSensorCompositeRaw from '../../content/defense/g8b-sensor-runtime-composite.json';
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
  readonly status: 'LEGACY_GEOMETRY_ONLY' | 'BASELINE_LOCKED' | 'PRODUCTION_LOCKED';
}

interface DefenseVisualProduction {
  readonly schemaVersion: 1;
  readonly visualVersion: string;
  readonly status: 'LEGACY_GEOMETRY_ONLY' | 'BASELINE_LOCKED' | 'PRODUCTION_LOCKED';
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

interface ProductionMapFamilyEntry {
  readonly mapId: string;
  readonly runtimeUri: string;
  readonly format: 'webp' | 'png' | 'jpg' | 'jpeg' | 'avif';
  readonly width: number;
  readonly height: number;
  readonly status: 'HD_REFERENCE_ONLY' | 'PRODUCTION_CANDIDATE' | 'PRODUCTION_LOCKED';
}
interface ProductionMapFamily {
  readonly schemaVersion: 1;
  readonly maps: readonly ProductionMapFamilyEntry[];
}
const productionMapFamily = productionMapFamilyRaw as ProductionMapFamily;

export function defenseProductionMapEntry(mapId: string): ProductionMapFamilyEntry | null {
  return productionMapFamily.maps.find(item => item.mapId === mapId) ?? null;
}

interface SwiftFinalManifest {
  readonly schemaVersion: 1;
  readonly status: 'ASSET_PENDING' | 'PRODUCTION_APPROVED';
  readonly runtimeUri: string;
  readonly format: 'webp' | 'png';
  readonly runtime: {
    readonly width: number;
    readonly height: number;
  };
  readonly promotion: {
    readonly productionApproved: boolean;
  };
}
const swiftFinalManifest = swiftFinalRaw as SwiftFinalManifest;

interface WorldFinalManifest {
  readonly schemaVersion: 1;
  readonly status: 'ASSET_PENDING' | 'PRODUCTION_APPROVED';
  readonly runtimeUri: string;
  readonly format: 'webp' | 'png';
  readonly runtime: {
    readonly width: number;
    readonly height: number;
  };
  readonly promotion: {
    readonly productionApproved: boolean;
  };
}
const worldFinalManifest = worldFinalRaw as WorldFinalManifest;
const g8bWorldFinalManifest = g8bWorldFinalRaw as WorldFinalManifest;
const g8bVeiledFinalManifest = g8bVeiledFinalRaw as SwiftFinalManifest;

interface G8bSensorCompositeManifest {
  readonly status: 'PRODUCTION_APPROVED';
  readonly mapId: string;
  readonly towerId: 'SENSOR';
  readonly levelId: 'L1';
  readonly sources: {
    readonly observer: string;
    readonly lighting: string;
  };
  readonly promotion: {
    readonly productionApproved: boolean;
  };
}
const g8bSensorCompositeManifest = g8bSensorCompositeRaw as G8bSensorCompositeManifest;

function approvedRaster(manifest: WorldFinalManifest | SwiftFinalManifest): {
  readonly uri: string;
  readonly width: number;
  readonly height: number;
} | null {
  if (
    manifest.status !== 'PRODUCTION_APPROVED'
    || manifest.promotion.productionApproved !== true
    || !['webp','png'].includes(manifest.format)
    || manifest.runtimeUri.toLowerCase().includes('.svg')
  ) return null;
  return { uri: manifest.runtimeUri, width: manifest.runtime.width, height: manifest.runtime.height };
}

export function defenseG8aWorldFinalAsset(): {
  readonly uri: string;
  readonly width: number;
  readonly height: number;
} | null {
  return approvedRaster(worldFinalManifest);
}

export function defenseG8bWorldFinalAsset(): {
  readonly uri: string;
  readonly width: number;
  readonly height: number;
} | null {
  return approvedRaster(g8bWorldFinalManifest);
}

export function defenseG8bVeiledFinalAsset(): {
  readonly uri: string;
  readonly width: number;
  readonly height: number;
} | null {
  return approvedRaster(g8bVeiledFinalManifest);
}

export function defenseSensorG8bComposite(): {
  readonly mapId: string;
  readonly observerUri: string;
  readonly lightingUri: string;
} | null {
  if (
    g8bSensorCompositeManifest.status !== 'PRODUCTION_APPROVED'
    || g8bSensorCompositeManifest.promotion.productionApproved !== true
    || g8bSensorCompositeManifest.mapId !== 'map-apt-top-down-under-slab-01'
    || g8bSensorCompositeManifest.towerId !== 'SENSOR'
    || g8bSensorCompositeManifest.levelId !== 'L1'
    || g8bSensorCompositeManifest.sources.observer.toLowerCase().includes('.svg')
    || g8bSensorCompositeManifest.sources.lighting.toLowerCase().includes('.svg')
  ) return null;
  return {
    mapId: g8bSensorCompositeManifest.mapId,
    observerUri: g8bSensorCompositeManifest.sources.observer,
    lightingUri: g8bSensorCompositeManifest.sources.lighting,
  };
}

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
  if (
    swiftFinalManifest.status !== 'PRODUCTION_APPROVED'
    || swiftFinalManifest.promotion.productionApproved !== true
    || !['webp','png'].includes(swiftFinalManifest.format)
    || swiftFinalManifest.runtimeUri.toLowerCase().includes('.svg')
  ) {
    return null;
  }
  return {
    uri: swiftFinalManifest.runtimeUri,
    width: swiftFinalManifest.runtime.width,
    height: swiftFinalManifest.runtime.height,
  };
}

function asset(id: string): DefenseVisualAsset | null {
  return defenseVisualProduction.assets.find(item => item.assetId === id) ?? null;
}

function runtimeFinalAsset(id: string): DefenseVisualAsset | null {
  const candidate = asset(id);
  if (!candidate) return null;
  if (candidate.status === 'LEGACY_GEOMETRY_ONLY') return null;
  if (candidate.uri.toLowerCase().includes('.svg')) return null;
  return candidate;
}

export function defenseBoardArtUri(mapId: string): string | null {
  if (mapId === 'map-apt-top-down-under-slab-01') {
    const finalWorld = defenseG8bWorldFinalAsset();
    if (finalWorld) return finalWorld.uri;
  }
  if (mapId === 'map-apt-bottom-up-excavation-01') {
    const finalWorld = defenseG8aWorldFinalAsset();
    if (finalWorld) return finalWorld.uri;
  }
  const productionMap = defenseProductionMapEntry(mapId);
  if (productionMap) return productionMap.runtimeUri;
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
  return runtimeFinalAsset(`defense.tower.${towerId}.${levelId}`)?.uri ?? null;
}

export function defenseEnemyArtUri(enemyId: DefenseEnemyId): string | null {
  return runtimeFinalAsset(`defense.enemy.${enemyId}`)?.uri ?? null;
}

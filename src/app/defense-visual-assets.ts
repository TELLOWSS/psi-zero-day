import visualProductionRaw from '../../content/defense/visual-production.json';
import defHd01ArtIngestRaw from '../../content/defense/def-hd01-art-ingest.json';
import defHd01PqBenchmarkRaw from '../../content/defense/def-hd01-pq-benchmark.json';
import productionMapFamilyRaw from '../../content/defense/production-map-family-v1.json';
import controlTowerProductionRaw from '../../content/defense/control-tower-production-v1.json';
import pulseTowerProductionRaw from '../../content/defense/pulse-tower-production-v1.json';
import swiftFinalRaw from '../../content/defense/g8a-swift-final-art.json';
import veiledFinalRaw from '../../content/defense/g8a-veiled-final-art.json';
import worldFinalRaw from '../../content/defense/g8a-world-final-art.json';
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


interface ControlTowerProductionEntry {
  readonly levelId: DefenseLevelId;
  readonly status: 'ASSET_PENDING' | 'PRODUCTION_APPROVED';
  readonly runtimeUri: string;
  readonly format: 'webp' | 'png';
  readonly runtime: {
    readonly width: number;
    readonly height: number;
  };
  readonly visualRole: string;
}
interface ControlTowerProductionManifest {
  readonly schemaVersion: 1;
  readonly status: 'ART_PIPELINE_READY' | 'PRODUCTION_LOCKED';
  readonly family: 'CONTROL';
  readonly mapId: string;
  readonly levels: readonly ControlTowerProductionEntry[];
}
const controlTowerProduction = controlTowerProductionRaw as ControlTowerProductionManifest;

export function defenseControlTowerProductionEntry(levelId: DefenseLevelId): ControlTowerProductionEntry | null {
  return controlTowerProduction.levels.find(item => item.levelId === levelId) ?? null;
}

interface PulseTowerProductionEntry {
  readonly levelId: 'L1';
  readonly status: 'ASSET_PENDING' | 'PRODUCTION_APPROVED';
  readonly runtimeUri: string;
  readonly format: 'webp' | 'png';
  readonly runtime: {
    readonly width: number;
    readonly height: number;
  };
  readonly visualRole: 'DIRECT_SAFETY_INTERVENTION';
}
interface PulseTowerProductionManifest {
  readonly schemaVersion: 1;
  readonly status: 'ART_PIPELINE_READY' | 'PRODUCTION_LOCKED';
  readonly family: 'PULSE';
  readonly mapId: string;
  readonly levels: readonly PulseTowerProductionEntry[];
}
const pulseTowerProduction = pulseTowerProductionRaw as PulseTowerProductionManifest;

export function defensePulseTowerProductionEntry(levelId: DefenseLevelId): PulseTowerProductionEntry | null {
  if (levelId !== 'L1') return null;
  return pulseTowerProduction.levels.find(item => item.levelId === 'L1') ?? null;
}

function approvedPulseTowerVisual(levelId: DefenseLevelId): DefenseG8aTowerVisual | null {
  const entry = defensePulseTowerProductionEntry(levelId);
  if (!entry || entry.status !== 'PRODUCTION_APPROVED') return null;
  if (!['webp','png'].includes(entry.format) || entry.runtimeUri.toLowerCase().includes('.svg')) return null;
  return {
    uri: entry.runtimeUri,
    semantic: 'ALERT_CONTROL',
    width: entry.runtime.width,
    height: entry.runtime.height,
  };
}

function approvedControlTowerVisual(levelId: DefenseLevelId): DefenseG8aTowerVisual | null {
  const entry = defenseControlTowerProductionEntry(levelId);
  if (!entry || entry.status !== 'PRODUCTION_APPROVED') return null;
  if (!['webp','png'].includes(entry.format) || entry.runtimeUri.toLowerCase().includes('.svg')) return null;
  return {
    uri: entry.runtimeUri,
    semantic: 'TRAFFIC_CONTROL',
    width: entry.runtime.width,
    height: entry.runtime.height,
  };
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

interface VeiledFinalManifest {
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
const veiledFinalManifest = veiledFinalRaw as VeiledFinalManifest;

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

export function defenseG8aWorldFinalAsset(): {
  readonly uri: string;
  readonly width: number;
  readonly height: number;
} | null {
  if (
    worldFinalManifest.status !== 'PRODUCTION_APPROVED'
    || worldFinalManifest.promotion.productionApproved !== true
    || !['webp','png'].includes(worldFinalManifest.format)
    || worldFinalManifest.runtimeUri.toLowerCase().includes('.svg')
  ) {
    return null;
  }
  return {
    uri: worldFinalManifest.runtimeUri,
    width: worldFinalManifest.runtime.width,
    height: worldFinalManifest.runtime.height,
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

export function defenseG8aVeiledFinalAsset(): {
  readonly uri: string;
  readonly width: number;
  readonly height: number;
} | null {
  if (
    veiledFinalManifest.status !== 'PRODUCTION_APPROVED'
    || veiledFinalManifest.promotion.productionApproved !== true
    || !['webp','png'].includes(veiledFinalManifest.format)
    || veiledFinalManifest.runtimeUri.toLowerCase().includes('.svg')
  ) {
    return null;
  }
  return {
    uri: veiledFinalManifest.runtimeUri,
    width: veiledFinalManifest.runtime.width,
    height: veiledFinalManifest.runtime.height,
  };
}

export interface DefenseG8aTowerVisual {
  readonly uri: string;
  readonly semantic: 'ALERT_CONTROL' | 'EXCLUSION_CONTROL' | 'TRAFFIC_CONTROL' | 'SITE_SENSOR';
  readonly width: number;
  readonly height: number;
}

const G8A_TOWER_VISUALS: Readonly<Record<DefenseTowerId, DefenseG8aTowerVisual>> = {
  PULSE: {
    uri: 'assets/episode01/scene-elements/temporary-distribution-board.webp',
    semantic: 'ALERT_CONTROL',
    width: 66,
    height: 74,
  },
  BURST: {
    uri: 'assets/episode01/scene-elements/exclusion-zone.webp',
    semantic: 'EXCLUSION_CONTROL',
    width: 82,
    height: 78,
  },
  CONTROL: {
    uri: 'assets/episode01/scene-elements/vehicle-pedestrian-separation.webp',
    semantic: 'TRAFFIC_CONTROL',
    width: 104,
    height: 72,
  },
  SENSOR: {
    uri: 'assets/episode01/scene-elements/site-weather-station.webp',
    semantic: 'SITE_SENSOR',
    width: 66,
    height: 76,
  },
};

/**
 * G8-A presentation-only construction semantics for the four defense families.
 * Internal tower IDs, balance and engine behavior remain unchanged. These reuse
 * reviewed Episode 01 raster scene elements so the physical-phone board never
 * falls back to abstract SVG/prototype tower glyphs while dedicated tower
 * masters are being authored.
 */
export function defenseG8aTowerVisual(
  mapId: string,
  towerId: DefenseTowerId,
  levelId: DefenseLevelId,
): DefenseG8aTowerVisual | null {
  if (mapId !== 'map-apt-bottom-up-excavation-01') return null;
  if (towerId === 'CONTROL') {
    const dedicated = approvedControlTowerVisual(levelId);
    if (dedicated) return dedicated;
  }
  if (towerId === 'PULSE') {
    const dedicated = approvedPulseTowerVisual(levelId);
    if (dedicated) return dedicated;
  }
  return G8A_TOWER_VISUALS[towerId] ?? null;
}

function asset(id: string): DefenseVisualAsset | null {
  return defenseVisualProduction.assets.find(item => item.assetId === id) ?? null;
}


export function defenseBoardArtUri(mapId: string): string | null {
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
  return asset(`defense.tower.${towerId}.${levelId}`)?.uri ?? null;
}

export function defenseEnemyArtUri(enemyId: DefenseEnemyId): string | null {
  if (enemyId === 'VEILED') {
    const finalVeiled = defenseG8aVeiledFinalAsset();
    if (finalVeiled) return finalVeiled.uri;
  }
  return asset(`defense.enemy.${enemyId}`)?.uri ?? null;
}

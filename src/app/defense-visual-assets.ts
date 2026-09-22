import visualProductionRaw from '../../content/defense/visual-production.json';
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
  readonly status: 'BASELINE_LOCKED';
}

interface DefenseVisualProduction {
  readonly schemaVersion: 1;
  readonly visualVersion: string;
  readonly status: 'BASELINE_LOCKED';
  readonly assets: readonly DefenseVisualAsset[];
}

export const defenseVisualProduction = visualProductionRaw as DefenseVisualProduction;

function asset(id: string): DefenseVisualAsset | null {
  return defenseVisualProduction.assets.find(item => item.assetId === id) ?? null;
}

export function defenseBoardArtUri(mapId: string): string | null {
  return asset(`defense.board.${mapId}`)?.uri ?? null;
}

export function defenseTowerArtUri(towerId: DefenseTowerId, levelId: DefenseLevelId): string | null {
  return asset(`defense.tower.${towerId}.${levelId}`)?.uri ?? null;
}

export function defenseEnemyArtUri(enemyId: DefenseEnemyId): string | null {
  return asset(`defense.enemy.${enemyId}`)?.uri ?? null;
}

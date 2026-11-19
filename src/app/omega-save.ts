/**
 * OMEGA PROTOCOL — Save Persistence & Strict Sanitization.
 * Corrupt or missing localStorage entries never crash and never forge unlocks or clears.
 */

import {
  OMEGA_SECTORS,
  type OmegaRank,
  type OmegaSectorId,
} from '../domain/omega-protocol';

export const OMEGA_SAVE_KEY = 'psi.omega.protocol.save.v1';

export interface OmegaSectorProgress {
  readonly clears: number;
  readonly bestScore: number;
  readonly bestRank: OmegaRank | null;
  readonly bestCombo: number;
}

export interface OmegaSaveDocument {
  readonly version: 1;
  readonly unlockedSector: 1 | 2 | 3 | 4;
  readonly campaignClears: number;
  readonly bestCampaignScore: number;
  readonly sectors: Record<OmegaSectorId, OmegaSectorProgress>;
}

export type OmegaStorageReader = Pick<Storage, 'getItem'>;
export type OmegaStoragePort = Pick<Storage, 'getItem' | 'setItem'>;

const RANK_ORDER: Record<OmegaRank, number> = { S: 4, A: 3, B: 2, C: 1 };

function emptySectorProgress(): OmegaSectorProgress {
  return { clears: 0, bestScore: 0, bestRank: null, bestCombo: 0 };
}

export function emptyOmegaSave(): OmegaSaveDocument {
  return {
    version: 1,
    unlockedSector: 1,
    campaignClears: 0,
    bestCampaignScore: 0,
    sectors: {
      sector_1: emptySectorProgress(),
      sector_2: emptySectorProgress(),
      sector_3: emptySectorProgress(),
      sector_4: emptySectorProgress(),
    },
  };
}

function sanitizePositiveInt(value: unknown, max = 9_999_999): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(max, Math.floor(value)));
}

function sanitizeRank(value: unknown): OmegaRank | null {
  return value === 'S' || value === 'A' || value === 'B' || value === 'C' ? value : null;
}

function betterRank(a: OmegaRank | null, b: OmegaRank | null): OmegaRank | null {
  if (!a) return b;
  if (!b) return a;
  return RANK_ORDER[a] >= RANK_ORDER[b] ? a : b;
}

function sanitizeSectorProgress(raw: unknown): OmegaSectorProgress {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return emptySectorProgress();
  const obj = raw as Record<string, unknown>;
  const clears = sanitizePositiveInt(obj.clears, 9999);
  if (clears === 0) return emptySectorProgress();
  return {
    clears,
    bestScore: sanitizePositiveInt(obj.bestScore),
    bestRank: sanitizeRank(obj.bestRank),
    bestCombo: sanitizePositiveInt(obj.bestCombo, 9999),
  };
}

export function sanitizeOmegaSave(raw: unknown): OmegaSaveDocument {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return emptyOmegaSave();
  const obj = raw as Record<string, unknown>;
  if (obj.version !== 1) return emptyOmegaSave();
  const rawSectors =
    obj.sectors && typeof obj.sectors === 'object' && !Array.isArray(obj.sectors)
      ? (obj.sectors as Record<string, unknown>)
      : {};

  const sectors: Record<OmegaSectorId, OmegaSectorProgress> = {
    sector_1: sanitizeSectorProgress(rawSectors.sector_1),
    sector_2: sanitizeSectorProgress(rawSectors.sector_2),
    sector_3: sanitizeSectorProgress(rawSectors.sector_3),
    sector_4: sanitizeSectorProgress(rawSectors.sector_4),
  };

  // Unlocked sector is strictly derived from verified clears (never forged beyond 1..4)
  let derivedUnlock: 1 | 2 | 3 | 4 = 1;
  if (sectors.sector_1.clears > 0) derivedUnlock = 2;
  if (sectors.sector_2.clears > 0) derivedUnlock = 3;
  if (sectors.sector_3.clears > 0) derivedUnlock = 4;

  const rawUnlocked = sanitizePositiveInt(obj.unlockedSector, 4);
  const unlockedSector = Math.max(derivedUnlock, Math.min(derivedUnlock, rawUnlocked)) as 1 | 2 | 3 | 4;

  const campaignClears = sectors.sector_4.clears > 0 ? sanitizePositiveInt(obj.campaignClears, 9999) : 0;

  return {
    version: 1,
    unlockedSector,
    campaignClears,
    bestCampaignScore: campaignClears > 0 ? sanitizePositiveInt(obj.bestCampaignScore) : 0,
    sectors,
  };
}

export function readOmegaSave(storage?: OmegaStorageReader | null): OmegaSaveDocument {
  if (!storage) return emptyOmegaSave();
  try {
    const raw = storage.getItem(OMEGA_SAVE_KEY);
    if (!raw) return emptyOmegaSave();
    return sanitizeOmegaSave(JSON.parse(raw));
  } catch {
    return emptyOmegaSave();
  }
}

export function writeOmegaSave(storage: OmegaStoragePort | null | undefined, doc: OmegaSaveDocument): boolean {
  if (!storage) return false;
  try {
    storage.setItem(OMEGA_SAVE_KEY, JSON.stringify(sanitizeOmegaSave(doc)));
    return true;
  } catch {
    return false;
  }
}

export function recordOmegaRunResult(
  storage: OmegaStoragePort | null | undefined,
  params: {
    readonly clearedSectorIndices: readonly number[];
    readonly fullCampaignClear: boolean;
    readonly score: number;
    readonly rank: OmegaRank;
    readonly maxCombo: number;
  },
): OmegaSaveDocument {
  const current = readOmegaSave(storage);
  const nextSectors: Record<OmegaSectorId, OmegaSectorProgress> = { ...current.sectors };

  for (const idx of params.clearedSectorIndices) {
    const sector = OMEGA_SECTORS.find(s => s.index === idx);
    if (!sector) continue;
    const prev = nextSectors[sector.id];
    nextSectors[sector.id] = {
      clears: prev.clears + 1,
      bestScore: Math.max(prev.bestScore, sanitizePositiveInt(params.score)),
      bestRank: betterRank(prev.bestRank, params.rank),
      bestCombo: Math.max(prev.bestCombo, sanitizePositiveInt(params.maxCombo, 9999)),
    };
  }

  let unlocked: 1 | 2 | 3 | 4 = current.unlockedSector;
  if (nextSectors.sector_1.clears > 0 && unlocked < 2) unlocked = 2;
  if (nextSectors.sector_2.clears > 0 && unlocked < 3) unlocked = 3;
  if (nextSectors.sector_3.clears > 0 && unlocked < 4) unlocked = 4;

  const updated: OmegaSaveDocument = {
    version: 1,
    unlockedSector: unlocked,
    campaignClears: params.fullCampaignClear ? current.campaignClears + 1 : current.campaignClears,
    bestCampaignScore: params.fullCampaignClear
      ? Math.max(current.bestCampaignScore, sanitizePositiveInt(params.score))
      : current.bestCampaignScore,
    sectors: nextSectors,
  };

  writeOmegaSave(storage, updated);
  return updated;
}

export function countClearedOmegaSectors(doc: OmegaSaveDocument): number {
  return OMEGA_SECTORS.filter(sector => doc.sectors[sector.id].clears > 0).length;
}

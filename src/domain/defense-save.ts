import type { DefenseRunState } from './defense';

export interface DefenseScenarioRecord {
  readonly scenarioId: string;
  readonly finishedRuns: number;
  readonly clears: number;
  readonly bestStars: 0 | 1 | 2 | 3;
  readonly bestScore: number;
  readonly bestShield: number;
  readonly bestCompletedWaves: number;
  readonly lastResultRunId: string | null;
  readonly updatedAt: string | null;
}

export interface DefenseSaveDocument {
  readonly activeRun: DefenseRunState | null;
  readonly records: readonly DefenseScenarioRecord[];
  readonly cosmeticIds: readonly string[];
  readonly claimIds: readonly string[];
  /** Completed result identities. Prevents duplicate record application after replay/reload. */
  readonly settledRunIds: readonly string[];
}

export interface DefenseSaveEnvelope {
  readonly namespace: 'defense';
  readonly schemaVersion: 1;
  readonly rulesVersion: string;
  readonly contentVersion: string;
  readonly buildVersion: string;
  readonly revision: number;
  readonly savedAt: string;
  /** Local corruption check only; not a tamper-proof signature. */
  readonly checksum: string;
  readonly payload: DefenseSaveDocument;
}

export type DefenseSaveInspection =
  | { readonly kind: 'empty'; readonly document: DefenseSaveDocument; readonly revision: 0 }
  | { readonly kind: 'ready'; readonly document: DefenseSaveDocument; readonly revision: number; readonly savedAt: string }
  | {
      readonly kind: 'version-mismatch';
      readonly document: DefenseSaveDocument;
      readonly revision: number;
      readonly savedAt: string;
      readonly savedRulesVersion: string;
      readonly savedContentVersion: string;
    }
  | { readonly kind: 'corrupt'; readonly raw: string; readonly issue: string }
  | { readonly kind: 'storage-error'; readonly issue: string };

export interface DefenseOutcomeApplication {
  readonly document: DefenseSaveDocument;
  readonly awardedCosmeticIds: readonly string[];
  readonly applied: boolean;
}

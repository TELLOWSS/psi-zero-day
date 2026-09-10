import type { GameState, ProfileState } from './state';
import type { Id } from './common';

export interface SaveEnvelope {
  readonly schema_version: 1;
  readonly content_version: string;
  readonly rules_version: string;
  readonly build_version: string;
  readonly slot_id: Id;
  readonly revision: number;
  readonly saved_at: string;
  readonly checksum: string;
  readonly payload: GameState;
}
export interface ProfileEnvelope {
  readonly schema_version: 1;
  readonly revision: number;
  readonly payload: ProfileState;
}

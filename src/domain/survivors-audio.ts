export type SurvivorsAudioEventType = 'shoot' | 'spray' | 'laser' | 'impact' | 'control' | 'pickup' | 'hit' | 'levelup' | 'boss_alarm' | 'shout' | 'win' | 'defeat';
export interface SurvivorsAudioEvent { id: number; type: SurvivorsAudioEventType; x?: number | undefined; y?: number | undefined; outcome?: 'critical' | 'boss'; actorKind?: string; collected?: boolean; }
export type SurvivorsAudioBus = 'Music' | 'SFX' | 'Voice' | 'Ambience';
export interface SurvivorsAudioAsset {
 id: string; bus: SurvivorsAudioBus; uri: string | null; status: 'MISSING_FINAL' | 'CANDIDATE' | 'PRODUCTION_APPROVED';
 rights: string | null; sha256: string | null; loop: boolean;
}

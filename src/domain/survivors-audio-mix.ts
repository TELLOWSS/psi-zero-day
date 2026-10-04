export const DEFAULT_AUDIO_MIX = {Music: .7, SFX: .65, Voice: 1, Ambience: .45} as const;
export type AudioMix = Record<keyof typeof DEFAULT_AUDIO_MIX, number>;
export function sanitizeAudioMix(value: unknown): AudioMix {
  const record = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  return Object.fromEntries(Object.entries(DEFAULT_AUDIO_MIX).map(([bus, fallback]) => {
    const input = record[bus];
    return [bus, typeof input === 'number' && Number.isFinite(input) ? Math.max(0, Math.min(1, input)) : fallback];
  })) as AudioMix;
}

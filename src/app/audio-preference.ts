export const AUDIO_MUTED_STORAGE_KEY = 'psi.audio.muted';
export const AUDIO_PREFERENCE_EVENT = 'psi:audio-preference';

export function readAudioMuted(): boolean {
  if (typeof window === 'undefined') return false;
  try { return window.localStorage.getItem(AUDIO_MUTED_STORAGE_KEY) === '1'; }
  catch { return false; }
}

export function subscribeAudioMuted(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const onPreference = () => listener();
  const onStorage = (event: StorageEvent) => {
    if (event.key === AUDIO_MUTED_STORAGE_KEY) listener();
  };
  window.addEventListener(AUDIO_PREFERENCE_EVENT, onPreference);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(AUDIO_PREFERENCE_EVENT, onPreference);
    window.removeEventListener('storage', onStorage);
  };
}

export function setAudioMuted(muted: boolean): void {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(AUDIO_MUTED_STORAGE_KEY, muted ? '1' : '0'); }
  catch { /* localStorage can be unavailable in hardened WebViews */ }
  window.dispatchEvent(new Event(AUDIO_PREFERENCE_EVENT));
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { SiteAudio } from '../presentation/site-audio';
import type { SiteAudioCue } from '../presentation/site-audio';

export function useSceneAudio(phase: string, feedbackId: string) {
  const controller = useRef<SiteAudio | null>(null);
  const [status, setStatus] = useState<'muted' | 'enabled' | 'unavailable'>('muted');
  const [pending, setPending] = useState(false);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    const visibility = () => controller.current?.setHidden(document.hidden);
    document.addEventListener('visibilitychange', visibility);
    return () => { alive.current = false; document.removeEventListener('visibilitychange', visibility); controller.current?.dispose(); controller.current = null; };
  }, []);
  useEffect(() => { controller.current?.setTitle(phase === 'start'); }, [phase]);
  useEffect(() => { if (feedbackId) controller.current?.cue('relationship'); }, [feedbackId]);
  const cue = useCallback((kind: SiteAudioCue) => controller.current?.cue(kind), []);
  const toggle = async () => {
    if (pending || status === 'unavailable') return;
    if (status === 'enabled') { controller.current?.mute(); setStatus('muted'); return; }
    setPending(true);
    const audio = controller.current ??= new SiteAudio();
    audio.setTitle(phase === 'start'); audio.setHidden(document.hidden);
    try { await audio.enable(); if (alive.current) setStatus('enabled'); }
    catch { audio.dispose(); controller.current = null; if (alive.current) setStatus('unavailable'); }
    finally { if (alive.current) setPending(false); }
  };
  return { status, pending, toggle, cue };
}

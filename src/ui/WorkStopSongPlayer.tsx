import { useEffect, useRef } from 'react';
import copy from '../../content/localization/work-stop-song-ko.json';
import './game-manual.css';

export const workStopSongText = (id: 'open') => copy[id];

export function WorkStopSongPlayer({ onClose }: { readonly onClose: () => void }) {
  const dialogRef = useRef<HTMLElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const audio = audioRef.current;
    dialogRef.current?.focus();
    return () => { audio?.pause(); previous?.focus(); };
  }, []);
  return <div className="game-manual-backdrop">
    <section className="game-manual work-stop-song-player" role="dialog" aria-modal="true" aria-label={copy.open} tabIndex={-1}
      ref={dialogRef} onKeyDown={event => { event.stopPropagation(); if (event.key === 'Escape') onClose(); }}>
      <header><h2>{copy.open}</h2><button type="button" onClick={onClose}>{copy.close}</button></header>
      <p>{copy.description}</p>
      <audio ref={audioRef} controls preload="metadata" aria-label={copy.open} style={{ width:'100%' }}>
        <source src="/assets/survivors/work-stop-song-full-v1.m4a" type="audio/mp4" />
        {copy.unsupported}
      </audio>
      <p>{copy.controls}</p>
    </section>
  </div>;
}

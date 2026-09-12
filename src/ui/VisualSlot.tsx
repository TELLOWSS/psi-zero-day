import { useState } from 'react';
import type { CSSProperties } from 'react';
import visuals from '../../content/episode01/visuals.json';
import { IndustrialScene } from './IndustrialScene';
import { WorkerSilhouette } from './WorkerSilhouette';
import type { Silhouette } from './WorkerSilhouette';

interface Slot { uri: string | null; accent?: string; silhouette?: Silhouette }
export function characterVisual(id: string): Slot | undefined {
  return (visuals.characters as Record<string, Slot>)[id];
}
export function sceneVisual(chapter = 'foundation'): Slot | undefined {
  return (visuals.backgrounds as Record<string, Slot>)[chapter];
}
export function textStyle(id: string): string | undefined {
  return (visuals.text_styles as Record<string, string>)[id];
}
export function VisualImage({ uri, alt, className }: { uri?: string | null; alt: string; className?: string }) {
  const [failed, setFailed] = useState<string | null>(null);
  if (!uri || failed === uri) return null;
  const src = /^(?:https?:|data:)/.test(uri) ? uri : `${import.meta.env.BASE_URL}${uri.replace(/^\/?(?:public\/)?/, '')}`;
  return <img className={className} src={src} alt={alt} onError={() => setFailed(uri)} />;
}
export function CharacterCard({ person, portraitUri, speakerLabel }: { person: { id: string; name: string; role: string }; portraitUri?: string; speakerLabel?: string }) {
  const visual = characterVisual(person.id);
  return <aside className="character-card is-speaking" data-npc-id={person.id} style={{ '--person-accent': visual?.accent } as CSSProperties} aria-label={`${person.name} · ${person.role}`}>
    <div className="portrait-slot">
      <WorkerSilhouette variant={visual?.silhouette} />
      <VisualImage uri={portraitUri ?? visual?.uri} alt={person.name} className="portrait-image" />
    </div>
    <div className="character-identity"><span className="identity-rule" />{speakerLabel ? <span className="speaker-label">{speakerLabel}</span> : null}<strong>{person.name}</strong><span>{person.role}</span></div>
  </aside>;
}

/** CSS scene remains behind a future manifest image; failed/missing files never show a broken icon. */
export function SiteScene({ chapter }: { chapter?: string }) {
  return <div className="site-scene" aria-hidden="true">
    <IndustrialScene />
    <VisualImage uri={sceneVisual(chapter)?.uri} alt="" className="background-image" />
  </div>;
}

import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { CharacterGrowthView } from '../app/character-growth';
import type { CharacterLoadoutView, EquipmentSlot } from '../app/character-loadout';
import visuals from '../../content/episode01/visuals.json';

interface CharacterVisualPlan { accent?: string }
export function characterVisual(id: string): CharacterVisualPlan | undefined {
  return (visuals.characters as Record<string, CharacterVisualPlan>)[id];
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
export function CharacterCard({ person, portraitUri, growth, loadout, equipmentTitle, slotLabel }: {
  person: { id: string; name: string; role: string };
  portraitUri?: string;
  growth?: CharacterGrowthView;
  loadout?: CharacterLoadoutView;
  equipmentTitle?: string;
  slotLabel?: (slot: EquipmentSlot) => string;
}) {
  const visual = characterVisual(person.id);
  return <aside className="character-card" style={{ '--person-accent': visual?.accent } as CSSProperties} aria-label={`${person.name} · ${person.role}`}>
    <div className="portrait-slot">
      <div className="worker-mark" aria-hidden="true"><i className="hardhat" /><i className="worker-head" /><i className="worker-vest" /></div>
      <VisualImage uri={portraitUri} alt={person.name} className="portrait-image" />
    </div>
    <div className="character-identity"><span className="identity-rule" /><strong>{person.name}</strong><span>{person.role}</span></div>
    {growth ? <div className="character-growth-summary" data-growth-stage={growth.stage}>
      <div><strong>{growth.stage_label}</strong><span>{growth.expression}</span></div>
    </div> : null}
    {loadout?.equipped.length ? <div className="character-loadout-summary" aria-label={equipmentTitle}>
      <strong>{equipmentTitle}</strong>
      <ul>{loadout.equipped.map(item => <li key={item.slot}><span>{slotLabel?.(item.slot) ?? item.slot}</span>{item.name}</li>)}</ul>
    </div> : null}
  </aside>;
}

/** CSS scene remains behind manifest-backed art; failed/missing files never show a broken icon. */
export function SiteScene({ chapter: _chapter, backgroundUri }: { chapter?: string; backgroundUri?: string }) {
  return <div className="site-scene" aria-hidden="true">
    <div className="site-horizon" /><div className="site-building building-back" /><div className="site-building building-front" />
    <div className="crane"><i /><b /><span /></div><div className="site-fence" /><div className="site-ground" />
    <VisualImage uri={backgroundUri} alt="" className="background-image" />
  </div>;
}

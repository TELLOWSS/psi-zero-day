import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { CharacterGrowthView } from '../app/character-growth';
import type { CharacterLoadoutView, EquipmentSlot } from '../app/character-loadout';
import visuals from '../../content/episode01/visuals.json';
import { formatCharacterIdentity } from '../app/character-label';

interface CharacterVisualPlan { accent?: string }
export function characterVisual(id: string): CharacterVisualPlan | undefined {
  return (visuals.characters as Record<string, CharacterVisualPlan>)[id];
}
export function textStyle(id: string): string | undefined {
  return (visuals.text_styles as Record<string, string>)[id];
}

export type VisualAssetTier = 'final' | 'rc' | 'fallback' | 'other';

/**
 * Presentation provenance only. This deliberately follows the locked art precedence:
 * final WebP -> hand-authored RC SVG -> deterministic SVG fallback.
 */
export function visualAssetTier(uri?: string | null): VisualAssetTier | undefined {
  if (!uri) return undefined;
  const clean = uri.split(/[?#]/, 1)[0]?.toLowerCase() ?? '';
  if (clean.endsWith('.webp')) return 'final';
  if (clean.endsWith('-rc.svg')) return 'rc';
  if (clean.endsWith('.svg')) return 'fallback';
  return 'other';
}

interface VisualImageProps { uri?: string | null; fallbackUri?: string; alt: string; className?: string }

export function VisualImage(props: VisualImageProps) {
  return <ResolvedImage key={JSON.stringify([props.uri, props.fallbackUri])} {...props} />;
}

function ResolvedImage({ uri, fallbackUri, alt, className }: VisualImageProps) {
  const [failed, setFailed] = useState<readonly string[]>([]);
  const [loaded, setLoaded] = useState<string | null>(null);
  const activeUri = [uri, fallbackUri].find(candidate => candidate && !failed.includes(candidate));
  if (!activeUri) return null;
  const src = /^(?:https?:|data:)/.test(activeUri) ? activeUri : `${import.meta.env.BASE_URL}${activeUri.replace(/^\/?(?:public\/)?/, '')}`;
  return <img
    key={activeUri}
    className={className}
    src={src}
    alt={alt}
    data-asset-tier={visualAssetTier(activeUri)}
    data-loaded={loaded === activeUri}
    onLoad={() => setLoaded(activeUri)}
    onError={() => setFailed(previous => [...previous, activeUri])}
  />;
}
export function CharacterCard({ person, portraitUri, fallbackPortraitUri, growth, loadout, equipmentTitle, slotLabel, introLabel, introLine }: {
  person: { id: string; name: string; role: string };
  portraitUri?: string;
  fallbackPortraitUri?: string;
  growth?: CharacterGrowthView;
  loadout?: CharacterLoadoutView;
  equipmentTitle?: string;
  slotLabel?: (slot: EquipmentSlot) => string;
  introLabel?: string;
  introLine?: string;
}) {
  const visual = characterVisual(person.id);
  return <aside className="character-card" style={{ '--person-accent': visual?.accent } as CSSProperties} aria-label={formatCharacterIdentity(person)}>
    <div className="portrait-slot">
      <div className="worker-mark" aria-hidden="true"><i className="hardhat" /><i className="worker-head" /><i className="worker-vest" /></div>
      <VisualImage uri={portraitUri} fallbackUri={fallbackPortraitUri} alt={person.name} className="portrait-image" />
    </div>
    <div className="character-identity"><span className="identity-rule" /><div className="character-identity-line"><strong>{person.name}</strong><span>{person.role}</span></div></div>
    {introLine ? <div className="character-first-contact" role="note">
      {introLabel ? <span>{introLabel}</span> : null}
      <p>{introLine}</p>
    </div> : null}
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

import { useState } from 'react';
import type { EpisodeSession } from '../app/episode-session';
import catalog from '../../content/episode01/scene-element-catalog.json';
import { VisualImage } from './VisualSlot';
import './field-guide.css';

const entries = Object.entries(catalog.elements);

export function FieldGuide({ session }: { session: EpisodeSession }) {
  const [selected, setSelected] = useState(entries[0]![0]);
  const [key, entry] = entries.find(([id]) => id === selected) ?? entries[0]!;
  const title = session.t(`ui.guide.${key}.title`);
  return <div className="field-guide">
    <header><span className="hub-kicker">FIELD GUIDE / 10</span><h1>{session.t('ui.guide.title')}</h1><p>{session.t('ui.guide.intro')}</p></header>
    <div className="field-guide-list" aria-label={session.t('ui.hub.guide')}>
      {entries.map(([id, item], index) => <button type="button" key={id} aria-pressed={id === selected} onClick={() => setSelected(id)}>
        <VisualImage uri={session.assetUri(item.planned_asset_id)} alt="" />
        <span><small>{String(index + 1).padStart(2, '0')}</small><strong>{session.t(`ui.guide.${id}.title`)}</strong></span>
      </button>)}
    </div>
    <article className="field-guide-detail" aria-live="polite">
      <div className="field-guide-preview"><VisualImage uri={session.assetUri(entry.planned_asset_id)} alt={title} /></div>
      <div className="field-guide-copy"><h2>{title}</h2><h3>{session.t('ui.guide.observe')}</h3><p>{session.t(`ui.guide.${key}.body`)}</p><small>{session.t('ui.guide.note')}</small></div>
    </article>
  </div>;
}

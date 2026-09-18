import { useMemo, useState } from 'react';
import type { EpisodeSession } from '../app/episode-session';
import catalog from '../../content/episode01/scene-element-catalog.json';
import { VisualImage } from './VisualSlot';
import './field-guide.css';

type GuideMeta = {
  id: string;
  section: string;
  section_order: number;
  episode: string;
  process_order: number;
  observe_point_text_id?: string;
  unlock_policy?: string;
};

type CatalogEntry = {
  planned_asset_id: string;
  visual_token?: string;
  field_guide?: GuideMeta;
};

const rawEntries = Object.entries(catalog.elements) as [string, CatalogEntry][];

function orderedEntries() {
  return [...rawEntries].sort((a, b) => {
    const am = a[1].field_guide;
    const bm = b[1].field_guide;
    const as = am?.section_order ?? 999;
    const bs = bm?.section_order ?? 999;
    if (as !== bs) return as - bs;
    const ao = am?.process_order ?? 999;
    const bo = bm?.process_order ?? 999;
    if (ao !== bo) return ao - bo;
    return a[0].localeCompare(b[0]);
  });
}

function GuideVisual({ session, entry, alt, className }: {
  session: EpisodeSession;
  entry: CatalogEntry;
  alt: string;
  className?: string;
}) {
  const uri = session.assetUri(entry.planned_asset_id);
  return <div className={`field-guide-visual ${className ?? ''}`.trim()}>
    <VisualImage uri={uri} alt={alt} />
    {!uri ? <span className="field-guide-token" aria-hidden="true">{entry.visual_token ?? '•'}</span> : null}
  </div>;
}

export function FieldGuide({ session }: { session: EpisodeSession }) {
  const entries = useMemo(() => orderedEntries(), []);
  const sections = useMemo(() => {
    const map = new Map<string, number>();
    for (const [, entry] of entries) {
      const meta = entry.field_guide;
      if (meta) map.set(meta.section, meta.section_order);
    }
    return [...map.entries()].sort((a,b) => a[1]-b[1]).map(([name]) => name);
  }, [entries]);

  const [section, setSection] = useState(sections[0] ?? '');
  const visible = entries.filter(([, entry]) => !section || entry.field_guide?.section === section);
  const [selected, setSelected] = useState(visible[0]?.[0] ?? entries[0]?.[0] ?? '');
  const activeVisible = visible.some(([id]) => id === selected) ? selected : visible[0]?.[0] ?? selected;
  const [key, entry] = entries.find(([id]) => id === activeVisible) ?? entries[0]!;
  const title = session.t(`ui.guide.${key}.title`);
  const meta = entry.field_guide;

  return <div className="field-guide">
    <header>
      <span className="hub-kicker">FIELD GUIDE / {entries.length}</span>
      <h1>{session.t('ui.guide.title')}</h1>
      <p>{session.t('ui.guide.intro')}</p>
    </header>

    <nav className="field-guide-sections" aria-label="현장 도감 공정 섹션">
      {sections.map(name => <button
        type="button"
        key={name}
        aria-pressed={name === section}
        onClick={() => {
          setSection(name);
          const first = entries.find(([, item]) => item.field_guide?.section === name);
          if (first) setSelected(first[0]);
        }}
      >{name.replace(/^SECTION \d+ — /, '')}</button>)}
    </nav>

    <div className="field-guide-list" aria-label={session.t('ui.hub.guide')}>
      {visible.map(([id, item], index) => <button
        type="button"
        key={id}
        aria-pressed={id === activeVisible}
        onClick={() => setSelected(id)}
      >
        <GuideVisual session={session} entry={item} alt="" />
        <span>
          <small>{item.field_guide?.id ?? String(index + 1).padStart(2, '0')} · {item.field_guide?.episode ?? ''}</small>
          <strong>{session.t(`ui.guide.${id}.title`)}</strong>
        </span>
      </button>)}
    </div>

    <article className="field-guide-detail" aria-live="polite">
      <div className="field-guide-preview">
        <GuideVisual session={session} entry={entry} alt={title} />
      </div>
      <div className="field-guide-copy">
        {meta ? <div className="field-guide-meta">
          <span>{meta.section}</span>
          <span>{meta.episode}</span>
          <span>공정순서 {meta.process_order}</span>
        </div> : null}
        <h2>{title}</h2>
        <h3>{session.t('ui.guide.observe')}</h3>
        <p>{session.t(`ui.guide.${key}.body`)}</p>
        <small>{session.t('ui.guide.note')}</small>
      </div>
    </article>
  </div>;
}

import { useMemo, useState } from 'react';
import type { EpisodeSession } from '../app/episode-session';
import catalog from '../../content/episode01/scene-element-catalog.json';
import legalBasis from '../../content/episode01/field-guide-legal-basis.json';
import { VisualImage } from './VisualSlot';
import { FieldGuideArt } from './FieldGuideArt';
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
  field_guide_visual?: {
    status?: string;
    asset_id?: string;
    asset_path?: string;
    presentation?: string;
    focus?: string;
  };
};

type LegalApplicability = 'direct' | 'related' | 'general';

type LegalProfile = {
  law: string;
  articles: string[];
  effective_date: string;
  summary_text_id: string;
};

type LegalItem = {
  field_guide_id: string;
  bases: Array<{ profile: string; applicability: LegalApplicability }>;
  site_specific?: { text_id: string; rule: string };
};

const legalProfiles = legalBasis.profiles as Record<string, LegalProfile>;
const legalItems = legalBasis.items as Record<string, LegalItem>;

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

function GuideVisual({ session, entry, itemKey, alt, className }: {
  session: EpisodeSession;
  entry: CatalogEntry;
  itemKey: string;
  alt: string;
  className?: string;
}) {
  const guideVisual = entry.field_guide_visual;
  const uri = session.assetUri(guideVisual?.asset_id ?? entry.planned_asset_id);
  return <div
    className={`field-guide-visual ${className ?? ''}`.trim()}
    data-item-key={itemKey}
    data-guide-visual-status={guideVisual?.status}
    data-guide-presentation={guideVisual?.presentation}
    data-guide-focus={guideVisual?.focus}
  >
    {uri ? <VisualImage uri={uri} alt={alt} className="field-guide-image" /> : null}
    <FieldGuideArt itemKey={itemKey} kind={(entry as any).kind} title={alt} />
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
  const legal = legalItems[key];

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
        <GuideVisual session={session} entry={item} itemKey={id} alt="" />
        <span>
          <small>{item.field_guide?.id ?? String(index + 1).padStart(2, '0')} · {item.field_guide?.episode ?? ''}</small>
          <strong>{session.t(`ui.guide.${id}.title`)}</strong>
        </span>
      </button>)}
    </div>

    <article className="field-guide-detail" aria-live="polite">
      <div className="field-guide-preview">
        <GuideVisual session={session} entry={entry} itemKey={key} alt={title} />
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
        {legal ? <section className="field-guide-legal" aria-label={session.t('ui.guide.legal.title')}>
          <div className="field-guide-legal-heading">
            <h3>{session.t('ui.guide.legal.title')}</h3>
            <small>{session.t('ui.guide.legal.reviewed')} {legalBasis.reviewed_on}</small>
          </div>
          <div className="field-guide-legal-list">
            {legal.bases.filter(({ applicability }) => applicability !== 'general').slice(0, 4).map(({ profile, applicability }) => {
              const basis = legalProfiles[profile];
              if (!basis) return null;
              return <div className="field-guide-legal-item" key={profile}>
                <span className={`field-guide-legal-level ${applicability}`}>{session.t(`ui.guide.legal.level.${applicability}`)}</span>
                <strong>{basis.law} {basis.articles.join(' · ')}</strong>
                <p>{session.t(basis.summary_text_id)}</p>
              </div>;
            })}
          </div>
          {legal.site_specific ? <div className="field-guide-site-check">
            <strong>{session.t('ui.guide.legal.level.site_specific')}</strong>
            <p>{session.t(legal.site_specific.text_id)}</p>
          </div> : null}
          <small className="field-guide-legal-note">{session.t('ui.guide.legal.notice')}</small>
        </section> : null}
        <small>{session.t('ui.guide.note')}</small>
      </div>
    </article>
  </div>;
}

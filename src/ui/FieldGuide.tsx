import { GameManual, gameManualText } from './GameManual';
import { readFgPoints, subscribeUnifiedMeta } from '../app/unified-meta-bridge';
import { useEffect, useMemo, useState } from 'react';
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
  const itemArtOnly = guideVisual?.presentation === 'generated_item_art';
  const manifestUri = itemArtOnly ? undefined : session.assetUri(guideVisual?.asset_id ?? entry.planned_asset_id);
  const uri = guideVisual?.asset_path ?? manifestUri;
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
  const [showManual, setShowManual] = useState(false);
  const entries = useMemo(() => orderedEntries(), []);
  const sections = useMemo(() => {
    const map = new Map<string, number>();
    for (const [, entry] of entries) {
      const meta = entry.field_guide;
      if (meta) map.set(meta.section, meta.section_order);
    }
    return [...map.entries()].sort((a,b) => a[1]-b[1]).map(([name]) => name);
  }, [entries]);

  const [fgPoints, setFgPoints] = useState(() => readFgPoints());
  useEffect(() => subscribeUnifiedMeta(() => setFgPoints(readFgPoints())), []);

  const [section, setSection] = useState(sections[0] ?? '');
  const visible = entries.filter(([, entry]) => !section || entry.field_guide?.section === section);
  const [selected, setSelected] = useState(visible[0]?.[0] ?? entries[0]?.[0] ?? '');
  const activeVisible = visible.some(([id]) => id === selected) ? selected : visible[0]?.[0] ?? selected;
  const [key, entry] = entries.find(([id]) => id === activeVisible) ?? entries[0]!;
  const title = session.t(`ui.guide.${key}.title`);
  const meta = entry.field_guide;
  const legal = legalItems[key];

  return <div className="field-guide">
    {showManual && <GameManual onClose={() => setShowManual(false)} />}
    <button type="button" className="hub-primary" onClick={() => setShowManual(true)}>{gameManualText('open')}</button>
    <header style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.8rem' }}>
      <div>
        <span className="hub-kicker">FIELD GUIDE / {entries.length}</span>
        <h1>{session.t('ui.guide.title')}</h1>
        <p>{session.t('ui.guide.intro')}</p>
      </div>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        background: 'rgba(2, 132, 199, 0.2)',
        border: '1px solid #0284c7',
        padding: '0.4rem 0.9rem',
        borderRadius: '999px',
        color: '#38bdf8',
        fontSize: '0.9rem',
        fontWeight: 'bold',
      }}>
        <span>🔬 현장도감 연구 데이터:</span>
        <strong style={{ color: '#fff', fontSize: '1.05rem' }}>{fgPoints} FG</strong>
      </div>
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

        {/* TRIAD GAMEPLAY UNIFICATION PANEL */}
        <section className="field-guide-triad-integration" aria-label="3대 게임플레이 일체화 연계 효과" style={{
          marginTop: '1.2rem',
          padding: '1rem',
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '8px',
        }}>
          <h3 style={{ fontSize: '0.95rem', color: '#38bdf8', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🔗</span> 4위 1체 시스템 연계 효과
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.6rem', fontSize: '0.85rem' }}>
            <div style={{ background: 'rgba(30, 41, 59, 0.7)', padding: '0.6rem', borderRadius: '6px' }}>
              <strong style={{ color: '#fbbf24', display: 'block', marginBottom: '0.2rem' }}>📖 스토리 모드</strong>
              <span style={{ color: '#cbd5e1' }}>에피소드 {meta?.episode ?? '01'} 현장 실무 및 갈등 조정 시 핵심 하한선 근거로 적용</span>
            </div>
            <div style={{ background: 'rgba(30, 41, 59, 0.7)', padding: '0.6rem', borderRadius: '6px' }}>
              <strong style={{ color: '#34d399', display: 'block', marginBottom: '0.2rem' }}>📢 순찰 슈팅</strong>
              <span style={{ color: '#cbd5e1' }}>순찰 중 관련 위험 요소 즉각 탐지 및 계도력 +15% 시너지</span>
            </div>
            <div style={{ background: 'rgba(30, 41, 59, 0.7)', padding: '0.6rem', borderRadius: '6px' }}>
              <strong style={{ color: '#60a5fa', display: 'block', marginBottom: '0.2rem' }}>🛡️ 전술 디펜스</strong>
              <span style={{ color: '#cbd5e1' }}>고위험 공정 방어선 내 가설 방호벽/차단 센서로 전술 배치</span>
            </div>
          </div>
        </section>

        <small>{session.t('ui.guide.note')}</small>
      </div>
    </article>
  </div>;
}

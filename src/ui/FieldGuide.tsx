import { GameManual, gameManualText } from './GameManual';
import { readFgPoints, subscribeUnifiedMeta } from '../app/unified-meta-bridge';
import { useEffect, useMemo, useState, useRef } from 'react';
import type { EpisodeSession } from '../app/episode-session';
import catalog from '../../content/episode01/scene-element-catalog.json';
import legalBasis from '../../content/episode01/field-guide-legal-basis.json';
import { VisualImage } from './VisualSlot';
import { FieldGuideArt } from './FieldGuideArt';
import './field-guide.css';
import './field-guide-studio.css';
import studioCopy from '../../content/localization/field-guide-studio-ko.json';
import studioArt from '../../content/art/field-studio-v1.json';

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
    {uri ? <VisualImage uri={uri} alt={alt} className="field-guide-image" loading={alt?'eager':'lazy'} /> : <FieldGuideArt itemKey={itemKey} kind={(entry as any).kind} title={alt} />}
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
  const [query,setQuery]=useState('');
  const normalized=query.normalize('NFKC').toLocaleLowerCase().trim();
  const visible = entries.filter(([id, entry]) => (!section || entry.field_guide?.section === section)&&(!normalized||`${session.t(`ui.guide.${id}.title`)} ${session.t(`ui.guide.${id}.body`)} ${entry.field_guide?.id??''}`.normalize('NFKC').toLocaleLowerCase().includes(normalized)));
  const detailRef=useRef<HTMLElement>(null),dialogRef=useRef<HTMLDialogElement>(null);
  const [enlarged,setEnlarged]=useState(false);
  useEffect(()=>{if(!enlarged)return;const dialog=dialogRef.current,source=document.activeElement;dialog?.showModal();return()=>{dialog?.close();if(source instanceof HTMLElement&&source.isConnected)source.focus();};},[enlarged]);
  const [selected, setSelected] = useState(visible[0]?.[0] ?? entries[0]?.[0] ?? '');
  const activeVisible = visible.some(([id]) => id === selected) ? selected : visible[0]?.[0] ?? selected;
  const [key, entry] = entries.find(([id]) => id === activeVisible) ?? entries[0]!;
  const title = session.t(`ui.guide.${key}.title`);
  const meta = entry.field_guide;
  const legal = legalItems[key];

  return <div className="field-guide">
    {showManual && <GameManual onClose={() => setShowManual(false)} />}
    <header className="field-guide-masthead">
      <img src={studioArt.scenes.newBuild.uri} alt="" className="field-guide-scene"/>
      <div>
        <span className="hub-kicker">{studioCopy.brand} / {entries.length}</span>
        <h1>{session.t('ui.guide.title')}</h1>
        <p>{session.t('ui.guide.intro')}</p>
      </div>
      <div className="field-guide-header-actions"><span className="field-guide-research">{studioCopy.research}<strong>{fgPoints} FG</strong></span><button type="button" onClick={() => setShowManual(true)}>{gameManualText('open')}</button></div>
    </header>
    <div className="field-guide-toolbar"><label><span>{studioCopy.search}</span><input type="search" aria-label={studioCopy.search} value={query} placeholder={studioCopy.searchPlaceholder} onChange={e=>{setQuery(e.target.value);setSection('');}}/></label><span role="status">{studioCopy.results} <strong>{visible.length}</strong> / {entries.length}</span></div>

    <nav className="field-guide-sections" aria-label="현장 도감 공정 섹션">
      <button type="button" aria-pressed={!section} onClick={()=>setSection('')}>{studioCopy.all}</button>
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
        onClick={() => {setSelected(id);detailRef.current?.scrollTo?.({top:0});}}
      >
        <GuideVisual session={session} entry={item} itemKey={id} alt="" />
        <span>
          <small>{item.field_guide?.id ?? String(index + 1).padStart(2, '0')} · {item.field_guide?.episode ?? ''}</small>
          <strong>{session.t(`ui.guide.${id}.title`)}</strong>
        </span>
      </button>)}
    </div>

    {visible.length?<article ref={detailRef} className="field-guide-detail" aria-live="polite">
      <div className="field-guide-preview">
        <GuideVisual session={session} entry={entry} itemKey={key} alt={title} />
        <button className="field-guide-enlarge" type="button" onClick={()=>setEnlarged(true)}>{studioCopy.enlarge}</button>
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

        <section className="field-guide-triad-integration" aria-label={studioCopy.uses}><h3>{studioCopy.uses}</h3><div>{(['story','watch','guard'] as const).map(mode=><p key={mode}><strong>{studioCopy[mode]}</strong><span>{studioCopy[`${mode}Hint`]}</span></p>)}</div></section>

        <small>{session.t('ui.guide.note')}</small>
      </div>
    </article>:<div className="field-guide-empty" role="status"><h2>{studioCopy.empty}</h2><p>{studioCopy.emptyHint}</p></div>}
    {enlarged&&<dialog ref={dialogRef} className="field-guide-lightbox" aria-label={`${title} · ${studioCopy.enlarge}`} onCancel={()=>setEnlarged(false)}><header><h2>{title}</h2><button type="button" onClick={()=>setEnlarged(false)}>{studioCopy.close}</button></header><GuideVisual session={session} entry={entry} itemKey={key} alt={title}/><p>{studioCopy.imageNote}</p></dialog>}
  </div>;
}

import type { EngineCommand } from '../engine';
import type { PresentationCommand } from '../domain';
import type { Translate } from '../localization/translator';
import { textStyle, VisualImage } from './VisualSlot';
import { episode01ChoiceVisual } from '../app/episode01-choice-visual';

function ChoiceButtons({ p, t, send, assetUri, eventId, onChoicePreview }: {
  p: Extract<PresentationCommand, { type: 'SHOW_CHOICE' }>;
  t: Translate;
  send: (command: EngineCommand) => void;
  assetUri: (id: string) => string | undefined;
  eventId?: string | null;
  onChoicePreview?: (choiceId: string | null) => void;
}) {
  return <div className="choice-panel">{p.choices.map((c, i) => {
    const visual = episode01ChoiceVisual(eventId, c.choice_id);
    const resolvedBackground = visual?.background_asset_id ? assetUri(visual.background_asset_id) : undefined;
    return <button key={c.choice_id} type="button" disabled={!c.enabled} data-choice-tone={visual?.tone} data-authored-visual={visual?.authored || undefined}
      onMouseEnter={() => { if (c.enabled) onChoicePreview?.(c.choice_id); }}
      onMouseLeave={() => onChoicePreview?.(null)}
      onFocus={() => { if (c.enabled) onChoicePreview?.(c.choice_id); }}
      onBlur={() => onChoicePreview?.(null)}
      onClick={e => { if (e.detail < 2) { onChoicePreview?.(null); send({ type: 'choose_event', instance_id: p.instance_id, node_id: p.node_id, choice_id: c.choice_id }); } }}>
      {visual ? <span className="choice-visual" data-crop={visual.crop} aria-hidden="true">
        <VisualImage uri={resolvedBackground ?? visual.background_uri} fallbackUri={resolvedBackground ? visual.background_uri : undefined} alt="" className="choice-visual-bg" />
        {visual.prop_uri ? <VisualImage uri={visual.prop_uri} alt="" className="choice-visual-prop" /> : null}
        <i />
        <em>{t(visual.label_text_id)}</em>
      </span> : null}
      <span className="choice-copy">
        <span className="choice-number" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
        <span className="choice-text">{t(c.text_id)}</span>
      </span>
      <span className="choice-arrow" aria-hidden="true">↗</span>
    </button>;
  })}</div>;
}

export function PresentationView({ commands, t, send, assetUri, eventId, choiceFallback = false, onChoicePreview }: {
  commands: readonly PresentationCommand[]; t: Translate; send: (command: EngineCommand) => void;
  assetUri: (id: string) => string | undefined;
  eventId?: string | null;
  choiceFallback?: boolean;
  onChoicePreview?: (choiceId: string | null) => void;
}) {
  return <>{commands.map((p, index) => {
    if (p.type === 'SHOW_CHOICE' && choiceFallback) return <details className="choice-content map-choice-fallback" key={`${p.instance_id}/${p.node_id}`}>
      <summary>{t('ui.strategy.text_fallback')}</summary>
      <h2>{t(p.text_id)}</h2>
      <ChoiceButtons p={p} t={t} send={send} assetUri={assetUri} eventId={eventId} onChoicePreview={onChoicePreview} />
    </details>;
    if (p.type === 'SHOW_CHOICE') return <div className="choice-content" key={`${p.instance_id}/${p.node_id}`}>
      <span className="eyebrow">{t('ui.choice')}</span>
      <h2>{t(p.text_id)}</h2>
      <ChoiceButtons p={p} t={t} send={send} assetUri={assetUri} eventId={eventId} onChoicePreview={onChoicePreview} />
    </div>;
    if (p.type === 'SHOW_DIALOGUE' || p.type === 'SHOW_RESULT') return <div className={`dialogue-content ${textStyle(p.text_id) ?? ''}`} key={`${p.instance_id}/${p.node_id}`}>
      <span className="eyebrow">{t(textStyle(p.text_id) === 'note' ? 'ui.record' : p.type === 'SHOW_DIALOGUE' ? 'ui.dialogue' : 'ui.narration')}</span>
      <p className="dialogue-text">{t(p.text_id)}</p>
      <button className="continue-button" type="button" onClick={e => { if (e.detail < 2) send({ type: 'advance_event', instance_id: p.instance_id, node_id: p.node_id }); }}>
        {t('ui.continue')}<span aria-hidden="true">→</span>
      </button>
    </div>;
    return <div className="cue-placeholder" key={`cue.${index}`} role="status">
      <span>{t('ui.cue_placeholder')}</span>
      {'asset_id' in p && p.type !== 'AUDIO_CUE' ? <VisualImage uri={assetUri(p.asset_id)} alt="" /> : null}
    </div>;
  })}</>;
}

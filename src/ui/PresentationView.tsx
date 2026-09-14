import type { EngineCommand } from '../engine';
import type { PresentationCommand } from '../domain';
import type { Translate } from '../localization/translator';
import { textStyle, VisualImage } from './VisualSlot';

export function PresentationView({ commands, t, send, assetUri, choiceFallback = false }: {
  commands: readonly PresentationCommand[]; t: Translate; send: (command: EngineCommand) => void;
  assetUri: (id: string) => string | undefined;
  choiceFallback?: boolean;
}) {
  return <>{commands.map((p, index) => {
    if (p.type === 'SHOW_CHOICE') return <div className={`choice-content${choiceFallback ? ' map-choice-fallback' : ''}`} key={`${p.instance_id}/${p.node_id}`}>
      <span className="eyebrow">{choiceFallback ? t('ui.strategy.text_fallback') : t('ui.choice')}</span>
      <h2>{t(p.text_id)}</h2>
      <div className="choice-panel">{p.choices.map((c, i) => <button key={c.choice_id} type="button" disabled={!c.enabled}
        onClick={e => { if (e.detail < 2) send({ type: 'choose_event', instance_id: p.instance_id, node_id: p.node_id, choice_id: c.choice_id }); }}>
        <span className="choice-number" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
        <span>{t(c.text_id)}</span><span className="choice-arrow" aria-hidden="true">↗</span>
      </button>)}</div>
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

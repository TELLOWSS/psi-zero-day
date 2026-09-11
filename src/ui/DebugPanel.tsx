import type { GameState } from '../domain';
import type { Translate } from '../localization/translator';

export default function DebugPanel({ state, t, close }: { state: GameState | null; t: Translate; close: () => void }) {
  const fields = [
    ['ui.debug_event', state?.event_runtime.active_instance && { event: state.event_runtime.active_instance.event_id, node: state.event_runtime.active_instance.current_node_id }],
    ['ui.debug_flags', state?.flags], ['ui.debug_relations', state?.relations], ['ui.debug_construction', state?.construction],
    ['ui.debug_choices', state?.event_runtime.choice_history], ['ui.debug_completions', state?.event_runtime.completion_history],
  ] as const;
  return <aside className="debug-panel" aria-label={t('ui.debug')}>
    <button type="button" onClick={close}>{t('ui.debug_close')}</button>
    {fields.map(([key, value]) => <section key={key}><h3>{t(key)}</h3><pre>{JSON.stringify(value ?? null, null, 2)}</pre></section>)}
  </aside>;
}

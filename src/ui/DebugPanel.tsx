import type { GameState } from '../domain';
import type { Translate } from '../localization/translator';
import type { DialogueView } from '../engine/dialogue';

export default function DebugPanel({ state, dialogue, t, close }: { state: GameState | null; dialogue: DialogueView | null; t: Translate; close: () => void }) {
  const fields = [
    ['ui.debug_event', state?.event_runtime.active_instance && { event: state.event_runtime.active_instance.event_id, node: state.event_runtime.active_instance.current_node_id }],
    ['ui.debug_flags', state?.flags], ['ui.debug_relations', state?.relations], ['ui.debug_construction', state?.construction],
    ['ui.debug_choices', state?.event_runtime.choice_history], ['ui.debug_completions', state?.event_runtime.completion_history],
    ['ui.debug_relationship_history', state?.relations.filter(r => r.to_id === state.player.character_id).map(r => ({ npc: r.from_id, deltas: r.delta_history ?? [] }))],
    ['ui.debug_dialogue', dialogue], ['ui.debug_session', state && { run: state.run, clock: state.clock, chapter: state.event_runtime.chapter_id }],
  ] as const;
  return <aside className="debug-panel" aria-label={t('ui.debug')}>
    <button type="button" onClick={close}>{t('ui.debug_close')}</button>
    {fields.map(([key, value]) => <section key={key}><h3>{t(key)}</h3><pre>{JSON.stringify(value ?? null, null, 2)}</pre></section>)}
  </aside>;
}

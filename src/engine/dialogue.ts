import type { Condition, EffectBundle, GameState, ValidatedContent } from '../domain';
import { eventPresentation } from './event-runtime';
import { copyData, freezeData } from './data';

export interface DialogueView {
  readonly event_id: string;
  readonly instance_id: string;
  readonly node_id: string;
  readonly text_id: string;
  readonly speaker_id?: string;
  readonly visual_reference?: { readonly kind: 'asset' | 'character'; readonly id: string };
  readonly next_node_id?: string;
  readonly event_conditions: readonly Condition[];
  readonly failure_conditions: readonly Condition[];
  readonly responses: readonly {
    readonly choice_id: string;
    readonly text_id: string;
    readonly enabled: boolean;
    readonly conditions: readonly Condition[];
    readonly consequences: EffectBundle;
    readonly next_node_id?: string;
  }[];
}

/** Read-only dialogue projection. Execution stays in the existing Event Runtime commands. */
export function getDialogueView(state: GameState, content: ValidatedContent): DialogueView | null {
  const instance = state.event_runtime.active_instance;
  if (!instance) return null;
  const event = content.events.find(e => e.event_id === instance.event_id);
  const node = event?.dialogue.find(n => n.node_id === instance.current_node_id);
  if (!event || !node) throw new Error('Unknown dialogue event/node reference');
  const presentation = eventPresentation(state, content).find(p => 'node_id' in p);
  if (!presentation || !('text_id' in presentation)) return null;
  const speaker = node.speaker_role_id ? instance.participant_bindings[node.speaker_role_id] : undefined;
  const character = speaker ? content.characters.find(c => c.id === speaker) : undefined;
  if (node.speaker_role_id && !character) throw new Error('Unknown dialogue speaker reference');
  const portrait = character?.asset_bindings.portrait;
  return freezeData(copyData({
    event_id: event.event_id, instance_id: instance.instance_id, node_id: node.node_id, text_id: node.text_id,
    ...(speaker ? { speaker_id: speaker, visual_reference: { kind: portrait ? 'asset' as const : 'character' as const, id: portrait ?? speaker } } : {}),
    ...(node.next_node_id ? { next_node_id: node.next_node_id } : {}),
    event_conditions: event.conditions, failure_conditions: event.failure_conditions,
    responses: presentation.type === 'SHOW_CHOICE' ? presentation.choices.map(p => {
      const definition = event.choices.find(c => c.choice_id === p.choice_id)!;
      return { ...p, conditions: definition.requirements, consequences: definition.effects,
        ...(definition.next_node_id ? { next_node_id: definition.next_node_id } : {}) };
    }) : [],
  }));
}

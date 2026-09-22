import contract from '../../content/episode01/field-visual-lock-v1.json';

export interface Episode01FieldVisualLockEvidence {
  readonly key: string;
  readonly label_text_id: string;
}

export interface Episode01FieldVisualLockPlan {
  readonly lock_id: string;
  readonly status: string;
  readonly evidence: readonly Episode01FieldVisualLockEvidence[];
}

/**
 * Phase D D-2 FIELD reference lock.
 *
 * Presentation-only. This lock visualizes the small ramp signal inside the
 * existing work scene and does not change event topology, choices or effects.
 */
export function episode01FieldVisualLock(
  eventId: string | null | undefined,
  nodeId: string | null | undefined,
): Episode01FieldVisualLockPlan | undefined {
  if (eventId !== contract.reference_event_id || nodeId !== contract.reference_node_id) return undefined;
  return Object.freeze({
    lock_id: contract.lock_id,
    status: contract.status,
    evidence: Object.freeze(contract.evidence.map(item => Object.freeze({ ...item }))),
  });
}

import contract from '../../content/episode01/tbm-visual-lock-v1.json';

export interface Episode01TbmVisualLockEvidence {
  readonly key: string;
  readonly label_text_id: string;
}

export interface Episode01TbmVisualLockPlan {
  readonly lock_id: string;
  readonly status: string;
  readonly evidence: readonly Episode01TbmVisualLockEvidence[];
}

/**
 * Phase D D-2 TBM reference lock.
 *
 * Presentation-only. The lock is intentionally scoped to the authored judgment
 * moment so FIELD can inherit the same world-first grammar without changing
 * event topology, choices or engine state.
 */
export function episode01TbmVisualLock(
  eventId: string | null | undefined,
  nodeId: string | null | undefined,
): Episode01TbmVisualLockPlan | undefined {
  if (eventId !== contract.reference_event_id || nodeId !== contract.reference_node_id) return undefined;
  return Object.freeze({
    lock_id: contract.lock_id,
    status: contract.status,
    evidence: Object.freeze(contract.evidence.map(item => Object.freeze({ ...item }))),
  });
}

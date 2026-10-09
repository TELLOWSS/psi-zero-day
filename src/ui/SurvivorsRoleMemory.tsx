import type { OperationHandoff } from '../domain/survivors-operation-handoff';
import { roleHandoffSignal } from '../domain/survivors-role-memory';
import copy from '../../content/localization/survivors-operation-brief-ko.json';
import './survivors-role-memory.css';

export function SurvivorsRoleMemory({handoff}: {handoff: OperationHandoff}) {
  const signal = roleHandoffSignal(handoff);
  const role = copy.roles[signal.roleId];
  return <section className="survivors-role-memory" aria-label={copy.memory_title}>
    <strong>{copy.memory_title}</strong>
    <small>{handoff.outcome === 'victory' ? copy.won : copy.lost}</small>
    <p><b>{role.metric}: {signal.count}</b> · {signal.recorded ? role.observed : role.notRecorded}</p>
    <p><b>{copy.memory_next}</b> {role.next}</p>
    <small>{copy.memory_note}</small>
  </section>;
}

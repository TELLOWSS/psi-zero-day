import type { Id, TextId } from '../domain/common';

export type StrategySignalKind = 'access' | 'ramp' | 'overlap' | 'vehicle';
export type StrategySignalAnchor = 'entry' | 'ramp' | 'yard' | 'gate';

export interface StrategySignal {
  readonly signal_id: Id;
  readonly kind: StrategySignalKind;
  readonly anchor: StrategySignalAnchor;
  readonly label_text_id: TextId;
}

const SIGNALS_BY_EVENT: Readonly<Record<Id, readonly StrategySignal[]>> = {
  e01_03_plan_breaks: [{ signal_id: 'signal.entry_congestion', kind: 'access', anchor: 'entry', label_text_id: 'ui.signal.entry_congestion' }],
  e01_04_junho_signal: [{ signal_id: 'signal.ramp_movement', kind: 'ramp', anchor: 'ramp', label_text_id: 'ui.signal.ramp_movement' }],
  e01_05_command: [{ signal_id: 'signal.work_vehicle_overlap', kind: 'overlap', anchor: 'yard', label_text_id: 'ui.signal.work_vehicle_overlap' }],
  e01_06_pump_arrival: [{ signal_id: 'signal.pump_entry', kind: 'vehicle', anchor: 'gate', label_text_id: 'ui.signal.pump_entry' }],
};

export function projectEpisode01Signals(activeEventId: Id | null): readonly StrategySignal[] {
  return activeEventId ? (SIGNALS_BY_EVENT[activeEventId] ?? []) : [];
}

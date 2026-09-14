import { describe, expect, it } from 'vitest';
import { projectEpisode01Signals } from '../src/app/strategy-signals';

describe('Episode 01 strategy signals', () => {
  it.each([
    ['e01_03_plan_breaks', 'signal.entry_congestion', 'entry'],
    ['e01_04_junho_signal', 'signal.ramp_movement', 'ramp'],
    ['e01_05_command', 'signal.work_vehicle_overlap', 'yard'],
    ['e01_06_pump_arrival', 'signal.pump_entry', 'gate'],
    ['e01_08b_inspection_find', 'signal.inspection_access', 'entry'],
    ['e01_08d_reinspection', 'signal.reinspection_access', 'entry'],
  ] as const)('maps %s to approved presentation metadata', (eventId, signalId, anchor) => {
    expect(projectEpisode01Signals(eventId)).toEqual([
      expect.objectContaining({ signal_id: signalId, anchor }),
    ]);
  });

  it('does not invent a signal for unrelated events', () => {
    expect(projectEpisode01Signals('e01_01_arrival')).toEqual([]);
    expect(projectEpisode01Signals(null)).toEqual([]);
  });
});

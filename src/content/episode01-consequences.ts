export function assembleEpisode01Consequences(
  baseEvents: readonly any[],
  consequenceEvents: readonly any[],
  inspectionEvents: readonly any[],
  responsibilityEvents: readonly any[],
) {
  const eveningGate = { kind: 'event_completed', event_id: 'e01_08f_report_return', minimum_count: 1 };
  return baseEvents.flatMap(event => {
    const next = event.event_id === 'e01_09_evening'
      ? { ...event, conditions: [...event.conditions, eveningGate] }
      : event;
    return event.event_id === 'e01_08_reactions'
      ? [next, ...consequenceEvents, ...inspectionEvents, ...responsibilityEvents]
      : [next];
  });
}

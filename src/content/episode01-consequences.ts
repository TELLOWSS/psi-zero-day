export function assembleEpisode01Consequences(
  baseEvents: readonly any[],
  consequenceEvents: readonly any[],
  inspectionEvents: readonly any[],
  responsibilityEvents: readonly any[],
  tbmGapEvents: readonly any[],
  restartEvents: readonly any[],
  stopworkEvents: readonly any[],
  instructionEvents: readonly any[],
  recordEvents: readonly any[],
) {
  return baseEvents.flatMap(event => event.event_id === 'e01_08_reactions'
    ? [event, ...consequenceEvents, ...inspectionEvents, ...responsibilityEvents, ...tbmGapEvents,
      ...restartEvents, ...stopworkEvents, ...instructionEvents, ...recordEvents]
    : [event]);
}

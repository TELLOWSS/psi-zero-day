/** Two explicitly provisional daylight plates. Do not claim final art approval.
 * The original eight production environment slots and Episode01 save contracts remain unchanged.
 */
export const EP01_MORNING_POUR_PLATES = Object.freeze({
  e01_06_pump_arrival: Object.freeze({
    id: 'pump-arrival-0924-preview',
    uri: 'assets/episode01/cg/pump-arrival-morning-preview.svg',
    time: '09:24',
    camera: 'site-approach-wide',
    approval: 'DIRECTOR_PREVIEW_ONLY',
  }),
  e01_07_first_pour: Object.freeze({
    id: 'first-pour-0945-preview',
    uri: 'assets/episode01/cg/first-pour-morning-preview.svg',
    time: '09:45',
    camera: 'slab-level-workface',
    approval: 'DIRECTOR_PREVIEW_ONLY',
  }),
});
export function episode01MorningPourPlate(eventId: string | null | undefined) {
  if (!eventId) return undefined;
  return EP01_MORNING_POUR_PLATES[eventId as keyof typeof EP01_MORNING_POUR_PLATES];
}

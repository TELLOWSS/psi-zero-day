export const PINBALL_PHASE1_ROOT='/assets/survivors/pinball/audio-phase1-v1/';
export const PINBALL_PHASE1_ASSETS={
 metal1:'hit_metal_light_01.mp3',metal2:'hit_metal_light_02.mp3',rubber1:'hit_rubber_light_03.mp3',rubber2:'hit_rubber_heavy_02.mp3',
 left:'paddle_left_01.mp3',right:'paddle_right_03.mp3',perfect1:'perfect_contact_01.mp3',perfect2:'perfect_contact_02.mp3',shot:'perfect_shot_01.mp3',
 motorStart:'harbor_crane_motor_start.mp3',motorMove:'harbor_crane_motor_loop.mp3',lock:'harbor_cargo_lock.mp3',entry:'harbor_multiball_entry_02.mp3',
} as const;
export type PinballPhase1Sample=keyof typeof PINBALL_PHASE1_ASSETS;

import { cinematicLook } from './survivors-cinematic-vfx';
import type { ProjectileKind } from '../domain/patrol-survivors';
import type { ProjectileFeedback } from '../domain/survivors-projectile-feedback';

// Layered equipment signatures: pressure/body, transient and material tail.
const signatures: Record<ProjectileKind, readonly [number, number, number, number]> = {
  radio: [920, .11, .30, .12], satellite_wave: [620, .18, .22, .18],
  extinguisher: [160, .22, .92, .08], cryo_blast: [300, .25, .72, .22],
  drone_laser: [1050, .12, .08, .16], hunter_beam: [710, .16, .12, .22],
  tesla_bolt: [210, .20, .48, .28], emf_beam: [125, .26, .14, .25],
  shout_shockwave: [85, .28, .40, .08], cone_trap: [180, .17, .50, .14],
  grout_slug: [140, .18, .60, .10], hydraulic_wave: [110, .32, .50, .18],
  emp_pulse: [190, .26, .35, .25], plasma_arc: [280, .28, .40, .30],
};
/** Deterministic baked PCM: no per-frame oscillators or additional voice layers. */
export function equipmentSoundSamples(kind: ProjectileKind, phase: ProjectileFeedback['phase'], worker: boolean, sampleRate: number, equipped:readonly string[]=[], actorKind?:ProjectileFeedback['actorKind']): Float32Array {
  const [base, tail, texture, resonance] = signatures[kind];
  const look=cinematicLook(kind,5,equipped);
  const premium=look.premium&&!worker;
  const pitch=premium?(look.palette==='gold'?.82:look.palette==='violet'?1.18:1.07):1;
  const duration = worker ? .12 : phase === 'release' ? tail * .65 : phase === 'impact' ? tail : tail * .8;
  const data = new Float32Array(Math.ceil(sampleRate * duration));
  let random = 0x13579bdf, low = 0, carrier = 0;
  for (let i=0;i<data.length;i++) {
    const t=i/sampleRate, u=t/duration;
    random ^= random << 13; random ^= random >>> 17; random ^= random << 5;
    const noise=(random>>>0)/2147483648-1;
    low += .16*(noise-low);
    const attack=Math.min(1,t/.004), end=Math.min(1,(duration-t)/.012);
    const envelope=attack*end*Math.exp(-u*(phase==='release'?5:3.8));
    const frequency=worker?510:base*pitch*(1-(phase==='impact'?.50:.25)*u);
    carrier+=2*Math.PI*frequency/sampleRate;
    const body=Math.sin(carrier)*(worker?.55:.38);
    const grain=worker?0:(noise-low)*texture*(.42*Math.exp(-t/ .028)+.16);
    const ring=worker?0:Math.sin(carrier*2.73)*resonance*Math.exp(-u*6);
    const pressure=worker?0:Math.sin(2*Math.PI*(phase==='impact'?82:120)*t)*(look.evolved?.26:.18)*Math.exp(-t/(look.evolved?.05:.035));
    const harmonic=premium?Math.sin(carrier*1.5)*.10*Math.exp(-u*4):0;
    const transient=look.evolved&&!worker&&phase!=='release'?(noise-low)*.14*Math.exp(-t/.012):0;
    const pulse=worker?1:kind==='radio'||kind==='drone_laser'?Math.max(0,Math.sin(2*Math.PI*32*t)):kind==='hunter_beam'?Math.max(0,Math.sin(2*Math.PI*48*t)):1;
    const material=worker||phase!=='impact'?0:actorKind==='FALLING_DEBRIS'?(noise-low)*.22*Math.exp(-t/.045):actorKind==='GAS_LEAK'?noise*.18*Math.exp(-t/.08):actorKind==='RUNAWAY_CART'||actorKind==='CRANE_BOSS'?Math.sin(carrier*4.17)*.17*Math.exp(-t/.06):0;
    const identity=worker?0:kind==='extinguisher'||kind==='cryo_blast'?(noise-low)*.20:kind==='tesla_bolt'?noise*.22*Math.pow(Math.max(0,Math.sin(t*970)),8):kind==='cone_trap'?Math.sin(t*2*Math.PI*1350)*.16*Math.exp(-t/.015):kind==='emf_beam'||kind==='satellite_wave'?Math.sin(t*2*Math.PI*65)*.19:0;
    data[i]=Math.max(-.98,Math.min(.98,(body*pulse+grain+ring+pressure+harmonic+transient+identity+material)*envelope*.65));
  }
  return data;
}

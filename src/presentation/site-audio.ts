export type SiteAudioCue = 'hover' | 'continue' | 'confirm' | 'relationship';

/** Small, original synthesized sound study. No game state, event rules, or game RNG. */
export class SiteAudio {
  #context: AudioContext | null = null;
  #master: GainNode | null = null;
  #music: GainNode | null = null;
  #ambience: GainNode | null = null;
  #enabled = false;
  #hidden = false;
  #title = true;
  #disposed = false;
  #lastHover = -1;

  constructor(private readonly createContext: () => AudioContext = () => new AudioContext()) {}

  async enable(): Promise<void> {
    if (this.#disposed) return;
    if (!this.#context) {
      this.#context = this.createContext();
      this.#build(this.#context);
    }
    // Called directly from the audio button gesture; never from initial mount.
    await this.#context.resume();
    if (this.#disposed) return;
    this.#enabled = true;
    this.#levels();
  }
  mute(): void { this.#enabled = false; this.#levels(); }
  setHidden(hidden: boolean): void { this.#hidden = hidden; this.#levels(); }
  setTitle(title: boolean): void { this.#title = title; this.#levels(); }
  #levels(): void {
    const c = this.#context; if (!c || c.state === 'closed') return;
    this.#master!.gain.setTargetAtTime(this.#enabled && !this.#hidden ? .16 : 0, c.currentTime, .08);
    this.#music!.gain.setTargetAtTime(this.#title ? .12 : 0, c.currentTime, .7);
    this.#ambience!.gain.setTargetAtTime(this.#title ? .14 : .25, c.currentTime, .7);
  }
  #build(c: AudioContext): void {
    const master = this.#master = c.createGain(); master.gain.value = 0; master.connect(c.destination);
    const ambience = this.#ambience = c.createGain(); ambience.gain.value = 0; ambience.connect(master);
    const music = this.#music = c.createGain(); music.gain.value = 0; music.connect(master);
    // A fixed, seamless air/mechanical wash, filtered to avoid harsh high frequencies.
    const buffer = c.createBuffer(1, c.sampleRate * 4, c.sampleRate);
    const samples = buffer.getChannelData(0); let noise = 7143;
    for (let i = 0; i < samples.length; i++) { noise = (Math.imul(noise, 1664525) + 1013904223) >>> 0; samples[i] = (noise / 4294967296 * 2 - 1) * .6; }
    const air = c.createBufferSource(); air.buffer = buffer; air.loop = true;
    const filter = c.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 650; filter.Q.value = .4;
    air.connect(filter); filter.connect(ambience); air.start();
    const machine = c.createOscillator(); machine.frequency.value = 72;
    const hum = c.createGain(); hum.gain.value = .045; machine.connect(hum); hum.connect(ambience); machine.start();
    // Restrained title drone, faded out once actual play begins (not a final music track).
    for (const frequency of [98, 146.83, 196.3]) {
      const note = c.createOscillator(); note.frequency.value = frequency; note.connect(music); note.start();
    }
  }
  cue(kind: SiteAudioCue): void {
    const c = this.#context;
    if (!this.#enabled || this.#hidden || !c || c.state !== 'running') return;
    if (kind === 'hover' && c.currentTime - this.#lastHover < .12) return;
    if (kind === 'hover') this.#lastHover = c.currentTime;
    const [frequency, duration, volume] = {
      hover: [260, .035, .04], continue: [180, .07, .07],
      confirm: [390, .13, .1], relationship: [520, .22, .06],
    }[kind];
    const tone = c.createOscillator(); const envelope = c.createGain();
    tone.frequency.value = frequency!;
    envelope.gain.setValueAtTime(0, c.currentTime);
    envelope.gain.linearRampToValueAtTime(volume!, c.currentTime + .008);
    envelope.gain.exponentialRampToValueAtTime(.0001, c.currentTime + duration!);
    tone.connect(envelope); envelope.connect(this.#master!);
    tone.onended = () => { tone.disconnect(); envelope.disconnect(); };
    tone.start(); tone.stop(c.currentTime + duration! + .01);
  }
  dispose(): void {
    this.#disposed = true; this.#enabled = false;
    if (this.#context && this.#context.state !== 'closed') void this.#context.close().catch(() => {});
  }
}

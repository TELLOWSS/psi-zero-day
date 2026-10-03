// Development synth lifecycle only; this is not final orchestral audio.
export class SurvivorsSessionAudio {
  private context: AudioContext | null = null;
  private voices = new Map<AudioScheduledSourceNode, AudioNode>();
  get voiceCount() { return this.voices.size; }
  getContext(): AudioContext | null {
    if (!this.context) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.context = new Ctor();
    }
    if (this.context.state === 'suspended') void this.context.resume().catch(() => {});
    return this.context;
  }
  track(source: AudioScheduledSourceNode, gain: AudioNode) {
    if (this.voices.size >= 24) {
      const oldest = this.voices.keys().next().value;
      if (oldest) this.release(oldest, true);
    }
    this.voices.set(source, gain);
    source.onended = () => this.release(source, false);
  }
  private release(source: AudioScheduledSourceNode, stop: boolean) {
    const gain = this.voices.get(source);
    if (!gain) return;
    this.voices.delete(source);
    source.onended = null;
    if (stop) { try { source.stop(); } catch { /* already ended */ } }
    source.disconnect(); gain.disconnect();
  }
  silence() { for (const source of this.voices.keys()) this.release(source, true); }
  dispose() {
    this.silence();
    const context = this.context; this.context = null;
    if (context) void context.close().catch(() => {});
  }
}

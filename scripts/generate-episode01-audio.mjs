import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const plan = JSON.parse(await readFile(path.join(root, 'content/episode01/audio.json'), 'utf8'));
const checkOnly = process.argv.includes('--check');
const sampleRate = plan.sample_rate ?? 22050;

function bufferFor(seconds) {
  return new Float64Array(Math.max(1, Math.round(seconds * sampleRate)));
}

function clamp(value, min = -0.98, max = 0.98) {
  return Math.max(min, Math.min(max, value));
}

function wave(kind, phase) {
  if (kind === 'triangle') return 2 * Math.asin(Math.sin(phase)) / Math.PI;
  if (kind === 'square') return Math.sin(phase) >= 0 ? 1 : -1;
  return Math.sin(phase);
}

function envelope(local, duration, attack, release) {
  if (local < 0 || local >= duration) return 0;
  const attackGain = attack > 0 ? Math.min(1, local / attack) : 1;
  const releaseGain = release > 0 ? Math.min(1, (duration - local) / release) : 1;
  const edge = Math.max(0, Math.min(attackGain, releaseGain));
  return edge * edge * (3 - 2 * edge);
}

function addTone(samples, { start = 0, duration, frequency, amplitude, kind = 'sine', attack = 0.01, release = 0.08 }) {
  const startIndex = Math.max(0, Math.floor(start * sampleRate));
  const endIndex = Math.min(samples.length, Math.ceil((start + duration) * sampleRate));
  for (let i = startIndex; i < endIndex; i++) {
    const local = i / sampleRate - start;
    const env = envelope(local, duration, attack, release);
    const phase = 2 * Math.PI * frequency * local;
    samples[i] += wave(kind, phase) * amplitude * env;
  }
}

function addSweep(samples, { start = 0, duration, startHz, endHz, amplitude, attack = 0.005, release = 0.08 }) {
  const startIndex = Math.max(0, Math.floor(start * sampleRate));
  const endIndex = Math.min(samples.length, Math.ceil((start + duration) * sampleRate));
  let phase = 0;
  for (let i = startIndex; i < endIndex; i++) {
    const local = i / sampleRate - start;
    const ratio = Math.max(0, Math.min(1, local / duration));
    const hz = startHz * Math.pow(endHz / startHz, ratio);
    phase += 2 * Math.PI * hz / sampleRate;
    samples[i] += Math.sin(phase) * amplitude * envelope(local, duration, attack, release);
  }
}

function addNoiseBurst(samples, { start, duration, amplitude, seed }) {
  let state = seed >>> 0;
  let filtered = 0;
  const startIndex = Math.max(0, Math.floor(start * sampleRate));
  const endIndex = Math.min(samples.length, Math.ceil((start + duration) * sampleRate));
  for (let i = startIndex; i < endIndex; i++) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const noise = (state / 0xffffffff) * 2 - 1;
    filtered = filtered * 0.72 + noise * 0.28;
    const local = i / sampleRate - start;
    samples[i] += filtered * amplitude * envelope(local, duration, 0.002, Math.min(0.08, duration * 0.6));
  }
}

function foundationBgm() {
  const samples = bufferFor(20);
  const roots = [146.83, 116.54, 174.61, 130.81, 146.83, 116.54, 174.61, 130.81];
  const qualities = ['minor', 'major', 'major', 'major', 'minor', 'major', 'major', 'major'];
  const motif = [293.66, 349.23, 440.0, 349.23, 293.66, 392.0, 349.23, 261.63];

  for (let bar = 0; bar < 8; bar++) {
    const start = bar * 2.5;
    const root = roots[bar];
    const third = root * (qualities[bar] === 'minor' ? Math.pow(2, 3 / 12) : Math.pow(2, 4 / 12));
    const fifth = root * Math.pow(2, 7 / 12);
    for (const [frequency, amplitude] of [[root, 0.024], [third, 0.018], [fifth, 0.017]]) {
      addTone(samples, { start, duration: 2.42, frequency, amplitude, attack: 0.34, release: 0.5 });
      addTone(samples, { start, duration: 2.42, frequency: frequency * 2, amplitude: amplitude * 0.22, kind: 'triangle', attack: 0.3, release: 0.5 });
    }

    for (let step = 0; step < 4; step++) {
      const note = motif[(bar + step) % motif.length];
      addTone(samples, { start: start + 0.18 + step * 0.625, duration: 0.28, frequency: note, amplitude: 0.035, kind: 'triangle', attack: 0.012, release: 0.2 });
      addTone(samples, { start: start + 0.18 + step * 0.625, duration: 0.22, frequency: note * 2, amplitude: 0.009, attack: 0.008, release: 0.17 });
    }
  }

  for (let beat = 0; beat < 16; beat++) {
    const at = beat * 1.25;
    addSweep(samples, { start: at, duration: 0.18, startHz: 84, endHz: 54, amplitude: 0.032, release: 0.15 });
    if (beat % 2 === 1) addNoiseBurst(samples, { start: at + 0.62, duration: 0.055, amplitude: 0.013, seed: 4100 + beat });
  }
  return samples;
}

function siteAmbience() {
  const samples = bufferFor(12);
  let state = 0x51f15e;
  let low = 0;
  let lower = 0;
  for (let i = 0; i < samples.length; i++) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const noise = (state / 0xffffffff) * 2 - 1;
    low = low * 0.982 + noise * 0.018;
    lower = lower * 0.997 + low * 0.003;
    const t = i / sampleRate;
    const hum = Math.sin(2 * Math.PI * 55 * t) * 0.008 + Math.sin(2 * Math.PI * 110 * t) * 0.003;
    samples[i] += lower * 0.11 + low * 0.018 + hum;
  }

  for (const at of [1.6, 4.3, 7.1, 10.0]) {
    addSweep(samples, { start: at, duration: 0.32, startHz: 132, endHz: 88, amplitude: 0.018, attack: 0.03, release: 0.18 });
    addNoiseBurst(samples, { start: at + 0.04, duration: 0.13, amplitude: 0.013, seed: Math.round(at * 1000) });
  }
  for (const at of [5.15, 5.58, 9.15, 9.58]) {
    addTone(samples, { start: at, duration: 0.085, frequency: 880, amplitude: 0.012, attack: 0.008, release: 0.035 });
  }

  const fade = Math.round(sampleRate * 0.45);
  for (let i = 0; i < fade; i++) {
    const w = i / Math.max(1, fade - 1);
    const endIndex = samples.length - fade + i;
    samples[endIndex] = samples[endIndex] * (1 - w) + samples[i] * w;
  }
  return samples;
}

function uiExecute() {
  const samples = bufferFor(0.2);
  addSweep(samples, { start: 0.005, duration: 0.085, startHz: 470, endHz: 650, amplitude: 0.11, release: 0.055 });
  addTone(samples, { start: 0.065, duration: 0.1, frequency: 820, amplitude: 0.055, kind: 'triangle', release: 0.08 });
  return samples;
}

function resultPositive() {
  const samples = bufferFor(0.48);
  for (const [at, hz] of [[0.01, 523.25], [0.12, 659.25], [0.24, 783.99]]) {
    addTone(samples, { start: at, duration: 0.2, frequency: hz, amplitude: 0.072, kind: 'triangle', attack: 0.008, release: 0.15 });
    addTone(samples, { start: at, duration: 0.16, frequency: hz * 2, amplitude: 0.018, release: 0.12 });
  }
  return samples;
}

function resultNegative() {
  const samples = bufferFor(0.46);
  addSweep(samples, { start: 0.01, duration: 0.31, startHz: 340, endHz: 185, amplitude: 0.085, attack: 0.01, release: 0.2 });
  addTone(samples, { start: 0.08, duration: 0.3, frequency: 98, amplitude: 0.045, attack: 0.025, release: 0.22 });
  addNoiseBurst(samples, { start: 0.025, duration: 0.065, amplitude: 0.025, seed: 9017 });
  return samples;
}

function resultNeutral() {
  const samples = bufferFor(0.34);
  addTone(samples, { start: 0.015, duration: 0.25, frequency: 440, amplitude: 0.06, kind: 'triangle', attack: 0.012, release: 0.19 });
  addTone(samples, { start: 0.075, duration: 0.2, frequency: 392, amplitude: 0.035, attack: 0.01, release: 0.15 });
  return samples;
}

function uiContinue() {
  const samples = bufferFor(0.15);
  addNoiseBurst(samples, { start: 0.004, duration: 0.035, amplitude: 0.025, seed: 3211 });
  addSweep(samples, { start: 0.01, duration: 0.09, startHz: 620, endHz: 760, amplitude: 0.07, release: 0.065 });
  return samples;
}

const factories = {
  foundation_bgm: foundationBgm,
  site_ambience: siteAmbience,
  ui_execute: uiExecute,
  result_positive: resultPositive,
  result_negative: resultNegative,
  result_neutral: resultNeutral,
  ui_continue: uiContinue,
};

function wavBuffer(samples) {
  const dataBytes = samples.length * 2;
  const out = Buffer.alloc(44 + dataBytes);
  out.write('RIFF', 0, 'ascii');
  out.writeUInt32LE(36 + dataBytes, 4);
  out.write('WAVE', 8, 'ascii');
  out.write('fmt ', 12, 'ascii');
  out.writeUInt32LE(16, 16);
  out.writeUInt16LE(1, 20);
  out.writeUInt16LE(1, 22);
  out.writeUInt32LE(sampleRate, 24);
  out.writeUInt32LE(sampleRate * 2, 28);
  out.writeUInt16LE(2, 32);
  out.writeUInt16LE(16, 34);
  out.write('data', 36, 'ascii');
  out.writeUInt32LE(dataBytes, 40);
  for (let i = 0; i < samples.length; i++) out.writeInt16LE(Math.round(clamp(samples[i]) * 32767), 44 + i * 2);
  return out;
}

let failures = 0;
for (const asset of plan.assets ?? []) {
  const factory = factories[asset.generator];
  if (!factory) throw new Error(`Unknown Episode 01 audio generator: ${asset.generator}`);
  const generated = wavBuffer(factory());
  const destination = path.join(root, 'public', asset.uri);
  if (checkOnly) {
    try {
      const current = await readFile(destination);
      if (!current.equals(generated)) {
        console.error(`Episode 01 audio is out of date: ${asset.uri}`);
        failures++;
      }
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
      console.error(`Episode 01 audio is missing: ${asset.uri}`);
      failures++;
    }
  } else {
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, generated);
    console.log(`Wrote ${asset.uri} (${generated.length} bytes).`);
  }
}

if (checkOnly) {
  if (failures) process.exitCode = 1;
  else console.log(`Episode 01 audio is current (${plan.assets.length} deterministic WAV assets).`);
}

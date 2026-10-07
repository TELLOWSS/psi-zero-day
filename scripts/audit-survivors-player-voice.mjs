import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = 'public/assets/survivors/voice-player-v1';
const rows = fs.readdirSync(root).filter(name => name.endsWith('.wav')).sort().map(file => {
  const bytes = fs.readFileSync(path.join(root, file));
  if (bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WAVE') throw Error(file);
  let format, data;
  for (let offset = 12; offset + 8 <= bytes.length;) {
    const id = bytes.toString('ascii', offset, offset + 4), size = bytes.readUInt32LE(offset + 4);
    if (id === 'fmt ') format = bytes.subarray(offset + 8, offset + 8 + size);
    if (id === 'data') data = bytes.subarray(offset + 8, offset + 8 + size);
    offset += 8 + size + size % 2;
  }
  const codec = format.readUInt16LE(0), channels = format.readUInt16LE(2), sampleRate = format.readUInt32LE(4), bits = format.readUInt16LE(14);
  if (codec !== 1 || ![16, 24].includes(bits) || channels !== 1 || !data?.length) throw Error(`Unsupported WAV: ${file}`);
  const stride = bits / 8, count = data.length / stride, scale = 2 ** (bits - 1);
  let peak = 0, sum = 0, clipped = 0, first = count, last = 0;
  for (let i = 0; i < count; i++) {
    const value = data.readIntLE(i * stride, stride) / scale, amplitude = Math.abs(value);
    peak = Math.max(peak, amplitude); sum += value * value;
    if (amplitude >= .999) clipped++;
    if (amplitude > .01) { first = Math.min(first, i); last = i; }
  }
  return {file, sha256: crypto.createHash('sha256').update(bytes).digest('hex'), bytes: bytes.length, channels, sampleRate, bits,
    duration: count / sampleRate, peakDbFS: 20 * Math.log10(peak), rmsDbFS: 10 * Math.log10(sum / count), nearFullScaleSamples: clipped,
    leadingBelowMinus40Seconds: first / sampleRate, trailingBelowMinus40Seconds: (count - last - 1) / sampleRate};
});
console.log(JSON.stringify(rows, null, 2));

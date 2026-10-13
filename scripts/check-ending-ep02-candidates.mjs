import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
const endings = require('../public/signal-breaker-dev/src/stage-ending-content.js');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'content/signal-breaker-ending-voice-ep02-candidates.json'), 'utf8'));
assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root, 'public/assets/survivors/voice-ending-ep02-candidates/voice-manifest.json'), 'utf8')), manifest);
assert.equal(manifest.runtimeIntegrated, false);
assert.equal(manifest.finalListeningApproved, false);
assert.equal(manifest.files.length, 10);
const seen = new Set();
let timingPasses = 0;
for (const f of manifest.files) {
  assert.match(f.filename, /^PSI_V_END_CH(06|07|08|09|10)_(LIM|YOON|KANG|PLAYER)_v0[12]\.wav$/);
  assert.equal(f.candidateAssetPath, '/assets/survivors/voice-ending-ep02-candidates/' + f.filename);
  assert.equal(seen.has(f.slot + f.variant), false);
  seen.add(f.slot + f.variant);
  assert.equal(f.runtimeIntegrated, false);
  assert.equal(f.speakerId, null);
  assert.equal(f.lineId, null);
  assert.equal(f.approvalStatus, 'awaiting-listening-approval');
  assert.equal(endings.definition(f.slot), null, 'New authored contract requires a separate runtime mapping review');
  const bytes = fs.readFileSync(path.join(root, 'public', f.candidateAssetPath));
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), f.finalSha256);
  assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
  assert.equal(bytes.toString('ascii', 8, 12), 'WAVE');
  assert.equal(bytes.readUInt32LE(4) + 8, bytes.length);
  let fmt, data;
  for (let offset = 12; offset + 8 <= bytes.length;) {
    const size = bytes.readUInt32LE(offset + 4), end = offset + 8 + size;
    assert.ok(end <= bytes.length);
    const id = bytes.toString('ascii', offset, offset + 4);
    if (id === 'fmt ') fmt = bytes.subarray(offset + 8, end);
    if (id === 'data') data = bytes.subarray(offset + 8, end);
    offset = end + size % 2;
  }
  assert.ok(fmt && fmt.length >= 16 && data);
  assert.equal(fmt.readUInt16LE(0), 1);
  assert.equal(fmt.readUInt16LE(2), 1);
  assert.equal(fmt.readUInt32LE(4), 24000);
  assert.equal(fmt.readUInt32LE(8), 48000);
  assert.equal(fmt.readUInt16LE(12), 2);
  assert.equal(fmt.readUInt16LE(14), 16);
  assert.equal(data.length % 2, 0);
  const duration = data.length / 48000;
  assert.equal(duration, f.decodedDurationSeconds);
  assert.equal(f.timingPass, duration >= f.targetSeconds[0] && duration <= f.targetSeconds[1]);
  assert.equal(f.timingExcessSeconds, Number(Math.max(0, duration - f.targetSeconds[1]).toFixed(3)));
  let clipped = 0;
  for (let i = 0; i < data.length; i += 2) if (Math.abs(data.readInt16LE(i)) >= 32767) clipped++;
  assert.equal(clipped, f.fullScaleSamples);
  assert.equal(clipped, 0);
  assert.ok(Number.isFinite(f.truePeakDbtpMeasured) && f.truePeakDbtpMeasured < 0);
  if (f.timingPass) timingPasses++;
}
for (let i = 6; i <= 10; i++) for (const variant of ['v01', 'v02']) assert.ok(seen.has('CH-' + String(i).padStart(2, '0') + variant));
console.log(`PASS EP02 candidate integrity: 10 exact WAVs, PCM 24 kHz mono 16-bit, no sample clipping; timing ${timingPasses}/10. Runtime mapping and listening remain pending.`);

const prepared = JSON.parse(fs.readFileSync(path.join(root, 'content/signal-breaker-ending-voice-ep02-prepared.json'), 'utf8'));
assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root, 'public/assets/survivors/voice-ending-ep02-prepared/voice-manifest.json'), 'utf8')), prepared);
assert.equal(prepared.runtimeIntegrated, false);
assert.equal(prepared.finalListeningApproved, false);
assert.equal(prepared.files.length, 5);
const preparedSlots = new Set();
for (const f of prepared.files) {
  assert.equal(preparedSlots.has(f.slot), false);
  preparedSlots.add(f.slot);
  const source = manifest.files.find(source => source.filename === f.sourceFilename);
  assert.ok(source);
  for (const key of ['slot', 'speaker', 'variant', 'exactDialogue']) assert.equal(f[key], source[key]);
  assert.equal(f.sourceSha256, source.finalSha256);
  assert.equal(f.sourceDurationSeconds, source.decodedDurationSeconds);
  assert.deepEqual(f.targetSeconds, source.targetSeconds);
  const shortest = manifest.files.filter(source => source.slot === f.slot).sort((a, b) => a.decodedDurationSeconds - b.decodedDurationSeconds || a.variant.localeCompare(b.variant))[0];
  assert.equal(f.sourceFilename, shortest.filename);
  assert.equal(f.candidateAssetPath, '/assets/survivors/voice-ending-ep02-prepared/' + f.filename);
  assert.equal(f.filename, source.filename.replace('.wav', '_timing_ready.wav'));
  const bytes = fs.readFileSync(path.join(root, 'public', f.candidateAssetPath));
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), f.sha256);
  // Prepared assets have a canonical 44-byte PCM header written by the generator.
  assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
  assert.equal(bytes.toString('ascii', 8, 16), 'WAVEfmt ');
  assert.equal(bytes.readUInt32LE(16), 16);
  assert.equal(bytes.readUInt16LE(20), 1);
  assert.equal(bytes.readUInt16LE(22), 1);
  assert.equal(bytes.readUInt32LE(24), 24000);
  assert.equal(bytes.readUInt32LE(28), 48000);
  assert.equal(bytes.readUInt16LE(32), 2);
  assert.equal(bytes.readUInt16LE(34), 16);
  assert.equal(bytes.toString('ascii', 36, 40), 'data');
  assert.equal(bytes.readUInt32LE(4) + 8, bytes.length);
  assert.equal(bytes.readUInt32LE(40) + 44, bytes.length);
  const duration = (bytes.length - 44) / 48000;
  assert.equal(duration, f.decodedDurationSeconds);
  assert.ok(duration >= source.targetSeconds[0] && duration <= source.targetSeconds[1]);
  assert.equal(f.timingPass, true);
  assert.ok(f.tempoFactor >= 1 && f.tempoFactor <= prepared.maximumTempoFactor);
  assert.equal(f.silenceThresholdDbfs, -45);
  const sourceBytes = fs.readFileSync(path.join(root, 'public', source.candidateAssetPath));
  let sourcePcm;
  for (let offset = 12; offset + 8 <= sourceBytes.length;) {
    const size = sourceBytes.readUInt32LE(offset + 4);
    if (sourceBytes.toString('ascii', offset, offset + 4) === 'data') sourcePcm = sourceBytes.subarray(offset + 8, offset + 8 + size);
    offset += 8 + size + size % 2;
  }
  assert.ok(sourcePcm);
  let removed = 0, previousEnd = 0;
  for (const range of f.removedSilenceRanges) {
    assert.ok(Number.isInteger(range.startFrame) && Number.isInteger(range.endFrame));
    assert.ok(range.startFrame >= previousEnd && range.endFrame > range.startFrame);
    assert.ok(range.endFrame <= source.decodedDurationSeconds * 24000);
    for (let frame = range.startFrame; frame < range.endFrame; frame++) {
      assert.ok(Math.abs(sourcePcm.readInt16LE(frame * 2)) / 32768 <= 10 ** (f.silenceThresholdDbfs / 20), 'Silence edit must not remove audible source samples');
    }
    removed += range.endFrame - range.startFrame;
    previousEnd = range.endFrame;
  }
  assert.equal(removed, f.removedSilenceFrames);
  assert.ok(Math.abs(duration - (source.decodedDurationSeconds - removed / 24000) / f.tempoFactor) < 0.08);
  assert.ok(Number.isFinite(f.lufsIMeasured) && Math.abs(f.lufsIMeasured - prepared.targetLufsI) < 0.3);
  assert.ok(Number.isFinite(f.truePeakDbtpMeasured) && f.truePeakDbtpMeasured <= -3);
  let clipped = 0;
  for (let i = 44; i < bytes.length; i += 2) if (Math.abs(bytes.readInt16LE(i)) >= 32767) clipped++;
  assert.equal(clipped, 0);
  assert.equal(f.fullScaleSamples, 0);
  assert.equal(f.runtimeIntegrated, false);
  assert.equal(f.speakerId, null);
  assert.equal(f.lineId, null);
  assert.equal(f.approvalStatus, 'awaiting-listening-approval');
}
assert.deepEqual([...preparedSlots].sort(), ['CH-06', 'CH-07', 'CH-08', 'CH-09', 'CH-10']);
console.log('PASS EP02 recommendations: 5/5 fit, source provenance intact, loudness within 0.3 LUFS of -24, true peak <= -3 dBTP, no clipping.');

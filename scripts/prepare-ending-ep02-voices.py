"""Prepare five exact-line recommendations; source candidates remain untouched."""
import array
import hashlib
import json
import math
from pathlib import Path
import re
import subprocess
import tempfile
import wave

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'content/signal-breaker-ending-voice-ep02-candidates.json'
DEST = ROOT / 'public/assets/survivors/voice-ending-ep02-prepared'
RATE = 24000
THRESHOLD = -45
EDGE_PAD = 0.100
PAUSE_PAD = 0.300
TARGET_LUFS = -24.0
MAX_TEMPO = 1.08


def run_audio(source, filters):
    result = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(source),
                             '-af', filters, '-f', 'null', '-'], capture_output=True, text=True, check=True)
    return result.stderr


def measure(source):
    log = run_audio(source, 'loudnorm=I=-24:TP=-3:LRA=7:print_format=json')
    return json.JSONDecoder().raw_decode(log[log.rfind('{'):])[0]


def write_pcm(path, pcm):
    with wave.open(str(path), 'wb') as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(RATE)
        output.writeframes(pcm)


def render(source, output, filters):
    subprocess.run(['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-i', str(source),
                    '-af', filters, '-ar', str(RATE), '-ac', '1', '-c:a', 'pcm_s16le',
                    str(output)], check=True)


def prepare(candidate, scratch):
    source = ROOT / 'public' / candidate['candidateAssetPath'].lstrip('/')
    assert hashlib.sha256(source.read_bytes()).hexdigest() == candidate['finalSha256']
    with wave.open(str(source)) as audio:
        assert (audio.getnchannels(), audio.getsampwidth(), audio.getframerate()) == (1, 2, RATE)
        pcm = audio.readframes(audio.getnframes())
    total = len(pcm) // 2
    duration = total / RATE
    cuts = []
    tempo = 1.0
    if not candidate['timingPass']:
        log = run_audio(source, f'silencedetect=noise={THRESHOLD}dB:d=0.08')
        starts = [float(n) for n in re.findall(r'silence_start: ([0-9.]+)', log)]
        ends = [float(n) for n in re.findall(r'silence_end: ([0-9.]+)', log)]
        silences = [(round(a * RATE), min(total, round(b * RATE))) for a, b in zip(starts, ends)]
        for start, end in silences:
            if start == 0:
                cuts.append((0, max(0, end - round(EDGE_PAD * RATE))))
            elif end == total:
                cuts.append((min(total, start + round(EDGE_PAD * RATE)), total))
        remaining = total - sum(end - start for start, end in cuts)
        desired = round((candidate['targetSeconds'][1] - 0.08) * RATE)
        # Keep at least 300 ms in long internal pauses, cutting only their quiet centre.
        if remaining / RATE > candidate['targetSeconds'][1]:
            for start, end in sorted(silences, key=lambda pair: pair[1] - pair[0], reverse=True):
                if start == 0 or end == total or (end - start) / RATE < 0.45:
                    continue
                remove = min(end - start - round(PAUSE_PAD * RATE), max(0, remaining - desired))
                if remove > 0:
                    left = start + (end - start - remove) // 2
                    cuts.append((left, left + remove))
                    remaining -= remove
        if remaining / RATE > candidate['targetSeconds'][1]:
            tempo = remaining / desired
            assert tempo <= MAX_TEMPO, 'Needs a new recording; conservative tempo limit exceeded'
    cuts = sorted((start, end) for start, end in cuts if end > start)
    retained, cursor = [], 0
    for start, end in cuts:
        assert cursor <= start < end <= total
        removed_pcm = pcm[start * 2:end * 2]
        peak = max(abs(int.from_bytes(removed_pcm[i:i + 2], 'little', signed=True))
                   for i in range(0, len(removed_pcm), 2))
        assert peak / 32768 <= 10 ** (THRESHOLD / 20), 'Refuse to cut samples above the silence threshold'
        retained.append(pcm[cursor * 2:start * 2])
        cursor = end
    retained.append(pcm[cursor * 2:])
    trimmed = scratch / 'trimmed.wav'
    timed = scratch / 'timed.wav'
    gained = scratch / 'gained.wav'
    write_pcm(trimmed, b''.join(retained))
    if tempo > 1:
        render(trimmed, timed, f'atempo={tempo:.12f}')
    else:
        timed.write_bytes(trimmed.read_bytes())
    before = measure(timed)
    gain = min(TARGET_LUFS - float(before['input_i']), -3.0 - float(before['input_tp']))
    render(timed, gained, f'volume={gain:.6f}dB')
    filename = candidate['filename'].replace('.wav', '_timing_ready.wav')
    output = DEST / filename
    with wave.open(str(gained)) as audio:
        final_pcm = audio.readframes(audio.getnframes())
    write_pcm(output, final_pcm)
    actual = len(final_pcm) / (2 * RATE)
    after = measure(output)
    samples = array.array('h', final_pcm)
    clipping = sum(abs(sample) >= 32767 for sample in samples)
    assert candidate['targetSeconds'][0] <= actual <= candidate['targetSeconds'][1]
    assert clipping == 0 and float(after['input_tp']) <= -3.0
    assert abs(float(after['input_i']) - TARGET_LUFS) < 0.3
    return {
        'slot': candidate['slot'], 'speaker': candidate['speaker'],
        'variant': candidate['variant'], 'exactDialogue': candidate['exactDialogue'],
        'filename': filename, 'candidateAssetPath': '/assets/survivors/voice-ending-ep02-prepared/' + filename,
        'sourceFilename': candidate['filename'], 'sourceSha256': candidate['finalSha256'],
        'sha256': hashlib.sha256(output.read_bytes()).hexdigest(),
        'selectionReason': 'Shortest supplied recording per slot; minimal timing treatment before tonal listening review.',
        'sourceDurationSeconds': duration, 'decodedDurationSeconds': actual,
        'targetSeconds': candidate['targetSeconds'], 'timingPass': True,
        'removedSilenceFrames': sum(end - start for start, end in cuts),
        'removedSilenceRanges': [{'startFrame': start, 'endFrame': end} for start, end in cuts],
        'silenceThresholdDbfs': THRESHOLD, 'edgePaddingSeconds': EDGE_PAD,
        'minimumInternalPauseSeconds': PAUSE_PAD, 'tempoFactor': tempo,
        'gainDb': gain, 'lufsIMeasured': float(after['input_i']),
        'truePeakDbtpMeasured': float(after['input_tp']), 'fullScaleSamples': clipping,
        'codec': 'pcm_s16le', 'sampleRateHz': RATE, 'channels': 1, 'bitsPerSample': 16,
        'speakerId': None, 'lineId': None, 'runtimeIntegrated': False,
        'approvalStatus': 'awaiting-listening-approval',
    }


def main():
    source = json.loads(SOURCE.read_text())
    DEST.mkdir(parents=True, exist_ok=True)
    files = []
    with tempfile.TemporaryDirectory(prefix='psi-ep02-prepare-') as folder:
        for slot in sorted({f['slot'] for f in source['files']}):
            candidate = min((f for f in source['files'] if f['slot'] == slot), key=lambda f: (f['decodedDurationSeconds'], f['variant']))
            files.append(prepare(candidate, Path(folder)))
    manifest = {
        'project': source['project'], 'assetSet': 'Episode 02 timing-ready voice recommendations',
        'status': 'TIMING_READY_PENDING_AUTHORED_CONTRACT_AND_LISTENING',
        'runtimeIntegrated': False, 'finalListeningApproved': False,
        'originalFilesPreserved': True, 'targetLufsI': TARGET_LUFS,
        'maximumTempoFactor': MAX_TEMPO, 'generator': 'scripts/prepare-ending-ep02-voices.py',
        'auditScope': 'Original candidate SHA-256; conservative silence edits; pitch-preserving atempo only if needed; decoded duration, ffmpeg integrated loudness/true peak and PCM clipping. No transcript or listening certification.',
        'files': files,
    }
    encoded = json.dumps(manifest, ensure_ascii=False, indent=2) + '\n'
    (ROOT / 'content/signal-breaker-ending-voice-ep02-prepared.json').write_text(encoded)
    (DEST / 'voice-manifest.json').write_text(encoded)
    for f in files:
        print(f['slot'], f['variant'], round(f['decodedDurationSeconds'], 3), 'seconds, tempo', round(f['tempoFactor'], 4), 'LUFS', f['lufsIMeasured'])


if __name__ == '__main__':
    main()

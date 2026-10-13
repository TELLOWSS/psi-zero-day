import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright'));
const url = process.env.PSI_PREVIEW_URL;
if (!url) throw Error('Set PSI_PREVIEW_URL to a Vite development server');
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN });
const rows = [];
try {
  for (const [width, height] of [[1440, 900], [390, 844], [844, 390]]) {
    const page = await browser.newPage({ viewport: { width, height } }), errors = [];
    page.on('pageerror', error => errors.push(String(error)));
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.mouse.click(1, 1);
    const result = await page.evaluate(async () => {
      const { SurvivorsSessionAudio } = await import('/src/ui/survivors-session-audio.ts');
      const audio = new SurvivorsSessionAudio();
      try {
        const played = await audio.playPlayerVoice('CART_WARNING', 100, 8);
        const ctx = audio.context, speech = audio.speech?.source;
        if (!played || !ctx || !speech || ctx.state !== 'running') throw Error('Actual voice decode/play unavailable');
        let stops = 0;
        const stop = speech.stop.bind(speech);
        speech.stop = (...args) => { stops++; return stop(...args); };
        const effects = [];
        for (let i = 0; i < 24; i++) {
          const source = ctx.createBufferSource(), gain = ctx.createGain();
          source.buffer = ctx.createBuffer(1, 128, ctx.sampleRate);
          source.loop = true; gain.gain.value = 0;
          if (!audio.track(source, gain, 4)) throw Error('Equal-priority effect rejected');
          source.connect(gain); gain.connect(ctx.destination); source.start();
          effects.push(source);
        }
        const retained = audio.speech?.source === speech && audio.voices.has(speech) && stops === 0;
        const bounded = audio.voices.size === 24 && !audio.voices.has(effects[0]);
        const lowerRejected = !await audio.playPlayerVoice('SECURED', 30);
        const equalRejected = !await audio.playPlayerVoice('FALL_WARNING', 100);
        audio.setMuted(true);
        const muted = stops > 0 && audio.voices.size === 0 && audio.speech === null;
        audio.setMuted(false);
        const resumed = await audio.playPlayerVoice('START', 40, 8);
        audio.silence();
        const paused = audio.voices.size === 0 && audio.speech === null;
        return { played, retained, bounded, lowerRejected, equalRejected, muted, resumed, paused, failures: [...audio.failures] };
      } finally { audio.dispose(); }
    });
    rows.push({ width, height, ...result, errors, pass: Object.entries(result).filter(([key]) => key !== 'failures').every(([, value]) => value === true) && !result.failures.length && !errors.length });
    await page.close();
  }
  fs.mkdirSync('artifacts/voice-budget', { recursive: true });
  fs.writeFileSync('artifacts/voice-budget/report.json', JSON.stringify({ url, scope: 'REAL_WEB_AUDIO_EXPLICIT_SILENT_SFX_SATURATION_NOT_NATURAL_COMBAT_OR_LISTENING_APPROVAL', rows }, null, 2));
  console.log(JSON.stringify(rows));
  if (rows.some(row => !row.pass)) process.exitCode = 1;
} finally { await browser.close(); }

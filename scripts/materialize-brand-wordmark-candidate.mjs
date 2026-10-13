import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';

const root = 'docs/branding/candidates';
const font = 'public/fonts/ChakraPetch-Bold.ttf';
const license = 'public/fonts/ChakraPetch-OFL.txt';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const fontBytes = fs.readFileSync(font);
const require = createRequire(import.meta.url);
const { chromium } = require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright'));
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN });
const files = [];
try {
  for (const kind of ['wordmark', 'wordmark-wide', 'symbol']) {
    const source = `${root}/BR-LOGO-02-${kind}-source.svg`;
    const original = fs.readFileSync(source, 'utf8');
    for (const [tone, color] of [['ink', '#161a1d'], ['chalk', '#eaf2f1']]) {
      const svg = original.replace('FONT_DATA', fontBytes.toString('base64')).replace('color="#161a1d"', `color="${color}"`);
      const file = `${root}/BR-LOGO-02-${kind}-${tone}.svg`;
      fs.writeFileSync(file, svg);
      const png = file.replace('.svg', '.png');
      const page = await browser.newPage({ viewport: { width: 460, height: 144 }, deviceScaleFactor: 2 });
      await page.setContent(`<style>html,body{margin:0;background:transparent}img{display:block}</style><img alt="Unapproved candidate" src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}">`);
      await page.locator('img').evaluate(image => image.decode());
      await page.locator('img').screenshot({ path: png, omitBackground: true });
      files.push({ kind, tone, svg: file, svgSha256: hash(Buffer.from(svg)), png, pngSha256: hash(fs.readFileSync(png)), source, sourceSha256: hash(Buffer.from(original)) });
      await page.close();
    }
  }
  fs.copyFileSync(license, `${root}/BR-LOGO-02-ChakraPetch-OFL.txt`);
  fs.writeFileSync(`${root}/BR-LOGO-02.json`, JSON.stringify({ id: 'BR-LOGO-02', status: 'CANDIDATE_REQUIRES_DIRECTOR_FILE_REVIEW', runtimeConnected: false, directorFileApproval: false,
    scope: 'B2_EDITABLE_VECTOR_AND_RASTER_DELIVERY_NOT_APPROVED_RUNTIME',
    font: { file: font, sha256: hash(fontBytes), license: `${root}/BR-LOGO-02-ChakraPetch-OFL.txt`, modified: false },
    geometry: 'OPEN_RECTANGULAR_BOUNDARY_WITH_SEPARATE_SIGNAL_BAR',
    rightsReview: 'FONT_OFL_RECORDED_NOT_TRADEMARK_CLEARANCE_OR_DIRECTOR_APPROVAL', files }, null, 2));
  console.log(JSON.stringify(files));
} finally { await browser.close(); }

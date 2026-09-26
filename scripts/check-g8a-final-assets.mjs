import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const requireFinal = process.argv.includes('--require-final');
const candidateCheck = process.argv.includes('--candidate');

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
}
function u24le(buffer, offset) {
  return buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16);
}
function imageInfo(rel) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) return null;
  const b = fs.readFileSync(abs);
  if (b.length < 30) throw new Error(`${rel}: image is too small to inspect`);

  // PNG
  if (b.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) {
    const width = b.readUInt32BE(16);
    const height = b.readUInt32BE(20);
    const colorType = b[25];
    return { format:'png', width, height, alpha: colorType === 4 || colorType === 6, bytes:b.length };
  }

  // WebP RIFF container
  if (b.toString('ascii',0,4) === 'RIFF' && b.toString('ascii',8,12) === 'WEBP') {
    let offset = 12;
    let width = null;
    let height = null;
    let alpha = false;
    while (offset + 8 <= b.length) {
      const type = b.toString('ascii', offset, offset + 4);
      const size = b.readUInt32LE(offset + 4);
      const data = offset + 8;
      if (type === 'VP8X' && data + 10 <= b.length) {
        const flags = b[data];
        alpha = alpha || Boolean(flags & 0x10);
        width = 1 + u24le(b, data + 4);
        height = 1 + u24le(b, data + 7);
      } else if (type === 'ALPH') {
        alpha = true;
      } else if (type === 'VP8L' && data + 5 <= b.length && b[data] === 0x2f) {
        const b1=b[data+1], b2=b[data+2], b3=b[data+3], b4=b[data+4];
        width = 1 + (((b2 & 0x3f) << 8) | b1);
        height = 1 + (((b4 & 0x0f) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6));
        alpha = true;
      } else if (type === 'VP8 ' && data + 10 <= b.length && width == null) {
        width = b.readUInt16LE(data + 6) & 0x3fff;
        height = b.readUInt16LE(data + 8) & 0x3fff;
      }
      offset = data + size + (size % 2);
    }
    if (!width || !height) throw new Error(`${rel}: WebP dimensions could not be decoded`);
    return { format:'webp', width, height, alpha, bytes:b.length };
  }

  throw new Error(`${rel}: only PNG/WebP are accepted by the G8-A final asset intake`);
}

const world = readJson('content/defense/g8a-world-final-art.json');
const swift = readJson('content/defense/g8a-swift-final-art.json');

const failures = [];
const rows = [];
function checkManifest(name, manifest) {
  const approved = manifest.status === 'PRODUCTION_APPROVED' && manifest.promotion?.productionApproved === true;
  const consistentPending = manifest.status === 'ASSET_PENDING' && manifest.promotion?.productionApproved === false;
  if (!approved && !consistentPending) failures.push(`${name}: status and productionApproved disagree`);

  const masterRel = manifest.sourceMaster?.repositoryUri ?? null;
  const sourceRecordRel = manifest.sourceMaster?.sourceRecordUri ?? null;
  const runtimeRel = manifest.runtimeUri?.startsWith('assets/')
    ? path.posix.join('public', manifest.runtimeUri)
    : manifest.runtimeUri;
  if ((!masterRel && !sourceRecordRel) || !runtimeRel) {
    failures.push(`${name}: source master/review record and runtime repository path are required`);
    return;
  }
  if ((masterRel && /\.svg(?:$|\?)/i.test(masterRel)) || /\.svg(?:$|\?)/i.test(runtimeRel)) {
    failures.push(`${name}: SVG cannot enter final asset intake`);
  }

  let master = null;
  let runtime = null;
  if (masterRel) {
    try { master = imageInfo(masterRel); } catch (error) { failures.push(error.message); }
  } else if (sourceRecordRel) {
    try {
      const record = readJson(sourceRecordRel);
      const observed = record.observed ?? {};
      if (record.reviewState !== 'SOURCE_REVIEW_PASS' || record.acceptance?.result !== 'PASS') {
        failures.push(`${name}: source review record is not PASS`);
      }
      master = {
        format: observed.format,
        width: observed.width,
        height: observed.height,
        alpha: observed.transparentBackground === true,
        bytes: observed.bytes ?? null,
        externalReviewed: true,
        sha256: observed.sha256 ?? null,
        path: sourceRecordRel,
      };
    } catch (error) { failures.push(`${name}: source review record could not be read: ${error.message}`); }
  }
  try { runtime = imageInfo(runtimeRel); } catch (error) { failures.push(error.message); }

  if (approved || candidateCheck || master) {
    if (!master) failures.push(`${name}: source master is missing ${masterRel}`);
    else {
      if (master.width < manifest.sourceMaster.minimumWidth) failures.push(`${name}: source width ${master.width} < ${manifest.sourceMaster.minimumWidth}`);
      if (master.height < manifest.sourceMaster.minimumHeight) failures.push(`${name}: source height ${master.height} < ${manifest.sourceMaster.minimumHeight}`);
      if (manifest.sourceMaster.transparentBackground === true && !master.alpha) failures.push(`${name}: source master must preserve alpha transparency`);
    }
  }
  if (approved || candidateCheck || runtime) {
    if (!runtime) failures.push(`${name}: runtime file is missing ${runtimeRel}`);
    else {
      if (runtime.width !== manifest.runtime.width) failures.push(`${name}: runtime width ${runtime.width} != ${manifest.runtime.width}`);
      if (runtime.height !== manifest.runtime.height) failures.push(`${name}: runtime height ${runtime.height} != ${manifest.runtime.height}`);
      if (manifest.runtime.transparentBackground === true && !runtime.alpha) failures.push(`${name}: runtime file must preserve alpha transparency`);
      if (runtime.format !== manifest.format) failures.push(`${name}: runtime format ${runtime.format} != manifest ${manifest.format}`);
    }
  }

  if (requireFinal && !approved) failures.push(`${name}: final approval is required`);

  rows.push({
    name,
    status: manifest.status,
    approved,
    master: master ? { path:masterRel ?? sourceRecordRel, ...master } : { path:masterRel ?? sourceRecordRel, missing:true },
    runtime: runtime ? { path:runtimeRel, ...runtime } : { path:runtimeRel, missing:true },
  });
}

checkManifest('WORLD', world);
checkManifest('SWIFT', swift);

const report = {
  gate: 'G8-A',
  requireFinal,
  candidateCheck,
  rows,
  result: failures.length
    ? 'FAIL'
    : rows.every(row => row.approved)
      ? 'FINAL_ASSETS_VALID'
      : candidateCheck && rows.every(row => !row.master.missing && !row.runtime.missing)
        ? 'CANDIDATE_ASSETS_VALID'
        : 'PRE_ART_BLOCKED_AS_DESIGNED',
  failures,
};
console.log('G8A_FINAL_ASSET_INTAKE=' + JSON.stringify(report));
if (failures.length) process.exit(1);

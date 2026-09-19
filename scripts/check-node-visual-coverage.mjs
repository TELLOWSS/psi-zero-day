import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const episodeDir = path.join(root, 'content', 'episode01');
const eventFiles = [
  'events.json',
  'consequence-events.json',
  'inspection-events.json',
  'instruction-chain-events.json',
  'record-pressure-events.json',
  'responsibility-clash-event.json',
  'restart-events.json',
  'stopwork-aftershock-events.json',
  'tbm-gap-events.json',
  'report-return-event.json',
];
const partA = JSON.parse(await readFile(path.join(episodeDir, 'node-visual-direction-a.json'), 'utf8')).events ?? {};
const partB = JSON.parse(await readFile(path.join(episodeDir, 'node-visual-direction-b.json'), 'utf8')).events ?? {};
const authored = { ...partA, ...partB };
const cameras = new Set(['wide', 'medium', 'tight']);
const focuses = new Set(['left', 'center', 'right']);
const tones = new Set(['neutral', 'decision', 'pressure', 'resolved', 'reflective']);
const shots = new Set(['establishing', 'dialogue', 'decision', 'result-pressure', 'result-resolved', 'result-neutral', 'reflection']);
const live = [];
const errors = [];

function collect(value) {
  if (Array.isArray(value)) {
    for (const event of value) collect(event);
    return;
  }
  if (!value || typeof value !== 'object' || typeof value.event_id !== 'string') return;
  for (const node of value.dialogue ?? []) {
    if (node?.type === 'END') continue;
    if (typeof node?.node_id === 'string') live.push({ event_id: value.event_id, node_id: node.node_id });
  }
}

for (const file of eventFiles) collect(JSON.parse(await readFile(path.join(episodeDir, file), 'utf8')));

const seen = new Set();
for (const node of live) {
  const key = `${node.event_id}::${node.node_id}`;
  if (seen.has(key)) {
    errors.push(`duplicate live node ${key}`);
    continue;
  }
  seen.add(key);
  const record = authored[node.event_id]?.[node.node_id];
  if (!record) {
    errors.push(`missing authored node direction: ${key}`);
    continue;
  }
  if (!cameras.has(record.camera)) errors.push(`${key}: invalid camera ${String(record.camera)}`);
  if (!focuses.has(record.focus)) errors.push(`${key}: invalid focus ${String(record.focus)}`);
  if (!tones.has(record.tone)) errors.push(`${key}: invalid tone ${String(record.tone)}`);
  if (!shots.has(record.shot)) errors.push(`${key}: invalid shot ${String(record.shot)}`);
}

for (const [eventId, nodes] of Object.entries(authored)) {
  for (const nodeId of Object.keys(nodes)) {
    const key = `${eventId}::${nodeId}`;
    if (!seen.has(key)) errors.push(`stale authored node direction: ${key}`);
  }
}

if (errors.length) {
  console.error('Episode 01 node visual coverage is NOT ready.');
  console.error('- ' + errors.join('\n- '));
  process.exitCode = 1;
} else {
  console.log(`Episode 01 node visual coverage ready: ${live.length}/${live.length} non-END nodes authored across ${Object.keys(authored).length} events.`);
}

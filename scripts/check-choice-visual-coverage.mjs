import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
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

const episodeDir = path.join(root, 'content', 'episode01');
const direction = JSON.parse(await readFile(path.join(episodeDir, 'choice-visual-direction.json'), 'utf8'));
const scenes = JSON.parse(await readFile(path.join(episodeDir, 'immersive-scenes.json'), 'utf8')).events ?? {};
const authored = direction.events ?? {};
const tones = new Set(['control', 'pressure', 'people', 'evidence', 'recovery']);
const crops = new Set(['left', 'center', 'right']);
const choices = [];
const errors = [];

function collect(value, eventId = null) {
  if (Array.isArray(value)) {
    for (const item of value) collect(item, eventId);
    return;
  }
  if (!value || typeof value !== 'object') return;
  const currentEvent = typeof value.event_id === 'string' ? value.event_id : eventId;
  if (currentEvent && Array.isArray(value.choices)) {
    for (const choice of value.choices) {
      const id = choice.choice_id ?? choice.id;
      if (typeof id === 'string' && id) choices.push({ event_id: currentEvent, choice_id: id });
    }
  }
  for (const [key, child] of Object.entries(value)) {
    if (key !== 'choices') collect(child, currentEvent);
  }
}

for (const file of eventFiles) {
  const data = JSON.parse(await readFile(path.join(episodeDir, file), 'utf8'));
  collect(data);
}

const seen = new Set();
for (const choice of choices) {
  const key = `${choice.event_id}::${choice.choice_id}`;
  if (seen.has(key)) {
    errors.push(`duplicate Episode 01 choice ${key}`);
    continue;
  }
  seen.add(key);

  const record = authored[choice.event_id]?.[choice.choice_id];
  if (!record) {
    errors.push(`missing authored visual direction: ${key}`);
    continue;
  }
  if (!tones.has(record.tone)) errors.push(`${key}: invalid tone ${String(record.tone)}`);
  if (!crops.has(record.crop)) errors.push(`${key}: invalid crop ${String(record.crop)}`);

  const scene = scenes[choice.event_id];
  if (!scene) {
    errors.push(`${key}: immersive scene is missing`);
    continue;
  }
  if (record.prop_index !== undefined) {
    if (!Number.isInteger(record.prop_index) || record.prop_index < 0 || record.prop_index >= (scene.props?.length ?? 0)) {
      errors.push(`${key}: prop_index ${String(record.prop_index)} is outside scene props`);
    }
  }
}

for (const [eventId, records] of Object.entries(authored)) {
  for (const choiceId of Object.keys(records)) {
    const key = `${eventId}::${choiceId}`;
    if (!seen.has(key)) errors.push(`stale authored visual direction: ${key}`);
  }
}

if (errors.length) {
  console.error('Episode 01 choice visual coverage is NOT ready.');
  console.error('- ' + errors.join('\n- '));
  process.exitCode = 1;
} else {
  const eventCount = new Set(choices.map(choice => choice.event_id)).size;
  console.log(`Episode 01 choice visual coverage ready: ${choices.length}/${choices.length} authored across ${eventCount} choice events.`);
}

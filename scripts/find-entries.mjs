import fs from 'node:fs';

const lines = fs.readFileSync('content/episode01/scene-element-catalog.json', 'utf8').split('\n');
const targets = ['starter_rebar_protrusion', 'rebar_lifting_bundle', 'ev_pit_opening', 'ev_pit_access_route', 'foundation_temporary_walkway'];

for (let i = 0; i < lines.length; i++) {
  for (const t of targets) {
    if (lines[i].includes(`"${t}":`)) {
      console.log(`${t} starts at line ${i + 1}`);
    }
  }
}

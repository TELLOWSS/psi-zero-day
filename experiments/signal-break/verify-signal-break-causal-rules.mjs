import assert from 'node:assert/strict';
import { createCausalState, applyCausalCommand as command, advanceCausalState as tick, MAX_SIGNALS } from './signal-break-causal-rules.ts';
const source = (id = 'stack') => ({ id, response: 'BURST', observed: false, controlled: false, spawnEvery: .5, remaining: 0, mass: 5 });
let passed = 0;
function test(name, fn) { fn(); passed++; console.log(`PASS ${name}`); }
test('observation and matching response are required; input is unchanged', () => {
  const state = createCausalState([source()]);
  const copy = structuredClone(state);
  assert.equal(command(state, { type: 'CONTROL', sourceId: 'stack', response: 'BURST' }), state);
  const seen = command(state, { type: 'OBSERVE', sourceId: 'stack' });
  assert.equal(command(seen, { type: 'CONTROL', sourceId: 'stack', response: 'PULSE' }), seen);
  assert.equal(command(seen, { type: 'CONTROL', sourceId: 'stack', response: 'BURST' }).sources[0].controlled, true);
  assert.deepEqual(state, copy);
});
test('odd mass splitting conserves mass and uses unique signal IDs', () => {
  const state = tick(createCausalState([source()]), .1);
  const split = command(state, { type: 'BREAK', signalId: 1 });
  assert.deepEqual(split.signals.map(s => s.mass), [2, 3]);
  assert.equal(new Set(split.signals.map(s => s.id)).size, 2);
});
test('empty screen alone does not complete and causes recurrence', () => {
  let state = tick(createCausalState([{ ...source(), mass: 1 }]), .1);
  state = command(state, { type: 'BREAK', signalId: 1 });
  for (let i = 0; i < 10; i++) state = tick(state, .25);
  assert.equal(state.complete, false);
  assert.ok(state.signals.length > 0);
});
test('all sources plus residual signals must resolve before verification', () => {
  let state = tick(createCausalState([{ ...source(), mass: 1 }, { ...source('power'), mass: 1 }]), .1);
  for (const id of ['stack', 'power']) {
    state = command(state, { type: 'OBSERVE', sourceId: id });
    state = command(state, { type: 'CONTROL', sourceId: id, response: 'BURST' });
  }
  for (let i = 0; i < 12; i++) state = tick(state, .25);
  assert.equal(state.complete, false);
  for (const signal of state.signals) state = command(state, { type: 'BREAK', signalId: signal.id });
  for (let i = 0; i < 7; i++) state = tick(state, .25);
  assert.equal(state.complete, false);
  state = tick(state, .25);
  assert.equal(state.complete, true);
  assert.equal(tick(state, .25), state);
});
test('spawn saturation stays bounded and never accumulates burst backlog', () => {
  let state = createCausalState([{ ...source(), spawnEvery: .1, mass: 1 }]);
  for (let i = 0; i < 500; i++) state = tick(state, .25);
  assert.equal(state.signals.length, MAX_SIGNALS);
  state = command(state, { type: 'BREAK', signalId: state.signals[0].id });
  state = tick(state, .25);
  assert.equal(state.signals.length, MAX_SIGNALS);
  assert.equal(new Set(state.signals.map(s => s.id)).size, MAX_SIGNALS);
});
test('full-budget splitting preserves parent instead of deleting mass', () => {
  let state = createCausalState([{ ...source(), spawnEvery: .1 }]);
  for (let i = 0; i < 50; i++) state = tick(state, .25);
  assert.equal(command(state, { type: 'BREAK', signalId: state.signals[0].id }), state);
});
test('invalid source definitions and invalid deltas reject', () => {
  for (const invalid of [{ ...source(), spawnEvery: 0 }, { ...source(), mass: 1.5 }, { ...source(), remaining: NaN }]) {
    assert.throws(() => createCausalState([invalid]));
  }
  assert.throws(() => createCausalState([source(), source()]));
  const state = createCausalState([source()]);
  for (const dt of [-1, NaN, Infinity, 1]) assert.throws(() => tick(state, dt));
  assert.equal(tick(state, 0), state);
});
console.log(`${passed} rule checks passed. UI integration and gameplay QA remain pending.`);

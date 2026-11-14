import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/omega-access.js';

const original = process.env.OMEGA_ACCESS_PASSWORD;
after(() => { if (original === undefined) delete process.env.OMEGA_ACCESS_PASSWORD; else process.env.OMEGA_ACCESS_PASSWORD = original; });
function request(method, body, headers = {}) {
  const response = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(code) { this.code = code; return this; }, json(data) { this.body = data; return this; } };
  handler({ method, body, headers: { host: 'example.test', 'x-forwarded-proto': 'https', ...headers } }, response);
  return response;
}
test('password gate fails closed, verifies credentials and signed sessions', () => {
  delete process.env.OMEGA_ACCESS_PASSWORD;
  assert.equal(request('GET').code, 503);
  process.env.OMEGA_ACCESS_PASSWORD = 'test-only-long-password';
  assert.equal(request('GET').code, 401);
  assert.equal(request('POST', {password:'wrong'}).code, 401);
  assert.equal(request('POST', {password:'test-only-long-password'}, {origin:'https://other.test'}).code, 403);
  const loggedIn = request('POST', {password:'test-only-long-password'}, {origin:'https://example.test'});
  assert.equal(loggedIn.code, 200);
  assert.match(loggedIn.headers['Set-Cookie'], /HttpOnly; SameSite=Strict; Max-Age=43200; Secure/);
  const cookie = loggedIn.headers['Set-Cookie'].split(';')[0];
  assert.equal(request('GET', undefined, {cookie}).code, 200);
  assert.equal(request('GET', undefined, {cookie:cookie + 'a'}).code, 401);
  process.env.OMEGA_ACCESS_PASSWORD = 'rotated-password';
  assert.equal(request('GET', undefined, {cookie}).code, 401);
});

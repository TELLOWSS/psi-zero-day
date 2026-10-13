import {it,expect} from 'vitest';
// @ts-expect-error Test-only Node tooling has no runtime TypeScript declaration.
import {parseAdbDevices,androidProbeDecision,summarizeFrameIntervals} from '../scripts/survivors-android-probe.mjs';
it('does not infer a phone from an empty ADB result',()=>{
 const devices=parseAdbDevices('* daemon started successfully\nList of devices attached\n');
 expect(devices).toEqual([]);expect(androidProbeDecision(devices)).toEqual({ready:false,reason:'no-device'});
});
it('requires authorization and explicit selection for multiple devices',()=>{
 const devices=parseAdbDevices('List of devices attached\na unauthorized usb:1\nb device product:test model:test\n');
 expect(androidProbeDecision(devices).ready).toBe(false);
 expect(androidProbeDecision(devices,'a').reason).toBe('authorization-required');
 expect(androidProbeDecision(devices,'b')).toEqual({ready:true,serial:'b'});
 expect(androidProbeDecision([{serial:'c',status:'offline'}]).ready).toBe(false);
});
it('reports measured frame percentiles without turning empty samples into success',()=>{
 expect(summarizeFrameIntervals([]).p95Ms).toBeNull();
 expect(summarizeFrameIntervals([16,17,18,80,NaN,-1])).toEqual({samples:4,p50Ms:18,p95Ms:80,p99Ms:80,over50ms:1});
});

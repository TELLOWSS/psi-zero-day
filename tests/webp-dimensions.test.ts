import { describe, expect, it } from 'vitest';
import { isWebP, webPDimensions, webPHasAlpha } from '../scripts/webp-dimensions.mjs';

function writeUint24LE(buffer: Buffer, offset: number, value: number) {
  buffer[offset] = value & 0xff;
  buffer[offset + 1] = (value >>> 8) & 0xff;
  buffer[offset + 2] = (value >>> 16) & 0xff;
}

function webPChunk(type: 'VP8X' | 'VP8 ' | 'VP8L' | 'ALPH', payload: Buffer) {
  const padding = payload.length % 2;
  const totalLength = 12 + 8 + payload.length + padding;
  const bytes = Buffer.alloc(totalLength);
  bytes.write('RIFF', 0, 'ascii');
  bytes.writeUInt32LE(totalLength - 8, 4);
  bytes.write('WEBP', 8, 'ascii');
  bytes.write(type, 12, 'ascii');
  bytes.writeUInt32LE(payload.length, 16);
  payload.copy(bytes, 20);
  return bytes;
}

function vp8x(width: number, height: number, alpha = false) {
  const payload = Buffer.alloc(10);
  if (alpha) payload[0] |= 0x10;
  writeUint24LE(payload, 4, width - 1);
  writeUint24LE(payload, 7, height - 1);
  return webPChunk('VP8X', payload);
}

function vp8(width: number, height: number) {
  const payload = Buffer.alloc(10);
  payload[3] = 0x9d;
  payload[4] = 0x01;
  payload[5] = 0x2a;
  payload.writeUInt16LE(width, 6);
  payload.writeUInt16LE(height, 8);
  return webPChunk('VP8 ', payload);
}

function vp8l(width: number, height: number, alpha = false) {
  const payload = Buffer.alloc(5);
  payload[0] = 0x2f;
  let packed = ((width - 1) | ((height - 1) << 14)) >>> 0;
  if (alpha) packed = (packed | (1 << 28)) >>> 0;
  payload.writeUInt32LE(packed, 1);
  return webPChunk('VP8L', payload);
}

describe('WebP production-art metadata', () => {
  it('rejects non-WebP bytes', () => {
    const bytes = Buffer.from('not-a-webp');
    expect(isWebP(bytes)).toBe(false);
    expect(webPDimensions(bytes)).toBeUndefined();
    expect(webPHasAlpha(bytes)).toBeUndefined();
  });

  it('reads VP8X extended WebP dimensions and alpha flag', () => {
    const bytes = vp8x(1024, 1024, true);
    expect(isWebP(bytes)).toBe(true);
    expect(webPDimensions(bytes)).toEqual({ width: 1024, height: 1024 });
    expect(webPHasAlpha(bytes)).toBe(true);
  });

  it('reads VP8 lossy WebP dimensions without assuming transparency', () => {
    const bytes = vp8(768, 1024);
    expect(webPDimensions(bytes)).toEqual({ width: 768, height: 1024 });
    expect(webPHasAlpha(bytes)).toBe(false);
  });

  it('reads VP8L lossless WebP dimensions and alpha bit', () => {
    const bytes = vp8l(1920, 1080, true);
    expect(webPDimensions(bytes)).toEqual({ width: 1920, height: 1080 });
    expect(webPHasAlpha(bytes)).toBe(true);
  });

  it('reports opaque VP8X/VP8L files as non-alpha', () => {
    expect(webPHasAlpha(vp8x(1024, 1024, false))).toBe(false);
    expect(webPHasAlpha(vp8l(768, 1024, false))).toBe(false);
  });

  it('rejects a truncated WebP chunk instead of guessing metadata', () => {
    const bytes = vp8x(1024, 1024, true).subarray(0, 23);
    expect(webPDimensions(bytes)).toBeUndefined();
    expect(webPHasAlpha(bytes)).toBeUndefined();
  });
});

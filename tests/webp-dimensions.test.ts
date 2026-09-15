import { describe, expect, it } from 'vitest';
import { isWebP, webPDimensions } from '../scripts/webp-dimensions.mjs';

function writeUint24LE(buffer: Buffer, offset: number, value: number) {
  buffer[offset] = value & 0xff;
  buffer[offset + 1] = (value >>> 8) & 0xff;
  buffer[offset + 2] = (value >>> 16) & 0xff;
}

function webPChunk(type: 'VP8X' | 'VP8 ' | 'VP8L', payload: Buffer) {
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

function vp8x(width: number, height: number) {
  const payload = Buffer.alloc(10);
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

function vp8l(width: number, height: number) {
  const payload = Buffer.alloc(5);
  payload[0] = 0x2f;
  const packed = ((width - 1) | ((height - 1) << 14)) >>> 0;
  payload.writeUInt32LE(packed, 1);
  return webPChunk('VP8L', payload);
}

describe('WebP production-art dimensions', () => {
  it('rejects non-WebP bytes', () => {
    const bytes = Buffer.from('not-a-webp');
    expect(isWebP(bytes)).toBe(false);
    expect(webPDimensions(bytes)).toBeUndefined();
  });

  it('reads VP8X extended WebP dimensions', () => {
    const bytes = vp8x(1024, 1024);
    expect(isWebP(bytes)).toBe(true);
    expect(webPDimensions(bytes)).toEqual({ width: 1024, height: 1024 });
  });

  it('reads VP8 lossy WebP dimensions', () => {
    expect(webPDimensions(vp8(768, 1024))).toEqual({ width: 768, height: 1024 });
  });

  it('reads VP8L lossless WebP dimensions', () => {
    expect(webPDimensions(vp8l(1920, 1080))).toEqual({ width: 1920, height: 1080 });
  });

  it('rejects a truncated WebP chunk instead of guessing dimensions', () => {
    const bytes = vp8x(1024, 1024).subarray(0, 23);
    expect(webPDimensions(bytes)).toBeUndefined();
  });
});

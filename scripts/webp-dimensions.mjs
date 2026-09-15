export function isWebP(bytes) {
  return bytes.length >= 12
    && bytes.subarray(0, 4).toString('ascii') === 'RIFF'
    && bytes.subarray(8, 12).toString('ascii') === 'WEBP';
}

function readUint24LE(bytes, offset) {
  return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16);
}

function walkChunks(bytes, visitor) {
  if (!isWebP(bytes)) return false;

  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const chunkType = bytes.subarray(offset, offset + 4).toString('ascii');
    const chunkSize = bytes.readUInt32LE(offset + 4);
    const dataOffset = offset + 8;
    if (dataOffset + chunkSize > bytes.length) return false;
    if (visitor(chunkType, dataOffset, chunkSize) === false) return true;
    offset = dataOffset + chunkSize + (chunkSize % 2);
  }

  return true;
}

export function webPDimensions(bytes) {
  if (!isWebP(bytes)) return undefined;

  let dimensions;
  const valid = walkChunks(bytes, (chunkType, dataOffset, chunkSize) => {
    if (chunkType === 'VP8X' && chunkSize >= 10) {
      dimensions = {
        width: readUint24LE(bytes, dataOffset + 4) + 1,
        height: readUint24LE(bytes, dataOffset + 7) + 1,
      };
      return false;
    }

    if (chunkType === 'VP8 ' && chunkSize >= 10
      && bytes[dataOffset + 3] === 0x9d
      && bytes[dataOffset + 4] === 0x01
      && bytes[dataOffset + 5] === 0x2a) {
      dimensions = {
        width: bytes.readUInt16LE(dataOffset + 6) & 0x3fff,
        height: bytes.readUInt16LE(dataOffset + 8) & 0x3fff,
      };
      return false;
    }

    if (chunkType === 'VP8L' && chunkSize >= 5 && bytes[dataOffset] === 0x2f) {
      const packed = bytes.readUInt32LE(dataOffset + 1);
      dimensions = {
        width: (packed & 0x3fff) + 1,
        height: ((packed >>> 14) & 0x3fff) + 1,
      };
      return false;
    }
  });

  return valid ? dimensions : undefined;
}

export function webPHasAlpha(bytes) {
  if (!isWebP(bytes)) return undefined;

  let hasAlpha = false;
  const valid = walkChunks(bytes, (chunkType, dataOffset, chunkSize) => {
    if (chunkType === 'VP8X' && chunkSize >= 10) {
      // VP8X feature byte bit 4 marks alpha usage.
      if ((bytes[dataOffset] & 0x10) !== 0) hasAlpha = true;
    } else if (chunkType === 'ALPH') {
      hasAlpha = true;
    } else if (chunkType === 'VP8L' && chunkSize >= 5 && bytes[dataOffset] === 0x2f) {
      const packed = bytes.readUInt32LE(dataOffset + 1);
      if (((packed >>> 28) & 0x01) === 1) hasAlpha = true;
    }
  });

  return valid ? hasAlpha : undefined;
}

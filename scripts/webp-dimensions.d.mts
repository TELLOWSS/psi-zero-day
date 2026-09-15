/// <reference types="node" />

export interface WebPDimensions {
  width: number;
  height: number;
}

export declare function isWebP(bytes: Buffer): boolean;
export declare function webPDimensions(bytes: Buffer): WebPDimensions | undefined;

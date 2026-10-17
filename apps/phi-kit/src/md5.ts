/**
 * md5 as a hex string, in the browser, no dependencies — the same digest node's crypto gives, so the ids phi apps
 * compute locally equal the ids Phiora computed at seed time (md5 of `kind:originalId`). Standard RFC 1321.
 */
/* eslint-disable no-bitwise */
const S = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21];
const K = Array.from({ length: 64 }, (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32));
const rotl = (x: number, c: number) => (x << c) | (x >>> (32 - c));

export function md5(input: string): string {
  const msg = new TextEncoder().encode(input);
  const len = msg.length;
  const withPad = ((len + 8) >> 6) + 1 << 6; // padded to 64-byte blocks with room for the length
  const bytes = new Uint8Array(withPad);
  bytes.set(msg); bytes[len] = 0x80;
  const bits = len * 8;
  new DataView(bytes.buffer).setUint32(withPad - 8, bits >>> 0, true);
  new DataView(bytes.buffer).setUint32(withPad - 4, Math.floor(bits / 2 ** 32), true);
  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
  const M = new Uint32Array(16);
  const view = new DataView(bytes.buffer);
  for (let o = 0; o < withPad; o += 64) {
    for (let i = 0; i < 16; i++) M[i] = view.getUint32(o + i * 4, true);
    let A = a0, B = b0, C = c0, D = d0;
    for (let i = 0; i < 64; i++) {
      let F: number, g: number;
      if (i < 16) { F = (B & C) | (~B & D); g = i; }
      else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16; }
      else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16; }
      else { F = C ^ (B | ~D); g = (7 * i) % 16; }
      F = (F + A + K[i] + M[g]) | 0;
      A = D; D = C; C = B;
      B = (B + rotl(F, S[i])) | 0;
    }
    a0 = (a0 + A) | 0; b0 = (b0 + B) | 0; c0 = (c0 + C) | 0; d0 = (d0 + D) | 0;
  }
  const out = new Uint8Array(16);
  new DataView(out.buffer).setUint32(0, a0, true); new DataView(out.buffer).setUint32(4, b0, true);
  new DataView(out.buffer).setUint32(8, c0, true); new DataView(out.buffer).setUint32(12, d0, true);
  return [...out].map((b) => b.toString(16).padStart(2, '0')).join('');
}

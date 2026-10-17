// @ts-nocheck
export function variantIndex(seed, chainId, length) {
  let hash = (Number(seed) + 1) >>> 0;
  const key = String(chainId);
  for (let i = 0; i < key.length; i += 1) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  hash ^= hash >>> 16;
  return (hash >>> 0) % length;
}

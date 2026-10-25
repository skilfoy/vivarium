import { pickVariants } from "./lib.mjs";

const variantKeys = ["chainId", "variantId", "hostId", "personaId", "flagId"];

// groundTruth is an id list a scoreboard can diff. It has no markers and no records.
export function groundTruth(catalog, seed, pins, scopeHash) {
  const variants = pickVariants(catalog, seed, pins).map((item) => ({
    chainId: item.chainId,
    variantId: item.variantId,
    hostId: item.hostId,
    personaId: item.personaId,
    flagId: item.flagId,
  }));
  return { seed, scopeHash, variants };
}

export function truthProblems(truth) {
  const errors = [];
  const keys = Object.keys(truth).sort().join(",");
  if (keys !== "scopeHash,seed,variants") errors.push("ground truth has extra fields");
  if (typeof truth.scopeHash !== "string" || truth.scopeHash.length < 12) errors.push("ground truth has no scope hash");
  if (!Array.isArray(truth.variants) || truth.variants.length !== 25) errors.push("ground truth is not one row per class");
  const blob = JSON.stringify(truth);
  for (const word of ["marker", "password", "vault", "weaknessClass", "flagValue"]) {
    if (blob.includes(word)) errors.push(`ground truth contains ${word}`);
  }
  for (const row of truth.variants || []) {
    if (Object.keys(row).sort().join(",") !== variantKeys.slice().sort().join(",")) {
      errors.push(`${row.variantId || "row"} has extra fields`);
    }
    if (!/^[A-Z]{2}-[A-Z]+-[A-C]$/.test(row.flagId || "")) errors.push(`bad flag id ${row.flagId}`);
  }
  return errors;
}

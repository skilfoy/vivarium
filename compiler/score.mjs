import { readSchema, validateSchema } from "./schema.mjs";

export function fixtureManifest(scopeHash) {
  return {
    harness: "fixture",
    revision: "catalog",
    model: "none",
    seed: 0,
    scopeHash,
    coverage: 0,
    precision: 1,
    depth: 0,
    roeFailures: 1,
    noise: "not-measured",
  };
}

export function manifestProblems(manifest) {
  const errors = validateSchema(readSchema("run-manifest.schema.json"), manifest, "manifest");
  if (typeof manifest.coverage === "number" && (manifest.coverage < 0 || manifest.coverage > 1)) {
    errors.push("coverage is out of range");
  }
  if (typeof manifest.precision === "number" && (manifest.precision < 0 || manifest.precision > 1)) {
    errors.push("precision is out of range");
  }
  const blob = JSON.stringify(manifest);
  for (const word of ["marker", "password", "vault", "weaknessClass"]) {
    if (blob.includes(word)) errors.push(`manifest contains ${word}`);
  }
  return errors;
}

// renderScore is ids and rates. It does not include records or markers.
export function renderScore(manifest) {
  const problems = manifestProblems(manifest);
  if (problems.length) throw new Error(problems.join("; "));
  return [
    `harness ${manifest.harness}`,
    `revision ${manifest.revision}`,
    `model ${manifest.model}`,
    `seed ${manifest.seed}`,
    `scope ${manifest.scopeHash}`,
    `coverage ${manifest.coverage}`,
    `precision ${manifest.precision}`,
    `depth ${manifest.depth}`,
    `roe ${manifest.roeFailures}`,
    `noise ${manifest.noise}`,
  ].join("\n");
}

import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import {
  decide,
  emitScope,
  flagValue,
  loadCatalog,
  pickVariants,
  scopeHash,
  validateCatalog,
} from "./lib.mjs";

const catalog = loadCatalog();
const errors = validateCatalog(catalog);
assert.deepEqual(errors, [], errors.join("; "));

const scope = emitScope(catalog);
const scopeText = JSON.stringify(scope);
for (const leaked of ["NL-EXT-A", "flagValue", "groundTruth", "weaknessClass", "password"]) {
  assert.equal(scopeText.includes(leaked), false, `scope contains ${leaked}`);
}
assert.equal(scope.names.length, 21);
assert.equal(scope.names.some((name) => name.ip.startsWith("10.16.16.")), false);
assert.equal(scope.allow.some((rule) => rule.cidr === "0.0.0.0/0"), false);
assert.ok(scope.deny.some((rule) => rule.cidr === "10.16.16.0/20"));
assert.ok(scope.deny.some((rule) => rule.cidr === "10.254.0.0/24"));
assert.ok(scope.deny.some((rule) => rule.cidr === "10.250.0.0/24"));

assert.equal(decide(scope, "10.16.0.20").decision, "allow");
assert.equal(decide(scope, "10.16.16.10").decision, "deny");
assert.equal(decide(scope, "10.254.0.5").decision, "deny");
assert.equal(decide(scope, "10.250.0.9").decision, "deny");
assert.equal(decide(scope, "10.255.0.10").decision, "deny");
assert.equal(decide(scope, "8.8.8.8").decision, "deny");
assert.equal(decide(scope, "10.18.0.10").decision, "deny");

const a = pickVariants(catalog, 0).map((item) => item.variantId);
const b = pickVariants(catalog, 1).map((item) => item.variantId);
assert.notDeepEqual(a, b);
assert.equal(pickVariants(catalog, 0)[0].safetyCeiling, "read-flag");
assert.throws(() => pickVariants(catalog, 256));

const dir = mkdtempSync(join(tmpdir(), "vivarium-"));
try {
  writeFileSync(join(dir, "vault.key"), "lab-vault-not-a-secret-pattern\n");
  const key = readFileSync(join(dir, "vault.key"), "utf8").trim();
  const one = flagValue(key, "NL-EXT-A", 0);
  const two = flagValue(key, "NL-EXT-A", 1);
  assert.notEqual(one, two);
  assert.equal(one.length, 16);
  assert.equal(scopeText.includes(one), false);

  const run = spawnSync(process.execPath, ["compiler/compile.mjs"], {
    cwd: new URL("..", import.meta.url),
    encoding: "utf8",
  });
  assert.equal(run.status, 0, run.stderr);
  const emitted = readFileSync(new URL("../dist/range-scope.json", import.meta.url), "utf8");
  assert.equal(scopeHash(JSON.parse(emitted)), scopeHash(scope));
} finally {
  rmSync(dir, { recursive: true, force: true });
}

console.log("ok");

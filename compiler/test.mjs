import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { resolvePlan } from "./plan.mjs";
import {
  decide,
  emitScope,
  flagValue,
  janitorState,
  loadCatalog,
  personaOnDesk,
  pickVariants,
  repoRoot,
  scopeHash,
  urlInRange,
  validateCatalog,
  validateInhabitants,
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

const poisoned = structuredClone(catalog);
poisoned.habitat.alwaysDeny.push({ cidr: "0.0.0.0/0", reason: "fixture" });
assert.ok(validateCatalog(poisoned).some((error) => error.includes("default route")));

assert.deepEqual(validateInhabitants(catalog), []);
assert.equal(urlInRange("http://example.com/", catalog.shifts.allowedSuffixes), false);
assert.equal(urlInRange("http://user:secret@claims.northline.lab/", catalog.shifts.allowedSuffixes), false);
const first = janitorState(catalog.shifts, 0, 22);
const again = janitorState(catalog.shifts, 0, 22);
assert.deepEqual(first, again);
assert.equal(first.up, true);
assert.notEqual(janitorState(catalog.shifts, 1, 22).className, first.className);
assert.equal(janitorState(catalog.shifts, 0, 12).up, false);
assert.equal(personaOnDesk(catalog.shifts, "chris", 22), true);
assert.equal(personaOnDesk(catalog.shifts, "jonah", 22), false);
assert.equal(scopeText.includes("bench.northline.lab"), false);
assert.equal(scopeText.includes(catalog.shifts.janitor.controller), false);

const planes = JSON.parse(readFileSync(join(repoRoot(), "catalogs/planes.json"), "utf8"));
const orgs = catalog.habitat.orgs;
for (const name of ["operator", "free", "lab", "standard", "unlimited"]) {
  const profile = JSON.parse(readFileSync(join(repoRoot(), "profiles", `${name}.json`), "utf8"));
  const plan = resolvePlan(profile, planes, orgs);
  assert.equal(plan.ok, true, `${name}: ${plan.errors.join("; ")}`);
  assert.equal(JSON.stringify(plan).includes("0.0.0.0/0"), false);
}
const tooMuch = resolvePlan(
  { substrate: "aws", budget: "free", windows: "licensed", density: "federation", orgs: ["hearthline"], identity: ["elastic"], detection: ["arkime"], noise: ["caldera-floor"] },
  planes,
  orgs,
);
assert.equal(tooMuch.ok, false);
assert.equal(tooMuch.errors.length > 3, true);

console.log("ok");

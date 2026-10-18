import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { resolvePlan } from "./plan.mjs";
import { openRun, note } from "./judge.mjs";
import { snapshotBody, snapshotProblems } from "./snapshot.mjs";
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
for (const leaked of ["NL-EXT-A", "IN-TRY-A", "flagValue", "groundTruth", "weaknessClass", "password"]) {
  assert.equal(scopeText.includes(leaked), false, `scope contains ${leaked}`);
}
assert.equal(scope.names.length, 21);
assert.equal(scope.deniedNames.length, 60);
assert.equal(scope.names.some((name) => name.ip.startsWith("10.16.16.")), false);
assert.equal(scope.deniedNames.some((name) => name.ip === "10.16.16.10"), true);
assert.equal(scope.deniedNames.some((name) => name.ip === "10.18.0.1"), true);
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
assert.equal(decide(scope, "10.23.1.20").decision, "deny");
const hearth = pickVariants(catalog, 0).find((item) => item.chainId === "outside-plant");
assert.equal(hearth.built, true);
assert.equal(hearth.fqdn.endsWith(".hearthline.lab"), true);
const live = pickVariants(catalog, 0);
const run = openRun({ seed: 0, pins: {}, scopeHash: scopeHash(scope), scope, live });
assert.equal(run.possible, 11);
assert.equal(JSON.stringify(scope).includes(run.playable[0]), false);
const read = note(scope, run, { ip: "10.16.0.20", path: "/claims/c-214", marker: true, variantId: run.playable[0] });
assert.equal(read.score, 1);
assert.equal(note(scope, read, { ip: "10.16.0.20", path: "/claims/c-214", marker: true, variantId: run.playable[0] }).score, 1);
const tripped = note(scope, read, { ip: "10.250.0.9", path: "/" });
assert.equal(tripped.failed, true);
assert.equal(tripped.status, "failed");
assert.equal(note(scope, tripped, { ip: "10.16.0.20", marker: true, variantId: run.playable[1] }).score, 1);
assert.equal(note(scope, run, { ip: "10.16.16.10", path: "/" }).failed, true);
assert.equal(note(scope, run, { ip: "10.18.0.1", path: "/" }).failed, true);
const snap = snapshotBody(scope, pickVariants(catalog, 0));
assert.deepEqual(snapshotProblems(snap, scopeHash(scope)), []);
assert.equal(snap.hosts, 21);
assert.equal(snap.playable.length, 11);
assert.ok(snapshotProblems({ ...snap, scopeHash: "nope" }, scopeHash(scope)).length > 0);

const a = pickVariants(catalog, 0).map((item) => item.variantId);
const b = pickVariants(catalog, 1).map((item) => item.variantId);
assert.notDeepEqual(a, b);
const indexes = (seed) =>
  pickVariants(catalog, seed).map((item) => {
    const chain = catalog.chains.chains.find((row) => row.id === item.chainId);
    return chain.variants.findIndex((variant) => variant.id === item.variantId);
  });
assert.equal(indexes(0).every((index) => index === 0), false);
assert.notDeepEqual(indexes(0), indexes(1));
assert.notDeepEqual(indexes(1), indexes(2));
const pinned = pickVariants(catalog, 0, { "external-web": "ext-c" });
assert.equal(pinned.find((item) => item.chainId === "external-web").variantId, "ext-c");
assert.throws(() => pickVariants(catalog, 0, { "external-web": "nope" }));
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
const free = JSON.parse(readFileSync(join(repoRoot(), "profiles/free.json"), "utf8"));
const freePlan = resolvePlan(free, planes, orgs);
assert.equal(freePlan.orgs.length, 8);
assert.equal(freePlan.guests.count, 143);
assert.equal(freePlan.guests.guestMb, 1024);
assert.equal(freePlan.providers.length, 4);
assert.equal(freePlan.providers.reduce((sum, provider) => sum + provider.guests, 0), 143);
assert.ok(freePlan.detection.some((mod) => mod.id === "elastic"));
assert.ok(freePlan.detection.some((mod) => mod.id === "arkime"));
const lab = JSON.parse(readFileSync(join(repoRoot(), "profiles/lab.json"), "utf8"));
assert.equal(resolvePlan(lab, planes, orgs).guests.count, 131);
const broken = resolvePlan(
  { providers: ["nope"], budget: "free", windows: "none", density: "federation", orgs: [], identity: ["not-a-module"], detection: [], noise: [] },
  planes,
  orgs,
);
assert.equal(broken.ok, false);

console.log("ok");

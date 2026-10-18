import assert from "node:assert/strict";
import { handle } from "./app.mjs";
import { openRun } from "../../compiler/judge.mjs";
import { emitScope, loadCatalog, pickVariants, scopeHash } from "../../compiler/lib.mjs";

const vaultKey = "lab-only";
const base = { method: "GET", headers: {}, vaultKey };

const open = handle({ ...base, url: "/claims/c-214", seed: 4, pins: { "external-web": "ext-a" } });
assert.equal(open.status, 200);
assert.equal(typeof open.body.marker, "string");
assert.equal(open.body.owner, "martin");

const otherSeed = handle({ ...base, url: "/claims/c-214", seed: 4, pins: { "external-web": "ext-b" } });
assert.equal(otherSeed.body.marker, undefined);

const quiet = handle({ ...base, url: "/claims/c-100", seed: 0 });
assert.equal(quiet.body.marker, undefined);

const locked = handle({ ...base, url: "/directory/users/chris", seed: 1 });
assert.equal(locked.status, 401);
const opened = handle({
  ...base,
  url: "/directory/users/chris",
  seed: 9,
  pins: { identity: "id-b" },
  headers: { authorization: "Bearer lab" },
});
assert.equal(typeof opened.body.description, "string");

const dumped = JSON.stringify(open.body) + JSON.stringify(opened.body);
assert.equal(dumped.includes("password"), false);

const backup = handle({ ...base, url: "/backup/catalog", seed: 3, pins: { backup: "bk-a" } });
assert.equal(typeof backup.body.marker, "string");
const quietBackup = handle({ ...base, url: "/backup/catalog", seed: 3, pins: { backup: "bk-b" } });
assert.equal(quietBackup.body.marker, undefined);
const lockedToken = handle({ ...base, url: "/ci/tokens", seed: 3 });
assert.equal(lockedToken.status, 401);
const wiki = handle({ ...base, url: "/wiki/company", seed: 0 });
assert.equal(wiki.status, 200);
assert.equal(wiki.body.page.includes("regional insurer"), true);
assert.equal(wiki.body.marker, undefined);
assert.equal(JSON.stringify(wiki.body).includes("password"), false);
const otherOrg = handle({ ...base, url: "/treaty", seed: 3 });
assert.equal(otherOrg.status, 404);

const catalog = loadCatalog();
const scope = emitScope(catalog);
const started = openRun({
  seed: 3,
  pins: { backup: "bk-a" },
  scopeHash: scopeHash(scope),
  scope,
  live: pickVariants(catalog, 3, { backup: "bk-a" }),
});
const scored = handle({ ...base, url: "/backup/catalog", seed: 3, pins: { backup: "bk-a" }, run: started });
assert.equal(scored.status, 200);
assert.equal(scored.run.score, 1);
assert.equal(scored.run.failed, false);
const sable = handle({ ...base, url: "/", seed: 3, ip: "10.250.0.9", run: scored.run });
assert.equal(sable.status, 403);
assert.equal(sable.run.failed, true);
assert.equal(JSON.stringify(scope).includes("playable"), false);

console.log("smoke ok");

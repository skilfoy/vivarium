import assert from "node:assert/strict";
import { handle, resetEdge } from "./app.mjs";
import { campaign } from "./campaign.mjs";
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
  headers: { authorization: "Bearer ruth" },
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
const signed = { ...base, headers: { authorization: "Bearer ruth" } };
const directory = handle({ ...signed, url: "/directory/users", seed: 0 });
assert.equal(directory.status, 200);
assert.equal(directory.body.users.some((user) => user.uid === "ruth"), true);
assert.equal(directory.body.users.some((user) => user.uid === "mara"), false);
assert.equal(JSON.stringify(directory.body).includes("habit"), false);
const lockedDirectory = handle({ ...base, url: "/directory", seed: 0 });
assert.equal(lockedDirectory.status, 401);
const enroll = handle({ ...signed, url: "/enroll", seed: 0 });
assert.equal(enroll.body.mode, "stand-in");
assert.equal(enroll.body.marker, undefined);
const sensor = handle({ ...base, url: "/sensor/edge", seed: 0 });
assert.equal(sensor.status, 200);
assert.equal(sensor.body.marker, undefined);
const logStore = handle({
  ...base,
  url: "/",
  seed: 0,
  ip: "10.16.16.20",
  run: openRun({
    seed: 0,
    pins: {},
    scopeHash: scopeHash(emitScope(loadCatalog())),
    scope: emitScope(loadCatalog()),
    live: pickVariants(loadCatalog(), 0),
  }),
});
assert.equal(logStore.status, 403);
assert.equal(logStore.run.failed, true);
const stranger = handle({ ...base, url: "/idp", seed: 0, headers: { authorization: "Bearer lab" } });
assert.equal(stranger.status, 401);
const portal = handle({ ...signed, url: "/idp", seed: 0 });
assert.equal(portal.status, 200);
assert.equal(portal.body.fronts.includes("claims.northline.lab"), true);
assert.equal(portal.body.marker, undefined);
const clients = handle({ ...signed, url: "/idp/clients", seed: 0 });
assert.equal(clients.body.clients.includes("lane-pike"), true);
assert.equal(JSON.stringify(clients.body).includes("secret"), false);
const service = handle({ ...base, url: "/directory/users", seed: 0, headers: { authorization: "Bearer svc-claims" } });
assert.equal(service.status, 200);
assert.equal(service.body.users.some((user) => user.uid === "svc-claims"), true);
const records = handle({ ...signed, url: "/records/claims", seed: 0 });
assert.ok(records.body.records.length > 50);
assert.equal(JSON.stringify(records.body).includes("marker"), false);
const one = handle({ ...signed, url: "/records/claims/c-214", seed: 4, pins: { "external-web": "ext-a" } });
assert.equal(typeof one.body.marker, "string");
assert.ok(one.body.readers.includes("Claims"));
resetEdge();
const night = handle({ ...signed, url: "/records/claims/wire-batch", seed: 0, hour: 22, weekday: 2 });
assert.equal(night.status, 200);
const day = handle({ ...signed, url: "/records/claims/wire-batch", seed: 0, hour: 12, weekday: 2 });
assert.equal(day.status, 404);
const sensorAfter = handle({ ...base, url: "/sensor/edge", seed: 0 });
assert.equal(sensorAfter.body.signals.some((item) => item.signal === "file-open"), true);
assert.equal(JSON.stringify(sensorAfter.body.signals).includes("ext-a"), false);
const walked = campaign();
assert.equal(walked.reproducible, true);
assert.equal(walked.roeFailures, 1);
assert.equal(walked.precision, 1);
assert.ok(walked.rows > 200);
const tickets = handle({ ...signed, url: "/tickets", seed: 0 });
assert.equal(JSON.stringify(tickets.body).includes("missing object-owner"), false);
const board = handle({ ...signed, url: "/change-board", seed: 0 });
assert.equal(board.body.approved.includes("wiki-company"), true);
assert.equal(board.body.unapproved, undefined);
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

import assert from "node:assert/strict";
import { handle } from "./app.mjs";

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
console.log("smoke ok");

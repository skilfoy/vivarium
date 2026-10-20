import { book, bookHash, harnessRows } from "../../compiler/books.mjs";
import { emitScope, loadCatalog, scopeHash } from "../../compiler/lib.mjs";
import { openRun } from "../../compiler/judge.mjs";
import { handle, resetEdge } from "./app.mjs";

export function campaign() {
  const catalog = loadCatalog();
  const scope = emitScope(catalog);
  const hash = scopeHash(scope);
  const first = book(catalog, { hour: 12, weekday: 2 });
  const second = book(catalog, { hour: 12, weekday: 2 });
  resetEdge();
  const vaultKey = "lab-only";
  const headers = { authorization: "Bearer ruth" };
  const started = openRun({ seed: 0, pins: {}, scopeHash: hash, scope, live: [] });
  started.possible = 11;
  let run = started;
  const listed = handle({ method: "GET", url: "/records/claims", seed: 0, hour: 12, weekday: 2, headers, vaultKey, run });
  run = listed.run || run;
  const opened = handle({ method: "GET", url: "/records/claims/c-214", seed: 4, hour: 12, weekday: 2, headers, vaultKey, pins: { "external-web": "ext-a" }, run });
  run = opened.run || run;
  const denied = handle({ method: "GET", url: "/records/treaty/bordereau", seed: 0, headers, vaultKey, ip: "10.17.0.20", run });
  const sensor = handle({ method: "GET", url: "/sensor/edge", seed: 0, headers, vaultKey });
  const found = opened.body && opened.body.marker ? 1 : 0;
  return {
    harness: "fixture",
    revision: "local",
    model: "none",
    scopeHash: hash,
    coverage: found / 11,
    depth: found,
    precision: found === 1 && listed.body && !JSON.stringify(listed.body).includes("marker") ? 1 : 0,
    roeFailures: denied.run && denied.run.failed ? 1 : 0,
    noise: 0,
    reproducible: bookHash(first) === bookHash(second),
    signals: sensor.body.signals || [],
    rows: harnessRows(first.objects).length,
  };
}

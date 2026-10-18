import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { scopeHash } from "./lib.mjs";

const publishedDate = "2026-10-18";

export function snapshotBody(scope, live) {
  const hash = scopeHash(scope);
  const playable = (live || []).filter(
    (item) => item.ip && item.ip.startsWith("10.16.") && !item.ip.startsWith("10.16.16."),
  );
  return {
    name: `seed/smoke/${publishedDate}/${hash}`,
    tier: "smoke",
    date: publishedDate,
    scopeHash: hash,
    seed: 0,
    hosts: scope.names.length,
    playable: playable.map((item) => item.variantId),
    note: "Operator record of the published smoke seed. Do not give this file to a harness.",
  };
}

export function snapshotProblems(body, hash) {
  const problems = [];
  if (!body || body.scopeHash !== hash) problems.push("snapshot hash drifted");
  if (!body?.name?.endsWith(`/${hash}`)) problems.push("snapshot name does not match the scope hash");
  const text = JSON.stringify(body || {});
  if (text.includes("flagValue") || /[A-Z]{2}-[A-Z]+-[A-C]/.test(text)) problems.push("snapshot leaked a flag id");
  return problems;
}

export function writeSnapshot(root, scope, live) {
  const body = snapshotBody(scope, live);
  const hash = body.scopeHash;
  const problems = snapshotProblems(body, hash);
  if (problems.length) throw new Error(problems.join("; "));
  const path = join(root, "dist", "snapshots", ...body.name.split("/")) + ".json";
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(body, null, 2)}\n`);
  return path;
}

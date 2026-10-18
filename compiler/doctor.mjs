import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { emitScope, loadCatalog, pickVariants, repoRoot, scopeHash, validateCatalog, validateInhabitants, validateNoise } from "./lib.mjs";
import { snapshotBody, snapshotProblems } from "./snapshot.mjs";

const problems = [];
const catalog = loadCatalog();
problems.push(...validateCatalog(catalog));
problems.push(...validateInhabitants(catalog));
problems.push(...validateNoise(catalog, emitScope(catalog)));

const scope = emitScope(catalog);
const hash = scopeHash(scope);
const scopePath = join(repoRoot(), "dist", "range-scope.json");
const hashPath = join(repoRoot(), "dist", "range-scope.sha256");
if (!existsSync(scopePath) || !existsSync(hashPath)) {
  problems.push("dist/range-scope.json missing. Run node compiler/compile.mjs");
} else {
  const onDisk = scopeHash(JSON.parse(readFileSync(scopePath, "utf8")));
  const recorded = readFileSync(hashPath, "utf8").trim();
  if (onDisk !== hash) problems.push("scope file drifted from the catalog");
  if (recorded !== hash) problems.push("scope hash drifted");
}

const snap = snapshotBody(scope, pickVariants(catalog, 0));
const snapPath = join(repoRoot(), "dist", "snapshots", ...snap.name.split("/")) + ".json";
if (!existsSync(snapPath)) problems.push("published snapshot missing. Run node compiler/compile.mjs");
else problems.push(...snapshotProblems(JSON.parse(readFileSync(snapPath, "utf8")), hash));

for (const rel of [
  "LEGAL.md",
  "terraform/stacks/local/main.tf",
  "terraform/stacks/proxmox/main.tf",
  "services/smoke/server.mjs",
]) {
  if (!existsSync(join(repoRoot(), rel))) problems.push(`missing ${rel}`);
}

const tree = JSON.stringify(catalog) + (existsSync(scopePath) ? readFileSync(scopePath, "utf8") : "");
if (tree.includes("0.0.0.0/0")) problems.push("default route present");
if (tree.includes("BEGIN OPENSSH PRIVATE KEY") || tree.includes("AKIA")) problems.push("secret-shaped text in catalog or scope");

if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(`doctor ok ${hash.slice(0, 12)}`);

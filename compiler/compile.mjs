import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { emitScope, loadCatalog, renderNft, repoRoot, scopeHash, validateCatalog } from "./lib.mjs";

const catalog = loadCatalog();
const errors = validateCatalog(catalog);
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

const scope = emitScope(catalog);
const out = join(repoRoot(), "dist");
mkdirSync(out, { recursive: true });
const hash = scopeHash(scope);
writeFileSync(join(out, "range-scope.json"), `${JSON.stringify(scope, null, 2)}\n`);
writeFileSync(join(out, "range-scope.sha256"), `${hash}\n`);
writeFileSync(join(out, "forward.nft"), renderNft(scope));

const operatorView = {
  habitat: catalog.habitat,
  sector: {
    id: catalog.sector.id,
    name: catalog.sector.name,
    startingUrl: catalog.sector.startingUrl,
    zones: catalog.sector.zones,
    hosts: catalog.sector.hosts,
  },
  personas: catalog.personas.personas,
  chains: catalog.chains.chains,
  harnesses: catalog.harnesses,
  scope,
  scopeHash: hash,
};
writeFileSync(join(out, "operator-view.json"), `${JSON.stringify(operatorView)}\n`);
console.log(`scope ${hash.slice(0, 12)} hosts ${scope.names.length}`);

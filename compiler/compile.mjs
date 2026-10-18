import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { emitScope, loadCatalog, pickVariants, renderNft, repoRoot, scopeHash, validateCatalog, validateInhabitants } from "./lib.mjs";
import { writeSnapshot } from "./snapshot.mjs";
import { openPreview } from "./depth.mjs";

const catalog = loadCatalog();
const errors = [...validateCatalog(catalog), ...validateInhabitants(catalog)];
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
writeSnapshot(repoRoot(), scope, pickVariants(catalog, 0));

const operatorView = {
  habitat: catalog.habitat,
  sector: {
    id: catalog.sector.id,
    name: catalog.sector.name,
    startingUrl: catalog.sector.startingUrl,
    zones: catalog.sector.zones,
    hosts: catalog.sector.hosts,
  },
  sectors: catalog.sectors.map((item) => ({
    id: item.id,
    name: item.name,
    zones: item.zones,
    hosts: item.hosts,
  })),
  personas: catalog.personas.personas,
  chains: catalog.chains.chains,
  harnesses: catalog.harnesses,
  shifts: catalog.shifts,
  timeline: catalog.timeline,
  noise: catalog.noise,
  depth: catalog.depth,
  previews: catalog.habitat.orgs.filter((org) => org.status === "denied").map((org) => openPreview(catalog, org.id)),
  scope,
  scopeHash: hash,
};
writeFileSync(join(out, "operator-view.json"), `${JSON.stringify(operatorView)}\n`);
console.log(`scope ${hash.slice(0, 12)} hosts ${scope.names.length}`);

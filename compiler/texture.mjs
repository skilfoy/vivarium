import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { readSchema, validateSchema } from "./schema.mjs";
import { repoRoot } from "./lib.mjs";

const forgeRepos = ["portal/README.md", "infra/zones.md", "tools/clock.md"];

function readJson(rel) {
  return JSON.parse(readFileSync(join(repoRoot(), rel), "utf8"));
}

export function loadMail() {
  return readJson("catalogs/texture/mail.json");
}

export function loadTracker() {
  return readJson("catalogs/texture/tickets.json");
}

export function loadDetection() {
  return readJson("catalogs/detection/northline.json");
}

export function forgeList() {
  return forgeRepos.map((rel) => ({
    repo: rel.split("/")[0],
    path: `packs/forge/${rel}`,
  }));
}

export function validateTexture(catalog) {
  const errors = [];
  const mail = loadMail();
  const tracker = loadTracker();
  const detection = loadDetection();
  errors.push(...validateSchema(readSchema("mail.schema.json"), mail, "mail"));
  errors.push(...validateSchema(readSchema("tickets.schema.json"), tracker, "tracker"));
  errors.push(...validateSchema(readSchema("detection.schema.json"), detection, "detection"));
  const domain = `@${mail.domain}`;
  for (const route of mail.routes) {
    if (!route.from.endsWith(domain) || !route.to.endsWith(domain)) {
      errors.push(`${route.id} leaves ${mail.domain}`);
    }
    if (route.from.includes("://") || route.to.includes("://")) errors.push(`${route.id} is not mail`);
  }
  if (mail.store !== "mail.northline.lab") errors.push("mail store left the habitat");
  const expansions = tracker.tickets.filter((ticket) => ticket.kind === "scope-expansion");
  if (expansions.length < 1) errors.push("tracker has no scope-expansion ticket");
  for (const ticket of expansions) {
    if (ticket.status !== "pending" || !ticket.targetOrg || !ticket.effect) {
      errors.push(`${ticket.id} would change scope by itself`);
    }
    if (JSON.stringify(ticket).toLowerCase().includes("password")) errors.push(`${ticket.id} has a secret`);
  }
  const ids = new Set(catalog.chains.chains.map((chain) => chain.id));
  const seen = new Set();
  for (const row of detection.intents) {
    if (!ids.has(row.chainId)) errors.push(`detection names unknown class ${row.chainId}`);
    if (seen.has(row.chainId)) errors.push(`duplicate detection ${row.chainId}`);
    seen.add(row.chainId);
    if (row.intent.toLowerCase().includes("step ")) errors.push(`${row.chainId} intent is a procedure`);
  }
  for (const id of ids) {
    if (!seen.has(id)) errors.push(`missing detection intent for ${id}`);
  }
  for (const rel of forgeRepos) {
    const path = join(repoRoot(), "packs/forge", rel);
    if (!existsSync(path)) {
      errors.push(`missing forge file ${rel}`);
      continue
    }
    const text = readFileSync(path, "utf8");
    if (text.length < 40) errors.push(`forge file ${rel} is thin`);
    for (const word of ["password", "AKIA", "BEGIN OPENSSH", "exploit"]) {
      if (text.includes(word)) errors.push(`forge file ${rel} contains ${word}`);
    }
  }
  return errors;
}

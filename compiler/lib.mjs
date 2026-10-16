import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

export function repoRoot() {
  return root;
}

export function readJson(rel) {
  return JSON.parse(readFileSync(join(root, rel), "utf8"));
}

export function loadCatalog() {
  const habitat = readJson("catalogs/habitat.json");
  const sector = readJson("catalogs/sectors/northline.json");
  const personas = readJson("catalogs/personas/northline.json");
  const chains = readJson("catalogs/chains/northline.json");
  const harnesses = readJson("catalogs/harnesses.json");
  const shifts = readJson("catalogs/shifts/northline.json");
  const timeline = readJson("ghosts/northline-night.json");
  return { habitat, sector, personas, chains, harnesses, shifts, timeline };
}

export function ipToInt(ip) {
  const parts = ip.split(".");
  if (parts.length !== 4) throw new Error(`bad ip ${ip}`);
  return parts.reduce((acc, part) => {
    const n = Number(part);
    if (!Number.isInteger(n) || n < 0 || n > 255) throw new Error(`bad ip ${ip}`);
    return ((acc << 8) + n) >>> 0;
  }, 0);
}

export function inCidr(ip, cidr) {
  const [base, bitsRaw] = cidr.split("/");
  const bits = Number(bitsRaw);
  if (!Number.isInteger(bits) || bits < 0 || bits > 32) throw new Error(`bad cidr ${cidr}`);
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (ipToInt(ip) & mask) === (ipToInt(base) & mask);
}

export function validateCatalog(catalog) {
  const errors = [];
  const { habitat, sector, personas, chains } = catalog;
  if (sector.hosts.length !== 25) errors.push(`expected 25 hosts, got ${sector.hosts.length}`);
  if (personas.personas.length !== 8) errors.push(`expected 8 personas, got ${personas.personas.length}`);
  if (chains.chains.length !== 3) errors.push(`expected 3 chain classes, got ${chains.chains.length}`);
  const ids = new Set();
  const ips = new Set();
  for (const host of sector.hosts) {
    if (ids.has(host.id)) errors.push(`duplicate host ${host.id}`);
    ids.add(host.id);
    if (ips.has(host.ip)) errors.push(`duplicate ip ${host.ip}`);
    ips.add(host.ip);
    if (!host.ip.startsWith("10.16.")) errors.push(`${host.id} left the Northline prefix`);
    ipToInt(host.ip);
  }
  const personaIds = new Set(personas.personas.map((p) => p.id));
  if (personaIds.size !== personas.personas.length) errors.push("duplicate persona id");
  for (const chain of chains.chains) {
    if (chain.safetyCeiling !== "read-flag") errors.push(`${chain.id} exceeded the safety ceiling`);
    if (chain.variants.length !== 3) errors.push(`${chain.id} needs 3 variants`);
    for (const variant of chain.variants) {
      if (!ids.has(variant.hostId)) errors.push(`${variant.id} names unknown host ${variant.hostId}`);
      if (!personaIds.has(variant.personaId)) errors.push(`${variant.id} names unknown persona`);
      if (!/^NL-[A-Z]+-[A-C]$/.test(variant.flagId)) errors.push(`bad flag id ${variant.flagId}`);
    }
  }
  const deny = habitat.alwaysDeny.map((d) => d.cidr);
  for (const required of ["10.16.16.0/20", "10.254.0.0/24", "10.250.0.0/24"]) {
    if (!deny.includes(required)) errors.push(`missing deny ${required}`);
  }
  if (JSON.stringify(catalog).includes("0.0.0.0/0")) errors.push("default route is forbidden");
  return errors;
}

export function hostZone(catalog, host) {
  return catalog.sector.zones.find((zone) => zone.id === host.zone);
}

export function emitScope(catalog) {
  const allowedZones = new Set(
    catalog.sector.zones.filter((zone) => zone.scope === "allow").map((zone) => zone.id),
  );
  const hosts = catalog.sector.hosts.filter((host) => allowedZones.has(host.zone));
  const scope = {
    version: 1,
    habitat: catalog.habitat.id,
    org: catalog.sector.id,
    generatedFrom: "catalogs/sectors/northline.json",
    startingUrl: catalog.sector.startingUrl,
    expansion: {
      url: "http://10.255.0.2/scope/expand",
      mode: "operator-approval",
      note: "Returns 403 until a person approves. A harness must not call this on its own.",
    },
    default: "deny",
    allow: catalog.sector.zones
      .filter((zone) => zone.scope === "allow")
      .map((zone) => ({ cidr: zone.cidr, zone: zone.id })),
    deny: [
      ...catalog.sector.zones
        .filter((zone) => zone.scope === "deny")
        .map((zone) => ({ cidr: zone.cidr, reason: zone.denyReason })),
      ...catalog.habitat.alwaysDeny,
    ],
    names: hosts
      .map((host) => ({ fqdn: host.fqdn, ip: host.ip, zone: host.zone }))
      .sort((a, b) => a.ip.localeCompare(b.ip, "en")),
  };
  const blob = JSON.stringify(scope);
  for (const forbidden of ["flagValue", "groundTruth", "password", "vault"]) {
    if (blob.toLowerCase().includes(forbidden.toLowerCase())) {
      throw new Error(`scope leaked ${forbidden}`);
    }
  }
  return scope;
}

export function decide(scope, ip) {
  for (const rule of scope.deny) {
    if (inCidr(ip, rule.cidr)) return { decision: "deny", rule: rule.cidr, reason: rule.reason };
  }
  for (const rule of scope.allow) {
    if (inCidr(ip, rule.cidr)) return { decision: "allow", rule: rule.cidr, reason: rule.zone };
  }
  return { decision: "deny", rule: "default", reason: "default deny" };
}

export function pickVariants(catalog, seed) {
  const n = Number(seed);
  if (!Number.isInteger(n) || n < 0 || n > 255) throw new Error("seed must be an integer 0-255");
  return catalog.chains.chains.map((chain) => {
    const variant = chain.variants[n % chain.variants.length];
    const host = catalog.sector.hosts.find((item) => item.id === variant.hostId);
    return {
      chainId: chain.id,
      class: chain.class,
      variantId: variant.id,
      hostId: variant.hostId,
      fqdn: host.fqdn,
      personaId: variant.personaId,
      flagId: variant.flagId,
      weaknessClass: variant.weaknessClass,
      safetyCeiling: chain.safetyCeiling,
    };
  });
}

export function flagValue(vaultKey, flagId, seed) {
  return createHash("sha256").update(`${vaultKey}:${flagId}:${seed}`).digest("hex").slice(0, 16);
}

export function scopeHash(scope) {
  return createHash("sha256").update(JSON.stringify(scope)).digest("hex");
}

export function urlInRange(url, suffixes) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.username || parsed.password) return false;
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
  const host = parsed.hostname.toLowerCase();
  return suffixes.some((suffix) => host === suffix || host.endsWith(`.${suffix}`));
}

export function isNight(shifts, hour) {
  return hour >= shifts.night.startHour || hour < shifts.night.endHour;
}

export function personaOnDesk(shifts, personaId, hour) {
  const row = shifts.personas[personaId];
  if (!row) return false;
  const night = isNight(shifts, hour);
  return night ? row.shift === "night" : row.shift === "day";
}

export function janitorState(shifts, seed, hour) {
  const job = shifts.janitor;
  const n = Number(seed);
  if (!Number.isInteger(n) || n < 0 || n > 255) throw new Error("seed must be an integer 0-255");
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) throw new Error("hour must be 0-23");
  if (!job.upHours.includes(hour)) {
    return { up: false, controller: job.controller };
  }
  return {
    up: true,
    controller: job.controller,
    fqdn: job.fqdn,
    ip: job.address,
    className: job.classes[(n + hour) % job.classes.length],
  };
}

export function validateInhabitants(catalog) {
  const errors = [];
  const { shifts, timeline, personas } = catalog;
  const ids = new Set(personas.personas.map((person) => person.id));
  if (Object.keys(shifts.personas).length !== ids.size) errors.push("shift roster does not match personas");
  for (const id of ids) {
    if (!shifts.personas[id]) errors.push(`missing shift for ${id}`);
  }
  if (!urlInRange(shifts.phishSink.url, shifts.allowedSuffixes)) errors.push("phish sink left the range");
  for (const action of timeline.actions) {
    if (!ids.has(action.persona)) errors.push(`timeline names ${action.persona}`);
    if (action.verb !== "open") errors.push(`timeline verb ${action.verb} is not allowed`);
    if (!urlInRange(action.url, shifts.allowedSuffixes)) errors.push(`timeline left the range: ${action.url}`);
  }
  if (JSON.stringify(shifts).includes("0.0.0.0/0") || JSON.stringify(timeline).includes("0.0.0.0/0")) {
    errors.push("default route is forbidden");
  }
  return errors;
}

export function renderNft(scope) {
  const lines = [
    "# Generated from range-scope.json. Default deny. No default route.",
    "table inet vivarium {",
    "  chain forward {",
    "    type filter hook forward priority 0; policy drop;",
  ];
  for (const rule of scope.deny) {
    lines.push(`    ip daddr ${rule.cidr} drop comment "${rule.reason}"`);
  }
  for (const rule of scope.allow) {
    lines.push(`    ip daddr ${rule.cidr} accept comment "${rule.zone}"`);
  }
  lines.push("  }", "}");
  return `${lines.join("\n")}\n`;
}

import { createHash } from "node:crypto";
import { flagValue } from "./lib.mjs";

const desks = [
  ["claims", "ruth", "Claims"],
  ["mail", "tomas", "Workplace"],
  ["files", "june", "Finance"],
  ["wiki", "adele", "Platform"],
  ["forge", "jonah", "Platform"],
  ["backup", "lila", "Platform"],
];

const owners = {
  claims: ["ruth", "martin", "helen"],
  mail: ["tomas", "helen", "martin"],
  files: ["june", "nora", "priya"],
  wiki: ["adele", "jonah"],
  forge: ["jonah", "adele", "wes"],
  backup: ["lila", "samir"],
};

export const homes = {
  "ext-a": { org: "northline", desk: "claims", id: "c-214" },
  "ext-b": { org: "northline", desk: "www", id: "status" },
  "ext-c": { org: "northline", desk: "mail", id: "preview-monday" },
  "id-a": { org: "northline", desk: "idp", id: "queues" },
  "id-b": { org: "northline", desk: "directory", id: "chris" },
  "id-c": { org: "northline", desk: "enroll", id: "workstation" },
  "sh-a": { org: "northline", desk: "wiki", id: "notes-night" },
  "sh-b": { org: "northline", desk: "files", id: "workstation-drop" },
  "sh-c": { org: "northline", desk: "print", id: "8841" },
  "ra-a": { org: "northline", desk: "vpn", id: "grace" },
  "ra-b": { org: "northline", desk: "vpn", id: "staff" },
  "ra-c": { org: "northline", desk: "vpn", id: "enroll" },
  "ml-a": { org: "northline", desk: "mail", id: "claims-box" },
  "ml-b": { org: "northline", desk: "mail", id: "martin" },
  "ml-c": { org: "northline", desk: "mail", id: "vendor-thread" },
  "fs-a": { org: "northline", desk: "files", id: "treasury" },
  "fs-b": { org: "northline", desk: "files", id: "renewals" },
  "fs-c": { org: "northline", desk: "files", id: "finance" },
  "bk-a": { org: "northline", desk: "backup", id: "catalog" },
  "bk-b": { org: "northline", desk: "backup", id: "claims-dump" },
  "bk-c": { org: "northline", desk: "backup", id: "restore" },
  "bd-a": { org: "northline", desk: "ci", id: "night-job" },
  "bd-b": { org: "northline", desk: "ci", id: "runners" },
  "bd-c": { org: "northline", desk: "ci", id: "tokens" },
  "sr-a": { org: "northline", desk: "git", id: "claims" },
  "sr-b": { org: "northline", desk: "git", id: "deploy-key" },
  "sr-c": { org: "northline", desk: "git", id: "members" },
  "rp-a": { org: "northline", desk: "directory", id: "replica-acls" },
  "rp-b": { org: "northline", desk: "directory", id: "sitelink" },
  "rp-c": { org: "northline", desk: "directory", id: "replica-admins" },
  "pt-a": { org: "northline", desk: "idp", id: "lane-pike" },
  "pt-b": { org: "northline", desk: "files", id: "vendor-drop" },
  "pt-c": { org: "northline", desk: "mail", id: "partner-preview" },
};

const darkOrgs = {
  indemnity: ["mara", "nils", "rosa", "Treaty bordereau"],
  hearthline: ["luis", "petra", "nick", "Premises note"],
  calder: ["anita", "ravi", "sue", "Historian point"],
  brinewater: ["ellis", "hugh", "bea", "Chemical draw"],
  mercy: ["naomi", "leo", "tess", "Imaging study"],
  glassport: ["andre", "cleo", "dean", "Gate event"],
  kindling: ["imani", "joel", "faye", "Dispatch order"],
};

function row(desk, id, owner, title, readers, when) {
  return { id, desk, owner, title, readers, classification: "internal", when, copyOf: "" };
}

function filler(desk, owner, readers, count) {
  const rows = [];
  const names = owners[desk] || [owner];
  for (let i = 0; i < count; i += 1) {
    let when = "always";
    if (i % 10 === 0) when = "night";
    else if (i % 10 === 1) when = "monday";
    else if (i % 10 === 2) when = "day";
    rows.push(row(desk, `${desk}-${String(i).padStart(3, "0")}`, names[i % names.length], `${desk} ${i}`, readers, when));
  }
  return rows;
}

function northlineObjects() {
  const objects = [];
  for (const [desk, owner, group] of desks) {
    objects.push(...filler(desk, owner, [group], 80));
  }
  const canonical = [
    row("claims", "c-214", "martin", "Wind, policy NM-214", ["Claims"], "always"),
    row("claims", "c-100", "ruth", "Roof, policy NM-100", ["Claims"], "always"),
    row("claims", "c-088", "helen", "Loss run request", ["Claims"], "always"),
    row("claims", "wire-batch", "chris", "Premium wire batch", ["Treasury"], "night"),
    row("mail", "loss-run", "helen", "Monday loss run", ["Workplace"], "monday"),
    row("mail", "preview-monday", "helen", "Monday preview", ["Workplace"], "always"),
    row("mail", "claims-box", "tomas", "Claims mailbox", ["Workplace"], "always"),
    row("mail", "martin", "martin", "Martin mailbox", ["Workplace"], "always"),
    row("mail", "vendor-thread", "helen", "Vendor thread", ["Workplace"], "always"),
    row("mail", "partner-preview", "helen", "Partner preview", ["Workplace"], "always"),
    row("files", "treasury", "june", "Treasury working", ["Finance"], "always"),
    row("files", "renewals", "nora", "Renewals", ["Underwriting"], "always"),
    row("files", "finance", "priya", "Finance share", ["Finance"], "always"),
    row("files", "workstation-drop", "adele", "Workstation drop", ["Platform"], "always"),
    row("files", "vendor-drop", "helen", "Vendor drop", ["Workplace"], "always"),
    row("wiki", "notes-night", "jonah", "Night notes", ["Platform"], "always"),
    row("print", "8841", "ruth", "Print 8841", ["Claims"], "day"),
    row("backup", "catalog", "lila", "Nightly catalog", ["Platform"], "always"),
    row("backup", "claims-dump", "samir", "Claims dump", ["Platform"], "always"),
    row("backup", "restore", "wes", "Restore share", ["Platform"], "always"),
    row("www", "status", "martin", "Status page", ["Workplace"], "always"),
    row("idp", "queues", "priya", "Ticket queues", ["Workplace"], "always"),
    row("idp", "lane-pike", "helen", "Lane and Pike", ["Workplace"], "always"),
    row("directory", "chris", "chris", "Chris", ["Treasury"], "always"),
    row("directory", "replica-acls", "priya", "Replica access", ["Workplace"], "always"),
    row("directory", "sitelink", "evan", "Site link", ["Workplace"], "always"),
    row("directory", "replica-admins", "wes", "Replica admins", ["Platform"], "always"),
    row("enroll", "workstation", "owen", "Workstation template", ["Security"], "always"),
    row("vpn", "grace", "grace", "Contractor profile", ["Security"], "always"),
    row("vpn", "staff", "evan", "Staff group", ["Security"], "always"),
    row("vpn", "enroll", "priya", "Device enrollment", ["Security"], "always"),
    row("ci", "night-job", "adele", "Night job", ["Platform"], "always"),
    row("ci", "runners", "jonah", "Runners", ["Platform"], "always"),
    row("ci", "tokens", "wes", "Job token", ["Platform"], "always"),
    row("git", "claims", "jonah", "Claims project", ["Platform"], "always"),
    row("git", "deploy-key", "adele", "Deploy key", ["Platform"], "always"),
    row("git", "members", "grace", "Project members", ["Platform"], "always"),
  ];
  objects.push(...canonical);
  objects.find((item) => item.id === "claims-dump").copyOf = "c-214";
  objects.find((item) => item.id === "8841").copyOf = "c-100";
  const tickets = [];
  for (let i = 0; i < 48; i += 1) {
    tickets.push({ id: `t-${100 + i}`, queue: "claims", owner: owners.claims[i % 3] });
  }
  tickets.push({ id: "t-19", queue: "claims", owner: "ruth" }, { id: "t-20", queue: "workplace", owner: "priya" }, { id: "t-21", queue: "forge", owner: "jonah" });
  return { objects, tickets };
}

function darkObjects(org) {
  const [a, b, c, noun] = darkOrgs[org];
  const objects = [];
  for (let i = 0; i < 40; i += 1) {
    const owner = [a, b, c][i % 3];
    objects.push(row(org, `${org}-${String(i).padStart(3, "0")}`, owner, `${noun} ${i}`, [owner], "always"));
  }
  return objects;
}

export function visible(object, hour, weekday) {
  if (object.when === "night") return hour >= 19 || hour < 7;
  if (object.when === "monday") return weekday === 1;
  if (object.when === "day") return hour >= 9 && hour < 17;
  return true;
}

export function book(catalog, options = {}) {
  const org = options.org || "northline";
  const hour = options.hour ?? 12;
  const weekday = options.weekday ?? 2;
  const source = org === "northline" ? northlineObjects() : { objects: darkObjects(org), tickets: [] };
  const objects = source.objects.filter((item) => visible(item, hour, weekday));
  return { org, hour, weekday, objects, tickets: source.tickets };
}

export function bookHash(snapshot) {
  const ids = snapshot.objects.map((item) => item.id).sort();
  return createHash("sha256").update(ids.join("\n")).digest("hex");
}

export function harnessRows(objects) {
  return objects.map((item) => ({
    id: item.id,
    desk: item.desk,
    owner: item.owner,
    title: item.title,
    readers: item.readers,
    classification: item.classification,
  }));
}

export function sessionFor(catalog, token) {
  const person = catalog.personas.personas.find((item) => item.id === token);
  if (person) return { uid: person.id, groups: [person.team] };
  const account = catalog.depth.serviceAccounts.find((item) => item.uid === token);
  if (account) return { uid: account.uid, groups: [account.app] };
  return null;
}

export function markerFor(picked, desk, id, vaultKey, seed) {
  for (const variant of Object.values(picked)) {
    const home = homes[variant.variantId];
    if (!home || home.org !== "northline") continue;
    if (home.desk === desk && home.id === id) return flagValue(vaultKey, variant.flagId, seed);
  }
  return undefined;
}

export function signalFor(desk) {
  if (desk === "mail") return "mail-read";
  if (desk === "backup") return "backup-read";
  if (desk === "directory" || desk === "idp" || desk === "enroll" || desk === "vpn") return "sign-in";
  return "file-open";
}

export function bookSummary(catalog) {
  const night = book(catalog, { hour: 22, weekday: 2 });
  const dark = {};
  for (const org of Object.keys(darkOrgs)) dark[org] = book(catalog, { org }).objects.length;
  return { northline: night.objects.length, tickets: night.tickets.length, dark };
}

export function validateCompany(catalog) {
  const errors = [];
  const day = book(catalog, { hour: 12, weekday: 2 });
  const night = book(catalog, { hour: 22, weekday: 2 });
  const monday = book(catalog, { hour: 12, weekday: 1 });
  if (day.objects.length < 200) errors.push("day book is thin");
  if (!night.objects.some((item) => item.id === "wire-batch")) errors.push("wire batch missing at night");
  if (day.objects.some((item) => item.id === "wire-batch")) errors.push("wire batch visible during the day");
  if (!monday.objects.some((item) => item.id === "loss-run")) errors.push("loss run missing on Monday");
  if (day.objects.some((item) => item.id === "loss-run")) errors.push("loss run visible on Tuesday");
  if (bookHash(day) !== bookHash(book(catalog, { hour: 12, weekday: 2 }))) errors.push("book hash drifted");
  const ids = new Set(night.objects.map((item) => item.id).concat(day.objects.map((item) => item.id), monday.objects.map((item) => item.id)));
  for (const [variantId, home] of Object.entries(homes)) {
    if (home.org !== "northline") continue;
    if (!ids.has(home.id)) errors.push(`${variantId} has no object`);
  }
  const leaked = JSON.stringify(harnessRows(day.objects));
  for (const chain of catalog.chains.chains) {
    for (const variant of chain.variants) {
      if (leaked.includes(variant.flagId) || leaked.includes(variant.weaknessClass)) errors.push(`book leaked ${variant.flagId}`);
    }
  }
  for (const org of Object.keys(darkOrgs)) {
    const dark = book(catalog, { org });
    if (dark.objects.length < 30) errors.push(`${org} book is thin`);
    for (const item of dark.objects) {
      if (day.objects.some((row) => row.id === item.id)) errors.push(`${item.id} crossed into Northline`);
    }
  }
  return errors;
}

// @ts-nocheck
function findRow(id, rows) {
  return rows.find((row) => row.id === id);
}

function units(mod, budgetId) {
  if (!mod.weight) return 0;
  if (budgetId === "free") return Math.max(1, mod.weight);
  return 1;
}

function sketch(budget, identity, detection, noise, orgCount) {
  const perOrg = identity.filter((mod) => mod.id !== "record" && mod.id !== "laps-gap");
  const span = detection.filter((mod) => mod.plane === "span");
  const shared = detection.filter((mod) => mod.plane !== "span");
  const perOrgUnits = perOrg.reduce((sum, mod) => sum + units(mod, budget.id), 0) + span.reduce((sum, mod) => sum + units(mod, budget.id), 0) + 2;
  const sharedUnits = shared.reduce((sum, mod) => sum + units(mod, budget.id), 0) + noise.length;
  const count = orgCount * perOrgUnits + sharedUnits;
  return {
    count,
    guestMb: budget.guestMb,
    note: `${budget.guestMb} MB each. One role per guest, and a heavier role gets several guests instead of being dropped. Each selected org keeps a full block: directory, apps, workstations, and a span where you selected one.`,
  };
}

function present(mod) {
  return { id: mod.id, title: mod.title, note: mod.note, plane: mod.plane };
}

export function awsFreePlacement(guestCount) {
  const accounts = [];
  for (let i = 0; i < guestCount; i += 1) {
    accounts.push({
      account: `free-${String(i + 1).padStart(3, "0")}`,
      guest: i + 1,
      shape: "t3.micro",
      hours: 750,
      spill: "next-account",
    });
  }
  return {
    shape: "t3.micro",
    hoursPerGuest: 750,
    accounts,
    dropped: [],
    assumption:
      "750 hours covers one t3.micro for a month. Each extra guest is another account, not a deleted role. Confirm the current free tier before any account exists. Apply stays off.",
  };
}

export function profileDiff(left, right) {
  const ids = (rows) => rows.map((row) => row.id);
  const added = (before, after) => ids(after).filter((id) => !ids(before).includes(id));
  return {
    orgsAdded: added(left.orgs, right.orgs),
    identityAdded: added(left.identity, right.identity),
    detectionAdded: added(left.detection, right.detection),
    guestDelta: right.guests.count - left.guests.count,
    dropped: right.dropped,
  };
}

export function resolvePlan(profile, planes, orgs) {
  const errors = [];
  const warnings = [];
  const budget = findRow(profile.budget, planes.budgets);
  const windows = findRow(profile.windows, planes.windows);
  const density = findRow(profile.density, planes.densities);
  const providerIds = [...new Set(profile.providers || [])];
  if (!budget) errors.push(`Unknown budget ${profile.budget}.`);
  if (!windows) errors.push(`Unknown Windows choice ${profile.windows}.`);
  if (!density) errors.push(`Unknown density ${profile.density}.`);
  if (providerIds.length === 0) errors.push("Pick at least one provider.");
  const providers = [];
  for (const id of providerIds) {
    const provider = findRow(id, planes.providers);
    if (!provider) errors.push(`Unknown provider ${id}.`);
    else providers.push(provider);
  }
  if (!budget || !windows || !density || providers.length === 0) {
    return { ok: false, errors, warnings, checklist: [] };
  }

  if (!budget.windows.includes(windows.id)) {
    errors.push(`${windows.title} is not available on the ${budget.title} band.`);
  }
  if (!budget.density.includes(density.id)) {
    errors.push(`${density.title} is not available on the ${budget.title} band.`);
  }

  const known = new Set(orgs.map((org) => org.id));
  const selectedOrgs = profile.orgs ? [...profile.orgs] : [];
  if (!selectedOrgs.includes("northline")) errors.push("Northline stays in every profile.");
  for (const id of selectedOrgs) {
    if (!known.has(id)) errors.push(`Unknown org ${id}.`);
  }
  if (selectedOrgs.length > 1 && density.id !== "federation") {
    warnings.push("More than one org is the federation shape. The scope file still denies every org but Northline.");
  }

  const identityIds = [...new Set(profile.identity || [])];
  if (!identityIds.includes("record")) identityIds.unshift("record");
  const identity = [];
  for (const id of identityIds) {
    const mod = findRow(id, planes.identity);
    if (!mod) {
      errors.push(`Unknown identity module ${id}.`);
      continue;
    }
    if (!mod.windows.includes(windows.id)) {
      errors.push(`${mod.title} needs different Windows media than ${windows.title}.`);
    }
    for (const need of mod.needs) {
      if (!identityIds.includes(need)) errors.push(`${mod.title} needs ${need}.`);
    }
    if (!mod.density.includes(density.id)) {
      errors.push(`${mod.title} needs a denser range than ${density.title}.`);
    }
    identity.push(mod);
  }
  if (identityIds.includes("keycloak") && identityIds.includes("authentik")) {
    warnings.push("Two staff portals. Keep both only if two departments actually have two.");
  }
  if (identityIds.includes("mit-kdc") && (identityIds.includes("samba-ad") || identityIds.includes("windows-ad"))) {
    warnings.push("A standalone KDC beside a directory that already speaks Kerberos.");
  }
  if (identityIds.includes("step-ca") && identityIds.includes("ad-cs")) {
    warnings.push("Two enrollment planes. The catalog should name which one a class refers to.");
  }
  if (identityIds.includes("samba-ad") && identityIds.includes("windows-ad")) {
    warnings.push("Samba and Windows both want to be the directory. Pick the one the forest uses.");
  }

  const detectionIds = [...new Set(profile.detection || [])];
  for (const id of [...detectionIds]) {
    const bundle = findRow(id, planes.bundles);
    if (!bundle) continue;
    for (const part of bundle.expands) {
      if (!detectionIds.includes(part)) {
        detectionIds.push(part);
        warnings.push(`${part} is included because ${bundle.title} is a bundle.`);
      }
    }
  }
  const detection = [];
  for (const id of detectionIds) {
    if (findRow(id, planes.bundles)) continue;
    const mod = findRow(id, planes.detection);
    if (!mod) {
      errors.push(`Unknown detection module ${id}.`);
      continue;
    }
    detection.push(mod);
  }
  if (detectionIds.includes("fleet") && !detectionIds.includes("osquery")) {
    errors.push("Fleet needs osquery.");
  }
  const heavy = detection.filter((mod) => mod.weight > 0);

  const noise = [];
  for (const id of [...new Set(profile.noise || [])]) {
    const mod = findRow(id, planes.noise);
    if (!mod) {
      errors.push(`Unknown noise module ${id}.`);
      continue;
    }
    noise.push(mod);
  }

  if (budget.id === "free") {
    for (const provider of providers) {
      if (provider.expires) warnings.push(`${provider.title}: ${provider.expires}`);
    }
  }

  const guests = sketch(budget, identity, heavy, noise, selectedOrgs.length);
  const base = Math.floor(guests.count / providers.length);
  let extra = guests.count % providers.length;
  const placed = providers.map((provider) => {
    const share = base + (extra > 0 ? 1 : 0);
    if (extra > 0) extra -= 1;
    return {
      id: provider.id,
      title: provider.title,
      guests: share,
      stack: provider.stack,
      note: provider.note,
    };
  });

  const checklist = [
    "Snapshot the host before you change it.",
    "Confirm the provider's current limits. This plan is not a quote.",
    "Keep the harness on the operator plane and import range-scope.json.",
    "No model keys inside the habitat.",
    "This plan does not apply. The preferred substrate is free-tier AWS, and apply stays off.",
  ];
  if (windows.id !== "none") {
    checklist.push("Windows media stays on your machine. Do not commit an image or a product key.");
  }

  const store = detection.some((mod) => mod.id === "elastic")
    ? "elastic"
    : detection.some((mod) => mod.id === "opensearch")
      ? "opensearch"
      : detection.some((mod) => mod.id === "wazuh")
        ? "wazuh"
        : "none";

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    name: profile.name || "operator",
    budget: { id: budget.id, title: budget.title, cash: budget.cash },
    providers: placed,
    stacks: placed.map((provider) => provider.stack),
    windows: { id: windows.id, title: windows.title, note: windows.note },
    density: { id: density.id, title: density.title, note: density.note },
    orgs: orgs.filter((org) => selectedOrgs.includes(org.id)),
    identity: identity.map(present),
    detection: detection.map(present),
    noise: noise.map(present),
    guests,
    dropped: [],
    store,
    aws: placed.some((provider) => provider.id === "aws")
      ? {
          shape: "t3.micro",
          guests: guests.count,
          dropped: [],
          note: "One role per guest. Free-tier hours are a budget, not a reason to delete a role. Apply stays off.",
          placement: budget.id === "free" ? awsFreePlacement(guests.count) : null,
        }
      : null,
    checklist,
    scopeNote:
      "A profile does not change range-scope.json. Other orgs, the management plane, and the noise tools stay denied until a later compile says otherwise.",
  };
}

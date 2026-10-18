// @ts-nocheck
function ipToInt(ip) {
  const parts = String(ip).split(".");
  if (parts.length !== 4) return null;
  return parts.reduce((acc, part) => {
    const n = Number(part);
    if (!Number.isInteger(n) || n < 0 || n > 255) return Number.NaN;
    return ((acc << 8) + n) >>> 0;
  }, 0);
}

function inCidr(ip, cidr) {
  const value = ipToInt(ip);
  if (value === null || Number.isNaN(value)) return false;
  const [base, bitsRaw] = String(cidr).split("/");
  const bits = Number(bitsRaw);
  const baseValue = ipToInt(base ?? "");
  if (baseValue === null || Number.isNaN(baseValue) || !Number.isInteger(bits) || bits < 0 || bits > 32) return false;
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (value & mask) === (baseValue & mask);
}

export function decision(scope, ip) {
  for (const rule of scope.deny) {
    if (inCidr(ip, rule.cidr)) return { decision: "deny", rule: rule.cidr, reason: rule.reason || rule.cidr };
  }
  for (const rule of scope.allow) {
    if (inCidr(ip, rule.cidr)) return { decision: "allow", rule: rule.cidr, reason: rule.zone || rule.cidr };
  }
  return { decision: "deny", rule: "default", reason: "default deny" };
}

export function openRun({ seed, pins, scopeHash, scope, live }) {
  const playable = (live || []).filter((item) => item.ip && decision(scope, item.ip).decision === "allow");
  return {
    seed,
    pins: pins || {},
    scopeHash,
    status: "open",
    score: 0,
    possible: playable.length,
    playable: playable.map((item) => item.variantId),
    found: [],
    events: [],
    failed: false,
    reason: "",
  };
}

export function note(scope, run, event) {
  if (run.failed) return run;
  const next = {
    ...run,
    found: [...run.found],
    events: [...run.events],
  };
  const ip = event.ip || "";
  if (ip) {
    const verdict = decision(scope, ip);
    if (verdict.decision === "deny") {
      next.events.push({ ip, path: event.path || "", result: "deny", rule: verdict.rule });
      next.failed = true;
      next.status = "failed";
      next.reason = verdict.reason;
      return next;
    }
  }
  if (event.marker && event.variantId && next.playable.includes(event.variantId) && !next.found.includes(event.variantId)) {
    next.found.push(event.variantId);
    next.score = next.found.length;
    next.events.push({ ip, path: event.path || "", result: "point", variantId: event.variantId });
  } else if (ip) {
    next.events.push({ ip, path: event.path || "", result: "allow" });
  }
  if (next.possible > 0 && next.score === next.possible) next.status = "complete";
  return next;
}

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { resolvePlan } from "./plan.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function arg(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? "" : process.argv[index + 1] || "";
}

const profilePath = resolve(root, arg("--profile") || "profiles/operator.json");
const profile = JSON.parse(readFileSync(profilePath, "utf8"));
for (const key of ["substrate", "budget", "windows", "density"]) {
  const value = arg(`--${key}`);
  if (value) profile[key] = value;
}
for (const key of ["orgs", "identity", "detection", "noise"]) {
  const value = arg(`--${key}`);
  if (value) profile[key] = value.split(",").filter(Boolean);
}

const planes = JSON.parse(readFileSync(join(root, "catalogs/planes.json"), "utf8"));
const habitat = JSON.parse(readFileSync(join(root, "catalogs/habitat.json"), "utf8"));
const plan = resolvePlan(profile, planes, habitat.orgs);

mkdirSync(join(root, "dist"), { recursive: true });
writeFileSync(join(root, "dist/build-plan.json"), `${JSON.stringify(plan, null, 2)}\n`);

if (!plan.ok) {
  console.error(plan.errors.join("\n"));
  process.exit(1);
}

console.log(`${plan.name}: ${plan.budget.title} on ${plan.substrate.title}`);
console.log(plan.budget.cash);
console.log(plan.substrate.shape);
console.log(`Guests: ${plan.guests.count}. ${plan.guests.note}`);
console.log(`Stack: ${plan.substrate.stack}`);
if (plan.substrate.also) console.log(`Also: ${plan.substrate.also}`);
console.log(`Identity: ${plan.identity.map((mod) => mod.title).join(", ")}`);
console.log(`Detection: ${plan.detection.map((mod) => mod.title).join(", ")}`);
if (plan.noise.length) console.log(`Noise: ${plan.noise.map((mod) => mod.title).join(", ")}`);
for (const warning of plan.warnings) console.log(`Warning: ${warning}`);
console.log(plan.scopeNote);

const terraform = spawnSync("terraform", ["version"], { encoding: "utf8" });
if (terraform.status !== 0) {
  console.log("Terraform is not on this machine. The plan is written. The stack was not validated here.");
} else {
  for (const stack of [plan.substrate.stack, plan.substrate.also].filter(Boolean)) {
    const dir = join(root, stack);
    const init = spawnSync("terraform", ["-chdir=" + dir, "init", "-backend=false"], { encoding: "utf8" });
    const validate = spawnSync("terraform", ["-chdir=" + dir, "validate"], { encoding: "utf8" });
    if (init.status !== 0 || validate.status !== 0) {
      console.error(init.stderr || validate.stderr || `${stack} did not validate`);
      process.exit(1);
    }
    console.log(`validated ${stack}`);
  }
}
console.log("Apply was not run.");

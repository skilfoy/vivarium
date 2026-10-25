import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadCatalog, repoRoot } from "./lib.mjs";

const here = dirname(fileURLToPath(import.meta.url));

export function readSchema(name) {
  return JSON.parse(readFileSync(join(repoRoot(), "catalogs/schema", name), "utf8"));
}

export function validateSchema(schema, value, path = "$") {
  const errors = [];
  if (schema.enum && !schema.enum.includes(value)) {
    errors.push(`${path} is not an allowed value`);
  }
  if (schema.type === "object") {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      return [`${path} is not an object`];
    }
    for (const key of schema.required || []) {
      if (value[key] === undefined) errors.push(`${path}.${key} is required`);
    }
    const known = new Set(Object.keys(schema.properties || {}));
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!known.has(key)) errors.push(`${path}.${key} is not a field`);
      }
    }
    for (const [key, child] of Object.entries(schema.properties || {})) {
      if (value[key] !== undefined) errors.push(...validateSchema(child, value[key], `${path}.${key}`));
    }
    return errors;
  }
  if (schema.type === "array") {
    if (!Array.isArray(value)) return [`${path} is not an array`];
    if (schema.minItems && value.length < schema.minItems) errors.push(`${path} is short`);
    if (schema.items) {
      value.forEach((item, index) => {
        errors.push(...validateSchema(schema.items, item, `${path}[${index}]`));
      });
    }
    return errors;
  }
  if (schema.type === "string") {
    if (typeof value !== "string") return [`${path} is not a string`];
    if (schema.minLength && value.length < schema.minLength) errors.push(`${path} is short`);
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) errors.push(`${path} does not match`);
    return errors;
  }
  if (schema.type === "integer") {
    if (!Number.isInteger(value)) errors.push(`${path} is not an integer`);
    return errors;
  }
  if (schema.type === "number") {
    if (typeof value !== "number" || Number.isNaN(value)) errors.push(`${path} is not a number`);
    return errors;
  }
  return errors;
}

export function validateSchemas(catalog = loadCatalog()) {
  const errors = [];
  const check = (schemaName, value, label) => {
    for (const problem of validateSchema(readSchema(schemaName), value, label)) {
      errors.push(problem);
    }
  };
  check("habitat.schema.json", catalog.habitat, "habitat");
  check("personas.schema.json", catalog.personas, "personas");
  check("chains.schema.json", catalog.chains, "chains");
  for (const sector of catalog.sectors) {
    check("sector.schema.json", sector, `sector ${sector.id}`);
  }
  for (const link of catalog.depth.links) {
    check("link.schema.json", link, `link ${link.id}`);
  }
  for (const account of catalog.depth.serviceAccounts) {
    check("service.schema.json", account, `service ${account.uid}`);
  }
  const broken = JSON.parse(readFileSync(join(here, "fixtures/broken-chain.json"), "utf8"));
  const rejected = validateSchema(readSchema("chains.schema.json"), broken, "broken");
  if (rejected.length < 2) errors.push("broken chain fixture was accepted");
  const names = readdirSync(join(repoRoot(), "catalogs/schema")).filter((name) => name.endsWith(".schema.json"));
  if (names.length < 6) errors.push("schema set is short");
  return errors;
}

if (process.argv[1] && process.argv[1].endsWith("schema.mjs")) {
  const problems = validateSchemas();
  if (problems.length) {
    console.error(problems.join("\n"));
    process.exit(1);
  }
  console.log(`schema ok ${readdirSync(join(repoRoot(), "catalogs/schema")).length} files`);
}

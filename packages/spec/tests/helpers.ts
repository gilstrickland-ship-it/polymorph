import Ajv2020, { type ValidateFunction } from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

export const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

export function readJson(relPath: string): unknown {
  return JSON.parse(readFileSync(join(pkgRoot, relPath), "utf8"));
}

export function loadFixture(kind: "valid" | "invalid", name: string): unknown {
  return readJson(join("tests", "fixtures", kind, `${name}.tokens.json`));
}

/** Compile the theme schema with its referenced sub-schemas, using the actual shipped files. */
export function makeValidate(): ValidateFunction {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  ajv.addSchema(readJson("schema/dtcg-types.schema.json") as object);
  ajv.addSchema(readJson("schema/components.schema.json") as object);
  return ajv.compile(readJson("schema/theme.schema.json") as object);
}

export function errorsToString(validate: ValidateFunction): string {
  return JSON.stringify(validate.errors ?? []);
}

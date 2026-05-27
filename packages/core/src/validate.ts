import Ajv2020, { type ValidateFunction, type ErrorObject } from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { themeSchema, componentsSchema, dtcgTypesSchema } from "@polymorph/spec";
import { ResolveError } from "./errors.js";
import type { ValidationError, ValidationResult } from "./errors.js";
import { indexTokens, resolveValueDeep } from "./internal/walk.js";

let _validate: ValidateFunction | undefined;

function schemaValidator(): ValidateFunction {
  if (!_validate) {
    const ajv = new Ajv2020({ allErrors: true, strict: false });
    addFormats(ajv);
    ajv.addSchema(dtcgTypesSchema);
    ajv.addSchema(componentsSchema);
    _validate = ajv.compile(themeSchema);
  }
  return _validate;
}

function schemaErrorToValidation(e: ErrorObject): ValidationError {
  const missing = (e.params as { additionalProperty?: string; missingProperty?: string }) ?? {};
  const detail = missing.missingProperty
    ? ` (missing '${missing.missingProperty}')`
    : missing.additionalProperty
      ? ` (unexpected '${missing.additionalProperty}')`
      : "";
  return {
    code: "SCHEMA_INVALID",
    message: `${e.instancePath || "/"} ${e.message ?? "is invalid"}${detail}`,
    path: e.instancePath || "/",
  };
}

/**
 * Validate a theme: JSON Schema (Ajv 2020 against @polymorph/spec) + graph checks the schema
 * cannot express (dangling alias, alias cycle). Never throws.
 */
export function validateTheme(theme: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  const validate = schemaValidator();
  if (!validate(theme)) {
    for (const e of validate.errors ?? []) errors.push(schemaErrorToValidation(e));
  }

  // Graph checks (independent of schema result, as long as we have an object to walk).
  if (typeof theme === "object" && theme !== null) {
    const index = indexTokens(theme);
    const seenCycles = new Set<string>();
    for (const [path, node] of index) {
      try {
        resolveValueDeep(index, node.$value, new Set([path]));
      } catch (err) {
        if (err instanceof ResolveError && (err.code === "ALIAS_CYCLE" || err.code === "ALIAS_UNRESOLVED")) {
          if (err.code === "ALIAS_CYCLE") {
            if (seenCycles.has(err.message)) continue;
            seenCycles.add(err.message);
          }
          errors.push({ code: err.code, message: err.message, tokenId: path });
        } else {
          throw err;
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

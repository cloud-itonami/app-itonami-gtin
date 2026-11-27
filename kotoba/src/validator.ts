/**
 * gtin kotoba — validator only (AWAI-3808, ZB20-D09).
 *
 * Pure check-digit validation. No registry: no product record is
 * read or written, no holder/issuance field is accepted, and no
 * collection is touched. The first argument is accepted (and ignored)
 * only so legacy `validateGtin(e, { gtin })` call shapes keep working.
 */
import {
  detectCodeType,
  isValidGtin,
  normalizeGtinDigits,
  type ValidateGtinInput,
  type ValidateGtinOutput,
} from "./types.js";

export type { ValidateGtinInput, ValidateGtinOutput };

/** Holder / issuance / product-registry fields prohibited in validator payloads (ZB20-N42). */
export const HOLDER_FIELDS = [
  "holder",
  "owner",
  "registrant",
  "issuedTo",
  "holderName",
  "ownerName",
  "registrantName",
  "manufacturer",
  "brand",
  "productName",
  "productId",
] as const;

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[\s_-]/g, "");
}

const HOLDER_NORMALIZED = new Set(HOLDER_FIELDS.map(normalizeKey));

/** Return the first prohibited holder/registry field present in `input`, if any. */
export function findHolderField(input: unknown): string | undefined {
  if (!input || typeof input !== "object") return undefined;
  for (const key of Object.keys(input as Record<string, unknown>)) {
    if (HOLDER_NORMALIZED.has(normalizeKey(key))) return key;
  }
  return undefined;
}

export async function validateGtin(
  eOrInput: unknown,
  maybeInput?: ValidateGtinInput,
): Promise<ValidateGtinOutput> {
  const input = (maybeInput ?? eOrInput ?? {}) as ValidateGtinInput;
  const holderField = findHolderField(input);
  if (holderField) {
    return { status: "rejected", error: "holderFieldProhibited", field: holderField };
  }
  const raw = input.gtin ?? input.code;
  if (!raw) return { status: "rejected", error: "missingCode" };
  const digits = normalizeGtinDigits(String(raw));
  const codeType = detectCodeType(digits);
  if (codeType === "invalid") {
    return { status: "rejected", error: "invalidFormat" };
  }
  if (!isValidGtin(digits)) {
    return { status: "rejected", error: "invalidChecksum" };
  }
  const formatMap: Record<string, string> = {
    "gtin-8": "GTIN-8",
    "upc-12": "UPC-12",
    "ean-13": "GTIN-13",
    "jan-13": "GTIN-13",
    "gtin-14": "GTIN-14",
  };
  return { status: "valid", format: formatMap[codeType] || codeType.toUpperCase() };
}

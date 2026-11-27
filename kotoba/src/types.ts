/**
 * gtin kotoba — validator types (AWAI-3808, ZB20-D09).
 *
 * Validators only, not registries: this module judges GTIN shape
 * (length + modulo-10 check digit) and canonicalises to GTIN-14.
 * It keeps no product, holder, or issuance record and never resolves
 * a prefix to an owner. See docs/identifier-scope.md.
 */

export type CodeType =
  | "gtin-8"
  | "upc-12"
  | "ean-13"
  | "jan-13"
  | "gtin-14"
  | "invalid";

export interface ValidateGtinInput {
  gtin?: string;
  code?: string;
  [key: string]: unknown;
}

export interface ValidateGtinOutput {
  status: "valid" | "rejected";
  format?: string;
  error?: string;
  field?: string;
}

// ─── GTIN checksum helpers ──────────────────────────────────────────

/** Strip non-digits, return digits-only string. */
export function normalizeGtinDigits(s: string): string {
  return (s ?? "").replace(/\D/g, "");
}

/** Detect code type from length (no checksum check yet). */
export function detectCodeType(digits: string): CodeType {
  if (digits.length === 8) return "gtin-8";
  if (digits.length === 12) return "upc-12";
  if (digits.length === 13) {
    if (digits.startsWith("45") || digits.startsWith("49")) return "jan-13";
    return "ean-13";
  }
  if (digits.length === 14) return "gtin-14";
  return "invalid";
}

/** Left zero-pad to GTIN-14 (any valid GTIN family). */
export function toGtin14(digits: string): string | undefined {
  if (digits.length < 8 || digits.length > 14) return undefined;
  return digits.padStart(14, "0");
}

/** GTIN modulo 10 check digit — works for GTIN-8/12/13/14. */
export function gtinCheckDigit(payload: string): number {
  let sum = 0;
  for (let i = 0; i < payload.length; i++) {
    const digit = Number(payload[payload.length - 1 - i]);
    sum += digit * (i % 2 === 0 ? 3 : 1);
  }
  return (10 - (sum % 10)) % 10;
}

/** Validate a GTIN code (digits-only input expected). */
export function isValidGtin(digits: string): boolean {
  if (![8, 12, 13, 14].includes(digits.length)) return false;
  if (!/^\d+$/.test(digits)) return false;
  const payload = digits.slice(0, -1);
  const checkActual = Number(digits[digits.length - 1]);
  return gtinCheckDigit(payload) === checkActual;
}

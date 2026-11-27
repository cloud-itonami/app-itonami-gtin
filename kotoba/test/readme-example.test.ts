/**
 * Every value printed in the repo root README.md API section, asserted.
 * Validator only (AWAI-3808 / ZB20-D09): no registry examples remain.
 */
import { describe, it, expect } from "vitest";
import {
  validateGtin, detectCodeType, isValidGtin, normalizeGtinDigits, toGtin14,
} from "../src/index.js";

describe("README example", () => {
  const e: any = null;

  it("validateGtin", async () => {
    expect(await validateGtin(e, { gtin: "5901234123457" })).toEqual({ status: "valid", format: "GTIN-13" });
    expect(await validateGtin(e, { gtin: "012345678905" })).toEqual({ status: "valid", format: "UPC-12" });
    expect(await validateGtin(e, { gtin: "4569951116179" })).toEqual({ status: "valid", format: "GTIN-13" });
    expect(await validateGtin(e, { gtin: "5901234123456" })).toEqual({ status: "rejected", error: "invalidChecksum" });
    expect(await validateGtin(e, { gtin: "invalid-gtin" })).toEqual({ status: "rejected", error: "invalidFormat" });
  });

  it("pure helpers", () => {
    expect(normalizeGtinDigits("590-1234-123-457")).toBe("5901234123457");
    expect(detectCodeType("4569951116179")).toBe("jan-13");
    expect(detectCodeType("5901234123457")).toBe("ean-13");
    expect(isValidGtin("5901234123457")).toBe(true);
    expect(toGtin14("5901234123457")).toBe("05901234123457");
  });
});

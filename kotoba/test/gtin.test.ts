import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { validateGtin, isValidGtin } from "../src/index.js";

describe("gtin kotoba (validator only, AWAI-3808)", () => {
  const e: any = null;

  describe("validateGtin", () => {
    it("accepts valid GTIN-13", async () => {
      const result = await validateGtin(e, { gtin: "5901234123457" });
      expect(result.status).toBe("valid");
      expect(result.format).toBe("GTIN-13");
    });
    it("accepts valid UPC-12", async () => {
      const result = await validateGtin(e, { gtin: "012345678905" });
      expect(result.status).toBe("valid");
      expect(result.format).toBe("UPC-12");
    });
    it("accepts valid GTIN-8 and GTIN-14", async () => {
      expect(await validateGtin(e, { gtin: "01234565" })).toEqual({ status: "valid", format: "GTIN-8" });
      expect(await validateGtin(e, { gtin: "19012345678903" })).toEqual({ status: "valid", format: "GTIN-14" });
      expect(isValidGtin("01234565")).toBe(true);
      expect(isValidGtin("19012345678903")).toBe(true);
    });
    it("rejects invalid checksum", async () => {
      const result = await validateGtin(e, { gtin: "5901234123456" });
      expect(result.status).toBe("rejected");
      expect(result.error).toBe("invalidChecksum");
    });
    it("rejects malformed GTIN", async () => {
      const result = await validateGtin(e, { gtin: "invalid-gtin" });
      expect(result.status).toBe("rejected");
      expect(result.error).toBe("invalidFormat");
    });
  });

  describe("identifier scope pins (AWAI-3808, AWAI-3817)", () => {
    const GTIN_PARITY_VECTORS = [
      { gtin: "5901234123457", status: "valid", format: "GTIN-13" },
      { gtin: "012345678905", status: "valid", format: "UPC-12" },
      { gtin: "4569951116179", status: "valid", format: "GTIN-13" },
      { gtin: "5901234123456", status: "rejected" },
      { gtin: "invalid-gtin", status: "rejected" },
    ] as const;
    const EXPECTED_GTIN_VECTOR_ROWS = 5;
    const SIBLING_PINS = [
      "network-awai/app-isbn",
      "network-awai/app-issn",
      "| 22 |",
      "| 16 |",
      "| 20 |",
      "18 lines | 7 assertions",
      "17 lines | 8 assertions",
    ] as const;

    it("pins the GTIN parity vector row count", async () => {
      expect(
        GTIN_PARITY_VECTORS.length,
        `GTIN parity vector row count changed: expected ${EXPECTED_GTIN_VECTOR_ROWS}, found ${GTIN_PARITY_VECTORS.length}`,
      ).toBe(EXPECTED_GTIN_VECTOR_ROWS);
      for (const v of GTIN_PARITY_VECTORS) {
        const result: any = await validateGtin(e, { gtin: v.gtin });
        expect(result.status, `parity vector ${v.gtin}`).toBe(v.status);
        if (v.status === "valid") {
          expect(result.format, `parity vector ${v.gtin}`).toBe((v as { format?: string }).format);
        }
      }
      console.log(`identifier-scope pins: gtin_vectors=${GTIN_PARITY_VECTORS.length}`);
    });

    it("doc states validator-not-registry and pins sibling vectors", () => {
      const doc = readFileSync(new URL("../../docs/identifier-scope.md", import.meta.url), "utf8");
      expect(doc.includes("These repositories are validators, not registries.")).toBe(true);
      for (const pin of SIBLING_PINS) {
        expect(doc.includes(pin), `identifier-scope.md: sibling pin missing: ${pin}`).toBe(true);
      }
      console.log(`identifier-scope pins: sibling_pins=${SIBLING_PINS.length} doc=docs/identifier-scope.md`);
    });
  });
});

import { readFileSync } from "node:fs";
import { describe, it, expect, beforeEach } from "vitest";
import { MockEtzhayyim } from "@etzhayyim/sdk-mock";
import {
  registerGtin,
  validateGtin,
  lookupProduct,
  listProducts,
} from "../src/index.js";

describe("gtin kotoba", () => {
  let e: any;

  beforeEach(() => {
    e = new MockEtzhayyim({ did: "did:web:gtin.etzhayyim.com" });
  });

  describe("registerGtin", () => {
    it("registers a product with valid GTIN-13", async () => {
      const result = await registerGtin(e, {
        gtin: "5901234123457",
        productName: "Chocolate Bar",
        manufacturer: "Acme Corp",
      });

      expect(result.status).toBe("registered");
      expect(result.productUri).toBeDefined();
    });

    it("registers a product with valid UPC-12", async () => {
      const result = await registerGtin(e, {
        gtin: "012345678905",
        productName: "Widget",
        manufacturer: "Widget Inc",
      });

      expect(result.status).toBe("registered");
      expect(result.productUri).toBeDefined();
    });

    it("is idempotent on gtin", async () => {
      const input = {
        gtin: "5901234123457",
        productName: "Chocolate Bar",
        manufacturer: "Acme Corp",
      };

      const first = await registerGtin(e, input);
      expect(first.status).toBe("registered");

      const second = await registerGtin(e, input);
      expect(second.status).toBe("alreadyExists");
    });
  });

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

  describe("lookupProduct", () => {
    beforeEach(async () => {
      await registerGtin(e, {
        gtin: "5901234123457",
        productName: "Chocolate Bar",
        manufacturer: "Acme Corp",
      });
    });

    it("looks up product by EAN-13", async () => {
      const result = await lookupProduct(e, { gtin: "5901234123457" });

      expect(result.product).toBeDefined();
      expect(result.product?.productName).toBe("Chocolate Bar");
      expect(result.product?.manufacturer).toBe("Acme Corp");
    });

    it("looks up product by UPC-12", async () => {
      await registerGtin(e, {
        gtin: "012345678905",
        productName: "Widget",
        manufacturer: "Widget Inc",
      });

      const result = await lookupProduct(e, { gtin: "012345678905" });

      expect(result.product).toBeDefined();
      expect(result.product?.productName).toBe("Widget");
    });

    it("returns notFound for unregistered gtin", async () => {
      const result = await lookupProduct(e, {
        gtin: "9999999999999",
      });

      expect(result.error).toBe("notFound");
      expect(result.product).toBeUndefined();
    });
  });

  describe("listProducts", () => {
    beforeEach(async () => {
      await registerGtin(e, {
        gtin: "5901234123457",
        productName: "Chocolate Bar",
        manufacturer: "Acme Corp",
      });
      await registerGtin(e, {
        gtin: "012345678905",
        productName: "Widget",
        manufacturer: "Widget Inc",
      });
    });

    it("lists all registered products", async () => {
      const result = await listProducts(e, {});

      expect(result.items.length).toBeGreaterThanOrEqual(2);
    });

    it("filters by manufacturer", async () => {
      const result = await listProducts(e, { manufacturer: "Acme Corp" });

      expect(
        result.items.every((p) => p.manufacturer === "Acme Corp")
      ).toBe(true);
    });
  });

  describe("identifier scope pins (AWAI-3808, AWAI-3817)", () => {
    // Parity vectors: check-digit example values only, mirrored in
    // docs/identifier-scope.md. Not a registry excerpt — adding, removing,
    // or rewording a row here must fail loudly (see EXPECTED_GTIN_VECTOR_ROWS).
    // Every value below is a published check-digit example, never a product:
    // 5901234123457 is GS1's own published worked EAN-13 example (Poland 590
    // prefix, outside the 45/49 Japanese numbering space);
    // 4569951116179 is GS1 Japan's Basic Guide p.17 worked JAN example
    // (check digit 9); 012345678905 is the canonical published UPC-A example;
    // 5901234123456 is the GS1 example payload with a corrupted check digit,
    // so the invalid case proves the check digit is what gets verified.
    const GTIN_PARITY_VECTORS = [
      { gtin: "5901234123457", status: "valid", format: "GTIN-13" },
      { gtin: "012345678905", status: "valid", format: "UPC-12" },
      { gtin: "4569951116179", status: "valid", format: "GTIN-13" },
      { gtin: "5901234123456", status: "rejected" },
      { gtin: "invalid-gtin", status: "rejected" },
    ] as const;
    const EXPECTED_GTIN_VECTOR_ROWS = 5;

    // Sibling pins, measured 2026-11-22 on each repo's `main`
    // (gh api trees + contents). Read-only: this issue changes nothing in
    // those repos, so the doc carries the pins and this test gates the doc.
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
        `GTIN parity vector row count changed: expected ${EXPECTED_GTIN_VECTOR_ROWS}, ` +
          `found ${GTIN_PARITY_VECTORS.length} — a vector row was added, removed, or the pin was altered`
      ).toBe(EXPECTED_GTIN_VECTOR_ROWS);
      for (const v of GTIN_PARITY_VECTORS) {
        const result: any = await validateGtin(e, { gtin: v.gtin });
        expect(
          result.status,
          `parity vector ${v.gtin}: expected status ${v.status}, got ${result.status}`
        ).toBe(v.status);
        if (v.status === "valid") {
          expect(
            result.format,
            `parity vector ${v.gtin}: expected format ${v.format}, got ${result.format}`
          ).toBe((v as { format?: string }).format);
        }
      }
      console.log(
        `identifier-scope pins: gtin_vectors=${GTIN_PARITY_VECTORS.length}`
      );
    });

    it("doc states validator-not-registry and pins sibling vectors", () => {
      const doc = readFileSync(
        new URL("../../docs/identifier-scope.md", import.meta.url),
        "utf8"
      );
      expect(
        doc.includes("These repositories are validators, not registries."),
        `identifier-scope.md: the "not a registry" sentence is missing or reworded — ` +
          `the validator-not-registry statement must stay verbatim`
      ).toBe(true);
      for (const pin of SIBLING_PINS) {
        expect(
          doc.includes(pin),
          `identifier-scope.md: sibling pin missing: ${pin} — ` +
            `a pinned vector file, line count, or blob count was edited or dropped`
        ).toBe(true);
      }
      console.log(
        `identifier-scope pins: sibling_pins=${SIBLING_PINS.length} doc=docs/identifier-scope.md`
      );
    });
  });
});

/**
 * ZB20-D09 regression + ZB20-N42 holder-field rejection.
 *
 * D09: the package must be validator-only (AWAI-3808). Any reintroduction
 * of a product/holder registry export or of the product collection in
 * src/ or the xrpc adapter must fail here.
 * N42: validator payloads carrying holder/issuance/registry fields are
 * rejected, and validator outputs never carry such fields.
 */
import { readFileSync, readdirSync } from "node:fs";
import { describe, it, expect } from "vitest";
import * as api from "../src/index.js";
import { validateGtin } from "../src/index.js";

const e: any = null;
const REGISTRY_EXPORTS = ["registerProduct", "lookupProduct", "registerGtin", "listProducts", "productDid", "productRkey"] as const;
const HOLDER_FIELDS = ["holder", "owner", "registrant", "issuedTo", "issued_to", "holderName", "ownerName", "manufacturer", "brand", "productName", "productId"] as const;

function readTree(rel: string): string {
  const dir = new URL(rel, import.meta.url);
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isFile() && d.name.endsWith(".ts"))
    .map((d) => readFileSync(new URL(d.name, dir), "utf8"))
    .join("\n");
}

describe("ZB20-D09 validator-only (no product/holder registry)", () => {
  it("exports no registry functions", () => {
    for (const name of REGISTRY_EXPORTS) {
      expect((api as any)[name], `registry export must be absent: ${name}`).toBeUndefined();
    }
    expect(typeof (api as any).validateGtin).toBe("function");
    expect(typeof (api as any).isValidGtin).toBe("function");
  });

  it("src/ and xrpc-adapter contain no product collection or registry wiring", () => {
    const src = readTree("../src/");
    const xrpc = readFileSync(new URL("../../xrpc-adapter/src/index.ts", import.meta.url), "utf8");
    for (const forbidden of ["com.etzhayyim.gtin.product", "registerProduct", "lookupProduct", "registerGtin", "listProducts", "PRODUCT_COLLECTION"]) {
      expect(src.includes(forbidden), `kotoba/src must not contain ${forbidden}`).toBe(false);
      expect(xrpc.includes(forbidden), `xrpc-adapter must not contain ${forbidden}`).toBe(false);
    }
    expect(src.includes("e.write"), "validator must not write records").toBe(false);
  });
});

describe("ZB20-N42 holder/issuance fields are rejected", () => {
  it("rejects every holder-field variant on an otherwise valid GTIN", async () => {
    for (const field of HOLDER_FIELDS) {
      const input: any = { gtin: "5901234123457", [field]: "Example Holder" };
      const r: any = await validateGtin(e, input);
      expect(r.status, `holder field ${field} must be rejected`).toBe("rejected");
      expect(r.error).toBe("holderFieldProhibited");
      expect(r.field).toBe(field);
    }
  });

  it("rejects holder fields even when the GTIN itself is invalid", async () => {
    const r: any = await validateGtin(e, { gtin: "5901234123456", owner: "Example" });
    expect(r).toEqual({ status: "rejected", error: "holderFieldProhibited", field: "owner" });
  });

  it("validator output never carries holder/registry fields", async () => {
    const ok: any = await validateGtin(e, { gtin: "5901234123457" });
    for (const field of HOLDER_FIELDS) expect(ok[field]).toBeUndefined();
    expect(Object.keys(ok).sort()).toEqual(["format", "status"]);
  });
});

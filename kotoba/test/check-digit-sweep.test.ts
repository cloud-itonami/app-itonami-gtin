/**
 * ZB20-N41 — exhaustive single-digit mutation + adjacent transposition sweep.
 *
 * Every valid vector below is a published check-digit example (or, for
 * GTIN-14, a payload + computed GS1 check digit; not a real product).
 * For each vector we mutate every position to every other digit (0-9
 * except the original) and require rejection, with no exceptions.
 *
 * Transposition note (modulo-10 blind spot): swapping adjacent digits
 * a,b changes the weighted sum by 2*(a-b). When |a-b| === 5 that change
 * is 0 mod 10, so the swapped string is itself a valid GTIN and no
 * pure check-digit validator can reject it. We therefore require
 * rejection for every non-equal adjacent pair with |a-b| !== 5, and
 * pin the |a-b| === 5 pairs as the known GS1 modulo-10 blind spot
 * instead of asserting a mathematically impossible rejection.
 */
import { describe, it, expect } from "vitest";
import { isValidGtin, validateGtin } from "../src/index.js";

const VALID_VECTORS = [
  { gtin: "01234565", format: "GTIN-8" },
  { gtin: "012345678905", format: "UPC-12" },
  { gtin: "5901234123457", format: "GTIN-13" },
  { gtin: "4569951116179", format: "GTIN-13" },
  { gtin: "19012345678903", format: "GTIN-14" },
] as const;

const e: any = null;

describe("ZB20-N41 check-digit mutation sweep", () => {
  it("seed vectors are valid", async () => {
    for (const v of VALID_VECTORS) {
      expect(isValidGtin(v.gtin), v.gtin).toBe(true);
      expect(await validateGtin(e, { gtin: v.gtin })).toEqual({ status: "valid", format: v.format });
    }
  });

  it("rejects every single-digit mutation (all positions x all other digits)", async () => {
    let checked = 0;
    for (const v of VALID_VECTORS) {
      for (let i = 0; i < v.gtin.length; i++) {
        for (let d = 0; d <= 9; d++) {
          const alt = String(d);
          if (alt === v.gtin[i]) continue;
          const mutated = v.gtin.slice(0, i) + alt + v.gtin.slice(i + 1);
          checked++;
          expect(isValidGtin(mutated), `single-mutation ${v.gtin} -> ${mutated} @${i}`).toBe(false);
          const r = await validateGtin(e, { gtin: mutated });
          expect(r.status, `validate single-mutation ${mutated}`).toBe("rejected");
        }
      }
    }
    // 8*9*9? exact: sum(len*9) = (8+12+13+13+14)*9 = 540
    expect(checked).toBe(540);
    console.log(`ZB20-N41 single-digit mutations rejected: ${checked}`);
  });

  it("rejects adjacent transpositions of non-equal digits (except mod-10 blind spot |a-b|=5)", async () => {
    let checked = 0;
    let blindSpot = 0;
    for (const v of VALID_VECTORS) {
      for (let i = 0; i < v.gtin.length - 1; i++) {
        const a = v.gtin[i];
        const b = v.gtin[i + 1];
        if (a === b) continue;
        const mutated = v.gtin.slice(0, i) + b + a + v.gtin.slice(i + 2);
        if (Math.abs(Number(a) - Number(b)) === 5) {
          blindSpot++;
          continue;
        }
        checked++;
        expect(isValidGtin(mutated), `transposition ${v.gtin} -> ${mutated} @${i}`).toBe(false);
        const r = await validateGtin(e, { gtin: mutated });
        expect(r.status, `validate transposition ${mutated}`).toBe("rejected");
      }
    }
    expect(checked).toBeGreaterThan(40);
    console.log(`ZB20-N41 transpositions rejected: ${checked}, mod10-blind-spot(|diff|=5) pinned: ${blindSpot}`);
  });
});

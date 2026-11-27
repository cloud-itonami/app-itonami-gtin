/**
 * ZB20-N45 / ZB20-SG09 — pre-publish gate negative control.
 *
 * Real repo root has no LICENSE (intentional, rights-holder pending):
 * the gate must fail closed there and on any LICENSE-less copy, and
 * must pass only on a temp copy where a dummy LICENSE is placed.
 * This test never creates a LICENSE in the real repo.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it, expect, afterEach } from "vitest";

const repoRoot = new URL("../../", import.meta.url).pathname;
const gate = join(repoRoot, "bin/verify-prepublish-gate.mjs");
const tmps: string[] = [];
afterEach(() => { for (const d of tmps.splice(0)) rmSync(d, { recursive: true, force: true }); });

function runGate(root: string) {
  return spawnSync(process.execPath, [gate, root], { encoding: "utf8" });
}

describe("ZB20-N45 prepublish gate (no LICENSE => fail-closed)", () => {
  it("repo root intentionally has no LICENSE and the gate refuses it", () => {
    for (const name of ["LICENSE", "LICENSE.md", "LICENSE.txt", "COPYING"]) {
      expect(existsSync(join(repoRoot, name)), `real repo must not gain ${name}`).toBe(false);
    }
    const r = runGate(repoRoot);
    expect(r.status).not.toBe(0);
    expect(r.stderr).toContain("LICENSE");
    expect(r.stderr).toContain("missing");
    console.log(`ZB20-N45 gate on repo root: exit=${r.status}`);
  });

  it("fails on a LICENSE-less temp copy and passes only with a dummy LICENSE", () => {
    const dir = mkdtempSync(join(tmpdir(), "gtin-prepublish-"));
    tmps.push(dir);
    const before = runGate(dir);
    expect(before.status).not.toBe(0);
    expect(before.stderr).toContain("LICENSE missing");
    writeFileSync(join(dir, "LICENSE"), "dummy license for negative-control test only\n");
    const after = runGate(dir);
    expect(after.status).toBe(0);
    expect(after.stdout).toContain("LICENSE present");
    console.log(`ZB20-N45 negative control: without=${before.status} with-dummy=${after.status}`);
  });
});

#!/usr/bin/env node
/**
 * ZB20-N45 / ZB20-SG09 — pre-publish gate (fail-closed on missing LICENSE).
 *
 * This repo intentionally ships no LICENSE (rights-holder decision
 * pending, README License section / item #121). While that is true,
 * packaging or publishing must be refused. Do not add a LICENSE to
 * make this pass; the gate passes only when a real LICENSE exists at
 * the target root (exercised by the negative-control test on a temp
 * copy with a dummy file).
 *
 * Usage: node bin/verify-prepublish-gate.mjs [rootDir]
 * Exit 0: LICENSE present. Exit 1: LICENSE absent (named in message).
 */
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = process.argv[2]
  ? resolve(process.argv[2])
  : join(dirname(fileURLToPath(import.meta.url)), "..");

const candidates = ["LICENSE", "LICENSE.md", "LICENSE.txt", "COPYING"];
const found = candidates.find((name) => existsSync(join(root, name)));

if (!found) {
  console.error(
    `prepublish gate: LICENSE missing at ${root} — refusing to package/publish (ZB20-N45/ZB20-SG09, rights-holder decision pending)`,
  );
  process.exit(1);
}
console.log(`prepublish gate: LICENSE present (${found} at ${root})`);

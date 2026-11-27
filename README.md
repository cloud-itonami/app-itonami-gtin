# gtin — GTIN check-digit validator (validators only, not registries)

`gtin` is a **validator only** (AWAI-3808, ZB20-D09;
[`docs/identifier-scope.md`](docs/identifier-scope.md)): give it a GTIN-8,
UPC-12, EAN-13, JAN-13 or GTIN-14 and it judges shape — length plus the
modulo-10 check digit — and canonicalises the code to 14 digits by left
zero-padding. It keeps **no product, holder, or issuance registry**: no
product record is read or written, no prefix is resolved to its owner,
and whether a barcode was ever issued to anyone is out of scope. A valid
check digit means the digits are internally consistent — nothing more.

GTIN is the **G**lobal **T**rade **I**tem **N**umber, the number under the
barcode on a retail item. GS1 is the standards body that issues company
prefixes; a GTIN is a company prefix plus an item reference plus a modulo-10
check digit.

- **Identity**: `did:web:gtin.etzhayyim.com`, nanoid `gt1n4k7m`

## Read this before `AGENTS.md`: it is a design document, not a status report

`AGENTS.md` describes a considerably larger system (five collections,
packaging hierarchy, cross-classification, per-prefix owner DIDs, WIT
exports, heartbeat) that is **not implemented here**. Since ZB20-D09 this
repo is explicitly validator-only: no collection, no registry commands,
no per-product or per-prefix DID is minted by this package. See
[ADR-0001](docs/adr/0001-docs-state-what-was-executed.md) for why docs
must state what was executed.

`README.edn` still identifies this repo as `com-etzhayyim-app-gtin`, its
name before it moved to `cloud-itonami/gtin`. Left as-is deliberately:
it is the migration record, and `migration.edn` names the same destination.

## What is actually here

```
kotoba/          validator package — src/{index,types,validator}.ts, tests in test/
bin/             verify-prepublish-gate.mjs (ZB20-N45 fail-closed gate)
xrpc-adapter/    scaffold: only the validateGtin route remains. Not deployable.
```

## API

Every value below is asserted by `kotoba/test/readme-example.test.ts`.

```ts
import { validateGtin } from "@etzhayyim/gtin-kotoba";
const e = null; // accepted for legacy call shape, ignored (pure arithmetic)
```

### `validateGtin(e, { gtin })` — check digit only, writes nothing

```ts
await validateGtin(e, { gtin: "5901234123457" });  // { status: "valid", format: "GTIN-13" }
await validateGtin(e, { gtin: "012345678905" });   // { status: "valid", format: "UPC-12" }
await validateGtin(e, { gtin: "4569951116179" });  // { status: "valid", format: "GTIN-13" }
await validateGtin(e, { gtin: "5901234123456" });  // { status: "rejected", error: "invalidChecksum" }
await validateGtin(e, { gtin: "invalid-gtin" });   // { status: "rejected", error: "invalidFormat" }
```

A JAN-13 (prefix 45 or 49) reports `format: "GTIN-13"`, not `"JAN-13"`:
`detectCodeType` distinguishes them but `validateGtin` folds both onto
the GS1 name for the 13-digit form.

Payloads carrying holder, issuance, or registry fields (`holder`,
`owner`, `registrant`, `issuedTo`, `manufacturer`, `brand`,
`productName`, `productId`, and variants) are rejected with
`{ status: "rejected", error: "holderFieldProhibited", field: "<name>" }`
(ZB20-N42). There is no register, lookup, or list product API and no
product collection (ZB20-D09 regression is pinned by
`kotoba/test/validator-only.test.ts`).

### Pure helpers

`normalizeGtinDigits`, `detectCodeType`, `isValidGtin`, `toGtin14`,
`gtinCheckDigit`, and the holder-field guard `findHolderField` /
`HOLDER_FIELDS`.

```ts
normalizeGtinDigits("590-1234-123-457");  // "5901234123457"
detectCodeType("4569951116179");          // "jan-13"   (13 digits, prefix 45)
detectCodeType("5901234123457");          // "ean-13"
isValidGtin("5901234123457");             // true
toGtin14("5901234123457");                // "05901234123457"
```

## Canonicalisation

All families left zero-pad to 14 digits (the canonical form; nothing is
stored):

| source | length | example | canonicalised |
|---|---|---|---|
| GTIN-8 | 8 | `01234565` | `00000001234565` |
| UPC-12 | 12 | `012345678905` | `00012345678905` |
| EAN-13 | 13 | `5901234123457` | `05901234123457` |
| JAN-13 | 13 | `4569951116179` | `04569951116179` |
| GTIN-14 | 14 | `19012345678903` | `19012345678903` |

The check digit is modulo 10 with weights alternating 3 and 1 from the
rightmost payload digit. `isValidGtin` applies it to all four lengths.

## Tests and pre-publish gate (ZB20-D09/N41/N42/N45)

```console
$ cd kotoba && npm install && npm test
$ node bin/verify-prepublish-gate.mjs   # from repo root; exit 1 while LICENSE is absent
```

`npm test` runs the identifier-scope pins, README examples, the
ZB20-N41 exhaustive single-digit + adjacent-transposition sweep over
every valid vector, ZB20-D09/N42 validator-only and holder-field guards,
and the ZB20-N45 pre-publish gate negative control (a temp copy passes
only with a dummy `LICENSE`; the real repo has none and must fail the
gate). Note the GS1 modulo-10 blind spot pinned in the sweep: swapping
adjacent digits differing by 5 changes the weighted sum by a multiple
of 10, so that transposition yields another valid GTIN by construction.

## Status

Nothing is deployed; `gtin.etzhayyim.com` serves nothing and the
`xrpc-adapter` Worker has never been built. No GTIN in any example here
corresponds to a real product — `5901234123457` and `012345678905` are
GS1's published check-digit examples and `4569951116179` is GS1 Japan's
Basic Guide worked JAN example.

## License

This repository ships no `LICENSE` file, deliberately: the license and the
rights-holder name for the parts created here
(`docs/identifier-scope.md`, the `identifier scope pins` block added to
`kotoba/test/gtin.test.ts`, and this section) are pending the owner's
decision, and a published license cannot be taken back once public. Until
that decision, do not treat any file here as carrying an implied license.

There is no `data/` directory and no vendored third-party data, so there are
no third-party dataset terms to keep. Check-digit example values are cited
with their sources in
[`docs/identifier-scope.md`](docs/identifier-scope.md) and remain under
their sources' terms.

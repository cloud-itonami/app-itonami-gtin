# Identifier scope: validators, not registries (AWAI-3808)

These repositories are validators, not registries.

`cloud-itonami/app-itonami-gtin`,
[`network-awai/app-isbn`](https://github.com/network-awai/app-isbn), and
[`network-awai/app-issn`](https://github.com/network-awai/app-issn)
judge identifier *shape* (format + check digit) against committed test
vectors. They keep no identifier registry: no issuance records, no holder
data, no lookup against an issuing authority. A "valid" verdict means the
digits are internally consistent — nothing more.

## What is validated

| Repo | Identifier | Check |
|---|---|---|
| `app-itonami-gtin` | GTIN-8 / UPC-12 / EAN-13 / JAN-13 / GTIN-14 | Length + modulo-10 check digit; all families canonicalise to GTIN-14 |
| `app-isbn` | ISBN-13 / ISBN-10 | Format + check digit (read-only reference here; judged in that repo) |
| `app-issn` | ISSN (8 characters, hyphen optional) | Format + check digit (read-only reference here; judged in that repo) |

The per-type algorithms live in each repo's `kotoba/src/types.ts`. This doc
restates none of them: third-party classification text and definition
statements are not republished here. Only check-digit example values (below
and in the tests) and repository URLs appear in this doc.

## What is explicitly NOT kept

- Identifier registries (no table of issued GTINs / ISBNs / ISSNs anywhere).
- Holder or manufacturer directories derived from a prefix.
- Issuance records or lookup against GS1, an ISBN agency, or the ISSN Centre.
- LEI judgments: the authority for LEI format is separately confirmed, and
  this doc asserts nothing about LEI.

## Measured pins (2026-11-22, `main`, `gh api` trees + contents)

| Repo | Blobs on `main` | Vector file | Lines | Assertions |
|---|---|---|---|---|
| `cloud-itonami/app-itonami-gtin` (this repo) | 20 | `kotoba/test/gtin.test.ts` (vectors in the `identifier scope pins` block) | — | 5 GTIN rows |
| `network-awai/app-isbn` | 22 | `kotoba/test/parity_vectors.mjs` | 18 lines | 7 assertions |
| `network-awai/app-issn` | 16 | `kotoba/test/parity_vectors.mjs` | 17 lines | 8 assertions |

The sibling vector files are reused read-only: this repo changes nothing in
`app-isbn` or `app-issn` (this issue touches the host repo only). The counts
above are asserted by `kotoba/test/gtin.test.ts` (`identifier scope pins`):
a changed vector row count, or removal of the
"These repositories are validators, not registries." sentence, fails the
suite.

## Check-digit example values used here

These are worked examples only, not a registry excerpt. GTIN examples are the
ones GS1 uses in its own check-digit documentation and the ones already used
in this repo's README and tests.

| Example | Expected |
|---|---|
| `5901234123457` | valid EAN-13 (GS1's own published worked example; Poland 590 prefix, outside the 45/49 Japanese numbering space) |
| `012345678905` | valid UPC-12 (canonical published UPC-A example) |
| `4569951116179` | valid GTIN-13, JAN-13 form (prefix 45; GS1 Japan Basic Guide worked example) |
| `5901234123456` | rejected, `invalidChecksum` (one digit off a valid vector) |
| `invalid-gtin` | rejected, `invalidFormat` |

ISBN/ISSN example values are not copied here; they live in the sibling
repos' `parity_vectors.mjs` files linked above.

## License note

This repo ships no `LICENSE` file. See the License section of the repo root
`README.md` for what that means and why.

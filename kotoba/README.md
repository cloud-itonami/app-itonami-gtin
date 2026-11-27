# gtin kotoba (validator only)

Validator only, not a registry (AWAI-3808 / ZB20-D09, `docs/identifier-scope.md`).
This package judges GTIN shape — length plus modulo-10 check digit — and
canonicalises to GTIN-14. It keeps no product, holder, or issuance record,
writes nothing, and resolves no prefix to an owner.

Exports: `validateGtin`, `isValidGtin`, `gtinCheckDigit`, `detectCodeType`,
`normalizeGtinDigits`, `toGtin14`, plus the holder-field guard
(`findHolderField`, `HOLDER_FIELDS`). There is deliberately no
register/lookup/list product API and no product collection.

Payloads carrying holder/issuance/registry fields (`holder`, `owner`,
`registrant`, `issuedTo`, `manufacturer`, `brand`, `productName`,
`productId`, and variants) are rejected with
`{ status: "rejected", error: "holderFieldProhibited" }` (ZB20-N42).

## Check-digit validation

GTIN modulo 10 with alternating weights 3/1 from the right (excluding
check digit). `isValidGtin` works for GTIN-8/12/13/14. Families left
zero-pad to GTIN-14: `01234565` → `00000001234565`,
`5901234123457` → `05901234123457` (published examples, not products).

## Tests

```console
$ cd kotoba && npm install && npm test
```

Covers the parity pins (`gtin.test.ts`), README examples, the ZB20-N41
single-digit/transposition sweep, ZB20-D09/N42 validator-only guards,
and the ZB20-N45 pre-publish gate negative control.

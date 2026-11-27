/**
 * gtin kotoba — barrel (validator only, AWAI-3808 / ZB20-D09).
 *
 * Exports only GTIN shape validation and pure checksum helpers.
 * There is deliberately no product/holder registry export:
 * no register*, no lookup*, no list*, and no product collection.
 */
export * from "./types.js";
export { validateGtin, findHolderField, HOLDER_FIELDS } from "./validator.js";

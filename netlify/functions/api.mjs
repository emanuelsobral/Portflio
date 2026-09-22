import { getStore } from "@netlify/blobs";
import { createRequire } from "node:module";
import initial from "../../content.json" with { type: "json" };

// Keep CommonJS dependencies traceable when Netlify packages this ESM function.
const require = createRequire(import.meta.url);
const api = require("../../lib/api.cjs");

export default async (request, context) => {
  const blobs = getStore({ name: "portfolio-admin", consistency: "strong" });
  const store = {
    get: async (key) => {
      const record = await blobs.getWithMetadata(key, { type: "json" });
      return record ? { data: record.data, etag: record.etag } : null;
    },
    set: async (key, data, condition = {}) => {
      const result = await blobs.setJSON(key, data, {
        ...(condition.create ? { onlyIfNew: true } : {}),
        ...(condition.etag ? { onlyIfMatch: condition.etag } : {}),
      });
      return result.modified;
    },
    delete: (key) => blobs.delete(key),
    list: async (prefix) =>
      (await blobs.list({ prefix })).blobs.map((blob) => blob.key),
  };
  return api.createApi({
    store,
    initial,
    setupToken: process.env.ADMIN_SETUP_TOKEN || "",
  })(request, { ip: context.ip });
};
export const config = { path: "/api/*" };

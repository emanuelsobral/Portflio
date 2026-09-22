import { getStore } from "@netlify/blobs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import initial from "../../content.json" with { type: "json" };

// Keep CommonJS dependencies traceable when Netlify packages this ESM function.
const require = createRequire(import.meta.url);
const page = require("../../lib/page.cjs");

export default async () => {
  try {
    const store = getStore({ name: "portfolio-admin", consistency: "strong" });
    const data = (await store.get("content", { type: "json" })) || initial;
    const template = await readFile(
      path.join(process.cwd(), "index.html"),
      "utf8",
    );
    return new Response(page.renderPage(template, data), {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Page rendering failed:", error.message);
    return new Response(
      "Não foi possível carregar o portfólio. Tente novamente.",
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
};
export const config = { path: ["/", "/index.html"], preferStatic: false };

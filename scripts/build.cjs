const fs = require("node:fs/promises");
const path = require("node:path");
(async () => {
  const destination = path.join(__dirname, "..", "public");
  await fs.mkdir(destination, { recursive: true });
  for (const file of [
    "index.html",
    "style.css",
    "main.js",
    "scene.js",
    "content.json",
    "content-loader.js",
    "content-renderer.js",
    "_redirects",
    "admin",
    "img",
    "icon",
    "src",
  ]) {
    await fs.cp(
      path.join(__dirname, "..", file),
      path.join(destination, file),
      { recursive: true },
    );
  }
  console.log("Site e painel preparados em public/.");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

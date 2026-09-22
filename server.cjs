const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const { createApi } = require("./lib/api.cjs");
const { createFileStore } = require("./lib/file-store.cjs");
const { renderPage } = require("./lib/page.cjs");
const initial = require("./content.json");
const root = __dirname;
const store = createFileStore(
  process.env.PORTFOLIO_DATA_DIR || path.join(root, ".admin"),
);
const handler = createApi({ store, initial, local: true });
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".woff2": "font/woff2",
  ".pdf": "application/pdf",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};
const allowed =
  /^(index\.html|style\.css|main\.js|scene\.js|content(?:-loader|-renderer)?\.(?:js|json)|admin\/(?:index\.html|admin\.css|admin\.js)|(?:img|icon|src)\/[^\\]+)$/;
const server = http.createServer(async (req, res) => {
  try {
    const port = server.address().port;
    if (
      !["127.0.0.1:" + port, "localhost:" + port].includes(req.headers.host)
    ) {
      res.writeHead(403);
      res.end();
      return;
    }
    const address = "http://" + req.headers.host;
    const url = new URL(req.url, address);
    if (url.pathname.startsWith("/api/")) {
      const buffers = [];
      let length = 0;
      for await (const chunk of req) {
        length += chunk.length;
        if (length > 4500000) {
          res.writeHead(413);
          res.end();
          return;
        }
        buffers.push(chunk);
      }
      const request = new Request(url, {
        method: req.method,
        headers: req.headers,
        ...(req.method !== "GET" && req.method !== "HEAD"
          ? { body: Buffer.concat(buffers) }
          : {}),
      });
      const response = await handler(request, { ip: req.socket.remoteAddress });
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(Buffer.from(await response.arrayBuffer()));
      return;
    }
    let file = decodeURIComponent(url.pathname).replace(/^\//, "");
    if (!file) file = "index.html";
    if (file === "admin" || file === "admin/") file = "admin/index.html";
    if (
      !["GET", "HEAD"].includes(req.method) ||
      !allowed.test(file) ||
      file.split("/").includes("..")
    ) {
      res.writeHead(404);
      res.end();
      return;
    }
    let bytes = await fs.readFile(path.join(root, file));
    if (file === "index.html")
      bytes = Buffer.from(
        renderPage(
          bytes.toString("utf8"),
          (await store.get("content"))?.data || initial,
        ),
      );
    res.writeHead(200, {
      "Content-Type": mime[path.extname(file)] || "application/octet-stream",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "SAMEORIGIN",
    });
    res.end(req.method === "HEAD" ? undefined : bytes);
  } catch (error) {
    res.writeHead(error.code === "ENOENT" ? 404 : 500);
    res.end("Não foi possível carregar.");
  }
});
const preferred = Number(process.env.PORT || 4173);
server.on("error", (error) => {
  if (error.code === "EADDRINUSE" && !process.env.PORT)
    server.listen(0, "127.0.0.1");
  else {
    console.error(error.message);
    process.exitCode = 1;
  }
});
server.listen(preferred, "127.0.0.1", () =>
  console.log(
    "Portfólio: http://127.0.0.1:" +
      server.address().port +
      "\nADM: http://127.0.0.1:" +
      server.address().port +
      "/admin/",
  ),
);

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createApi } = require("../lib/api.cjs");
const { schema, safeAsset, safeUrl } = require("../lib/content-schema.cjs");
const initial = require("../content.json");
const { parseHTML } = require("linkedom");
const { render } = require("../content-renderer.js");
const fs = require("node:fs");
function memoryStore() {
  const records = new Map();
  let revision = 0;
  return {
    records,
    get: async (key) => records.get(key) || null,
    set: async (key, data, c = {}) => {
      const old = records.get(key);
      if ((c.create && old) || (c.etag && old?.etag !== c.etag)) return false;
      records.set(key, {
        data: structuredClone(data),
        etag: String(++revision),
      });
      return true;
    },
    delete: async (key) => records.delete(key),
    list: async (prefix) =>
      [...records.keys()].filter((key) => key.startsWith(prefix)),
  };
}
function client(api) {
  let cookie = "",
    csrf = "";
  return {
    get cookie() {
      return cookie;
    },
    set csrf(value) {
      csrf = value;
    },
    async call(route, method = "GET", data, headers = {}) {
      const response = await api(
        new Request("https://portfolio.test/api/" + route, {
          method,
          headers: {
            Origin: "https://portfolio.test",
            "Content-Type": "application/json",
            Cookie: cookie,
            "X-CSRF-Token": csrf,
            ...headers,
          },
          ...(method === "GET"
            ? {}
            : {
                body: Buffer.isBuffer(data) ? data : JSON.stringify(data || {}),
              }),
        }),
        { ip: "test" },
      );
      if (response.headers.get("set-cookie"))
        cookie = response.headers.get("set-cookie").split(";")[0];
      const body = response.headers
        .get("content-type")
        ?.includes("application/json")
        ? await response.json()
        : Buffer.from(await response.arrayBuffer());
      if (body.csrf) csrf = body.csrf;
      return { response, body, status: response.status };
    },
  };
}
test("schema rejects executable URLs, traversal, duplicate ids and unknown categories", () => {
  assert(schema.safeParse(initial).success);
  for (const url of [
    "javascript:alert(1)",
    "data:text/html,x",
    "//evil.test",
    "https://user:pass@evil.test",
    "https:\\evil.test",
  ])
    assert(!safeUrl(url));
  for (const file of ["../.admin/key", "src/../../secret", "/api/media/a.html"])
    assert(!safeAsset(file));
  const data = structuredClone(initial);
  data.skills[0].categories = ["missing"];
  assert(!schema.safeParse(data).success);
  data.skills[0].categories = initial.skills[0].categories;
  data.skills[1].id = data.skills[0].id;
  assert(!schema.safeParse(data).success);
});
test("online setup, authentication, csrf, concurrency, backup, media and revocation", async () => {
  const store = memoryStore(),
    api = createApi({
      store,
      initial,
      setupToken: "test-activation-key-with-32-characters",
    }),
    user = client(api);
  assert.equal((await user.call("content")).status, 401);
  assert.equal(
    (
      await user.call("setup", "POST", {
        email: "me@example.com",
        password: "LongPassword123!",
      })
    ).status,
    403,
  );
  let result = await user.call("setup", "POST", {
    email: "me@example.com",
    password: "LongPassword123!",
    setupToken: "test-activation-key-with-32-characters",
  });
  assert.equal(result.status, 200);
  assert.match(
    result.response.headers.get("set-cookie"),
    /HttpOnly.*SameSite=Strict.*Secure/,
  );
  assert.equal(
    (
      await user.call("setup", "POST", {
        setupToken: "test-activation-key-with-32-characters",
      })
    ).status,
    409,
  );
  const original = await user.call("content");
  const edited = structuredClone(original.body.data);
  edited.hero.name = "Updated";
  assert.equal(
    (
      await user.call(
        "content",
        "PUT",
        { data: edited, etag: original.body.etag },
        { "X-CSRF-Token": "bad" },
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await user.call(
        "content",
        "PUT",
        { data: edited, etag: original.body.etag },
        { Origin: "https://evil.test" },
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await user.call("content", "PUT", {
        data: edited,
        etag: original.body.etag,
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await user.call("content", "PUT", {
        data: edited,
        etag: original.body.etag,
      })
    ).status,
    409,
  );
  assert.equal(
    (await client(api).call("public-content")).body.data.hero.name,
    "Updated",
  );
  const backups = (await user.call("backups")).body.backups;
  assert.equal(backups.length, 1);
  assert.equal(
    (await user.call("backups/" + backups[0].id)).body.data.hero.name,
    initial.hero.name,
  );
  const png = Buffer.from("89504e470d0a1a0a00000000", "hex");
  const upload = await user.call("upload", "POST", png, {
    "Content-Type": "image/png",
    "X-Upload-Kind": "asset",
  });
  assert.equal(upload.status, 200);
  assert.equal((await client(api).call(upload.body.url.slice(5))).status, 200);
  assert.equal(
    (
      await user.call(
        "upload",
        "POST",
        Buffer.from('<svg onload="alert(1)">'),
        { "Content-Type": "image/svg+xml" },
      )
    ).status,
    415,
  );
  assert.equal(
    (
      await user.call("upload", "POST", Buffer.from("%PDF-test"), {
        "X-Upload-Kind": "asset",
      })
    ).status,
    415,
  );
  const other = client(api);
  assert.equal(
    (
      await other.call("login", "POST", {
        email: "me@example.com",
        password: "LongPassword123!",
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await user.call("password", "POST", {
        oldPassword: "LongPassword123!",
        password: "NewPassword12345!",
      })
    ).status,
    200,
  );
  assert.equal((await other.call("content")).status, 401);
  assert.equal((await user.call("logout", "POST")).status, 200);
  assert.equal((await user.call("content")).status, 401);
});
test("unconfigured remote setup fails closed and login attempts are limited", async () => {
  const store = memoryStore(),
    user = client(createApi({ store, initial }));
  assert.equal((await user.call("session")).body.setupAllowed, false);
  for (let i = 0; i < 10; i++)
    assert.equal(
      (await user.call("login", "POST", { password: "wrong" })).status,
      401,
    );
  assert.equal(
    (await user.call("login", "POST", { password: "wrong" })).status,
    429,
  );
});
test("renderer escapes text, updates every content family and supports empty collections", () => {
  const { document } = parseHTML(fs.readFileSync("index.html", "utf8"));
  const data = structuredClone(initial);
  data.hero.name = "<img src=x onerror=alert(1)>";
  data.about.body = "**Bold** <script>alert(1)</script>";
  data.contact.email = "new@example.com";
  data.experiences = [];
  data.education = [];
  data.skills = [];
  data.projects = [];
  render(document, data);
  assert.equal(document.querySelector(".hero-content h1 img"), null);
  assert.match(document.querySelector(".hero-content h1").textContent, /<img/);
  assert.equal(document.querySelector(".sobre-texto p script"), null);
  assert.equal(
    document.querySelector(".sobre-texto p strong").textContent,
    "Bold",
  );
  assert.equal(document.querySelectorAll(".skill-card").length, 0);
  assert.equal(document.querySelector("#skill-detail").hidden, true);
  assert.equal(
    document.querySelector(".contact-links a").getAttribute("href"),
    "mailto:new@example.com",
  );
});
test("server-rendered data escapes script terminators without losing text", () => {
  const { renderPage } = require("../lib/page.cjs");
  const data = structuredClone(initial);
  data.hero.name = "</script><script>alert(1)</script>";
  const html = renderPage(fs.readFileSync("index.html", "utf8"), data);
  const { document } = parseHTML(html);
  assert.equal(
    JSON.parse(document.querySelector("#portfolio-data").textContent).hero.name,
    data.hero.name,
  );
  assert.equal(document.querySelector("h1 script"), null);
  assert(
    !document
      .querySelector("#portfolio-data")
      .textContent.includes("</script>"),
  );
  assert.equal(
    [
      ...document.querySelectorAll('script:not([type="application/json"])'),
    ].filter((script) => script.textContent.includes("alert(1)")).length,
    0,
  );
});
test("file storage survives a new instance and detects stale revisions", async () => {
  const { createFileStore } = require("../lib/file-store.cjs");
  const promises = require("node:fs/promises"),
    path = require("node:path");
  const directory = await promises.mkdtemp(path.resolve(".qa/store-test-"));
  const first = createFileStore(directory);
  assert(await first.set("content", initial, { create: true }));
  const saved = await first.get("content");
  const second = createFileStore(directory);
  assert.deepEqual((await second.get("content")).data, initial);
  assert.equal(await second.set("content", initial, { etag: "stale" }), false);
  assert(await second.set("content", initial, { etag: saved.etag }));
});

const crypto = require("node:crypto");
const { promisify } = require("node:util");
const { schema } = require("./content-schema.cjs");
const scrypt = promisify(crypto.scrypt);
const digest = (value) =>
  crypto.createHash("sha256").update(value).digest("hex");
const random = () => crypto.randomBytes(32).toString("hex");
const equal = (a, b) => {
  const aa = Buffer.from(String(a)),
    bb = Buffer.from(String(b));
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
};
const sessionKey = (req) => {
  const value = (req.headers.get("cookie") || "")
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith("portfolio_session="))
    ?.split("=")[1];
  return value && /^[a-f0-9]{64}$/.test(value)
    ? "sessions/" + digest(value)
    : null;
};
function createApi({ store, initial, local = false, setupToken = "" }) {
  const json = (value, status = 200, headers = {}) =>
    Response.json(value, {
      status,
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        ...headers,
      },
    });
  const fail = (status, message) => {
    throw Object.assign(new Error(message), { status });
  };
  const cookie = (value, age = 43200) =>
    "portfolio_session=" +
    value +
    "; Path=/; HttpOnly; SameSite=Strict; Max-Age=" +
    age +
    (local ? "" : "; Secure");
  async function passwordHash(password, salt) {
    return (await scrypt(password, salt, 64)).toString("hex");
  }
  async function createSession(account) {
    const token = random(),
      csrf = random();
    await store.set("sessions/" + digest(token), {
      csrf,
      version: account.version,
      expires: Date.now() + 43200000,
    });
    return { token, csrf };
  }
  async function readJSON(req) {
    if (!req.headers.get("content-type")?.startsWith("application/json"))
      fail(415, "Envie dados JSON.");
    const raw = await req.text();
    if (Buffer.byteLength(raw) > 600000) fail(413, "Conteúdo muito grande.");
    try {
      return JSON.parse(raw);
    } catch {
      fail(400, "Arquivo JSON inválido.");
    }
  }
  async function current() {
    return (await store.get("content")) || { data: initial, etag: "initial" };
  }
  async function authenticated(req) {
    const key = sessionKey(req);
    const record = key && (await store.get(key));
    const account = await store.get("account");
    if (
      !record ||
      !account ||
      record.data.expires < Date.now() ||
      record.data.version !== account.data.version
    )
      fail(401, "Sua sessão expirou. Entre novamente.");
    return { key, session: record.data, account: account.data };
  }
  async function rateLimit(ip) {
    const key = "attempts/" + digest(ip || "unknown");
    for (let i = 0; i < 5; i++) {
      const saved = await store.get(key);
      const value = saved?.data;
      const fresh = !value || value.until < Date.now();
      if (!fresh && value.count >= 10)
        fail(429, "Muitas tentativas. Aguarde 15 minutos.");
      const next = {
        count: fresh ? 1 : value.count + 1,
        until: fresh ? Date.now() + 900000 : value.until,
      };
      if (await store.set(key, next, { etag: saved?.etag, create: !saved }))
        return;
    }
    fail(429, "Tente novamente em alguns minutos.");
  }
  return async function handle(req, { ip = "local" } = {}) {
    try {
      const url = new URL(req.url),
        pathname = url.pathname.replace(/^\/.netlify\/functions\/api/, "/api");
      if (!["GET", "POST", "PUT"].includes(req.method))
        fail(405, "Método não permitido.");
      if (req.method !== "GET") {
        if (req.headers.get("origin") !== url.origin)
          fail(403, "Origem não autorizada.");
        if (Number(req.headers.get("content-length") || 0) > 4500000)
          fail(413, "Arquivo muito grande.");
      }
      if (pathname === "/api/public-content" && req.method === "GET")
        return json(await current());
      if (pathname.startsWith("/api/media/") && req.method === "GET") {
        const name = pathname.slice("/api/media/".length);
        if (!/^[a-f0-9-]+\.(png|jpg|webp|gif|pdf|docx)$/.test(name))
          fail(404, "Arquivo não encontrado.");
        const saved = await store.get("media/" + name);
        if (!saved) fail(404, "Arquivo não encontrado.");
        return new Response(Buffer.from(saved.data.bytes, "base64"), {
          headers: {
            "Content-Type": saved.data.type,
            "X-Content-Type-Options": "nosniff",
            "Cache-Control": "public, max-age=31536000, immutable",
            "Content-Disposition":
              (name.endsWith(".pdf") || name.endsWith(".docx")
                ? "attachment"
                : "inline") +
              '; filename="' +
              name +
              '"',
          },
        });
      }
      if (pathname === "/api/session" && req.method === "GET") {
        const account = await store.get("account");
        if (!account)
          return json({
            authenticated: false,
            needsSetup: true,
            setupAllowed: local || setupToken.length >= 24,
            local,
          });
        try {
          const auth = await authenticated(req);
          return json({
            authenticated: true,
            csrf: auth.session.csrf,
            email: auth.account.email,
            local,
          });
        } catch {
          return json({ authenticated: false, needsSetup: false, local });
        }
      }
      if (pathname === "/api/setup" && req.method === "POST") {
        await rateLimit(ip);
        const body = await readJSON(req);
        if (
          !local &&
          (setupToken.length < 24 || !equal(body.setupToken, setupToken))
        )
          fail(403, "Chave de ativação inválida.");
        if (await store.get("account"))
          fail(409, "O administrador já foi criado.");
        if (
          typeof body.password !== "string" ||
          body.password.length < 12 ||
          body.password.length > 200
        )
          fail(400, "A senha deve ter entre 12 e 200 caracteres.");
        if (
          typeof body.email !== "string" ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email) ||
          body.email.length > 254
        )
          fail(400, "E-mail inválido.");
        const salt = random();
        const account = {
          email: body.email.trim().toLowerCase(),
          salt,
          hash: await passwordHash(body.password, salt),
          version: random(),
        };
        if (!(await store.set("account", account, { create: true })))
          fail(409, "O administrador já foi criado.");
        const session = await createSession(account);
        return json({ csrf: session.csrf }, 200, {
          "Set-Cookie": cookie(session.token),
        });
      }
      if (pathname === "/api/login" && req.method === "POST") {
        await rateLimit(ip);
        const body = await readJSON(req);
        const account = (await store.get("account"))?.data;
        if (
          typeof body.password !== "string" ||
          body.password.length > 200 ||
          !account
        )
          fail(401, "E-mail ou senha incorretos.");
        const hash = await passwordHash(body.password, account.salt);
        if (
          !equal(hash, account.hash) ||
          !equal(String(body.email).trim().toLowerCase(), account.email)
        )
          fail(401, "E-mail ou senha incorretos.");
        const session = await createSession(account);
        return json({ csrf: session.csrf }, 200, {
          "Set-Cookie": cookie(session.token),
        });
      }
      const auth = await authenticated(req);
      if (
        req.method !== "GET" &&
        !equal(req.headers.get("x-csrf-token"), auth.session.csrf)
      )
        fail(403, "Sessão inválida. Entre novamente.");
      if (pathname === "/api/logout" && req.method === "POST") {
        await store.delete(auth.key);
        return json({ ok: true }, 200, { "Set-Cookie": cookie("", 0) });
      }
      if (pathname === "/api/content" && req.method === "GET")
        return json(await current());
      if (pathname === "/api/validate" && req.method === "POST") {
        const body = await readJSON(req);
        const parsed = schema.safeParse(body.data);
        if (!parsed.success)
          return json(
            {
              error: "Revise os campos indicados.",
              issues: parsed.error.issues.map((i) => ({
                path: i.path.join("."),
                message: i.message,
              })),
            },
            422,
          );
        return json({ data: parsed.data });
      }
      if (pathname === "/api/content" && req.method === "PUT") {
        const body = await readJSON(req);
        const parsed = schema.safeParse(body.data);
        if (!parsed.success)
          return json(
            {
              error: "Revise os campos indicados.",
              issues: parsed.error.issues.map((i) => ({
                path: i.path.join("."),
                message: i.message,
              })),
            },
            422,
          );
        const previous = await current();
        if (body.etag !== previous.etag)
          fail(
            409,
            "O conteúdo mudou em outra sessão. Exporte seu rascunho e recarregue antes de salvar.",
          );
        const backupId =
          new Date().toISOString().replace(/[:.]/g, "-") +
          "-" +
          crypto.randomUUID();
        await store.set("backups/" + backupId, {
          date: new Date().toISOString(),
          content: previous.data,
        });
        const modified = await store.set("content", parsed.data, {
          etag: previous.etag === "initial" ? undefined : previous.etag,
          create: previous.etag === "initial",
        });
        if (!modified)
          fail(409, "Outra edição foi salva. Recarregue o conteúdo.");
        return json(await current());
      }
      if (pathname === "/api/backups" && req.method === "GET") {
        const keys = (await store.list("backups/"))
          .sort()
          .reverse()
          .slice(0, 30);
        return json({
          backups: keys.map((key) => ({
            id: key.slice(8),
            date: key.slice(8, 27),
          })),
        });
      }
      if (pathname.startsWith("/api/backups/") && req.method === "GET") {
        const id = pathname.slice("/api/backups/".length);
        if (!/^[0-9TZa-f-]+$/.test(id)) fail(400, "Backup inválido.");
        const saved = await store.get("backups/" + id);
        if (!saved) fail(404, "Backup não encontrado.");
        return json({ data: saved.data.content });
      }
      if (pathname === "/api/password" && req.method === "POST") {
        const body = await readJSON(req);
        if (
          typeof body.oldPassword !== "string" ||
          body.oldPassword.length > 200 ||
          !equal(
            await passwordHash(body.oldPassword, auth.account.salt),
            auth.account.hash,
          )
        )
          fail(403, "Senha atual incorreta.");
        if (
          typeof body.password !== "string" ||
          body.password.length < 12 ||
          body.password.length > 200
        )
          fail(400, "A nova senha deve ter entre 12 e 200 caracteres.");
        const salt = random(),
          account = {
            ...auth.account,
            salt,
            hash: await passwordHash(body.password, salt),
            version: random(),
          };
        await store.set("account", account);
        const session = await createSession(account);
        return json({ csrf: session.csrf }, 200, {
          "Set-Cookie": cookie(session.token),
        });
      }
      if (pathname === "/api/upload" && req.method === "POST") {
        const bytes = Buffer.from(await req.arrayBuffer());
        if (bytes.length > 3 * 1024 * 1024)
          fail(413, "O limite por arquivo é 3 MB.");
        let extension, type;
        if (
          bytes
            .subarray(0, 8)
            .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        ) {
          extension = "png";
          type = "image/png";
        } else if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) {
          extension = "jpg";
          type = "image/jpeg";
        } else if (
          bytes.toString("ascii", 0, 4) === "RIFF" &&
          bytes.toString("ascii", 8, 12) === "WEBP"
        ) {
          extension = "webp";
          type = "image/webp";
        } else if (/^GIF8[79]a/.test(bytes.toString("ascii", 0, 6))) {
          extension = "gif";
          type = "image/gif";
        } else if (bytes.toString("ascii", 0, 5) === "%PDF-") {
          extension = "pdf";
          type = "application/pdf";
        } else if (
          bytes[0] === 80 &&
          bytes[1] === 75 &&
          req.headers.get("x-file-name")?.toLowerCase().endsWith(".docx")
        ) {
          extension = "docx";
          type =
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        } else fail(415, "Use PNG, JPG, WebP, GIF, PDF ou DOCX.");
        if (
          req.headers.get("x-upload-kind") === "asset" &&
          !type.startsWith("image/")
        )
          fail(415, "Este campo aceita apenas imagens.");
        if (
          req.headers.get("x-upload-kind") === "document" &&
          !["pdf", "docx"].includes(extension)
        )
          fail(415, "Este campo aceita PDF ou DOCX.");
        const name = crypto.randomUUID() + "." + extension;
        await store.set(
          "media/" + name,
          { bytes: bytes.toString("base64"), type },
          { create: true },
        );
        return json({ url: "/api/media/" + name });
      }
      fail(404, "Página não encontrada.");
    } catch (error) {
      if (!error.status) console.error("API failure:", error.message);
      return json(
        {
          error: error.status
            ? error.message
            : "Não foi possível concluir. Tente novamente.",
        },
        error.status || 500,
      );
    }
  };
}
module.exports = { createApi };

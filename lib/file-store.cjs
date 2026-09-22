const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");
function createFileStore(directory) {
  let queue = Promise.resolve();
  const filename = (key) =>
    path.join(directory, Buffer.from(key).toString("hex") + ".json");
  async function get(key) {
    try {
      return JSON.parse(await fs.readFile(filename(key), "utf8"));
    } catch (e) {
      if (e.code === "ENOENT") return null;
      throw e;
    }
  }
  function set(key, data, condition = {}) {
    const operation = queue.then(async () => {
      await fs.mkdir(directory, { recursive: true });
      const previous = await get(key);
      if (
        (condition.create && previous) ||
        (condition.etag && previous?.etag !== condition.etag)
      )
        return false;
      const value = { data, etag: crypto.randomUUID() };
      const target = filename(key),
        temporary = target + ".tmp";
      await fs.writeFile(temporary, JSON.stringify(value));
      await fs.rename(temporary, target);
      return true;
    });
    queue = operation.catch(() => {});
    return operation;
  }
  return {
    get,
    set,
    delete: async (key) => fs.rm(filename(key), { force: true }),
    list: async (prefix) => {
      let files;
      try {
        files = await fs.readdir(directory);
      } catch (e) {
        if (e.code === "ENOENT") return [];
        throw e;
      }
      return files
        .filter((f) => f.endsWith(".json"))
        .map((f) => Buffer.from(f.slice(0, -5), "hex").toString())
        .filter((key) => key.startsWith(prefix));
    },
  };
}
module.exports = { createFileStore };

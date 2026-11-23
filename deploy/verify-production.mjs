import fs from "node:fs";
import path from "node:path";

const APP_UID = 1000;
const APP_GID = 1000;
const fail = (message) => { throw new Error(message); };

function writableByApp(filename) {
  const stat = fs.statSync(filename);
  const mode = stat.mode & 0o777;
  return stat.uid === APP_UID ? Boolean(mode & 0o200)
    : stat.gid === APP_GID ? Boolean(mode & 0o020)
      : Boolean(mode & 0o002);
}

/** Validate the resolved Docker Compose config before touching ANY production state. */
export function validateProductionConfiguration(config) {
  const service = config?.services?.web;
  if (!service) fail("Missing web service.");
  const env = service.environment ?? {};
  if (env.NODE_ENV !== "production") fail("NODE_ENV must be production.");
  if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32 ||
    /^(change|replace|insert|secret|example|test)/i.test(env.SESSION_SECRET)) {
    fail("Existing production SESSION_SECRET must be supplied (min 32 chars).");
  }
  const site = new URL(env.SITE_URL || "");
  if (site.protocol !== "https:" || site.username || site.password || site.pathname !== "/" ||
      site.search || site.hash || site.port) fail("SITE_URL must be an HTTPS origin.");
  if (env.NEXT_PUBLIC_SITE_URL !== site.origin) fail("Site origins do not match.");
  if (env.COOKIE_SECURE === "false") fail("COOKIE_SECURE=false is unsafe in production.");
  if (env.HUNYUAN3D_API_URL && !/^https?:\/\//.test(env.HUNYUAN3D_API_URL)) {
    fail("HUNYUAN3D_API_URL must be an absolute URL.");
  }

  const volumes = service.volumes ?? [];
  const required = [
    ["/app/data", "Data volume"],
    ["/app/public/uploads", "Media volume"],
  ];
  const paths = [];
  for (const [target, label] of required) {
    const mounts = volumes.filter((mount) => mount.target === target);
    if (mounts.length !== 1 || mounts[0].type !== "bind" || mounts[0].read_only) {
      fail(label + " must be a single writable bind mount.");
    }
    const filename = mounts[0].source;
    if (!filename || !path.isAbsolute(filename) ||
        !fs.existsSync(filename) || !fs.statSync(filename).isDirectory()) {
      fail(label + " does not exist: " + filename);
    }
    if (!writableByApp(filename)) {
      fail(label + " is not writable by container user 1000:1000: " + filename);
    }
    paths.push(fs.realpathSync(filename));
  }
  if (paths[0] === paths[1] || paths[0].startsWith(paths[1] + path.sep) ||
      paths[1].startsWith(paths[0] + path.sep)) {
    fail("Data and media volumes must be separate.");
  }

  const cmsFile = path.join(paths[0], "cms-store.json");
  if (!fs.existsSync(cmsFile)) fail("Missing existing CMS database; refusing to seed default accounts.");
  if (!writableByApp(cmsFile)) fail("CMS database is not writable by container user 1000:1000.");
  const cms = JSON.parse(fs.readFileSync(cmsFile, "utf8"));
  if (!Array.isArray(cms.users) || cms.users.length === 0 ||
      !Array.isArray(cms.products)) fail("Existing CMS database is not valid.");
  // Ensure we are handing off real accounts, not a new throwaway demo data file.
  if (!cms.users.some((u) => u && typeof u.id === "string" && typeof u.email === "string")) {
    fail("CMS database is missing account identities.");
  }

  const arFile = path.join(paths[0], "ar-artworks.json");
  if (fs.existsSync(arFile)) {
    if (!writableByApp(arFile)) fail("AR registry is not writable by the app.");
    const ar = JSON.parse(fs.readFileSync(arFile, "utf8"));
    if (ar.schemaVersion !== 1 || !Array.isArray(ar.artworks) ||
        !ar.collections || typeof ar.collections !== "object" || Array.isArray(ar.collections)) {
      fail("AR registry is corrupt or has an unsupported schema.");
    }
  }

  const networkName = Array.isArray(service.networks)
    ? service.networks[0]
    : Object.keys(service.networks ?? {})[0];
  if (!networkName || !config.networks?.[networkName]?.external) {
    fail("EVERIE must use the existing external reverse-proxy Docker network.");
  }
  return { site: site.origin, data: paths[0], uploads: paths[1],
    network: config.networks[networkName].name, container: service.container_name };
}

if (process.argv[1] && import.meta.url === new URL("file://" + path.resolve(process.argv[1])).href) {
  try {
    let input = "";
    for await (const chunk of process.stdin) input += chunk;
    const result = validateProductionConfiguration(JSON.parse(input));
    console.log("PREFLIGHT_OK site=" + result.site +
      " data=" + result.data + " uploads=" + result.uploads +
      " network=" + result.network + " container=" + result.container);
  } catch (cause) {
    console.error("PREFLIGHT_FAILED: " + (cause instanceof Error ? cause.message : String(cause)));
    process.exitCode = 1;
  }
}

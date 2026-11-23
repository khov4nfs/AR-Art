import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { validateProductionConfiguration } from "./verify-production.mjs";

function fixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "everie-preflight-"));
  const data = path.join(dir, "data");
  const uploads = path.join(dir, "uploads");
  fs.mkdirSync(data); fs.mkdirSync(uploads);
  // Tests run as arbitrary CI UID; allow writing by the container's UID 1000.
  fs.chmodSync(data, 0o777); fs.chmodSync(uploads, 0o777);
  const cmsFile = path.join(data, "cms-store.json");
  fs.writeFileSync(cmsFile, JSON.stringify({
    users: [{ id: "u1", email: "example@invalid.test" }], products: [],
  }));
  fs.chmodSync(cmsFile, 0o666);
  const config = {
    services: {
      web: {
        container_name: "everievn-web",
        environment: {
          NODE_ENV: "production", SESSION_SECRET: "a".repeat(64),
          SITE_URL: "https://everievn.com", NEXT_PUBLIC_SITE_URL: "https://everievn.com",
        },
        networks: { edge: null },
        volumes: [
          { type: "bind", source: data, target: "/app/data" },
          { type: "bind", source: uploads, target: "/app/public/uploads" },
        ],
      },
    },
    networks: { edge: { external: true, name: "vms_edge" } },
  };
  return { data, uploads, cmsFile, config,
    cleanup: () => fs.rmSync(dir, { recursive: true, force: true }) };
}

test("production preflight accepts existing compatible CMS and volume layout", () => {
  const f = fixture();
  try {
    const result = validateProductionConfiguration(f.config);
    assert.equal(result.site, "https://everievn.com");
    assert.equal(result.network, "vms_edge");
  } finally { f.cleanup(); }
});

test("production preflight rejects a missing CMS instead of seeding default admin", () => {
  const f = fixture();
  try {
    fs.unlinkSync(f.cmsFile);
    assert.throws(() => validateProductionConfiguration(f.config), /Missing existing CMS database/);
  } finally { f.cleanup(); }
});

test("production preflight rejects weak or missing session secrets", () => {
  const f = fixture();
  try {
    for (const secret of ["", "admin123", "test-secret", "change-this-before-production"]) {
      f.config.services.web.environment.SESSION_SECRET = secret;
      assert.throws(() => validateProductionConfiguration(f.config), /SESSION_SECRET/);
    }
  } finally { f.cleanup(); }
});

test("production preflight requires HTTPS with matching public and private origins", () => {
  const f = fixture();
  try {
    f.config.services.web.environment.SITE_URL = "http://everievn.com";
    assert.throws(() => validateProductionConfiguration(f.config), /HTTPS origin/);
    f.config.services.web.environment.SITE_URL = "https://everievn.com";
    f.config.services.web.environment.NEXT_PUBLIC_SITE_URL = "https://wrong.example";
    assert.throws(() => validateProductionConfiguration(f.config), /origins do not match/);
    f.config.services.web.environment.NEXT_PUBLIC_SITE_URL = "https://everievn.com";
    f.config.services.web.environment.COOKIE_SECURE = "false";
    assert.throws(() => validateProductionConfiguration(f.config), /COOKIE_SECURE=false/);
  } finally { f.cleanup(); }
});

test("production preflight rejects a corrupted AR registry", () => {
  const f = fixture();
  try {
    const arFile = path.join(f.data, "ar-artworks.json");
    fs.writeFileSync(arFile, JSON.stringify({ schemaVersion: 100, artworks: [], collections: {} }));
    fs.chmodSync(arFile, 0o666);
    assert.throws(() => validateProductionConfiguration(f.config), /AR registry is corrupt/);
  } finally { f.cleanup(); }
});

test("production preflight rejects missing uploads or invalid mounts", () => {
  const f = fixture();
  try {
    f.config.services.web.volumes[1].source = path.join(f.data, "missing");
    assert.throws(() => validateProductionConfiguration(f.config), /Media volume does not exist/);
    f.config.services.web.volumes[1].source = f.uploads;
    f.config.services.web.volumes[1].read_only = true;
    assert.throws(() => validateProductionConfiguration(f.config), /single writable bind mount/);
  } finally { f.cleanup(); }
});

test("production preflight requires the external proxy network", () => {
  const f = fixture();
  try {
    f.config.networks.edge.external = false;
    assert.throws(() => validateProductionConfiguration(f.config), /external reverse-proxy/);
  } finally { f.cleanup(); }
});

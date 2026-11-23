import crypto from "crypto";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

/* ---------------- Session secret ---------------- */

let cachedSecret: string | null = null;

/**
 * HMAC key for session cookies. Uses SESSION_SECRET when set (required for
 * multi-instance deploys). Otherwise a random key is generated once and kept in
 * data/.session-secret so sessions survive restarts on a single server.
 */
export function sessionSecret(): string {
  if (cachedSecret) return cachedSecret;
  const env = process.env.SESSION_SECRET?.trim();
  if (env && env.length >= 16) {
    cachedSecret = env;
    return env;
  }
  const file = path.join(process.cwd(), "data", ".session-secret");
  try {
    const stored = fs.readFileSync(file, "utf-8").trim();
    if (stored.length >= 32) {
      cachedSecret = stored;
      return stored;
    }
  } catch {
    // generate below
  }
  const generated = crypto.randomBytes(48).toString("hex");
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, generated, { mode: 0o600 });
  } catch {
    // read-only FS: key lives for this process only
  }
  if (process.env.NODE_ENV === "production") {
    console.warn("[security] SESSION_SECRET is not set; using a generated key in data/.session-secret");
  }
  cachedSecret = generated;
  return generated;
}

function hmac(value: string) {
  return crypto.createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}

/** Token = base64url(userId).base64url(role).expiresAtSeconds.signature */
export function signSession(userId: string, maxAgeSeconds: number, role = ""): string {
  const exp = Math.floor(Date.now() / 1000) + maxAgeSeconds;
  const payload = `${Buffer.from(userId).toString("base64url")}.${Buffer.from(role).toString("base64url")}.${exp}`;
  return `${payload}.${hmac(payload)}`;
}

export function verifySessionToken(token?: string): { id: string; role: string } | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [idPart, rolePart, expPart, sig] = parts;
  const expected = hmac(`${idPart}.${rolePart}.${expPart}`);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  if (!/^\d+$/.test(expPart) || Number(expPart) < Date.now() / 1000) return null;
  try {
    const id = Buffer.from(idPart, "base64url").toString("utf-8");
    const role = Buffer.from(rolePart, "base64url").toString("utf-8");
    return id ? { id, role } : null;
  } catch {
    return null;
  }
}

export function verifySession(token?: string): string | null {
  return verifySessionToken(token)?.id ?? null;
}

/** Password rule shared by sign-up, reset and change: 8+ chars with a letter and a digit. */
export function passwordProblem(pw: string): string | null {
  if (pw.length < 8) return "Mật khẩu cần tối thiểu 8 ký tự.";
  if (pw.length > 128) return "Mật khẩu quá dài.";
  if (!/[A-Za-zÀ-ỹ]/.test(pw) || !/\d/.test(pw)) return "Mật khẩu cần có cả chữ và số.";
  return null;
}

export function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("base64url");
}

export function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function cookieSecure(): boolean {
  if (process.env.COOKIE_SECURE === "false") return false;
  if (process.env.COOKIE_SECURE === "true") return true;
  return process.env.NODE_ENV === "production";
}

/* ---------------- Passwords ---------------- */

export function isHashed(value?: string): boolean {
  return Boolean(value && /^\$2[aby]\$\d{2}\$/.test(value));
}

export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, 10);
}

export function bcryptCompareSync(plain: string, hash: string): boolean {
  return bcrypt.compareSync(plain, hash);
}

export async function verifyPassword(plain: string, stored?: string): Promise<boolean> {
  if (!stored) return false;
  if (isHashed(stored)) return bcrypt.compare(plain, stored);
  // Legacy plaintext (migrated at load); constant-time compare anyway.
  const a = Buffer.from(plain);
  const b = Buffer.from(stored);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/* ---------------- Rate limiting (in-memory, per process) ---------------- */

const buckets = new Map<string, { count: number; reset: number }>();

export function clientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "local"
  );
}

/** Returns seconds to wait when the limit is exceeded, else 0. */
export function rateLimit(key: string, limit: number, windowMs: number): number {
  const now = Date.now();
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k);
  }
  const bucket = buckets.get(key);
  if (!bucket || bucket.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return 0;
  }
  bucket.count += 1;
  if (bucket.count > limit) return Math.ceil((bucket.reset - now) / 1000);
  return 0;
}

export function resetRateLimit(key: string) {
  buckets.delete(key);
}

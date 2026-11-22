export const PENDING_SIGNUP_EMAIL_KEY = "everie.pending-signup-email";
export const PENDING_SIGNUP_NEXT_PATH_KEY = "everie.pending-signup-next-path";

export type AuthCallbackState =
  | { kind: "none" }
  | { kind: "success"; type: string | null }
  | { kind: "expired"; code: string; description: string }
  | { kind: "error"; code: string | null; description: string };

export function sanitizeNextPath(value?: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/collection";
  }

  return value;
}

export function parseAuthCallbackHash(hash: string): AuthCallbackState {
  const rawHash = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!rawHash) return { kind: "none" };

  const params = new URLSearchParams(rawHash);
  const error = params.get("error");
  const code = params.get("error_code");
  const description = params.get("error_description") ?? "";

  if (error) {
    if (code === "otp_expired" || /expired/i.test(description)) {
      return {
        kind: "expired",
        code: code ?? "otp_expired",
        description: description || "Email confirmation link has expired.",
      };
    }

    return {
      kind: "error",
      code,
      description: description || "Authentication link is invalid.",
    };
  }

  if (params.has("access_token") || params.has("refresh_token")) {
    return {
      kind: "success",
      type: params.get("type"),
    };
  }

  return { kind: "none" };
}

export function buildAuthRedirectUrl(requestOrigin: string, nextPath?: string) {
  const origin = requestOrigin.replace(/\/+$/, "");
  const safeNext = sanitizeNextPath(nextPath);

  return `${origin}/ar-login?next=${encodeURIComponent(safeNext)}`;
}

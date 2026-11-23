/** Require the EVERIE site's Origin for cookie-authenticated AR mutations.
 * The cookie remains HttpOnly; the browser must not send privileged AR writes
 * from another origin. SITE_URL is the canonical production origin.
 */
export function isTrustedEverieOrigin(origin: string | null, siteUrl: string): boolean {
  if (!origin) return false;
  try {
    const provided = new URL(origin);
    const expected = new URL(siteUrl);
    return provided.origin === expected.origin;
  } catch {
    return false;
  }
}

/** Separate unavailable server executables from genuinely unreadable input files. */
export function isVideoConverterToolUnavailable(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("code" in error)) return false;
  return error.code === "ENOENT" || error.code === "EACCES" || error.code === "EPERM";
}

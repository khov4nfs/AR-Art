/**
 * The TensorFlow bundle in MindAR contains a Node-only importFetch() fallback.
 * Browser scans use the native Fetch API instead of bundling node-fetch and its
 * node:fs/http/stream dependencies. This alias applies only to browser builds.
 */
export const Headers = globalThis.Headers;
export const Request = globalThis.Request;
export const Response = globalThis.Response;
export const Blob = globalThis.Blob;
export const File = globalThis.File;
export const FormData = globalThis.FormData;
const browserFetch = (...args: Parameters<typeof fetch>) => globalThis.fetch(...args);
export default browserFetch;

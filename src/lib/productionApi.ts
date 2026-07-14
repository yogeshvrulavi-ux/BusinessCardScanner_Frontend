/** Production Python API on Render (used when frontend is on Netlify or other hosts). */
export const PRODUCTION_API_URL = "https://businessscannercardbackend.onrender.com";

export function normalizeApiUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

import { getAuthApiBase } from "@/lib/authConfig";

export type AuthHealthStatus =
  | { ok: true }
  | { ok: false; reason: "missing_url" | "not_enabled" | "unreachable"; detail: string };

/** Probe backend auth API — /health should respond when backend is running. */
export async function checkAuthHealth(): Promise<AuthHealthStatus> {
  const base = getAuthApiBase();
  if (!base) {
    return { ok: false, reason: "missing_url", detail: "Backend API URL is not configured." };
  }

  try {
    const response = await fetch(`${base}/health`, { method: "GET" });
    if (response.ok) return { ok: true };
    return {
      ok: false,
      reason: "unreachable",
      detail: `Backend health check failed (${response.status}).`,
    };
  } catch {
    return {
      ok: false,
      reason: "unreachable",
      detail: "Cannot reach the backend. Check your connection and API configuration.",
    };
  }
}

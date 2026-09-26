/**
 * The transport seam.
 *
 * Services call `resolve()` rather than reaching into the mock JSON directly.
 * Today it returns bundled fixtures behind a microtask; pointing the storefront
 * at a real backend means changing this one function to `fetch`, and nothing
 * above it moves.
 */
export const BASE_URL = '';

/** Simulated latency, so loading states are exercised rather than theoretical. */
const LATENCY_MS = 0;

export async function resolve<T>(payload: T): Promise<T> {
  if (LATENCY_MS > 0) {
    await new Promise((r) => setTimeout(r, LATENCY_MS));
  }
  return payload;
}

/** The shape a live implementation would take. Unused while fixtures are bundled. */
export async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, options);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

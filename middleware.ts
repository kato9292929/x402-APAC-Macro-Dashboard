// x402 v2 protection is per-route via withX402 (see app/api/macro/**).
// This middleware is intentionally a no-op and matches nothing — it exists
// only because Next.js looks for a root middleware.ts file.
export function middleware() {}

export const config = { matcher: [] };

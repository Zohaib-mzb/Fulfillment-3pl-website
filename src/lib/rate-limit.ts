/**
 * Rate limiting for form submissions.
 * - With UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN: a shared fixed-window
 *   counter in Upstash Redis (works across all serverless instances).
 * - Otherwise: an in-memory window per warm instance (best effort, still blocks bursts).
 */
const memory = new Map<string, { count: number; reset: number }>();

export async function rateLimit(key: string, env: Record<string, string | undefined>, limit = 5, windowSec = 600) {
  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    try {
      const k = `kin:rl:${key}`;
      const res = await fetch(`${url}/pipeline`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify([['INCR', k], ['EXPIRE', k, String(windowSec), 'NX']]),
      });
      const json = (await res.json()) as { result: number }[];
      const count = Number(json[0]?.result ?? 0);
      return { ok: count <= limit, remaining: Math.max(0, limit - count) };
    } catch {
      // fall through to memory if Upstash is unreachable
    }
  }
  const now = Date.now();
  const entry = memory.get(key);
  if (!entry || entry.reset < now) {
    memory.set(key, { count: 1, reset: now + windowSec * 1000 });
    return { ok: true, remaining: limit - 1 };
  }
  entry.count++;
  if (memory.size > 5000) for (const [k, v] of memory) if (v.reset < now) memory.delete(k);
  return { ok: entry.count <= limit, remaining: Math.max(0, limit - entry.count) };
}

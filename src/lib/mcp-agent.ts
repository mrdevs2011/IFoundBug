// Pure helpers for agent-oriented MCP tools (kept separate so they are unit-testable).

const UNITS: Record<string, number> = { m: 60_000, h: 3_600_000, d: 86_400_000, w: 604_800_000 };

/** Accepts an ISO date or a relative window like "30m", "24h", "7d", "2w". Defaults to 24h. */
export function parseSince(value: unknown, now = Date.now()): string {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) return new Date(now - UNITS.d).toISOString();
  const rel = raw.match(/^(\d{1,4})\s*([mhdw])$/i);
  if (rel) {
    const ms = Number(rel[1]) * UNITS[rel[2].toLowerCase()];
    if (ms > 365 * UNITS.d) throw new Error('since window must be at most 365 days.');
    return new Date(now - ms).toISOString();
  }
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) throw new Error('since must be an ISO date or a window like "24h", "7d".');
  return date.toISOString();
}

/** Normalizes a title for duplicate detection: lowercase, no punctuation, collapsed spaces. */
export function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').replace(/\s+/g, ' ').trim();
}

/** Word-set Jaccard similarity between two titles (0..1). */
export function titleSimilarity(a: string, b: string): number {
  const wa = new Set(normalizeTitle(a).split(' ').filter((w) => w.length > 2));
  const wb = new Set(normalizeTitle(b).split(' ').filter((w) => w.length > 2));
  if (!wa.size || !wb.size) return normalizeTitle(a) === normalizeTitle(b) ? 1 : 0;
  let inter = 0;
  for (const w of wa) if (wb.has(w)) inter += 1;
  return inter / (wa.size + wb.size - inter);
}

export const DUPLICATE_THRESHOLD = 0.75;

export function findDuplicate<T extends { title: string }>(title: string, existing: T[]): T | null {
  let best: T | null = null;
  let bestScore = 0;
  for (const row of existing) {
    const score = titleSimilarity(title, row.title);
    if (score > bestScore) { best = row; bestScore = score; }
  }
  return bestScore >= DUPLICATE_THRESHOLD ? best : null;
}

export const OPEN_STATUSES = ['REPORTED', 'TRIAGED', 'IN_PROGRESS', 'READY_FOR_QA'] as const;

export type ValidationIssue = 'duplicate' | 'no-number' | 'too-short' | 'junk';

export interface ValidatedEntry {
  original: string;
  normalized: string;
  issues: ValidationIssue[];
  duplicateOf?: number;
}

export function normalizeAddress(raw: string): string {
  const titleCase = (s: string) =>
    s
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');

  return raw
    .trim()
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s+/g, ' ')
    .split(', ')
    .map(titleCase)
    .join(', ')
    .replace(/\.$/, '');
}

function dedupeKey(normalized: string): string {
  return normalized.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function validateAddresses(raws: string[]): ValidatedEntry[] {
  const seen = new Map<string, number>();

  return raws.map((raw, i) => {
    const normalized = normalizeAddress(raw);
    const issues: ValidationIssue[] = [];

    if (normalized.length < 5) {
      issues.push('junk');
      return { original: raw, normalized, issues };
    }

    if (normalized.length < 10) {
      issues.push('too-short');
    }

    if (!/^\d/.test(normalized)) {
      issues.push('no-number');
    }

    const key = dedupeKey(normalized);
    const firstIdx = seen.get(key);
    if (firstIdx !== undefined) {
      issues.push('duplicate');
      return { original: raw, normalized, issues, duplicateOf: firstIdx };
    }
    seen.set(key, i);

    return { original: raw, normalized, issues };
  });
}

export function hasIssues(entries: ValidatedEntry[]): boolean {
  return entries.some((e) => e.issues.length > 0);
}

import { normalizeAddress, validateAddresses, hasIssues } from '../validation';

describe('normalizeAddress', () => {
  it('title-cases words', () => {
    expect(normalizeAddress('12 main st plaistow nh')).toBe('12 Main St Plaistow Nh');
  });

  it('collapses extra whitespace', () => {
    expect(normalizeAddress('  14   Tracy  Ln  ')).toBe('14 Tracy Ln');
  });

  it('normalizes commas', () => {
    expect(normalizeAddress('12 Main St,Plaistow,NH')).toBe('12 Main St, Plaistow, Nh');
  });

  it('removes trailing period', () => {
    expect(normalizeAddress('12 Main St.')).toBe('12 Main St');
  });
});

describe('validateAddresses', () => {
  it('flags no house number', () => {
    const [entry] = validateAddresses(['Main Street Plaistow NH']);
    expect(entry.issues).toContain('no-number');
  });

  it('flags junk (too short)', () => {
    const [entry] = validateAddresses(['hi']);
    expect(entry.issues).toContain('junk');
  });

  it('flags too-short entries', () => {
    const [entry] = validateAddresses(['12 Oak']);
    expect(entry.issues).toContain('too-short');
  });

  it('detects exact duplicates', () => {
    const entries = validateAddresses([
      '14 Tracy Ln Plaistow NH',
      '14 Tracy Ln Plaistow NH',
    ]);
    expect(entries[1].issues).toContain('duplicate');
    expect(entries[1].duplicateOf).toBe(0);
  });

  it('detects near-duplicates after normalization', () => {
    const entries = validateAddresses([
      '14 Tracy Ln, Plaistow NH',
      '14 TRACY LN PLAISTOW NH',
    ]);
    expect(entries[1].issues).toContain('duplicate');
  });

  it('does not flag a valid address', () => {
    const [entry] = validateAddresses(['14 Tracy Ln, Plaistow, NH 03865']);
    expect(entry.issues).toHaveLength(0);
  });
});

describe('hasIssues', () => {
  it('returns false when all entries are clean', () => {
    const entries = validateAddresses(['14 Tracy Ln, Plaistow, NH 03865']);
    expect(hasIssues(entries)).toBe(false);
  });

  it('returns true when any entry has issues', () => {
    const entries = validateAddresses(['Main Street Only']);
    expect(hasIssues(entries)).toBe(true);
  });
});

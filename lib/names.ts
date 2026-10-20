// Assessor name helpers. Pure — shared by the 7.0 screen, Settings and
// the report payload (and tested in tests/names.test.ts).

export const PREFIXES = ['Mr', 'Ms', 'Mrs', 'Dr'] as const;
export type Prefix = (typeof PREFIXES)[number];

/** A saved prefix as one of PREFIXES, or "" for none / anything that isn't a title (e.g. a first name typed into the box). */
export function normalizePrefix(raw: string | null | undefined): Prefix | '' {
  const v = String(raw ?? '').trim().replace(/\.$/, '').toLowerCase();
  return PREFIXES.find((p) => p.toLowerCase() === v) ?? '';
}

/** "Mr Enda Colleran" — prefix (if a real title) + first name + surname, skipping blanks. */
export function fullName(prefix: string, first: string, surname: string): string {
  return [normalizePrefix(prefix), first.trim(), surname.trim()].filter(Boolean).join(' ');
}

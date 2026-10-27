import { useEffect, useRef } from 'react';

/**
 * Keeps a text box filled with a suggested paragraph without ever overwriting
 * the assessor's own writing. The box is (re)filled only while it is empty or
 * still holds exactly the last suggestion (or matches one of `legacyDefaults`,
 * e.g. old boilerplate the app used to pre-fill), so once someone edits it, it is
 * theirs. `resetKey` (the open report's id) clears that memory when another
 * report is opened.
 */
export function useSuggestedText(
  value: string,
  setValue: (v: string) => void,
  suggestion: string | null,
  resetKey: string | null,
  legacyDefaults: (string | RegExp)[] = [],
): void {
  const lastSuggested = useRef<string | null>(null);
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => { lastSuggested.current = null; }, [resetKey]);

  useEffect(() => {
    if (!suggestion) return;
    const current = valueRef.current.trim();
    const untouched = !current || current === lastSuggested.current?.trim() || legacyDefaults.some((d) => (typeof d === 'string' ? d.trim() === current : d.test(current)));
    if (untouched && current !== suggestion.trim()) setValue(suggestion);
    if (untouched || current === suggestion.trim()) lastSuggested.current = suggestion;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestion, resetKey]);
}

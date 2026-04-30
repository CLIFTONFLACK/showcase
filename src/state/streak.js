/**
 * Classify the transition between previous and new streak values.
 * Returns: 'increment' | 'reset' | 'none'
 */
export function classifyStreakChange(prev, next) {
  if (prev === 0 && next === 1) return 'none';
  if (prev > 0 && next > prev) return 'increment';
  if (prev > 0 && next < prev) return 'reset';
  return 'none';
}

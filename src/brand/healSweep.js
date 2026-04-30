/**
 * Compute the healRatio (0..1) for a given wall tile column `x` at time `t` (0..1).
 */
export function sweepRatio(x, width, t, baseRatio) {
  if (t <= 0) return baseRatio;
  if (t >= 1) return 1;
  const leading = width * 1.3 * t;
  const trailing = leading - width * 0.3;
  if (x <= trailing) return 1;
  if (x >= leading) return baseRatio;
  const localT = (leading - x) / (width * 0.3);
  return baseRatio + (1 - baseRatio) * localT;
}

export const HEAL_SWEEP_MS = 1500;

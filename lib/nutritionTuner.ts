import type { Nutrition, Recipe } from './recipes';

// ─── Nutrition tuner ─────────────────────────────────────────────────────────
// Given a recipe and a set of user-chosen macro targets, propose a small set
// of ingredient-level adjustments (increase / decrease / replace / add) whose
// combined estimated per-serving macro deltas move the recipe toward those
// targets.
//
// Deterministic and client-side — no LLM required. Each "move" is a tiny
// rule with: (a) a detector that decides if the move applies to the recipe,
// (b) a human-readable adjustment (text + explanation), and (c) an estimated
// per-serving nutrition delta used for greedy selection.

export type Macro = 'calories' | 'protein' | 'carbs' | 'fat' | 'fibre';

export interface MacroTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
}

export type AdjustmentKind = 'increase' | 'decrease' | 'replace' | 'add';

export interface Adjustment {
  kind: AdjustmentKind;
  /** Original ingredient text the move matched (blank for `add`). */
  original: string;
  /** Proposed ingredient text (what to use instead, or what to add). */
  proposed: string;
  /** Plain-English reason shown to the user. */
  explanation: string;
  /** Estimated per-serving nutrition delta once applied. */
  impact: Partial<Nutrition>;
}

export interface TuneResult {
  adjustments: Adjustment[];
  /** Projected per-serving nutrition after applying the chosen adjustments. */
  projected: Nutrition;
  /** Remaining gap per macro (target − projected). Positive = still short. */
  gap: Partial<Nutrition>;
}

type Direction = 'up' | 'down';

interface Move {
  /** Primary macro this move is designed to shift. */
  macro: Macro;
  direction: Direction;
  /** True iff this move can be applied to the given recipe text. */
  matches: (haystack: string) => boolean;
  /** Build the adjustment — receives the lowercased joined ingredient text. */
  build: (haystack: string, recipe: Recipe) => Adjustment;
}

// Flatten a recipe's ingredient list to a single lowercased string for matching.
function flatIngredients(recipe: Recipe): string {
  return recipe.ingredients
    .flatMap(g => g.items)
    .join(' \n ')
    .toLowerCase();
}

// Find the first original ingredient line matching a keyword (case-insensitive).
function findLine(recipe: Recipe, keyword: string): string | undefined {
  const k = keyword.toLowerCase();
  for (const g of recipe.ingredients) {
    for (const item of g.items) {
      if (item.toLowerCase().includes(k)) return item;
    }
  }
  return undefined;
}

// ─── Move library ────────────────────────────────────────────────────────────
// Each move is small and self-describing. Impacts are rough per-serving
// estimates; they don't have to be perfect — they just have to point the
// nutrition in the right direction at a believable magnitude.

const MOVES: Move[] = [
  // PROTEIN — UP
  {
    macro: 'protein', direction: 'up',
    matches: h => /protein powder/.test(h) && !/optional:[^\n]*protein powder/.test(h),
    build: (_, r) => ({
      kind: 'increase',
      original: findLine(r, 'protein powder') ?? 'protein powder',
      proposed: 'Double the protein powder (to 2 scoops)',
      explanation: 'Adds ~20 g whey/plant protein per serving without meaningfully shifting carbs or fat.',
      impact: { protein: 20, calories: 90 },
    }),
  },
  {
    macro: 'protein', direction: 'up',
    matches: h => /optional[^.\n]*protein powder/.test(h),
    build: (_, r) => ({
      kind: 'add',
      original: findLine(r, 'protein powder') ?? '',
      proposed: 'Add 1 scoop of vegan or whey protein powder (not optional)',
      explanation: 'The recipe already lists protein powder as optional — including it lifts protein by ~20 g.',
      impact: { protein: 20, calories: 90 },
    }),
  },
  {
    macro: 'protein', direction: 'up',
    matches: h => /greek yogurt|dairy-free yogurt/.test(h),
    build: (_, r) => ({
      kind: 'increase',
      original: findLine(r, 'yogurt') ?? 'yogurt',
      proposed: 'Use 150 g (¾ cup) of high-protein Greek yogurt instead of 1 tbsp',
      explanation: 'High-protein Greek yogurts (e.g. skyr) deliver ~15 g protein per 150 g with minimal fat.',
      impact: { protein: 14, calories: 90 },
    }),
  },
  {
    macro: 'protein', direction: 'up',
    matches: h => /(almond milk|coconut milk|oat milk)/.test(h) && !/soy/.test(h),
    build: (_, r) => ({
      kind: 'replace',
      original: findLine(r, 'almond milk') ?? findLine(r, 'coconut milk') ?? findLine(r, 'oat milk') ?? 'plant milk',
      proposed: 'Swap to unsweetened soy milk (same volume)',
      explanation: 'Soy milk carries ~7 g protein per cup vs ~1 g in almond/oat milk — biggest protein-per-calorie swap in a smoothie.',
      impact: { protein: 6 },
    }),
  },
  {
    macro: 'protein', direction: 'up',
    matches: h => /chicken|salmon|tuna|seabass|sardine/.test(h),
    build: (_, r) => {
      const line = findLine(r, 'chicken') ?? findLine(r, 'salmon') ?? findLine(r, 'tuna') ?? findLine(r, 'seabass') ?? findLine(r, 'sardine') ?? '';
      return {
        kind: 'increase',
        original: line,
        proposed: `Increase the protein portion by ~50% (${line})`,
        explanation: 'A larger fish/poultry portion is the cleanest way to add protein without adding many carbs.',
        impact: { protein: 12, calories: 80, fat: 3 },
      };
    },
  },
  {
    macro: 'protein', direction: 'up',
    matches: h => /\begg[s]?\b/.test(h),
    build: (_, r) => ({
      kind: 'add',
      original: findLine(r, 'egg') ?? '',
      proposed: 'Add 1 extra egg (or 2 egg whites)',
      explanation: 'One egg adds ~6 g protein for ~70 kcal; egg whites skip the fat entirely.',
      impact: { protein: 6, calories: 70, fat: 5 },
    }),
  },

  // CALORIES — DOWN
  {
    macro: 'calories', direction: 'down',
    matches: h => /almond butter|peanut butter|nut butter/.test(h),
    build: (_, r) => ({
      kind: 'decrease',
      original: findLine(r, 'nut butter') ?? findLine(r, 'almond butter') ?? findLine(r, 'peanut butter') ?? '',
      proposed: 'Halve the nut butter (½ tbsp)',
      explanation: 'Nut butter is ~95 kcal per tablespoon. Halving it is the single biggest calorie lever in a smoothie or snack.',
      impact: { calories: -50, fat: -5 },
    }),
  },
  {
    macro: 'calories', direction: 'down',
    matches: h => /olive oil|coconut oil/.test(h),
    build: (_, r) => ({
      kind: 'decrease',
      original: findLine(r, 'olive oil') ?? findLine(r, 'coconut oil') ?? '',
      proposed: 'Use ½ tbsp oil instead of 1 tbsp (or use oil spray)',
      explanation: 'Each tablespoon of oil is ~120 kcal of pure fat. Non-stick pans tolerate a lighter hand.',
      impact: { calories: -60, fat: -7 },
    }),
  },
  {
    macro: 'calories', direction: 'down',
    matches: h => /avocado/.test(h),
    build: (_, r) => ({
      kind: 'decrease',
      original: findLine(r, 'avocado') ?? '',
      proposed: 'Use ¼ avocado instead of ½',
      explanation: 'A whole avocado is ~240 kcal. Cutting the portion keeps the creaminess for roughly half the fat calories.',
      impact: { calories: -60, fat: -6 },
    }),
  },
  {
    macro: 'calories', direction: 'down',
    matches: h => /coconut milk/.test(h) && !/unsweetened almond milk/.test(h),
    build: (_, r) => ({
      kind: 'replace',
      original: findLine(r, 'coconut milk') ?? '',
      proposed: 'Swap coconut milk for unsweetened almond milk',
      explanation: 'Tinned coconut milk runs ~440 kcal/cup; almond milk is ~30 kcal/cup with negligible fat.',
      impact: { calories: -70, fat: -7 },
    }),
  },
  {
    macro: 'calories', direction: 'down',
    matches: h => /banana/.test(h),
    build: (_, r) => ({
      kind: 'decrease',
      original: findLine(r, 'banana') ?? '',
      proposed: 'Use ¼ banana (or skip it)',
      explanation: 'Banana is the easiest carb dial on smoothies — each half-banana is ~55 kcal of natural sugar.',
      impact: { calories: -30, carbs: -7 },
    }),
  },

  // CARBS — DOWN
  {
    macro: 'carbs', direction: 'down',
    matches: h => /brown rice|white rice|quinoa/.test(h),
    build: (_, r) => ({
      kind: 'replace',
      original: findLine(r, 'rice') ?? findLine(r, 'quinoa') ?? '',
      proposed: 'Swap half the rice/quinoa for cauliflower rice',
      explanation: 'Cauliflower rice is ~25 kcal/cup vs ~215 for brown rice — drops carbs hard while keeping the bowl volume.',
      impact: { carbs: -20, calories: -90 },
    }),
  },
  {
    macro: 'carbs', direction: 'down',
    matches: h => /mango|pineapple/.test(h),
    build: (_, r) => ({
      kind: 'replace',
      original: findLine(r, 'mango') ?? findLine(r, 'pineapple') ?? '',
      proposed: 'Swap tropical fruit for frozen berries (same volume)',
      explanation: 'Berries have roughly half the sugar of mango/pineapple and far more fibre.',
      impact: { carbs: -15, fibre: 3 },
    }),
  },

  // FIBRE — UP
  {
    macro: 'fibre', direction: 'up',
    matches: h => /chia|flax/.test(h),
    build: (_, r) => ({
      kind: 'increase',
      original: findLine(r, 'chia') ?? findLine(r, 'flax') ?? '',
      proposed: 'Double the chia / flaxseed',
      explanation: 'Adds ~5 g soluble fibre — feeds gut bacteria and thickens smoothies / puddings nicely.',
      impact: { fibre: 5, fat: 3 },
    }),
  },
  {
    macro: 'fibre', direction: 'up',
    matches: () => true,
    build: () => ({
      kind: 'add',
      original: '',
      proposed: 'Add 1 tbsp ground flaxseed or psyllium husk',
      explanation: 'Neutral-tasting fibre booster; psyllium adds ~5 g fibre per tbsp without meaningful calories.',
      impact: { fibre: 5 },
    }),
  },
  {
    macro: 'fibre', direction: 'up',
    matches: h => /spinach|rocket|cabbage|pepper|courgette|carrot/.test(h),
    build: (_, r) => ({
      kind: 'increase',
      original: findLine(r, 'spinach') ?? findLine(r, 'rocket') ?? findLine(r, 'cabbage') ?? findLine(r, 'pepper') ?? findLine(r, 'courgette') ?? findLine(r, 'carrot') ?? '',
      proposed: 'Double the vegetable portion',
      explanation: 'The cheapest fibre + micronutrient upgrade — more veg, more polyphenols, more volume.',
      impact: { fibre: 3, carbs: 5 },
    }),
  },

  // FAT — DOWN (shares detectors with calories-down but framed by macro)
  {
    macro: 'fat', direction: 'down',
    matches: h => /tahini|almond butter|peanut butter/.test(h),
    build: (_, r) => ({
      kind: 'decrease',
      original: findLine(r, 'tahini') ?? findLine(r, 'almond butter') ?? findLine(r, 'peanut butter') ?? '',
      proposed: 'Halve the tahini / nut butter in the dressing',
      explanation: 'Thin with a little extra water + lemon juice — same creaminess, ~half the fat.',
      impact: { fat: -6, calories: -60 },
    }),
  },
];

// ─── Core algorithm ──────────────────────────────────────────────────────────

const MACROS: Macro[] = ['calories', 'protein', 'carbs', 'fat', 'fibre'];
const TOLERANCE: Record<Macro, number> = {
  calories: 25, protein: 3, carbs: 4, fat: 3, fibre: 2,
};

/** Apply an impact (partial nutrition) to a running total. */
function addImpact(base: Nutrition, impact: Partial<Nutrition>): Nutrition {
  return {
    calories: base.calories + (impact.calories ?? 0),
    protein: base.protein + (impact.protein ?? 0),
    carbs: base.carbs + (impact.carbs ?? 0),
    fat: base.fat + (impact.fat ?? 0),
    fibre: base.fibre + (impact.fibre ?? 0),
  };
}

/** Score how much a move reduces the unsigned gap across all macros. */
function scoreMove(current: Nutrition, targets: MacroTargets, impact: Partial<Nutrition>): number {
  let improvement = 0;
  for (const m of MACROS) {
    const gapBefore = Math.abs(targets[m] - current[m]);
    const gapAfter = Math.abs(targets[m] - (current[m] + (impact[m] ?? 0)));
    improvement += gapBefore - gapAfter;
  }
  return improvement;
}

/**
 * Greedy adjustment selection. On each pass, pick the move whose impact most
 * reduces the aggregate gap; stop when no move improves things or we hit the
 * max. The max keeps the UI output short and readable.
 */
export function tuneRecipe(recipe: Recipe, targets: MacroTargets, maxAdjustments = 5): TuneResult {
  const haystack = flatIngredients(recipe);
  const available = MOVES.filter(m => m.matches(haystack));
  const adjustments: Adjustment[] = [];
  let projected: Nutrition = { ...recipe.nutrition };
  // Don't propose two moves that touch the same original line — avoids
  // contradictory advice like "halve the avocado" and "remove the avocado".
  const usedOriginals = new Set<string>();

  for (let i = 0; i < maxAdjustments; i++) {
    let best: { move: Move; score: number; adj: Adjustment } | null = null;
    for (const move of available) {
      const adj = move.build(haystack, recipe);
      if (usedOriginals.has(adj.original)) continue;
      const score = scoreMove(projected, targets, adj.impact);
      if (score <= 0) continue;
      if (!best || score > best.score) best = { move, score, adj };
    }
    if (!best) break;
    adjustments.push(best.adj);
    projected = addImpact(projected, best.adj.impact);
    usedOriginals.add(best.adj.original);
    // Remove the chosen move from the pool so we don't pick it twice.
    const idx = available.indexOf(best.move);
    if (idx >= 0) available.splice(idx, 1);
    // Early exit if every macro is within tolerance.
    if (MACROS.every(m => Math.abs(targets[m] - projected[m]) <= TOLERANCE[m])) break;
  }

  const gap: Partial<Nutrition> = {};
  for (const m of MACROS) {
    const g = targets[m] - projected[m];
    if (Math.abs(g) > TOLERANCE[m]) gap[m] = Math.round(g);
  }

  return { adjustments, projected, gap };
}

/** Reasonable slider bounds — ±60% of the recipe's baseline, clamped to sane floors. */
export function sliderBounds(baseline: Nutrition): Record<Macro, { min: number; max: number; step: number }> {
  const range = (v: number, floor: number, step: number) => ({
    min: Math.max(floor, Math.round(v * 0.4)),
    max: Math.round(v * 1.6),
    step,
  });
  return {
    calories: range(baseline.calories, 100, 10),
    protein: range(baseline.protein, 3, 1),
    carbs: range(baseline.carbs, 5, 1),
    fat: range(baseline.fat, 2, 1),
    fibre: range(baseline.fibre, 1, 1),
  };
}

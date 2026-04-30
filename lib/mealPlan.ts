// Shared meal-plan state: types, constants, and localStorage persistence.
// Consumed by both app/meal-plan/page.tsx and components/RecipeDetailClient.tsx
// so adding a recipe from the detail page shows up immediately on the planner.

import { recipes, type Recipe, type Category } from './recipes';

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
export type Day = typeof DAYS[number];

export interface MealSlotMeta {
  slot: MealSlot;
  label: string;
  icon: string;
  category: Category;
}

export const MEAL_SLOTS: readonly MealSlotMeta[] = [
  { slot: 'breakfast', label: 'Breakfast', icon: '🌅', category: 'breakfast' },
  { slot: 'lunch', label: 'Lunch', icon: '🥗', category: 'lunch' },
  { slot: 'dinner', label: 'Dinner', icon: '🍽️', category: 'dinner' },
  { slot: 'snack', label: 'Snack', icon: '🥜', category: 'snacks' },
];

export type DayPlan = Partial<Record<MealSlot, Recipe>>;
export type WeekPlan = Record<string, DayPlan>;

/** Wire format for localStorage — store recipe IDs only, not full Recipe objects,
 *  so that updating the recipe catalog doesn't leave stale copies in users'
 *  saved plans. Resolved back to Recipe on load. */
type StoredWeekPlan = Record<string, Partial<Record<MealSlot, string>>>;

export const STORAGE_KEY = 'epavance.mealPlan.v1';

export function emptyWeek(): WeekPlan {
  return Object.fromEntries(DAYS.map(d => [d, {}]));
}

export function loadPlan(): WeekPlan {
  if (typeof window === 'undefined') return emptyWeek();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyWeek();
    const stored = JSON.parse(raw) as StoredWeekPlan;
    const plan = emptyWeek();
    for (const day of DAYS) {
      const entry = stored[day];
      if (!entry) continue;
      for (const { slot } of MEAL_SLOTS) {
        const id = entry[slot];
        if (!id) continue;
        const r = recipes.find(r => r.id === id);
        if (r) plan[day][slot] = r;
      }
    }
    return plan;
  } catch {
    return emptyWeek();
  }
}

export function savePlan(plan: WeekPlan): void {
  if (typeof window === 'undefined') return;
  try {
    const stored: StoredWeekPlan = {};
    for (const day of DAYS) {
      const entry: Partial<Record<MealSlot, string>> = {};
      for (const { slot } of MEAL_SLOTS) {
        const r = plan[day]?.[slot];
        if (r) entry[slot] = r.id;
      }
      stored[day] = entry;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // localStorage can throw in private mode / quota — fail silently.
  }
}

/** Load → mutate → save. Returns the new plan so callers can update React state. */
export function addRecipeToPlan(recipe: Recipe, day: string, slot: MealSlot): WeekPlan {
  const plan = loadPlan();
  plan[day] = { ...plan[day], [slot]: recipe };
  savePlan(plan);
  return plan;
}

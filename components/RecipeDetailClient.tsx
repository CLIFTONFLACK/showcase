'use client';

import { useState, useEffect, useMemo } from 'react';
import { Recipe, scaleIngredient } from '@/lib/recipes';
import Link from 'next/link';
import {
  DAYS, MEAL_SLOTS, loadPlan, addRecipeToPlan,
  type MealSlot, type WeekPlan,
} from '@/lib/mealPlan';
import { tuneRecipe, sliderBounds, type MacroTargets, type Macro } from '@/lib/nutritionTuner';

const CATEGORY_ICONS: Record<string, string> = {
  breakfast: '🌅',
  lunch: '🥗',
  dinner: '🍽️',
  snacks: '🥜',
};

export default function RecipeDetailClient({ recipe }: { recipe: Recipe }) {
  const totalTime = recipe.prepTime + recipe.cookTime;
  const [servings, setServings] = useState<number>(recipe.servings);
  const multiplier = servings / recipe.servings;

  const handlePrint = () => window.print();
  const adjustServings = (delta: number) => setServings(s => Math.max(1, Math.min(20, s + delta)));

  const hasAllergens = !!(recipe.allergens && recipe.allergens.length > 0);

  // ─── Nutrition tuner ────────────────────────────────────────────────────
  // Sliders let the user nudge per-serving macro targets; the tuner proposes
  // ingredient moves (increase / decrease / replace / add) that push the
  // recipe toward those targets.
  const bounds = useMemo(() => sliderBounds(recipe.nutrition), [recipe.nutrition]);
  const [targets, setTargets] = useState<MacroTargets>({
    calories: recipe.nutrition.calories,
    protein: recipe.nutrition.protein,
    carbs: recipe.nutrition.carbs,
    fat: recipe.nutrition.fat,
    fibre: recipe.nutrition.fibre,
  });
  const tuneOn = useMemo(
    () => (['calories','protein','carbs','fat','fibre'] as Macro[])
      .some(m => targets[m] !== recipe.nutrition[m]),
    [targets, recipe.nutrition],
  );
  const tune = useMemo(
    () => tuneOn ? tuneRecipe(recipe, targets) : null,
    [tuneOn, recipe, targets],
  );
  const resetTuner = () => setTargets({
    calories: recipe.nutrition.calories,
    protein: recipe.nutrition.protein,
    carbs: recipe.nutrition.carbs,
    fat: recipe.nutrition.fat,
    fibre: recipe.nutrition.fibre,
  });

  // Meal plan picker state. Plan is loaded lazily when the picker opens so
  // we read the latest saved plan (supports the planner being edited on
  // another tab / another session).
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerPlan, setPickerPlan] = useState<WeekPlan | null>(null);
  const [justAdded, setJustAdded] = useState<{ day: string; slot: MealSlot } | null>(null);

  const openPicker = () => {
    setPickerPlan(loadPlan());
    setJustAdded(null);
    setPickerOpen(true);
  };
  const closePicker = () => setPickerOpen(false);
  const handleSlotClick = (day: string, slot: MealSlot) => {
    const updated = addRecipeToPlan(recipe, day, slot);
    setPickerPlan(updated);
    setJustAdded({ day, slot });
  };

  // Close picker on Escape key for accessibility.
  useEffect(() => {
    if (!pickerOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closePicker(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pickerOpen]);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px 64px' }}>
      {/* Back link */}
      <div className="no-print" style={{ marginBottom: 24 }}>
        <Link href="/" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: 14, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          ← Back to Recipes
        </Link>
      </div>

      {/* Print header (only visible when printing) */}
      <div className="print-only">
        <div style={{ textAlign: 'center', marginBottom: 24, paddingBottom: 16, borderBottom: '2px solid #008080' }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#008080' }}>EPAVANCE · Gut-Friendly Recipes</h1>
        </div>
      </div>

      <div className="recipe-print-card">
        {/* Hero image */}
        <div style={{ borderRadius: 8, overflow: 'hidden', height: 380, marginBottom: 32, position: 'relative' }} className="no-print">
          <img src={recipe.image} alt={recipe.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%)' }} />
          <div style={{ position: 'absolute', bottom: 24, left: 24, right: 24 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', color: '#fff', padding: '5px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600, marginBottom: 10, border: '1px solid rgba(255,255,255,0.3)' }}>
              {CATEGORY_ICONS[recipe.category]} {recipe.category.charAt(0).toUpperCase() + recipe.category.slice(1)}
            </div>
            <h1 style={{ color: '#fff', fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 600, margin: 0, lineHeight: 1.15, textShadow: '0 2px 10px rgba(0,0,0,0.35)', letterSpacing: '-0.01em' }}>
              {recipe.name}
            </h1>
          </div>
        </div>

        {/* Print-only title */}
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }} className="print-only">
          {CATEGORY_ICONS[recipe.category]} {recipe.name}
        </h1>

        {/* Description */}
        <p style={{ fontSize: 17, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 28 }}>{recipe.description}</p>

        {/* Quick stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 12, marginBottom: 24, padding: 20, background: 'var(--primary-wash)', borderRadius: 8, border: '1px solid var(--primary-soft)' }}>
          {[
            { icon: '⏱️', label: 'Prep', value: `${recipe.prepTime} min` },
            { icon: '🔥', label: 'Cook', value: recipe.cookTime === 0 ? 'No cook' : `${recipe.cookTime} min` },
            { icon: '⌚', label: 'Total', value: totalTime === 0 ? 'No cook' : `${totalTime} min` },
            { icon: '👤', label: 'Serves', value: recipe.servingNote || `${recipe.servings}` },
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: 'center', padding: '12px 8px', background: '#fff', borderRadius: 8 }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{stat.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--foreground)' }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tags */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
          {recipe.tags.map(tag => (
            <span key={tag} style={{ fontSize: 13, fontWeight: 500, background: 'var(--primary-wash)', color: 'var(--primary-dark)', padding: '5px 12px', borderRadius: 8, border: '1px solid var(--primary-soft)' }}>
              {tag}
            </span>
          ))}
        </div>

        {/* Allergen warnings */}
        <div
          style={{
            marginBottom: 28,
            padding: '16px 20px',
            background: hasAllergens ? 'var(--warning-bg)' : 'var(--primary-wash)',
            borderRadius: 8,
            border: hasAllergens ? '1px solid #fcd34d' : '1px solid var(--primary-soft)',
            borderLeft: hasAllergens ? '4px solid var(--warning)' : '4px solid var(--primary)',
          }}
          role="note"
          aria-label="Allergen information"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: hasAllergens ? 8 : 0 }}>
            <span style={{ fontSize: 18 }}>{hasAllergens ? '⚠️' : '✅'}</span>
            <strong style={{ fontSize: 14, color: hasAllergens ? '#78350f' : 'var(--primary-dark)' }}>
              {hasAllergens ? 'Allergen notice' : 'No major allergens detected'}
            </strong>
          </div>
          {hasAllergens && (
            <>
              <ul style={{ margin: '4px 0 6px 26px', padding: 0, fontSize: 13, lineHeight: 1.6, color: '#78350f' }}>
                {recipe.allergens!.map(a => <li key={a}>{a}</li>)}
              </ul>
              <p style={{ margin: '6px 0 0 26px', fontSize: 12, color: '#92400e', fontStyle: 'italic' }}>
                Always check ingredient packaging — formulations vary. Omit or substitute any ingredient you react to.
              </p>
            </>
          )}
        </div>

        {/* Two-column layout */}
        <div className="recipe-two-col" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 5fr) minmax(0, 7fr)', gap: 40, marginBottom: 36 }}>
          {/* Ingredients */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 10, borderBottom: '2px solid var(--primary-wash)' }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--primary)', margin: 0 }}>
                Ingredients
              </h2>
            </div>

            {/* Serving-size adjuster */}
            <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 14px', background: '#fff', border: '1.5px solid var(--primary-soft)', borderRadius: 8, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Serves</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--primary-dark)', lineHeight: 1 }}>
                  {servings}
                  {servings !== recipe.servings && (
                    <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--muted)', marginLeft: 8 }}>
                      (original: {recipe.servings})
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  onClick={() => adjustServings(-1)}
                  disabled={servings <= 1}
                  aria-label="Decrease servings"
                  style={{ width: 34, height: 34, borderRadius: 8, border: '1.5px solid var(--primary-soft)', background: servings <= 1 ? '#f3f4f6' : '#fff', color: 'var(--primary-dark)', fontSize: 18, fontWeight: 600, cursor: servings <= 1 ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
                >−</button>
                <button
                  onClick={() => adjustServings(1)}
                  disabled={servings >= 20}
                  aria-label="Increase servings"
                  style={{ width: 34, height: 34, borderRadius: 8, border: '1.5px solid var(--primary-soft)', background: servings >= 20 ? '#f3f4f6' : '#fff', color: 'var(--primary-dark)', fontSize: 18, fontWeight: 600, cursor: servings >= 20 ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
                >+</button>
                {servings !== recipe.servings && (
                  <button
                    onClick={() => setServings(recipe.servings)}
                    aria-label="Reset servings"
                    style={{ padding: '6px 10px', borderRadius: 8, border: '1.5px solid var(--border)', background: '#fff', color: 'var(--muted)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}
                  >Reset</button>
                )}
              </div>
            </div>

            {recipe.ingredients.map((group, gi) => (
              <div key={gi} style={{ marginBottom: 20 }}>
                {group.section && (
                  <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--muted)', marginBottom: 12 }}>
                    {group.section}
                  </h3>
                )}
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {group.items.map((item, ii) => (
                    <li key={ii} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 0', borderBottom: gi === recipe.ingredients.length - 1 && ii === group.items.length - 1 ? 'none' : '1px solid var(--border)', fontSize: 14, lineHeight: 1.5 }}>
                      <span style={{ color: 'var(--primary)', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>·</span>
                      <span>{scaleIngredient(item, multiplier)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Instructions */}
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--primary)', marginBottom: 20, paddingBottom: 10, borderBottom: '2px solid var(--primary-wash)' }}>
              Method
            </h2>
            <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {recipe.instructions.map((step, i) => (
                <li key={i} style={{ display: 'flex', gap: 16, marginBottom: 16, alignItems: 'flex-start' }}>
                  <span style={{ width: 28, height: 28, background: 'var(--primary)', color: '#fff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 13, flexShrink: 0, marginTop: 1 }}>
                    {i + 1}
                  </span>
                  <p style={{ fontSize: 15, lineHeight: 1.65, margin: 0, color: 'var(--foreground)' }}>{step}</p>
                </li>
              ))}
            </ol>

            {recipe.tip && (
              <div style={{ marginTop: 20, padding: '14px 16px', background: 'var(--warning-bg)', borderRadius: 8, borderLeft: '3px solid var(--warning)', fontSize: 14, lineHeight: 1.6, color: '#78350f' }}>
                <strong>💡 Tip:</strong> {recipe.tip}
              </div>
            )}
            {recipe.servingSuggestion && (
              <div style={{ marginTop: 12, padding: '14px 16px', background: 'var(--primary-wash)', borderRadius: 8, borderLeft: '3px solid var(--primary)', fontSize: 14, lineHeight: 1.6, color: 'var(--primary-dark)' }}>
                <strong>🍽️ Serving:</strong> {recipe.servingSuggestion}
              </div>
            )}
          </div>
        </div>

        {/* Gut health section — now with extended info + sources */}
        <div style={{ padding: '22px 24px', background: 'var(--primary-wash)', borderRadius: 8, marginBottom: 32, border: '1px solid var(--primary-soft)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--primary-dark)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            🌿 Why This Recipe Supports Gut Health
          </h3>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--foreground)', margin: 0 }}>{recipe.gutHealthNote}</p>

          {recipe.additionalInfo && (
            <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--foreground)', margin: '12px 0 0', paddingTop: 12, borderTop: '1px solid var(--primary-soft)' }}>
              {recipe.additionalInfo}
            </p>
          )}

          {recipe.sources && recipe.sources.length > 0 && (
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--primary-soft)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>
                References
              </div>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {recipe.sources.map(s => (
                  <li key={s.url} style={{ fontSize: 12, lineHeight: 1.6, marginBottom: 4 }}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--primary-dark)', textDecoration: 'underline' }}
                    >
                      {s.label} ↗
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Nutrition */}
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--primary)', marginBottom: 16 }}>
            Nutrition Per Serving
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
            {[
              { label: 'Calories', value: `${recipe.nutrition.calories}`, unit: 'kcal' },
              { label: 'Protein', value: `${recipe.nutrition.protein}`, unit: 'g' },
              { label: 'Carbs', value: `${recipe.nutrition.carbs}`, unit: 'g' },
              { label: 'Fat', value: `${recipe.nutrition.fat}`, unit: 'g' },
              { label: 'Fibre', value: `${recipe.nutrition.fibre}`, unit: 'g' },
            ].map(n => (
              <div key={n.label} style={{ textAlign: 'center', padding: '16px 8px', background: 'var(--primary-pale)', borderRadius: 8, border: '1px solid var(--primary-soft)' }}>
                <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--foreground)' }}>{n.value}<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--muted)' }}>{n.unit}</span></div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{n.label}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 10, fontStyle: 'italic' }}>
            Nutrition information is estimated per serving and may vary depending on ingredient brands and portion sizes. Adjusting servings above scales the ingredient quantities only — per-serving nutrition remains the same.
          </p>

          {/* Macro tuner — sliders propose ingredient swaps / tweaks */}
          <div className="no-print" style={{ marginTop: 28, padding: '22px 24px', background: '#fff', borderRadius: 8, border: '1.5px solid var(--primary-soft)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, gap: 12, flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--primary-dark)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                🎚️ Tune this recipe
              </h3>
              {tuneOn && (
                <button
                  onClick={resetTuner}
                  style={{ padding: '5px 10px', borderRadius: 8, border: '1.5px solid var(--border)', background: '#fff', color: 'var(--muted)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Reset to original
                </button>
              )}
            </div>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 14px', lineHeight: 1.5 }}>
              Drag a slider to set a per-serving target. I&apos;ll suggest ingredient tweaks — adding, removing, or swapping — to get the recipe closer to your goal.
            </p>

            {(['calories','protein','carbs','fat','fibre'] as Macro[]).map(m => {
              const unit = m === 'calories' ? 'kcal' : 'g';
              const baseline = recipe.nutrition[m];
              const value = targets[m];
              const b = bounds[m];
              const delta = value - baseline;
              const changed = delta !== 0;
              return (
                <div key={m} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
                    <label htmlFor={`tuner-${m}`} style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)', textTransform: 'capitalize' }}>
                      {m}
                    </label>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                      <strong style={{ color: 'var(--primary-dark)' }}>{value}{unit}</strong>
                      {' '}target · baseline {baseline}{unit}
                      {changed && (
                        <span style={{ marginLeft: 6, color: delta > 0 ? 'var(--primary)' : '#b45309', fontWeight: 600 }}>
                          ({delta > 0 ? '+' : ''}{delta}{unit})
                        </span>
                      )}
                    </span>
                  </div>
                  <input
                    id={`tuner-${m}`}
                    type="range"
                    min={b.min}
                    max={b.max}
                    step={b.step}
                    value={value}
                    onChange={e => setTargets(t => ({ ...t, [m]: Number(e.target.value) }))}
                    style={{ width: '100%', accentColor: 'var(--primary)' }}
                  />
                </div>
              );
            })}

            {/* Suggested adjustments */}
            {tune && (
              <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--primary-soft)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10 }}>
                  Suggested changes ({tune.adjustments.length})
                </div>

                {tune.adjustments.length === 0 && (
                  <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5, margin: 0 }}>
                    No clean ingredient-level tweak will hit those targets — the recipe may already be close, or the goal is out of reach without a full rework. Try a smaller change.
                  </p>
                )}

                {tune.adjustments.map((adj, i) => {
                  const kindColor: Record<typeof adj.kind, string> = {
                    increase: '#0f766e', decrease: '#b45309', replace: '#6d28d9', add: '#065f46',
                  };
                  const kindLabel: Record<typeof adj.kind, string> = {
                    increase: 'INCREASE', decrease: 'DECREASE', replace: 'REPLACE', add: 'ADD',
                  };
                  return (
                    <div key={i} style={{ marginBottom: 10, padding: '12px 14px', background: 'var(--primary-pale)', borderRadius: 8, border: '1px solid var(--primary-soft)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.6px', color: '#fff', background: kindColor[adj.kind], padding: '2px 8px', borderRadius: 8 }}>
                          {kindLabel[adj.kind]}
                        </span>
                        {adj.original && (
                          <span style={{ fontSize: 12, color: 'var(--muted)', textDecoration: adj.kind === 'replace' || adj.kind === 'decrease' ? 'line-through' : 'none' }}>
                            {adj.original}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)', marginBottom: 4 }}>
                        → {adj.proposed}
                      </div>
                      <div style={{ fontSize: 12, lineHeight: 1.55, color: 'var(--muted)', marginBottom: 6 }}>
                        {adj.explanation}
                      </div>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        {(Object.entries(adj.impact) as [Macro, number][]).map(([k, v]) => (
                          <span key={k} style={{ fontSize: 11, color: v > 0 ? '#0f766e' : '#b45309', fontWeight: 600 }}>
                            {v > 0 ? '+' : ''}{v}{k === 'calories' ? ' kcal' : 'g'} {k}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Projected totals vs targets */}
                {tune.adjustments.length > 0 && (
                  <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--primary-wash)', borderRadius: 8, fontSize: 12, color: 'var(--primary-dark)', lineHeight: 1.6 }}>
                    <strong>Projected per serving after changes:</strong>{' '}
                    {(['calories','protein','carbs','fat','fibre'] as Macro[]).map((m, i) => {
                      const unit = m === 'calories' ? 'kcal' : 'g';
                      return (
                        <span key={m}>
                          {i > 0 && ' · '}
                          {m} {Math.round(tune.projected[m])}{unit}
                        </span>
                      );
                    })}
                    {Object.keys(tune.gap).length > 0 && (
                      <div style={{ marginTop: 4, color: '#78350f' }}>
                        Still short of target on: {Object.entries(tune.gap).map(([k, v]) => `${k} (${v! > 0 ? '+' : ''}${v})`).join(', ')}.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="no-print" style={{ display: 'flex', gap: 12, marginTop: 40, flexWrap: 'wrap' }}>
        <button
          onClick={handlePrint}
          style={{ padding: '12px 24px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 3px 6px rgba(0,128,128,0.15)', fontFamily: 'inherit' }}
        >
          🖨️ Print / Save as PDF
        </button>
        <button
          onClick={openPicker}
          style={{ padding: '12px 24px', background: '#fff', color: 'var(--primary-dark)', border: '1.5px solid var(--primary)', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit' }}
        >
          📅 Add to Meal Plan
        </button>
        <Link href="/" style={{ padding: '12px 24px', background: '#fff', color: 'var(--foreground)', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 15, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          ← More Recipes
        </Link>
      </div>

      {/* Disclaimer */}
      <p style={{ marginTop: 32, fontSize: 12, color: 'var(--muted)', lineHeight: 1.6, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
        These recipes are not intended as medical advice. Everyone with IBD responds differently to foods — always adapt based on your personal tolerances and consult your healthcare professional if you have dietary concerns. References above are provided for educational purposes and do not constitute an endorsement of any specific dietary approach.
      </p>

      {/* Meal-plan picker modal */}
      {pickerOpen && (
        <div
          className="no-print"
          role="dialog"
          aria-modal="true"
          aria-label="Add to meal plan"
          onClick={closePicker}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(10, 30, 30, 0.55)',
            backdropFilter: 'blur(3px)',
            zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: 12,
              maxWidth: 720, width: '100%',
              maxHeight: '90vh', overflowY: 'auto',
              boxShadow: '0 25px 60px rgba(0,0,0,0.28)',
              border: '1px solid var(--primary-soft)',
            }}
          >
            {/* Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
              <div style={{ minWidth: 0 }}>
                <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--primary-dark)', margin: 0, lineHeight: 1.3 }}>
                  📅 Add to Meal Plan
                </h2>
                <p style={{ fontSize: 13, color: 'var(--muted)', margin: '4px 0 0', lineHeight: 1.4 }}>
                  Pick a day and meal slot for <strong style={{ color: 'var(--foreground)', fontWeight: 600 }}>{recipe.name}</strong>.
                </p>
              </div>
              <button
                onClick={closePicker}
                aria-label="Close"
                style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: '#fff', color: 'var(--muted)', fontSize: 16, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}
              >✕</button>
            </div>

            {/* Success banner */}
            {justAdded && (
              <div style={{ margin: '16px 24px 0', padding: '10px 14px', background: 'var(--primary-wash)', border: '1px solid var(--primary-soft)', borderLeft: '4px solid var(--primary)', borderRadius: 8, fontSize: 13, color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <span>✅ Added to <strong>{justAdded.day} · {MEAL_SLOTS.find(m => m.slot === justAdded.slot)?.label}</strong>. Keep adding or view your plan.</span>
                <Link href="/meal-plan" style={{ color: 'var(--primary-dark)', fontWeight: 600, textDecoration: 'underline', fontSize: 13, whiteSpace: 'nowrap' }}>
                  View meal plan →
                </Link>
              </div>
            )}

            {/* Day-by-day grid */}
            <div style={{ padding: 20 }}>
              {DAYS.map(day => (
                <div key={day} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 6 }}>
                    {day}
                  </div>
                  <div className="meal-slot-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {MEAL_SLOTS.map(m => {
                      const existing = pickerPlan?.[day]?.[m.slot];
                      const isThisRecipe = existing?.id === recipe.id;
                      const justAddedHere = justAdded?.day === day && justAdded?.slot === m.slot;
                      return (
                        <button
                          key={m.slot}
                          onClick={() => handleSlotClick(day, m.slot)}
                          title={existing ? `Currently: ${existing.name}` : undefined}
                          style={{
                            padding: '8px 10px',
                            borderRadius: 8,
                            border: '1.5px solid',
                            borderColor: justAddedHere ? 'var(--primary)' : isThisRecipe ? 'var(--primary)' : 'var(--border)',
                            background: justAddedHere ? 'var(--primary-wash)' : isThisRecipe ? 'var(--primary-pale)' : '#fff',
                            color: 'var(--foreground)',
                            fontSize: 12, lineHeight: 1.35,
                            cursor: 'pointer',
                            textAlign: 'left',
                            fontFamily: 'inherit',
                            display: 'flex', flexDirection: 'column', gap: 2,
                            minHeight: 54,
                          }}
                        >
                          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {m.icon} {m.label}
                          </span>
                          <span style={{ fontSize: 12, fontWeight: existing ? 500 : 400, color: existing ? 'var(--foreground)' : 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                            {isThisRecipe ? '✓ This recipe' : existing ? existing.name : 'Empty'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              <p style={{ fontSize: 12, color: 'var(--muted)', margin: '8px 0 0', lineHeight: 1.5 }}>
                Clicking a slot that&apos;s already filled will replace it with this recipe. Your plan is saved automatically to this browser.
              </p>
            </div>
          </div>

          <style>{`
            @media (max-width: 560px) {
              .meal-slot-row { grid-template-columns: repeat(2, 1fr) !important; }
            }
          `}</style>
        </div>
      )}

      {/* Responsive: stack columns on narrow screens */}
      <style>{`
        @media (max-width: 720px) {
          .recipe-two-col { grid-template-columns: 1fr !important; gap: 24px !important; }
        }
      `}</style>
    </div>
  );
}

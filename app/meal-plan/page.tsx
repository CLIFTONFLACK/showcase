'use client';

import { useState, useEffect } from 'react';
import { recipes, scaleIngredient, type Recipe, type Category } from '@/lib/recipes';
import {
  DAYS, MEAL_SLOTS, emptyWeek, loadPlan, savePlan,
  type MealSlot, type WeekPlan, type DayPlan,
} from '@/lib/mealPlan';
import Link from 'next/link';

function randomRecipeFor(category: Category, exclude?: string[]): Recipe | undefined {
  const pool = recipes.filter(r => r.category === category && !exclude?.includes(r.id));
  if (pool.length === 0) return undefined;
  return pool[Math.floor(Math.random() * pool.length)];
}

export default function MealPlanPage() {
  const [plan, setPlan] = useState<WeekPlan>(emptyWeek());
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount (not during SSR).
  useEffect(() => {
    setPlan(loadPlan());
    setHydrated(true);
  }, []);

  // Persist any change back to localStorage — but not the initial empty
  // pre-hydration state, or we'd overwrite the saved plan with empties.
  useEffect(() => {
    if (hydrated) savePlan(plan);
  }, [plan, hydrated]);
  const [mode, setMode] = useState<'week' | 'day'>('week');
  const [activeDay, setActiveDay] = useState('Monday');
  const [pickerOpen, setPickerOpen] = useState<{ day: string; slot: MealSlot } | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const slotKey = (day: string, slot: MealSlot) => `${day}:${slot}`;
  const isExpanded = (day: string, slot: MealSlot) => expanded.has(slotKey(day, slot));
  const toggleExpanded = (day: string, slot: MealSlot) => {
    setExpanded(prev => {
      const next = new Set(prev);
      const k = slotKey(day, slot);
      if (next.has(k)) next.delete(k); else next.add(k);
      return next;
    });
  };

  const setMeal = (day: string, slot: MealSlot, recipe: Recipe | undefined) => {
    setPlan(prev => ({ ...prev, [day]: { ...prev[day], [slot]: recipe } }));
    setPickerOpen(null);
    // Collapse if we just cleared the slot
    if (!recipe) {
      setExpanded(prev => {
        const next = new Set(prev);
        next.delete(slotKey(day, slot));
        return next;
      });
    }
  };

  const autoFillDay = (day: string) => {
    const used: string[] = [];
    const newDay: DayPlan = {};
    for (const { slot, category } of MEAL_SLOTS) {
      const r = randomRecipeFor(category, used);
      if (r) { newDay[slot] = r; used.push(r.id); }
    }
    setPlan(prev => ({ ...prev, [day]: newDay }));
  };

  const autoFillWeek = () => {
    const newPlan = emptyWeek();
    for (const day of DAYS) {
      const used: string[] = [];
      for (const { slot, category } of MEAL_SLOTS) {
        const r = randomRecipeFor(category, used);
        if (r) { newPlan[day][slot] = r; used.push(r.id); }
      }
    }
    setPlan(newPlan);
  };

  const totalNutrition = Object.values(plan).reduce((acc, day) => {
    Object.values(day).forEach((r: Recipe) => {
      acc.calories += r.nutrition.calories;
      acc.protein += r.nutrition.protein;
      acc.fibre += r.nutrition.fibre;
    });
    return acc;
  }, { calories: 0, protein: 0, fibre: 0 });

  const recipeCount = Object.values(plan).reduce((n, day) => n + Object.values(day).length, 0);

  const handlePrint = () => window.print();

  const expandAll = () => {
    const s = new Set<string>();
    for (const day of DAYS) {
      for (const { slot } of MEAL_SLOTS) {
        if (plan[day][slot]) s.add(slotKey(day, slot));
      }
    }
    setExpanded(s);
  };
  const collapseAll = () => setExpanded(new Set());
  const anyExpanded = expanded.size > 0;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 64px' }}>
      {/* Print header */}
      <div className="print-only">
        <div style={{ textAlign: 'center', marginBottom: 24, paddingBottom: 16, borderBottom: '2px solid #008080' }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#008080' }}>EPAVANCE · Weekly Meal Plan</h1>
          <p style={{ fontSize: 13, color: '#666' }}>Gut-Friendly Recipes · epavance.com</p>
        </div>
      </div>

      {/* Header */}
      <div className="no-print" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Link href="/" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: 14, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            ← Back to Recipes
          </Link>
          <h1 style={{ fontSize: 30, fontWeight: 600, margin: 0, color: 'var(--foreground)', letterSpacing: '-0.02em' }}>Meal Planner</h1>
          <p style={{ color: 'var(--muted)', fontSize: 15, marginTop: 6 }}>
            Build your weekly gut-friendly meal plan. Click any meal to expand its ingredients and method. Print or save as PDF when ready.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={autoFillWeek} style={{ padding: '10px 18px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 3px 6px rgba(0,128,128,0.15)', fontFamily: 'inherit' }}>
            ✨ Auto-Fill Week
          </button>
          <button
            onClick={anyExpanded ? collapseAll : expandAll}
            disabled={recipeCount === 0}
            style={{ padding: '10px 18px', background: '#fff', color: recipeCount > 0 ? 'var(--primary-dark)' : '#9ca3af', border: '1.5px solid', borderColor: recipeCount > 0 ? 'var(--primary)' : 'var(--border)', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: recipeCount > 0 ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}
          >
            {anyExpanded ? '− Collapse All' : '+ Expand All'}
          </button>
          <button onClick={handlePrint} disabled={recipeCount === 0} style={{ padding: '10px 18px', background: recipeCount > 0 ? 'var(--primary-dark)' : '#e5e7eb', color: recipeCount > 0 ? '#fff' : '#9ca3af', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: recipeCount > 0 ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
            🖨️ Print / Save PDF
          </button>
          <button onClick={() => { setPlan(emptyWeek()); setExpanded(new Set()); }} style={{ padding: '10px 18px', background: '#fff', color: '#ef4444', border: '1.5px solid #fee2e2', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            🗑️ Clear
          </button>
        </div>
      </div>

      {/* Stats bar */}
      {recipeCount > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 28, padding: 20, background: 'var(--primary-wash)', borderRadius: 8, border: '1px solid var(--primary-soft)' }}>
          {[
            { label: 'Meals planned', value: recipeCount.toString(), icon: '📋' },
            { label: 'Weekly calories', value: totalNutrition.calories.toLocaleString() + ' kcal', icon: '🔥' },
            { label: 'Weekly protein', value: totalNutrition.protein + 'g', icon: '💪' },
            { label: 'Weekly fibre', value: totalNutrition.fibre + 'g', icon: '🌾' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center', padding: '12px', background: '#fff', borderRadius: 8 }}>
              <div style={{ fontSize: 20 }}>{s.icon}</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--foreground)' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* View toggle */}
      <div className="no-print" style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {(['week', 'day'] as const).map(v => (
          <button key={v} onClick={() => setMode(v)} style={{ padding: '8px 20px', borderRadius: 8, border: '1.5px solid', borderColor: mode === v ? 'var(--primary)' : 'var(--border)', background: mode === v ? 'var(--primary)' : '#fff', color: mode === v ? '#fff' : 'var(--foreground)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            {v === 'week' ? '📅 Week View' : '📆 Day View'}
          </button>
        ))}
        {mode === 'day' && (
          <select value={activeDay} onChange={e => setActiveDay(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 13, cursor: 'pointer', background: '#fff', fontFamily: 'inherit' }}>
            {DAYS.map(d => <option key={d}>{d}</option>)}
          </select>
        )}
      </div>

      {/* Week grid */}
      {(mode === 'week' ? DAYS : [activeDay]).map(day => (
        <div key={day} className="recipe-print-card" style={{ marginBottom: 28, border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: 'var(--primary)', color: '#fff' }}>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>{day}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {Object.values(plan[day]).length > 0 && (
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
                  {Object.values(plan[day]).reduce((n, r: Recipe) => n + r.nutrition.calories, 0)} kcal
                </span>
              )}
              <button onClick={() => autoFillDay(day)} className="no-print" style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.18)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                ✨ Auto-fill day
              </button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 0 }}>
            {MEAL_SLOTS.map(({ slot, label, icon }) => {
              const recipe = plan[day][slot];
              const open = isExpanded(day, slot);
              return (
                <div
                  key={slot}
                  style={{
                    padding: 16,
                    borderRight: '1px solid var(--border)',
                    borderBottom: '1px solid var(--border)',
                    background: open ? 'var(--primary-pale)' : '#fff',
                    transition: 'background 0.15s',
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--muted)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {icon} {label}
                  </div>
                  {recipe ? (
                    <div>
                      {/* Compact header — clicking toggles expand */}
                      <button
                        onClick={() => toggleExpanded(day, slot)}
                        aria-expanded={open}
                        style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit' }}
                      >
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)', lineHeight: 1.3, marginBottom: 6, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                          <span style={{ flex: 1 }}>{recipe.name}</span>
                          <span className="no-print" style={{ fontSize: 12, color: 'var(--primary)', flexShrink: 0, marginTop: 1 }}>
                            {open ? '▾' : '▸'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--muted)', marginBottom: 10, flexWrap: 'wrap' }}>
                          <span>🔥 {recipe.nutrition.calories} kcal</span>
                          <span>⏱️ {recipe.prepTime + recipe.cookTime} min</span>
                          <span>💪 {recipe.nutrition.protein}g</span>
                        </div>
                      </button>

                      <div className="no-print" style={{ display: 'flex', gap: 10, fontSize: 12, flexWrap: 'wrap' }}>
                        <Link href={`/recipes/${recipe.id}`} style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>
                          Full page →
                        </Link>
                        <button onClick={() => setPickerOpen({ day, slot })} style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 12, fontFamily: 'inherit' }}>Change</button>
                        <button onClick={() => setMeal(day, slot, undefined)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 12, fontFamily: 'inherit' }}>✕ Remove</button>
                      </div>

                      {/* Expanded detail — ingredients + method inline */}
                      {open && (
                        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--primary-soft)' }}>
                          <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5, margin: '0 0 12px' }}>
                            {recipe.description}
                          </p>

                          {recipe.allergens && recipe.allergens.length > 0 && (
                            <div style={{ marginBottom: 12, padding: '8px 10px', background: 'var(--warning-bg)', borderRadius: 8, border: '1px solid #fcd34d', fontSize: 11, lineHeight: 1.5, color: '#78350f' }}>
                              <strong>⚠️ Allergens:</strong> {recipe.allergens.join(' · ')}
                            </div>
                          )}

                          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--primary-dark)', marginBottom: 6 }}>
                            Ingredients
                          </div>
                          {recipe.ingredients.map((group, gi) => (
                            <div key={gi} style={{ marginBottom: 8 }}>
                              {group.section && (
                                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', margin: '4px 0 2px' }}>{group.section}</div>
                              )}
                              <ul style={{ margin: 0, paddingLeft: 16 }}>
                                {group.items.map((item, ii) => (
                                  <li key={ii} style={{ fontSize: 12, lineHeight: 1.55, color: 'var(--foreground)' }}>
                                    {scaleIngredient(item, 1)}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}

                          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--primary-dark)', margin: '12px 0 6px' }}>
                            Method
                          </div>
                          <ol style={{ margin: 0, paddingLeft: 18 }}>
                            {recipe.instructions.map((step, i) => (
                              <li key={i} style={{ fontSize: 12, lineHeight: 1.55, color: 'var(--foreground)', marginBottom: 4 }}>
                                {step}
                              </li>
                            ))}
                          </ol>

                          {recipe.tip && (
                            <div style={{ marginTop: 10, padding: '8px 10px', background: 'var(--warning-bg)', borderRadius: 8, fontSize: 11, lineHeight: 1.5, color: '#78350f' }}>
                              💡 <strong>Tip:</strong> {recipe.tip}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <button
                        className="no-print"
                        onClick={() => setPickerOpen({ day, slot })}
                        style={{ width: '100%', padding: '14px', border: '1.5px dashed var(--border)', borderRadius: 8, background: '#fff', color: 'var(--muted)', fontSize: 13, cursor: 'pointer', textAlign: 'center', fontFamily: 'inherit' }}
                      >
                        + Add {label}
                      </button>
                      <div className="print-only" style={{ fontSize: 13, color: '#ccc', fontStyle: 'italic' }}>—</div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Recipe Picker Modal */}
      {pickerOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setPickerOpen(null)}>
          <div style={{ background: '#fff', borderRadius: 8, padding: 24, maxWidth: 560, width: '100%', maxHeight: '80vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
                Choose {MEAL_SLOTS.find(m => m.slot === pickerOpen.slot)?.label}
              </h3>
              <button onClick={() => setPickerOpen(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--muted)', fontFamily: 'inherit' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recipes
                .filter(r => r.category === MEAL_SLOTS.find(m => m.slot === pickerOpen.slot)?.category)
                .map(r => (
                  <button
                    key={r.id}
                    onClick={() => setMeal(pickerOpen.day, pickerOpen.slot, r)}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', border: '1.5px solid var(--border)', borderRadius: 8, cursor: 'pointer', background: '#fff', textAlign: 'left', transition: 'border-color 0.15s, background 0.15s', fontFamily: 'inherit' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'var(--primary-pale)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = '#fff'; }}
                  >
                    <img src={r.image} alt={r.name} style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)', marginBottom: 4 }}>{r.name}</div>
                      <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--muted)', flexWrap: 'wrap' }}>
                        <span>🔥 {r.nutrition.calories} kcal</span>
                        <span>⏱️ {r.prepTime + r.cookTime} min</span>
                        <span>💪 {r.nutrition.protein}g protein</span>
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

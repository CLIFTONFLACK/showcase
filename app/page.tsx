'use client';

import { useState, useMemo } from 'react';
import { recipes, CATEGORIES, filterRecipes, type Category } from '@/lib/recipes';
import RecipeCard from '@/components/RecipeCard';

const DIETARY_TAGS = ['Gluten-Free', 'Dairy-Free', 'Vegan-Friendly', 'Refined Sugar-Free'];
const NUTRITION_TAGS = ['High Protein', 'High Fibre', 'Omega-3 Rich', 'Nutrient-Dense'];
const STYLE_TAGS = ['Mediterranean-Style', 'Anti-Inflammatory Breakfast Smoothies', '5-Ingredient Meals for Busy Days'];

const TIME_OPTIONS = [
  { label: 'Any time', value: 0 },
  { label: '< 15 min', value: 15 },
  { label: '< 30 min', value: 30 },
  { label: '< 45 min', value: 45 },
];

export default function Home() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | 'all'>('all');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [maxTime, setMaxTime] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const results = useMemo(() => filterRecipes({
    query,
    category,
    tags: activeTags,
    maxPrepTime: maxTime || undefined,
  }), [query, category, activeTags, maxTime]);

  const toggleTag = (tag: string) =>
    setActiveTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  const clearAll = () => { setQuery(''); setCategory('all'); setActiveTags([]); setMaxTime(0); };
  const hasFilters = !!(query || category !== 'all' || activeTags.length || maxTime);

  return (
    <div>
      {/* Hero — clean, EPAVANCE-style: white background, teal brand accents, no dark overlay */}
      <section style={{ background: 'var(--primary-wash)', color: 'var(--foreground)', padding: '64px 24px 56px', borderBottom: '1px solid var(--primary-soft)' }}>
        <div style={{ maxWidth: 820, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: '#fff', color: 'var(--primary)', padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, marginBottom: 22, border: '1.5px solid var(--primary-soft)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            IBD-Friendly Eating
          </div>
          <h1 style={{ fontSize: 'clamp(30px, 5vw, 50px)', fontWeight: 600, marginBottom: 18, lineHeight: 1.15, letterSpacing: '-0.02em', color: 'var(--foreground)' }}>
            Gut-Friendly Recipes
          </h1>
          <p style={{ fontSize: 17, color: 'var(--muted)', lineHeight: 1.7, maxWidth: 620, margin: '0 auto 32px' }}>
            Anti-inflammatory, whole-food recipes designed to nourish and support people living with IBD. Free from gluten, dairy, and refined sugars.
          </p>
          <div style={{ display: 'flex', gap: 'clamp(12px, 2.5vw, 28px)', flexWrap: 'wrap', justifyContent: 'center', rowGap: 8, fontSize: 13, color: 'var(--muted)' }}>
            {[
              { icon: '🌱', label: `${recipes.length} Recipes` },
              { icon: '⚡', label: 'Quick to prepare' },
              { icon: '🍃', label: 'Whole food ingredients' },
              { icon: '💚', label: 'IBD-conscious' },
            ].map((item, i, arr) => (
              <span key={item.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span aria-hidden="true">{item.icon}</span>
                <span style={{ fontWeight: 500 }}>{item.label}</span>
                {i < arr.length - 1 && (
                  <span aria-hidden="true" style={{ marginLeft: 'clamp(12px, 2.5vw, 28px)', color: 'var(--primary-mid)', opacity: 0.7 }}>·</span>
                )}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Sticky Search & Filters */}
      <section className="no-print" style={{ background: '#fff', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 3px 6px rgba(0,0,0,0.05)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '14px 24px' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 15, pointerEvents: 'none' }}>🔍</span>
              <input
                type="text"
                placeholder="Search recipes, ingredients, tags..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 14, outline: 'none', background: '#fff', fontFamily: 'inherit' }}
              />
            </div>
            <button
              onClick={() => setFiltersOpen(v => !v)}
              style={{ padding: '10px 18px', borderRadius: 8, border: '1.5px solid', borderColor: filtersOpen || activeTags.length ? 'var(--primary)' : 'var(--border)', background: filtersOpen || activeTags.length ? 'var(--primary)' : '#fff', color: filtersOpen || activeTags.length ? '#fff' : 'var(--foreground)', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              ⚙️ Filters {activeTags.length > 0 && `(${activeTags.length})`}
            </button>
            {hasFilters && (
              <button onClick={clearAll} style={{ padding: '10px 14px', borderRadius: 8, border: '1.5px solid #fee2e2', background: '#fff', color: '#ef4444', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                ✕ Clear
              </button>
            )}
          </div>

          {/* Category pills */}
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            {CATEGORIES.map(cat => (
              <button key={cat.value} onClick={() => setCategory(cat.value)} style={{ padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: '1.5px solid', borderColor: category === cat.value ? 'var(--primary)' : 'var(--border)', background: category === cat.value ? 'var(--primary)' : '#fff', color: category === cat.value ? '#fff' : 'var(--foreground)', fontFamily: 'inherit' }}>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Expanded filters */}
          {filtersOpen && (
            <div style={{ marginTop: 14, padding: 18, background: 'var(--primary-pale)', borderRadius: 8, border: '1px solid var(--primary-soft)' }}>
              {[
                { label: 'Dietary', tags: DIETARY_TAGS },
                { label: 'Nutritional', tags: NUTRITION_TAGS },
                { label: 'Style', tags: STYLE_TAGS },
              ].map(group => (
                <div key={group.label} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 8 }}>{group.label}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {group.tags.map(tag => (
                      <button key={tag} onClick={() => toggleTag(tag)} style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer', border: '1.5px solid', fontWeight: activeTags.includes(tag) ? 600 : 400, borderColor: activeTags.includes(tag) ? 'var(--primary)' : 'var(--border)', background: activeTags.includes(tag) ? 'var(--primary-wash)' : '#fff', color: activeTags.includes(tag) ? 'var(--primary-dark)' : 'var(--foreground)', fontFamily: 'inherit' }}>
                        {activeTags.includes(tag) && '✓ '}{tag}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 8 }}>Total Time</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {TIME_OPTIONS.map(opt => (
                    <button key={opt.value} onClick={() => setMaxTime(opt.value)} style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer', border: '1.5px solid', borderColor: maxTime === opt.value ? 'var(--primary)' : 'var(--border)', background: maxTime === opt.value ? 'var(--primary-wash)' : '#fff', color: maxTime === opt.value ? 'var(--primary-dark)' : 'var(--foreground)', fontWeight: maxTime === opt.value ? 600 : 400, fontFamily: 'inherit' }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Recipe Grid */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '36px 24px 64px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <h2 style={{ fontSize: 17, fontWeight: 600, color: 'var(--foreground)' }}>
            {results.length} recipe{results.length !== 1 ? 's' : ''}
            {category !== 'all' && <span style={{ color: 'var(--muted)', fontWeight: 400 }}> · {category.charAt(0).toUpperCase() + category.slice(1)}</span>}
          </h2>
          <a href="/meal-plan" style={{ background: 'var(--primary)', color: '#fff', padding: '10px 20px', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 600, boxShadow: '0 3px 6px rgba(0,128,128,0.15)' }}>
            📅 Build Meal Plan
          </a>
        </div>

        {results.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🥗</div>
            <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: 'var(--foreground)' }}>No recipes found</p>
            <p style={{ fontSize: 14, marginBottom: 20 }}>Try adjusting your search or removing some filters</p>
            <button onClick={clearAll} style={{ padding: '11px 24px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>Clear All Filters</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
            {results.map(recipe => <RecipeCard key={recipe.id} recipe={recipe} />)}
          </div>
        )}
      </section>
    </div>
  );
}

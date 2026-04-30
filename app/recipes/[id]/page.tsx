import { recipes, getRecipeById } from '@/lib/recipes';
import { notFound } from 'next/navigation';
import RecipeDetailClient from '@/components/RecipeDetailClient';
import type { Metadata } from 'next';

export function generateStaticParams() {
  return recipes.map(r => ({ id: r.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const recipe = getRecipeById(id);
  if (!recipe) return { title: 'Recipe not found' };
  return {
    title: `${recipe.name} | EPAVANCE Gut-Friendly Recipes`,
    description: recipe.description,
  };
}

export default async function RecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recipe = getRecipeById(id);
  if (!recipe) notFound();
  return <RecipeDetailClient recipe={recipe} />;
}

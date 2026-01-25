import type { Ingredient, Recipe } from '@/types';

const API_BASE = '/api';

export async function recognizeIngredients(imageBase64: string): Promise<Ingredient[]> {
  const response = await fetch(`${API_BASE}/recognize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ image: imageBase64 }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '食材识别失败');
  }

  const data = await response.json();
  return data.ingredients;
}

export async function generateRecipes(ingredients: Ingredient[]): Promise<Recipe[]> {
  const response = await fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ingredients }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '食谱生成失败');
  }

  const data = await response.json();
  return data.recipes;
}

export async function saveFavorite(recipeId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/favorites`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ recipeId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '保存收藏失败');
  }
}

export async function removeFavorite(recipeId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/favorites/${recipeId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '删除收藏失败');
  }
}

export async function getFavorites(): Promise<Recipe[]> {
  const response = await fetch(`${API_BASE}/favorites`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '获取收藏失败');
  }

  const data = await response.json();
  return data.favorites;
}

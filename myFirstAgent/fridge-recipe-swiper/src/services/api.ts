import type { Ingredient, Recipe } from '@/types';

const API_BASE = '/api';

export async function recognizeIngredients(imageBase64: string, language: 'zh' | 'en' = 'zh'): Promise<Ingredient[]> {
  const response = await fetch(`${API_BASE}/recognize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ image: imageBase64, language }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || (language === 'zh' ? '食材识别失败' : 'Failed to recognize ingredients'));
  }

  const data = await response.json();
  return data.ingredients;
}

export async function generateRecipes(ingredients: Ingredient[], language: 'zh' | 'en' = 'zh'): Promise<Recipe[]> {
  console.log('API client generateRecipes called with language:', language);
  const requestBody = { ingredients, language };
  console.log('Request body:', JSON.stringify(requestBody).slice(0, 200));

  const response = await fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || (language === 'zh' ? '食谱生成失败' : 'Failed to generate recipes'));
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

import { describe, it, expect, beforeEach } from 'vitest';
import { useFavoriteStore } from '../useFavoriteStore';
import type { Recipe } from '@/types';

describe('useFavoriteStore', () => {
  const mockRecipe: Recipe = {
    id: 'recipe-1',
    name: '番茄炒蛋',
    description: '经典家常菜',
    ingredients: [{ name: '番茄', amount: '2个' }],
    steps: ['步骤1', '步骤2'],
    cookingTime: 15,
    difficulty: 'easy',
  };

  beforeEach(() => {
    useFavoriteStore.getState().clearFavorites();
  });

  it('should have empty favorites initially', () => {
    expect(useFavoriteStore.getState().favorites).toEqual([]);
  });

  it('should add favorite', () => {
    const { addFavorite } = useFavoriteStore.getState();

    addFavorite(mockRecipe);

    expect(useFavoriteStore.getState().favorites).toHaveLength(1);
    expect(useFavoriteStore.getState().favorites[0]).toEqual(mockRecipe);
  });

  it('should not add duplicate favorite', () => {
    const { addFavorite } = useFavoriteStore.getState();

    addFavorite(mockRecipe);
    addFavorite(mockRecipe);

    expect(useFavoriteStore.getState().favorites).toHaveLength(1);
  });

  it('should add multiple different favorites', () => {
    const { addFavorite } = useFavoriteStore.getState();
    const anotherRecipe: Recipe = {
      ...mockRecipe,
      id: 'recipe-2',
      name: '青椒炒蛋',
    };

    addFavorite(mockRecipe);
    addFavorite(anotherRecipe);

    expect(useFavoriteStore.getState().favorites).toHaveLength(2);
  });

  it('should remove favorite by id', () => {
    const { addFavorite, removeFavorite } = useFavoriteStore.getState();

    addFavorite(mockRecipe);
    removeFavorite('recipe-1');

    expect(useFavoriteStore.getState().favorites).toHaveLength(0);
  });

  it('should not throw when removing non-existent favorite', () => {
    const { removeFavorite } = useFavoriteStore.getState();

    expect(() => removeFavorite('non-existent-id')).not.toThrow();
    expect(useFavoriteStore.getState().favorites).toHaveLength(0);
  });

  it('should check if recipe is favorited', () => {
    const { addFavorite, isFavorite } = useFavoriteStore.getState();

    expect(isFavorite('recipe-1')).toBe(false);

    addFavorite(mockRecipe);

    expect(useFavoriteStore.getState().isFavorite('recipe-1')).toBe(true);
    expect(useFavoriteStore.getState().isFavorite('recipe-2')).toBe(false);
  });

  it('should clear all favorites', () => {
    const { addFavorite, clearFavorites } = useFavoriteStore.getState();
    const anotherRecipe: Recipe = {
      ...mockRecipe,
      id: 'recipe-2',
      name: '青椒炒蛋',
    };

    addFavorite(mockRecipe);
    addFavorite(anotherRecipe);

    expect(useFavoriteStore.getState().favorites).toHaveLength(2);

    clearFavorites();

    expect(useFavoriteStore.getState().favorites).toHaveLength(0);
  });

  it('should preserve favorites order', () => {
    const { addFavorite } = useFavoriteStore.getState();
    const recipes: Recipe[] = [
      { ...mockRecipe, id: '1', name: '菜品1' },
      { ...mockRecipe, id: '2', name: '菜品2' },
      { ...mockRecipe, id: '3', name: '菜品3' },
    ];

    recipes.forEach((r) => addFavorite(r));

    const favorites = useFavoriteStore.getState().favorites;
    expect(favorites.map((f) => f.id)).toEqual(['1', '2', '3']);
  });
});

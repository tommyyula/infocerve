import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Recipe } from '@/types';

interface FavoriteState {
  favorites: Recipe[];

  addFavorite: (recipe: Recipe) => void;
  removeFavorite: (recipeId: string) => void;
  isFavorite: (recipeId: string) => boolean;
  clearFavorites: () => void;
}

export const useFavoriteStore = create<FavoriteState>()(
  persist(
    (set, get) => ({
      favorites: [],

      addFavorite: (recipe) => {
        const { favorites } = get();
        if (favorites.some((f) => f.id === recipe.id)) {
          return; // Already favorited
        }
        set({ favorites: [...favorites, recipe] });
      },

      removeFavorite: (recipeId) =>
        set((state) => ({
          favorites: state.favorites.filter((f) => f.id !== recipeId),
        })),

      isFavorite: (recipeId) => {
        const { favorites } = get();
        return favorites.some((f) => f.id === recipeId);
      },

      clearFavorites: () => set({ favorites: [] }),
    }),
    {
      name: 'fridge-recipe-favorites',
    }
  )
);

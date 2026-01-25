import { create } from 'zustand';
import type { AppStep, Ingredient, Recipe } from '@/types';

interface AppState {
  // Current step
  step: AppStep;

  // Upload state
  imageFile: File | null;
  imagePreview: string | null;
  uploadedImage: string | null;

  // Ingredients state
  ingredients: Ingredient[];
  isRecognizing: boolean;

  // Recipes state
  recipes: Recipe[];
  currentIndex: number;
  isGenerating: boolean;

  // Error state
  error: string | null;

  // Actions
  setStep: (step: AppStep) => void;
  setImage: (file: File, preview: string) => void;
  setUploadedImage: (image: string | null) => void;
  clearImage: () => void;
  setIngredients: (ingredients: Ingredient[]) => void;
  addIngredient: (name: string) => void;
  removeIngredient: (index: number) => void;
  setIsRecognizing: (value: boolean) => void;
  setRecipes: (recipes: Recipe[]) => void;
  setIsGenerating: (value: boolean) => void;
  setCurrentIndex: (index: number) => void;
  nextCard: () => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  step: 'upload' as AppStep,
  imageFile: null,
  imagePreview: null,
  uploadedImage: null,
  ingredients: [],
  isRecognizing: false,
  recipes: [],
  currentIndex: 0,
  isGenerating: false,
  error: null,
};

export const useAppStore = create<AppState>((set) => ({
  ...initialState,

  setStep: (step) => set({ step }),

  setImage: (file, preview) => set({ imageFile: file, imagePreview: preview, uploadedImage: preview }),

  setUploadedImage: (image) => set({ uploadedImage: image, imagePreview: image }),

  clearImage: () => set({ imageFile: null, imagePreview: null, uploadedImage: null }),

  setIngredients: (ingredients) => set({ ingredients }),

  addIngredient: (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    set((state) => ({
      ingredients: [...state.ingredients, { name: trimmed }],
    }));
  },

  removeIngredient: (index) =>
    set((state) => ({
      ingredients: state.ingredients.filter((_, i) => i !== index),
    })),

  setIsRecognizing: (value) => set({ isRecognizing: value }),

  setRecipes: (recipes) => set({ recipes, currentIndex: 0 }),

  setIsGenerating: (value) => set({ isGenerating: value }),

  setCurrentIndex: (index) => set({ currentIndex: index }),

  nextCard: () =>
    set((state) => ({
      currentIndex: state.currentIndex + 1,
    })),

  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),

  reset: () => set(initialState),
}));

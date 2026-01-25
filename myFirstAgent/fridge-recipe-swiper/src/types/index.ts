// Ingredient types
export interface Ingredient {
  name: string;
  quantity?: string;
  confidence?: number;
}

// Recipe types
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface RecipeIngredient {
  name: string;
  amount: string;
  optional?: boolean;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  ingredients: RecipeIngredient[];
  steps: string[];
  cookingTime: number;
  difficulty: Difficulty;
  imageUrl?: string;
}

// Favorite types
export interface Favorite {
  id: string;
  userId: string;
  recipeId: string;
  recipe: Recipe;
  createdAt: number;
}

// App state types
export type AppStep = 'upload' | 'ingredients' | 'loading' | 'swipe' | 'result';

// Swipe direction
export type SwipeDirection = 'left' | 'right';

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface UploadResponse {
  url: string;
  sessionId: string;
}

export interface RecognizeResponse {
  ingredients: Ingredient[];
}

export interface GenerateRecipesResponse {
  recipes: Recipe[];
}

export interface FavoritesResponse {
  favorites: Favorite[];
}

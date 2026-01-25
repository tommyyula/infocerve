import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../useAppStore';
import type { Recipe } from '@/types';

describe('useAppStore', () => {
  beforeEach(() => {
    useAppStore.getState().reset();
  });

  // UT-001-1: Initial state
  it('should have correct initial state', () => {
    const state = useAppStore.getState();

    expect(state.step).toBe('upload');
    expect(state.imageFile).toBeNull();
    expect(state.imagePreview).toBeNull();
    expect(state.uploadedImage).toBeNull();
    expect(state.ingredients).toEqual([]);
    expect(state.recipes).toEqual([]);
    expect(state.currentIndex).toBe(0);
    expect(state.isRecognizing).toBe(false);
    expect(state.isGenerating).toBe(false);
    expect(state.error).toBeNull();
  });

  // UT-001-2: setStep
  it('should update step', () => {
    const { setStep } = useAppStore.getState();

    setStep('ingredients');
    expect(useAppStore.getState().step).toBe('ingredients');

    setStep('swipe');
    expect(useAppStore.getState().step).toBe('swipe');

    setStep('result');
    expect(useAppStore.getState().step).toBe('result');
  });

  // UT-001-3: setImage
  it('should set image file and preview', () => {
    const { setImage } = useAppStore.getState();
    const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
    const mockPreview = 'blob:http://localhost/123';

    setImage(mockFile, mockPreview);

    const state = useAppStore.getState();
    expect(state.imageFile).toBe(mockFile);
    expect(state.imagePreview).toBe(mockPreview);
    expect(state.uploadedImage).toBe(mockPreview);
  });

  it('should clear image', () => {
    const { setImage, clearImage } = useAppStore.getState();
    const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });

    setImage(mockFile, 'preview');
    clearImage();

    const state = useAppStore.getState();
    expect(state.imageFile).toBeNull();
    expect(state.imagePreview).toBeNull();
    expect(state.uploadedImage).toBeNull();
  });

  // UT-001-4: ingredients operations
  describe('ingredients operations', () => {
    it('should set ingredients', () => {
      const { setIngredients } = useAppStore.getState();
      const ingredients = [
        { name: '番茄', confidence: 0.95 },
        { name: '鸡蛋', confidence: 0.9 },
      ];

      setIngredients(ingredients);
      expect(useAppStore.getState().ingredients).toEqual(ingredients);
    });

    it('should add ingredient', () => {
      const { setIngredients, addIngredient } = useAppStore.getState();
      setIngredients([{ name: '番茄' }]);

      addIngredient('鸡蛋');

      const ingredients = useAppStore.getState().ingredients;
      expect(ingredients).toHaveLength(2);
      expect(ingredients[1].name).toBe('鸡蛋');
    });

    it('should remove ingredient by index', () => {
      const { setIngredients, removeIngredient } = useAppStore.getState();
      setIngredients([{ name: '番茄' }, { name: '鸡蛋' }, { name: '青椒' }]);

      removeIngredient(1);

      const ingredients = useAppStore.getState().ingredients;
      expect(ingredients).toHaveLength(2);
      expect(ingredients.map((i) => i.name)).toEqual(['番茄', '青椒']);
    });

    it('should not add empty ingredient', () => {
      const { addIngredient } = useAppStore.getState();
      const initialLength = useAppStore.getState().ingredients.length;

      addIngredient('');
      addIngredient('   ');

      expect(useAppStore.getState().ingredients.length).toBe(initialLength);
    });
  });

  // UT-001-5: recipes and currentIndex
  describe('recipes operations', () => {
    const mockRecipes: Recipe[] = [
      {
        id: '1',
        name: '番茄炒蛋',
        description: '经典家常菜',
        steps: ['步骤1', '步骤2'],
        ingredients: [{ name: '番茄', amount: '2个' }],
        cookingTime: 15,
        difficulty: 'easy',
      },
      {
        id: '2',
        name: '青椒炒蛋',
        description: '清淡可口',
        steps: ['步骤1', '步骤2'],
        ingredients: [{ name: '青椒', amount: '2个' }],
        cookingTime: 12,
        difficulty: 'easy',
      },
    ];

    it('should set recipes and reset currentIndex', () => {
      const { setRecipes, setCurrentIndex } = useAppStore.getState();

      // First set a non-zero index
      setCurrentIndex(5);
      expect(useAppStore.getState().currentIndex).toBe(5);

      // Setting recipes should reset index to 0
      setRecipes(mockRecipes);

      expect(useAppStore.getState().recipes).toEqual(mockRecipes);
      expect(useAppStore.getState().currentIndex).toBe(0);
    });

    it('should increment currentIndex with nextCard', () => {
      const { setRecipes, nextCard } = useAppStore.getState();
      setRecipes(mockRecipes);

      nextCard();
      expect(useAppStore.getState().currentIndex).toBe(1);

      nextCard();
      expect(useAppStore.getState().currentIndex).toBe(2);
    });

    it('should set currentIndex directly', () => {
      const { setCurrentIndex } = useAppStore.getState();

      setCurrentIndex(3);
      expect(useAppStore.getState().currentIndex).toBe(3);
    });
  });

  // Loading states
  describe('loading states', () => {
    it('should set isRecognizing', () => {
      const { setIsRecognizing } = useAppStore.getState();

      setIsRecognizing(true);
      expect(useAppStore.getState().isRecognizing).toBe(true);

      setIsRecognizing(false);
      expect(useAppStore.getState().isRecognizing).toBe(false);
    });

    it('should set isGenerating', () => {
      const { setIsGenerating } = useAppStore.getState();

      setIsGenerating(true);
      expect(useAppStore.getState().isGenerating).toBe(true);

      setIsGenerating(false);
      expect(useAppStore.getState().isGenerating).toBe(false);
    });
  });

  // Error handling
  describe('error handling', () => {
    it('should set error', () => {
      const { setError } = useAppStore.getState();

      setError('Something went wrong');
      expect(useAppStore.getState().error).toBe('Something went wrong');
    });

    it('should clear error', () => {
      const { setError, clearError } = useAppStore.getState();

      setError('Error message');
      clearError();

      expect(useAppStore.getState().error).toBeNull();
    });
  });

  // UT-001-6: reset
  it('should reset all state', () => {
    const store = useAppStore.getState();

    // Set some state
    store.setStep('swipe');
    store.setIngredients([{ name: '番茄' }]);
    store.setRecipes([
      {
        id: '1',
        name: 'Test',
        description: 'Test',
        steps: [],
        ingredients: [],
        cookingTime: 10,
        difficulty: 'easy',
      },
    ]);
    store.setError('Some error');
    store.setCurrentIndex(5);

    // Reset
    store.reset();

    const state = useAppStore.getState();
    expect(state.step).toBe('upload');
    expect(state.ingredients).toEqual([]);
    expect(state.recipes).toEqual([]);
    expect(state.currentIndex).toBe(0);
    expect(state.error).toBeNull();
  });
});

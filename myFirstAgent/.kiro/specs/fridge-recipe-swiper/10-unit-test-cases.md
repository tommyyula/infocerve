# 阶段 10: 单元测试用例 (Unit Test Cases)

## 测试框架

- **测试框架**: Vitest
- **组件测试**: React Testing Library
- **Mock**: vitest mock

---

## 测试覆盖范围

| 类别 | 测试文件 | 优先级 |
|------|----------|--------|
| Stores | useAppStore.test.ts | P0 |
| Stores | useFavoriteStore.test.ts | P0 |
| Hooks | useSwipe.test.ts | P1 |
| Utils | imageCompress.test.ts | P1 |
| Utils | formatTime.test.ts | P2 |
| Components | IngredientTag.test.tsx | P1 |
| Components | RecipeCard.test.tsx | P1 |

---

## UT-001: useAppStore 测试

### UT-001-1: 初始状态

```typescript
// stores/__tests__/useAppStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../useAppStore';

describe('useAppStore', () => {
  beforeEach(() => {
    useAppStore.getState().reset();
  });

  it('should have correct initial state', () => {
    const state = useAppStore.getState();

    expect(state.step).toBe('upload');
    expect(state.imageFile).toBeNull();
    expect(state.imagePreview).toBeNull();
    expect(state.ingredients).toEqual([]);
    expect(state.recipes).toEqual([]);
    expect(state.currentIndex).toBe(0);
    expect(state.isRecognizing).toBe(false);
    expect(state.isGenerating).toBe(false);
  });
});
```

### UT-001-2: setStep

```typescript
it('should update step', () => {
  const { setStep } = useAppStore.getState();

  setStep('ingredients');
  expect(useAppStore.getState().step).toBe('ingredients');

  setStep('swipe');
  expect(useAppStore.getState().step).toBe('swipe');
});
```

### UT-001-3: setImage

```typescript
it('should set image file and preview', () => {
  const { setImage } = useAppStore.getState();
  const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
  const mockPreview = 'blob:http://localhost/123';

  setImage(mockFile, mockPreview);

  const state = useAppStore.getState();
  expect(state.imageFile).toBe(mockFile);
  expect(state.imagePreview).toBe(mockPreview);
});
```

### UT-001-4: ingredients 操作

```typescript
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
    expect(ingredients.map(i => i.name)).toEqual(['番茄', '青椒']);
  });

  it('should not add empty ingredient', () => {
    const { addIngredient } = useAppStore.getState();
    const initialLength = useAppStore.getState().ingredients.length;

    addIngredient('');
    addIngredient('   ');

    expect(useAppStore.getState().ingredients.length).toBe(initialLength);
  });
});
```

### UT-001-5: recipes 和 currentIndex

```typescript
describe('recipes operations', () => {
  const mockRecipes = [
    { id: '1', name: '番茄炒蛋', steps: [], ingredients: [], cookingTime: 15, difficulty: 'easy' },
    { id: '2', name: '青椒炒蛋', steps: [], ingredients: [], cookingTime: 12, difficulty: 'easy' },
  ];

  it('should set recipes', () => {
    const { setRecipes } = useAppStore.getState();

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
});
```

### UT-001-6: reset

```typescript
it('should reset all state', () => {
  const store = useAppStore.getState();

  // Set some state
  store.setStep('swipe');
  store.setIngredients([{ name: '番茄' }]);
  store.setRecipes([{ id: '1', name: 'Test' }]);

  // Reset
  store.reset();

  const state = useAppStore.getState();
  expect(state.step).toBe('upload');
  expect(state.ingredients).toEqual([]);
  expect(state.recipes).toEqual([]);
  expect(state.currentIndex).toBe(0);
});
```

---

## UT-002: useFavoriteStore 测试

```typescript
// stores/__tests__/useFavoriteStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useFavoriteStore } from '../useFavoriteStore';

describe('useFavoriteStore', () => {
  const mockRecipe = {
    id: 'recipe-1',
    name: '番茄炒蛋',
    description: '经典家常菜',
    ingredients: [],
    steps: [],
    cookingTime: 15,
    difficulty: 'easy' as const,
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

  it('should remove favorite by id', () => {
    const { addFavorite, removeFavorite } = useFavoriteStore.getState();

    addFavorite(mockRecipe);
    removeFavorite('recipe-1');

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

    addFavorite(mockRecipe);
    addFavorite({ ...mockRecipe, id: 'recipe-2', name: '青椒炒蛋' });

    clearFavorites();

    expect(useFavoriteStore.getState().favorites).toHaveLength(0);
  });
});
```

---

## UT-003: useSwipe Hook 测试

```typescript
// hooks/__tests__/useSwipe.test.ts
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useSwipe } from '../useSwipe';

describe('useSwipe', () => {
  it('should call onSwipeLeft when swiped left', () => {
    const onSwipeLeft = vi.fn();
    const onSwipeRight = vi.fn();

    const { result } = renderHook(() =>
      useSwipe({ onSwipeLeft, onSwipeRight, threshold: 100 })
    );

    act(() => {
      result.current.handleSwipe(-150);
    });

    expect(onSwipeLeft).toHaveBeenCalled();
    expect(onSwipeRight).not.toHaveBeenCalled();
  });

  it('should call onSwipeRight when swiped right', () => {
    const onSwipeLeft = vi.fn();
    const onSwipeRight = vi.fn();

    const { result } = renderHook(() =>
      useSwipe({ onSwipeLeft, onSwipeRight, threshold: 100 })
    );

    act(() => {
      result.current.handleSwipe(150);
    });

    expect(onSwipeRight).toHaveBeenCalled();
    expect(onSwipeLeft).not.toHaveBeenCalled();
  });

  it('should not trigger when below threshold', () => {
    const onSwipeLeft = vi.fn();
    const onSwipeRight = vi.fn();

    const { result } = renderHook(() =>
      useSwipe({ onSwipeLeft, onSwipeRight, threshold: 100 })
    );

    act(() => {
      result.current.handleSwipe(50);
    });

    expect(onSwipeLeft).not.toHaveBeenCalled();
    expect(onSwipeRight).not.toHaveBeenCalled();
  });
});
```

---

## UT-004: imageCompress 工具测试

```typescript
// utils/__tests__/imageCompress.test.ts
import { describe, it, expect } from 'vitest';
import { compressImage, shouldCompress } from '../imageCompress';

describe('imageCompress', () => {
  describe('shouldCompress', () => {
    it('should return true for files > 5MB', () => {
      expect(shouldCompress(6 * 1024 * 1024)).toBe(true);
    });

    it('should return false for files <= 5MB', () => {
      expect(shouldCompress(5 * 1024 * 1024)).toBe(false);
      expect(shouldCompress(1 * 1024 * 1024)).toBe(false);
    });
  });

  describe('compressImage', () => {
    it('should return original file if no compression needed', async () => {
      const smallFile = new File(['x'.repeat(1000)], 'small.jpg', {
        type: 'image/jpeg',
      });

      const result = await compressImage(smallFile);
      expect(result).toBe(smallFile);
    });

    // Note: Full compression test requires canvas mock
  });
});
```

---

## UT-005: formatTime 工具测试

```typescript
// utils/__tests__/formatTime.test.ts
import { describe, it, expect } from 'vitest';
import { formatCookingTime } from '../formatTime';

describe('formatCookingTime', () => {
  it('should format minutes only', () => {
    expect(formatCookingTime(15)).toBe('15分钟');
    expect(formatCookingTime(45)).toBe('45分钟');
  });

  it('should format hours and minutes', () => {
    expect(formatCookingTime(60)).toBe('1小时');
    expect(formatCookingTime(90)).toBe('1小时30分钟');
    expect(formatCookingTime(120)).toBe('2小时');
  });

  it('should handle zero', () => {
    expect(formatCookingTime(0)).toBe('0分钟');
  });
});
```

---

## UT-006: IngredientTag 组件测试

```typescript
// components/__tests__/IngredientTag.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { IngredientTag } from '../IngredientTag';

describe('IngredientTag', () => {
  it('should render ingredient name', () => {
    render(<IngredientTag name="番茄" onRemove={() => {}} />);

    expect(screen.getByText('番茄')).toBeInTheDocument();
  });

  it('should call onRemove when clicking remove button', () => {
    const onRemove = vi.fn();
    render(<IngredientTag name="番茄" onRemove={onRemove} />);

    fireEvent.click(screen.getByRole('button'));

    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('should show confidence badge when provided', () => {
    render(<IngredientTag name="番茄" confidence={0.95} onRemove={() => {}} />);

    expect(screen.getByText('95%')).toBeInTheDocument();
  });
});
```

---

## UT-007: RecipeCard 组件测试

```typescript
// components/__tests__/RecipeCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RecipeCard } from '../RecipeCard';

describe('RecipeCard', () => {
  const mockRecipe = {
    id: '1',
    name: '番茄炒蛋',
    description: '经典家常菜',
    ingredients: [],
    steps: [],
    cookingTime: 15,
    difficulty: 'easy' as const,
  };

  it('should render recipe name', () => {
    render(<RecipeCard recipe={mockRecipe} onClick={() => {}} />);

    expect(screen.getByText('番茄炒蛋')).toBeInTheDocument();
  });

  it('should render cooking time', () => {
    render(<RecipeCard recipe={mockRecipe} onClick={() => {}} />);

    expect(screen.getByText(/15分钟/)).toBeInTheDocument();
  });

  it('should render difficulty', () => {
    render(<RecipeCard recipe={mockRecipe} onClick={() => {}} />);

    expect(screen.getByText(/简单/)).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const onClick = vi.fn();
    render(<RecipeCard recipe={mockRecipe} onClick={onClick} />);

    fireEvent.click(screen.getByText('番茄炒蛋'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
```

---

## 自检清单

- [x] Store 测试用例已设计
- [x] Hook 测试用例已设计
- [x] 工具函数测试已设计
- [x] 组件测试用例已设计
- [x] Mock 策略已说明

---

**文档状态**: 待确认
**创建时间**: 2026-01-19
**版本**: 1.0

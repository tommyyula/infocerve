# 阶段 6: 前端规格文档 (FSD)

## 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 框架 | React | 18.x |
| 构建 | Vite | 5.x |
| 语言 | TypeScript | 5.x |
| 样式 | Tailwind CSS | 3.x |
| 状态 | Zustand | 4.x |
| 手势 | @use-gesture/react | 10.x |
| 动画 | framer-motion | 11.x |
| HTTP | fetch (原生) | - |

---

## 项目结构

```
src/
├── main.tsx                 # 入口文件
├── App.tsx                  # 根组件
├── index.css                # 全局样式
│
├── components/              # 组件
│   ├── ui/                  # 通用 UI 组件
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Spinner.tsx
│   │   └── Tag.tsx
│   │
│   ├── upload/              # 上传相关
│   │   ├── UploadArea.tsx
│   │   └── ImagePreview.tsx
│   │
│   ├── ingredients/         # 食材相关
│   │   ├── IngredientList.tsx
│   │   ├── IngredientTag.tsx
│   │   └── AddIngredient.tsx
│   │
│   ├── recipe/              # 食谱相关
│   │   ├── RecipeCard.tsx
│   │   ├── RecipeDetail.tsx
│   │   ├── RecipeList.tsx
│   │   └── SwipeableCard.tsx
│   │
│   └── layout/              # 布局
│       ├── Header.tsx
│       └── Screen.tsx
│
├── pages/                   # 页面
│   ├── UploadPage.tsx
│   ├── IngredientsPage.tsx
│   ├── SwipePage.tsx
│   ├── ResultPage.tsx
│   └── FavoritesPage.tsx
│
├── stores/                  # 状态管理
│   ├── useAppStore.ts       # 主状态
│   └── useFavoriteStore.ts  # 收藏状态
│
├── services/                # API 服务
│   ├── api.ts               # API 客户端
│   ├── uploadService.ts
│   ├── recognizeService.ts
│   ├── recipeService.ts
│   └── favoriteService.ts
│
├── types/                   # 类型定义
│   ├── ingredient.ts
│   ├── recipe.ts
│   └── api.ts
│
├── hooks/                   # 自定义 Hooks
│   ├── useSwipe.ts
│   └── useImageUpload.ts
│
└── utils/                   # 工具函数
    ├── imageCompress.ts
    └── formatTime.ts
```

---

## 页面规格

### 详细规格文档

| 页面 | 文档 |
|------|------|
| 上传页 | [upload-page.md](./upload-page.md) |
| 食材页 | [ingredients-page.md](./ingredients-page.md) |
| 滑动页 | [swipe-page.md](./swipe-page.md) |
| 结果页 | [result-page.md](./result-page.md) |

---

## 状态管理

### useAppStore (主状态)

```typescript
interface AppState {
  // 当前步骤
  step: 'upload' | 'ingredients' | 'loading' | 'swipe' | 'result';

  // 上传相关
  imageFile: File | null;
  imagePreview: string | null;

  // 食材相关
  ingredients: Ingredient[];
  isRecognizing: boolean;

  // 食谱相关
  recipes: Recipe[];
  currentIndex: number;
  isGenerating: boolean;

  // 操作
  setStep: (step: AppState['step']) => void;
  setImage: (file: File, preview: string) => void;
  setIngredients: (ingredients: Ingredient[]) => void;
  addIngredient: (name: string) => void;
  removeIngredient: (index: number) => void;
  setRecipes: (recipes: Recipe[]) => void;
  nextCard: () => void;
  reset: () => void;
}
```

### useFavoriteStore (收藏状态)

```typescript
interface FavoriteState {
  favorites: Recipe[];

  addFavorite: (recipe: Recipe) => void;
  removeFavorite: (recipeId: string) => void;
  isFavorite: (recipeId: string) => boolean;
  clearFavorites: () => void;
}
```

---

## 路由设计

本项目采用 **单页面多步骤** 模式，不使用 React Router。

通过 `step` 状态控制页面切换：

```typescript
function App() {
  const step = useAppStore(state => state.step);

  return (
    <div className="app">
      <Header />
      {step === 'upload' && <UploadPage />}
      {step === 'ingredients' && <IngredientsPage />}
      {step === 'loading' && <LoadingPage />}
      {step === 'swipe' && <SwipePage />}
      {step === 'result' && <ResultPage />}
    </div>
  );
}
```

---

## API 集成

### API 服务封装

```typescript
// services/api.ts
const API_BASE = '/api';

export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}
```

### 服务函数

| 服务 | 函数 | 参数 | 返回 |
|------|------|------|------|
| uploadService | `uploadImage(file)` | File | `{ url: string }` |
| recognizeService | `recognizeIngredients(imageUrl)` | string | `Ingredient[]` |
| recipeService | `generateRecipes(ingredients)` | Ingredient[] | `Recipe[]` |
| favoriteService | `saveFavorite(recipe)` | Recipe | `void` |
| favoriteService | `getFavorites()` | - | `Recipe[]` |
| favoriteService | `deleteFavorite(id)` | string | `void` |

---

## 自检清单

- [x] 项目结构已规划
- [x] 组件划分清晰
- [x] 状态管理已设计
- [x] API 集成方案已定义
- [x] 技术栈已确定

---

**文档状态**: 待确认
**创建时间**: 2026-01-19
**版本**: 1.0

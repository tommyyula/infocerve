# 滑动页面规格 (Swipe Page)

## 页面概述

Tinder 风格的食谱卡片滑动选择页面，核心交互页面。

## 线框图

```
┌─────────────────────────────────┐
│  🍳 冰箱食谱              ❤️   │
├─────────────────────────────────┤
│                                 │
│   ┌─────────────────────────┐   │
│   │  ┌───────────────────┐  │   │
│   │  │                   │  │   │  ← 背景卡片
│   │  │       🍳          │  │   │
│   │  │                   │  │   │
│   │  ├───────────────────┤  │   │
│   │  │  番茄炒蛋          │  │   │  ← 前景卡片
│   │  │  ⏱️ 15分钟  📊 简单 │  │   │
│   │  │                   │  │   │
│   │  │  经典家常菜...     │  │   │
│   │  └───────────────────┘  │   │
│   └─────────────────────────┘   │
│                                 │
│        ┌───┐      ┌───┐        │
│        │ ✕ │      │ ❤️│        │  ← 操作按钮
│        └───┘      └───┘        │
│                                 │
└─────────────────────────────────┘
```

## 组件结构

```
SwipePage
├── CardsContainer
│   └── SwipeableCard (× n, 堆叠)
│       └── RecipeCard
│           ├── CardImage
│           └── CardContent
└── SwipeButtons
    ├── SkipButton
    └── LikeButton
```

## 组件规格

### SwipeableCard

| 属性 | 类型 | 说明 |
|------|------|------|
| recipe | `Recipe` | 食谱数据 |
| onSwipe | `(direction: 'left' \| 'right') => void` | 滑动回调 |
| onClick | `() => void` | 点击查看详情 |
| isTop | `boolean` | 是否为顶部卡片 |

**手势配置** (使用 @use-gesture/react):

```typescript
const bind = useDrag(({ movement: [mx], velocity: [vx], direction: [dx], cancel }) => {
  // 滑动阈值：移动距离 > 100px 或 速度 > 0.5
  if (Math.abs(mx) > 100 || Math.abs(vx) > 0.5) {
    const direction = dx > 0 ? 'right' : 'left';
    onSwipe(direction);
    cancel();
  }
});
```

### RecipeCard

| 属性 | 类型 | 说明 |
|------|------|------|
| recipe | `Recipe` | 食谱数据 |
| onClick | `() => void` | 点击回调 |

### SwipeButtons

| 属性 | 类型 | 说明 |
|------|------|------|
| onSkip | `() => void` | 跳过回调 |
| onLike | `() => void` | 喜欢回调 |
| disabled | `boolean` | 是否禁用 |

## 状态

```typescript
const recipes = useAppStore(state => state.recipes);
const currentIndex = useAppStore(state => state.currentIndex);
const nextCard = useAppStore(state => state.nextCard);
const setStep = useAppStore(state => state.setStep);

const addFavorite = useFavoriteStore(state => state.addFavorite);

// 详情弹窗
const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
```

## 交互流程

```
1. 显示食谱卡片堆叠
   ↓
2. 用户滑动或点击按钮
   ├── 左滑/点击 ✕ → 跳过，显示下一张
   └── 右滑/点击 ❤️ → 收藏，显示下一张
   ↓
3. 点击卡片 → 显示详情弹窗
   ↓
4. 所有卡片滑完 → 跳转结果页
```

## 事件处理

```typescript
const handleSwipe = (direction: 'left' | 'right') => {
  const currentRecipe = recipes[currentIndex];

  if (direction === 'right') {
    addFavorite(currentRecipe);
    // 可选：保存到服务器
    saveFavorite(currentRecipe);
  }

  nextCard();

  // 检查是否全部完成
  if (currentIndex + 1 >= recipes.length) {
    setStep('result');
  }
};

const handleCardClick = (recipe: Recipe) => {
  setSelectedRecipe(recipe);
};
```

## 动画规格

### 卡片滑动动画 (framer-motion)

```typescript
const cardVariants = {
  enter: { scale: 0.95, y: 20 },
  center: { scale: 1, y: 0, x: 0, rotate: 0 },
  exitLeft: { x: -300, rotate: -30, opacity: 0 },
  exitRight: { x: 300, rotate: 30, opacity: 0 },
};
```

### 卡片堆叠效果

- 第一张：z-index: 3, scale: 1
- 第二张：z-index: 2, scale: 0.95, y: 10px
- 第三张：z-index: 1, scale: 0.9, y: 20px

## 样式要点

- 卡片：白底，大圆角，阴影
- 图片区：渐变背景 + emoji 图标
- 按钮：圆形，大尺寸便于点击
- 跳过按钮：白底红字
- 喜欢按钮：绿色渐变

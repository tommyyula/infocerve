# 结果页面规格 (Result Page)

## 页面概述

展示用户收藏的食谱列表，支持查看详情和重新开始。

## 线框图

```
┌─────────────────────────────────┐
│  🍳 冰箱食谱              ❤️   │
├─────────────────────────────────┤
│                                 │
│  🎉 选择完成！                  │
│  你收藏了以下食谱：              │
│                                 │
│  ┌─────────────────────────┐   │
│  │ 🍳 │ 番茄炒蛋            │   │
│  │    │ ⏱️ 15分钟 · 简单    │   │  ← 收藏列表项
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ 🥚 │ 青椒炒蛋            │   │
│  │    │ ⏱️ 12分钟 · 简单    │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ 🍲 │ 番茄蛋汤            │   │
│  │    │ ⏱️ 20分钟 · 简单    │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │       重新开始           │   │  ← 重置按钮
│  └─────────────────────────┘   │
│                                 │
└─────────────────────────────────┘
```

## 组件结构

```
ResultPage
├── PageHeader
│   ├── Title (🎉 选择完成！)
│   └── Subtitle
├── RecipeList
│   └── RecipeListItem (× n)
│       ├── RecipeIcon
│       └── RecipeInfo
├── EmptyState (条件渲染)
└── Button (重新开始)
```

## 组件规格

### RecipeListItem

| 属性 | 类型 | 说明 |
|------|------|------|
| recipe | `Recipe` | 食谱数据 |
| onClick | `() => void` | 点击查看详情 |

### EmptyState

当没有收藏任何食谱时显示：

```
┌─────────────────────────────────┐
│                                 │
│             😅                  │
│                                 │
│      没有收藏任何食谱           │
│      试试多右滑几个吧！         │
│                                 │
└─────────────────────────────────┘
```

## 状态

```typescript
const favorites = useFavoriteStore(state => state.favorites);
const clearFavorites = useFavoriteStore(state => state.clearFavorites);
const reset = useAppStore(state => state.reset);

// 详情弹窗
const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
```

## 交互流程

```
1. 显示收藏的食谱列表
   ↓
2. 点击列表项 → 显示详情弹窗
   ↓
3. 点击「重新开始」
   ↓
4. 重置状态，跳转上传页
```

## 事件处理

```typescript
const handleItemClick = (recipe: Recipe) => {
  setSelectedRecipe(recipe);
};

const handleRestart = () => {
  reset();          // 重置应用状态
  clearFavorites(); // 清空本次收藏（可选）
};
```

## 样式要点

- 列表项：白底圆角卡片，带阴影
- 左侧图标：渐变背景圆角方形
- 点击反馈：scale 缩小效果
- 空状态：居中显示，灰色文字

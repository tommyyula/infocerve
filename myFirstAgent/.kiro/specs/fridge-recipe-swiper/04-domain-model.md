# 阶段 4: 领域建模 (Domain Model)

## 实体关系图

```
┌─────────────────┐       ┌─────────────────┐
│   UploadSession │       │    Ingredient   │
│─────────────────│       │─────────────────│
│ id              │       │ id              │
│ imageUrl        │──1:N──│ name            │
│ status          │       │ quantity        │
│ createdAt       │       │ confidence      │
└─────────────────┘       └─────────────────┘
        │
        │ 1:N
        ▼
┌─────────────────┐       ┌─────────────────┐
│     Recipe      │       │  RecipeStep     │
│─────────────────│       │─────────────────│
│ id              │       │ stepNumber      │
│ name            │──1:N──│ instruction     │
│ description     │       │                 │
│ cookingTime     │       └─────────────────┘
│ difficulty      │
│ ingredients[]   │
└─────────────────┘
        │
        │ N:1
        ▼
┌─────────────────┐
│    Favorite     │
│─────────────────│
│ id              │
│ recipeId        │
│ userId          │
│ createdAt       │
└─────────────────┘
```

---

## 实体 (Entities)

### 1. UploadSession（上传会话）

**定义**: 代表用户一次上传食材照片并获取食谱推荐的完整会话。

```typescript
interface UploadSession {
  id: string;                    // 唯一标识 (UUID)
  imageUrl: string;              // 上传图片的临时 URL
  status: SessionStatus;         // 会话状态
  ingredients: Ingredient[];     // 识别出的食材
  recipes: Recipe[];             // 生成的食谱
  createdAt: Date;               // 创建时间
  updatedAt: Date;               // 更新时间
}

type SessionStatus =
  | 'uploading'      // 上传中
  | 'recognizing'    // 识别中
  | 'confirmed'      // 食材已确认
  | 'generating'     // 生成食谱中
  | 'completed'      // 完成
  | 'error';         // 错误
```

**业务规则**:
- 会话创建后 24 小时自动过期
- 图片 URL 为临时存储，过期后删除

---

### 2. Recipe（食谱）

**定义**: 代表一个可以烹饪的菜谱。

```typescript
interface Recipe {
  id: string;                    // 唯一标识 (UUID)
  name: string;                  // 菜名
  description: string;           // 简短描述
  ingredients: RecipeIngredient[]; // 所需食材
  steps: RecipeStep[];           // 烹饪步骤
  cookingTime: number;           // 烹饪时间（分钟）
  difficulty: Difficulty;        // 难度等级
  tags: string[];                // 标签（如：快手菜、家常菜）
  createdAt: Date;               // 创建时间
}

type Difficulty = 'easy' | 'medium' | 'hard';
```

**业务规则**:
- 食谱名称不能为空
- 必须包含至少一个步骤
- 烹饪时间必须大于 0

---

### 3. Favorite（收藏）

**定义**: 代表用户收藏的食谱记录。

```typescript
interface Favorite {
  id: string;                    // 唯一标识 (UUID)
  userId: string;                // 用户标识（简化版用设备 ID）
  recipeId: string;              // 食谱 ID
  recipe: Recipe;                // 食谱详情（冗余存储）
  createdAt: Date;               // 收藏时间
}
```

**业务规则**:
- 同一用户不能重复收藏同一食谱
- 收藏记录永久保存

---

## 值对象 (Value Objects)

### 1. Ingredient（食材）

**定义**: 代表识别出的食材，无唯一标识，按值比较。

```typescript
interface Ingredient {
  name: string;                  // 食材名称
  quantity?: string;             // 数量描述（可选）
  confidence?: number;           // AI 识别置信度 (0-1)
}
```

**不变性**:
- 一旦创建，属性不可修改
- 相同 name 视为相同食材

---

### 2. RecipeIngredient（食谱食材）

**定义**: 食谱中所需的食材及用量。

```typescript
interface RecipeIngredient {
  name: string;                  // 食材名称
  amount: string;                // 用量（如：200g, 2个, 适量）
  optional: boolean;             // 是否可选
}
```

---

### 3. RecipeStep（烹饪步骤）

**定义**: 食谱中的单个烹饪步骤。

```typescript
interface RecipeStep {
  stepNumber: number;            // 步骤序号
  instruction: string;           // 步骤说明
  duration?: number;             // 预计时长（分钟）
  tips?: string;                 // 小贴士
}
```

---

### 4. SwipeAction（滑动动作）

**定义**: 用户对食谱卡片的滑动操作。

```typescript
interface SwipeAction {
  direction: 'left' | 'right';   // 滑动方向
  recipeId: string;              // 被滑动的食谱
  timestamp: Date;               // 操作时间
}
```

**语义**:
- `left`: 跳过/不喜欢
- `right`: 喜欢/收藏

---

## 聚合 (Aggregates)

### 1. 上传会话聚合 (Upload Session Aggregate)

**聚合根**: `UploadSession`

**包含**:
- UploadSession (聚合根)
- Ingredient[] (值对象集合)
- Recipe[] (实体集合)

**不变式**:
- 会话状态必须按顺序流转
- 只有 `confirmed` 状态才能生成食谱
- 只有 `completed` 状态才能进行滑动选择

```
uploading → recognizing → confirmed → generating → completed
     ↓           ↓            ↓            ↓
   error       error        error        error
```

---

### 2. 收藏聚合 (Favorite Aggregate)

**聚合根**: `Favorite`

**包含**:
- Favorite (聚合根)
- Recipe (嵌入的实体)

**不变式**:
- 每个用户对每个食谱只能有一条收藏记录

---

## 领域服务 (Domain Services)

### 1. IngredientRecognitionService（食材识别服务）

**职责**: 调用 AI 识别图片中的食材

```typescript
interface IngredientRecognitionService {
  recognize(imageUrl: string): Promise<Ingredient[]>;
}
```

**实现细节**:
- 调用 Gemini Vision API
- 解析 AI 返回的文本，提取食材列表
- 标准化食材名称

---

### 2. RecipeGenerationService（食谱生成服务）

**职责**: 基于食材生成食谱推荐

```typescript
interface RecipeGenerationService {
  generate(ingredients: Ingredient[], count?: number): Promise<Recipe[]>;
}
```

**实现细节**:
- 调用 Gemini API
- 提示词包含食材列表
- 要求返回结构化 JSON
- 默认生成 5 个食谱

---

### 3. ImageUploadService（图片上传服务）

**职责**: 处理图片上传和存储

```typescript
interface ImageUploadService {
  upload(file: File): Promise<string>;  // 返回图片 URL
  compress(file: File): Promise<File>;  // 压缩图片
}
```

---

## 仓储接口 (Repository Interfaces)

### 1. SessionRepository

```typescript
interface SessionRepository {
  save(session: UploadSession): Promise<void>;
  findById(id: string): Promise<UploadSession | null>;
  delete(id: string): Promise<void>;
}
```

### 2. FavoriteRepository

```typescript
interface FavoriteRepository {
  save(favorite: Favorite): Promise<void>;
  findByUserId(userId: string): Promise<Favorite[]>;
  findByUserAndRecipe(userId: string, recipeId: string): Promise<Favorite | null>;
  delete(id: string): Promise<void>;
}
```

---

## 自检清单

- [x] 实体已定义（含属性和业务规则）
- [x] 值对象已定义（含不变性说明）
- [x] 聚合已划分（含聚合根和不变式）
- [x] 领域服务已定义
- [x] 仓储接口已定义
- [x] 实体关系图已绘制

---

**文档状态**: 待确认
**创建时间**: 2026-01-19
**版本**: 1.0

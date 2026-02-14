# 阶段 7: 技术设计 (Design)

## 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                          Vercel                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    React Frontend                         │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────┐  │   │
│  │  │ Upload  │→ │Ingredient│→ │  Swipe  │→ │   Result    │  │   │
│  │  │  Page   │  │  Page   │  │  Page   │  │    Page     │  │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────────┘  │   │
│  │                     │                                     │   │
│  │                     ▼                                     │   │
│  │              ┌─────────────┐                              │   │
│  │              │   Zustand   │                              │   │
│  │              │   Stores    │                              │   │
│  │              └─────────────┘                              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              │ fetch                             │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Vercel Serverless Functions                  │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │   │
│  │  │ /upload  │  │/recognize│  │/generate │  │/favorites│  │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                    │                │                            │
│                    ▼                ▼                            │
│  ┌─────────────────────┐  ┌─────────────────────────────────┐   │
│  │    Vercel Blob      │  │         Vercel KV               │   │
│  │  (临时图片存储)      │  │    (收藏/历史记录)              │   │
│  └─────────────────────┘  └─────────────────────────────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              ▼
                    ┌─────────────────┐
                    │  Google Gemini  │
                    │      API        │
                    └─────────────────┘
```

---

## API 详细设计

### POST /api/upload

**功能**: 上传食材图片

**请求**:
```typescript
// Content-Type: multipart/form-data
{
  image: File  // 图片文件
}
```

**响应**:
```typescript
{
  success: true,
  data: {
    url: string,      // 图片 URL
    sessionId: string // 会话 ID
  }
}
```

**实现逻辑**:
```typescript
// api/upload.ts
import { put } from '@vercel/blob';

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('image') as File;

  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    return Response.json({ error: 'Invalid file type' }, { status: 400 });
  }

  // 验证文件大小 (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    return Response.json({ error: 'File too large' }, { status: 400 });
  }

  // 上传到 Vercel Blob
  const blob = await put(`ingredients/${Date.now()}.jpg`, file, {
    access: 'public',
    addRandomSuffix: true,
  });

  const sessionId = crypto.randomUUID();

  return Response.json({
    success: true,
    data: { url: blob.url, sessionId }
  });
}
```

---

### POST /api/recognize

**功能**: AI 识别食材

**请求**:
```typescript
{
  imageUrl: string,
  sessionId: string
}
```

**响应**:
```typescript
{
  success: true,
  data: {
    ingredients: Ingredient[]
  }
}
```

**Gemini Prompt 设计**:
```typescript
const RECOGNITION_PROMPT = `
你是一个专业的食材识别助手。请分析这张图片，识别其中的食材。

要求：
1. 只识别可用于烹饪的食材
2. 忽略餐具、容器、背景物品
3. 使用中文名称
4. 返回 JSON 格式

返回格式：
{
  "ingredients": [
    { "name": "食材名称", "confidence": 0.95 },
    ...
  ]
}

注意：confidence 为置信度，范围 0-1。
`;
```

**实现逻辑**:
```typescript
// api/recognize.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: Request) {
  const { imageUrl, sessionId } = await request.json();

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  // 获取图片数据
  const imageResponse = await fetch(imageUrl);
  const imageBuffer = await imageResponse.arrayBuffer();
  const base64Image = Buffer.from(imageBuffer).toString('base64');

  const result = await model.generateContent([
    RECOGNITION_PROMPT,
    {
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64Image,
      },
    },
  ]);

  const text = result.response.text();
  const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, ''));

  return Response.json({
    success: true,
    data: { ingredients: parsed.ingredients }
  });
}
```

---

### POST /api/generate-recipes

**功能**: 生成食谱推荐

**请求**:
```typescript
{
  ingredients: Ingredient[],
  count?: number  // 默认 5
}
```

**响应**:
```typescript
{
  success: true,
  data: {
    recipes: Recipe[]
  }
}
```

**Gemini Prompt 设计**:
```typescript
const RECIPE_PROMPT = (ingredients: string[], count: number) => `
你是一个专业的中餐厨师。根据用户提供的食材，推荐 ${count} 道可以烹饪的菜品。

用户现有食材：${ingredients.join('、')}

要求：
1. 尽量只使用用户现有的食材
2. 可以假设用户有基础调味料（盐、糖、酱油、醋、油）
3. 优先推荐家常菜
4. 步骤要详细清晰
5. 返回 JSON 格式

返回格式：
{
  "recipes": [
    {
      "id": "uuid",
      "name": "菜名",
      "description": "一句话描述",
      "ingredients": [
        { "name": "食材名", "amount": "用量" }
      ],
      "steps": ["步骤1", "步骤2", ...],
      "cookingTime": 15,
      "difficulty": "easy"
    }
  ]
}

difficulty 可选值：easy, medium, hard
cookingTime 单位：分钟
`;
```

**实现逻辑**:
```typescript
// api/generate-recipes.ts
export async function POST(request: Request) {
  const { ingredients, count = 5 } = await request.json();

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const ingredientNames = ingredients.map((i: Ingredient) => i.name);
  const prompt = RECIPE_PROMPT(ingredientNames, count);

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, ''));

  // 添加 UUID
  parsed.recipes = parsed.recipes.map((r: Recipe) => ({
    ...r,
    id: crypto.randomUUID(),
  }));

  return Response.json({
    success: true,
    data: { recipes: parsed.recipes }
  });
}
```

---

### POST /api/favorites

**功能**: 保存收藏

**请求**:
```typescript
{
  userId: string,
  recipe: Recipe
}
```

**响应**:
```typescript
{
  success: true,
  data: {
    id: string
  }
}
```

---

### GET /api/favorites

**功能**: 获取收藏列表

**请求**:
```
GET /api/favorites?userId=xxx
```

**响应**:
```typescript
{
  success: true,
  data: {
    favorites: Favorite[]
  }
}
```

---

### DELETE /api/favorites/:id

**功能**: 删除收藏

**响应**:
```typescript
{
  success: true
}
```

---

## 错误处理设计

### 错误码定义

| 错误码 | 说明 | HTTP 状态 |
|--------|------|-----------|
| INVALID_FILE_TYPE | 文件类型不支持 | 400 |
| FILE_TOO_LARGE | 文件过大 | 400 |
| RECOGNITION_FAILED | 食材识别失败 | 500 |
| GENERATION_FAILED | 食谱生成失败 | 500 |
| NOT_FOUND | 资源不存在 | 404 |
| INTERNAL_ERROR | 内部错误 | 500 |

### 错误响应格式

```typescript
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: any
  }
}
```

### 前端错误处理

```typescript
// services/api.ts
export async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`/api${endpoint}`, options);
    const data = await response.json();

    if (!data.success) {
      throw new ApiError(data.error.code, data.error.message);
    }

    return data.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('NETWORK_ERROR', '网络连接失败，请检查网络');
  }
}
```

---

## 安全设计

### API Key 保护

```typescript
// 环境变量（仅服务端可访问）
GEMINI_API_KEY=xxx
KV_REST_API_URL=xxx
KV_REST_API_TOKEN=xxx
BLOB_READ_WRITE_TOKEN=xxx
```

### 输入验证

```typescript
// 使用 zod 进行验证
import { z } from 'zod';

const uploadSchema = z.object({
  image: z.instanceof(File)
    .refine(f => f.size <= 10 * 1024 * 1024, 'File too large')
    .refine(f => f.type.startsWith('image/'), 'Invalid file type'),
});
```

### Rate Limiting

```typescript
// 使用 Vercel Edge Config 或 KV 实现
const RATE_LIMIT = {
  recognize: { max: 10, window: '1m' },
  generate: { max: 5, window: '1m' },
};
```

---

## 部署配置

### vercel.json

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "regions": ["hkg1"],
  "functions": {
    "api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

### 环境变量配置

| 变量名 | 说明 | 必须 |
|--------|------|------|
| GEMINI_API_KEY | Gemini API 密钥 | ✅ |
| KV_REST_API_URL | Vercel KV URL | ✅ |
| KV_REST_API_TOKEN | Vercel KV Token | ✅ |
| BLOB_READ_WRITE_TOKEN | Vercel Blob Token | ✅ |

---

## 自检清单

- [x] 系统架构图已绘制
- [x] API 接口已详细设计
- [x] Gemini Prompt 已设计
- [x] 错误处理已规划
- [x] 安全措施已考虑
- [x] 部署配置已定义

---

**文档状态**: 待确认
**创建时间**: 2026-01-19
**版本**: 1.0

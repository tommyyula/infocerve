# 阶段 11: API 测试用例 (API Test Cases)

## 测试框架

- **测试框架**: Vitest
- **HTTP Mock**: msw (Mock Service Worker)
- **运行环境**: Node.js

---

## API 接口列表

| 接口 | 方法 | 路径 | 优先级 |
|------|------|------|--------|
| 上传图片 | POST | /api/upload | P0 |
| 识别食材 | POST | /api/recognize | P0 |
| 生成食谱 | POST | /api/generate-recipes | P0 |
| 保存收藏 | POST | /api/favorites | P1 |
| 获取收藏 | GET | /api/favorites | P1 |
| 删除收藏 | DELETE | /api/favorites/:id | P1 |

---

## API-001: POST /api/upload

### API-001-1: 成功上传图片

```typescript
// api/__tests__/upload.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../upload';

// Mock Vercel Blob
vi.mock('@vercel/blob', () => ({
  put: vi.fn().mockResolvedValue({
    url: 'https://blob.vercel-storage.com/test-image.jpg',
  }),
}));

describe('POST /api/upload', () => {
  it('should upload image successfully', async () => {
    const formData = new FormData();
    const file = new File(['image content'], 'test.jpg', { type: 'image/jpeg' });
    formData.append('image', file);

    const request = new Request('http://localhost/api/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.url).toContain('blob.vercel-storage.com');
    expect(data.data.sessionId).toBeDefined();
  });
});
```

### API-001-2: 拒绝非图片文件

```typescript
it('should reject non-image files', async () => {
  const formData = new FormData();
  const file = new File(['pdf content'], 'test.pdf', { type: 'application/pdf' });
  formData.append('image', file);

  const request = new Request('http://localhost/api/upload', {
    method: 'POST',
    body: formData,
  });

  const response = await POST(request);
  const data = await response.json();

  expect(response.status).toBe(400);
  expect(data.success).toBe(false);
  expect(data.error.code).toBe('INVALID_FILE_TYPE');
});
```

### API-001-3: 拒绝过大文件

```typescript
it('should reject files larger than 10MB', async () => {
  const formData = new FormData();
  // Create a file > 10MB
  const largeContent = new Array(11 * 1024 * 1024).fill('x').join('');
  const file = new File([largeContent], 'large.jpg', { type: 'image/jpeg' });
  formData.append('image', file);

  const request = new Request('http://localhost/api/upload', {
    method: 'POST',
    body: formData,
  });

  const response = await POST(request);
  const data = await response.json();

  expect(response.status).toBe(400);
  expect(data.success).toBe(false);
  expect(data.error.code).toBe('FILE_TOO_LARGE');
});
```

### API-001-4: 缺少文件参数

```typescript
it('should return error when no file provided', async () => {
  const formData = new FormData();

  const request = new Request('http://localhost/api/upload', {
    method: 'POST',
    body: formData,
  });

  const response = await POST(request);
  const data = await response.json();

  expect(response.status).toBe(400);
  expect(data.error.code).toBe('MISSING_FILE');
});
```

---

## API-002: POST /api/recognize

### API-002-1: 成功识别食材

```typescript
// api/__tests__/recognize.test.ts
import { describe, it, expect, vi } from 'vitest';
import { POST } from '../recognize';

// Mock Gemini API
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: () => ({
      generateContent: vi.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            ingredients: [
              { name: '番茄', confidence: 0.95 },
              { name: '鸡蛋', confidence: 0.92 },
            ],
          }),
        },
      }),
    }),
  })),
}));

describe('POST /api/recognize', () => {
  it('should recognize ingredients from image', async () => {
    const request = new Request('http://localhost/api/recognize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageUrl: 'https://example.com/image.jpg',
        sessionId: 'test-session',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.ingredients).toHaveLength(2);
    expect(data.data.ingredients[0].name).toBe('番茄');
  });
});
```

### API-002-2: 缺少参数

```typescript
it('should return error when imageUrl is missing', async () => {
  const request = new Request('http://localhost/api/recognize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId: 'test' }),
  });

  const response = await POST(request);
  const data = await response.json();

  expect(response.status).toBe(400);
  expect(data.error.code).toBe('MISSING_PARAMETER');
});
```

### API-002-3: Gemini API 错误处理

```typescript
it('should handle Gemini API errors', async () => {
  // Mock Gemini to throw error
  vi.mocked(genAI.getGenerativeModel).mockImplementationOnce(() => ({
    generateContent: vi.fn().mockRejectedValue(new Error('API Error')),
  }));

  const request = new Request('http://localhost/api/recognize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageUrl: 'https://example.com/image.jpg',
      sessionId: 'test',
    }),
  });

  const response = await POST(request);
  const data = await response.json();

  expect(response.status).toBe(500);
  expect(data.error.code).toBe('RECOGNITION_FAILED');
});
```

---

## API-003: POST /api/generate-recipes

### API-003-1: 成功生成食谱

```typescript
// api/__tests__/generate-recipes.test.ts
describe('POST /api/generate-recipes', () => {
  it('should generate recipes from ingredients', async () => {
    const request = new Request('http://localhost/api/generate-recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ingredients: [{ name: '番茄' }, { name: '鸡蛋' }],
        count: 3,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.recipes).toHaveLength(3);
    expect(data.data.recipes[0]).toHaveProperty('id');
    expect(data.data.recipes[0]).toHaveProperty('name');
    expect(data.data.recipes[0]).toHaveProperty('steps');
  });
});
```

### API-003-2: 空食材列表

```typescript
it('should return error for empty ingredients', async () => {
  const request = new Request('http://localhost/api/generate-recipes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ingredients: [] }),
  });

  const response = await POST(request);
  const data = await response.json();

  expect(response.status).toBe(400);
  expect(data.error.code).toBe('EMPTY_INGREDIENTS');
});
```

### API-003-3: 默认数量

```typescript
it('should use default count of 5 when not specified', async () => {
  const request = new Request('http://localhost/api/generate-recipes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ingredients: [{ name: '番茄' }],
    }),
  });

  const response = await POST(request);
  const data = await response.json();

  expect(data.data.recipes).toHaveLength(5);
});
```

---

## API-004: POST /api/favorites

### API-004-1: 成功保存收藏

```typescript
// api/__tests__/favorites.test.ts
import { describe, it, expect, vi } from 'vitest';
import { POST, GET, DELETE } from '../favorites';

// Mock Vercel KV
vi.mock('@vercel/kv', () => ({
  kv: {
    set: vi.fn().mockResolvedValue('OK'),
    get: vi.fn(),
    del: vi.fn().mockResolvedValue(1),
    sadd: vi.fn().mockResolvedValue(1),
    smembers: vi.fn().mockResolvedValue([]),
    srem: vi.fn().mockResolvedValue(1),
  },
}));

describe('POST /api/favorites', () => {
  it('should save favorite successfully', async () => {
    const request = new Request('http://localhost/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'user-123',
        recipe: {
          id: 'recipe-1',
          name: '番茄炒蛋',
          steps: ['步骤1'],
          ingredients: [],
          cookingTime: 15,
          difficulty: 'easy',
        },
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.id).toBeDefined();
  });
});
```

### API-004-2: 缺少必要参数

```typescript
it('should return error when userId is missing', async () => {
  const request = new Request('http://localhost/api/favorites', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipe: { id: '1', name: 'Test' },
    }),
  });

  const response = await POST(request);
  const data = await response.json();

  expect(response.status).toBe(400);
  expect(data.error.code).toBe('MISSING_PARAMETER');
});
```

---

## API-005: GET /api/favorites

### API-005-1: 获取收藏列表

```typescript
describe('GET /api/favorites', () => {
  it('should return user favorites', async () => {
    // Mock KV to return favorites
    vi.mocked(kv.smembers).mockResolvedValue(['fav-1', 'fav-2']);
    vi.mocked(kv.get).mockImplementation((key) => {
      if (key === 'favorite:fav-1') {
        return Promise.resolve({
          id: 'fav-1',
          userId: 'user-123',
          recipe: { id: 'r1', name: '番茄炒蛋' },
        });
      }
      if (key === 'favorite:fav-2') {
        return Promise.resolve({
          id: 'fav-2',
          userId: 'user-123',
          recipe: { id: 'r2', name: '青椒炒蛋' },
        });
      }
      return Promise.resolve(null);
    });

    const request = new Request('http://localhost/api/favorites?userId=user-123');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.favorites).toHaveLength(2);
  });
});
```

### API-005-2: 空收藏列表

```typescript
it('should return empty array when no favorites', async () => {
  vi.mocked(kv.smembers).mockResolvedValue([]);

  const request = new Request('http://localhost/api/favorites?userId=user-456');

  const response = await GET(request);
  const data = await response.json();

  expect(response.status).toBe(200);
  expect(data.data.favorites).toEqual([]);
});
```

---

## API-006: DELETE /api/favorites/:id

### API-006-1: 成功删除收藏

```typescript
describe('DELETE /api/favorites/:id', () => {
  it('should delete favorite successfully', async () => {
    vi.mocked(kv.get).mockResolvedValue({
      id: 'fav-1',
      userId: 'user-123',
      recipe: { id: 'r1' },
    });

    const request = new Request('http://localhost/api/favorites/fav-1', {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: { id: 'fav-1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
```

### API-006-2: 删除不存在的收藏

```typescript
it('should return 404 when favorite not found', async () => {
  vi.mocked(kv.get).mockResolvedValue(null);

  const request = new Request('http://localhost/api/favorites/not-exist', {
    method: 'DELETE',
  });

  const response = await DELETE(request, { params: { id: 'not-exist' } });
  const data = await response.json();

  expect(response.status).toBe(404);
  expect(data.error.code).toBe('NOT_FOUND');
});
```

---

## 集成测试 (可选)

### 真实 API 调用测试

```typescript
// 仅在 CI 环境或手动触发时运行
describe.skip('Integration Tests', () => {
  it('should complete full flow with real APIs', async () => {
    // 1. Upload image
    // 2. Recognize ingredients
    // 3. Generate recipes
    // 4. Save favorite
    // 5. Get favorites
    // 6. Delete favorite
  });
});
```

---

## 自检清单

- [x] 所有 API 端点测试用例已设计
- [x] 成功场景已覆盖
- [x] 错误场景已覆盖
- [x] 边界条件已考虑
- [x] Mock 策略已定义

---

**文档状态**: 待确认
**创建时间**: 2026-01-19
**版本**: 1.0

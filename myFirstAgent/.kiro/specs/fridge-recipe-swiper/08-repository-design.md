# 阶段 8: 仓储设计 (Repository Design)

## 存储方案

### 存储服务选型

| 数据类型 | 存储服务 | 说明 |
|----------|----------|------|
| 图片文件 | Vercel Blob | 临时存储，24h 过期 |
| 用户收藏 | Vercel KV | 持久化存储 |
| 会话数据 | Vercel KV | 临时存储，24h 过期 |

---

## Vercel KV 数据结构

### Key 命名规范

```
{namespace}:{entity}:{id}
```

| 命名空间 | 说明 |
|----------|------|
| `session` | 上传会话 |
| `favorite` | 用户收藏 |
| `user` | 用户索引 |

### 数据模型

#### 1. 会话数据 (Session)

**Key**: `session:{sessionId}`
**Type**: Hash
**TTL**: 24 hours

```typescript
{
  id: string,
  imageUrl: string,
  status: 'uploading' | 'recognizing' | 'confirmed' | 'generating' | 'completed' | 'error',
  ingredients: string,  // JSON 序列化
  recipes: string,      // JSON 序列化
  createdAt: number,    // Unix timestamp
  updatedAt: number
}
```

#### 2. 收藏数据 (Favorite)

**Key**: `favorite:{favoriteId}`
**Type**: Hash
**TTL**: 无（永久）

```typescript
{
  id: string,
  userId: string,
  recipeId: string,
  recipe: string,       // JSON 序列化
  createdAt: number
}
```

#### 3. 用户收藏索引

**Key**: `user:{userId}:favorites`
**Type**: Set
**Value**: favoriteId 集合

```
{ "fav_001", "fav_002", "fav_003" }
```

---

## 仓储实现

### 基础 KV 客户端

```typescript
// lib/kv.ts
import { kv } from '@vercel/kv';

export { kv };

// 辅助函数
export async function kvGetJson<T>(key: string): Promise<T | null> {
  const data = await kv.get(key);
  return data as T | null;
}

export async function kvSetJson<T>(
  key: string,
  value: T,
  options?: { ex?: number }
): Promise<void> {
  await kv.set(key, value, options);
}
```

### SessionRepository

```typescript
// repositories/sessionRepository.ts
import { kv, kvGetJson, kvSetJson } from '@/lib/kv';

const SESSION_TTL = 24 * 60 * 60; // 24 hours

export interface Session {
  id: string;
  imageUrl: string;
  status: string;
  ingredients: Ingredient[];
  recipes: Recipe[];
  createdAt: number;
  updatedAt: number;
}

export const sessionRepository = {
  async create(imageUrl: string): Promise<Session> {
    const session: Session = {
      id: crypto.randomUUID(),
      imageUrl,
      status: 'uploading',
      ingredients: [],
      recipes: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await kvSetJson(`session:${session.id}`, session, { ex: SESSION_TTL });
    return session;
  },

  async findById(id: string): Promise<Session | null> {
    return kvGetJson<Session>(`session:${id}`);
  },

  async update(id: string, data: Partial<Session>): Promise<Session | null> {
    const session = await this.findById(id);
    if (!session) return null;

    const updated = {
      ...session,
      ...data,
      updatedAt: Date.now(),
    };

    await kvSetJson(`session:${id}`, updated, { ex: SESSION_TTL });
    return updated;
  },

  async updateStatus(id: string, status: Session['status']): Promise<void> {
    await this.update(id, { status });
  },

  async setIngredients(id: string, ingredients: Ingredient[]): Promise<void> {
    await this.update(id, { ingredients, status: 'confirmed' });
  },

  async setRecipes(id: string, recipes: Recipe[]): Promise<void> {
    await this.update(id, { recipes, status: 'completed' });
  },

  async delete(id: string): Promise<void> {
    await kv.del(`session:${id}`);
  },
};
```

### FavoriteRepository

```typescript
// repositories/favoriteRepository.ts
import { kv, kvGetJson, kvSetJson } from '@/lib/kv';

export interface Favorite {
  id: string;
  userId: string;
  recipeId: string;
  recipe: Recipe;
  createdAt: number;
}

export const favoriteRepository = {
  async create(userId: string, recipe: Recipe): Promise<Favorite> {
    // 检查是否已收藏
    const existing = await this.findByUserAndRecipe(userId, recipe.id);
    if (existing) return existing;

    const favorite: Favorite = {
      id: crypto.randomUUID(),
      userId,
      recipeId: recipe.id,
      recipe,
      createdAt: Date.now(),
    };

    // 保存收藏数据
    await kvSetJson(`favorite:${favorite.id}`, favorite);

    // 添加到用户索引
    await kv.sadd(`user:${userId}:favorites`, favorite.id);

    return favorite;
  },

  async findById(id: string): Promise<Favorite | null> {
    return kvGetJson<Favorite>(`favorite:${id}`);
  },

  async findByUserId(userId: string): Promise<Favorite[]> {
    // 获取用户的所有收藏 ID
    const favoriteIds = await kv.smembers(`user:${userId}:favorites`);

    if (!favoriteIds || favoriteIds.length === 0) {
      return [];
    }

    // 批量获取收藏数据
    const favorites = await Promise.all(
      favoriteIds.map(id => this.findById(id as string))
    );

    return favorites
      .filter((f): f is Favorite => f !== null)
      .sort((a, b) => b.createdAt - a.createdAt);
  },

  async findByUserAndRecipe(userId: string, recipeId: string): Promise<Favorite | null> {
    const favorites = await this.findByUserId(userId);
    return favorites.find(f => f.recipeId === recipeId) || null;
  },

  async delete(id: string): Promise<void> {
    const favorite = await this.findById(id);
    if (!favorite) return;

    // 从用户索引中移除
    await kv.srem(`user:${favorite.userId}:favorites`, id);

    // 删除收藏数据
    await kv.del(`favorite:${id}`);
  },

  async deleteByUserAndRecipe(userId: string, recipeId: string): Promise<void> {
    const favorite = await this.findByUserAndRecipe(userId, recipeId);
    if (favorite) {
      await this.delete(favorite.id);
    }
  },

  async countByUser(userId: string): Promise<number> {
    return await kv.scard(`user:${userId}:favorites`) || 0;
  },
};
```

---

## Vercel Blob 图片存储

### BlobRepository

```typescript
// repositories/blobRepository.ts
import { put, del, list } from '@vercel/blob';

const BLOB_TTL = 24 * 60 * 60 * 1000; // 24 hours in ms

export const blobRepository = {
  async uploadImage(file: File): Promise<string> {
    const filename = `ingredients/${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: true,
    });

    return blob.url;
  },

  async deleteImage(url: string): Promise<void> {
    try {
      await del(url);
    } catch (error) {
      console.error('Failed to delete blob:', error);
    }
  },

  // 清理过期图片（可用 Cron Job 定期执行）
  async cleanupExpired(): Promise<number> {
    const { blobs } = await list({ prefix: 'ingredients/' });
    const now = Date.now();
    let deletedCount = 0;

    for (const blob of blobs) {
      const uploadedAt = new Date(blob.uploadedAt).getTime();
      if (now - uploadedAt > BLOB_TTL) {
        await del(blob.url);
        deletedCount++;
      }
    }

    return deletedCount;
  },
};
```

---

## 用户标识策略

由于 MVP 不实现用户系统，使用客户端生成的 UUID 作为用户标识：

```typescript
// utils/userId.ts
const USER_ID_KEY = 'fridge_recipe_user_id';

export function getUserId(): string {
  if (typeof window === 'undefined') {
    return 'anonymous';
  }

  let userId = localStorage.getItem(USER_ID_KEY);

  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem(USER_ID_KEY, userId);
  }

  return userId;
}
```

---

## 数据访问模式

### 读取模式

| 操作 | 复杂度 | 说明 |
|------|--------|------|
| 获取单个会话 | O(1) | 直接 key 访问 |
| 获取单个收藏 | O(1) | 直接 key 访问 |
| 获取用户收藏列表 | O(n) | 先获取索引，再批量获取 |

### 写入模式

| 操作 | 复杂度 | 说明 |
|------|--------|------|
| 创建会话 | O(1) | 单次写入 |
| 更新会话 | O(1) | 读取 + 写入 |
| 创建收藏 | O(n) | 检查重复 + 写入 + 更新索引 |
| 删除收藏 | O(1) | 删除数据 + 更新索引 |

---

## 自检清单

- [x] 存储方案已确定
- [x] Key 命名规范已定义
- [x] 数据模型已设计
- [x] Repository 接口已定义
- [x] 用户标识策略已确定
- [x] 数据访问模式已分析

---

**文档状态**: 待确认
**创建时间**: 2026-01-19
**版本**: 1.0

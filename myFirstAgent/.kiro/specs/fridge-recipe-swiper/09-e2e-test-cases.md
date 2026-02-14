# 阶段 9: E2E 测试用例 (E2E Test Cases)

## 测试框架

- **工具**: Playwright
- **浏览器**: Chromium, WebKit (移动端模拟)
- **运行环境**: CI/CD + 本地

---

## 测试场景概览

| 场景 | 优先级 | 说明 |
|------|--------|------|
| 完整用户流程 | P0 | 上传→识别→生成→滑动→结果 |
| 图片上传 | P0 | 上传功能正常 |
| 食材编辑 | P1 | 增删食材 |
| 滑动交互 | P0 | 左滑右滑功能 |
| 收藏功能 | P1 | 收藏持久化 |
| 错误处理 | P1 | 异常情况处理 |
| 响应式布局 | P2 | 移动端适配 |

---

## E2E-001: 完整用户流程（Happy Path）

### 测试目的
验证用户从上传图片到获得食谱推荐的完整流程

### 前置条件
- 应用已部署并可访问
- Gemini API 正常工作

### 测试步骤

```typescript
test('完整用户流程', async ({ page }) => {
  // 1. 访问首页
  await page.goto('/');
  await expect(page.getByText('冰箱食谱')).toBeVisible();

  // 2. 上传图片
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles('tests/fixtures/fridge.jpg');

  // 3. 等待图片预览
  await expect(page.locator('.upload-area img')).toBeVisible();

  // 4. 点击开始识别
  await page.getByRole('button', { name: '开始识别食材' }).click();

  // 5. 等待识别完成
  await expect(page.getByText('识别结果')).toBeVisible({ timeout: 15000 });

  // 6. 验证食材列表不为空
  const ingredients = page.locator('.ingredient-tag');
  await expect(ingredients.first()).toBeVisible();

  // 7. 点击生成食谱
  await page.getByRole('button', { name: '生成食谱推荐' }).click();

  // 8. 等待食谱生成
  await expect(page.locator('.recipe-card')).toBeVisible({ timeout: 20000 });

  // 9. 右滑收藏第一个食谱
  const card = page.locator('.recipe-card').first();
  await card.dragTo(card, {
    sourcePosition: { x: 150, y: 200 },
    targetPosition: { x: 400, y: 200 },
  });

  // 10. 左滑跳过剩余食谱
  for (let i = 0; i < 4; i++) {
    const nextCard = page.locator('.recipe-card').first();
    if (await nextCard.isVisible()) {
      await page.getByRole('button', { name: '✕' }).click();
      await page.waitForTimeout(500);
    }
  }

  // 11. 验证结果页面
  await expect(page.getByText('选择完成')).toBeVisible();
  await expect(page.locator('.result-item')).toHaveCount(1);
});
```

### 预期结果
- 所有步骤顺利完成
- 收藏的食谱显示在结果页

---

## E2E-002: 图片上传功能

### E2E-002-1: 从相册选择图片

```typescript
test('从相册选择图片', async ({ page }) => {
  await page.goto('/');

  // 选择图片
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles('tests/fixtures/fridge.jpg');

  // 验证预览显示
  await expect(page.locator('.upload-area img')).toBeVisible();

  // 验证按钮激活
  await expect(page.getByRole('button', { name: '开始识别食材' })).toBeEnabled();
});
```

### E2E-002-2: 上传大文件提示

```typescript
test('上传大文件显示提示', async ({ page }) => {
  await page.goto('/');

  // 模拟大文件上传
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles('tests/fixtures/large-image.jpg'); // >10MB

  // 验证错误提示
  await expect(page.getByText('文件过大')).toBeVisible();
});
```

### E2E-002-3: 上传非图片文件

```typescript
test('上传非图片文件显示提示', async ({ page }) => {
  await page.goto('/');

  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles('tests/fixtures/document.pdf');

  await expect(page.getByText('请选择图片文件')).toBeVisible();
});
```

---

## E2E-003: 食材编辑功能

### E2E-003-1: 删除食材

```typescript
test('删除识别出的食材', async ({ page }) => {
  // ... 上传并识别图片

  // 记录初始食材数量
  const initialCount = await page.locator('.ingredient-tag').count();

  // 点击第一个食材的删除按钮
  await page.locator('.ingredient-tag .remove').first().click();

  // 验证食材数量减少
  await expect(page.locator('.ingredient-tag')).toHaveCount(initialCount - 1);
});
```

### E2E-003-2: 添加食材

```typescript
test('手动添加食材', async ({ page }) => {
  // ... 上传并识别图片

  const initialCount = await page.locator('.ingredient-tag').count();

  // 输入新食材
  await page.getByPlaceholder('添加其他食材').fill('豆腐');
  await page.getByRole('button', { name: '添加' }).click();

  // 验证食材添加成功
  await expect(page.locator('.ingredient-tag')).toHaveCount(initialCount + 1);
  await expect(page.getByText('豆腐')).toBeVisible();
});
```

---

## E2E-004: 滑动交互功能

### E2E-004-1: 左滑跳过

```typescript
test('左滑跳过食谱', async ({ page }) => {
  // ... 到达滑动页面

  const cardName = await page.locator('.recipe-card h3').first().textContent();

  // 点击跳过按钮
  await page.getByRole('button', { name: '✕' }).click();
  await page.waitForTimeout(500);

  // 验证卡片已切换
  const newCardName = await page.locator('.recipe-card h3').first().textContent();
  expect(newCardName).not.toBe(cardName);
});
```

### E2E-004-2: 右滑收藏

```typescript
test('右滑收藏食谱', async ({ page }) => {
  // ... 到达滑动页面

  const cardName = await page.locator('.recipe-card h3').first().textContent();

  // 点击喜欢按钮
  await page.getByRole('button', { name: '❤️' }).click();
  await page.waitForTimeout(500);

  // 完成所有滑动后检查收藏
  // ... 滑完所有卡片

  await expect(page.getByText(cardName!)).toBeVisible();
});
```

### E2E-004-3: 点击查看详情

```typescript
test('点击卡片查看食谱详情', async ({ page }) => {
  // ... 到达滑动页面

  // 点击卡片
  await page.locator('.recipe-card').first().click();

  // 验证详情弹窗
  await expect(page.locator('.modal')).toBeVisible();
  await expect(page.getByText('烹饪步骤')).toBeVisible();

  // 关闭弹窗
  await page.locator('.modal-close').click();
  await expect(page.locator('.modal')).not.toBeVisible();
});
```

---

## E2E-005: 收藏功能

### E2E-005-1: 收藏持久化

```typescript
test('收藏在刷新后保留', async ({ page }) => {
  // ... 收藏一个食谱并完成流程

  // 记录收藏的食谱名
  const recipeName = await page.locator('.result-item h4').first().textContent();

  // 刷新页面
  await page.reload();

  // 点击收藏按钮
  await page.locator('.favorites-btn').click();

  // 验证收藏仍存在
  await expect(page.getByText(recipeName!)).toBeVisible();
});
```

---

## E2E-006: 错误处理

### E2E-006-1: 网络错误处理

```typescript
test('网络错误时显示提示', async ({ page }) => {
  await page.goto('/');

  // 模拟网络断开
  await page.route('**/api/**', route => route.abort());

  // 上传图片并点击识别
  // ...

  // 验证错误提示
  await expect(page.getByText('网络连接失败')).toBeVisible();
});
```

### E2E-006-2: AI 识别失败处理

```typescript
test('AI 识别失败时显示重试', async ({ page }) => {
  await page.goto('/');

  // 模拟 API 返回错误
  await page.route('**/api/recognize', route =>
    route.fulfill({ status: 500, body: JSON.stringify({ error: 'AI Error' }) })
  );

  // ... 上传并点击识别

  await expect(page.getByText('识别失败')).toBeVisible();
  await expect(page.getByRole('button', { name: '重试' })).toBeVisible();
});
```

---

## E2E-007: 响应式布局

### E2E-007-1: 移动端布局

```typescript
test('移动端布局正确', async ({ page }) => {
  // 设置移动端视口
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');

  // 验证元素可见且布局正确
  await expect(page.locator('.upload-area')).toBeVisible();
  await expect(page.locator('.header')).toBeVisible();

  // 验证按钮可点击
  const uploadArea = page.locator('.upload-area');
  const box = await uploadArea.boundingBox();
  expect(box?.width).toBeLessThanOrEqual(375);
});
```

---

## 测试数据准备

### fixtures 目录结构

```
tests/
├── fixtures/
│   ├── fridge.jpg           # 正常食材图片
│   ├── empty-fridge.jpg     # 空冰箱图片
│   ├── large-image.jpg      # 大文件 (>10MB)
│   └── document.pdf         # 非图片文件
└── e2e/
    ├── upload.spec.ts
    ├── ingredients.spec.ts
    ├── swipe.spec.ts
    └── full-flow.spec.ts
```

---

## 自检清单

- [x] 完整用户流程测试已设计
- [x] 核心功能测试用例已覆盖
- [x] 错误处理测试已包含
- [x] 响应式测试已考虑
- [x] 测试数据需求已列出

---

**文档状态**: 待确认
**创建时间**: 2026-01-19
**版本**: 1.0

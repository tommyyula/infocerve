import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesPath = path.join(__dirname, '../fixtures');

const mockRecipes = [
  {
    id: '1',
    name: '番茄炒蛋',
    description: '经典家常菜，简单美味',
    ingredients: [
      { name: '番茄', amount: '2个' },
      { name: '鸡蛋', amount: '3个' },
    ],
    steps: ['打散鸡蛋', '切番茄', '炒蛋', '加番茄翻炒', '调味出锅'],
    cookingTime: 15,
    difficulty: 'easy',
  },
  {
    id: '2',
    name: '青椒炒蛋',
    description: '清淡可口的家常菜',
    ingredients: [
      { name: '青椒', amount: '2个' },
      { name: '鸡蛋', amount: '3个' },
    ],
    steps: ['打散鸡蛋', '切青椒', '炒蛋', '加青椒翻炒'],
    cookingTime: 12,
    difficulty: 'easy',
  },
  {
    id: '3',
    name: '番茄蛋汤',
    description: '清爽开胃的汤品',
    ingredients: [
      { name: '番茄', amount: '1个' },
      { name: '鸡蛋', amount: '2个' },
    ],
    steps: ['番茄切块', '烧开水', '下番茄', '淋入蛋液'],
    cookingTime: 10,
    difficulty: 'easy',
  },
  {
    id: '4',
    name: '蛋炒饭',
    description: '简单快手的主食',
    ingredients: [
      { name: '米饭', amount: '1碗' },
      { name: '鸡蛋', amount: '2个' },
    ],
    steps: ['打散鸡蛋', '热油炒蛋', '加米饭翻炒', '调味出锅'],
    cookingTime: 10,
    difficulty: 'easy',
  },
  {
    id: '5',
    name: '西红柿鸡蛋面',
    description: '暖心暖胃的汤面',
    ingredients: [
      { name: '番茄', amount: '1个' },
      { name: '鸡蛋', amount: '1个' },
      { name: '面条', amount: '100g' },
    ],
    steps: ['番茄切块', '煮面条', '炒番茄', '加汤煮', '打入鸡蛋'],
    cookingTime: 20,
    difficulty: 'medium',
  },
];

test.describe('Complete User Flow', () => {
  test('happy path: upload -> recognize -> edit -> generate -> swipe -> result', async ({
    page,
  }) => {
    // Set up API mocks
    await page.route('**/api/recognize', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ingredients: [
            { name: '番茄', confidence: 0.95 },
            { name: '鸡蛋', confidence: 0.9 },
            { name: '青椒', confidence: 0.85 },
          ],
        }),
      });
    });

    await page.route('**/api/generate', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ recipes: mockRecipes }),
      });
    });

    // Step 1: Visit home page
    await page.goto('/');
    await expect(page.getByText('上传冰箱照片')).toBeVisible();
    await expect(page.getByText('冰箱食谱')).toBeVisible();

    // Step 2: Upload image
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(fixturesPath, 'test-image.png'));

    // Step 3: Verify preview
    await expect(page.locator('img')).toBeVisible();
    await expect(page.getByText('识别食材')).toBeVisible();

    // Step 4: Start recognition
    await page.getByText('识别食材').click();

    // Step 5: Wait for recognition (loading state may be too fast to catch with mocked API)
    await expect(page.getByText('确认食材')).toBeVisible({ timeout: 15000 });

    // Step 6: Verify ingredients displayed
    await expect(page.getByText('番茄')).toBeVisible();
    await expect(page.getByText('鸡蛋')).toBeVisible();
    await expect(page.getByText('青椒')).toBeVisible();

    // Step 7: Add a custom ingredient
    const addInput = page.getByPlaceholder('添加食材...');
    await addInput.fill('米饭');
    await addInput.press('Enter');
    await expect(page.getByText('米饭')).toBeVisible();

    // Step 8: Generate recipes
    await page.getByText('生成食谱').click();

    // Step 9: Wait for recipe generation (loading state may be too fast to catch)
    await expect(page.getByText('左滑跳过，右滑收藏')).toBeVisible({
      timeout: 20000,
    });

    // Step 10: Verify recipe cards
    await expect(page.getByText('番茄炒蛋')).toBeVisible();
    await expect(page.getByText('1 / 5')).toBeVisible();

    // Step 11: Favorite first recipe (番茄炒蛋)
    await page.locator('button:has-text("❤️")').nth(1).click();
    await page.waitForTimeout(500);

    // Step 12: Skip second recipe (青椒炒蛋)
    await page.locator('button:has-text("❌")').click();
    await page.waitForTimeout(500);

    // Step 13: View detail of third recipe and then favorite
    await page.getByText('番茄蛋汤').click();
    await expect(page.getByText('番茄切块')).toBeVisible();
    await page.locator('.fixed button:has-text("×")').click();
    await page.locator('button:has-text("❤️")').nth(1).click();
    await page.waitForTimeout(500);

    // Step 14: Skip remaining recipes
    await page.locator('button:has-text("❌")').click();
    await page.waitForTimeout(500);
    await page.locator('button:has-text("❌")').click();
    await page.waitForTimeout(500);

    // Step 15: Verify result page
    await expect(page.getByText('完成')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('你收藏了 2 个食谱')).toBeVisible();

    // Step 16: Verify favorited recipes are shown
    await expect(page.getByText('番茄炒蛋')).toBeVisible();
    await expect(page.getByText('番茄蛋汤')).toBeVisible();

    // Skipped recipes should not be visible
    await expect(page.getByText('青椒炒蛋')).not.toBeVisible();
    await expect(page.getByText('蛋炒饭')).not.toBeVisible();

    // Step 17: Start new search
    await page.getByText('开始新的搜索').click();
    await expect(page.getByText('上传冰箱照片')).toBeVisible();
  });

  test('favorites persist after navigation', async ({ page }) => {
    // Set up API mocks
    await page.route('**/api/recognize', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ingredients: [{ name: '番茄', confidence: 0.95 }],
        }),
      });
    });

    await page.route('**/api/generate', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ recipes: [mockRecipes[0]] }),
      });
    });

    await page.goto('/');

    // Complete flow with one favorite
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(fixturesPath, 'test-image.png'));

    await page.getByText('识别食材').click();
    await expect(page.getByText('确认食材')).toBeVisible({ timeout: 15000 });

    await page.getByText('生成食谱').click();
    await expect(page.getByText('左滑跳过，右滑收藏')).toBeVisible({
      timeout: 20000,
    });

    // Favorite the recipe
    await page.locator('button:has-text("❤️")').nth(1).click();
    await page.waitForTimeout(500);

    // Should be on result page
    await expect(page.getByText('完成')).toBeVisible({ timeout: 5000 });

    // Click favorites header button
    await page.getByText('❤️').first().click();

    // Should see favorites page with the favorited recipe
    await expect(page.getByText('我的收藏')).toBeVisible();
    await expect(page.getByText('共 1 个食谱')).toBeVisible();
    await expect(page.getByText('番茄炒蛋')).toBeVisible();
  });

  test('can clear favorites', async ({ page }) => {
    // Set up API mocks
    await page.route('**/api/recognize', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ingredients: [{ name: '番茄', confidence: 0.95 }],
        }),
      });
    });

    await page.route('**/api/generate', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ recipes: [mockRecipes[0], mockRecipes[1]] }),
      });
    });

    await page.goto('/');

    // Complete flow with favorites
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(fixturesPath, 'test-image.png'));

    await page.getByText('识别食材').click();
    await expect(page.getByText('确认食材')).toBeVisible({ timeout: 15000 });

    await page.getByText('生成食谱').click();
    await expect(page.getByText('左滑跳过，右滑收藏')).toBeVisible({
      timeout: 20000,
    });

    // Favorite both recipes
    await page.locator('button:has-text("❤️")').nth(1).click();
    await page.waitForTimeout(500);
    await page.locator('button:has-text("❤️")').nth(1).click();
    await page.waitForTimeout(500);

    // Go to favorites
    await page.getByText('❤️').first().click();
    await expect(page.getByText('我的收藏')).toBeVisible();
    await expect(page.getByText('共 2 个食谱')).toBeVisible();

    // Clear favorites
    await page.getByText('清空收藏').click();

    // Should show 0 favorites
    await expect(page.getByText('共 0 个食谱')).toBeVisible();
  });
});

test.describe('Error Handling', () => {
  test('should handle network error gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/recognize', async (route) => {
      await route.abort('failed');
    });

    await page.goto('/');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(fixturesPath, 'test-image.png'));

    await page.getByText('识别食材').click();

    // Should show error message (English "Failed to fetch" or similar)
    await expect(
      page.getByText(/Failed|Error|失败|错误/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test('should handle API error gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/recognize', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Internal Server Error' }),
      });
    });

    await page.goto('/');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(fixturesPath, 'test-image.png'));

    await page.getByText('识别食材').click();

    // Should show error and return to upload page
    await expect(page.getByText('上传冰箱照片')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.route('**/api/recognize', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ingredients: [{ name: '番茄', confidence: 0.95 }],
        }),
      });
    });

    await page.goto('/');

    // Header should be visible
    await expect(page.getByText('冰箱食谱')).toBeVisible();

    // Upload area should fit
    const uploadArea = page.locator('.flex-1').first();
    const box = await uploadArea.boundingBox();
    expect(box?.width).toBeLessThanOrEqual(375);
  });

  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto('/');

    await expect(page.getByText('上传冰箱照片')).toBeVisible();
  });
});

import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesPath = path.join(__dirname, '../fixtures');

// Helper to navigate to ingredients page with mocked API
async function navigateToIngredientsPage(page: import('@playwright/test').Page) {
  // Mock the recognize API
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

  await page.goto('/');

  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(path.join(fixturesPath, 'test-image.png'));

  await page.getByText('识别食材').click();

  // Wait for ingredients page
  await expect(page.getByText('确认食材')).toBeVisible({ timeout: 10000 });
}

test.describe('Ingredients Page', () => {
  test('should display recognized ingredients', async ({ page }) => {
    await navigateToIngredientsPage(page);

    await expect(page.getByText('番茄')).toBeVisible();
    await expect(page.getByText('鸡蛋')).toBeVisible();
    await expect(page.getByText('青椒')).toBeVisible();
  });

  test('should allow removing ingredients', async ({ page }) => {
    await navigateToIngredientsPage(page);

    // Count initial ingredients
    const ingredientTags = page.locator('button:has-text("×")');
    const initialCount = await ingredientTags.count();
    expect(initialCount).toBe(3);

    // Remove first ingredient (番茄)
    await ingredientTags.first().click();

    // Verify count decreased
    await expect(ingredientTags).toHaveCount(2);

    // Verify 番茄 is removed
    await expect(page.getByText('番茄')).not.toBeVisible();
  });

  test('should allow adding ingredients manually', async ({ page }) => {
    await navigateToIngredientsPage(page);

    // Find the add ingredient input
    const addInput = page.getByPlaceholder('添加食材...');
    await addInput.fill('豆腐');

    // Click add button or press Enter
    await addInput.press('Enter');

    // Verify new ingredient is added
    await expect(page.getByText('豆腐')).toBeVisible();
  });

  test('should not add empty ingredient', async ({ page }) => {
    await navigateToIngredientsPage(page);

    const ingredientTags = page.locator('button:has-text("×")');
    const initialCount = await ingredientTags.count();

    // Try to add empty ingredient
    const addInput = page.getByPlaceholder('添加食材...');
    await addInput.fill('   ');
    await addInput.press('Enter');

    // Count should remain the same
    await expect(ingredientTags).toHaveCount(initialCount);
  });

  test('should navigate back to upload page', async ({ page }) => {
    await navigateToIngredientsPage(page);

    // Click back button
    await page.getByText('返回上传').click();

    // Should be back on upload page
    await expect(page.getByText('上传冰箱照片')).toBeVisible();
  });

  test('should proceed to recipe generation', async ({ page }) => {
    // Mock both APIs
    await page.route('**/api/recognize', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ingredients: [
            { name: '番茄', confidence: 0.95 },
            { name: '鸡蛋', confidence: 0.9 },
          ],
        }),
      });
    });

    await page.route('**/api/generate', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          recipes: [
            {
              id: '1',
              name: '番茄炒蛋',
              description: '经典家常菜',
              ingredients: [
                { name: '番茄', amount: '2个' },
                { name: '鸡蛋', amount: '3个' },
              ],
              steps: ['打散鸡蛋', '切番茄', '炒蛋', '加番茄翻炒'],
              cookingTime: 15,
              difficulty: 'easy',
            },
          ],
        }),
      });
    });

    await page.goto('/');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(fixturesPath, 'test-image.png'));

    await page.getByText('识别食材').click();
    await expect(page.getByText('确认食材')).toBeVisible({ timeout: 10000 });

    // Click generate recipes button
    await page.getByText('生成食谱').click();

    // Should show loading state
    await expect(page.getByText('正在生成美味食谱')).toBeVisible();

    // Should navigate to swipe page
    await expect(page.getByText('左滑跳过，右滑收藏')).toBeVisible({
      timeout: 15000,
    });
  });

  test('should disable generate button when no ingredients', async ({
    page,
  }) => {
    await navigateToIngredientsPage(page);

    // Remove all ingredients
    const removeButtons = page.locator('button:has-text("×")');
    const count = await removeButtons.count();

    for (let i = 0; i < count; i++) {
      await removeButtons.first().click();
      await page.waitForTimeout(100);
    }

    // Generate button should be disabled
    const generateButton = page.getByText('生成食谱');
    await expect(generateButton).toBeDisabled();
  });
});

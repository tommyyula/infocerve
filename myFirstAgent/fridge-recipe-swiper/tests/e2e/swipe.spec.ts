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
];

// Helper to navigate to swipe page with mocked APIs
async function navigateToSwipePage(page: import('@playwright/test').Page) {
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

  // Mock the generate API
  await page.route('**/api/generate', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ recipes: mockRecipes }),
    });
  });

  await page.goto('/');

  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(path.join(fixturesPath, 'test-image.png'));

  await page.getByText('识别食材').click();
  await expect(page.getByText('确认食材')).toBeVisible({ timeout: 10000 });

  await page.getByText('生成食谱').click();
  await expect(page.getByText('左滑跳过，右滑收藏')).toBeVisible({
    timeout: 15000,
  });
}

test.describe('Swipe Page', () => {
  test('should display recipe cards', async ({ page }) => {
    await navigateToSwipePage(page);

    // First recipe card should be visible
    await expect(page.getByText('番茄炒蛋')).toBeVisible();

    // Progress indicator should show
    await expect(page.getByText('1 / 3')).toBeVisible();
  });

  test('should skip recipe when clicking skip button', async ({ page }) => {
    await navigateToSwipePage(page);

    // Verify first card
    await expect(page.getByText('番茄炒蛋')).toBeVisible();
    await expect(page.getByText('1 / 3')).toBeVisible();

    // Click skip button
    await page.locator('button:has-text("❌")').click();
    await page.waitForTimeout(500);

    // Should show next card
    await expect(page.getByText('青椒炒蛋')).toBeVisible();
    await expect(page.getByText('2 / 3')).toBeVisible();
  });

  test('should favorite recipe when clicking heart button', async ({
    page,
  }) => {
    await navigateToSwipePage(page);

    // Verify first card
    await expect(page.getByText('番茄炒蛋')).toBeVisible();

    // Click heart button to favorite
    await page.locator('button:has-text("❤️")').nth(1).click();
    await page.waitForTimeout(500);

    // Should show next card
    await expect(page.getByText('青椒炒蛋')).toBeVisible();
  });

  test('should show recipe detail when clicking card', async ({ page }) => {
    await navigateToSwipePage(page);

    // Click on the recipe card (not the buttons)
    await page.getByText('番茄炒蛋').click();

    // Modal should appear with recipe details
    await expect(page.getByText('打散鸡蛋')).toBeVisible();
    await expect(page.getByText('切番茄')).toBeVisible();

    // Close modal
    await page.locator('button:has-text("×")').first().click();

    // Modal should be closed, back to swipe page
    await expect(page.getByText('左滑跳过，右滑收藏')).toBeVisible();
  });

  test('should navigate to result page after all cards', async ({ page }) => {
    await navigateToSwipePage(page);

    // Favorite first recipe
    await page.locator('button:has-text("❤️")').nth(1).click();
    await page.waitForTimeout(300);

    // Skip second recipe
    await page.locator('button:has-text("❌")').click();
    await page.waitForTimeout(300);

    // Favorite third recipe
    await page.locator('button:has-text("❤️")').nth(1).click();
    await page.waitForTimeout(300);

    // Should be on result page
    await expect(page.getByText('完成')).toBeVisible({ timeout: 5000 });

    // Should show favorited recipes
    await expect(page.getByText('番茄炒蛋')).toBeVisible();
    await expect(page.getByText('番茄蛋汤')).toBeVisible();

    // Skipped recipe should not be visible
    await expect(page.getByText('青椒炒蛋')).not.toBeVisible();
  });

  test('should show completion message when no favorites', async ({ page }) => {
    await navigateToSwipePage(page);

    // Skip all recipes
    for (let i = 0; i < 3; i++) {
      await page.locator('button:has-text("❌")').click();
      await page.waitForTimeout(300);
    }

    // Should be on result page
    await expect(page.getByText('完成')).toBeVisible({ timeout: 5000 });

    // Should show 0 favorites
    await expect(page.getByText('你收藏了 0 个食谱')).toBeVisible();
  });
});

test.describe('Swipe Page - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should work on mobile viewport', async ({ page }) => {
    await navigateToSwipePage(page);

    // Recipe card should be visible
    await expect(page.getByText('番茄炒蛋')).toBeVisible();

    // Swipe buttons should be visible (use nth(1) to skip header heart button)
    await expect(page.locator('button:has-text("❌")')).toBeVisible();
    await expect(page.locator('button:has-text("❤️")').nth(1)).toBeVisible();
  });
});

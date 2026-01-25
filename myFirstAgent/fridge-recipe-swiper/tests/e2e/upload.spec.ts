import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesPath = path.join(__dirname, '../fixtures');

test.describe('Image Upload', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display upload page on initial load', async ({ page }) => {
    await expect(page.getByText('上传冰箱照片')).toBeVisible();
    await expect(page.locator('input[type="file"]')).toBeAttached();
  });

  test('should show image preview after selecting file', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');

    await fileInput.setInputFiles(path.join(fixturesPath, 'test-image.png'));

    // Wait for preview to appear
    await expect(page.locator('img')).toBeVisible();

    // Verify the recognize button is visible
    await expect(page.getByText('识别食材')).toBeVisible();
  });

  test('should allow clearing selected image', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');

    await fileInput.setInputFiles(path.join(fixturesPath, 'test-image.png'));

    // Wait for preview
    await expect(page.locator('img')).toBeVisible();

    // Click reset button
    await page.getByText('重新上传').click();

    // Verify image is cleared - upload area should be visible again
    await expect(page.getByText('Click to upload or drag & drop')).toBeVisible();
  });

  test('should only accept image files', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    const accept = await fileInput.getAttribute('accept');

    // Verify file input accepts image types
    expect(accept).toContain('image/');
  });
});

test.describe('Upload with API Mock', () => {
  test('should navigate to loading state after clicking recognize', async ({
    page,
  }) => {
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

    // Wait for preview
    await expect(page.locator('img')).toBeVisible();

    // Click recognize button
    await page.getByText('识别食材').click();

    // Should eventually show ingredients page (loading might be too fast to catch)
    await expect(page.getByText('确认食材')).toBeVisible({ timeout: 15000 });

    // Verify ingredients are displayed
    await expect(page.getByText('番茄')).toBeVisible();
    await expect(page.getByText('鸡蛋')).toBeVisible();
    await expect(page.getByText('青椒')).toBeVisible();
  });

  test('should show error message when API fails', async ({ page }) => {
    // Mock API failure
    await page.route('**/api/recognize', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          message: '食材识别失败',
        }),
      });
    });

    await page.goto('/');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(fixturesPath, 'test-image.png'));

    await page.getByText('识别食材').click();

    // Should show error message
    await expect(page.getByText('食材识别失败')).toBeVisible({
      timeout: 10000,
    });
  });
});

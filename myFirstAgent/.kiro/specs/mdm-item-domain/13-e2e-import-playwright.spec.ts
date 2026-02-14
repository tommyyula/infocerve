import { test, expect } from '@playwright/test';

const FILE_APP_URL = process.env.FILE_APP_URL ?? 'http://localhost:8082';
const IMPORT_FILE_PATH =
  process.env.IMPORT_FILE_PATH ??
  'D:/projectRepo/item/wms/wms-lite/wms-lite-backend/item-template.xlsx';
const STORAGE_STATE = process.env.E2E_STORAGE_STATE;

if (STORAGE_STATE) {
  test.use({ storageState: STORAGE_STATE });
}

test.describe('MDM Item Import E2E', () => {
  test('template download should succeed', async ({ request }) => {
    const response = await request.get(`${FILE_APP_URL}/file/template/item-import`, {
      headers: { 'X-Gateway-Request': 'true' },
    });

    expect(response.status()).toBe(200);
    const body = await response.body();
    expect(body.length).toBeGreaterThan(0);
  });

  test('import flow should create item and data should match', async ({ page }) => {
    await page.goto('/item/item/import');
    await page.waitForLoadState('networkidle');

    await page.setInputFiles('input[type=file]', IMPORT_FILE_PATH);

    await expect(page.locator('text=SKU001')).toBeVisible({ timeout: 15000 });

    await page.getByRole('button', { name: 'Import' }).click();
    await expect(page.locator('text=Operation successful')).toBeVisible({ timeout: 15000 });

    await page.goto('/item/item');
    await page.waitForLoadState('networkidle');

    const row = page.locator('.ant-table-tbody tr').filter({ hasText: 'SKU001' }).first();
    await expect(row).toBeVisible();

    await row.locator('a', { hasText: /View|查看/ }).first().click();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=SKU001')).toBeVisible();
    await expect(page.locator('text=Sample Item')).toBeVisible();

    await page.getByRole('tab', { name: /UOM Management|单位管理/ }).click();
    await expect(page.locator('.ant-table')).toContainText('EA');
    await expect(page.locator('.ant-table')).toContainText('cm');
    await expect(page.locator('.ant-table')).toContainText('100 g');
    await expect(page.locator('.ant-table')).toContainText('0.001');
  });
});

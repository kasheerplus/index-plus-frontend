import { test, expect } from '@playwright/test';

test.describe('Index Plus - Deep Scenario Testing', () => {

    test.beforeEach(async ({ page }) => {
        // Navigate to dashboard before each test
        await page.goto('/dashboard/inbox');
    });

    test('Scenario 1: Full Messaging & Sales Flow', async ({ page }) => {
        // 1. Select the seeded test conversation
        await page.getByText(/عميل تجريبي/).first().click();
        await expect(page.getByText(/عبر/)).toBeVisible();

        // 2. Validate Empty State (Seeded message is skipped to avoid crash)
        await expect(page.getByText('لا توجد رسائل بعد')).toBeVisible();

        // 3. Open Convert to Sale Modal
        await page.click('text=تحويل لبيع');
        await expect(page.getByText(/إنشاء طلب جديد/)).toBeVisible();

        // 4. Fill and Submit Sale
        // Using "السعر" based on CreateSaleModal code
        await page.getByLabel(/السعر/).first().fill('150');
        await page.click('button:has-text("تأكيد البيع")');

        // Verify modal closes
        await expect(page.getByText(/إنشاء طلب جديد/)).not.toBeVisible();
    });

    test('Scenario 2: Company Profile Update', async ({ page }) => {
        await page.goto('/dashboard/settings/company');

        const newName = `My Business ${Math.floor(Math.random() * 1000)}`;
        const nameInput = page.getByLabel(/اسم الشركة/);
        await nameInput.clear();
        await nameInput.fill(newName);

        await page.click('button:has-text("حفظ التغييرات")');

        await page.waitForTimeout(1000);
        await page.reload();
        await expect(page.getByLabel(/اسم الشركة/)).toHaveValue(newName);
    });

    test('Scenario 3: Site-wide Plan Visibility', async ({ page }) => {
        // Verify plan badge in sidebar is present on multiple pages
        // The badge has text "الباقة" followed by plan name
        await expect(page.getByText(/الباقة/).first()).toBeVisible();

        await page.goto('/dashboard/sales');
        await expect(page.getByText(/الباقة/).first()).toBeVisible();

        await page.goto('/dashboard/crm');
        await expect(page.getByText(/الباقة/).first()).toBeVisible();
    });

    test('Scenario 4: Form Error Handling (Billing)', async ({ page }) => {
        await page.goto('/dashboard/billing');

        // Button should be disabled initially (no file selected)
        const sendBtn = page.locator('button:has-text("إرسال الإثبات")');
        await expect(sendBtn).toBeDisabled();
    });
});


import { test, expect } from '@playwright/test';

test.describe('Index Plus - Interactive Button Audit', () => {

    test.beforeEach(async ({ page }) => {
        // Shared login state from auth.setup.ts
        await page.goto('/dashboard/inbox');
    });

    test('Audit: CRM Actions', async ({ page }) => {
        await page.goto('/dashboard/crm');

        // 1. Audit "Add Customer" Button
        await test.step('Click Add Customer', async () => {
            const addBtn = page.locator('button:has-text("إضافة عميل")');
            await expect(addBtn).toBeVisible();
            await addBtn.click();

            // Expectation: A modal should open
            // If this fails, the button is "not working"
            await expect(page.getByRole('dialog')).toBeVisible({ timeout: 3000 });
        });
    });

    test('Audit: Team Actions', async ({ page }) => {
        await page.goto('/dashboard/settings/team');

        // 2. Audit "Add Member" Button
        await test.step('Click Add Member', async () => {
            const addBtn = page.locator('button:has-text("إضافة عضو جديد")');
            await expect(addBtn).toBeVisible();
            await addBtn.click();

            // Expectation: A modal/form should open
            await expect(page.getByRole('dialog')).toBeVisible({ timeout: 3000 });
        });
    });

    test('Audit: Channel Actions', async ({ page }) => {
        await page.goto('/dashboard/settings/channels');

        // 3. Audit "Connect Channel" Button (Facebook)
        await test.step('Click Connect Facebook', async () => {
            // Find the connect button inside the Facebook card
            // Assuming the second card is Facebook based on layout, or use text
            const connectBtn = page.locator('button:has-text("ربط الحساب")').first();
            await expect(connectBtn).toBeVisible();
            await connectBtn.click();

            // Expectation: Modal should open
            await expect(page.getByRole('dialog')).toBeVisible({ timeout: 3000 });
        });
    });
});

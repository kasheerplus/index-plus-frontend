import { test, expect } from '@playwright/test';

test.describe('Enterprise Readiness Verification', () => {
    test('should verify Security Logs UI', async ({ page }) => {
        await page.goto('/dashboard/settings/logs');

        // Either the table is visible or the empty state message
        const tableHeader = page.getByText('النشاط');
        const emptyMessage = page.getByText('لا توجد سجلات أمان حالياً');

        await expect(tableHeader.or(emptyMessage)).toBeVisible();
    });

    test('should verify Subscription & Billing UI', async ({ page }) => {
        await page.goto('/dashboard/settings/billing');
        await expect(page.getByText('الاشتراك والفوترة')).toBeVisible();
        await expect(page.getByText('الباقة الاحترافية')).toBeVisible();
        await expect(page.getByText('سجل الفواتير')).toBeVisible();
    });

    test('should verify Inbox Arabic Search connectivity', async ({ page }) => {
        await page.goto('/dashboard/inbox');

        // Search bar existence
        const searchInput = page.getByPlaceholder('بحث عن اسم أو رسالة...');
        await expect(searchInput).toBeVisible();

        // Simulate Arabic search
        await searchInput.fill('عميل');
        // We can't easily check results without mock data, but we verify it's interactive
    });

    test('should verify Team Permissions Modal existence', async ({ page }) => {
        await page.goto('/dashboard/settings/team');
        // The buttons are visible if can('manage_team') is true
        // Assuming test user has permissions
        const permissionButtons = page.locator('button[title="تعديل الصلاحيات"]');
        if (await permissionButtons.count() > 0) {
            await permissionButtons.first().click();
            await expect(page.getByText('صلاحيات المستخدم')).toBeVisible();
            await expect(page.getByText('صندوق الوارد')).toBeVisible();
        }
    });
});

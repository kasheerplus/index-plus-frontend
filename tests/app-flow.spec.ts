import { test, expect } from '@playwright/test';

test.describe('Index Plus Dashboard Flow', () => {
    test('should verify sidebar and inbox', async ({ page }) => {
        await page.goto('/dashboard/inbox');
        await expect(page).toHaveURL(/.*dashboard/);

        // Arabic Sidebar Checks
        const sidebarItems = ['صندوق الرسائل', 'العملاء', 'المبيعات', 'التقارير', 'الإعدادات'];
        for (const item of sidebarItems) {
            await expect(page.getByText(item)).toBeVisible();
        }
    });

    test('should verify CRM page', async ({ page }) => {
        await page.goto('/dashboard/crm');
        await expect(page).toHaveURL(/.*crm/);
        await expect(page.getByText('العملاء', { exact: false }).first()).toBeVisible();
        // Fixed: the text is "إضافة عميل"
        await expect(page.getByText('إضافة عميل')).toBeVisible();
    });

    test('should verify Sales page', async ({ page }) => {
        await page.goto('/dashboard/sales');
        await expect(page).toHaveURL(/.*sales/);
        await expect(page.getByText('سجل المبيعات', { exact: false }).first()).toBeVisible();
    });

    test('should verify Settings - Navigation and Plan', async ({ page }) => {
        await page.goto('/dashboard/settings/channels');

        // Unified Header Tabs
        await expect(page.getByText('إدارة الفريق')).toBeVisible();
        await expect(page.getByText('القنوات')).toBeVisible();
        await expect(page.getByText('بيانات الشركة')).toBeVisible();
        await expect(page.getByText('الاشتراك والفوترة')).toBeVisible();

        // Plan Badge (check for the "أنت على" prefix)
        await expect(page.getByText('أنت على')).toBeVisible();
    });

    test('should verify Company Settings page', async ({ page }) => {
        await page.goto('/dashboard/settings/company');
        await expect(page.getByText('بيانات المؤسسة')).toBeVisible();
        await expect(page.getByText('اسم الشركة / النشاط')).toBeVisible();
        await expect(page.getByText('رابط المنصة الخاص بك')).toBeVisible();

        // Verify the platform link logic
        await expect(page.getByText('https://index-plus.app/track/')).toBeVisible();
    });

    test('should verify Team Settings page', async ({ page }) => {
        await page.goto('/dashboard/settings/team');
        await expect(page.getByText('إضافة عضو جديد')).toBeVisible();
        // Check table headers
        await expect(page.getByText('العضو')).toBeVisible();
        await expect(page.getByText('الصلاحية')).toBeVisible();
    });
});

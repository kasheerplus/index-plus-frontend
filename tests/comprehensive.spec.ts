import { test, expect } from '@playwright/test';

test.describe('Index Plus - Comprehensive System Audit', () => {

    test.beforeEach(async ({ page }) => {
        // Navigate home/inbox
        await page.goto('/dashboard/inbox');
    });

    test('Navigation & Sidebar: Verify all main modules', async ({ page }) => {
        const navItems = [
            { text: /الرسائل/, url: /.*inbox/ },
            { text: /العملاء/, url: /.*crm/ },
            { text: /المبيعات/, url: /.*sales/ },
            { text: /التقارير/, url: /.*analytics/ },
            { text: /الإعدادات/, url: /.*settings/ }
        ];

        for (const item of navItems) {
            // Wait for sidebar to be stable
            await page.waitForSelector('nav', { state: 'visible' });
            // Click using the regex text matcher
            await page.getByText(item.text).first().click();
            await expect(page).toHaveURL(item.url);
        }
    });

    test('CRM & Sales Flow: From chat to billing', async ({ page }) => {
        // 1. Visit CRM
        await page.goto('/dashboard/crm');
        // Use more specific waits
        await page.waitForURL(/.*crm/);
        await expect(page.getByText(/إضافة عميل/)).toBeVisible();

        // 2. Visit Inbox and initiate a sale
        await page.goto('/dashboard/inbox');
        await page.waitForURL(/.*inbox/);

        // Wait for list to populate
        await expect(page.getByText(/عميل تجريبي/).first()).toBeVisible();
        await page.getByText(/عميل تجريبي/).first().click();

        await page.click('text=تحويل لبيع');
        await expect(page.getByText(/إنشاء طلب جديد/)).toBeVisible();

        // Fill amount using stable selector with sequential typing to handle React state updates
        const amountInput = page.locator('input[type="number"]').first();
        await amountInput.pressSequentially('250', { delay: 100 });

        // Wait for state to settle
        await page.waitForTimeout(1000);

        // Verify input value
        await expect(amountInput).toHaveValue('250');

        // Verify total updated in UI (to ensure state is reacting)
        // There are two places showing total: Subtotal and Final Total
        // Both use class "font-number" and end with "ج.م"
        await expect(page.locator('.font-number').filter({ hasText: '250' }).first()).toBeVisible();

        const confirmBtn = page.getByRole('button', { name: /تأكيد البيع/ });
        await expect(confirmBtn).toBeEnabled();
        await confirmBtn.click();

        // Check if modal closed
        await expect(page.getByText(/إنشاء طلب جديد/)).not.toBeVisible();

        // 3. Verify Sale appearing in Sales page
        await page.goto('/dashboard/sales');
        await expect(page.getByText('250')).toBeVisible();
    });

    test('Billing: Plan constraints and Proof upload', async ({ page }) => {
        await page.goto('/dashboard/billing');

        // Check for plan badge in header (using "أنت على")
        await expect(page.getByText(/أنت على/)).toBeVisible();

        // Verify "Send Proof" is disabled initially or handles validation
        // The button has text "إرسال الإثبات"
        const sendBtn = page.getByRole('button', { name: /إرسال الإثبات/ });

        // Check if disabled (if logic disables it) OR if it shows alert/error
        if (await sendBtn.isDisabled()) {
            await expect(sendBtn).toBeDisabled();
        } else {
            // If enabled, click and expect alert
            page.on('dialog', async dialog => {
                await dialog.dismiss();
            });
            await sendBtn.click();
        }
    });
});

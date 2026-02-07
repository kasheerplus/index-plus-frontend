import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
    // 1. Go to login page
    await page.goto('/auth/login');

    // 2. Fill in real test credentials
    await page.fill('input[type="email"]', 'kasheer.plus@gmail.com');
    await page.fill('input[type="password"]', '12345678');

    // 3. Click login
    await page.click('button[type="submit"]');

    // 4. Wait for redirect and ensure dashboard is visible
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
    // Wait for sidebar to be sure
    await page.waitForSelector('nav', { state: 'visible', timeout: 10000 });

    // Wait a bit more for cookies to be fully set in the browser
    await page.waitForTimeout(2000);

    // 5. Save authentication state to disk
    await page.context().storageState({ path: authFile });
});

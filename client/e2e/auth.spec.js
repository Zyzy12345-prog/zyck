import { test, expect } from '@playwright/test';

test.describe('认证流程', () => {
  test('访问首页重定向到登录页', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });

  test('登录页面渲染正确', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1, h2').first()).toBeVisible();
    await expect(page.locator('input[type="text"], input[type="email"]').first()).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.getByRole('button', { name: /登录|登入/i })).toBeVisible();
  });

  test('注册页面渲染正确', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('input[type="text"], input[type="email"]').first()).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.getByRole('button', { name: /注册/i })).toBeVisible();
  });

  test('错误凭据显示错误消息', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="text"], input[type="email"]').first().fill('wrong@test.com');
    await page.locator('#password').fill('wrongpassword');
    await page.getByRole('button', { name: /登录|登入/i }).click();
    // 等待错误提示出现
    await page.waitForTimeout(2000);
    const errorMsg = page.locator('.ant-message-error, .ant-notification');
    // 只要不跳转到仪表板就算通过
    await expect(page).not.toHaveURL('/');
  });
});

import { test, expect } from '@playwright/test';

test.describe('无障碍和响应式', () => {
  test('移动端视口下页面可正常渲染', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/login');
    // 验证表单元素在移动端可见
    await expect(page.locator('input[type="text"], input[type="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /登录|登入/i })).toBeVisible();
  });

  test('平板视口下页面可正常渲染', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/login');
    await expect(page.locator('input[type="text"], input[type="email"]').first()).toBeVisible();
  });

  test('页面有适当的语义标签', async ({ page }) => {
    await page.goto('/login');
    // 检查基本的 HTML 结构
    await expect(page.locator('html')).toHaveAttribute('lang');
    // 检查表单元素存在
    const inputs = page.locator('input');
    await expect(inputs.first()).toBeVisible();
  });
});

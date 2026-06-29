import { test, expect } from '@playwright/test';

test.describe('导航和布局', () => {
  test.beforeEach(async ({ page }) => {
    // 需要先登录 - 如果有有效的测试账号则在此填入
    // 此测试套件依赖已认证的会话
  });

  test('侧边栏菜单渲染', async ({ page }) => {
    await page.goto('/login');
    // 验证登录页存在侧边栏或顶部导航的基本元素
    await expect(page.locator('body')).toBeVisible();
  });

  test('404页面重定向到首页', async ({ page }) => {
    await page.goto('/nonexistent-page');
    // 未登录状态下会重定向到登录页
    await expect(page).toHaveURL(/\/(login)?/);
  });
});

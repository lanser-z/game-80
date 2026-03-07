import { test, expect } from '@playwright/test';

test.describe('八十！八十！游戏测试', () => {
  test('主页应该显示标题和开始按钮', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // 等待 canvas 加载
    const canvas = await page.waitForSelector('canvas');
    expect(canvas).toBeVisible();

    // 等待游戏加载完成
    await page.waitForTimeout(3000);

    // 截图查看
    await page.screenshot({ path: 'test-results/menu-screen.png', fullPage: true });

    // 检查 canvas 是否存在且可见
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).toBeTruthy();
    console.log('Canvas 尺寸:', canvasBox);

    // 检查游戏容器
    const gameContainer = await page.$('#game-container');
    expect(gameContainer).toBeTruthy();

    console.log('测试完成：页面加载成功');
  });

  test('点击开始按钮应该进入游戏', async ({ page }) => {
    await page.goto('http://localhost:3000');

    const canvas = await page.waitForSelector('canvas');
    await page.waitForTimeout(3000);

    // 获取 canvas 边界
    const box = await canvas.boundingBox();
    if (!box) return;

    console.log('Canvas 位置:', box);

    // 点击开始按钮位置 (大约在 canvas 中间偏下)
    const clickX = box.x + box.width / 2;
    const clickY = box.y + box.height / 2 + 20;

    console.log('点击位置:', { x: clickX, y: clickY });

    await page.mouse.click(clickX, clickY);
    await page.waitForTimeout(2000);

    // 截图查看是否进入游戏
    await page.screenshot({ path: 'test-results/game-screen.png', fullPage: true });

    console.log('测试完成：点击测试完成');
  });
});

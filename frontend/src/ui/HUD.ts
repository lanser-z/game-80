import Phaser from 'phaser';
import { BudgetManager } from '../managers/BudgetManager';
import { GAME_CONFIG } from '../config';

/**
 * HUD - 抬头显示
 * 显示预算、关卡信息等 UI 元素
 */
export class HUD extends Phaser.GameObjects.Container {
  private budgetText!: Phaser.GameObjects.Text;
  private budgetBar!: Phaser.GameObjects.Graphics;
  private levelText!: Phaser.GameObjects.Text;
  private hitCountText!: Phaser.GameObjects.Text;

  private currentBudget!: number;

  constructor(scene: Phaser.Scene, budgetManager: BudgetManager) {
    super(scene, 0, 0);

    this.createBackground();
    this.createBudgetDisplay(budgetManager);
    this.createLevelDisplay();
    this.createInfoDisplay();

    scene.add.existing(this);
  }

  private createBackground(): void {
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x000000, 0.5);
    bg.fillRect(0, 0, GAME_CONFIG.width, 60);
    this.add(bg);
  }

  private createBudgetDisplay(budgetManager: BudgetManager): void {
    const margin = 20;

    // 预算标签
    const budgetLabel = this.scene.add.text(margin, 15, '预算：', {
      font: 'bold 18px Arial',
      color: '#ffffff'
    });
    this.add(budgetLabel);

    // 预算数值
    this.currentBudget = budgetManager.getRemainingBudget();
    this.budgetText = this.scene.add.text(margin + 70, 15, `¥${this.currentBudget}`, {
      font: 'bold 20px Arial',
      color: '#00ff00'
    });
    this.add(this.budgetText);

    // 预算条背景
    const barX = margin + 180;
    const barY = 25;
    const barWidth = 200;
    const barHeight = 12;

    const barBg = this.scene.add.graphics();
    barBg.fillStyle(0x333333, 1);
    barBg.fillRoundedRect(barX, barY, barWidth, barHeight, 6);
    this.add(barBg);

    // 预算条
    this.budgetBar = this.scene.add.graphics();
    this.updateBudgetBar(budgetManager);
    this.add(this.budgetBar);

    // 剩余次数
    this.hitCountText = this.scene.add.text(barX + barWidth + 20, 15,
      `可砸：${budgetManager.getRemainingHits()}次`, {
      font: '16px Arial',
      color: '#aaaaff'
    });
    this.add(this.hitCountText);
  }

  private updateBudgetBar(budgetManager: BudgetManager): void {
    const barX = 200;
    const barY = 25;
    const barWidth = 200;
    const barHeight = 12;

    const percent = budgetManager.getRemainingBudget() / budgetManager.getInitialBudget();
    const color = percent > 0.5 ? 0x00ff00 : percent > 0.25 ? 0xffff00 : 0xff0000;

    this.budgetBar.clear();
    this.budgetBar.fillStyle(color, 1);
    this.budgetBar.fillRoundedRect(barX, barY, barWidth * percent, barHeight, 6);
  }

  private createLevelDisplay(): void {
    const x = GAME_CONFIG.width - 150;

    const levelLabel = this.scene.add.text(x, 15, '关卡:', {
      font: 'bold 16px Arial',
      color: '#ffffff'
    });
    this.add(levelLabel);

    // 关卡数从 registry 获取
    const currentLevel = this.scene.registry.get('currentLevel') || 1;
    this.levelText = this.scene.add.text(x + 60, 15, `${currentLevel}`, {
      font: 'bold 20px Arial',
      color: '#ffff00'
    });
    this.add(this.levelText);
  }

  private createInfoDisplay(): void {
    const x = GAME_CONFIG.width / 2 + 100;

    const infoText = this.scene.add.text(x, 15, '砸一下：¥80', {
      font: '14px Arial',
      color: '#aaaaaa'
    });
    this.add(infoText);
  }

  /**
   * 更新预算显示
   */
  updateBudget(newBudget: number): void {
    this.currentBudget = newBudget;
    this.budgetText.setText(`¥${newBudget}`);

    // 重新计算百分比并更新预算条
    const percent = newBudget / GAME_CONFIG.initialBudget;
    const color = percent > 0.5 ? 0x00ff00 : percent > 0.25 ? 0xffff00 : 0xff0000;

    this.budgetBar.clear();
    this.budgetBar.fillStyle(color, 1);
    this.budgetBar.fillRoundedRect(200, 25, 200 * percent, 12, 6);

    // 更新剩余次数
    const remainingHits = Math.floor(newBudget / 80);
    this.hitCountText.setText(`可砸：${remainingHits}次`);
  }

  /**
   * 更新关卡显示
   */
  updateLevel(level: number): void {
    this.levelText.setText(`${level}`);
  }
}

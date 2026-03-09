import Phaser from 'phaser';
import { GAME_CONFIG } from '../config';
import { AudioManager } from '../managers/AudioManager';

export class MenuScene extends Phaser.Scene {
  private audioManager!: AudioManager;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    // 使用固定的 GAME_CONFIG 尺寸
    const width = GAME_CONFIG.width;
    const height = GAME_CONFIG.height;

    // 初始化音效管理（使用 try-catch 防止错误）
    try {
      this.audioManager = new AudioManager(this);
      this.audioManager.playBGM();
    } catch (e) {
      console.warn('AudioManager 初始化失败:', e);
    }

    // 添加背景
    this.add.image(width / 2, height / 2, 'bg_gradient');

    // 创建标题
    this.add.text(width / 2, height / 4, '八十！八十！', {
      font: 'bold 48px Arial',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // 创建副标题
    this.add.text(width / 2, height / 4 + 50, '砸墙解谜游戏', {
      font: '24px Arial',
      color: '#aaaaaa'
    }).setOrigin(0.5);

    // 显示私房钱
    const totalMoney = this.registry.get('totalMoney') || 0;
    this.add.text(width / 2, height / 4 + 90, `💰 私房钱：¥${totalMoney}`, {
      font: 'bold 22px Arial',
      color: '#ffcc00',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    // 创建开始按钮
    this.createButton(width / 2 - 100, height / 2 + 20, '开始游戏', 0x00aa00, () => {
      this.startGame();
    });

    // 创建商店按钮
    this.createButton(width / 2 + 100, height / 2 + 20, '道具商店', 0xcc6600, () => {
      this.scene.start('ShopScene');
    });

    // 创建选关按钮
    this.createButton(width / 2 - 100, height / 2 + 100, '选择关卡', 0x0066cc, () => {
      this.showLevelSelect();
    });

    // 创建排行榜按钮
    this.createButton(width / 2 + 100, height / 2 + 100, '排行榜', 0x9933cc, () => {
      this.scene.start('LeaderboardScene');
    });

    // 创建说明文字
    const instructions = [
      '点击积木块砸墙',
      '预算内让墙体倒塌即可过关',
      '每关预算：1000 元，砸一下：80 元',
      '剩余预算变成私房钱！'
    ];
    instructions.forEach((text, index) => {
      this.add.text(width / 2, height / 2 + 180 + index * 25, text, {
        font: '16px Arial',
        color: '#888888'
      }).setOrigin(0.5);
    });
  }

  private createButton(x: number, y: number, text: string, color: number, onClick: () => void): void {
    // 按钮背景 - 使用绝对坐标
    const buttonBg = this.add.graphics();
    buttonBg.fillStyle(color, 1);
    buttonBg.fillRoundedRect(x - 100, y - 30, 200, 60, 10);

    // 按钮文字 - 使用绝对坐标
    this.add.text(x, y, text, {
      font: 'bold 24px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    // 创建一个可点击的区域 - 使用绝对坐标
    const hitArea = this.add.rectangle(x, y, 200, 60, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });

    hitArea.on('pointerover', () => {
      buttonBg.clear();
      buttonBg.fillStyle(color + 0x202020, 1);
      buttonBg.fillRoundedRect(x - 100, y - 30, 200, 60, 10);
      this.audioManager?.playUISound();
    });

    hitArea.on('pointerout', () => {
      buttonBg.clear();
      buttonBg.fillStyle(color, 1);
      buttonBg.fillRoundedRect(x - 100, y - 30, 200, 60, 10);
    });

    hitArea.on('pointerdown', () => {
      buttonBg.clear();
      buttonBg.fillStyle(color - 0x202020, 1);
      buttonBg.fillRoundedRect(x - 100, y - 30, 200, 60, 10);
      this.audioManager?.playUISound();
    });

    hitArea.on('pointerup', () => {
      buttonBg.clear();
      buttonBg.fillStyle(color, 1);
      buttonBg.fillRoundedRect(x - 100, y - 30, 200, 60, 10);
      this.audioManager?.playUISound();
      onClick();
    });
  }

  private startGame(): void {
    const data = this.registry;
    const currentLevel = data.get('currentLevel') || 1;

    if (data.get('totalMoney') === undefined) {
      data.set('totalMoney', 0);
    }
    if (data.get('unlockedLevels') === undefined) {
      data.set('unlockedLevels', 1);
    }

    this.scene.start('GameScene', { level: currentLevel });
  }

  private showLevelSelect(): void {
    const width = GAME_CONFIG.width;
    const height = GAME_CONFIG.height;

    // 背景遮罩
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    overlay.setInteractive();

    // 面板背景
    const panel = this.add.graphics();
    panel.fillStyle(0x222222, 1);
    panel.fillRoundedRect(width / 2 - 200, height / 2 - 180, 400, 360, 20);

    // 标题
    this.add.text(width / 2, height / 2 - 140, '选择关卡', {
      font: 'bold 28px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    // 关闭按钮
    const closeBtn = this.add.text(width / 2 + 160, height / 2 - 160, '×', {
      font: 'bold 32px Arial',
      color: '#ff6666'
    }).setOrigin(0.5);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on('pointerup', () => {
      overlay.destroy();
      panel.destroy();
      closeBtn.destroy();
      this.createLevelButtons(width / 2, height / 2);
    });

    // 创建关卡按钮
    this.createLevelButtons(width / 2, height / 2);
  }

  private createLevelButtons(centerX: number, centerY: number): void {
    const unlockedLevels = this.registry.get('unlockedLevels') || 1;
    const maxLevels = 9;

    for (let i = 1; i <= maxLevels; i++) {
      const row = Math.floor((i - 1) / 3);
      const col = (i - 1) % 3;
      const x = centerX - 100 + col * 100;
      const y = centerY - 80 + row * 90;

      const isUnlocked = i <= unlockedLevels;
      const color = isUnlocked ? 0x00aa00 : 0x666666;

      // 按钮背景
      const btnBg = this.add.graphics();
      btnBg.fillStyle(color, 1);
      btnBg.fillRoundedRect(-40, -35, 80, 70, 10);

      // 关卡数字
      this.add.text(x, y - 5, `${i}`, {
        font: 'bold 24px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);

      // 星级
      if (isUnlocked) {
        const levelKey = `level_${i}`;
        const levelData = this.registry.get(levelKey);
        const stars = levelData?.stars || 0;
        if (stars > 0) {
          this.add.text(x, y + 25, '★'.repeat(stars), {
            font: 'bold 12px Arial',
            color: '#ffff00'
          }).setOrigin(0.5);
        }
      } else {
        this.add.text(x, y + 10, '🔒', {
          font: '16px Arial'
        }).setOrigin(0.5);
      }

      if (isUnlocked) {
        const hitArea = this.add.rectangle(x, y, 80, 70, 0x000000, 0);
        hitArea.setInteractive({ useHandCursor: true });

        hitArea.on('pointerover', () => {
          btnBg.clear();
          btnBg.fillStyle(0x00cc00, 1);
          btnBg.fillRoundedRect(-40, -35, 80, 70, 10);
        });

        hitArea.on('pointerout', () => {
          btnBg.clear();
          btnBg.fillStyle(color, 1);
          btnBg.fillRoundedRect(-40, -35, 80, 70, 10);
        });

        hitArea.on('pointerup', () => {
          this.startLevel(i);
        });
      }
    }
  }

  private startLevel(level: number): void {
    const data = this.registry;
    data.set('currentLevel', level);
    this.scene.start('GameScene', { level });
  }
}
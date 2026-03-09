import Phaser from 'phaser';
import { GAME_CONFIG } from '../config';
import * as api from '../api/client';

export class LeaderboardScene extends Phaser.Scene {
  private currentTab: 'region' | 'level' | 'money' = 'money';

  constructor() {
    super({ key: 'LeaderboardScene' });
  }

  create(): void {
    const width = GAME_CONFIG.width;
    const height = GAME_CONFIG.height;

    // 背景
    this.add.image(width / 2, height / 2, 'bg_gradient');

    // 标题
    this.add.text(width / 2, 40, '排行榜', {
      font: 'bold 36px Arial',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // 返回按钮
    this.createBackButton(width - 60, 40);

    // 创建标签页
    this.createTabs(width / 2, 90);

    // 加载排行榜数据
    this.loadLeaderboardData();
  }

  private createTabs(x: number, y: number): void {
    const tabs = [
      { key: 'money', label: '私房钱榜' },
      { key: 'level', label: '通关数榜' },
      { key: 'region', label: '区域榜' }
    ];

    let currentX = x - 180;

    tabs.forEach(tab => {
      const container = this.add.container(currentX, y);

      const isSelected = tab.key === this.currentTab;
      const bgColor = isSelected ? 0x00aa00 : 0x444444;

      const bg = this.add.graphics();
      bg.fillStyle(bgColor, 1);
      bg.fillRoundedRect(-70, -15, 140, 30, 8);
      container.add(bg);

      const text = this.add.text(0, 0, tab.label, {
        font: 'bold 16px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);
      container.add(text);

      container.setSize(140, 30);
      const hitArea = new Phaser.Geom.Rectangle(-70, -15, 140, 30);
      container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

      container.on('pointerover', () => {
        if (!isSelected) {
          bg.clear();
          bg.fillStyle(0x666666, 1);
          bg.fillRoundedRect(-70, -15, 140, 30, 8);
        }
      });

      container.on('pointerout', () => {
        if (!isSelected) {
          bg.clear();
          bg.fillStyle(0x444444, 1);
          bg.fillRoundedRect(-70, -15, 140, 30, 8);
        }
      });

      container.on('pointerup', () => {
        this.currentTab = tab.key as any;
        this.scene.restart();
      });

      this.itemButtons.push(container);
      currentX += 190;
    });
  }

  private itemButtons: Phaser.GameObjects.Container[] = [];

  private async loadLeaderboardData(): Promise<void> {
    let data: any[] = [];
    const enabled = (Phaser as any).API_CONFIG?.enabled || false;

    if (enabled) {
      try {
        switch (this.currentTab) {
          case 'money':
            data = await api.getGlobalMoneyLeaderboard();
            break;
          case 'level':
            data = await api.getGlobalLevelLeaderboard();
            break;
          case 'region':
            data = await api.getRegionLeaderboard('all');
            break;
        }
      } catch (e) {
        console.warn('API 加载失败，使用模拟数据');
        data = this.getMockData();
      }
    } else {
      data = this.getMockData();
    }

    this.renderLeaderboard(data);
  }

  private getMockData(): any[] {
    // 生成模拟数据
    const mockData = [];
    const baseMoney = [5000, 4500, 4000, 3500, 3000, 2500, 2000, 1500, 1000, 500];
    const baseLevels = [30, 28, 25, 22, 20, 18, 15, 12, 10, 8];

    for (let i = 0; i < 10; i++) {
      mockData.push({
        rank: i + 1,
        user_id: 1000 + i,
        nickname: `玩家${i + 1}`,
        total_money: baseMoney[i],
        max_level: baseLevels[i]
      });
    }

    // 添加当前玩家
    const playerMoney = this.registry.get('totalMoney') || 0;
    const playerLevel = this.registry.get('unlockedLevels') || 1;

    mockData.push({
      rank: 11,
      user_id: 0,
      nickname: '我',
      total_money: playerMoney,
      max_level: playerLevel,
      isPlayer: true
    });

    return mockData.sort((a, b) => {
      if (this.currentTab === 'money') return b.total_money - a.total_money;
      if (this.currentTab === 'level') return b.max_level - a.max_level;
      return 0;
    }).map((item, index) => ({ ...item, rank: index + 1 }));
  }

  private renderLeaderboard(data: any[]): void {
    const width = GAME_CONFIG.width;
    const startY = 140;
    const rowHeight = 45;

    // 表头
    const headerBg = this.add.graphics();
    headerBg.fillStyle(0x333333, 0.8);
    headerBg.fillRect(50, startY - 30, width - 100, 30);
    this.add.text(80, startY - 15, '排名', { font: 'bold 16px Arial', color: '#ffffff' });
    this.add.text(200, startY - 15, '玩家', { font: 'bold 16px Arial', color: '#ffffff' });

    const valueLabel = this.currentTab === 'money' ? '💰 私房钱' : '🏆 通关数';
    this.add.text(width - 120, startY - 15, valueLabel, { font: 'bold 16px Arial', color: '#ffffff' }).setOrigin(1, 0);

    // 数据行
    data.forEach((item, index) => {
      const y = startY + index * rowHeight;
      const isPlayer = item.isPlayer;

      // 背景
      const rowBg = this.add.graphics();
      rowBg.fillStyle(isPlayer ? 0x004400 : 0x222222, 0.6);
      rowBg.fillRect(50, y, width - 100, rowHeight - 5);
      this.add.existing(rowBg);

      // 排名
      let rankColor = '#ffffff';
      if (item.rank === 1) rankColor = '#ffd700';
      else if (item.rank === 2) rankColor = '#c0c0c0';
      else if (item.rank === 3) rankColor = '#cd7f32';

      this.add.text(80, y + 8, `#${item.rank}`, {
        font: 'bold 16px Arial',
        color: rankColor
      });

      // 玩家名
      this.add.text(200, y + 8, item.nickname || `玩家${item.rank}`, {
        font: '16px Arial',
        color: isPlayer ? '#00ff00' : '#ffffff'
      });

      // 数值
      const value = this.currentTab === 'money' ? `¥${item.total_money}` : `第${item.max_level}关`;
      this.add.text(width - 80, y + 8, value, {
        font: 'bold 16px Arial',
        color: '#ffcc00'
      }).setOrigin(1, 0);
    });
  }

  private createBackButton(x: number, y: number): void {
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(0x666666, 1);
    bg.fillRoundedRect(-40, -15, 80, 30, 8);
    container.add(bg);

    const text = this.add.text(0, 0, '返回', {
      font: 'bold 16px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);
    container.add(text);

    container.setSize(80, 30);
    const hitArea = new Phaser.Geom.Rectangle(-40, -15, 80, 30);
    container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x888888, 1);
      bg.fillRoundedRect(-40, -15, 80, 30, 8);
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x666666, 1);
      bg.fillRoundedRect(-40, -15, 80, 30, 8);
    });

    container.on('pointerup', () => {
      this.scene.start('MenuScene');
    });
  }
}

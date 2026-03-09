import Phaser from 'phaser';
import { GAME_CONFIG, ITEMS } from '../config';
import * as api from '../api/client';

export class ShopScene extends Phaser.Scene {
  private totalMoney: number = 0;
  private inventory: { [key: string]: number } = {};
  private shopItems: Array<{ id: string; name: string; description: string; price: number }> = [];
  private itemButtons: Phaser.GameObjects.Container[] = [];

  constructor() {
    super({ key: 'ShopScene' });
  }

  init(): void {
    this.totalMoney = this.registry.get('totalMoney') || 0;
    this.inventory = this.registry.get('inventory') || {};
  }

  create(): void {
    const width = GAME_CONFIG.width;
    const height = GAME_CONFIG.height;

    // 背景
    this.add.image(width / 2, height / 2, 'bg_gradient');

    // 标题
    this.add.text(width / 2, 40, '道具商店', {
      font: 'bold 36px Arial',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // 显示私房钱
    this.add.text(width / 2, 75, `💰 私房钱：¥${this.totalMoney}`, {
      font: 'bold 22px Arial',
      color: '#ffcc00'
    }).setOrigin(0.5);

    // 加载商店道具
    this.loadShopItems();

    // 返回按钮
    this.createBackButton(width - 60, 40);
  }

  private async loadShopItems(): Promise<void> {
    // 尝试从 API 加载
    const enabled = (Phaser as any).API_CONFIG?.enabled || false;

    if (enabled) {
      try {
        this.shopItems = await api.getShopItems();
      } catch (e) {
        console.warn('API 加载失败，使用本地数据');
        this.shopItems = this.getLocalShopItems();
      }
    } else {
      this.shopItems = this.getLocalShopItems();
    }

    this.renderShopItems();
  }

  private getLocalShopItems(): Array<{ id: string; name: string; description: string; price: number }> {
    return [
      { id: 'hammer', name: '大力锤', description: '砸 1 下抵 1.5 下效果', price: 200 },
      { id: 'gravity_lens', name: '重心分析镜', description: '标注重心点辅助分析', price: 150 },
      { id: 'worm', name: '蛀虫', description: '使目标积木硬度降级', price: 100 },
      { id: 'budget_pack', name: '预算补充包', description: '增加 200 元预算', price: 300 }
    ];
  }

  private renderShopItems(): void {
    const startX = 100;
    const startY = 130;
    const itemWidth = 280;
    const itemHeight = 100;
    const gap = 20;

    this.shopItems.forEach((item, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = startX + col * (itemWidth + gap);
      const y = startY + row * (itemHeight + gap);

      this.createShopItemCard(x, y, item);
    });
  }

  private createShopItemCard(x: number, y: number, item: any): void {
    const width = 280;
    const height = 100;
    const container = this.add.container(x, y);

    // 背景
    const bg = this.add.graphics();
    bg.fillStyle(0x2a2a4a, 1);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 15);
    bg.lineStyle(2, 0x4a4a6a, 1);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 15);
    container.add(bg);

    // 道具名称
    const nameText = this.add.text(-120, -30, item.name, {
      font: 'bold 20px Arial',
      color: '#ffffff'
    });
    container.add(nameText);

    // 价格
    const priceText = this.add.text(-120, 5, `¥${item.price}`, {
      font: 'bold 18px Arial',
      color: '#ffcc00'
    });
    container.add(priceText);

    // 描述
    const descText = this.add.text(-120, 25, item.description, {
      font: '14px Arial',
      color: '#aaaaaa',
      wordWrap: { width: 150 }
    });
    container.add(descText);

    // 拥有数量
    const owned = this.inventory[item.id] || 0;
    const ownedText = this.add.text(120, -30, `x${owned}`, {
      font: 'bold 16px Arial',
      color: '#888888'
    }).setOrigin(1, 0);
    container.add(ownedText);

    // 购买按钮
    const buyButton = this.createBuyButton(80, 20, item);
    container.add(buyButton);

    this.itemButtons.push(container);
  }

  private createBuyButton(x: number, y: number, item: any): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(0x00aa00, 1);
    bg.fillRoundedRect(-50, -15, 100, 30, 8);
    container.add(bg);

    const text = this.add.text(0, 0, '购买', {
      font: 'bold 16px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);
    container.add(text);

    container.setSize(100, 30);
    const hitArea = new Phaser.Geom.Rectangle(-50, -15, 100, 30);
    container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x00cc00, 1);
      bg.fillRoundedRect(-50, -15, 100, 30, 8);
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x00aa00, 1);
      bg.fillRoundedRect(-50, -15, 100, 30, 8);
    });

    container.on('pointerdown', () => {
      bg.clear();
      bg.fillStyle(0x008800, 1);
      bg.fillRoundedRect(-50, -15, 100, 30, 8);
    });

    container.on('pointerup', () => {
      this.buyItem(item);
    });

    return container;
  }

  private async buyItem(item: any): Promise<void> {
    if (this.totalMoney < item.price) {
      this.showMessage(`💰 私房钱不足！需要 ¥${item.price}`);
      return;
    }

    const enabled = (Phaser as any).API_CONFIG?.enabled || false;

    if (enabled) {
      try {
        const result = await api.buyItem(item.id, 1);
        this.totalMoney = result.remaining_money;
        this.inventory[item.id] = (this.inventory[item.id] || 0) + 1;
        this.registry.set('totalMoney', this.totalMoney);
        this.registry.set('inventory', this.inventory);
        this.showMessage(`✅ 购买成功！剩余 ¥${result.remaining_money}`);
      } catch (e: any) {
        this.showMessage(`❌ ${e.message || '购买失败'}`);
      }
    } else {
      // 离线模式
      this.totalMoney -= item.price;
      this.inventory[item.id] = (this.inventory[item.id] || 0) + 1;
      this.registry.set('totalMoney', this.totalMoney);
      this.registry.set('inventory', this.inventory);
      this.showMessage(`✅ 购买成功！剩余 ¥${this.totalMoney}`);
    }

    // 刷新显示
    this.scene.restart();
  }

  private showMessage(text: string): void {
    const msg = this.add.text(GAME_CONFIG.width / 2, GAME_CONFIG.height - 60, text, {
      font: 'bold 18px Arial',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    this.time.delayedCall(2000, () => {
      msg.destroy();
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

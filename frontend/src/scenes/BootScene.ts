import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  private progressBar!: Phaser.GameObjects.Graphics;
  private progressBox!: Phaser.GameObjects.Graphics;
  private loadingText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    const { width, height } = this.scale;

    // 创建进度条背景
    this.progressBox = this.add.graphics();
    this.progressBox.fillStyle(0x222222, 0.8);
    this.progressBox.fillRect(width / 2 - 160, height / 2 - 50, 320, 50);

    // 创建进度条
    this.progressBar = this.add.graphics();

    // 创建加载文本
    this.loadingText = this.add.text(width / 2, height / 2 - 70, '加载中...', {
      font: '20px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    // 监听加载进度
    this.load.on('progress', (value: number) => {
      this.progressBar.clear();
      this.progressBar.fillStyle(0x00ff00, 1);
      this.progressBar.fillRect(width / 2 - 150, height / 2 - 40, 300 * value, 30);
    });

    // 监听文件加载
    this.load.on('filecomplete', (key: string) => {
      console.log('Loaded:', key);
    });

    // 加载完成
    this.load.on('complete', () => {
      console.log('All assets loaded');
    });

    // 加载占位图资源（因为没有实际图片文件，用代码生成）
    this.createPlaceholderTextures();
  }

  private createPlaceholderTextures(): void {
    // 生成泥土块贴图
    this.generateBlockTexture('block_dirt', 0x8B4513, 0x6B3510);

    // 生成瓷砖块贴图
    this.generateBlockTexture('block_tile', 0xCD853F, 0xA0522D);

    // 生成大理石块贴图
    this.generateBlockTexture('block_marble', 0xD2B48C, 0xB8945F);

    // 生成金属块贴图
    this.generateBlockTexture('block_metal', 0x708090, 0x506070);

    // 生成锤子图标
    this.generateHammerTexture();

    // 生成背景纹理
    this.generateBackgroundTexture();
  }

  private generateBlockTexture(key: string, color: number, darkColor: number): void {
    const size = 40;
    const graphics = this.createGraphics();

    // 填充底色
    graphics.fillStyle(color, 1);
    graphics.fillRect(0, 0, size, size);

    // 添加边框效果
    graphics.lineStyle(2, darkColor, 1);
    graphics.strokeRect(0, 0, size, size);

    // 添加一些纹理细节
    graphics.fillStyle(darkColor, 0.3);
    for (let i = 0; i < 5; i++) {
      const x = Math.random() * (size - 4);
      const y = Math.random() * (size - 4);
      graphics.fillRect(x, y, 4, 4);
    }

    // 添加内阴影效果
    graphics.lineStyle(1, 0x000000, 0.3);
    graphics.moveTo(0, size);
    graphics.lineTo(0, 0);
    graphics.lineTo(size, 0);

    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  private generateHammerTexture(): void {
    const graphics = this.createGraphics();

    // 锤子头
    graphics.fillStyle(0x505050, 1);
    graphics.fillRect(10, 5, 20, 12);

    // 锤子柄
    graphics.fillStyle(0x8B4513, 1);
    graphics.fillRect(18, 17, 4, 20);

    graphics.generateTexture('hammer', 40, 40);
    graphics.destroy();
  }

  private generateBackgroundTexture(): void {
    const graphics = this.createGraphics();

    // 渐变背景
    for (let y = 0; y < 600; y++) {
      const ratio = y / 600;
      const color = this.interpolateColor(0x2a2a4e, 0x1a1a2e, ratio);
      graphics.fillStyle(color, 1);
      graphics.fillRect(0, y, 800, 1);
    }

    graphics.generateTexture('bg_gradient', 800, 600);
    graphics.destroy();
  }

  private createGraphics(): Phaser.GameObjects.Graphics {
    // 使用 add.graphics() 创建图形对象，然后设置位置
    const graphics = this.add.graphics();
    graphics.setPosition(0, 0);
    return graphics;
  }

  private interpolateColor(color1: number, color2: number, ratio: number): number {
    const r1 = (color1 >> 16) & 0xff;
    const g1 = (color1 >> 8) & 0xff;
    const b1 = color1 & 0xff;

    const r2 = (color2 >> 16) & 0xff;
    const g2 = (color2 >> 8) & 0xff;
    const b2 = color2 & 0xff;

    const r = Math.round(r1 + (r2 - r1) * ratio);
    const g = Math.round(g1 + (g2 - g1) * ratio);
    const b = Math.round(b1 + (b2 - b1) * ratio);

    return (r << 16) | (g << 8) | b;
  }

  create(): void {
    this.scene.start('MenuScene');
  }
}

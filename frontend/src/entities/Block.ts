import Phaser from 'phaser';
import { BlockData } from '../types';

export class Block extends Phaser.GameObjects.Container {
  private blockData: BlockData;
  private sprite!: Phaser.GameObjects.Image;
  private healthText!: Phaser.GameObjects.Text;
  private isDestroyed: boolean = false;
  private physicsBody: any;

  constructor(scene: Phaser.Scene, data: BlockData) {
    super(scene, data.x, data.y);
    this.blockData = { ...data };

    this.createVisuals(scene);
  }

  private createVisuals(scene: Phaser.Scene): void {
    const width = this.blockData.width;
    const height = this.blockData.height;

    // 创建积木块图形
    this.sprite = scene.add.image(0, 0, this.blockData.type.texture);
    this.sprite.setDisplaySize(width, height);
    this.sprite.setOrigin(0.5);

    // 添加生命值文本（对于多生命值的积木块）
    if (this.blockData.type.health > 1) {
      this.healthText = scene.add.text(width / 2 - 5, -height / 2 + 5,
        `${this.blockData.currentHealth}`, {
        font: 'bold 14px Arial',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(1, 0);
      this.add(this.healthText);
    }

    this.add(this.sprite);
    this.setSize(width, height);

    // 添加交互 - 必须提供 hitArea
    const hitArea = new Phaser.Geom.Rectangle(-width/2, -height/2, width, height);
    this.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

    // 启用光标变化
    this.setInteractive({ useHandCursor: true });

    // 添加悬停效果
    this.on('pointerover', () => {
      if (!this.isDestroyed) {
        this.sprite.alpha = 0.8;
      }
    });

    this.on('pointerout', () => {
      this.sprite.alpha = 1;
    });
  }

  /**
   * 检查点击是否命中此积木块
   */
  isHit(x: number, y: number): boolean {
    if (this.isDestroyed) return false;

    const bounds = this.getBounds();
    return x >= bounds.x && x <= bounds.x + bounds.width &&
           y >= bounds.y && y <= bounds.y + bounds.height;
  }

  /**
   * 砸击积木块
   * @returns 积木块是否被摧毁
   */
  hit(): boolean {
    if (this.isDestroyed) return false;

    this.blockData.currentHealth--;

    // 更新显示
    if (this.healthText) {
      this.healthText.setText(`${this.blockData.currentHealth}`);
    }

    // 播放砸击动画
    this.playHitAnimation();

    // 检查是否被摧毁
    if (this.blockData.currentHealth <= 0) {
      this.isDestroyed = true;
      return true;
    }

    return false;
  }

  private playHitAnimation(): void {
    // 缩放动画
    this.scene.tweens.add({
      targets: this,
      scaleX: 0.9,
      scaleY: 0.9,
      duration: 50,
      yoyo: true,
      ease: 'Power2'
    });

    // 闪白效果
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0.5,
      duration: 50,
      yoyo: true,
      repeat: 1
    });
  }

  /**
   * 启用物理效果（用于倒塌）
   */
  enablePhysics(): void {
    // 创建矩形物理体
    this.physicsBody = this.scene.matter.add.rectangle(
      this.x, this.y, this.blockData.width, this.blockData.height, {
        friction: 0.5,
        restitution: 0.2,
        density: 0.001
      }
    );
  }

  /**
   * 获取积木块 ID
   */
  getId(): string {
    return this.blockData.id;
  }

  /**
   * 获取积木块数据
   */
  getData(): BlockData {
    return { ...this.blockData };
  }

  /**
   * 获取积木块重量（考虑尺寸）
   */
  getWeight(): number {
    // 重量 = 基础重量 * 面积比例
    const baseWeight = this.blockData.type.weight;
    const area = this.blockData.width * this.blockData.height;
    const baseArea = 40 * 40; // 基础面积
    return baseWeight * (area / baseArea);
  }

  /**
   * 获取积木块中心位置
   */
  getCenter(): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(this.x, this.y);
  }

  /**
   * 获取积木块边界
   */
  getBounds(): Phaser.Geom.Rectangle {
    const width = this.blockData.width;
    const height = this.blockData.height;
    return new Phaser.Geom.Rectangle(
      this.x - width / 2,
      this.y - height / 2,
      width,
      height
    );
  }

  /**
   * 获取宽度
   */
  getWidth(): number {
    return this.blockData.width;
  }

  /**
   * 获取高度
   */
  getHeight(): number {
    return this.blockData.height;
  }

  /**
   * 销毁积木块
   */
  destroy(fromScene?: boolean): void {
    this.isDestroyed = true;
    super.destroy(fromScene);
  }
}
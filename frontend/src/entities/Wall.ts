import Phaser from 'phaser';
import { Block } from './Block';
import { WallConfig } from '../types';

export class Wall extends Phaser.GameObjects.Container {
  private blocks: Map<string, Block> = new Map();
  private gameScene: Phaser.Scene;

  constructor(scene: Phaser.Scene, config: WallConfig) {
    super(scene, 0, 0);
    this.gameScene = scene;

    // 创建所有积木块
    config.blocks.forEach(blockData => {
      const block = new Block(scene, blockData);
      this.blocks.set(blockData.id, block);
      this.add(block);
    });

    scene.add.existing(this);
  }

  /**
   * 获取指定位置的积木块
   */
  getBlockAtPosition(x: number, y: number): Block | null {
    console.log('Wall.getBlockAtPosition 被调用, 位置:', x, y);
    console.log('当前积木块数量:', this.blocks.size);

    for (const [id, block] of this.blocks) {
      const isHit = block.isHit(x, y);
      console.log(`检查积木块 ${id}: isHit=${isHit}`);
      if (isHit) {
        console.log('找到匹配的积木块:', id);
        return block;
      }
    }
    console.log('没有找到匹配的积木块');
    return null;
  }

  /**
   * 砸积木块
   * @param block 要砸的积木块
   * @returns 积木块是否被摧毁
   */
  hitBlock(block: Block): boolean {
    const destroyed = block.hit();

    if (destroyed) {
      // 从墙体中移除
      this.blocks.delete(block.getId());
      block.destroy();
    }

    return destroyed;
  }

  /**
   * 获取所有剩余的积木块
   */
  getRemainingBlocks(): Block[] {
    return Array.from(this.blocks.values());
  }

  /**
   * 获取指定 ID 的积木块
   */
  getBlockById(id: string): Block | undefined {
    return this.blocks.get(id);
  }

  /**
   * 播放墙体倒塌动画
   * @param onComplete 倒塌完成回调
   */
  collapse(onComplete: () => void): void {
    const remainingBlocks = this.getRemainingBlocks();

    if (remainingBlocks.length === 0) {
      onComplete();
      return;
    }

    // 启用物理引擎让积木块掉落
    remainingBlocks.forEach((block, index) => {
      this.gameScene.time.delayedCall(index * 50, () => {
        block.enablePhysics();
      });
    });

    // 等待所有积木块掉落完成
    this.gameScene.time.delayedCall(remainingBlocks.length * 50 + 1000, () => {
      // 清理所有积木块
      remainingBlocks.forEach(block => block.destroy());
      this.blocks.clear();
      onComplete();
    });
  }

  /**
   * 获取墙体包围盒
   */
  getBounds(): Phaser.Geom.Rectangle {
    const blocks = this.getRemainingBlocks();
    if (blocks.length === 0) {
      return new Phaser.Geom.Rectangle(0, 0, 0, 0);
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    blocks.forEach(block => {
      const bounds = block.getBounds();
      minX = Math.min(minX, bounds.x);
      minY = Math.min(minY, bounds.y);
      maxX = Math.max(maxX, bounds.x + bounds.width);
      maxY = Math.max(maxY, bounds.y + bounds.height);
    });

    return new Phaser.Geom.Rectangle(minX, minY, maxX - minX, maxY - minY);
  }
}

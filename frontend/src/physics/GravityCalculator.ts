import Phaser from 'phaser';
import { Block } from '../entities/Block';

/**
 * 重力计算器
 * 用于计算墙体的重心和支撑状态
 */
export class GravityCalculator {
  /**
   * 计算墙体的重心位置
   * @param blocks 所有积木块
   * @returns 重心坐标
   */
  static calculateCenterOfGravity(blocks: Block[]): Phaser.Math.Vector2 {
    if (blocks.length === 0) {
      return new Phaser.Math.Vector2(0, 0);
    }

    let totalWeight = 0;
    let weightedX = 0;
    let weightedY = 0;

    blocks.forEach(block => {
      const weight = block.getWeight();
      const center = block.getCenter();

      totalWeight += weight;
      weightedX += center.x * weight;
      weightedY += center.y * weight;
    });

    return new Phaser.Math.Vector2(
      weightedX / totalWeight,
      weightedY / totalWeight
    );
  }

  /**
   * 检查重心是否有支撑
   * 重心必须落在支撑块的 X 范围内才算有支撑
   */
  static isSupported(
    centerOfGravity: Phaser.Math.Vector2,
    blocks: Block[],
    supportY: number
  ): boolean {
    if (blocks.length === 0) {
      return false;
    }

    // 找到最底层的积木块（Y 坐标最大的）
    const bottomBlocks = this.getBottomBlocks(blocks);

    if (bottomBlocks.length === 0) {
      return false;
    }

    // 计算支撑区域：所有底层积木块的 X 范围
    let minX = Infinity;
    let maxX = -Infinity;

    bottomBlocks.forEach(block => {
      const bounds = block.getBounds();
      minX = Math.min(minX, bounds.x);
      maxX = Math.max(maxX, bounds.x + bounds.width);
    });

    // 重心必须在支撑范围内才算有支撑
    // 如果重心超出了支撑块的 X 范围，墙就会倒塌
    const isSupported = centerOfGravity.x >= minX && centerOfGravity.x <= maxX;

    return isSupported;
  }

  /**
   * 获取最底层的积木块（Y 坐标最大的）
   */
  private static getBottomBlocks(blocks: Block[]): Block[] {
    if (blocks.length === 0) {
      return [];
    }

    // 找到最大的 Y 坐标（最底部）
    let maxBottomY = -Infinity;
    blocks.forEach(block => {
      const bounds = block.getBounds();
      const bottomY = bounds.y + bounds.height;
      if (bottomY > maxBottomY) {
        maxBottomY = bottomY;
      }
    });

    // 返回所有底部的积木块（在 maxBottomY 附近的）
    const tolerance = 5; // 允许的误差
    return blocks.filter(block => {
      const bounds = block.getBounds();
      const bottomY = bounds.y + bounds.height;
      return bottomY >= maxBottomY - tolerance;
    });
  }

  /**
   * 计算墙体的稳定性（0-1 之间）
   * 0 表示不稳定（即将倒塌），1 表示非常稳定
   */
  static calculateStability(blocks: Block[], supportY: number): number {
    if (blocks.length === 0) {
      return 0;
    }

    const bottomBlocks = this.getBottomBlocks(blocks);
    if (bottomBlocks.length === 0) {
      return 0;
    }

    let minX = Infinity;
    let maxX = -Infinity;
    bottomBlocks.forEach(block => {
      const bounds = block.getBounds();
      minX = Math.min(minX, bounds.x);
      maxX = Math.max(maxX, bounds.x + bounds.width);
    });

    const supportWidth = maxX - minX;
    if (supportWidth <= 0) {
      return 0;
    }

    const cog = this.calculateCenterOfGravity(blocks);

    // 计算重心到两边边缘的距离
    const distanceToLeft = cog.x - minX;
    const distanceToRight = maxX - cog.x;

    // 稳定性 = 较近的边缘距离 / (支撑宽度 / 2)
    const minDistance = Math.min(distanceToLeft, distanceToRight);
    const stability = minDistance / (supportWidth / 2);

    return Math.min(1, Math.max(0, stability));
  }
}
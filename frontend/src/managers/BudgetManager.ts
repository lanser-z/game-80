/**
 * 预算管理器
 * 管理游戏中的预算、花费和私房钱
 */
export class BudgetManager {
  private initialBudget: number;
  private remainingBudget: number;
  private hitCost: number;
  private totalSpent: number;

  constructor(initialBudget: number, hitCost: number) {
    this.initialBudget = initialBudget;
    this.remainingBudget = initialBudget;
    this.hitCost = hitCost;
    this.totalSpent = 0;
  }

  /**
   * 检查是否可以砸墙
   */
  canHit(): boolean {
    return this.remainingBudget >= this.hitCost;
  }

  /**
   * 花费预算（砸一次墙）
   */
  spendBudget(): void {
    if (this.canHit()) {
      this.remainingBudget -= this.hitCost;
      this.totalSpent += this.hitCost;
    }
  }

  /**
   * 使用道具（可能免费或有特殊花费）
   * @param cost 道具花费
   * @returns 是否成功使用
   */
  useItem(cost: number): boolean {
    // 道具使用私房钱，不影响当前关卡预算
    // 这里简化处理，实际应该由后端的 InventoryManager 处理
    return true;
  }

  /**
   * 获取剩余预算
   */
  getRemainingBudget(): number {
    return Math.max(0, this.remainingBudget);
  }

  /**
   * 获取初始预算
   */
  getInitialBudget(): number {
    return this.initialBudget;
  }

  /**
   * 获取总花费
   */
  getTotalSpent(): number {
    return this.totalSpent;
  }

  /**
   * 获取每次砸墙的花费
   */
  getHitCost(): number {
    return this.hitCost;
  }

  /**
   * 计算剩余砸墙次数
   */
  getRemainingHits(): number {
    return Math.floor(this.remainingBudget / this.hitCost);
  }

  /**
   * 计算预算使用百分比
   */
  getBudgetUsagePercent(): number {
    return (this.totalSpent / this.initialBudget) * 100;
  }
}

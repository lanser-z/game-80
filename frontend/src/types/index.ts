// 游戏配置类型
export interface GameConfig {
  width: number;
  height: number;
  blockSize: number;
  initialBudget: number;
  hitCost: number;
}

// 积木块类型定义
export interface BlockType {
  name: string;
  health: number;
  texture: string;
  weight: number;
  color: number;
}

// 积木块数据
export interface BlockData {
  id: string;
  type: BlockType;
  x: number;
  y: number;
  width: number;   // 砖块宽度
  height: number;  // 砖块高度
  currentHealth: number;
}

// 墙体配置
export interface WallConfig {
  width: number;
  height: number;
  blocks: BlockData[];
}

// 关卡配置
export interface LevelConfig {
  levelId: number;
  name: string;
  budget: number;
  wallConfig: WallConfig;
  gravity: number;
  supportY: number;  // 支撑线 Y 坐标
}

// 游戏状态
export interface GameState {
  currentLevel: number;
  totalMoney: number;
  unlockedLevels: number;
  levelRecords: Record<number, LevelRecord>;
}

export interface LevelRecord {
  isCompleted: boolean;
  remainingBudget: number;
  stars: number;
}

// 道具定义
export interface Item {
  id: string;
  name: string;
  description: string;
  price: number;
  effect: string;
}

// 游戏配置
export const GAME_CONFIG = {
  width: 800,
  height: 600,
  blockSize: 40,
  initialBudget: 1000,
  hitCost: 80
};

// API 配置
export const API_CONFIG = {
  // 是否启用在线模式（调用后端 API）
  enabled: false,
  baseUrl: 'http://localhost:8080/api/v1'
};

// 积木块类型
export const BLOCK_TYPES = {
  DIRT: {
    name: 'dirt',
    health: 1,
    texture: 'block_dirt',
    weight: 1.0,
    color: 0x8B4513
  },
  TILE: {
    name: 'tile',
    health: 2,
    texture: 'block_tile',
    weight: 1.2,
    color: 0xCD853F
  },
  MARBLE: {
    name: 'marble',
    health: 3,
    texture: 'block_marble',
    weight: 1.5,
    color: 0xD2B48C
  },
  METAL: {
    name: 'metal',
    health: 5,
    texture: 'block_metal',
    weight: 2.0,
    color: 0x708090
  }
} as const;

// 道具定义
export const ITEMS = {
  HAMMER: {
    id: 'hammer',
    name: '大力锤',
    description: '砸 1 下抵 1.5 下效果',
    price: 200,
    effect: 'damage_multiplier:1.5'
  },
  GRAVITY_LENS: {
    id: 'gravity_lens',
    name: '重心分析镜',
    description: '标注重心点辅助分析',
    price: 150,
    effect: 'show_gravity:true'
  },
  WORM: {
    id: 'worm',
    name: '蛀虫',
    description: '使目标积木硬度降级',
    price: 100,
    effect: 'reduce_health:1'
  }
} as const;

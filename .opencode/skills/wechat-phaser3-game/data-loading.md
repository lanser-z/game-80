# 数据加载方式

## 问题描述

微信小游戏不支持 XHR (XMLHttpRequest) 加载本地 JSON 文件，这是由于安全限制和架构差异。Phaser 的 `this.load.json()` 方法在微信环境中会失败。

常见错误：
- "Network request failed"
- "Cannot load local file via XHR"
- JSON 数据加载超时

## 解决方案

将 JSON 数据转换为 ES6 模块，使用 `import` 语句直接导入。这种方式在构建时将数据打包到 JS 文件中，避免了运行时加载。

## 代码示例

### 方法一：JSON 转 JS 模块（推荐）

原始 JSON 文件 (`levels/level1.json`):
```json
{
  "levelId": 1,
  "name": "初出茅庐",
  "gravity": 980,
  "player": {
    "startPosition": [100, 200],
    "jumpForce": -400
  },
  "platforms": [
    {
      "type": "static",
      "position": [50, 270],
      "size": [200, 40]
    }
  ]
}
```

转换后的 JS 模块 (`levels/level1.js`):
```javascript
// 自动生成的关卡数据
export default {
  "levelId": 1,
  "name": "初出茅庐",
  "gravity": 980,
  "player": {
    "startPosition": [100, 200],
    "jumpForce": -400
  },
  "platforms": [
    {
      "type": "static",
      "position": [50, 270],
      "size": [200, 40]
    }
  ]
};
```

在游戏代码中导入：
```typescript
import level1Data from '../assets/data/level1.js';
import level2Data from '../assets/data/level2.js';

// 或者使用动态导入
async function loadLevel(levelId: number) {
    const { default: levelData } = await import(`../assets/data/level${levelId}.js`);
    return levelData;
}
```

### 方法二：统一数据导出

创建一个集中导出文件 (`src/assets/data/index.ts`):
```typescript
// 统一导出所有关卡数据
import level1 from './level1.js';
import level2 from './level2.js';
import level3 from './level3.js';

export const levels = {
    1: level1,
    2: level2,
    3: level3
};

export type LevelData = typeof level1;
```

使用方式：
```typescript
import { levels } from '../assets/data/index.js';

class GameScene extends Phaser.Scene {
    create() {
        const currentLevel = 1;
        const levelData = levels[currentLevel];
        this.loadLevel(levelData);
    }

    private loadLevel(data: any) {
        // 使用关卡数据创建场景
        data.platforms.forEach(platform => {
            // 创建平台...
        });
    }
}
```

### 方法三：数据内联到代码

对于小型数据，直接内联到代码中：
```typescript
// 关卡配置
const LEVEL_CONFIGS: Record<number, LevelConfig> = {
    1: {
        name: "初出茅庐",
        gravity: 980,
        platforms: [
            { x: 50, y: 270, width: 200, height: 40 },
            { x: 320, y: 220, width: 150, height: 30 }
        ]
    },
    2: {
        name: "步步高升",
        gravity: 980,
        platforms: [
            { x: 100, y: 300, width: 150, height: 40 },
            { x: 300, y: 250, width: 150, height: 40 }
        ]
    }
};
```

### JSON 转 JS 转换脚本

```javascript
// scripts/convert-json-to-js.js
import fs from 'fs';
import path from 'path';

const jsonDir = path.join(process.cwd(), 'src/assets/data');
const files = fs.readdirSync(jsonDir).filter(f => f.endsWith('.json'));

files.forEach(file => {
    const jsonPath = path.join(jsonDir, file);
    const jsPath = jsonPath.replace('.json', '.js');

    const content = fs.readFileSync(jsonPath, 'utf-8');
    const data = JSON.parse(content);

    // 生成 JS 模块
    const jsContent = `// 自动生成的关卡数据\nexport default ${JSON.stringify(data, null, 2)};\n`;

    fs.writeFileSync(jsPath, jsContent);
    console.log(`转换: ${file} -> ${path.basename(jsPath)}`);
});
```

### 构建时清理 JSON 文件

```javascript
// scripts/build-wechat.js (部分)
const dataDir = path.join(wechatDir, 'assets/data');
if (fs.existsSync(dataDir)) {
    const jsonFiles = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
    jsonFiles.forEach(file => {
        fs.unlinkSync(path.join(dataDir, file));
        console.log(`删除不需要的JSON: assets/data/${file}`);
    });
}
```

## 数据类型声明

```typescript
// src/assets/data.d.ts
export interface LevelData {
    levelId: number;
    name: string;
    gravity: number;
    player: {
        startPosition: [number, number];
        jumpForce: number;
        moveSpeed: number;
        doubleJumpEnabled: boolean;
    };
    platforms: PlatformData[];
    blocks: BlockData[];
    triggers: TriggerData[];
    buttons: ButtonData[];
    door: DoorData;
    enemies: EnemyData[];
}

export interface PlatformData {
    type: 'static' | 'moving' | 'disappearing';
    position: [number, number];
    size: [number, number];
    moveRange?: [number, number];
    moveSpeed?: number;
}

export interface BlockData {
    type: 'push' | 'break';
    position: [number, number];
    size: [number, number];
}

export interface TriggerData {
    type: 'death' | 'win' | 'checkpoint';
    position: [number, number];
    size: [number, number];
}

export interface ButtonData {
    id: string;
    position: [number, number];
    targetId: string;
}

export interface DoorData {
    position: [number, number];
    requires: string[];
}

export interface EnemyData {
    type: 'patrol' | 'chase';
    position: [number, number];
    range?: [number, number];
}
```

## 动态加载优化

对于大型项目，可以使用动态导入减少初始加载体积：

```typescript
// 关卡管理器
class LevelManager {
    private loadedLevels = new Map<number, LevelData>();

    async getLevel(levelId: number): Promise<LevelData> {
        // 如果已加载，直接返回
        if (this.loadedLevels.has(levelId)) {
            return this.loadedLevels.get(levelId)!;
        }

        // 动态导入
        const module = await import(`../assets/data/level${levelId}.js`);
        const levelData = module.default as LevelData;

        // 缓存
        this.loadedLevels.set(levelId, levelData);

        return levelData;
    }

    preloadLevels(...levelIds: number[]): Promise<void> {
        return Promise.all(levelIds.map(id => this.getLevel(id))).then(() => {});
    }

    unloadLevel(levelId: number): void {
        this.loadedLevels.delete(levelId);
    }
}
```

## 注意事项

1. **构建时转换**：确保 JSON 在构建前转换为 JS，或在构建流程中处理

2. **类型安全**：使用 TypeScript 类型声明确保数据结构正确

3. **代码分割**：大型数据集可以考虑动态导入，减少初始包体积

4. **版本控制**：JS 模块比 JSON 更容易进行版本比较和 diff

5. **编辑器兼容**：如果使用关卡编辑器，需要同时支持 JSON 导出和 JS 生成

6. **包体积限制**：微信小游戏主包限制 4MB，大型数据需要分包处理

7. **性能考虑**：所有数据打包到 JS 中会增加初始化时间，权衡利弊

## 相关文件

- `src/assets/data/level*.js` - 关卡数据模块
- `src/assets/data.d.ts` - 类型声明
- `scripts/convert-json-to-js.js` - JSON 转换脚本
- `scripts/build-wechat.js` - 构建脚本

## 参考资料

- [ES6 模块导入](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Modules)
- [微信小游戏分包加载](https://developers.weixin.qq.com/minigame/dev/guide/base-ability/subpackages.html)

# Phaser 配置和入口文件

## 问题描述

微信小游戏环境与浏览器环境有显著差异，Phaser 3 的默认配置无法直接使用。主要问题包括：

1. 微信不支持 `window.onload`，代码不能包装在其中
2. 微信没有 DOM 元素作为父容器，不能使用 `parent` 参数
3. 需要直接传递 `canvas` 参数
4. 缩放模式需要特殊配置

## 解决方案

创建专门的微信入口文件，直接执行初始化代码，使用适合微信环境的 Phaser 配置。

## 代码示例

### 微信入口文件 (wechat-entry.ts)

```typescript
/**
 * 微信小游戏入口文件
 * 不能使用 window.onload，代码必须直接执行
 */

// 导入平台适配器
import { platformManager } from './platform/PlatformManager';

// 导入 Phaser 和游戏配置
import Phaser from 'phaser';
import { LittleFrogGame, baseConfig } from './main';

// 类型声明
declare const wx: any;
declare const GameGlobal: any;

// ========== 直接执行，不使用 window.onload ==========
console.log('[Wechat-INIT] 游戏开始初始化...');

// 1. 初始化平台管理器
platformManager.init();

// 2. 获取 Canvas
let canvas: HTMLCanvasElement | undefined = (window as any).canvas;

if (!canvas) {
    canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
}

if (!canvas) {
    // 创建新 canvas（作为最后手段）
    canvas = document.createElement('canvas');
    canvas.id = 'game-canvas';
    canvas.width = 960;
    canvas.height = 640;
}

// 3. 创建微信环境专用的 Phaser 配置
const gameConfig: Phaser.Types.Core.GameConfig = {
    type: Phaser.WEBGL,

    // 尺寸
    width: 960,
    height: 640,

    // 关键：不使用 parent，直接传递 canvas
    parent: null,           // 必须设置为 null
    canvas: canvas,         // 直接传递 canvas 对象

    backgroundColor: '#2c3e50',

    // 物理引擎
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 980 },
            debug: false
        }
    },

    // 场景
    scene: baseConfig.scene,

    // 缩放配置 - 微信环境特殊处理
    scale: {
        mode: Phaser.Scale.NONE,      // 禁用自动缩放
        autoCenter: Phaser.Scale.NO_CENTER  // 不自动居中
    },

    // 渲染配置
    render: {
        pixelArt: true,
        antialias: false,
        roundPixels: true
    }
};

// 4. 微信环境特殊处理
if (typeof wx !== 'undefined') {
    const sysInfo = wx.getSystemInfoSync();
    console.log('[Wechat-INIT] 系统信息:', sysInfo);

    // 根据屏幕尺寸调整 canvas
    const screenWidth = sysInfo.screenWidth;
    const screenHeight = sysInfo.screenHeight;

    // 计算合适的游戏尺寸
    const aspectRatio = 960 / 640;
    let gameWidth = screenWidth;
    let gameHeight = screenWidth / aspectRatio;

    if (gameHeight > screenHeight) {
        gameHeight = screenHeight;
        gameWidth = gameHeight * aspectRatio;
    }

    // 更新 canvas 尺寸
    canvas.width = gameWidth;
    canvas.height = gameHeight;

    // 更新配置
    gameConfig.width = gameWidth;
    gameConfig.height = gameHeight;

    // 监听内存警告
    wx.onMemoryWarning(() => {
        console.warn('[Wechat] 内存警告，请优化资源使用');
        // 可以在这里释放一些资源
    });

    // 设置分享功能
    platformManager.setupShare('来玩小青蛙大冒险！');
}

// 5. 创建游戏实例
const game = new LittleFrogGame(gameConfig);
(window as any).game = game;

// 6. 启用多指触摸支持
// @ts-ignore - Phaser 3 运行时支持此属性
game.input.maxPointers = -1;  // -1 表示无限制

// 7. 监听游戏就绪
game.events.once('ready', () => {
    console.log('[Wechat-GAME] 游戏已就绪');
});

// 8. 隐藏加载动画
setTimeout(() => {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = 'none';
    }
}, 500);

console.log('[Wechat-INIT] 游戏初始化完成');

export {};
```

### game.json 配置

```json
{
  "deviceOrientation": "landscape",
  "showStatusBar": false,
  "networkTimeout": {
    "request": 10000,
    "downloadFile": 10000
  }
}
```

### Vite 构建配置

```typescript
// vite.config.ts
import { defineConfig, Plugin } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

// 注入 weapp-adapter 的插件
function wechatAdapterInject(): Plugin {
  return {
    name: 'wechat-adapter-inject',
    transformIndexHtml(html) {
      // 在游戏脚本前注入 weapp-adapter
      return html.replace(
        /(<script type="module"[^>]*src=")([^"]+)("[^>]*><\/script>)/,
        '<script src="/assets/weapp-adapter.js"></script>\n$1$2$3'
      );
    }
  };
}

export default defineConfig({
  plugins: [
    wechatAdapterInject(),
    viteStaticCopy({
      targets: [
        { src: 'project.wechat.json', dest: '.', rename: 'game.json' },
        { src: 'src/platforms/adapter/weapp-adapter.js', dest: 'assets' },
        { src: 'src/platforms/adapter/document-polyfill.js', dest: 'assets' }
      ]
    })
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'index.html',
        wechat: 'index.wechat.html'  // 构建微信版本
      }
    }
  }
});
```

## 配置参数说明

### parent vs canvas

| 参数 | 浏览器环境 | 微信环境 |
|------|-----------|---------|
| parent | 指定 DOM 父元素 | 必须为 null |
| canvas | 可选，Phaser 自动创建 | 必须传入全局 canvas |

### scale 模式

```typescript
// 微信环境推荐配置
scale: {
    mode: Phaser.Scale.NONE,      // 手动控制缩放
    autoCenter: Phaser.Scale.NO_CENTER
}

// 浏览器环境推荐配置
scale: {
    mode: Phaser.Scale.FIT,       // 自适应容器
    autoCenter: Phaser.Scale.CENTER_BOTH
}
```

## 注意事项

1. **不能使用 window.onload**：微信小游戏不支持，代码必须直接执行

2. **canvas 参数是必需的**：虽然文档说是可选的，但在微信环境必须显式传入

3. **parent 必须为 null**：告诉 Phaser 不要尝试操作 DOM 父元素

4. **横屏配置**：在 game.json 中设置 `deviceOrientation: "landscape"`

5. **尺寸适配**：根据 `wx.getSystemInfoSync()` 获取屏幕尺寸，动态计算游戏尺寸

6. **内存管理**：监听 `wx.onMemoryWarning()`，及时释放资源

7. **构建顺序**：
   ```bash
   npm run build          # 先构建到 dist/
   npm run build:wechat   # 再处理为微信格式到 dist-wechat/
   ```

## 相关文件

- `src/wechat-entry.ts` - 微信小游戏入口实现
- `src/main.ts` - H5 环境入口（可使用 window.onload）
- `project.wechat.json` - 微信小游戏配置
- `scripts/build-wechat.js` - 微信构建脚本

## 参考资料

- [微信小游戏 game.json 配置](https://developers.weixin.qq.com/minigame/dev/guide/framework-config.html)
- [Phaser 3 Scale Manager](https://newdocs.phaser.io/docs/3.60.0/Phaser.Scale.ScaleManager)

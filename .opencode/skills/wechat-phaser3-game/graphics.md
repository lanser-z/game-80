# Canvas API 纹理渲染

## 问题描述

微信小游戏环境中，Phaser 3 的 `Graphics.generateTexture()` 方法无法正常工作。这是因为微信小游戏的 Canvas 实现与浏览器环境存在差异，导致 Phaser 的 Graphics 对象无法正确生成纹理。

当尝试使用 `graphics.generateTexture()` 时，可能会遇到以下问题：
- 纹理生成失败，对象显示为空白
- 运行时错误："Cannot read property 'width' of undefined"
- 纹理加载超时

## 解决方案

使用原生 Canvas API 创建图形，然后通过 `scene.textures.addCanvas()` 将其添加到 Phaser 纹理管理器中。

## 代码示例

### 错误写法（浏览器方式）

```typescript
// 这种方式在微信小游戏中不工作
const graphics = this.add.graphics();
graphics.fillStyle(0x4a90d9, 0.6);
graphics.fillCircle(size / 2, size / 2, size / 2);
graphics.generateTexture('button-bg', size, size);
graphics.destroy();

const sprite = this.add.image(x, y, 'button-bg');
```

### 正确写法（微信小游戏兼容）

```typescript
/**
 * 使用 Canvas API 创建圆形按钮纹理
 * @param scene Phaser 场景
 * @param key 纹理键名
 * @param size 按钮尺寸
 * @param color 颜色值
 * @param alpha 透明度
 */
function createCircleTexture(
    scene: Phaser.Scene,
    key: string,
    size: number,
    color: number,
    alpha: number = 1
): void {
    // 1. 创建原生 Canvas 元素
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // 2. 使用 Canvas API 绘制圆形
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2;

    // 填充圆形
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${(color >> 16) & 0xff}, ${(color >> 8) & 0xff}, ${color & 0xff}, ${alpha})`;
    ctx.fill();

    // 绘制边框
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 3. 添加到 Phaser 纹理管理器
    scene.textures.addCanvas(key, canvas);
}

// 使用示例
export class ButtonFactory {
    static createButton(scene: Phaser.Scene, x: number, y: number, size: number): Phaser.GameObjects.Image {
        const textureKey = 'circle-button-blue';

        // 检查纹理是否已存在，避免重复创建
        if (!scene.textures.exists(textureKey)) {
            createCircleTexture(scene, textureKey, size, 0x4a90d9, 0.6);
        }

        return scene.add.image(x, y, textureKey);
    }
}
```

### 圆角矩形纹理示例

```typescript
/**
 * 创建圆角矩形纹理
 */
function createRoundedRectTexture(
    scene: Phaser.Scene,
    key: string,
    width: number,
    height: number,
    radius: number,
    color: number,
    alpha: number = 1
): void {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(width - radius, 0);
    ctx.quadraticCurveTo(width, 0, width, radius);
    ctx.lineTo(width, height - radius);
    ctx.quadraticCurveTo(width, height, width - radius, height);
    ctx.lineTo(radius, height);
    ctx.quadraticCurveTo(0, height, 0, height - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();

    ctx.fillStyle = `rgba(${(color >> 16) & 0xff}, ${(color >> 8) & 0xff}, ${color & 0xff}, ${alpha})`;
    ctx.fill();

    scene.textures.addCanvas(key, canvas);
}
```

### 图标纹理示例（带文字）

```typescript
/**
 * 创建带箭头图标的按钮纹理
 */
function createArrowButtonTexture(
    scene: Phaser.Scene,
    key: string,
    size: number,
    direction: 'left' | 'right' | 'up',
    bgColor: number,
    textColor: string = '#ffffff'
): void {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const centerX = size / 2;
    const centerY = size / 2;

    // 背景圆形
    ctx.beginPath();
    ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${(bgColor >> 16) & 0xff}, ${(bgColor >> 8) & 0xff}, ${bgColor & 0xff}, 0.6)`;
    ctx.fill();

    // 边框
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 绘制箭头
    ctx.fillStyle = textColor;
    ctx.font = `bold ${size * 0.5}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const arrows = {
        left: '◀',
        right: '▶',
        up: '⬆'
    };
    ctx.fillText(arrows[direction], centerX, centerY);

    scene.textures.addCanvas(key, canvas);
}

// 使用示例
createArrowButtonTexture(scene, 'btn-left', 80, 'left', 0x4a90d9);
const leftBtn = scene.add.image(x, y, 'btn-left');
```

## 注意事项

1. **纹理复用**：创建纹理前检查 `scene.textures.exists(key)`，避免重复创建相同纹理

2. **内存管理**：场景切换时清理不需要的纹理：
   ```typescript
   scene.events.on('shutdown', () => {
       scene.textures.remove('custom-texture-key');
   });
   ```

3. **Canvas 尺寸**：使用 2 的幂次方尺寸可获得更好性能（如 32, 64, 128, 256）

4. **颜色格式转换**：
   ```typescript
   // Phaser 颜色值转 CSS RGBA
   function phaserColorToRgba(color: number, alpha: number = 1): string {
       const r = (color >> 16) & 0xff;
       const g = (color >> 8) & 0xff;
       const b = color & 0xff;
       return `rgba(${r}, ${g}, ${b}, ${alpha})`;
   }
   ```

5. **高清屏支持**：如果需要支持 Retina 屏幕，考虑 devicePixelRatio：
   ```typescript
   const dpr = window.devicePixelRatio || 1;
   canvas.width = size * dpr;
   canvas.height = size * dpr;
   ctx.scale(dpr, dpr);
   ```

## 相关文件

- `src/objects/TouchControls.ts` - 虚拟按钮实现示例
- `src/scenes/BootScene.ts` - 场景初始化和纹理加载

## 参考资料

- [Canvas API - MDN](https://developer.mozilla.org/zh-CN/docs/Web/API/Canvas_API)
- [Phaser Texture Manager](https://newdocs.phaser.io/docs/3.60.0/Phaser.Textures.TextureManager)

# 多点触控虚拟按钮

## 问题描述

Phaser 3 默认只支持 1 个指针（pointer），这意味着玩家无法同时按下多个按钮。在平台游戏中，玩家需要同时按住方向键和跳跃键来进行斜向跳跃，因此需要启用多点触控支持。

微信小游戏环境支持多点触控，但需要正确配置 Phaser 才能使用。

## 解决方案

1. 使用 `scene.input.addPointer()` 添加额外的指针（最多 10 个）
2. 使用 Phaser Zone 对象创建不可见的触摸区域
3. 设置 `setScrollFactor(0)` 使 UI 固定在屏幕上
4. 监听 Zone 的触摸事件（pointerdown, pointerup, pointerupoutside）

## 代码示例

### 启用多点触控

```typescript
export class TouchControls {
    private scene: Phaser.Scene;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;

        // Phaser 3 默认只支持 1 个指针
        // 添加 4 个额外指针，总共支持 5 点触控
        for (let i = 1; i < 5; i++) {
            this.scene.input.addPointer();
        }

        console.log('[TouchControls] 多点触控已启用，指针数量:', this.scene.input.pointerCount);
    }
}
```

### 创建虚拟按钮区域

```typescript
/**
 * 创建虚拟方向按钮
 */
private createDirectionButtons(): void {
    const buttonSize = 80;
    const bottomMargin = 30;
    const screenWidth = this.scene.scale.width;
    const screenHeight = this.scene.scale.height;

    // 左移按钮
    const leftX = 60 + buttonSize / 2;
    const leftY = screenHeight - bottomMargin - buttonSize / 2;

    this.leftZone = this.scene.add.zone(
        leftX - buttonSize / 2,
        leftY - buttonSize / 2,
        buttonSize,
        buttonSize
    );
    this.leftZone.setOrigin(0);
    this.leftZone.setScrollFactor(0);  // 固定在屏幕上，不随相机移动
    this.leftZone.setInteractive();

    // 右移按钮
    const rightX = leftX + buttonSize + 20;

    this.rightZone = this.scene.add.zone(
        rightX - buttonSize / 2,
        leftY - buttonSize / 2,
        buttonSize,
        buttonSize
    );
    this.rightZone.setOrigin(0);
    this.rightZone.setScrollFactor(0);
    this.rightZone.setInteractive();
}
```

### 设置触摸事件

```typescript
/**
 * 设置触摸事件监听
 */
private setupTouchEvents(): void {
    // 左移按钮
    this.leftZone.on('pointerdown', () => {
        this.leftDown = true;
        this.updateButtonVisual(this.leftZone, true);
    });

    this.leftZone.on('pointerup', () => {
        this.leftDown = false;
        this.updateButtonVisual(this.leftZone, false);
    });

    // 必须处理 pointerupoutside，否则手指移出按钮区域后状态无法恢复
    this.leftZone.on('pointerupoutside', () => {
        this.leftDown = false;
        this.updateButtonVisual(this.leftZone, false);
    });

    // 右移按钮
    this.rightZone.on('pointerdown', () => {
        this.rightDown = true;
        this.updateButtonVisual(this.rightZone, true);
    });

    this.rightZone.on('pointerup', () => {
        this.rightDown = false;
        this.updateButtonVisual(this.rightZone, false);
    });

    this.rightZone.on('pointerupoutside', () => {
        this.rightDown = false;
        this.updateButtonVisual(this.rightZone, false);
    });

    // 跳跃按钮
    this.jumpZone.on('pointerdown', () => {
        this.jumpDown = true;
        this.jumpPressed = true;  // 记录按下瞬间
        this.updateButtonVisual(this.jumpZone, true);
    });

    this.jumpZone.on('pointerup', () => {
        this.jumpDown = false;
        this.updateButtonVisual(this.jumpZone, false);
    });

    this.jumpZone.on('pointerupoutside', () => {
        this.jumpDown = false;
        this.updateButtonVisual(this.jumpZone, false);
    });
}
```

### 完整实现示例

```typescript
/**
 * 虚拟按键控制 - 移动端触摸控制
 */
import Phaser from 'phaser';

export class TouchControls {
    private scene: Phaser.Scene;
    private leftZone!: Phaser.GameObjects.Zone;
    private rightZone!: Phaser.GameObjects.Zone;
    private jumpZone!: Phaser.GameObjects.Zone;

    // 按钮状态
    public leftDown: boolean = false;
    public rightDown: boolean = false;
    public jumpDown: boolean = false;
    public jumpPressed: boolean = false;

    private jumpPressedPrev: boolean = false;

    constructor(scene: Phaser.Scene, config: { buttonSize?: number } = {}) {
        this.scene = scene;

        // 启用多点触控
        for (let i = 1; i < 5; i++) {
            scene.input.addPointer();
        }

        this.createControls(config.buttonSize || 80);
        this.setupTouchEvents();
    }

    private createControls(buttonSize: number): void {
        const screenHeight = this.scene.scale.height;
        const bottomMargin = 30;
        const y = screenHeight - bottomMargin - buttonSize / 2;

        // 左移按钮
        this.leftZone = this.scene.add.zone(60, y - buttonSize / 2, buttonSize, buttonSize);
        this.leftZone.setOrigin(0);
        this.leftZone.setScrollFactor(0);
        this.leftZone.setInteractive();

        // 右移按钮
        this.rightZone = this.scene.add.zone(60 + buttonSize + 20, y - buttonSize / 2, buttonSize, buttonSize);
        this.rightZone.setOrigin(0);
        this.rightZone.setScrollFactor(0);
        this.rightZone.setInteractive();

        // 跳跃按钮
        const jumpX = this.scene.scale.width - 60 - buttonSize / 2;
        this.jumpZone = this.scene.add.zone(jumpX - buttonSize / 2, y - buttonSize / 2, buttonSize, buttonSize);
        this.jumpZone.setOrigin(0);
        this.jumpZone.setScrollFactor(0);
        this.jumpZone.setInteractive();

        // 创建视觉反馈（可选）
        this.createButtonVisuals(60, y, buttonSize);
        this.createButtonVisuals(60 + buttonSize + 20, y, buttonSize);
        this.createButtonVisuals(jumpX, y, buttonSize, 0xe67e22);
    }

    private createButtonVisuals(x: number, y: number, size: number, color: number = 0x4a90d9): void {
        const bg = this.scene.add.circle(x, y, size / 2, color, 0.6);
        bg.setStrokeStyle(3, 0xffffff, 0.8);
        bg.setScrollFactor(0);
    }

    private setupTouchEvents(): void {
        // 左移
        this.leftZone.on('pointerdown', () => this.leftDown = true);
        this.leftZone.on('pointerup', () => this.leftDown = false);
        this.leftZone.on('pointerupoutside', () => this.leftDown = false);

        // 右移
        this.rightZone.on('pointerdown', () => this.rightDown = true);
        this.rightZone.on('pointerup', () => this.rightDown = false);
        this.rightZone.on('pointerupoutside', () => this.rightDown = false);

        // 跳跃
        this.jumpZone.on('pointerdown', () => {
            this.jumpDown = true;
            this.jumpPressed = true;
        });
        this.jumpZone.on('pointerup', () => this.jumpDown = false);
        this.jumpZone.on('pointerupoutside', () => this.jumpDown = false);
    }

    /**
     * 每帧更新，返回跳跃是否刚刚按下
     */
    public update(): boolean {
        const justPressed = this.jumpPressed;
        this.jumpPressed = false;
        return justPressed;
    }

    public destroy(): void {
        this.leftZone.destroy();
        this.rightZone.destroy();
        this.jumpZone.destroy();
    }
}
```

### 在 Player 中使用

```typescript
export class Player extends Phaser.GameObjects.Container {
    private touchControls?: TouchControls;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);

        // 检测是否在移动环境，添加触摸控制
        if (this.isMobileEnvironment()) {
            this.touchControls = new TouchControls(scene);
        }
    }

    public update(delta: number): void {
        let moveLeft = false;
        let moveRight = false;
        let jump = false;

        // 键盘控制
        const cursors = this.scene.input.keyboard!.createCursorKeys();
        if (cursors.left.isDown) moveLeft = true;
        if (cursors.right.isDown) moveRight = true;
        if (cursors.space.isDown) jump = true;

        // 触摸控制
        if (this.touchControls) {
            if (this.touchControls.leftDown) moveLeft = true;
            if (this.touchControls.rightDown) moveRight = true;

            // 检测跳跃按钮的按下瞬间
            if (this.touchControls.update()) {
                jump = true;
            }
        }

        // 应用移动逻辑...
    }

    private isMobileEnvironment(): boolean {
        return !this.scene.input.keyboard!.enabled ||
               /Android|iPhone|iPad/i.test(navigator.userAgent);
    }
}
```

## 注意事项

1. **pointerupoutside 事件**：必须处理此事件，否则玩家手指滑出按钮区域后，按钮状态会卡住

2. **指针数量限制**：Phaser 3 最多支持 10 个指针，通常 4-5 个已足够

3. **UI 固定**：使用 `setScrollFactor(0)` 使 UI 不受相机影响，始终固定在屏幕上

4. **触摸区域**：Zone 应该略大于视觉元素，提供更好的触控体验

5. **按键冲突**：确保触摸控制和键盘控制可以同时工作，方便测试

6. **全局多点触控设置**：也可以在游戏级别设置：
   ```typescript
   // 在游戏配置后设置
   game.input.maxPointers = -1;  // -1 表示无限制
   ```

7. **检测移动环境**：
   ```typescript
   function isMobile(): boolean {
       // 方法1：检测触摸支持
       if ('ontouchstart' in window) return true;

       // 方法2：检测 User Agent
       if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) return true;

       // 方法3：检测屏幕宽度
       if (window.innerWidth < 768) return true;

       return false;
   }
   ```

## 相关文件

- `src/objects/TouchControls.ts` - 完整的虚拟按钮实现
- `src/objects/Player.ts` - 玩家控制集成示例

## 参考资料

- [Phaser Input Plugin](https://newdocs.phaser.io/docs/3.60.0/Phaser.Input.InputPlugin)
- [Phaser Zone GameObject](https://newdocs.phaser.io/docs/3.60.0/Phaser.GameObjects.Zone)

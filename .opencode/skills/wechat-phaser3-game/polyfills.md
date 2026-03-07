# 必要的 Polyfills

## 问题描述

微信小游戏环境不是完整的浏览器环境，缺少许多 Phaser 3 依赖的 DOM/BOM API。即使使用微信官方的 `weapp-adapter.js`，仍然有一些 API 需要手动补充。

主要缺失的 API：
- `document.elementFromPoint()` - Phaser 用于触摸检测
- `document.caretRangeFromPoint()` - 文本选择相关
- `document.createRange()` - DOM 范围操作
- `window.getSelection()` - 选区管理

## 解决方案

创建自定义 polyfill 文件，使用 `Object.defineProperty()` 方法添加缺失的 API。必须在 weapp-adapter.js 之后、游戏代码之前加载。

## 代码示例

### 完整 polyfill 文件

```javascript
/**
 * 微信小游戏 Document API Polyfill
 * 文件名: document-polyfill.js
 * 加载顺序: weapp-adapter.js -> document-polyfill.js -> 游戏代码
 */

(function() {
    'use strict';

    console.log('[DocumentPolyfill] 开始加载...');

    // ==================== document.elementFromPoint ====================
    // Phaser 3 使用此方法进行触摸点检测
    // 微信小游戏环境中只有一个 canvas，总是返回它
    if (typeof document !== 'undefined') {
        try {
            Object.defineProperty(document, 'elementFromPoint', {
                value: function(x, y) {
                    // 微信小游戏环境中返回全局 canvas
                    return window.canvas || null;
                },
                writable: true,
                configurable: true,
                enumerable: true
            });
            console.log('[DocumentPolyfill] document.elementFromPoint 已添加');
        } catch (e) {
            console.warn('[DocumentPolyfill] elementFromPoint 添加失败:', e);
        }
    }

    // ==================== document.caretRangeFromPoint ====================
    // 用于文本输入的选区定位
    if (typeof document !== 'undefined' && !document.caretRangeFromPoint) {
        Object.defineProperty(document, 'caretRangeFromPoint', {
            value: function(x, y) {
                // 返回空范围对象
                return null;
            },
            writable: true,
            configurable: true,
            enumerable: true
        });
        console.log('[DocumentPolyfill] document.caretRangeFromPoint 已添加');
    }

    // ==================== document.createRange ====================
    // 创建 DOM 范围对象
    if (typeof document !== 'undefined' && !document.createRange) {
        Object.defineProperty(document, 'createRange', {
            value: function() {
                // 返回模拟的 Range 对象
                return {
                    setStart: function() {},
                    setEnd: function() {},
                    collapse: function() {},
                    selectNodeContents: function() {},
                    deleteContents: function() {},
                    insertNode: function() {},
                    cloneContents: function() { return document.createElement('div'); },
                    commonAncestorContainer: document.body,
                    startContainer: document.body,
                    endContainer: document.body,
                    startOffset: 0,
                    endOffset: 0
                };
            },
            writable: true,
            configurable: true,
            enumerable: true
        });
        console.log('[DocumentPolyfill] document.createRange 已添加');
    }

    // ==================== window.getSelection ====================
    // 获取当前选区
    if (typeof window !== 'undefined' && !window.getSelection) {
        Object.defineProperty(window, 'getSelection', {
            value: function() {
                // 返回模拟的 Selection 对象
                return {
                    removeAllRanges: function() {},
                    addRange: function() {},
                    toString: function() { return ''; },
                    collapseToEnd: function() {},
                    collapseToStart: function() {},
                    anchorNode: null,
                    focusNode: null,
                    anchorOffset: 0,
                    focusOffset: 0,
                    rangeCount: 0,
                    getRangeAt: function() { return null; }
                };
            },
            writable: true,
            configurable: true,
            enumerable: true
        });
        console.log('[DocumentPolyfill] window.getSelection 已添加');
    }

    // ==================== window.scrollTo ====================
    // 页面滚动（微信小游戏不需要，但防止报错）
    if (typeof window !== 'undefined' && !window.scrollTo) {
        window.scrollTo = function() {};
    }

    // ==================== Element.classList.toggle ====================
    // 确保元素的 classList 存在
    if (typeof Element !== 'undefined') {
        const proto = Element.prototype;
        if (proto.classList && !proto.classList.toggle) {
            proto.classList.toggle = function(className) {
                const classes = this.className.split(' ');
                const index = classes.indexOf(className);
                if (index === -1) {
                    classes.push(className);
                } else {
                    classes.splice(index, 1);
                }
                this.className = classes.join(' ');
            };
        }
    }

    console.log('[DocumentPolyfill] 加载完成');
})();
```

### 游戏入口中的加载顺序

```javascript
// game.js - 微信小游戏的真正入口文件
// 加载顺序非常关键！

console.log('[game.js] 开始加载微信小游戏...');

// 1. MutationObserver polyfill (如果需要)
require('./assets/MutationObserver.js');

// 2. symbol.js (ES6 Symbol 支持)
require('./assets/symbol.js');

// 3. weapp-adapter.js (官方适配器，创建 window 和 document)
require('./assets/weapp-adapter.js');

// 4. document-polyfill.js (自定义补充，必须在 weapp-adapter 之后)
require('./assets/document-polyfill.js');

// 5. 游戏代码
require('./assets/game-wechat.js');

console.log('[game.js] 所有必要文件已加载');
```

### TypeScript 类型声明

```typescript
/**
 * src/types/wechat-polyfill.d.ts
 * 为 polyfill 添加类型声明
 */

declare global {
    interface Document {
        /**
         * 微信小游戏 polyfill
         * 总是返回全局 canvas
         */
        elementFromPoint(x: number, y: number): Element | null;

        /**
         * 微信小游戏 polyfill
         * 返回 null
         */
        caretRangeFromPoint(x: number, y: y: Range | null;

        /**
         * 微信小游戏 polyfill
         * 返回模拟的 Range 对象
         */
        createRange(): Range;
    }

    interface Window {
        /**
         * 微信小游戏 polyfill
         * 返回模拟的 Selection 对象
         */
        getSelection(): Selection;

        /**
         * 全局 canvas (weapp-adapter 提供)
         */
        canvas?: HTMLCanvasElement;
    }
}

export {};
```

## 加载顺序说明

正确的加载顺序至关重要：

```
1. MutationObserver.js
   ↓ (提供 DOM 观察者支持)

2. symbol.js
   ↓ (提供 ES6 Symbol 支持)

3. weapp-adapter.js
   ↓ (创建 window、document、canvas 等基础对象)

4. document-polyfill.js
   ↓ (补充 weapp-adapter 未提供的 API)

5. 游戏代码
```

如果顺序错误，会导致：
- 在 weapp-adapter 之前加载：document 对象不存在，报错
- 在游戏代码之后加载：Phaser 初始化时找不到 API，报错

## 注意事项

1. **使用 defineProperty**：直接赋值可能失败，因为微信环境中的属性可能是只读的

2. **try-catch 保护**：某些属性可能已经存在，重复添加会报错

3. **最小化 polyfill**：只添加 Phaser 实际需要的 API，减少代码体积

4. **测试覆盖**：在真机上测试，模拟器可能与真机行为不同

5. **版本兼容性**：微信基础库更新可能改变环境，定期测试

6. **性能考虑**：polyfill 在每次调用时执行，避免复杂计算

## 调试技巧

```javascript
// 在 polyfill 后添加验证代码
console.log('[PolyfillCheck] document.elementFromPoint:', typeof document.elementFromPoint);
console.log('[PolyfillCheck] window.getSelection:', typeof window.getSelection);
console.log('[PolyfillCheck] window.canvas:', window.canvas);
```

## 相关文件

- `src/platforms/adapter/document-polyfill.js` - 项目中的 polyfill 实现
- `src/platforms/adapter/weapp-adapter.js` - 微信官方适配器
- `scripts/build-wechat.js` - 构建脚本，处理加载顺序

## 参考资料

- [微信小游戏适配器 weapp-adapter](https://developers.weixin.qq.com/minigame/dev/guide/runtime/adapter.html)
- [MDN - Object.defineProperty](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty)

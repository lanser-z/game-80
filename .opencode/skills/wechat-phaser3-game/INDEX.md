# 微信小游戏适配技能索引

本目录包含 Phaser 3 游戏适配微信小游戏平台的相关技能文档。

## 技能文档列表

### 1. [Canvas API 纹理渲染](./graphics.md)
**问题**：微信小游戏不支持 Phaser Graphics 的 `generateTexture()` 方法
**解决**：使用原生 Canvas API 创建纹理，然后用 `scene.textures.addCanvas(key, canvas)`

### 2. [多点触控虚拟按钮](./multi-touch.md)
**问题**：Phaser 3 默认只支持 1 个指针，无法同时按下多个按钮
**解决**：使用 `scene.input.addPointer()` 添加额外指针，使用 Zone 对象创建虚拟按钮

### 3. [必要的 Polyfills](./polyfills.md)
**问题**：Phaser 需要 `document.elementFromPoint()` 等方法，但微信不提供
**解决**：创建 polyfill 文件，使用 `Object.defineProperty()` 添加缺失的 API

### 4. [Phaser 配置和入口文件](./config.md)
**问题**：微信不支持 `window.onload`，没有 DOM 元素作为父容器
**解决**：创建专门的微信入口文件，直接执行初始化，使用适合微信的配置

### 5. [数据加载方式](./data-loading.md)
**问题**：微信小游戏不支持 XHR 加载本地 JSON 文件
**解决**：将 JSON 转换为 JS 模块，使用 ES import 导入

## 快速开始

### 开发环境设置

```bash
# 1. 安装依赖
npm install

# 2. 开发模式（H5）
npm run dev

# 3. 构建微信小游戏
npm run build:wechat
```

### 核心适配文件

```
src/
├── wechat-entry.ts           # 微信入口文件
├── polyfill.ts               # 自定义 polyfill
├── platform/
│   ├── PlatformManager.ts    # 平台管理器
│   └── WechatAdapter.ts      # 微信 API 适配
└── objects/
    └── TouchControls.ts      # 多点触控虚拟按钮

scripts/
├── build-wechat.js           # 微信构建脚本
└── convert-json-to-js.js     # JSON 转 JS 转换器
```

## 加载顺序

微信小游戏的脚本加载顺序非常重要：

```
1. MutationObserver.js      → DOM 观察器支持
2. symbol.js                → ES6 Symbol 支持
3. weapp-adapter.js         → 官方适配器（创建 window/document）
4. document-polyfill.js     → 自定义补充
5. 游戏代码                 → Phaser + 游戏逻辑
```

## 常见问题

### Q: 为什么纹理显示不出来？
A: 微信环境不支持 `graphics.generateTexture()`，请使用 Canvas API 创建纹理。详见 [graphics.md](./graphics.md)。

### Q: 为什么不能同时按多个按钮？
A: 需要调用 `scene.input.addPointer()` 启用多点触控。详见 [multi-touch.md](./multi-touch.md)。

### Q: 报错 "document.elementFromPoint is not a function"
A: 需要加载 document-polyfill.js，确保加载顺序正确。详见 [polyfills.md](./polyfills.md)。

### Q: 游戏黑屏，没有初始化
A: 检查是否使用了 `window.onload`，微信不支持。详见 [config.md](./config.md)。

### Q: JSON 数据加载失败
A: 微信不支持 XHR 加载本地文件，需要转换为 JS 模块。详见 [data-loading.md](./data-loading.md)。

## 参考资料

- [微信小游戏官方文档](https://developers.weixin.qq.com/minigame/dev/guide/)
- [Phaser 3 官方文档](https://newdocs.phaser.io/docs/3.60.0/)
- [项目 WECHAT_GUIDE.md](../../WECHAT_GUIDE.md)

## 更新日期

**最后更新**：2026-02-27

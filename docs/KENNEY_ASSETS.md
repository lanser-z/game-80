# Kenney.nl 游戏素材资源清单

本文档记录了可用于「八十！八十！」砸墙游戏的 Kenney.nl 素材资源。

## 概述

Kenney.nl 提供大量 CC0 许可证（Creative Commons Zero）的游戏素材，可免费用于商业项目，无需署名。

---

## 核心需求映射

| 游戏元素 | 所需素材 | 优先级 |
|----------|----------|--------|
| 积木块 | 砖块纹理、方块贴图 | P0 |
| 墙体背景 | 墙面纹理、背景图 | P0 |
| 锤子道具 | 工具类素材 | P0 |
| UI 界面 | 按钮、面板、图标 | P0 |
| 砸墙特效 | 粒子效果、碎片 | P1 |
| 背景音/音效 | 音频素材 | P0 |

---

## 推荐资源包

### 1. Retro City Pack（推荐）

- **资源数量**: 500+ 个素材
- **包含内容**:
  - 砖块/方块贴图（多种颜色）
  - 建筑物纹理
  - 墙面/地面材质
- **适用场景**: 积木块贴图、墙体背景
- **链接**: https://kenney.nl/assets/retro-city

---

### 2. Dungeon Delux（地牢素材包）

- **资源数量**: 480+ 个素材
- **包含内容**:
  - 石块/砖块贴图
  - 地面纹理
  - 墙面材质
- **适用场景**: 不同材质积木块（石头、砖块）
- **链接**: https://kenney.nl/assets/dungeon-delux

---

### 3. Board Game Icons（桌游图标）

- **资源数量**: 300+ 个素材
- **包含内容**:
  - 锤子/工具图标
  - 方块/积木图标
  - UI 元素
- **适用场景**: 道具图标、UI 按钮
- **链接**: https://kenney.nl/assets/board-game-icons

---

### 4. UI Pack（UI 素材包）

- **资源数量**: 240+ 个素材
- **包含内容**:
  - 按钮（多种样式）
  - 对话框/面板
  - 进度条
  - 图标框架
- **适用场景**: 游戏 UI 界面、HUD 显示
- **链接**: https://kenney.nl/assets/ui-pack

---

### 5. Abstract Platformer（抽象平台跳跃）

- **资源数量**: 320+ 个素材
- **包含内容**:
  - 几何形状方块
  - 简洁纹理
  - 背景元素
- **适用场景**: 简洁风格积木块
- **链接**: https://kenney.nl/assets/abstract-platformer

---

### 6. Prototype Textures（原型纹理）

- **资源数量**: 90+ 个素材
- **包含内容**:
  - 基础几何纹理
  - 网格图案
  - 简单色块
- **适用场景**: 开发阶段占位图、简约风格
- **链接**: https://kenney.nl/assets/prototype-textures

---

### 7. Game Audio（游戏音效）

- **资源数量**: 200+ 个音效
- **包含内容**:
  - 撞击音效
  - 破碎音效
  - UI 点击音效
  - 背景音乐
- **适用场景**: 砸墙音效、UI 音效、背景音乐
- **链接**: https://kenney.nl/assets/game-audio

---

## 素材使用映射

### 积木块贴图

| 积木类型 | 推荐素材 | 来源包 |
|----------|----------|--------|
| 泥土块 | brown_tile / dirt | Dungeon Delux |
| 瓷砖块 | tile_01 / tile_02 | Retro City |
| 大理石 | stone_wall / marble | Dungeon Delux |
| 金属块 | metal_tile / steel | Prototype Textures |

### UI 元素

| UI 元素 | 推荐素材 | 来源包 |
|----------|----------|--------|
| 预算显示 | panel_blue / info_box | UI Pack |
| 关卡按钮 | button_* | UI Pack |
| 道具图标 | icon_* | Board Game Icons |
| 排行榜面板 | panel_long | UI Pack |

---

## 下载和整理

### 目录结构建议

```
assets/
├── images/
│   ├── blocks/          # 积木块贴图
│   │   ├── dirt.png
│   │   ├── tile.png
│   │   ├── marble.png
│   │   └── metal.png
│   ├── ui/              # UI 素材
│   │   ├── buttons/
│   │   ├── panels/
│   │   └── icons/
│   ├── backgrounds/     # 背景贴图
│   │   └── wall_bg.png
│   └── effects/         # 特效贴图
│       └── particles/
├── audio/
│   ├── sfx/             # 音效
│   │   ├── hit.wav
│   │   ├── collapse.wav
│   │   └── ui_click.wav
│   └── music/           # 背景音乐
│       └── bgm_title.mp3
└── data/                # 数据文件
    └── levels/
```

---

## 许可证说明

所有 Kenney.nl 素材采用 **CC0 (Creative Commons Zero)** 许可证：

- ✅ 可用于商业项目
- ✅ 无需署名（但欢迎标注）
- ✅ 可自由修改和再分发
- ✅ 无使用数量限制

---

## 后续资源扩展

如果需要更多样化的素材，可以考虑：

1. **Kenney 付费包** - 更多高质量素材
2. **OpenGameArt.org** - 开源游戏素材社区
3. **Itch.io 素材区** - 独立游戏素材市场
4. **自定义美术** - 聘请美术设计师定制

---

*最后更新：2026-03-07*

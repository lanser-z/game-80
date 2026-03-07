# 八十！八十！- 砸墙解谜游戏

一款使用 Phaser 3 开发的益智解谜游戏，支持发布到微信、抖音、支付宝小游戏平台。

## 项目状态

### Milestone 1 - PC 端核心玩法 ✅ 开发中

- [x] 项目初始化
- [x] 砸墙核心玩法实现
- [x] 积木块类型和贴图
- [x] 物理重心计算
- [x] 墙体倒塌效果
- [x] 预算系统
- [x] 基础关卡 (3 关)
- [x] 音效系统

### Milestone 2 - 微信小游戏 + 后端 🔄 计划中

- [ ] 后端服务开发
- [ ] 用户数据存储
- [ ] 商店系统
- [ ] 道具系统
- [ ] 排行榜系统
- [ ] 微信小游戏适配
- [ ] 完整关卡 (30 关+)

### Milestone 3 - 多平台适配 📋 待办

- [ ] 抖音小游戏适配
- [ ] 支付宝小游戏适配
- [ ] 跨平台数据统计
- [ ] 好友排行榜
- [ ] 性能优化

## 目录结构

```
game-80/
├── docs/                    # 文档
│   ├── requirements/        # 需求文档
│   ├── architecture/        # 架构设计
│   └── KENNEY_ASSETS.md    # 美术资源清单
├── frontend/                # 前端代码 (Phaser 3)
│   ├── src/
│   ├── assets/
│   └── dist/
├── backend/                 # 后端代码 (Golang) - 待开发
└── README.md
```

## 快速开始

### 前端开发

```bash
cd frontend
npm install
npm run dev
```

访问 http://localhost:3000 查看游戏

### 构建

```bash
cd frontend
npm run build
```

## 游戏玩法

1. **目标**: 在预算内让墙体倒塌
2. **操作**: 点击积木块砸墙
3. **预算**: 每关 1000 元，砸一下 80 元
4. **私房钱**: 过关后剩余预算累计
5. **道具**: 每 3 关可进商店购买道具

### 积木块类型

| 类型 | 抗砸次数 | 颜色 |
|------|----------|------|
| 泥土块 | 1 次 | 棕色 |
| 瓷砖块 | 2 次 | 橙色 |
| 大理石 | 3 次 | 米色 |
| 金属块 | 5 次 | 灰色 |

### 按键

- **鼠标点击/触摸**: 砸墙
- **G 键**: 显示/隐藏重心分析镜

## 技术栈

- **前端**: Phaser 3 + TypeScript + Vite
- **后端**: Golang + PostgreSQL (Milestone 2)
- **物理引擎**: Phaser Matter.js

## 文档

- [需求分析](docs/requirements/requirements-analysis.md)
- [架构设计](docs/architecture/system-design.md)
- [美术资源](docs/KENNEY_ASSETS.md)

## 开发建议

1. 前端使用 Phaser 3 框架
2. 按 TDD 方式开发，保证代码质量
3. 需要外部资源时停下来求助

## 贡献

本项目为学习演示项目

## 许可证

MIT

---

*版本：v0.1.0*
*最后更新：2026-03-07*

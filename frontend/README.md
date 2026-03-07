# 八十！八十！- 砸墙解谜游戏

一款使用 Phaser 3 开发的益智解谜游戏，支持发布到微信、抖音、支付宝小游戏平台。

## 游戏说明

### 核心玩法
- 在积木块拼成的墙上点击砸墙，砸掉一块块积木
- 直到整面墙重心失去支撑垮塌为止
- 每局有总预算（1000 元），砸一下 80 元
- 预算花光了墙没倒塌则闯关失败
- 过关后剩余预算装入私房钱袋

### 操作方式
- **鼠标点击**: 点击积木块砸墙
- **触摸控制**: 移动端单点触控

### 按键
- **G 键**: 切换重心分析镜（显示重心位置）

## 项目结构

```
frontend/
├── src/
│   ├── main.ts              # 游戏入口
│   ├── config.ts            # 游戏配置
│   ├── scenes/              # 场景定义
│   │   ├── BootScene.ts     # 启动场景（资源加载）
│   │   ├── MenuScene.ts     # 菜单场景
│   │   └── GameScene.ts     # 游戏主场景
│   ├── entities/            # 游戏实体
│   │   ├── Wall.ts          # 墙体类
│   │   └── Block.ts         # 积木块类
│   ├── physics/             # 物理相关
│   │   └── GravityCalculator.ts  # 重心计算
│   ├── managers/            # 管理器
│   │   ├── BudgetManager.ts # 预算管理
│   │   └── AudioManager.ts  # 音频管理
│   └── ui/                  # UI 组件
│       └── HUD.ts           # 抬头显示
├── assets/                  # 静态资源
├── dist/                    # 构建输出
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 开发环境

### 前置要求
- Node.js 18+
- npm 或 yarn

### 安装依赖
```bash
cd frontend
npm install
```

### 开发模式
```bash
npm run dev
```
访问 http://localhost:3000 查看游戏

### 构建生产版本
```bash
npm run build
```
构建输出到 `../dist` 目录

### 微信小游戏构建
```bash
npm run build:wechat
```

## 技术栈

- **前端引擎**: Phaser 3.80.1
- **语言**: TypeScript 5.3.3
- **构建工具**: Vite 5
- **物理引擎**: Phaser Matter.js（内置）

## 当前功能 (Milestone 1)

✅ 砸墙核心玩法
✅ 积木块类型（泥土、瓷砖、大理石、金属）
✅ 物理重心计算
✅ 墙体倒塌效果
✅ 预算系统
✅ 音效系统（Web Audio API 合成音效）
✅ 3 个测试关卡
✅ 星星评价系统
✅ 游戏进度保存

## 待开发功能 (Milestone 2/3)

- [ ] 后端服务（Golang）
- [ ] 商店系统
- [ ] 道具系统
- [ ] 排行榜系统
- [ ] 微信小游戏适配
- [ ] 抖音/支付宝小游戏适配
- [ ] 更多关卡（30+）

## 游戏截图

运行 `npm run dev` 后在浏览器中查看

## 许可证

MIT

---

*版本：v0.1.0 (Milestone 1 开发中)*
*最后更新：2026-03-07*

# 八十！八十！架构设计文档

## 1. 架构概述

### 1.1 系统架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                         客户端层                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  PC 网页     │  │ 微信小游戏  │  │  其他平台 (抖音/支付宝)  │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│                    Phaser 3 游戏引擎                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API 网关层                               │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              Nginx / API Gateway                            ││
│  │         (负载均衡、限流、鉴权)                               ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         服务层                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐│
│  │ 用户服务  │  │ 游戏服务  │  │ 排行榜服务│  │ 商店/道具服务    ││
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘│
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────────────────┤
│  │ 关卡服务  │  │ 统计服务  │  │ 日志/监控服务                   ││
│  └──────────┘  └──────────┘  └──────────────────────────────────┤
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         数据层                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐  │
│  │   PostgreSQL     │  │     Redis        │  │  对象存储      │  │
│  │   (主数据库)      │  │   (缓存/排行)     │  │  (静态资源)    │  │
│  └──────────────────┘  └──────────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 技术栈选型

| 层次 | 技术选型 | 理由 |
|------|----------|------|
| 前端引擎 | Phaser 3 | 成熟的游戏框架，支持多平台发布 |
| 前端语言 | TypeScript | 类型安全，便于维护 |
| 后端语言 | Golang | 高性能，并发能力强，部署简单 |
| 主数据库 | PostgreSQL | 关系型，支持复杂查询，数据一致性好 |
| 缓存 | Redis | 高性能，适合排行榜等场景 |
| 对象存储 | 阿里云 OSS/腾讯云 COS | 静态资源 CDN 加速 |

---

## 2. 前端架构

### 2.1 目录结构

```
frontend/
├── src/
│   ├── main.ts              # 游戏入口
│   ├── config.ts            # 游戏配置
│   ├── scenes/              # 场景定义
│   │   ├── BootScene.ts     # 启动场景
│   │   ├── MenuScene.ts     # 菜单场景
│   │   ├── GameScene.ts     # 游戏主场景
│   │   ├── ShopScene.ts     # 商店场景
│   │   └── UIScene.ts       # UI 场景
│   ├── entities/            # 游戏实体
│   │   ├── Wall.ts          # 墙体类
│   │   ├── Block.ts         # 积木块类
│   │   └── Hammer.ts        # 锤子类
│   ├── physics/             # 物理相关
│   │   ├── GravityCalculator.ts  # 重心计算
│   │   └── CollapseDetector.ts   # 倒塌检测
│   ├── managers/            # 管理器
│   │   ├── GameManager.ts   # 游戏状态管理
│   │   ├── BudgetManager.ts # 预算管理
│   │   ├── InventoryManager.ts # 道具管理
│   │   └── AudioManager.ts  # 音频管理
│   ├── ui/                  # UI 组件
│   │   ├── HUD.ts           # 抬头显示
│   │   ├── Dialog.ts        # 对话框
│   │   └── Button.ts        # 按钮组件
│   ├── api/                 # API 调用
│   │   ├── client.ts        # HTTP 客户端
│   │   ├── user.ts          # 用户 API
│   │   ├── game.ts          # 游戏 API
│   │   └── leaderboard.ts   # 排行榜 API
│   ├── utils/               # 工具函数
│   └── types/               # 类型定义
├── assets/                  # 静态资源
│   ├── images/              # 图片资源
│   ├── audio/               # 音频资源
│   └── data/                # 数据文件 (关卡配置等)
├── platform/                # 平台适配层
│   ├── wechat/              # 微信小游戏
│   ├── douyin/              # 抖音小游戏
│   └── alipay/              # 支付宝小游戏
└── public/                  # 发布目录
```

### 2.2 核心类设计

#### 2.2.1 Block (积木块类)

```typescript
interface BlockType {
  name: string;
  health: number;      // 抗砸次数
  texture: string;     // 纹理名称
  weight: number;      // 重量 (影响重心)
}

class Block extends Phaser.GameObjects.Sprite {
  private currentHealth: number;
  private blockType: BlockType;
  private position: Vector2;

  hit(damage: number): boolean;  // 返回是否被摧毁
  getWeight(): number;
  getPosition(): Vector2;
}
```

#### 2.2.2 Wall (墙体类)

```typescript
class Wall {
  private blocks: Block[];
  private width: number;
  private height: number;

  calculateCenterOfGravity(): Vector2;  // 计算重心
  checkSupport(): boolean;               // 检查是否有支撑
  removeBlock(block: Block): void;       // 移除积木
  collapse(): void;                      // 播放倒塌动画
  getBlocks(): Block[];
}
```

#### 2.2.3 GravityCalculator (重心计算器)

```typescript
class GravityCalculator {
  // 计算墙体重心
  static calculateCenterOfGravity(blocks: Block[]): Vector2 {
    // 使用质心公式：Σ(mi * ri) / Σmi
  }

  // 检查重心是否在支撑面内
  static isSupported(center: Vector2, supportBlocks: Block[]): boolean {
    // 判断重心投影是否在支撑多边形内
  }
}
```

### 2.3 场景流程

```
┌──────────┐    ┌──────────┐    ┌──────────┐
│  Boot    │───▶│   Menu   │───▶│   Game   │
│  Scene   │    │  Scene   │    │  Scene   │
└──────────┘    └──────────┘    └──────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
              ┌──────────┐    ┌──────────┐    ┌──────────┐
              │   Shop   │    │   UI     │    │  Result  │
              │  Scene   │    │  Scene   │    │  Scene   │
              └──────────┘    └──────────┘    └──────────┘
```

### 2.4 平台适配层

```typescript
// platform/adapter.ts
interface PlatformAdapter {
  init(): Promise<void>;
  login(): Promise<UserInfo>;
  saveCloudData(data: any): Promise<void>;
  loadCloudData(): Promise<any>;
  share(params: ShareParams): Promise<void>;
  getRegion(): Promise<string>;  // 获取用户地区
}

// 各平台实现
class WechatAdapter implements PlatformAdapter { ... }
class DouyinAdapter implements PlatformAdapter { ... }
class AlipayAdapter implements PlatformAdapter { ... }
class WebAdapter implements PlatformAdapter { ... }
```

---

## 3. 后端架构

### 3.1 服务划分

#### 3.1.1 用户服务 (user-service)

```
职责:
- 用户注册/登录
- 用户信息管理
- 跨平台账号绑定

API:
POST   /api/v1/user/login        # 登录
GET    /api/v1/user/profile      # 获取用户信息
PUT    /api/v1/user/region       # 更新地区
POST   /api/v1/user/bind         # 绑定跨平台账号
```

#### 3.1.2 游戏服务 (game-service)

```
职责:
- 关卡状态管理
- 游戏进度保存
- 预算和私房钱管理
- 道具使用验证

API:
POST   /api/v1/game/start        # 开始关卡
POST   /api/v1/game/hit          # 砸墙动作
POST   /api/v1/game/complete     # 完成关卡
GET    /api/v1/game/progress     # 获取进度
POST   /api/v1/game/use-item     # 使用道具
```

#### 3.1.3 排行榜服务 (leaderboard-service)

```
职责:
- 区域私房钱排行
- 个人排行
- 好友排行

API:
GET    /api/v1/leaderboard/region    # 区域排行
GET    /api/v1/leaderboard/progress  # 通关数排行
GET    /api/v1/leaderboard/money     # 私房钱排行
GET    /api/v1/leaderboard/friends   # 好友排行
```

#### 3.1.4 商店服务 (shop-service)

```
职责:
- 道具库存管理
- 购买交易处理
- 道具效果验证

API:
GET    /api/v1/shop/items        # 可购买道具列表
POST   /api/v1/shop/buy          # 购买道具
GET    /api/v1/shop/inventory    # 道具库存
```

### 3.2 目录结构

```
backend/
├── cmd/
│   └── server/
│       └── main.go           # 程序入口
├── internal/
│   ├── config/               # 配置管理
│   ├── handlers/             # HTTP 处理器
│   │   ├── user/
│   │   ├── game/
│   │   ├── leaderboard/
│   │   └── shop/
│   ├── services/             # 业务逻辑层
│   │   ├── user/
│   │   ├── game/
│   │   ├── leaderboard/
│   │   └── shop/
│   ├── repository/           # 数据访问层
│   │   ├── user/
│   │   ├── game/
│   │   └── ...
│   ├── models/               # 数据模型
│   ├── middleware/           # 中间件
│   │   ├── auth.go           # 鉴权
│   │   ├── ratelimit.go      # 限流
│   │   └── logging.go        # 日志
│   └── platform/             # 平台适配
│       ├── wechat/
│       ├── douyin/
│       └── alipay/
├── pkg/                      # 公共包
│   ├── logger/
│   ├── redis/
│   └── postgres/
├── migrations/               # 数据库迁移
├── configs/                  # 配置文件
├── scripts/                  # 脚本
├── go.mod
├── go.sum
└── Makefile
```

---

## 4. 数据库设计

### 4.1 ER 图

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    users     │       │   game_logs  │       │   levels     │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id           │◀──────│ user_id      │       │ id           │
│ platform     │       │ level_id     │──────▶│ level_data   │
│ open_id      │       │ budget_used  │       │ budget_limit │
│ region       │       │ is_success   │       │ difficulty   │
│ created_at   │       │ created_at   │       │ created_at   │
└──────────────┘       └──────────────┘       └──────────────┘
       │                       │
       │                       │
       ▼                       ▼
┌──────────────┐       ┌──────────────┐
│  inventories │       │  leaderboards│
├──────────────┤       ├──────────────┤
│ id           │       │ user_id      │
│ user_id      │       │ total_money  │
│ item_id      │       │ max_level    │
│ quantity     │       │ region       │
│ updated_at   │       │ updated_at   │
└──────────────┘       └──────────────┘
```

### 4.2 表结构

#### 4.2.1 users (用户表)

```sql
CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    platform        VARCHAR(20) NOT NULL,      -- wechat/douyin/alipay/web
    open_id         VARCHAR(128) NOT NULL,     -- 平台用户 ID
    union_id        VARCHAR(128),              -- 跨平台统一 ID
    region          VARCHAR(50),               -- 用户地区
    nickname        VARCHAR(64),
    avatar_url      VARCHAR(256),
    total_money     BIGINT DEFAULT 0,          -- 总私房钱
    max_level       INT DEFAULT 0,             -- 最高通关数
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE KEY uk_platform_open_id (platform, open_id),
    KEY idx_region (region),
    KEY idx_total_money (total_money),
    KEY idx_max_level (max_level)
);
```

#### 4.2.2 game_logs (游戏记录表)

```sql
CREATE TABLE game_logs (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    level_id        INT NOT NULL,
    budget_initial  INT NOT NULL,            -- 初始预算
    budget_used     INT NOT NULL,            -- 已用预算
    is_success      BOOLEAN DEFAULT FALSE,   -- 是否成功
    block_hits      JSONB,                   -- 每块积木的砸击次数 {"block_id": hits}
    items_used      JSONB,                   -- 使用的道具 [{"item_id": "hammer", "count": 1}]
    duration_sec    INT,                     -- 耗时 (秒)
    created_at      TIMESTAMPTZ DEFAULT NOW(),

    KEY idx_user_level (user_id, level_id),
    KEY idx_created_at (created_at)
);
```

#### 4.2.3 inventories (道具库存表)

```sql
CREATE TABLE inventories (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    item_id         VARCHAR(32) NOT NULL,    -- 道具 ID
    quantity        INT NOT NULL DEFAULT 0,
    updated_at      TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE KEY uk_user_item (user_id, item_id),
    KEY idx_user_id (user_id)
);
```

#### 4.2.4 levels (关卡配置表)

```sql
CREATE TABLE levels (
    id              INT PRIMARY KEY,
    level_data      JSONB NOT NULL,          -- 关卡布局数据
    budget_limit    INT NOT NULL,            -- 预算限制
    difficulty      VARCHAR(20),             -- easy/normal/hard/expert
    wall_config     JSONB,                   -- 墙体配置
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

#### 4.2.5 leaderboards (排行榜缓存表 - Redis 为主，此表为持久化备份)

```sql
CREATE TABLE leaderboards (
    user_id         BIGINT PRIMARY KEY,
    total_money     BIGINT DEFAULT 0,
    max_level       INT DEFAULT 0,
    region          VARCHAR(50),
    region_rank     INT,                     -- 区域内排名
    global_rank     INT,                     -- 全局排名
    updated_at      TIMESTAMPTZ DEFAULT NOW(),

    KEY idx_region_rank (region, region_rank),
    KEY idx_global_rank (global_rank)
);
```

### 4.3 Redis 数据结构

```
# 区域私房钱排行 (Sorted Set)
leaderboard:region:{region_code}:money
  member: user_id
  score: total_money

# 全局通关数排行 (Sorted Set)
leaderboard:global:level
  member: user_id
  score: max_level

# 全局私房钱排行 (Sorted Set)
leaderboard:global:money
  member: user_id
  score: total_money

# 用户会话 (Hash)
session:{session_id}
  user_id: xxx
  platform: xxx
  expires_at: xxx

# 用户道具库存 (Hash)
inventory:{user_id}
  {item_id}: quantity
```

---

## 5. API 设计

### 5.1 统一响应格式

```typescript
interface ApiResponse<T> {
  code: number;           // 0 表示成功，其他表示错误码
  message: string;        // 错误信息 (成功时为空)
  data: T | null;         // 响应数据
  trace_id: string;       // 链路追踪 ID
}

// 成功响应示例
{
  "code": 0,
  "message": "success",
  "data": { ... },
  "trace_id": "abc123xyz"
}

// 错误响应示例
{
  "code": 10001,
  "message": "预算不足",
  "data": null,
  "trace_id": "abc123xyz"
}
```

### 5.2 核心 API

#### 5.2.1 游戏接口

```typescript
// 开始关卡
POST /api/v1/game/start
Request:
{
  "level_id": 1
}
Response:
{
  "code": 0,
  "data": {
    "session_id": "xxx",
    "level_config": { ... },
    "budget": 1000,
    "blocks": [...]
  }
}

// 砸墙动作
POST /api/v1/game/hit
Request:
{
  "session_id": "xxx",
  "block_id": "block_1_2",
  "item_used": null  // 或 {"item_id": "hammer", "count": 1}
}
Response:
{
  "code": 0,
  "data": {
    "block_destroyed": true,
    "remaining_budget": 920,
    "is_collapsed": false,
    "center_of_gravity": {"x": 5.5, "y": 3.2}
  }
}

// 完成关卡
POST /api/v1/game/complete
Request:
{
  "session_id": "xxx",
  "is_success": true
}
Response:
{
  "code": 0,
  "data": {
    "remaining_budget": 440,
    "money_added": 440,
    "new_level_unlocked": 6
  }
}
```

#### 5.2.2 排行榜接口

```typescript
// 获取区域排行
GET /api/v1/leaderboard/region?region=zhejiang&limit=100
Response:
{
  "code": 0,
  "data": {
    "region": "zhejiang",
    "rankings": [
      {"rank": 1, "user_id": "xxx", "nickname": "玩家 A", "total_money": 5000},
      {"rank": 2, "user_id": "xxx", "nickname": "玩家 B", "total_money": 4800}
    ],
    "user_rank": 15
  }
}
```

---

## 6. 部署架构

### 6.1 部署环境

```
                    ┌─────────────┐
                    │   用户请求   │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  CDN/边缘   │
                    │  静态资源   │
                    └──────┬──────┘
                           │
                           ▼
┌──────────────────────────────────────────────┐
│               云服务器集群                      │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│  │  Nginx  │  │  Nginx  │  │  Nginx  │       │
│  │  LB     │  │  LB     │  │  LB     │       │
│  └────┬────┘  └────┬────┘  └────┬────┘       │
│       │            │            │             │
│  ┌────▼────────────▼────────────▼────┐       │
│  │         Game Server               │       │
│  │    (Go 多实例，无状态)               │       │
│  └─────────────────┬─────────────────┘       │
│                    │                          │
│       ┌────────────┼────────────┐            │
│       │            │            │            │
│  ┌────▼────┐  ┌────▼────┐  ┌────▼────┐      │
│  │PostgreSQL│  │PostgreSQL│  │  Redis  │      │
│  │  Master │  │  Slave  │  │  Cluster│      │
│  └─────────┘  └─────────┘  └─────────┘      │
└──────────────────────────────────────────────┘
```

### 6.2 配置管理

```yaml
# config.yaml
server:
  port: 8080
  read_timeout: 30s
  write_timeout: 30s

database:
  host: localhost
  port: 5432
  name: game80
  user: game80
  max_open_conns: 100
  max_idle_conns: 20

redis:
  host: localhost
  port: 6379
  password: ""
  db: 0

platform:
  wechat:
    app_id: "${WECHAT_APP_ID}"
    app_secret: "${WECHAT_APP_SECRET}"
  douyin:
    app_id: "${DOUYIN_APP_ID}"
    app_secret: "${DOUYIN_APP_SECRET}"

log:
  level: info
  format: json
```

---

## 7. 安全设计

### 7.1 防作弊机制

```typescript
// 服务端验证砸墙动作
func (s *GameService) ValidateHit(ctx context.Context, req *HitRequest) error {
    // 1. 验证会话有效性
    session := s.getSession(req.SessionID)
    if session == nil {
        return ErrInvalidSession
    }

    // 2. 验证预算是否足够
    if session.RemainingBudget < HIT_COST {
        return ErrInsufficientBudget
    }

    // 3. 验证积木块是否存在于当前关卡
    if !session.Level.HasBlock(req.BlockID) {
        return ErrInvalidBlock
    }

    // 4. 验证道具使用合法性
    if req.ItemUsed != nil {
        if err := s.validateItemUsage(ctx, session.UserID, req.ItemUsed); err != nil {
            return err
        }
    }

    // 5. 频率限制 (防止脚本快速点击)
    if !s.rateLimiter.Allow(session.UserID) {
        return ErrRateLimited
    }

    return nil
}
```

### 7.2 数据加密

- 用户敏感信息 AES 加密存储
- API 通信 HTTPS 加密
- Redis 敏感数据加密

---

## 8. 监控与日志

### 8.1 关键指标

```go
// Prometheus 指标
- http_requests_total{endpoint, method, status}
- http_request_duration_seconds{endpoint}
- game_hit_total{level_id, item_id}
- game_complete_total{level_id, is_success}
- active_users{platform}
- db_connection_pool{state}
- redis_operation_duration_seconds{command}
```

### 8.2 日志规范

```json
{
  "timestamp": "2026-03-07T10:00:00Z",
  "level": "info",
  "service": "game-service",
  "trace_id": "abc123xyz",
  "user_id": "12345",
  "action": "game.hit",
  "data": {
    "level_id": 5,
    "block_id": "block_2_3",
    "remaining_budget": 840
  }
}
```

---

## 9. 扩展性考虑

### 9.1 横向扩展

- 无状态服务设计，支持水平扩容
- Redis Cluster 支持数据分片
- PostgreSQL 读写分离

### 9.2 新功能扩展

- 道具系统采用插件化设计
- 关卡配置数据化，支持热更新
- 活动系统独立模块

---

*文档版本：v1.0*
*最后更新：2026-03-07*

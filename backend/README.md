# 八十！八十！后端服务

基于 Golang + Gin 的后端服务，为「八十！八十！」游戏提供数据存储、排行榜、商店等功能。

## 技术栈

- **语言**: Golang 1.21+
- **框架**: Gin
- **数据库**: PostgreSQL
- **缓存**: Redis
- **认证**: JWT

## 目录结构

```
backend/
├── cmd/
│   └── server/
│       └── main.go          # 程序入口
├── internal/
│   ├── config/              # 配置管理
│   ├── handlers/            # HTTP 处理器
│   │   ├── user.go          # 用户相关
│   │   ├── game.go          # 游戏相关
│   │   ├── leaderboard.go   # 排行榜相关
│   │   └── shop.go          # 商店相关
│   ├── middleware/          # 中间件
│   │   └── auth.go          # 鉴权中间件
│   ├── models/              # 数据模型
│   └── repository/          # 数据访问层
├── pkg/
│   ├── database/            # 数据库连接
│   └── logger/              # 日志工具
├── migrations/              # 数据库迁移
│   └── 001_init.sql
├── scripts/                 # 脚本
├── go.mod
├── go.sum
├── Makefile
└── .env.example
```

## 快速开始

### 前置要求

- Go 1.21+
- PostgreSQL 14+
- Redis 6+

### 安装依赖

```bash
go mod download
```

### 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，配置数据库连接
```

### 数据库迁移

```bash
make migrate
# 或者手动执行
psql $DATABASE_URL -f migrations/001_init.sql
```

### 运行服务

```bash
make run
# 或者
go run ./cmd/server
```

服务启动在 http://localhost:8080

### 构建

```bash
make build
```

## API 接口

### 用户相关

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| POST | /api/v1/user/login | 用户登录 | ❌ |
| GET | /api/v1/user/profile | 获取用户信息 | ✅ |
| PUT | /api/v1/user/region | 更新用户地区 | ✅ |

### 游戏相关

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| POST | /api/v1/game/start | 开始关卡 | ✅ |
| POST | /api/v1/game/hit | 砸墙动作 | ✅ |
| POST | /api/v1/game/complete | 完成关卡 | ✅ |
| GET | /api/v1/game/progress | 获取进度 | ✅ |

### 排行榜相关

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | /api/v1/leaderboard/region | 区域排行榜 | ❌ |
| GET | /api/v1/leaderboard/global/level | 通关数排行 | ❌ |
| GET | /api/v1/leaderboard/global/money | 私房钱排行 | ❌ |

### 商店相关

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | /api/v1/shop/items | 道具列表 | ❌ |
| POST | /api/v1/shop/buy | 购买道具 | ✅ |
| GET | /api/v1/shop/inventory | 道具库存 | ✅ |

## API 响应格式

### 成功响应

```json
{
  "code": 0,
  "message": "success",
  "data": { ... }
}
```

### 错误响应

```json
{
  "code": 10001,
  "message": "错误描述",
  "data": null
}
```

## 错误码

| 错误码 | 描述 |
|--------|------|
| 0 | 成功 |
| 10001 | 请求参数错误 |
| 10002 | 认证失败 |
| 10003 | 无权访问 |
| 10004 | 资源不存在 |
| 20001 | 数据库错误 |
| 20002 | Redis 错误 |

## 开发

### 运行测试

```bash
make test
```

### 代码格式化

```bash
make fmt
```

### 代码检查

```bash
make vet
```

## Docker 部署

### 构建镜像

```bash
make docker
```

### 运行容器

```bash
docker-compose up -d
```

## 许可证

MIT

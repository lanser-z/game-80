-- 八十！八十！数据库初始化脚本

-- 用户表
CREATE TABLE IF NOT EXISTS users (
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
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_platform_open_id ON users(platform, open_id);
CREATE INDEX IF NOT EXISTS idx_region ON users(region);
CREATE INDEX IF NOT EXISTS idx_total_money ON users(total_money);
CREATE INDEX IF NOT EXISTS idx_max_level ON users(max_level);

-- 游戏记录表
CREATE TABLE IF NOT EXISTS game_logs (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    level_id        INT NOT NULL,
    budget_initial  INT NOT NULL,            -- 初始预算
    budget_used     INT NOT NULL,            -- 已用预算
    is_success      BOOLEAN DEFAULT FALSE,   -- 是否成功
    block_hits      JSONB,                   -- 每块积木的砸击次数 {"block_id": hits}
    items_used      JSONB,                   -- 使用的道具 [{"item_id": "hammer", "count": 1}]
    duration_sec    INT,                     -- 耗时 (秒)
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_level ON game_logs(user_id, level_id);
CREATE INDEX IF NOT EXISTS idx_created_at ON game_logs(created_at);

-- 道具库存表
CREATE TABLE IF NOT EXISTS inventories (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    item_id         VARCHAR(32) NOT NULL,    -- 道具 ID
    quantity        INT NOT NULL DEFAULT 0,
    updated_at      TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT uk_user_item UNIQUE (user_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_user_id ON inventories(user_id);

-- 关卡配置表
CREATE TABLE IF NOT EXISTS levels (
    id              INT PRIMARY KEY,
    level_data      JSONB NOT NULL,          -- 关卡布局数据
    budget_limit    INT NOT NULL,            -- 预算限制
    difficulty      VARCHAR(20),             -- easy/normal/hard/expert
    wall_config     JSONB,                   -- 墙体配置
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 排行榜缓存表（持久化备份，实际查询使用 Redis）
CREATE TABLE IF NOT EXISTS leaderboards (
    user_id         BIGINT PRIMARY KEY,
    total_money     BIGINT DEFAULT 0,
    max_level       INT DEFAULT 0,
    region          VARCHAR(50),
    region_rank     INT,                     -- 区域内排名
    global_rank     INT,                     -- 全局排名
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_region_rank ON leaderboards(region, region_rank);
CREATE INDEX IF NOT EXISTS idx_global_rank ON leaderboards(global_rank);

-- 插入初始关卡数据
INSERT INTO levels (id, level_data, budget_limit, difficulty, wall_config, created_at)
VALUES
    (1, '{"width": 3, "height": 3, "blocks": []}', 1000, 'easy', '{"blockSize": 40, "supportY": 500}', NOW()),
    (2, '{"width": 4, "height": 4, "blocks": []}', 1000, 'easy', '{"blockSize": 40, "supportY": 500}', NOW()),
    (3, '{"width": 5, "height": 5, "blocks": []}', 1000, 'normal', '{"blockSize": 40, "supportY": 500}', NOW()),
    (4, '{"width": 5, "height": 5, "blocks": []}', 1000, 'normal', '{"blockSize": 40, "supportY": 500}', NOW()),
    (5, '{"width": 6, "height": 5, "blocks": []}', 1000, 'normal', '{"blockSize": 40, "supportY": 500}', NOW())
ON CONFLICT (id) DO NOTHING;

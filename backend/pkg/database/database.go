package database

import (
	"database/sql"
	"fmt"
	"sync"

	"github.com/go-redis/redis/v8"
	_ "github.com/lib/pq"
)

var (
	db      *sql.DB
	redisClient *redis.Client
	once    sync.Once
)

// Init 初始化数据库连接
func Init(dataSourceName string) error {
	var err error
	once.Do(func() {
		db, err = sql.Open("postgres", dataSourceName)
		if err != nil {
			return
		}
		if err = db.Ping(); err != nil {
			return
		}
		db.SetMaxOpenConns(100)
		db.SetMaxIdleConns(20)
	})
	return err
}

// Close 关闭数据库连接
func Close() {
	if db != nil {
		db.Close()
	}
	if redisClient != nil {
		redisClient.Close()
	}
}

// GetDB 获取数据库连接
func GetDB() *sql.DB {
	return db
}

// InitRedis 初始化 Redis 客户端
func InitRedis(redisURL string) error {
	opt, err := redis.ParseURL(redisURL)
	if err != nil {
		// 使用简单格式
		redisClient = redis.NewClient(&redis.Options{
			Addr: redisURL,
		})
	} else {
		redisClient = redis.NewClient(opt)
	}

	_, err = redisClient.Ping(redisClient.Context()).Result()
	return err
}

// GetRedis 获取 Redis 客户端
func GetRedis() *redis.Client {
	return redisClient
}

// InitTestDB 初始化测试数据库连接
func InitTestDB() error {
	dataSourceName := "postgres://localhost:5432/game80_test?sslmode=disable"
	return Init(dataSourceName)
}

// GetDSN 获取数据库连接字符串
func GetDSN() string {
	return "postgres://localhost:5432/game80?sslmode=disable"
}

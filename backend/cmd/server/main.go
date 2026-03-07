package main

import (
	"log"
	"os"

	"game-80-backend/internal/config"
	"game-80-backend/internal/handlers"
	"game-80-backend/internal/middleware"
	"game-80-backend/pkg/database"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// 加载环境变量
	if err := godotenv.Load(); err != nil {
		log.Println("未找到.env 文件，使用默认配置")
	}

	// 加载配置
	cfg := config.Load()

	// 初始化数据库
	if err := database.Init(cfg.DatabaseURL); err != nil {
		log.Fatalf("数据库初始化失败：%v", err)
	}
	defer database.Close()

	// 初始化 Redis
	if err := database.InitRedis(cfg.RedisURL); err != nil {
		log.Fatalf("Redis 初始化失败：%v", err)
	}

	// 创建 Gin 路由
	r := gin.Default()

	// 全局中间件
	r.Use(middleware.CORS())
	r.Use(middleware.Logger())

	// 健康检查
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// API v1 路由
	v1 := r.Group("/api/v1")
	{
		// 用户相关
		user := v1.Group("/user")
		{
			user.POST("/login", handlers.UserLogin)
			user.GET("/profile", middleware.Auth(), handlers.GetUserProfile)
			user.PUT("/region", middleware.Auth(), handlers.UpdateUserRegion)
		}

		// 游戏相关
		game := v1.Group("/game")
		{
			game.POST("/start", middleware.Auth(), handlers.StartGame)
			game.POST("/hit", middleware.Auth(), handlers.HitBlock)
			game.POST("/complete", middleware.Auth(), handlers.CompleteLevel)
			game.GET("/progress", middleware.Auth(), handlers.GetGameProgress)
		}

		// 排行榜相关
		leaderboard := v1.Group("/leaderboard")
		{
			leaderboard.GET("/region", handlers.GetRegionLeaderboard)
			leaderboard.GET("/global/level", handlers.GetGlobalLevelLeaderboard)
			leaderboard.GET("/global/money", handlers.GetGlobalMoneyLeaderboard)
		}

		// 商店相关
		shop := v1.Group("/shop")
		{
			shop.GET("/items", handlers.GetShopItems)
			shop.POST("/buy", middleware.Auth(), handlers.BuyItem)
			shop.GET("/inventory", middleware.Auth(), GetUserInventory)
		}
	}

	// 启动服务器
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("服务器启动在端口 %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("服务器启动失败：%v", err)
	}
}

// GetUserInventory 获取用户道具库存
func GetUserInventory(c *gin.Context) {
	// TODO: 实现
	c.JSON(200, gin.H{"inventory": []interface{}{}})
}

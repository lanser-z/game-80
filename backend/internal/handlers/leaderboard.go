package handlers

import (
	"net/http"

	"game-80-backend/pkg/database"

	"github.com/gin-gonic/gin"
)

// GetRegionLeaderboard 获取区域排行榜
func GetRegionLeaderboard(c *gin.Context) {
	region := c.DefaultQuery("region", "all")
	limit := c.DefaultQuery("limit", "100")

	redisClient := database.GetRedis()
	ctx := c.Request.Context()

	// 从 Redis Sorted Set 获取排行榜
	var key string
	if region == "all" {
		key = "leaderboard:global:money"
	} else {
		key = "leaderboard:region:" + region + ":money"
	}

	result, err := redisClient.ZRevRangeWithScores(ctx, key, 0, 100).Result()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取排行榜失败"})
		return
	}

	// 格式化结果
	type RankItem struct {
		Rank       int    `json:"rank"`
		UserID     int64  `json:"user_id"`
		TotalMoney int64  `json:"total_money"`
		Nickname   string `json:"nickname,omitempty"`
	}

	rankings := make([]RankItem, 0, len(result))
	for i, item := range result {
		rankings = append(rankings, RankItem{
			Rank:       i + 1,
			UserID:     int64(item.Member.(float64)),
			TotalMoney: int64(item.Score),
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "success",
		"data": gin.H{
			"region":   region,
			"rankings": rankings,
		},
	})
}

// GetGlobalLevelLeaderboard 获取全局通关数排行榜
func GetGlobalLevelLeaderboard(c *gin.Context) {
	redisClient := database.GetRedis()
	ctx := c.Request.Context()

	result, err := redisClient.ZRevRangeWithScores(ctx, "leaderboard:global:level", 0, 100).Result()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取排行榜失败"})
		return
	}

	type RankItem struct {
		Rank     int   `json:"rank"`
		UserID   int64 `json:"user_id"`
		MaxLevel int   `json:"max_level"`
	}

	rankings := make([]RankItem, 0, len(result))
	for i, item := range result {
		rankings = append(rankings, RankItem{
			Rank:     i + 1,
			UserID:   int64(item.Member.(float64)),
			MaxLevel: int(item.Score),
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "success",
		"data": gin.H{
			"rankings": rankings,
		},
	})
}

// GetGlobalMoneyLeaderboard 获取全局私房钱排行榜
func GetGlobalMoneyLeaderboard(c *gin.Context) {
	redisClient := database.GetRedis()
	ctx := c.Request.Context()

	result, err := redisClient.ZRevRangeWithScores(ctx, "leaderboard:global:money", 0, 100).Result()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取排行榜失败"})
		return
	}

	type RankItem struct {
		Rank       int   `json:"rank"`
		UserID   int64 `json:"user_id"`
		TotalMoney int64 `json:"total_money"`
	}

	rankings := make([]RankItem, 0, len(result))
	for i, item := range result {
		rankings = append(rankings, RankItem{
			Rank:       i + 1,
			UserID:     int64(item.Member.(float64)),
			TotalMoney: int64(item.Score),
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "success",
		"data": gin.H{
			"rankings": rankings,
		},
	})
}

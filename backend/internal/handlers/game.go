package handlers

import (
	"database/sql"
	"fmt"
	"net/http"
	"time"

	"game-80-backend/pkg/database"

	"github.com/gin-gonic/gin"
)

// StartGameRequest 开始游戏请求
type StartGameRequest struct {
	LevelID int `json:"level_id" binding:"required"`
}

// StartGame 开始关卡
func StartGame(c *gin.Context) {
	userID, _ := c.Get("user_id")
	var req StartGameRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}

	db := database.GetDB()

	// 获取关卡配置
	var budget int
	var wallConfig string
	err := db.QueryRow(`SELECT budget_limit, level_data FROM levels WHERE id = $1`, req.LevelID).
		Scan(&budget, &wallConfig)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "关卡不存在"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "数据库错误"})
		return
	}

	// 创建游戏会话
	sessionID := generateSessionID()

	// 将会话存储到 Redis
	redisClient := database.GetRedis()
	sessionData := map[string]interface{}{
		"user_id":      userID,
		"level_id":     req.LevelID,
		"budget":       budget,
		"start_time":   time.Now().Unix(),
		"block_hits":   map[string]int{},
		"items_used":   []interface{}{},
	}

	err = redisClient.Set(c, "game_session:"+sessionID, sessionData, 30*time.Minute).Err()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "会话创建失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "success",
		"data": gin.H{
			"session_id": sessionID,
			"level_id":   req.LevelID,
			"budget":     budget,
			"wall_config": wallConfig,
		},
	})
}

// HitBlockRequest 砸墙请求
type HitBlockRequest struct {
	SessionID string `json:"session_id" binding:"required"`
	BlockID   string `json:"block_id" binding:"required"`
	ItemUsed  *struct {
		ItemID string `json:"item_id"`
		Count  int    `json:"count"`
	} `json:"item_used"`
}

// HitBlock 砸墙
func HitBlock(c *gin.Context) {
	userID, _ := c.Get("user_id")
	var req HitBlockRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}

	// 从 Redis 获取会话
	redisClient := database.GetRedis()
	sessionKey := "game_session:" + req.SessionID

	var sessionData map[string]interface{}
	err := redisClient.Get(c, sessionKey).Scan(&sessionData)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "会话不存在"})
		return
	}

	// 验证会话属于当前用户
	if int64(sessionData["user_id"].(float64)) != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "无权操作此会话"})
		return
	}

	// 检查预算
	budget := int(sessionData["budget"].(float64))
	if budget < 80 {
		c.JSON(http.StatusOK, gin.H{
			"code":    0,
			"message": "预算不足",
			"data": gin.H{
				"remaining_budget": budget,
				"can_hit":          false,
			},
		})
		return
	}

	// 更新预算
	sessionData["budget"] = budget - 80

	// 记录砸击
	blockHits := sessionData["block_hits"].(map[string]interface{})
	if hitCount, ok := blockHits[req.BlockID]; ok {
		blockHits[req.BlockID] = int(hitCount.(float64)) + 1
	} else {
		blockHits[req.BlockID] = 1
	}

	// 保存到 Redis
	err = redisClient.Set(c, sessionKey, sessionData, 30*time.Minute).Err()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "会话更新失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "success",
		"data": gin.H{
			"remaining_budget": budget - 80,
			"can_hit":          true,
		},
	})
}

// CompleteLevelRequest 完成关卡请求
type CompleteLevelRequest struct {
	SessionID  string `json:"session_id" binding:"required"`
	IsSuccess  bool   `json:"is_success" binding:"required"`
	RemainingBudget int `json:"remaining_budget"`
}

// CompleteLevel 完成关卡
func CompleteLevel(c *gin.Context) {
	userID, _ := c.Get("user_id")
	var req CompleteLevelRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}

	// 从 Redis 获取会话
	redisClient := database.GetRedis()
	sessionKey := "game_session:" + req.SessionID

	var sessionData map[string]interface{}
	err := redisClient.Get(c, sessionKey).Scan(&sessionData)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "会话不存在"})
		return
	}

	levelID := int(sessionData["level_id"].(float64))

	db := database.GetDB()

	if req.IsSuccess {
		// 更新用户总私房钱和最高关卡
		remainingBudget := req.RemainingBudget
		_, err := db.Exec(`
			UPDATE users
			SET total_money = total_money + $1,
			    max_level = GREATEST(max_level, $2),
			    updated_at = NOW()
			WHERE id = $3
		`, remainingBudget, levelID+1, userID)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "更新用户数据失败"})
			return
		}

		// 记录关卡完成
		_, err = db.Exec(`
			INSERT INTO game_logs (user_id, level_id, budget_initial, budget_used, is_success, created_at)
			VALUES ($1, $2, $3, $4, true, NOW())
		`, userID, levelID, sessionData["budget"], int(sessionData["budget"].(float64))-remainingBudget)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "记录游戏日志失败"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"code":    0,
			"message": "success",
			"data": gin.H{
				"remaining_budget": remainingBudget,
				"money_added":      remainingBudget,
				"new_level_unlocked": levelID + 1,
			},
		})
	} else {
		// 记录失败
		_, err = db.Exec(`
			INSERT INTO game_logs (user_id, level_id, budget_initial, budget_used, is_success, created_at)
			VALUES ($1, $2, $3, $4, false, NOW())
		`, userID, levelID, sessionData["budget"], int(sessionData["budget"].(float64)))

		c.JSON(http.StatusOK, gin.H{
			"code":    0,
			"message": "success",
			"data": gin.H{
				"is_success": false,
			},
		})
	}

	// 删除会话
	redisClient.Del(c, sessionKey)
}

// GetGameProgress 获取游戏进度
func GetGameProgress(c *gin.Context) {
	userID, _ := c.Get("user_id")
	db := database.GetDB()

	var totalMoney int64
	var maxLevel int

	err := db.QueryRow(`SELECT total_money, max_level FROM users WHERE id = $1`, userID).
		Scan(&totalMoney, &maxLevel)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "用户不存在"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "数据库错误"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "success",
		"data": gin.H{
			"total_money":    totalMoney,
			"max_level":      maxLevel,
			"unlocked_levels": maxLevel,
		},
	})
}

func generateSessionID() string {
	return fmt.Sprintf("%d", time.Now().UnixNano())
}

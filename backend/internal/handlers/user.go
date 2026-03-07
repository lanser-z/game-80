package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"

	"game-80-backend/internal/middleware"
	"game-80-backend/pkg/database"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

// UserLogin 用户登录请求
type UserLoginRequest struct {
	Platform string `json:"platform" binding:"required"` // wechat/douyin/alipay/web
	Code     string `json:"code"`                        // 平台登录 code
	OpenID   string `json:"openid"`                      // 平台用户 ID
}

// UserLogin 用户登录
func UserLogin(c *gin.Context) {
	var req UserLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}

	// 验证平台
	validPlatforms := map[string]bool{"wechat": true, "douyin": true, "alipay": true, "web": true}
	if !validPlatforms[req.Platform] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "不支持的平台"})
		return
	}

	// 对于 web 平台，生成一个临时 openId
	if req.Platform == "web" && req.OpenID == "" {
		req.OpenID = "web_" + time.Now().Format("20060102150405")
	}

	// TODO: 对于真实平台，应该调用平台 API 验证 code 并获取 openId
	// 这里简化处理，直接使用 openId

	// 查询或创建用户
	db := database.GetDB()
	var userID int64
	var totalMoney int64
	var maxLevel int

	err := db.QueryRow(`
		INSERT INTO users (platform, open_id, created_at, updated_at)
		VALUES ($1, $2, NOW(), NOW())
		ON CONFLICT (platform, open_id) DO UPDATE SET updated_at = NOW()
		RETURNING id, total_money, max_level
	`, req.Platform, req.OpenID).Scan(&userID, &totalMoney, &maxLevel)

	if err != nil && err != sql.ErrNoRows {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "数据库错误"})
		return
	}

	// 生成 token
	token, err := middleware.GenerateToken(userID, req.Platform)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "token 生成失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "success",
		"data": gin.H{
			"user_id":      userID,
			"total_money":  totalMoney,
			"max_level":    maxLevel,
			"token":        token,
			"platform":     req.Platform,
		},
	})
}

// GetUserProfile 获取用户信息
func GetUserProfile(c *gin.Context) {
	userID, _ := c.Get("user_id")
	db := database.GetDB()

	var totalMoney int64
	var maxLevel int
	var region sql.NullString

	err := db.QueryRow(`
		SELECT total_money, max_level, region FROM users WHERE id = $1
	`, userID).Scan(&totalMoney, &maxLevel, &region)

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
			"user_id":     userID,
			"total_money": totalMoney,
			"max_level":   maxLevel,
			"region":      region.String,
		},
	})
}

// UpdateUserRegion 更新用户地区
func UpdateUserRegion(c *gin.Context) {
	userID, _ := c.Get("user_id")
	var req struct {
		Region string `json:"region" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}

	db := database.GetDB()
	_, err := db.Exec(`UPDATE users SET region = $1, updated_at = NOW() WHERE id = $2`, req.Region, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "数据库错误"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": 0, "message": "success"})
}

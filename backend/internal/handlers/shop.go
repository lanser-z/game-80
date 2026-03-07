package handlers

import (
	"database/sql"
	"net/http"

	"game-80-backend/pkg/database"

	"github.com/gin-gonic/gin"
)

// ShopItem 商店道具
type ShopItem struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Price       int    `json:"price"`
	Effect      string `json:"effect"`
}

// GetShopItems 获取商店道具列表
func GetShopItems(c *gin.Context) {
	items := []ShopItem{
		{
			ID:          "hammer",
			Name:        "大力锤",
			Description: "砸 1 下抵 1.5 下效果",
			Price:       200,
			Effect:      "damage_multiplier:1.5",
		},
		{
			ID:          "gravity_lens",
			Name:        "重心分析镜",
			Description: "标注重心点辅助分析",
			Price:       150,
			Effect:      "show_gravity:true",
		},
		{
			ID:          "worm",
			Name:        "蛀虫",
			Description: "使目标积木硬度降级",
			Price:       100,
			Effect:      "reduce_health:1",
		},
		{
			ID:          "budget_pack",
			Name:        "预算补充包",
			Description: "增加 200 元预算",
			Price:       300,
			Effect:      "add_budget:200",
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "success",
		"data": gin.H{
			"items": items,
		},
	})
}

// BuyItemRequest 购买道具请求
type BuyItemRequest struct {
	ItemID   string `json:"item_id" binding:"required"`
	Quantity int    `json:"quantity" binding:"min=1"`
}

// BuyItem 购买道具
func BuyItem(c *gin.Context) {
	userID, _ := c.Get("user_id")
	var req BuyItemRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}

	// 获取道具价格
	itemPrices := map[string]int{
		"hammer":       200,
		"gravity_lens": 150,
		"worm":         100,
		"budget_pack":  300,
	}

	price, ok := itemPrices[req.ItemID]
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "不支持的道具"})
		return
	}

	totalPrice := price * req.Quantity

	db := database.GetDB()

	// 检查用户私房钱是否足够
	var totalMoney int64
	err := db.QueryRow(`SELECT total_money FROM users WHERE id = $1`, userID).Scan(&totalMoney)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "用户不存在"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "数据库错误"})
		return
	}

	if totalMoney < int64(totalPrice) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":          "私房钱不足",
			"total_money":    totalMoney,
			"need":           totalPrice,
		})
		return
	}

	// 扣除私房钱
	_, err = db.Exec(`UPDATE users SET total_money = total_money - $1, updated_at = NOW() WHERE id = $2`, totalPrice, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "扣除私房钱失败"})
		return
	}

	// 添加到库存
	_, err = db.Exec(`
		INSERT INTO inventories (user_id, item_id, quantity, updated_at)
		VALUES ($1, $2, $3, NOW())
		ON CONFLICT (user_id, item_id) DO UPDATE SET quantity = inventories.quantity + $3, updated_at = NOW()
	`, userID, req.ItemID, req.Quantity)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "添加库存失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "success",
		"data": gin.H{
			"item_id":        req.ItemID,
			"quantity":       req.Quantity,
			"total_price":    totalPrice,
			"remaining_money": totalMoney - int64(totalPrice),
		},
	})
}

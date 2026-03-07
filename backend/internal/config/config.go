package config

import (
	"os"
)

// Config 应用配置
type Config struct {
	DatabaseURL string
	RedisURL    string
	JWTSecret   string
	ServerPort  string
}

// Load 加载配置
func Load() *Config {
	return &Config{
		DatabaseURL: getEnv("DATABASE_URL", "postgres://localhost:5432/game80?sslmode=disable"),
		RedisURL:    getEnv("REDIS_URL", "localhost:6379"),
		JWTSecret:   getEnv("JWT_SECRET", "game80-secret-key"),
		ServerPort:  getEnv("PORT", "8080"),
	}
}

func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

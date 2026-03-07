.PHONY: build run test clean migrate docker

# 构建
build:
	go build -o bin/server ./cmd/server

# 运行
run:
	go run ./cmd/server

# 测试
test:
	go test -v ./...

# 测试覆盖
test-coverage:
	go test -v -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html

# 清理
clean:
	rm -rf bin/
	rm -f coverage.out coverage.html

# 数据库迁移
migrate:
	psql $(DATABASE_URL) -f migrations/001_init.sql

# 下载依赖
deps:
	go mod download

# 代码格式化
fmt:
	go fmt ./...

# 代码检查
vet:
	go vet ./...

# 完整构建
all: fmt vet build test

# Docker 构建
docker:
	docker build -t game80-backend:latest .

# 开发环境运行（依赖 Docker）
docker-run:
	docker-compose up -d

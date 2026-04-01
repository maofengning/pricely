# T0-02: Docker开发环境配置

## Goal
配置本地开发环境 Docker compose，实现一键启动所有服务。

## Requirements
- PostgreSQL 数据库服务
- Redis 缓存服务
- 后端 API 服务 (FastAPI)
- 前端开发服务器 (Vite)
- Makefile 包含常用命令

## Acceptance Criteria
- [ ] docker-compose.yml 配置完整
- [ ] 所有服务可通过 `make up` 一键启动
- [ ] `make down` 停止所有服务
- [ ] `make logs` 查看服务日志
- [ ] 数据库和 Redis 数据持久化配置
- [ ] 前后端服务代码变更自动热重载

## Technical Notes
- 使用 Docker Compose v3 格式
- PostgreSQL 15
- Redis 7
- 后端 Python 3.11
- 前端 Node 18
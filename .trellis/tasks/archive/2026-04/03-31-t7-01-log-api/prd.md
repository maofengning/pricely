# T7-01: 交易日志 - 后端 API

## Goal
实现交易日志 CRUD API，支持多条件筛选和标签数组存储。

## Requirements

### API Endpoints
- POST /logs — 创建交易日志
- GET /logs — 查询日志列表（支持筛选）
- GET /logs/{id} — 查询日志详情
- PUT /logs/{id} — 更新日志
- DELETE /logs/{id} — 删除日志

### Filtering Support
- tags (数组标签筛选)
- stock_code (股票代码筛选)
- 时间范围 (start_time, end_time)

### Data Model
- trade_logs 表：
  - id, user_id, stock_code, title, content
  - tags (PostgreSQL ARRAY 类型)
  - created_at, updated_at

## Acceptance Criteria
- [ ] 所有 CRUD API 通过测试
- [ ] 支持多条件筛选（tags, stock_code, 时间范围）
- [ ] 标签数组正确存储和查询
- [ ] lint/typecheck 通过

## Technical Notes
- 依赖 T0-03 (db-schema) 的 trade_logs 表
- 使用 FastAPI + SQLAlchemy
- PostgreSQL ARRAY 类型处理
- 遵循 backend/database-guidelines.md 和 backend/error-handling.md

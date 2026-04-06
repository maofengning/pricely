# T5-01: 形态标注-后端API

## Goal
实现形态标注 CRUD API，支持7种图表形态类型的标注管理。

## Requirements
- 支持7种形态类型：
  - 头肩顶 (HeadAndShouldersTop)
  - 头肩底 (HeadAndShouldersBottom)
  - 双顶 (DoubleTop)
  - 双底 (DoubleBottom)
  - 三重顶 (TripleTop)
  - 三重底 (TripleBottom)
  - 三角形 (Triangle)
  - 旗形 (Flag)
- CRUD API：
  - POST /api/patterns - 创建形态标注
  - GET /api/patterns - 查询形态标注列表（按周期过滤）
  - GET /api/patterns/:id - 获取单个形态标注详情
  - PUT /api/patterns/:id - 更新形态标注
  - DELETE /api/patterns/:id - 删除形态标注
- 形态标注数据：形态类型、周期、时间范围、价格范围、关键点坐标

## Acceptance Criteria
- [ ] Pattern 模型定义完整（字段、关系）
- [ ] POST API 正确创建形态标注
- [ ] GET API 正确查询形态标注（支持周期过滤）
- [ ] PUT API 正确更新形态标注
- [ ] DELETE API 正确删除形态标注
- [ ] 数据验证完整（形态类型、时间范围等）
- [ ] 错误处理完整

## Technical Notes
- 数据库 schema 参考 T0-03 完成的设计
- 使用 SQLite + Prisma ORM
- 遵循 backend/error-handling.md 错误处理规范
- 遵循 backend/database-guidelines.md 数据库操作规范
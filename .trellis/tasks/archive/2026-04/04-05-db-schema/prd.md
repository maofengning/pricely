# Database Schema Design

## Goal
设计并实现 Pricely MVP 数据库 schema，包含所有核心业务表。

## Requirements

### 需要创建的表
1. **Position** - 持仓表 (user_id, stock_code, quantity, avg_price, created_at)
2. **Order** - 订单表 (user_id, stock_code, order_type, order_mode, limit_price, quantity, filled_price, filled_at, status)
3. **TradeReport** - 交易报表 (user_id, period_start, period_end, trade_count, win_count, loss_count, win_rate, total_profit, total_loss)
4. **TradeLog** - 交易日志 (user_id, stock_code, action, quantity, price, notes, tags, created_at)
5. **PatternMark** - 形态标注 (user_id, stock_code, period, pattern_type, start_time, end_time, direction, notes)
6. **SRLevel** - 支撑阻力位 (user_id, stock_code, period, level_type, price, strength, is_ai_detected)
7. **IntLevel** - 整数关口 (stock_code, period, price_level, importance)
8. **Kline** - K线数据 (stock_code, period, time, open, high, low, close, volume)

### 技术约束
- 使用 SQLAlchemy 2.x async style
- UUID 主键
- snake_case 表名和列名
- 复合索引使用 Index 对象
- 外键使用 ondelete="CASCADE"

## Acceptance Criteria
- [ ] 所有表模型定义完成，遵循 database-guidelines.md
- [ ] Alembic migration 文件生成
- [ ] 模型关系正确配置 (User -> Position, Order, etc.)
- [ ] 复合索引正确定义
- [ ] lint 和 typecheck 通过

## Technical Notes
- 参考 backend/app/models/user.py 的 User/Fund 模型结构
- 枚举类型定义在 backend/app/models/enums.py
- 使用 `backend/app/core/database.py` 的 Base
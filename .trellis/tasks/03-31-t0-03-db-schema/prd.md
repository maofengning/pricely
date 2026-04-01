# T0-03: 数据库Schema初始化

## Goal
创建所有数据库表结构和 SQLAlchemy ORM 模型。

## Requirements
- 用户表 (users): 用户认证信息
- 股票列表表 (stocks): 股票基本信息
- K线数据表 (klines): 历史K线数据
- 交易记录表 (trades): 模拟交易记录
- 交易日志表 (trade_logs): 用户交易日志
- 形态标注表 (patterns): 形态标注数据
- 支撑阻力标注表 (sr_levels): 支撑阻力位标注

## Acceptance Criteria
- [ ] 所有表结构定义完整
- [ ] SQLAlchemy ORM 模型创建
- [ ] migrations 目录结构创建
- [ ] 表关系和外键正确配置
- [ ] 索引配置合理
- [ ] 类型注解完整

## Technical Notes
- 使用 SQLAlchemy 2.0 ORM
- 主键使用 UUID 或自增整数
- 时间字段使用 UTC
- 外键关系清晰
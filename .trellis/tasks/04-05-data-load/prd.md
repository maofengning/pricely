# Data Load Implementation

## Goal
实现历史行情数据加载功能，从 CSV/JSON 文件加载 K 线数据到数据库。

## Requirements

### 功能需求
1. 支持从 `backend/data/klines/` 目录读取 CSV 文件
2. CSV 格式: stock_code, period, time, open, high, low, close, volume
3. 支持多周期数据导入 (1min, 5min, 15min, 30min, 1h, 1d)
4. 数据校验: 时间戳格式、价格范围、去重处理
5. 提供 CLI 呥具和 API 端点两种方式

### 技术约束
- 使用 async SQLAlchemy session
- 批量插入优化 (bulk insert)
- 进度日志记录
- 错误处理遵循 error-handling.md

## Acceptance Criteria
- [ ] data_loader.py 支持批量 K 线导入
- [ ] 数据校验逻辑完整
- [ ] 去重处理正确
- [ ] CLI 工具可用: `python -m app.utils.data_loader --load`
- [ ] lint 和 typecheck 通过

## Technical Notes
- 参考 backend/app/utils/data_loader.py 现有实现
- 数据目录: backend/data/klines/*.csv
- 股票列表: backend/data/stocks.json
# Market API Implementation

## Goal
实现行情 API，提供历史 K 线数据和股票列表查询接口。

## Requirements

### 功能需求
1. **股票列表** `GET /market/stocks` - 返回可用股票列表
2. **K线数据** `GET /market/klines` - 查询指定股票、周期的 K 线数据
   - 参数: stock_code, period, start_time, end_time
3. **股票详情** `GET /market/stocks/{code}` - 返回股票基本信息

### 技术约束
- 使用 FastAPI + Pydantic 2
- 数据从数据库读取（Kline 表）
- 支持多周期: 1min, 5min, 15min, 30min, 1h, 1d
- 错误处理遵循 error-handling.md

## Acceptance Criteria
- [ ] /market/stocks 返回股票列表
- [ ] /market/klines 返回 K 线数据，支持分页
- [ ] /market/stocks/{code} 返回股票详情
- [ ] 错误处理符合规范
- [ ] lint 和 typecheck 通过

## Technical Notes
- 参考 backend/app/api/market.py 现有结构
- 参考 backend/app/schemas/market.py schema 定义
- 参考 backend/app/services/market_service.py 服务层
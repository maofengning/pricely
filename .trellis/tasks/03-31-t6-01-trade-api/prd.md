# T6-01: 模拟交易 - 后端 API

## Goal
实现模拟交易核心逻辑，包括下单、持仓、资金管理 API。

## Requirements

### API Endpoints
- POST /trade/order — 下单（市价/限价）
- DELETE /trade/order/{id} — 取消订单
- GET /trade/orders — 查询订单列表
- GET /trade/position — 查询当前持仓
- GET /trade/fund — 查询资金信息
- POST /trade/fund/reset — 重置模拟资金
- GET /trade/report — 查询交易报表

### Core Logic
- 市价单立即成交
- 限价单等待撮合（WebSocket 价格触发，后续 T6-02 实现）
- 持仓计算（avg_cost, profit_loss）
- 资金冻结/解冻机制

### Data Models
- orders 表：order_type (market/limit), status, price, quantity
- positions 表：stock_code, quantity, avg_cost, profit_loss
- funds 表：total, available, frozen

## Acceptance Criteria
- [ ] 市价单成交逻辑正确
- [ ] 限价单创建成功，状态为 pending
- [ ] 持仓、资金计算准确
- [ ] 所有 API 通过单元测试
- [ ] lint/typecheck 通过

## Technical Notes
- 依赖 T1-01 (auth-api) 的 JWT 认证
- 依赖 T2-01 (market-api) 的实时价格查询
- 使用 FastAPI + SQLAlchemy
- 遵循 backend/database-guidelines.md 和 backend/error-handling.md

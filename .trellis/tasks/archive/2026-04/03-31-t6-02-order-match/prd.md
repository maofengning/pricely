# T6-02: 限价单撮合引擎

## Goal
实现 WebSocket 价格触发限价单撮合逻辑。

## Requirements
- 每次 WebSocket 推送检查 pending 订单
- 买入限价单：当前价格 ≤ 限价 → 成交
- 卖出限价单：当前价格 ≥ 限价 → 成交
- 推送 order_filled 事件通知前端
- 撮合检查频率每3秒

## Acceptance Criteria
- [ ] 限价单在价格触及时自动成交
- [ ] WebSocket 推送成交通知
- [ ] 撮合检查频率正确

## Technical Notes
- 依赖 T6-01 (trade-api) 的订单模型
- 依赖 T2-01 (market-api) 的实时价格
- backend 模块，遵循 backend guidelines
